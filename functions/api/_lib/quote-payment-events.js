// functions/api/_lib/quote-payment-events.js
// Build 182 — quote deposit webhook history, replay, receipt email, and refund tracking helpers.

import {
  serviceHeaders,
  cleanText,
  isUuid,
  moneyToCents,
  findQuoteDepositPaymentRequest
} from "./quote-deposit-payments.js";

const WEBHOOK_EVENT_SELECT = [
  "id", "provider", "provider_event_id", "provider_event_type", "quote_deposit_payment_request_id", "booking_id",
  "payment_reference", "status", "replay_status", "replay_count", "last_replayed_at", "last_error",
  "raw_payload", "processed_payload", "created_at", "updated_at"
].join(",");

export async function recordPaymentWebhookEvent(env, input = {}) {
  try {
    if (!env?.SUPABASE_URL) return { ok: false, skipped: true, reason: "missing_supabase_url" };
    const provider = cleanText(input.provider || "provider").toLowerCase();
    const providerEventId = cleanText(input.provider_event_id || input.providerEventId || input.event_id || input.id || "");
    const providerEventType = cleanText(input.provider_event_type || input.providerEventType || input.event_type || input.type || "");
    if (!providerEventId || !providerEventType) return { ok: false, skipped: true, reason: "missing_provider_event" };

    const row = {
      provider,
      provider_event_id: providerEventId,
      provider_event_type: providerEventType,
      quote_deposit_payment_request_id: cleanUuid(input.quote_deposit_payment_request_id || input.payment_request_id),
      booking_id: cleanUuid(input.booking_id),
      payment_reference: cleanText(input.payment_reference || input.reference || "") || null,
      status: cleanWebhookStatus(input.status || "received"),
      replay_status: cleanReplayStatus(input.replay_status || "not_replayed"),
      last_error: cleanText(input.last_error || input.error || "") || null,
      raw_payload: asObject(input.raw_payload || input.rawPayload || null),
      processed_payload: asObject(input.processed_payload || input.processedPayload || input.details || null),
      updated_at: new Date().toISOString()
    };

    const url = `${env.SUPABASE_URL}/rest/v1/quote_payment_webhook_events?on_conflict=provider,provider_event_id`;
    const res = await fetch(url, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([row])
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return { ok: false, skipped: true, status: res.status, error: extractSupabaseError(data, text, "Could not record webhook event history.") };
    return { ok: true, event: Array.isArray(data) ? data[0] || null : data };
  } catch (err) {
    return { ok: false, skipped: true, error: err?.message || "Could not record webhook event history." };
  }
}

export async function updatePaymentWebhookEvent(env, lookup = {}, patch = {}) {
  try {
    const id = cleanUuid(lookup.id);
    const provider = cleanText(lookup.provider || "").toLowerCase();
    const providerEventId = cleanText(lookup.provider_event_id || lookup.providerEventId || "");
    let query = "";
    if (id) query = `id=eq.${encodeURIComponent(id)}`;
    else if (provider && providerEventId) query = `provider=eq.${encodeURIComponent(provider)}&provider_event_id=eq.${encodeURIComponent(providerEventId)}`;
    else return { ok: false, skipped: true, reason: "missing_lookup" };

    const cleanPatch = { ...patch, updated_at: new Date().toISOString() };
    if (cleanPatch.status) cleanPatch.status = cleanWebhookStatus(cleanPatch.status);
    if (cleanPatch.replay_status) cleanPatch.replay_status = cleanReplayStatus(cleanPatch.replay_status);

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_payment_webhook_events?${query}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(cleanPatch)
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return { ok: false, status: res.status, error: extractSupabaseError(data, text, "Could not update webhook history row.") };
    return { ok: true, event: Array.isArray(data) ? data[0] || null : data };
  } catch (err) {
    return { ok: false, error: err?.message || "Could not update webhook history row." };
  }
}

export async function loadPaymentWebhookEvent(env, id) {
  if (!isUuid(id)) return null;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_payment_webhook_events?select=${encodeURIComponent(WEBHOOK_EVENT_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load webhook event."));
  return Array.isArray(data) ? data[0] || null : null;
}

export async function queueQuoteDepositReceiptEmail(env, paymentRequest, details = {}) {
  try {
    if (!paymentRequest?.id || !paymentRequest?.customer_email) return { ok: false, skipped: true, reason: "missing_customer_email" };
    const amountCents = moneyToCents(details.paidAmountCents || paymentRequest.paid_amount_cents || paymentRequest.amount_cents || 0);
    const paymentUrl = cleanText(paymentRequest.public_payment_url || paymentRequest.checkout_url || "");
    const subject = `Rosie Dazzlers deposit receipt — ${formatMoney(amountCents)}`;
    const bodyText = [
      "Thank you. We received your Rosie Dazzlers quote deposit.",
      `Amount paid: ${formatMoney(amountCents)}`,
      `Payment method: ${cleanText(details.provider || paymentRequest.provider || paymentRequest.payment_method || "payment")}`,
      `Reference: ${cleanText(details.paymentReference || paymentRequest.payment_reference || paymentRequest.external_checkout_id || paymentRequest.id)}`,
      paymentRequest.confirmed_booking_id ? "Your booking has been marked confirmed in our system." : "Your deposit is recorded. Staff will finish linking the final booking if it has not been scheduled yet.",
      paymentUrl ? `Payment page: ${paymentUrl}` : ""
    ].filter(Boolean).join("\n");
    const bodyHtml = `
      <h1>Deposit receipt</h1>
      <p>Thank you. We received your Rosie Dazzlers quote deposit.</p>
      <p><strong>Amount paid:</strong> ${escapeHtml(formatMoney(amountCents))}</p>
      <p><strong>Payment method:</strong> ${escapeHtml(cleanText(details.provider || paymentRequest.provider || paymentRequest.payment_method || "payment"))}</p>
      <p><strong>Reference:</strong> ${escapeHtml(cleanText(details.paymentReference || paymentRequest.payment_reference || paymentRequest.external_checkout_id || paymentRequest.id))}</p>
      <p>${paymentRequest.confirmed_booking_id ? "Your booking has been marked confirmed in our system." : "Your deposit is recorded. Staff will finish linking the final booking if it has not been scheduled yet."}</p>
      ${paymentUrl ? `<p><a href="${escapeHtml(paymentUrl)}">Open payment summary</a></p>` : ""}
    `;

    const eventRow = {
      event_type: "quote_deposit_receipt_email",
      channel: "email",
      booking_id: paymentRequest.confirmed_booking_id || paymentRequest.booking_id || null,
      recipient_email: paymentRequest.customer_email,
      payload: {
        quote_deposit_payment_request_id: paymentRequest.id,
        quote_proposal_draft_id: paymentRequest.quote_proposal_draft_id || null,
        lead_id: paymentRequest.lead_id || null,
        amount_cents: amountCents,
        provider: details.provider || paymentRequest.provider || null,
        payment_reference: details.paymentReference || paymentRequest.payment_reference || null,
        public_payment_url: paymentUrl || null
      },
      status: "queued",
      attempt_count: 0,
      next_attempt_at: new Date().toISOString(),
      max_attempts: 5,
      subject,
      body_text: bodyText,
      body_html: bodyHtml
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify([eventRow])
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return { ok: false, status: res.status, error: extractSupabaseError(data, text, "Could not queue receipt email.") };
    const event = Array.isArray(data) ? data[0] || null : data;
    await patchPaymentRequest(env, paymentRequest.id, {
      receipt_email_status: "queued",
      receipt_email_queued_at: new Date().toISOString(),
      receipt_notification_event_id: event?.id || null,
      updated_at: new Date().toISOString()
    }).catch(() => null);
    return { ok: true, notification_event: event };
  } catch (err) {
    return { ok: false, error: err?.message || "Could not queue receipt email." };
  }
}

export async function recordQuoteDepositRefund(env, input = {}) {
  const paymentRequest = await findQuoteDepositPaymentRequest(env, {
    paymentRequestId: input.payment_request_id || input.quote_deposit_payment_request_id,
    externalCheckoutId: input.external_checkout_id || input.provider_order_id || input.provider_capture_id || input.provider_payment_intent_id
  }) || await findPaymentRequestByProviderReference(env, input);
  if (!paymentRequest?.id) return { ok: false, status: 404, error: "Quote deposit/payment request was not found for refund tracking." };

  const refundAmountCents = moneyToCents(input.refund_amount_cents ?? input.amount_cents ?? input.amount ?? 0);
  if (!(refundAmountCents > 0)) return { ok: false, status: 400, error: "Refund amount must be greater than zero.", payment_request: paymentRequest };

  const now = new Date().toISOString();
  const paidCents = moneyToCents(paymentRequest.paid_amount_cents || paymentRequest.amount_cents || 0);
  const existingRefunded = moneyToCents(paymentRequest.refunded_amount_cents || 0);
  const newRefunded = existingRefunded + refundAmountCents;
  const refundStatus = newRefunded >= paidCents && paidCents > 0 ? "refunded" : "partial_refund";
  const provider = cleanText(input.provider || paymentRequest.provider || "provider").toLowerCase();

  const refundRow = {
    quote_deposit_payment_request_id: paymentRequest.id,
    quote_proposal_draft_id: paymentRequest.quote_proposal_draft_id || null,
    lead_id: paymentRequest.lead_id || null,
    booking_id: paymentRequest.confirmed_booking_id || paymentRequest.booking_id || null,
    provider,
    provider_refund_id: cleanText(input.provider_refund_id || input.refund_id || input.providerRefundId || "") || null,
    provider_event_id: cleanText(input.provider_event_id || input.providerEventId || "") || null,
    provider_event_type: cleanText(input.provider_event_type || input.providerEventType || "") || null,
    refund_status: cleanText(input.refund_status || refundStatus),
    refund_amount_cents: refundAmountCents,
    currency: cleanText(input.currency || paymentRequest.currency || "CAD").toUpperCase(),
    reason: cleanText(input.reason || input.refund_reason || "") || null,
    provider_payload: asObject(input.provider_payload || input.raw_payload || input.payload || null),
    refunded_at: cleanText(input.refunded_at || "") || now,
    created_at: now,
    updated_at: now
  };

  let refundRecord = null;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_refund_records?on_conflict=provider,provider_refund_id`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([refundRow])
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not record refund."));
    refundRecord = Array.isArray(data) ? data[0] || null : data;
  } catch (err) {
    return { ok: false, status: 500, error: err?.message || "Could not record refund.", payment_request: paymentRequest };
  }

  const paymentPatch = {
    refund_status: refundStatus,
    payment_status: refundStatus === "refunded" ? "refunded" : "partial_refund",
    refunded_amount_cents: newRefunded,
    latest_refund_at: now,
    latest_refund_id: refundRecord?.id || null,
    updated_at: now
  };
  const patchedPayment = await patchPaymentRequestWithRefundFallback(env, paymentRequest.id, paymentPatch);

  await patchQuoteDraft(env, paymentRequest.quote_proposal_draft_id, {
    latest_refund_status: refundStatus,
    refunded_amount_cents: newRefunded,
    updated_at: now
  }).catch(() => null);

  const refundEmail = await queueQuoteDepositRefundEmail(env, patchedPayment || { ...paymentRequest, ...paymentPatch }, refundRecord || refundRow).catch((err) => ({ ok: false, error: err?.message || "Could not queue refund email." }));

  return { ok: true, payment_request: patchedPayment || { ...paymentRequest, ...paymentPatch }, refund: refundRecord, refund_email: refundEmail };
}

async function findPaymentRequestByProviderReference(env, input = {}) {
  const candidates = [
    ["provider_payment_intent_id", input.provider_payment_intent_id],
    ["provider_order_id", input.provider_order_id],
    ["provider_capture_id", input.provider_capture_id],
    ["payment_reference", input.payment_reference],
    ["external_checkout_id", input.external_checkout_id]
  ].filter(([, value]) => cleanText(value));
  for (const [field, value] of candidates) {
    try {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?select=*&${field}=eq.${encodeURIComponent(cleanText(value))}&limit=1`, { headers: serviceHeaders(env) });
      const rows = res.ok ? await res.json().catch(() => []) : [];
      const row = Array.isArray(rows) ? rows[0] || null : null;
      if (row) return row;
    } catch {}
  }
  return null;
}

async function queueQuoteDepositRefundEmail(env, paymentRequest, refund) {
  if (!paymentRequest?.customer_email) return { ok: false, skipped: true, reason: "missing_customer_email" };
  const subject = `Rosie Dazzlers refund recorded — ${formatMoney(refund.refund_amount_cents)}`;
  const bodyText = [
    "A refund or partial refund has been recorded for your Rosie Dazzlers quote deposit.",
    `Refund amount: ${formatMoney(refund.refund_amount_cents)}`,
    `Refund status: ${refund.refund_status || "recorded"}`,
    `Reference: ${refund.provider_refund_id || refund.provider_event_id || "refund record"}`,
    "Depending on the payment provider, card/bank posting time may vary."
  ].join("\n");
  const bodyHtml = `
    <h1>Refund recorded</h1>
    <p>A refund or partial refund has been recorded for your Rosie Dazzlers quote deposit.</p>
    <p><strong>Refund amount:</strong> ${escapeHtml(formatMoney(refund.refund_amount_cents))}</p>
    <p><strong>Refund status:</strong> ${escapeHtml(refund.refund_status || "recorded")}</p>
    <p><strong>Reference:</strong> ${escapeHtml(refund.provider_refund_id || refund.provider_event_id || "refund record")}</p>
    <p>Depending on the payment provider, card/bank posting time may vary.</p>
  `;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify([{
      event_type: "quote_deposit_refund_email",
      channel: "email",
      booking_id: paymentRequest.confirmed_booking_id || paymentRequest.booking_id || null,
      recipient_email: paymentRequest.customer_email,
      payload: {
        quote_deposit_payment_request_id: paymentRequest.id,
        quote_deposit_refund_record_id: refund.id || null,
        refund_amount_cents: refund.refund_amount_cents,
        refund_status: refund.refund_status
      },
      status: "queued",
      attempt_count: 0,
      next_attempt_at: new Date().toISOString(),
      max_attempts: 5,
      subject,
      body_text: bodyText,
      body_html: bodyHtml
    }])
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) return { ok: false, status: res.status, error: extractSupabaseError(data, text, "Could not queue refund email.") };
  return { ok: true, notification_event: Array.isArray(data) ? data[0] || null : data };
}

