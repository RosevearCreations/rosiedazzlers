import assert from "node:assert/strict";
import {
  buildCommercialActivationState,
  maintenanceActivationMetrics,
  fleetActivationMetrics
} from "../functions/api/_lib/retention-maintenance-fleet-activation.js";

const maintenance = maintenanceActivationMetrics([
  { status: "new" },
  { status: "interested" },
  { status: "unsubscribed" }
]);
assert.deepEqual(maintenance, {
  total: 3,
  new: 1,
  contacted: 0,
  interested: 1,
  closed: 0,
  unsubscribed: 1
});

const fleet = fleetActivationMetrics([
  { status: "new", vehicle_count: 4 },
  { status: "reviewing", vehicle_count: 3 },
  { status: "quoted", vehicle_count: 2 }
]);
assert.equal(fleet.total, 3);
assert.equal(fleet.new, 1);
assert.equal(fleet.reviewing, 1);
assert.equal(fleet.quoted, 1);
assert.equal(fleet.vehicles_requested, 9);

const blocked = buildCommercialActivationState({
  maintenance_metrics: maintenance,
  fleet_metrics: fleet,
  maintenance_rulebook_status: "awaiting_business_approval",
  fleet_rulebook_status: "awaiting_business_approval"
});
assert.equal(blocked.build, 392);
assert.equal(blocked.maintenance.commercial_terms_ready, false);
assert.equal(blocked.fleet.commercial_terms_ready, false);
assert.equal(blocked.maintenance.next_operator_action, "review_new_maintenance_interest");
assert.equal(blocked.fleet.next_operator_action, "review_new_fleet_assessment");
assert.equal(blocked.boundaries.read_only_activation_overview, true);
assert.equal(blocked.boundaries.commercial_terms_may_be_inferred, false);
assert.equal(blocked.boundaries.automatic_outreach_allowed, false);
assert.equal(blocked.boundaries.automatic_discount_application_allowed, false);
assert.equal(blocked.boundaries.recurring_billing_allowed, false);
assert.equal(blocked.boundaries.provider_mutation_allowed, false);
for (const action of ["recurring_billing", "automatic_discount_application", "provider_mutation"]) {
  assert.ok(blocked.maintenance.locked_actions.includes(action));
  assert.ok(blocked.fleet.locked_actions.includes(action));
}

const approvedTerms = buildCommercialActivationState({
  maintenance_rulebook_status: "rules_ready",
  fleet_rulebook_status: "rules_ready"
});
assert.equal(approvedTerms.maintenance.commercial_terms_ready, true);
assert.equal(approvedTerms.fleet.commercial_terms_ready, true);
assert.equal(approvedTerms.boundaries.recurring_billing_allowed, false);
assert.equal(approvedTerms.boundaries.provider_mutation_allowed, false);
assert.equal(approvedTerms.boundaries.commercial_terms_may_be_inferred, false);

console.log("BUILD 392 RETENTION / MAINTENANCE / FLEET COMMERCIAL ACTIVATION: PASS");
console.log(" - live interest and fleet queues produce deterministic operator priorities");
console.log(" - existing customer inquiry/waitlist paths remain canonical");
console.log(" - unresolved commercial terms fail closed");
console.log(" - automatic outreach, discounts, recurring billing and provider mutation remain prohibited");
