import assert from "node:assert/strict";
import { buildFleetCommercialOperationsLearning } from "../functions/api/_lib/fleet-commercial-operations-learning.js";

const learning = buildFleetCommercialOperationsLearning({
  fleet_leads: [
    { status: "new", vehicle_count: 4, preferred_cadence: "monthly", service_area: "Tillsonburg" },
    { status: "quoted", vehicle_count: 8, preferred_cadence: "monthly", service_area: "Woodstock" },
    { status: "converted", vehicle_count: 3, preferred_cadence: "quarterly", service_area: "Tillsonburg" }
  ],
  fleet_accounts: [
    { contract_status: "active" },
    { contract_status: "prospect" }
  ],
  fleet_vehicles: [
    { active: true },
    { active: true },
    { active: false }
  ],
  request_groups: [
    { status: "completed" },
    { status: "scheduled" }
  ],
  request_jobs: [
    { booking_id: "b1", service_request: "Interior detail", status: "completed" },
    { booking_id: "b2", service_request: "Interior detail", status: "scheduled" },
    { service_request: "Exterior wash", status: "planning" }
  ],
  service_history: [
    { booking_id: "b1", service_summary: "Interior detail", serviced_at: "2026-08-01T12:00:00Z" }
  ],
  rulebook_status: "awaiting_business_approval",
  required_rulebook_domains: ["fleet_minimums","service_tiers","travel_limits","volume_pricing","invoicing","cancellation"],
  approved_rulebook_domains: [],
  unresolved_rulebook_domains: ["fleet_minimums","service_tiers","travel_limits","volume_pricing","invoicing","cancellation"],
  operational_authority: {
    fleet_account_activation_allowed: false,
    automatic_discount_application_allowed: false,
    invoice_creation_allowed: false,
    booking_creation_allowed: false,
    recurring_billing_allowed: false,
    provider_mutation_allowed: false,
    database_mutation_allowed: false
  }
});

assert.equal(learning.build, 430);
assert.equal(learning.mode, "fleet_commercial_operations_learning");
assert.equal(learning.evidence_status, "owner_action");
assert.equal(learning.inquiry_demand.inquiry_count, 3);
assert.equal(learning.inquiry_demand.vehicles_requested, 15);
assert.equal(learning.inquiry_demand.converted_inquiry_count, 1);
assert.equal(learning.inquiry_demand.signed_business_claim, false);
assert.equal(learning.commercial_rules.status, "owner_action");
assert.equal(learning.commercial_rules.unresolved_domain_count, 6);
assert.equal(learning.operations.fleet_account_count, 2);
assert.equal(learning.operations.active_vehicle_count, 2);
assert.equal(learning.operations.jobs_linked_to_booking, 2);
assert.equal(learning.operations.completed_request_jobs, 1);
assert.equal(learning.operations.service_history_count, 1);
assert.equal(learning.operations.service_mix[0].service, "Interior detail");
assert.equal(learning.operations.service_mix[0].count, 3);
assert.equal(learning.capacity.status, "unavailable");
assert.equal(learning.capacity.current_live_capacity_inferred, false);
assert.equal(learning.boundaries.signed_commercial_business_inferred, false);
assert.equal(learning.boundaries.fleet_discount_inferred, false);
assert.equal(learning.boundaries.invoice_creation_allowed, false);
assert.equal(learning.boundaries.booking_creation_allowed, false);
assert.equal(learning.boundaries.payment_provider_mutation_allowed, false);
assert.equal(learning.boundaries.schema_authority, false);

const ready = buildFleetCommercialOperationsLearning({
  fleet_leads: [{ status: "converted", vehicle_count: 5 }],
  fleet_accounts: [{ contract_status: "active" }],
  fleet_vehicles: [{ active: true }],
  request_groups: [{ status: "completed" }],
  request_jobs: [{ booking_id: "b1", service_request: "Fleet wash", status: "completed" }],
  service_history: [{ booking_id: "b1", service_summary: "Fleet wash" }],
  rulebook_status: "rules_ready",
  required_rulebook_domains: ["fleet_minimums"],
  approved_rulebook_domains: ["fleet_minimums"],
  unresolved_rulebook_domains: []
});
assert.equal(ready.evidence_status, "ready");
assert.equal(ready.commercial_rules.status, "rules_ready");
assert.equal(ready.capacity.status, "unavailable");

const unavailable = buildFleetCommercialOperationsLearning({
  rulebook_status: "awaiting_business_approval",
  required_rulebook_domains: ["fleet_minimums"],
  unresolved_rulebook_domains: ["fleet_minimums"]
});
assert.equal(unavailable.evidence_status, "unavailable");

console.log("FLEET & COMMERCIAL OPERATIONS LEARNING TEST: PASS");
console.log(" - inquiry volume remains demand evidence, not signed commercial business");
console.log(" - unresolved rulebook domains remain owner_action");
console.log(" - service history and request jobs are aggregate completed-work evidence only");
console.log(" - live capacity remains unavailable and subordinate to /api/availability and /api/checkout");
console.log(" - no discount, invoice, booking, outreach, provider, accounting or schema mutation is authorized");
