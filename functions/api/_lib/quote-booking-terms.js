// Build 362 — pure quote-to-booking acceptance decisions.
// Kept free of network/runtime dependencies so regression cases can run in Node and Workers.

export function normalizeAddonCodes(value) {
  const rows = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
      ? value.split(",")
      : [];
  return Array.from(new Set(rows.map((row) => String(row || "").trim()).filter(Boolean))).sort();
}

export function normalizeStructuredQuoteTerms(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    version: Number(source.version || 1),
    package_code: String(source.package_code || "").trim(),
    vehicle_size: String(source.vehicle_size || "").trim(),
    addon_codes: normalizeAddonCodes(source.addon_codes || source.addons),
    total_cents: integerOrNull(source.total_cents ?? source.price_total_cents),
    deposit_cents: integerOrNull(source.deposit_cents),
    expires_at: normalizeIso(source.expires_at),
    currency: String(source.currency || "CAD").trim().toUpperCase()
  };
}

export function validateStructuredQuoteTerms(value, nowMs = Date.now()) {
  const terms = normalizeStructuredQuoteTerms(value);
  if (terms.version !== 1) return fail("QUOTE_TERMS_VERSION_UNSUPPORTED", "The quote terms version is not supported.");
  if (!terms.package_code) return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "The accepted quote is missing package_code.");
  if (!["small", "mid", "oversize"].includes(terms.vehicle_size)) return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "The accepted quote is missing a valid vehicle_size.");
  if (terms.total_cents == null || terms.total_cents < 0) return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "The accepted quote is missing total_cents.");
  if (terms.deposit_cents == null || terms.deposit_cents < 0) return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "The accepted quote is missing deposit_cents.");
  if (!terms.expires_at) return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "The accepted quote is missing expires_at.");
  if (terms.currency !== "CAD") return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "The accepted quote must use CAD.");
  const expiresMs = Date.parse(terms.expires_at);
  if (!Number.isFinite(expiresMs) || expiresMs <= nowMs) return fail("QUOTE_EXPIRED", "This quote has expired. Re-price it before creating a booking.");
  return { ok: true, terms };
}

export function compareAcceptedTermsToCurrentPrice(acceptedTerms, currentPrice, nowMs = Date.now()) {
  const checked = validateStructuredQuoteTerms(acceptedTerms, nowMs);
  if (!checked.ok) return checked;
  if (!currentPrice || currentPrice.ok !== true) {
    return fail(currentPrice?.code || "QUOTE_PRICE_REVALIDATION_FAILED", currentPrice?.error || "Current pricing could not be validated.");
  }
  const accepted = checked.terms;
  const currentAddons = normalizeAddonCodes(currentPrice.addon_codes || currentPrice.addons?.map((row) => row.code));
  const commercialChanged =
    accepted.package_code !== String(currentPrice.package_code || "") ||
    accepted.vehicle_size !== String(currentPrice.vehicle_size || "") ||
    JSON.stringify(accepted.addon_codes) !== JSON.stringify(currentAddons) ||
    accepted.total_cents !== Number(currentPrice.total_cents) ||
    accepted.deposit_cents !== Number(currentPrice.deposit_cents);
  if (commercialChanged) {
    return {
      ...fail("QUOTE_PRICE_CHANGED", "Current catalog pricing no longer matches the accepted quote. Re-price and resend the quote before booking."),
      accepted,
      current: {
        package_code: currentPrice.package_code,
        vehicle_size: currentPrice.vehicle_size,
        addon_codes: currentAddons,
        total_cents: Number(currentPrice.total_cents),
        deposit_cents: Number(currentPrice.deposit_cents)
      }
    };
  }
  return { ok: true, terms: accepted };
}

export function evaluateSlotAvailability({ dateBlocked = false, blockedSlots = [], conflicts = [], startSlot, durationSlots }) {
  const slot = String(startSlot || "").trim().toUpperCase();
  const duration = Number(durationSlots || 1);
  if (dateBlocked) return fail("BOOKING_DATE_BLOCKED", "The selected service date is blocked.");
  if (!["AM", "PM"].includes(slot) || ![1, 2].includes(duration)) return fail("BOOKING_SLOT_INVALID", "A valid AM/PM start slot and duration are required.");
  const blocked = new Set((blockedSlots || []).map((value) => String(value || "").trim().toUpperCase()));
  const requested = duration === 2 ? ["AM", "PM"] : [slot];
  if (requested.some((value) => blocked.has(value))) return fail("BOOKING_SLOT_UNAVAILABLE", "The selected appointment slot is no longer available.");
  const taken = (conflicts || []).some((row) => {
    const existing = Number(row?.duration_slots) === 2 ? ["AM", "PM"] : [String(row?.start_slot || "").trim().toUpperCase()];
    return existing.some((value) => requested.includes(value));
  });
  return taken ? fail("BOOKING_SLOT_UNAVAILABLE", "The selected appointment slot is no longer available.") : { ok: true };
}

export function replayDecision(existingBookingId) {
  const id = String(existingBookingId || "").trim();
  return id ? { ok: true, replay: true, booking_id: id, code: "BOOKING_ALREADY_CREATED" } : { ok: true, replay: false };
}

export function canonicalStructuredQuoteTerms(value) {
  const terms = normalizeStructuredQuoteTerms(value);
  return JSON.stringify({
    version: terms.version,
    package_code: terms.package_code,
    vehicle_size: terms.vehicle_size,
    addon_codes: terms.addon_codes,
    total_cents: terms.total_cents,
    deposit_cents: terms.deposit_cents,
    expires_at: terms.expires_at,
    currency: terms.currency
  });
}

export async function hashStructuredQuoteTerms(value) {
  const bytes = new TextEncoder().encode(canonicalStructuredQuoteTerms(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function integerOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function normalizeIso(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function fail(code, error) {
  return { ok: false, code, error };
}
