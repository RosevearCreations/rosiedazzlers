// Build 737 — wizard-only safeguards. Pricing, capacity, booking and payment
// remain server-authoritative; this module never creates a hold or a charge.
export const BOOKING_JOURNEY_VERSION_737 = "rosie-booking-journey.v1";
export const CHECKOUT_UNCERTAIN_KEY_737 = "rd_booking_checkout_uncertain_v737";
export const BOOKING_STEPS_737 = Object.freeze([
  "Date, area & vehicle", "Choose your service", "Optional add-ons",
  "Address & waiver", "Payment & review"
]);

export function validateBookingAddress737({ address = "", postal = "" } = {}) {
  const street = typeof address === "string" ? address.trim() : "";
  const code = typeof postal === "string" ? postal.trim() : "";
  if (!street) return { ok: false, field: "address_line1", message: "Enter the service address." };
  if (street.length > 180) return { ok: false, field: "address_line1", message: "The service address is too long. Use up to 180 characters." };
  if (code && !/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(code)) {
    return { ok: false, field: "postal_code", message: "Check the Canadian postal code or leave it blank for staff to confirm." };
  }
  return { ok: true, field: null, message: "" };
}

export function validateBookingChoices737(catalog, packageCode, size, addonCodes = []) {
  const packageRow = (catalog?.packages || []).find(row => row?.code === packageCode);
  if (!packageRow) return { ok: false, step: 2, reason: "That main package is no longer offered. Choose a current package." };
  if (!["small", "mid", "oversize"].includes(size)) return { ok: false, step: 1, reason: "Choose a supported vehicle size." };
  const prices = packageRow?.prices_cad || {};
  const price = Number(prices[size] ?? packageRow?.price_cad?.[size] ?? 0);
  if (!Number.isFinite(price) || price <= 0) return { ok: false, step: 2, reason: "This package needs a current starting price for your vehicle size." };
  for (const code of new Set(addonCodes)) {
    const addon = (catalog?.addons || []).find(row => row?.code === code);
    if (!addon) return { ok: false, step: 3, reason: "A selected add-on is no longer offered. Review the add-ons." };
    const requirements = Array.isArray(addon.requires_package_codes_any) ? addon.requires_package_codes_any : [];
    if (addon.standalone_allowed !== true && requirements.length && !requirements.includes(packageCode)) {
      return { ok: false, step: 3, reason: "A selected add-on is not available with this package. Review the add-ons." };
    }
  }
  return { ok: true, step: null, reason: "" };
}

// One user-initiated checkout at a time, including the async validation phase.
// Ambiguous server/network outcomes are never unlocked for automatic replay.
export function createCheckoutAttemptGuard737(uncertain = false) {
  let phase = uncertain ? "requires_manual_review" : "idle";
  return {
    begin() { if (phase !== "idle") return false; phase = "validating"; return true; },
    markSubmitted() { if (phase !== "validating") return false; phase = "awaiting_response"; return true; },
    releaseForCorrection() {
      if (!(["validating", "awaiting_response"].includes(phase))) return false;
      phase = "idle";
      return true;
    },
    markUncertain() { phase = "requires_manual_review"; },
    markRedirect() { phase = "redirecting"; },
    get phase() { return phase; }
  };
}
