import assert from "node:assert/strict";
import {
  groupCompletedBookings,
  reminderCandidateDue
} from "../functions/api/_lib/membership-reminders.js";

const profileId = "11111111-1111-4111-8111-111111111111";
const email = "fleet@example.test";

const booking = (overrides = {}) => ({
  id: crypto.randomUUID(),
  customer_profile_id: profileId,
  customer_name: "Fleet Customer",
  customer_email: email,
  service_date: "2026-01-01",
  service_area: "Tillsonburg",
  package_code: "basic_detail",
  vehicle_year: 2022,
  vehicle_make: "Honda",
  vehicle_model: "Civic",
  vehicle_size: "mid",
  vehicle_plate: "TEST100",
  ...overrides
});

// Same customer, two plates: history, eligibility and keys must stay separate.
const split = groupCompletedBookings([
  booking({ id: "a1", service_date: "2026-01-01", package_code: "complete_detail", vehicle_plate: "AAA 111" }),
  booking({ id: "a2", service_date: "2026-02-01", package_code: "basic_detail", vehicle_plate: "AAA-111" }),
  booking({ id: "b1", service_date: "2026-03-01", package_code: "basic_detail", vehicle_year: 2021, vehicle_make: "Ford", vehicle_model: "Escape", vehicle_size: "oversize", vehicle_plate: "BBB 222" })
]);
assert.equal(split.length, 2, "two vehicles for one customer must remain two maintenance histories");
const civic = split.find((row) => row.vehicle_label.includes("Civic"));
const escape = split.find((row) => row.vehicle_label.includes("Escape"));
assert.ok(civic && escape, "both vehicle histories should be represented");
assert.equal(civic.booking_count, 2, "same normalized plate should group one vehicle history");
assert.equal(civic.has_complete_detail, true, "Complete Detail eligibility belongs to the Civic only");
assert.equal(escape.has_complete_detail, false, "another vehicle must not inherit Complete Detail eligibility");
assert.notEqual(civic.maintenance_vehicle_key, escape.maintenance_vehicle_key, "vehicles require distinct opaque reminder keys");
assert.equal(civic.maintenance_vehicle_key.includes("AAA111"), false, "opaque key must not expose plate text");

// A unique saved vehicle is stronger than plate changes and keeps one stable history.
const savedVehicle = {
  id: "22222222-2222-4222-8222-222222222222",
  customer_profile_id: profileId,
  vehicle_name: "Daily Civic",
  model_year: 2022,
  make: "Honda",
  model: "Civic",
  vehicle_size: "mid",
  service_interval_days: 42,
  next_cleaning_due_at: "2026-05-01"
};
const savedMap = new Map([[profileId, [savedVehicle]]]);
const savedHistory = groupCompletedBookings([
  booking({ id: "s1", service_date: "2026-01-01", vehicle_plate: "OLD111" }),
  booking({ id: "s2", service_date: "2026-02-15", vehicle_plate: "" })
], savedMap);
assert.equal(savedHistory.length, 1, "unique saved vehicle should join matching bookings even if plate changes or is omitted");
assert.equal(savedHistory[0].booking_count, 2);
assert.equal(savedHistory[0].vehicle_identity_source, "saved_vehicle");
assert.equal(savedHistory[0].vehicle_identity_reliable, true);
assert.equal(savedHistory[0].customer_vehicle.id, savedVehicle.id);

// No saved match and no plate: do not merge uncertain histories or permit a reminder.
const ambiguous = groupCompletedBookings([
  booking({ id: "u1", service_date: "2026-01-01", package_code: "complete_detail", vehicle_plate: "" }),
  booking({ id: "u2", service_date: "2026-02-01", package_code: "complete_detail", vehicle_plate: "" })
]);
assert.equal(ambiguous.length, 2, "unidentified bookings must remain isolated instead of being blended by vehicle spec");
assert.ok(ambiguous.every((row) => row.vehicle_identity_reliable === false));
assert.ok(ambiguous.every((row) => row.vehicle_identity_source === "isolated"));

const blocked = reminderCandidateDue({
  vehicle_identity_reliable: false,
  eligible_for_maintenance: true,
  reminder_opt_in: true,
  email,
  last_service_at: "2026-01-01T13:00:00.000Z",
  next_reminder_at: "2026-01-29T13:00:00.000Z"
}, { reminder_enabled: true }, new Date("2026-02-01T13:00:00.000Z"));
assert.deepEqual(blocked, { due: false, reason: "vehicle_identity_required" });

console.log("Vehicle-aware maintenance rules: PASS");
console.log(" - household/fleet vehicle histories remain isolated");
console.log(" - Complete Detail eligibility cannot leak between vehicles");
console.log(" - saved vehicle identity is stable across plate changes");
console.log(" - ambiguous history fails closed and plate text stays out of reminder keys");
