// Build 368 — Capacity, Calendar & Travel Intelligence.
// Pure read-only summarizer. It never creates availability; AM/PM booleans remain authoritative.

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeSlot(value) {
  const slot = clean(value).toUpperCase();
  return slot === "AM" || slot === "PM" ? slot : "";
}

function normalizeDurationSlots(value) {
  const n = Number(value);
  return n === 1 || n === 2 ? n : null;
}

export function resolveTravelContext(catalog, requestedArea) {
  const raw = clean(requestedArea);
  if (!raw || !catalog || typeof catalog !== "object") return null;
  const areas = Array.isArray(catalog.service_areas) ? catalog.service_areas : [];
  const normalized = raw.toLowerCase();
  const row = areas.find((item) => [item?.value, item?.label, item?.municipality]
    .map((value) => clean(value).toLowerCase())
    .filter(Boolean)
    .includes(normalized)) || null;
  if (!row) return null;

  const tier = clean(row.travel_tier) || "township";
  const travelPricing = catalog.booking_rules?.travel_pricing && typeof catalog.booking_rules.travel_pricing === "object"
    ? catalog.booking_rules.travel_pricing
    : {};
  const rawCharge = Number(travelPricing[tier]);

  return Object.freeze({
    service_area: clean(row.value || row.label),
    label: clean(row.label || row.value),
    county: clean(row.county) || null,
    municipality: clean(row.municipality) || null,
    zone: clean(row.zone) || null,
    travel_tier: tier,
    travel_charge_cad: Number.isFinite(rawCharge) && rawCharge >= 0 ? rawCharge : null,
    travel_note: clean(travelPricing.notes) || null,
    water_rule: clean(row.water_rule) || null,
    parking_rule: clean(row.parking_rule) || null,
    advisory_only: true
  });
}

export function buildCapacityCalendarIntelligence({
  AM,
  PM,
  blocked = false,
  reason = null,
  businessHours = null,
  slotBlockReasons = [],
  activeBookingCount = 0,
  requestedStartSlot = "",
  requestedDurationSlots = null,
  travelContext = null
} = {}) {
  const amOpen = AM === true;
  const pmOpen = PM === true;
  const isBlocked = blocked === true;
  const startSlot = normalizeSlot(requestedStartSlot);
  const durationSlots = normalizeDurationSlots(requestedDurationSlots);
  const openSlots = [amOpen ? "AM" : null, pmOpen ? "PM" : null].filter(Boolean);

  let capacityState = "full";
  if (isBlocked) capacityState = "blocked";
  else if (amOpen && pmOpen) capacityState = "full_day_open";
  else if (amOpen || pmOpen) capacityState = "half_day_open";

  let requestedFit = null;
  if (durationSlots === 2) requestedFit = amOpen && pmOpen;
  else if (durationSlots === 1 && startSlot) requestedFit = startSlot === "AM" ? amOpen : pmOpen;

  const normalizedSlotReasons = (Array.isArray(slotBlockReasons) ? slotBlockReasons : [])
    .map((item) => ({ slot: normalizeSlot(item?.slot), reason: clean(item?.reason) || null }))
    .filter((item) => item.slot);

  return Object.freeze({
    contract: Object.freeze({
      read_only: true,
      availability_authority: "/api/availability",
      collision_revalidation_authority: "/api/checkout",
      never_opens_closed_slots: true,
      background_polling: false
    }),
    operating_model: Object.freeze({
      one_vehicle_per_day_default: true,
      half_day_exceptions_supported: true,
      slot_model: Object.freeze(["AM", "PM"]),
      duration_unit: "booking_slot"
    }),
    capacity_state: capacityState,
    open_slots: Object.freeze(openSlots),
    open_slot_count: openSlots.length,
    can_fit_half_day: openSlots.length > 0,
    can_fit_full_day: amOpen && pmOpen,
    requested_fit: requestedFit,
    requested_service: durationSlots ? Object.freeze({
      start_slot: startSlot || null,
      duration_slots: durationSlots,
      duration_expectation: durationSlots === 2 ? "full-day (AM + PM)" : "half-day booking slot"
    }) : null,
    active_booking_count: Math.max(0, Number(activeBookingCount) || 0),
    blocked_reason: clean(reason) || null,
    slot_block_reasons: Object.freeze(normalizedSlotReasons),
    business_hours: businessHours && typeof businessHours === "object" ? businessHours : null,
    travel_context: travelContext && typeof travelContext === "object" ? travelContext : null
  });
}
