import assert from "node:assert/strict";
import { normalizeFleetMaintenancePatch, fleetMaintenanceDueState, writableFleetMaintenanceFields } from "../functions/api/_lib/fleet-maintenance-planning.js";

const writable = writableFleetMaintenanceFields();
assert.deepEqual(writable, ["service_interval_days", "next_cleaning_due_at", "next_service_mileage_km"]);

let result = normalizeFleetMaintenancePatch({
  vehicle_id: "11111111-1111-4111-8111-111111111111",
  service_interval_days: "28",
  next_cleaning_due_at: "2026-10-01",
  next_service_mileage_km: "125000"
}, { mileage_km: 120000 });
assert.equal(result.ok, true);
assert.deepEqual(result.patch, {
  service_interval_days: 28,
  next_cleaning_due_at: "2026-10-01",
  next_service_mileage_km: 125000
});

result = normalizeFleetMaintenancePatch({ service_interval_days: "abc" });
assert.equal(result.ok, false, "non-numeric interval must fail closed");

result = normalizeFleetMaintenancePatch({ service_interval_days: 7 });
assert.equal(result.ok, false, "interval below 14 days must fail closed");

result = normalizeFleetMaintenancePatch({ service_interval_days: 85 });
assert.equal(result.ok, false, "interval above 84 days must fail closed");

result = normalizeFleetMaintenancePatch({ next_cleaning_due_at: "10/01/2026" });
assert.equal(result.ok, false, "non-ISO date must fail closed");

result = normalizeFleetMaintenancePatch({ next_service_mileage_km: 119999 }, { mileage_km: 120000 });
assert.equal(result.ok, false, "target mileage below current mileage must fail closed");

result = normalizeFleetMaintenancePatch({ auto_schedule_opt_in: true });
assert.equal(result.ok, false, "automatic scheduling must never be writable");

result = normalizeFleetMaintenancePatch({ customer_profile_id: "11111111-1111-4111-8111-111111111111" });
assert.equal(result.ok, false, "customer/profile fields must never be writable");

result = normalizeFleetMaintenancePatch({ service_interval_days: "", next_cleaning_due_at: "", next_service_mileage_km: "" });
assert.equal(result.ok, true, "staff must be able to clear an existing maintenance plan");
assert.deepEqual(result.patch, { service_interval_days: null, next_cleaning_due_at: null, next_service_mileage_km: null });

let due = fleetMaintenanceDueState({
  service_interval_days: 28,
  next_cleaning_due_at: "2026-09-01",
  mileage_km: 100000,
  next_service_mileage_km: 110000
}, null, new Date("2026-09-04T12:00:00Z"));
assert.equal(due.due, true);
assert.equal(due.due_by_date, true);
assert.equal(due.due_by_mileage, false);
assert.equal(due.reason, "date_due");

due = fleetMaintenanceDueState({
  service_interval_days: 28,
  next_cleaning_due_at: "2026-09-20",
  mileage_km: 120500,
  next_service_mileage_km: 120000
}, null, new Date("2026-09-04T12:00:00Z"));
assert.equal(due.due, true);
assert.equal(due.due_by_mileage, true);
assert.equal(due.reason, "mileage_due");

console.log("Fleet maintenance planning contract: PASS");
console.log(" - only vehicle-level interval/date/mileage planning fields are writable");
console.log(" - invalid values and automatic scheduling fail closed");
console.log(" - date and mileage due states remain deterministic");
