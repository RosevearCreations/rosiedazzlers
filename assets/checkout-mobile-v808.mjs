// Build 808 — presentation-only checkout decisions. Booking, gift redemption,
// provider verification and settlement remain server-authoritative.
export const CHECKOUT_MOBILE_VERSION_808 = "rosie-checkout-mobile.v1";

function safeProviderUrl(value, mode) {
  if (typeof value !== "string" || value.length > 2048) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.hash) return "";
    const hosts = mode === "stripe" ? ["checkout.stripe.com"]
      : mode === "paypal" ? ["www.paypal.com", "www.sandbox.paypal.com"] : [];
    return hosts.includes(url.hostname) ? url.href : "";
  } catch { return ""; }
}

const bookingIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function classifyCheckoutResult808(status, body) {
  if (!Number.isInteger(status) || status < 200 || status >= 300 || body?.ok !== true) {
    const correctable = [400, 422].includes(status) ||
      (status === 409 && ["stale_availability", "one_car_capacity_conflict"].includes(
        String(body?.recovery_state || body?.reason || "")));
    return {
      kind: correctable ? "correctable" : "review_required",
      message: correctable
        ? "Please review your details and check the date and slot again. No payment was confirmed."
        : "The payment setup result is uncertain. Do not start another checkout until Rosie checks your booking."
    };
  }
  if (body.mode === "gift_only_confirm" && body.booking_status === "confirmed" &&
      bookingIdPattern.test(String(body.booking_id || "")) &&
      body.payable_now_cents === 0 && Number.isInteger(body.gift_redeemed_cents) &&
      body.gift_redeemed_cents >= 0) {
    return { kind: "gift_confirmed", message: "Your gift-covered deposit was accepted. No additional payment was needed." };
  }
  if (["stripe", "paypal"].includes(body.mode)) {
    const target = safeProviderUrl(body.mode === "paypal" ? body.approve_url : body.checkout_url, body.mode);
    if (target) return { kind: "redirect", url: target, mode: body.mode };
  }
  return {
    kind: "review_required",
    message: "The payment provider response could not be verified. Do not submit another booking until Rosie checks its status."
  };
}

export function checkoutReturnMessage808(search) {
  const params = new URLSearchParams(search || "");
  // Booking ID alone is never payment or cancellation proof. Do not look up a
  // customer booking from this untrusted query string.
  return bookingIdPattern.test(String(params.get("booking_id") || ""))
    ? "You returned from a payment step. This page cannot verify whether a deposit was taken or a booking confirmed. Please check your confirmation email or contact Rosie before trying to pay again."
    : "";
}
