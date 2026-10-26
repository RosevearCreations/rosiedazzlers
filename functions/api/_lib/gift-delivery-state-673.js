// Build 673: Stripe metadata is authoritative only after the signed webhook is verified.
// Gift delivery is held until a single worker atomically claims its pending state.
export const GIFT_NOTIFICATION_TYPES = new Set([
  "gift_scheduled_delivery_email",
  "gift_scheduled_delivery_purchaser_copy_email"
]);

export function isGiftNotificationEvent(event) {
  return GIFT_NOTIFICATION_TYPES.has(String(event?.event_type || ""));
}

export function buildGiftPurchaseContext(metadata = {}, vehicle = null) {
  const context = {};
  if (vehicle && Object.values(vehicle).some(Boolean)) context.vehicle = vehicle;
  const rawDate = String(metadata.delivery_date || "").trim();
  const parsedDate = new Date(`${rawDate}T00:00:00Z`);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === rawDate ? rawDate : "";
  const needsDateReview = Boolean(rawDate && !validDate);
  context.gift_delivery = {
    sender_name: String(metadata.sender_name || "").trim().slice(0, 160),
    delivery_date: validDate,
    gift_message: String(metadata.gift_message || "").trim().slice(0, 450),
    delivery_status: needsDateReview ? "review_required" : "pending",
    recipient_provider_status: "not_submitted",
    purchaser_copy_status: "not_submitted"
  };
  return context;
}
