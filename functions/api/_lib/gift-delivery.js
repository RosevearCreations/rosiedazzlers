import { serviceHeaders } from "./staff-auth.js";
import { dispatchNotificationThroughProvider } from "./provider-dispatch.js";

export const GIFT_DELIVERY_DEFAULTS = {
  enabled: true,
  manual_review: false,
  automation_enabled: true,
  default_message: "Choose a recipient, add a message, and pick the day you want us to send the gift.",
  default_send_hour_local: 9,
  timezone_label: "America/Toronto",
  send_copy_to_purchaser: true
};

export async function loadGiftDeliverySettings(env) {
  const settings = { ...GIFT_DELIVERY_DEFAULTS };
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return settings;
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.gift_delivery_settings&limit=1`, {
      headers: serviceHeaders(env)
    });
    if (!res.ok) return settings;
    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;
    return { ...settings, ...(row?.value && typeof row.value === "object" ? row.value : {}) };
  } catch {
    return settings;
  }
}

export function parseGiftDeliveryContext(gift) {
  const ctx = gift && typeof gift.purchase_context === "object" && gift.purchase_context ? gift.purchase_context : {};
  const delivery = ctx.gift_delivery && typeof ctx.gift_delivery === "object" ? ctx.gift_delivery : {};
  return {
    purchase_context: ctx,
    gift_delivery: delivery,
    sender_name: String(delivery.sender_name || "").trim(),
    delivery_date: String(delivery.delivery_date || "").trim(),
    gift_message: String(delivery.gift_message || "").trim(),
    delivery_status: String(delivery.delivery_status || "").trim(),
    sent_at: String(delivery.sent_at || "").trim(),
    queued_at: String(delivery.queued_at || "").trim(),
    last_error: String(delivery.last_error || "").trim(),
    approved_at: String(delivery.approved_at || "").trim(),
    notification_event_id: String(delivery.notification_event_id || "").trim(),
    copy_notification_event_id: String(delivery.copy_notification_event_id || "").trim()
  };
}

export function isGiftDueForDelivery(gift, settings, now = new Date()) {
  const info = parseGiftDeliveryContext(gift);
  if (!settings?.enabled || settings?.automation_enabled === false) return { due: false, reason: "automation_disabled", info };
  if (!String(gift?.recipient_email || "").trim()) return { due: false, reason: "missing_recipient", info };
  if (info.delivery_status === "sent" || info.sent_at) return { due: false, reason: "already_sent", info };
  if (info.delivery_status !== "pending") return { due: false, reason: "delivery_state_requires_owner_review", info };
  if (settings.manual_review === true && !info.approved_at) return { due: false, reason: "awaiting_review", info };

  const timeZone = settings.timezone_label || GIFT_DELIVERY_DEFAULTS.timezone_label;
  const todayIso = zonedDateParts(now, timeZone).date;
  const sendHour = clampWhole(settings.default_send_hour_local, 0, 23, GIFT_DELIVERY_DEFAULTS.default_send_hour_local);
  const currentHour = zonedDateParts(now, timeZone).hour;
  const deliveryDate = info.delivery_date || todayIso;
  const dateReady = deliveryDate <= todayIso;
  const timeReady = currentHour >= sendHour;
  return {
    due: dateReady && timeReady,
    reason: dateReady ? (timeReady ? "due" : "waiting_send_hour") : "waiting_delivery_date",
    info,
    delivery_date: deliveryDate,
    send_hour: sendHour,
    time_zone: timeZone
  };
}

export async function processGiftDeliveryRow(env, gift, settings, options = {}) {
  const origin = stripTrailingSlash(env?.SITE_ORIGIN || options.origin || "https://rosiedazzlers.ca");
  const due = isGiftDueForDelivery(gift, settings, options.now || new Date());
  if (!due.due) return { ok: false, skipped: true, reason: due.reason, gift_id: gift.id };

  // Atomic PostgREST claim: only one request may move pending -> processing.
  // Unknown/legacy state and incomplete claims must remain held, never resent.
  const claimed = await claimGiftDelivery(env, gift, due.info);
  if (!claimed) return { ok: false, skipped: true, reason: "already_claimed_or_state_changed", gift_id: gift.id };
  let context = claimed;

  const basePayload = buildGiftDeliveryPayload(gift, origin, settings, due.info);
  const results = [];

  const recipientEvent = await createNotificationEvent(env, {
    event_type: "gift_scheduled_delivery_email",
    channel: "email",
    recipient_email: gift.recipient_email,
    payload: {
      template_key: "gift_scheduled_delivery",
      gift_id: gift.id,
      gift_code: gift.code,
      delivery_date: due.delivery_date,
      target: "recipient",
      ...basePayload.payload
    },
    subject: basePayload.subject,
    body_text: basePayload.body_text,
    body_html: basePayload.body_html
  });

  if (!recipientEvent.ok) {
    await updateGiftDeliveryContext(env, gift.id, context, {
      delivery_status: "failed",
      last_error: recipientEvent.error || "Could not queue gift delivery."
    });
    return { ok: false, gift_id: gift.id, error: recipientEvent.error || "Could not queue gift delivery." };
  }

  context = await updateGiftDeliveryContext(env, gift.id, context, {
    delivery_status: "processing",
    notification_event_id: recipientEvent.event.id,
    queued_at: recipientEvent.event.created_at || new Date().toISOString()
  });

  const recipientDispatch = await deliverNotificationEvent(env, recipientEvent.event);
  results.push({ target: "recipient", ...recipientDispatch, notification_event_id: recipientEvent.event.id });

  context = await updateGiftDeliveryContext(env, gift.id, context, {
    delivery_status: recipientDispatch.ok ? "sent" : "failed",
    recipient_provider_status: recipientDispatch.ok ? "accepted" : "failed",
    sent_at: recipientDispatch.ok ? new Date().toISOString() : null,
    last_error: recipientDispatch.error || null
  });
  // A failed recipient send must not produce a misleading purchaser "delivered" copy.
  if (!recipientDispatch.ok) return { ok: false, gift_id: gift.id, results };

  let copyResult = null;
  if (settings.send_copy_to_purchaser !== false && gift.purchaser_email && gift.purchaser_email.toLowerCase() !== gift.recipient_email.toLowerCase()) {
    const copyPayload = buildGiftPurchaserCopyPayload(gift, origin, settings, due.info);
    const purchaserEvent = await createNotificationEvent(env, {
      event_type: "gift_scheduled_delivery_purchaser_copy_email",
      channel: "email",
      recipient_email: gift.purchaser_email,
      payload: {
        template_key: "gift_scheduled_delivery_copy",
        gift_id: gift.id,
        gift_code: gift.code,
        delivery_date: due.delivery_date,
        target: "purchaser",
        ...copyPayload.payload
      },
      subject: copyPayload.subject,
      body_text: copyPayload.body_text,
      body_html: copyPayload.body_html
    });
    if (purchaserEvent.ok) {
      context = await updateGiftDeliveryContext(env, gift.id, context, {
        copy_notification_event_id: purchaserEvent.event.id,
        purchaser_copy_status: "processing"
      });
      copyResult = await deliverNotificationEvent(env, purchaserEvent.event);
      results.push({ target: "purchaser", ...copyResult, notification_event_id: purchaserEvent.event.id });
      context = await updateGiftDeliveryContext(env, gift.id, context, {
        purchaser_copy_status: copyResult.ok ? "accepted" : "failed",
        last_copy_error: copyResult.error || null
      });
    } else {
      context = await updateGiftDeliveryContext(env, gift.id, context, {
        purchaser_copy_status: "failed",
        last_copy_error: purchaserEvent.error || "Could not queue purchaser copy."
      });
    }
  }

  return {
    ok: true,
    gift_id: gift.id,
    gift_code: gift.code,
    recipient_provider_status: "accepted",
    purchaser_copy_status: copyResult ? (copyResult.ok ? "accepted" : "failed") : "not_submitted",
    results
  };
}

function buildGiftDeliveryPayload(gift, origin, settings, info) {
  const recipient = gift.recipient_name || gift.recipient_email || "Gift recipient";
  const sender = info.sender_name || "Someone who cares about a clean ride";
  const valueLabel = gift.type === "service"
    ? `${gift.package_code || "Service gift"}${gift.vehicle_size ? ` · ${gift.vehicle_size}` : ""}`
    : formatCad(gift.remaining_cents ?? gift.face_value_cents ?? 0);
  const bookingUrl = buildGiftBookingUrl(origin, gift);
  const printUrl = `${origin}/gift-certificate-print?code=${encodeURIComponent(gift.code || "")}`;
  const subject = `Your Rosie Dazzlers e-gift is ready`;
  const body_text = [
    `Hi ${recipient},`,
    "",
    `${sender} sent you a Rosie Dazzlers e-gift${info.delivery_date ? ` for ${info.delivery_date}` : ""}.`,
    `Gift code: ${gift.code}`,
    `Gift type/value: ${valueLabel}`,
    info.gift_message ? `Message: ${info.gift_message}` : null,
    `Book using your gift: ${bookingUrl}`,
    `Printable certificate: ${printUrl}`,
    `Gift certificates expire on ${friendlyDate(gift.expires_at) || "the printed expiry date"}.`,
    "",
    "Thank you for choosing Rosie Dazzlers."
  ].filter(Boolean).join("\n");
  const body_html = `
    <h1>Your Rosie Dazzlers e-gift is ready</h1>
    <p>Hi ${escapeHtml(recipient)},</p>
    <p><strong>${escapeHtml(sender)}</strong> sent you a Rosie Dazzlers e-gift${info.delivery_date ? ` for <strong>${escapeHtml(info.delivery_date)}</strong>` : ""}.</p>
    <p><strong>Gift code:</strong> ${escapeHtml(gift.code || "")}</p>
    <p><strong>Gift type/value:</strong> ${escapeHtml(valueLabel)}</p>
    ${info.gift_message ? `<p><strong>Message:</strong> ${escapeHtml(info.gift_message)}</p>` : ""}
    <p><a href="${bookingUrl}">Book using your gift</a><br><a href="${printUrl}">Open printable certificate</a></p>
    <p>Gift certificates expire on ${escapeHtml(friendlyDate(gift.expires_at) || "the printed expiry date")}.</p>
    <p>Thank you for choosing Rosie Dazzlers.</p>
  `;
  return {
    subject,
    body_text,
    body_html,
    payload: {
      recipient_name: gift.recipient_name || null,
      sender_name: info.sender_name || null,
      gift_message: info.gift_message || null,
      booking_url: bookingUrl,
      print_url: printUrl,
      gift_type: gift.type || null,
      package_code: gift.package_code || null,
      vehicle_size: gift.vehicle_size || null,
      value_label: valueLabel,
      expires_at: gift.expires_at || null
    }
  };
}

function buildGiftPurchaserCopyPayload(gift, origin, settings, info) {
  const recipient = gift.recipient_name || gift.recipient_email || "your recipient";
  const bookingUrl = buildGiftBookingUrl(origin, gift);
  const printUrl = `${origin}/gift-certificate-print?code=${encodeURIComponent(gift.code || "")}`;
  const subject = `Your Rosie Dazzlers e-gift was sent`;
  const body_text = [
    `Hi ${info.sender_name || "there"},`,
    "",
    `Your Rosie Dazzlers gift for ${recipient} was accepted by our email provider${info.delivery_date ? ` on ${info.delivery_date}` : ""}. Inbox delivery is not confirmed.`,
    `Gift code: ${gift.code}`,
    `Recipient booking link: ${bookingUrl}`,
    `Printable certificate: ${printUrl}`
  ].join("\n");
  const body_html = `
    <h1>Your Rosie Dazzlers e-gift was sent</h1>
    <p>Hi ${escapeHtml(info.sender_name || "there")},</p>
    <p>Your Rosie Dazzlers gift for <strong>${escapeHtml(recipient)}</strong> was accepted by our email provider${info.delivery_date ? ` on <strong>${escapeHtml(info.delivery_date)}</strong>` : ""}. Inbox delivery is not confirmed.</p>
    <p><strong>Gift code:</strong> ${escapeHtml(gift.code || "")}</p>
    <p><a href="${bookingUrl}">Recipient booking link</a><br><a href="${printUrl}">Printable certificate</a></p>
  `;
  return {
    subject,
    body_text,
    body_html,
    payload: { target: "purchaser_copy", booking_url: bookingUrl, print_url: printUrl, recipient_name: recipient }
  };
}

function buildGiftBookingUrl(origin, gift) {
  const params = new URLSearchParams();
  if (gift.code) params.set("gift_code", gift.code);
  if (gift.package_code) params.set("package", gift.package_code);
  if (gift.vehicle_size) params.set("size", gift.vehicle_size);
  return `${origin}/book${params.toString() ? `?${params.toString()}` : ""}`;
}

async function createNotificationEvent(env, row) {
  const payload = {
    event_type: row.event_type,
    channel: row.channel || "email",
    booking_id: row.booking_id || null,
    customer_profile_id: row.customer_profile_id || null,
    recipient_email: row.recipient_email || null,
    recipient_phone: row.recipient_phone || null,
    payload: row.payload || {},
    status: "queued",
    attempt_count: 0,
    next_attempt_at: new Date().toISOString(),
    max_attempts: 5,
    subject: row.subject || null,
    body_text: row.body_text || null,
    body_html: row.body_html || null
  };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify([payload])
  });
  const out = await res.json().catch(() => []);
  if (!res.ok) {
    return { ok: false, error: (Array.isArray(out) ? out[0]?.message : out?.message) || "Could not queue notification event." };
  }
  const event = Array.isArray(out) ? out[0] || null : null;
  return { ok: !!event, event, error: event ? null : "Notification event was not returned." };
}

async function deliverNotificationEvent(env, event) {
  const dispatch = await dispatchNotificationThroughProvider(env, event);
  const patch = dispatch.ok
    ? {
        status: "sent",
        attempt_count: Number(event.attempt_count || 0) + 1,
        last_error: null,
        provider_response: dispatch.provider_response || null,
        next_attempt_at: null,
        updated_at: new Date().toISOString()
      }
    : {
        status: "failed",
        attempt_count: Number(event.attempt_count || 0) + 1,
        last_error: dispatch.error || "Dispatch failed.",
        provider_response: dispatch.provider_response || null,
        next_attempt_at: new Date(Date.now() + 15 * 60000).toISOString(),
        updated_at: new Date().toISOString()
      };
  const persisted = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events?id=eq.${encodeURIComponent(event.id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(patch)
  });
  const persistedRows = await persisted.json().catch(() => null);
  if (!persisted.ok || !Array.isArray(persistedRows) || persistedRows.length !== 1) {
    throw new Error("Gift provider outcome could not be persisted; owner reconciliation required before retry.");
  }
  return { ok: dispatch.ok, error: dispatch.error || null };
}

export async function updateGiftDeliveryContext(env, giftId, purchaseContext, patch) {
  const nextContext = JSON.parse(JSON.stringify(purchaseContext && typeof purchaseContext === "object" ? purchaseContext : {}));
  nextContext.gift_delivery = {
    ...(nextContext.gift_delivery && typeof nextContext.gift_delivery === "object" ? nextContext.gift_delivery : {}),
    ...patch
  };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?id=eq.${encodeURIComponent(giftId)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify({ purchase_context: nextContext })
  });
  const rows = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(rows) || rows.length !== 1) {
    throw new Error("Gift delivery state could not be persisted; owner reconciliation required before retry.");
  }
  return nextContext;
}

async function claimGiftDelivery(env, gift, info) {
  const claimContext = JSON.parse(JSON.stringify(info.purchase_context));
  claimContext.gift_delivery = { ...claimContext.gift_delivery, delivery_status: "processing", claimed_at: new Date().toISOString() };
  const query = new URLSearchParams({
    id: `eq.${gift.id}`,
    status: "eq.active",
    "purchase_context->gift_delivery->>delivery_status": "eq.pending"
  });
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?${query}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify({ purchase_context: claimContext })
  });
  if (!res.ok) throw new Error("Unable to claim gift delivery; dispatch held for review.");
  const rows = await res.json().catch(() => null);
  if (!Array.isArray(rows)) throw new Error("Gift claim response unverified; dispatch held for review.");
  return rows.length === 1 ? claimContext : null;
}

function zonedDateParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour || 0)
  };
}

function friendlyDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function formatCad(cents) {
  const amount = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function clampWhole(value, min, max, fallback) {
  const num = Math.floor(Number(value));
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
