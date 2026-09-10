import assert from "node:assert/strict";
import { buildCapacityCalendarIntelligence, resolveTravelContext } from "../functions/api/_lib/capacity-calendar-intelligence.js";

const bothOpen = buildCapacityCalendarIntelligence({ AM: true, PM: true });
assert.equal(bothOpen.capacity_state, "full_day_open");
assert.equal(bothOpen.can_fit_half_day, true);
assert.equal(bothOpen.can_fit_full_day, true);
assert.deepEqual([...bothOpen.open_slots], ["AM", "PM"]);
assert.equal(bothOpen.contract.collision_revalidation_authority, "/api/checkout");
assert.equal(bothOpen.operating_model.one_vehicle_per_day_default, true);
assert.equal(bothOpen.operating_model.half_day_exceptions_supported, true);

const halfOpen = buildCapacityCalendarIntelligence({ AM: false, PM: true, requestedStartSlot: "PM", requestedDurationSlots: 1 });
assert.equal(halfOpen.capacity_state, "half_day_open");
assert.equal(halfOpen.can_fit_full_day, false);
assert.equal(halfOpen.requested_fit, true);
assert.equal(halfOpen.requested_service.duration_expectation, "half-day booking slot");

const fullDayCannotFit = buildCapacityCalendarIntelligence({ AM: true, PM: false, requestedStartSlot: "AM", requestedDurationSlots: 2 });
assert.equal(fullDayCannotFit.requested_fit, false);
assert.equal(fullDayCannotFit.can_fit_half_day, true);

const blocked = buildCapacityCalendarIntelligence({
  AM: false,
  PM: false,
  blocked: true,
  reason: "Holiday closure",
  slotBlockReasons: [{ slot: "AM", reason: "Staff block" }],
  requestedStartSlot: "AM",
  requestedDurationSlots: 1
});
assert.equal(blocked.capacity_state, "blocked");
assert.equal(blocked.requested_fit, false);
assert.equal(blocked.blocked_reason, "Holiday closure");
assert.equal(blocked.contract.never_opens_closed_slots, true);
assert.deepEqual(blocked.slot_block_reasons, [{ slot: "AM", reason: "Staff block" }]);

const full = buildCapacityCalendarIntelligence({ AM: false, PM: false, activeBookingCount: 2 });
assert.equal(full.capacity_state, "full");
assert.equal(full.open_slot_count, 0);
assert.equal(full.active_booking_count, 2);

const catalog = {
  service_areas: [{
    value: "Port Dover",
    label: "Port Dover",
    county: "Norfolk County",
    municipality: "Norfolk",
    zone: "south",
    travel_tier: "coastal",
    water_rule: "Confirm local restrictions",
    parking_rule: "Private driveway preferred"
  }],
  booking_rules: { travel_pricing: { coastal: 20, notes: "Central travel policy" } }
};
const travel = resolveTravelContext(catalog, "Port Dover");
assert.equal(travel.travel_tier, "coastal");
assert.equal(travel.travel_charge_cad, 20);
assert.equal(travel.advisory_only, true);
assert.equal(resolveTravelContext(catalog, "Unknown Zone"), null);

console.log("Build 368 capacity/calendar/travel regression cases passed.");
