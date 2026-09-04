import assert from "node:assert/strict";
import { resolveCheckoutCustomerIdentity } from "../functions/api/_lib/checkout-customer-identity.js";

const profileId = "11111111-1111-4111-8111-111111111111";
const vehicleId = "22222222-2222-4222-8222-222222222222";
const otherProfileId = "33333333-3333-4333-8333-333333333333";

function requestWithSelector(selector = "") {
  return new Request("https://rosiedazzlers.ca/api/checkout", {
    headers: selector ? { cookie: `rd_booking_vehicle_selector=${encodeURIComponent(selector)}` } : {}
  });
}

const guest = await resolveCheckoutCustomerIdentity({
  request: requestWithSelector(),
  env: {},
  body: {},
  sessionResolver: async () => ({ customer_profile: null }),
  vehicleLoader: async () => { throw new Error("guest flow must not load a vehicle"); }
});
assert.deepEqual(
  { ok: guest.ok, profile: guest.customer_profile_id, vehicle: guest.customer_vehicle_id, source: guest.source },
  { ok: true, profile: null, vehicle: null, source: "guest" }
);

const authenticatedProfileOnly = await resolveCheckoutCustomerIdentity({
  request: requestWithSelector(),
  env: {},
  body: {},
  sessionResolver: async () => ({ customer_profile: { id: profileId } }),
  vehicleLoader: async () => { throw new Error("profile-only flow must not load a vehicle"); }
});
assert.equal(authenticatedProfileOnly.ok, true);
assert.equal(authenticatedProfileOnly.customer_profile_id, profileId);
assert.equal(authenticatedProfileOnly.customer_vehicle_id, null);
assert.equal(authenticatedProfileOnly.source, "authenticated_profile");

const rejectedClientProfile = await resolveCheckoutCustomerIdentity({
  request: requestWithSelector(),
  env: {},
  body: { customer_profile_id: otherProfileId },
  sessionResolver: async () => ({ customer_profile: { id: profileId } })
});
assert.equal(rejectedClientProfile.ok, false);
assert.equal(rejectedClientProfile.status, 400);
assert.equal(rejectedClientProfile.reason, "client_profile_id_rejected");

const anonymousVehicleInjection = await resolveCheckoutCustomerIdentity({
  request: requestWithSelector(vehicleId),
  env: {},
  body: {},
  sessionResolver: async () => ({ customer_profile: null })
});
assert.equal(anonymousVehicleInjection.ok, false);
assert.equal(anonymousVehicleInjection.status, 401);
assert.equal(anonymousVehicleInjection.reason, "saved_vehicle_requires_session");

let ownershipLookup = null;
const ownedVehicle = await resolveCheckoutCustomerIdentity({
  request: requestWithSelector(vehicleId),
  env: {},
  body: {},
  sessionResolver: async () => ({ customer_profile: { id: profileId } }),
  vehicleLoader: async (args) => {
    ownershipLookup = args;
    return { id: vehicleId, customer_profile_id: profileId };
  }
});
assert.equal(ownedVehicle.ok, true);
assert.equal(ownedVehicle.customer_profile_id, profileId);
assert.equal(ownedVehicle.customer_vehicle_id, vehicleId);
assert.equal(ownedVehicle.source, "authenticated_saved_vehicle");
assert.equal(ownershipLookup.customerProfileId, profileId);
assert.equal(ownershipLookup.customerVehicleId, vehicleId);

const crossProfileInjection = await resolveCheckoutCustomerIdentity({
  request: requestWithSelector(vehicleId),
  env: {},
  body: {},
  sessionResolver: async () => ({ customer_profile: { id: profileId } }),
  vehicleLoader: async () => ({ id: vehicleId, customer_profile_id: otherProfileId })
});
assert.equal(crossProfileInjection.ok, false);
assert.equal(crossProfileInjection.status, 403);
assert.equal(crossProfileInjection.reason, "saved_vehicle_ownership_failed");

const conflictingSelectors = await resolveCheckoutCustomerIdentity({
  request: requestWithSelector(vehicleId),
  env: {},
  body: { customer_vehicle_id: "44444444-4444-4444-8444-444444444444" },
  sessionResolver: async () => ({ customer_profile: { id: profileId } })
});
assert.equal(conflictingSelectors.ok, false);
assert.equal(conflictingSelectors.status, 400);
assert.equal(conflictingSelectors.reason, "saved_vehicle_selector_conflict");

console.log("Authenticated checkout vehicle identity: PASS");
console.log(" - guest checkout remains valid with no customer ownership IDs");
console.log(" - authenticated profile identity comes only from the server session");
console.log(" - saved vehicle selectors require an authenticated same-profile ownership proof");
console.log(" - anonymous, cross-profile and conflicting selector injection fail closed");
