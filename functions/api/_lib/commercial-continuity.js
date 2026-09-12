// Build 390 — pure quote / estimate / deposit / booking continuity semantics.
// This module never turns a price, acceptance, availability check or payment hint into a confirmed booking.

export function fixedCatalogQuoteContinuity() {
  return {
    commercial_kind: "quote",
    condition_scope: "catalog_defined",
    inspection_required: false,
    customer_approval_required: true,
    compatibility_status: "confirmed",
    availability_status: "unverified",
    deposit_status: "unverified",
    booking_status: "not_created",
    booking_confirmed: false,
    payment_confirmed: false,
    next_action: "customer_approval_and_availability_check"
  };
}

export function inspectionEstimateContinuity(reason = "Condition-specific work requires review before a bookable price can be confirmed.") {
  return {
    commercial_kind: "estimate",
    condition_scope: "inspection_required",
    inspection_required: true,
    customer_approval_required: true,
    compatibility_status: "requires_review",
    availability_status: "unverified",
    deposit_status: "not_requested",
    booking_status: "not_created",
    booking_confirmed: false,
    payment_confirmed: false,
    next_action: "inspection_and_revised_quote",
    continuity_note: String(reason || "").trim() || null
  };
}

export function availabilityContinuity(available) {
  const isAvailable = available === true;
  return {
    availability_status: isAvailable ? "available_unheld" : "unavailable",
    slot_held: false,
    booking_status: "not_created",
    booking_confirmed: false,
    payment_confirmed: false,
    next_action: isAvailable ? "create_or_resume_booking" : "select_another_slot"
  };
}

export function acceptedQuoteContinuity() {
  return {
    quote_accepted: true,
    customer_approval_status: "accepted",
    availability_status: "unverified",
    deposit_status: "unverified",
    booking_status: "not_confirmed",
    booking_confirmed: false,
    payment_confirmed: false,
    next_action: "verify_current_price_availability_and_deposit"
  };
}

export function depositRequestContinuity(paymentRequest = {}, quote = {}) {
  const paymentStatus = normalizeStatus(paymentRequest?.payment_status || paymentRequest?.status);
  const depositPaid = paymentStatus === "paid";
  const bookingConfirmed = Boolean(String(paymentRequest?.booking_confirmed_at || "").trim());
  const quoteAccepted = normalizeStatus(quote?.acceptance_status) === "accepted";

  return {
    quote_accepted: quoteAccepted,
    customer_approval_status: quoteAccepted ? "accepted" : "not_verified",
    deposit_status: depositPaid ? "paid" : paymentStatus || "not_verified",
    deposit_paid: depositPaid,
    payment_confirmed: depositPaid,
    booking_status: bookingConfirmed ? "confirmed" : "not_confirmed",
    booking_confirmed: bookingConfirmed,
    next_action: bookingConfirmed
      ? "appointment_confirmed"
      : depositPaid
        ? "await_booking_confirmation"
        : "complete_or_verify_deposit"
  };
}

export function confirmedBookingContinuity(booking = {}, paymentVerified = false) {
  const bookingConfirmed = normalizeStatus(booking?.status) === "confirmed";
  return {
    payment_confirmed: paymentVerified === true,
    booking_status: bookingConfirmed ? "confirmed" : "not_confirmed",
    booking_confirmed: bookingConfirmed,
    next_action: bookingConfirmed ? "appointment_confirmed" : "await_booking_confirmation"
  };
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
}
