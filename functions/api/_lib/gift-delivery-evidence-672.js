// Build 672: bounded, read-only comparison of gift delivery context and notification evidence.
// 'sent' means provider accepted the email, not that the recipient opened or received it.
export const GIFT_DELIVERY_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RECIPIENT_TYPE = "gift_scheduled_delivery_email";
const COPY_TYPE = "gift_scheduled_delivery_purchaser_copy_email";

function safeStatus(value) {
  const s = String(value || "").trim().toLowerCase();
  return ["queued", "sent", "failed", "cancelled", "pending", "processing", "review_required"].includes(s) ? s : "unknown";
}

function eventView(row, target, now) {
  if (!row) return { target, status: "missing", event_id: null, attempts: null, max_attempts: null, provider_error_recorded: false, next_attempt_at: null, review: "inspect_missing_event" };
  const attempts = Math.max(0, Math.floor(Number(row.attempt_count) || 0));
  const maxAttempts = Math.max(0, Math.floor(row.max_attempts == null ? 5 : Number(row.max_attempts)) || 0);
  const status = safeStatus(row.status);
  const due = !row.next_attempt_at || (Number.isFinite(Date.parse(row.next_attempt_at)) && Date.parse(row.next_attempt_at) <= now.getTime());
  let review = "hold_unknown_state";
  if (status === "sent") review = "provider_accepted_do_not_retry";
  else if (status === "queued" || status === "pending") review = "already_queued_do_not_duplicate";
  else if (status === "cancelled") review = "cancelled_requires_owner_review";
  else if (status === "failed") review = attempts >= maxAttempts || maxAttempts === 0
    ? "attempt_limit_hold" : due ? "failed_existing_event_owner_review" : "backoff_pending_no_immediate_retry";
  return {
    target, status, event_id: String(row.id || ""), attempts, max_attempts: maxAttempts,
    provider_error_recorded: Boolean(row.last_error),
    next_attempt_at: row.next_attempt_at || null,
    review
  };
}

export function reconcileGiftDeliveryEvidence(gift, events, { now = new Date(), history_complete = true, history_truncated = false } = {}) {
  const delivery = gift?.purchase_context?.gift_delivery && typeof gift.purchase_context.gift_delivery === "object"
    ? gift.purchase_context.gift_delivery : {};
  const unique = [...new Map((Array.isArray(events) ? events : []).filter((row) => row && row.id).map((row) => [String(row.id), row])).values()];
  const recipients = unique.filter((e) => e.event_type === RECIPIENT_TYPE);
  const copies = unique.filter((e) => e.event_type === COPY_TYPE);
  const recipient = recipients.find((e) => String(e.id) === String(delivery.notification_event_id || "")) || recipients[0] || null;
  const copy = copies.find((e) => String(e.id) === String(delivery.copy_notification_event_id || "")) || copies[0] || null;
  const recipientView = eventView(recipient, "recipient", now);
  const copyView = eventView(copy, "purchaser_copy", now);
  const flags = [];
  const add = (code) => { if (!flags.includes(code)) flags.push(code); };

  if (gift?.status !== "active") add("gift_not_active");
  if (!gift?.purchase_context?.gift_delivery || typeof gift.purchase_context.gift_delivery !== "object") add("gift_delivery_context_missing");
  if (!String(gift?.recipient_email || "").trim()) add("recipient_email_missing");
  if (!history_complete) add("notification_history_unavailable");
  if (history_truncated) add("notification_history_truncated");
  if (recipients.length > 1) add("multiple_recipient_events_no_blind_retry");
  if (copies.length > 1) add("multiple_purchaser_copy_events");
  if (delivery.notification_event_id && !recipients.some((e) => String(e.id) === String(delivery.notification_event_id))) add("recipient_pointer_not_in_history");
  if (delivery.copy_notification_event_id && !copies.some((e) => String(e.id) === String(delivery.copy_notification_event_id))) add("purchaser_copy_pointer_not_in_history");
  if (!recipient) add("recipient_notification_absent");
  if (recipient && recipient.status === "sent" && delivery.delivery_status === "failed") add("gift_failed_but_recipient_provider_accepted");
  if (recipient && recipient.status === "failed" && delivery.delivery_status === "sent") add("gift_sent_but_recipient_event_failed");
  if (recipient && recipient.status === "sent" && copy?.status === "failed") add("purchaser_copy_only_failure");
  if (delivery.sent_at && recipientView.status !== "sent") add("sent_timestamp_disagrees_with_recipient_event");
  const copyExpected = Boolean(gift?.purchaser_email && gift?.recipient_email && String(gift.purchaser_email).toLowerCase() !== String(gift.recipient_email).toLowerCase());
  if (copyExpected && !copy) add("purchaser_copy_event_absent_check_settings");

  const hardHold = !history_complete || history_truncated || gift?.status !== "active" || !gift?.recipient_email ||
    recipients.length !== 1 || copies.length > 1 || flags.includes("sent_timestamp_disagrees_with_recipient_event") ||
    flags.includes("recipient_pointer_not_in_history") || flags.includes("purchaser_copy_pointer_not_in_history");
  const target = recipientView.review === "failed_existing_event_owner_review" ? "recipient"
    : recipientView.status === "sent" && copyView.review === "failed_existing_event_owner_review" ? "purchaser_copy" : null;
  const ownerRetryCandidate = !hardHold && Boolean(target);

  return {
    gift_status: String(gift?.status || "unknown"),
    recorded_delivery_status: safeStatus(delivery.delivery_status),
    recipient: recipientView,
    purchaser_copy: copyView,
    recipient_event_count: recipients.length,
    purchaser_copy_event_count: copies.length,
    purchaser_copy_expected: copyExpected,
    evidence_flags: flags,
    owner_retry_candidate: ownerRetryCandidate,
    candidate_target: ownerRetryCandidate ? target : null,
    decision: ownerRetryCandidate ? "evidence_ready_for_authorized_owner_review" : "hold_no_automatic_resend",
    retry_instruction: ownerRetryCandidate
      ? "Review the identified existing failed event and provider evidence in authorized Admin Notifications before an operator decides whether to retry. This screen never sends."
      : "Do not retry or create a new gift based on this snapshot. Reconcile event history, provider state and gift context with an authorized operator."
  };
}
