import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  evaluateFleetBusinessRulebook,
  fleetOperationalAuthority,
  requiredFleetBusinessDomains
} from "../functions/api/_lib/fleet-business-rulebook.js";

const live = JSON.parse(await readFile(new URL("../config/fleet-business-rulebook.json", import.meta.url), "utf8"));
const domains = requiredFleetBusinessDomains();
assert.deepEqual(domains, [
  "fleet_minimums",
  "service_tiers",
  "travel_limits",
  "volume_pricing",
  "invoicing",
  "cancellation"
]);

const blocked = evaluateFleetBusinessRulebook(live);
assert.equal(blocked.rules_ready, false);
assert.equal(blocked.status, "awaiting_business_approval");
assert.equal(blocked.blockers.length, 6);
for (const domain of domains) assert(blocked.blockers.includes(`${domain}:not_approved`));

const partial = structuredClone(live);
partial.decisions.fleet_minimums.approved = true;
partial.decisions.service_tiers.approved = true;
const partialResult = evaluateFleetBusinessRulebook(partial);
assert.equal(partialResult.rules_ready, false);
assert.equal(partialResult.blockers.length, 4);

const syntheticApproved = structuredClone(live);
for (const domain of domains) syntheticApproved.decisions[domain].approved = true;
const ready = evaluateFleetBusinessRulebook(syntheticApproved);
assert.equal(ready.rules_ready, true);
assert.equal(ready.status, "rules_ready");
assert.deepEqual(ready.blockers, []);
assert.equal(ready.next_boundary, "build_373_fleet_account_operations");

const expectedNoAuthority = {
  fleet_account_activation_allowed: false,
  automatic_discount_application_allowed: false,
  invoice_creation_allowed: false,
  booking_creation_allowed: false,
  recurring_billing_allowed: false,
  provider_mutation_allowed: false,
  database_mutation_allowed: false
};
assert.deepEqual(ready.operational_authority, expectedNoAuthority);
assert.deepEqual(fleetOperationalAuthority(), expectedNoAuthority);

const malformed = evaluateFleetBusinessRulebook({ business_approval_required: true, decisions: { fleet_minimums: { approved: true } } });
assert.equal(malformed.rules_ready, false);
assert(malformed.blockers.includes("service_tiers:missing"));

const noApprovalBoundary = evaluateFleetBusinessRulebook({ decisions: {} });
assert.equal(noApprovalBoundary.rules_ready, false);
assert(noApprovalBoundary.blockers.includes("business_approval_requirement_missing"));

console.log("FLEET BUSINESS RULEBOOK RUNTIME: PASS");
console.log(" - live Build 372 rulebook fails closed until all six decisions are approved");
console.log(" - partial approval remains blocked");
console.log(" - synthetic all-approved state proves readiness mechanics without live economics");
console.log(" - Build 372 grants no operational, payment-provider, or persistence authority");
