import {
  hasActivePushSubscription,
  loadCustomerNotificationProfile,
  queueNotificationEvent
} from "./notification-hooks.js";
import { normalizeReviewRequestStatus } from "./review-request-eligibility.js";

export const REVIEW_REQUEST_EVENT_TYPE = "review_request_invitation";

const DISPATCHABLE_STATUSES = new Set(["queued", "pending", "scheduled", "ready"]);
const NON_DISPATCHABLE_STATUSES = new Set(["blocked", "cancelled", "suppressed", "completed"]);
const SUPPORTED_CHANNELS = new Set(["email", "sms", "push"]);

export function reviewRequestIdFromNotification(event) {
  if (String(event?.event_type || "").trim().toLowerCase() !== REVIEW_REQUEST_EVENT_TYPE) return null;
  const payload = event?.payload && typeof event.payload === "object" ? event.payload : {};
  const id = String(payload.review_request_id || "").trim();
  return id || null;
}

export function decideReviewRequestDispatch(request, nowMs = Date.now()) {
  if (!request) return { dispatch: false, reason: "missing_review_request" };

  const status = normalizeReviewRequestStatus(request.status);
  if (status === "sent" || request.sent_at) return { dispatch: false, reason: "already_sent" };
  if (NON_DISPATCHABLE_STATUSES.has(status)) return { dispatch: false, reason: `terminal_${status}` };
  if (!DISPATCHABLE_STATUSES.has(status)) return { dispatch: false, reason: "unknown_state" };

  if (request.send_after) {
    const sendAfterMs = Date.parse(String(request.send_after));
    if (!Number.isFinite(sendAfterMs)) return { dispatch: false, reason: "invalid_send_after" };
    if (sendAfterMs > nowMs) {
      return {
        dispatch: false,
        reason: "not_due",
        next_attempt_at: new Date(sendAfterMs).toISOString()
      };
    }
  }

  return { dispatch: true, reason: "ready" };
}

export async function queueReviewRequestInvitation({ env, booking, request }) {
  if (!request?.id || !booking?.id) return { ok: false, skipped: true, reason: "missing_review_context" };

  const status = normalizeReviewRequestStatus(request.status);
  if (!DISPATCHABLE_STATUSES.has(status) || request.sent_at) {
    return { ok: false, skipped: true, reason: "review_request_not_dispatchable" };
  }

  const reviewUrl = String(request.review_url || env?.GOOGLE_REVIEW_URL || "").trim();
  if (!reviewUrl) return { ok: false, skipped: true, reason: "missing_review_url" };

  const profile = await loadCustomerNotificationProfile({
    env,
    customer_profile_id: booking.customer_profile_id || request.customer_id || null,
    customer_email: booking.customer_email || null
  });
  if (!profile) return { ok: false, skipped: true, reason: "no_profile" };
  if (profile.notification_opt_in !== true) return { ok: false, skipped: true, reason: "opted_out" };

  const channel = String(request.channel || profile.notification_channel || "email").trim().toLowerCase();
  if (!SUPPORTED_CHANNELS.has(channel)) return { ok: false, skipped: true, reason: "unsupported_channel" };

  if (channel === "push") {
    const active = await hasActivePushSubscription({ env, owner_type: "customer", owner_id: profile.id });
    if (!active) return { ok: false, skipped: true, reason: "no_push_subscription" };
  }

  const recipientEmail = channel === "email" ? String(profile.email || booking.customer_email || "").trim() : null;
  const recipientPhone = channel === "sms" ? String(profile.phone || "").trim() : null;
  if (channel === "email" && !recipientEmail) return { ok: false, skipped: true, reason: "missing_email_recipient" };
  if (channel === "sms" && !recipientPhone) return { ok: false, skipped: true, reason: "missing_sms_recipient" };

  const message = `Thank you for choosing Rosie Dazzlers. If you have a moment, we would appreciate your review: ${reviewUrl}`;
  return queueNotificationEvent({
    env,
    event_type: REVIEW_REQUEST_EVENT_TYPE,
    channel,
    booking_id: booking.id,
    customer_profile_id: profile.id || null,
    recipient_email: recipientEmail,
    recipient_phone: recipientPhone,
    subject: channel === "email" ? "How did Rosie Dazzlers do?" : null,
    body_text: message,
    next_attempt_at: request.send_after || null,
    payload: {
      source: "review_request_queue",
      review_request_id: request.id,
      review_url: reviewUrl
    }
  });
}

export async function loadReviewRequestDispatchGate({ env, event, nowMs = Date.now() }) {
  if (String(event?.event_type || "").trim().toLowerCase() !== REVIEW_REQUEST_EVENT_TYPE) {
    return { applies: false, decision: { dispatch: true, reason: "not_review_request" }, request: null };
  }

  const reviewRequestId = reviewRequestIdFromNotification(event);
  if (!reviewRequestId) {
    return { applies: true, decision: { dispatch: false, reason: "missing_review_request_id" }, request: null };
  }

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/review_request_queue?select=id,status,sent_at,send_after,updated_at&id=eq.${encodeURIComponent(reviewRequestId)}&limit=1`,
    { headers: serviceRoleHeaders(env) }
  );
  if (!res.ok) throw new Error(`Could not verify review request dispatch state. ${await res.text()}`);

  const request = (await res.json().catch(() => []))?.[0] || null;
  return {
    applies: true,
    review_request_id: reviewRequestId,
    request,
    decision: decideReviewRequestDispatch(request, nowMs)
  };
}

export async function reconcileReviewRequestSent({ env, event, sentAt }) {
  const reviewRequestId = reviewRequestIdFromNotification(event);
  if (!reviewRequestId) return { ok: true, skipped: true, reason: "not_review_request" };

  const deliveredAt = sentAt || new Date().toISOString();
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/review_request_queue?id=eq.${encodeURIComponent(reviewRequestId)}&status=in.(queued,pending,scheduled,ready)&sent_at=is.null`,
    {
      method: "PATCH",
      headers: { ...serviceRoleHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify({ status: "sent", sent_at: deliveredAt, updated_at: deliveredAt })
    }
  );
  if (!res.ok) throw new Error(`Could not reconcile delivered review request. ${await res.text()}`);

  const rows = await res.json().catch(() => []);
  const updated = Array.isArray(rows) ? rows[0] || null : null;
  return {
    ok: true,
    updated: Boolean(updated),
    review_request_id: reviewRequestId,
    status: updated?.status || null,
    reason: updated ? "delivery_reconciled" : "state_changed_before_reconciliation"
  };
}

function serviceRoleHeaders(env) {
  const key = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
}
