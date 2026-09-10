from pathlib import Path

helper = Path("functions/api/_lib/capacity-calendar-intelligence.js").read_text(encoding="utf-8")
availability = Path("functions/api/availability.js").read_text(encoding="utf-8")
checkout = Path("functions/api/checkout.js").read_text(encoding="utf-8")

required_helper = [
    "one_vehicle_per_day_default: true",
    "half_day_exceptions_supported: true",
    'collision_revalidation_authority: "/api/checkout"',
    "never_opens_closed_slots: true",
    'duration_unit: "booking_slot"',
    "resolveTravelContext",
    "travel_charge_cad",
    "advisory_only: true",
]
for token in required_helper:
    assert token in helper, f"Build 368 helper missing authority token: {token}"

required_availability = [
    "capacity_intelligence: buildCapacityCalendarIntelligence",
    'url.searchParams.get("service_area")',
    'url.searchParams.get("start_slot")',
    'url.searchParams.get("duration_slots")',
    "loadRequestedTravelContext",
    "Travel context is descriptive only",
    "/rest/v1/date_blocks?select=blocked_date,reason",
    "/rest/v1/slot_blocks?select=blocked_date,slot,reason",
    "/rest/v1/bookings?select=status,start_slot,duration_slots",
]
for token in required_availability:
    assert token in availability, f"Build 368 availability missing authority token: {token}"

# Checkout remains the race/collision backstop. Build 368 must not replace this with client trust.
required_checkout = [
    'if (![1,2].includes(Number(body.duration_slots)))',
    '/rest/v1/date_blocks?select=blocked_date,reason',
    '/rest/v1/slot_blocks?select=blocked_date,slot,reason',
    'const bookingConflict = await supa(',
    'const requestedSlots = Number(body.duration_slots) === 2 ? ["AM","PM"]',
    'if (isBlocked) return corsJson({ error: "Selected slot not available" }, 409);',
]
for token in required_checkout:
    assert token in checkout, f"Checkout collision authority regressed: {token}"

for forbidden in ["INSERT INTO", "ALTER TABLE", "CREATE TABLE", "DROP TABLE"]:
    assert forbidden not in helper, f"Build 368 helper must remain schema/write free: {forbidden}"

assert "setInterval(" not in helper
assert "setInterval(" not in availability

print("Build 368 capacity/calendar/travel source authority passed.")
