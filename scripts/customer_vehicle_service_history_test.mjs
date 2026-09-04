import assert from "node:assert/strict";
import {
  buildCompletedVehicleHistoryPatch,
  syncCompletedBookingVehicleHistory,
  completedVehicleHistoryForbiddenPlanningFields
} from "../functions/api/_lib/customer-vehicle-service-history.js";

const profileId = "11111111-1111-4111-8111-111111111111";
const vehicleId = "22222222-2222-4222-8222-222222222222";
const now = new Date("2026-09-04T23:50:00.000Z");

function completedBooking(overrides = {}) {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    job_status: "completed",
    customer_profile_id: profileId,
    customer_vehicle_id: vehicleId,
    service_date: "2026-09-04",
    package_code: "complete_detail",
    vehicle_mileage_km: 125000,
    addons: [
      { code: "pet_hair", label: "Pet Hair", cents: 2500, quote_required: false },
      { code: "headlight_restoration", label: "Headlight Restoration", cents: null, quote_required: true }
    ],
    ...overrides
  };
}

function savedVehicle(overrides = {}) {
  return {
    id: vehicleId,
    customer_profile_id: profileId,
    mileage_km: 120000,
    service_interval_days: 28,
    next_cleaning_due_at: "2026-10-01",
    next_service_mileage_km: 130000,
    auto_schedule_opt_in: true,
    ...overrides
  };
}

const exterior = buildCompletedVehicleHistoryPatch({ booking: completedBooking(), vehicle: savedVehicle(), now });
assert.equal(exterior.ok, true);
assert.equal(exterior.skipped, false);
assert.equal(exterior.patch.last_wash_at, "2026-09-04");
assert.equal(exterior.patch.last_package_code, "complete_detail");
assert.equal(exterior.patch.mileage_km, 125000);
assert.equal(exterior.patch.updated_at, now.toISOString());
assert.equal(exterior.patch.last_addons.length, 2);
assert.deepEqual(exterior.patch.last_addons[0], { code: "pet_hair", label: "Pet Hair", cents: 2500, quote_required: false });

const interior = buildCompletedVehicleHistoryPatch({
  booking: completedBooking({ package_code: "interior_detail" }),
  vehicle: savedVehicle(),
  now
});
assert.equal(interior.ok, true);
assert.equal(Object.prototype.hasOwnProperty.call(interior.patch, "last_wash_at"), false);
assert.equal(interior.patch.last_package_code, "interior_detail");

const lowerMileage = buildCompletedVehicleHistoryPatch({
  booking: completedBooking({ vehicle_mileage_km: 115000 }),
  vehicle: savedVehicle({ mileage_km: 120000 }),
  now
});
assert.equal(lowerMileage.ok, true);
assert.equal(Object.prototype.hasOwnProperty.call(lowerMileage.patch, "mileage_km"), false);

const missingIdentity = buildCompletedVehicleHistoryPatch({
  booking: completedBooking({ customer_vehicle_id: null }),
  vehicle: savedVehicle(),
  now
});
assert.equal(missingIdentity.ok, true);
assert.equal(missingIdentity.skipped, true);
assert.equal(missingIdentity.reason, "durable_vehicle_identity_required");

const mismatch = buildCompletedVehicleHistoryPatch({
  booking: completedBooking(),
  vehicle: savedVehicle({ customer_profile_id: "44444444-4444-4444-8444-444444444444" }),
  now
});
assert.equal(mismatch.ok, true);
assert.equal(mismatch.skipped, true);
assert.equal(mismatch.reason, "vehicle_ownership_mismatch");

const notComplete = buildCompletedVehicleHistoryPatch({
  booking: completedBooking({ job_status: "in_progress" }),
  vehicle: savedVehicle(),
  now
});
assert.equal(notComplete.skipped, true);
assert.equal(notComplete.reason, "booking_not_completed");

for (const forbidden of completedVehicleHistoryForbiddenPlanningFields()) {
  assert.equal(Object.prototype.hasOwnProperty.call(exterior.patch, forbidden), false, `completion patch must not write ${forbidden}`);
}

const calls = [];
const fetchImpl = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  if (!options.method) {
    return new Response(JSON.stringify([savedVehicle()]), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (options.method === "PATCH") {
    const patch = JSON.parse(options.body);
    for (const forbidden of completedVehicleHistoryForbiddenPlanningFields()) {
      assert.equal(Object.prototype.hasOwnProperty.call(patch, forbidden), false, `network patch must not write ${forbidden}`);
    }
    return new Response(JSON.stringify([{ ...savedVehicle(), ...patch }]), { status: 200, headers: { "content-type": "application/json" } });
  }
  throw new Error(`Unexpected method ${options.method}`);
};

const synced = await syncCompletedBookingVehicleHistory({
  env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-key" },
  booking: completedBooking(),
  fetchImpl,
  now
});
assert.equal(synced.ok, true);
assert.equal(synced.reason, "completed_vehicle_history_synced");
assert.equal(calls.length, 2);
for (const call of calls) {
  assert.match(call.url, new RegExp(`id=eq\\.${vehicleId}`));
  assert.match(call.url, new RegExp(`customer_profile_id=eq\\.${profileId}`));
}
assert.equal(calls[1].options.method, "PATCH");

let patchCalled = false;
const missingOwnedVehicle = await syncCompletedBookingVehicleHistory({
  env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-key" },
  booking: completedBooking(),
  fetchImpl: async (_url, options = {}) => {
    if (options.method === "PATCH") patchCalled = true;
    return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
  },
  now
});
assert.equal(missingOwnedVehicle.ok, true);
assert.equal(missingOwnedVehicle.skipped, true);
assert.equal(missingOwnedVehicle.reason, "vehicle_not_owned_by_profile");
assert.equal(patchCalled, false);

console.log("Completed-service vehicle history sync: PASS");
console.log(" - completion requires durable same-profile vehicle identity");
console.log(" - service facts update package/add-ons and non-regressing mileage");
console.log(" - last_wash_at advances only for exterior-wash packages");
console.log(" - staff scheduling/planning fields are never written by completion sync");
console.log(" - missing/mismatched durable identity leaves the saved vehicle unchanged");