async function patchPaymentRequest(env, id, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(patch)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not update quote deposit/payment request."));
  return Array.isArray(data) ? data[0] || null : data;
}

async function patchPaymentRequestWithRefundFallback(env, id, patch) {
  try {
    return await patchPaymentRequest(env, id, patch);
  } catch (err) {
    const msg = String(err?.message || "").toLowerCase();
    if (msg.includes("constraint") || msg.includes("payment_status")) {
      const fallback = { ...patch, payment_status: patch.refund_status === "refunded" ? "refunded" : "paid" };
      return await patchPaymentRequest(env, id, fallback);
    }
    throw err;
  }
}

async function patchQuoteDraft(env, id, patch) {
  if (!id) return;
  await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify(patch) });
}

function cleanUuid(value) { const text = cleanText(value); return isUuid(text) ? text : null; }
function cleanWebhookStatus(value) {
  const allowed = new Set(["received", "verified", "ignored", "settled", "failed", "refund_recorded", "unverified", "replayed", "replay_failed"]);
  const text = cleanText(value).toLowerCase();
  return allowed.has(text) ? text : "received";
}
function cleanReplayStatus(value) {
  const allowed = new Set(["not_replayed", "queued", "replayed", "failed", "blocked"]);
  const text = cleanText(value).toLowerCase();
  return allowed.has(text) ? text : "not_replayed";
}
function asObject(value) { return value && typeof value === "object" ? value : null; }
function formatMoney(cents) { return `$${(Number(cents || 0) / 100).toFixed(2)} CAD`; }
function safeJson(text) { try { return typeof text === "string" ? JSON.parse(text) : text || null; } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function escapeHtml(v){ return String(v ?? "").replace(/[&<>"']/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }
