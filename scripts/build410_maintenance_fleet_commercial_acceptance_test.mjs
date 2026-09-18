import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCapacityCalendarIntelligence } from "../functions/api/_lib/capacity-calendar-intelligence.js";
import {
  buildMaintenanceFleetCommercialAcceptance,
  evaluateFleetQuoteEvidence
} from "../functions/api/_lib/maintenance-fleet-commercial-acceptance.js";

const maintenanceRulebook = JSON.parse(
  fs.readFileSync(new URL("../config/maintenance-plan-business-rulebook.json", import.meta.url), "utf8")
);
const fleetRulebook = JSON.parse(
  fs.readFileSync(new URL("../config/fleet-business-rulebook.json", import.meta.url), "utf8")
);

const capacity = buildCapacityCalendarIntelligence({
  AM: true,
  PM: true,
  blocked: false,
  requestedStartSlot: "AM",
  requestedDurationSlots: 1
});

const current = buildMaintenanceFleetCommercialAcceptance({
  maintenance_rulebook: maintenanceRulebook,
  fleet_rulebook: fleetRulebook,
  capacity_contract: capacity.contract,
  fleet_quotes: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      status: "draft",
      quoted_amount_cents: 0,
      accepted_amount_cents: 0,
      accepted_at: null,
      sent_at: null
    }
  ]
});

assert.equal(current.build, 410);
assert.equal(current.source_acceptance.status, "ready");
assert.equal(current.source_acceptance.safe_to_promote_source, true);
assert.equal(current.business_readiness.status, "owner_action");
assert.equal(current.business_readiness.source_release_green_is_not_business_approval, true);
assert.equal(current.maintenance.commercial_terms_ready, false);
assert.equal(current.maintenance.unapproved_domains.length, 7);
assert.equal(current.maintenance.automatic_enrollment_allowed, false);
assert.equal(current.maintenance.recurring_billing_allowed, false);
assert.equal(current.fleet.commercial_terms_ready, false);
assert.equal(current.fleet.unapproved_domains.length, 6);
assert.equal(current.fleet.automatic_discount_application_allowed, false);
assert.equal(current.fleet.booking_creation_allowed, false);
assert.equal(current.capacity.status, "source_ready");
assert.equal(current.capacity.live_slot_availability_inferred, false);
assert.equal(current.capacity.capacity_reservation_inferred, false);
assert.equal(current.fleet_quote_evidence.draft_quotes, 1);
assert.equal(current.fleet_quote_evidence.explicitly_accepted_quotes, 0);
assert.equal(current.fleet_quote_evidence.customer_commitment_inferred, false);
assert.equal(current.boundaries.automatic_outreach_allowed, false);
assert.equal(current.boundaries.automatic_booking_allowed, false);
assert.equal(current.boundaries.provider_mutation_allowed, false);

const unsafeMaintenance = structuredClone(maintenanceRulebook);
unsafeMaintenance.activation.plan_enabled = true;
const unsafeMaintenanceResult = buildMaintenanceFleetCommercialAcceptance({
  maintenance_rulebook: unsafeMaintenance,
  fleet_rulebook: fleetRulebook,
  capacity_contract: capacity.contract
});
assert.equal(unsafeMaintenanceResult.source_acceptance.status, "review");
assert.ok(
  unsafeMaintenanceResult.source_acceptance.reasons.some((reason) =>
    reason.includes("Maintenance activation cannot be enabled")
  )
);

const unsafeFleet = structuredClone(fleetRulebook);
unsafeFleet.operational_authority.automatic_discount_application_allowed = true;
const unsafeFleetResult = buildMaintenanceFleetCommercialAcceptance({
  maintenance_rulebook: maintenanceRulebook,
  fleet_rulebook: unsafeFleet,
  capacity_contract: capacity.contract
});
assert.equal(unsafeFleetResult.source_acceptance.status, "review");
assert.ok(
  unsafeFleetResult.source_acceptance.reasons.some((reason) =>
    reason.includes("Fleet operational authority cannot be enabled")
  )
);

const unsafeCapacity = {
  ...capacity.contract,
  collision_revalidation_authority: "/api/admin/booking_availability"
};
const unsafeCapacityResult = buildMaintenanceFleetCommercialAcceptance({
  maintenance_rulebook: maintenanceRulebook,
  fleet_rulebook: fleetRulebook,
  capacity_contract: unsafeCapacity
});
assert.equal(unsafeCapacityResult.source_acceptance.status, "review");
assert.equal(unsafeCapacityResult.capacity.source_contract_safe, false);

const quoteEvidence = evaluateFleetQuoteEvidence([
  {
    id: "22222222-2222-4222-8222-222222222222",
    status: "sent",
    quoted_amount_cents: 45000,
    accepted_amount_cents: 0,
    sent_at: "2026-09-18T12:00:00Z",
    accepted_at: null
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    status: "accepted",
    quoted_amount_cents: 60000,
    accepted_amount_cents: 60000,
    sent_at: "2026-09-18T12:00:00Z",
    accepted_at: "2026-09-18T13:00:00Z"
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    status: "accepted",
    quoted_amount_cents: 0,
    accepted_amount_cents: 0,
    accepted_at: null
  }
]);
assert.equal(quoteEvidence.sent_quotes, 2);
assert.equal(quoteEvidence.explicitly_accepted_quotes, 1);
assert.equal(quoteEvidence.explicitly_accepted_value_cents, 60000);
assert.equal(quoteEvidence.review_reasons.length, 1);
assert.equal(quoteEvidence.sent_is_customer_commitment, false);
assert.equal(quoteEvidence.accepted_status_requires_timestamp_and_recorded_amounts, true);

const approvedMaintenance = structuredClone(maintenanceRulebook);
for (const value of Object.values(approvedMaintenance.decisions)) value.approved = true;
approvedMaintenance.decisions.cadence.allowed_intervals = [28];
approvedMaintenance.decisions.price.pricing_model = "fixed_vehicle_plan";
approvedMaintenance.decisions.price.amount_cents = 19900;
approvedMaintenance.decisions.inclusions.service_codes = ["complete_detail"];
approvedMaintenance.status = "approved";

const approvedFleet = structuredClone(fleetRulebook);
for (const value of Object.values(approvedFleet.decisions)) value.approved = true;
approvedFleet.decisions.fleet_minimums.minimum_vehicles = 3;
approvedFleet.decisions.service_tiers.tiers = [{ code: "standard", label: "Standard" }];
approvedFleet.decisions.travel_limits.maximum_radius_km = 80;
approvedFleet.decisions.volume_pricing.pricing_model = "approved_quote";
approvedFleet.decisions.invoicing.billing_model = "approved_quote_terms";
approvedFleet.status = "approved";

const approvedTerms = buildMaintenanceFleetCommercialAcceptance({
  maintenance_rulebook: approvedMaintenance,
  fleet_rulebook: approvedFleet,
  capacity_contract: capacity.contract,
  fleet_quotes: []
});
assert.equal(approvedTerms.source_acceptance.status, "ready");
assert.equal(approvedTerms.business_readiness.status, "ready");
assert.equal(approvedTerms.maintenance.commercial_terms_ready, true);
assert.equal(approvedTerms.fleet.commercial_terms_ready, true);
assert.equal(approvedTerms.boundaries.customer_commitment_may_be_inferred, false);

console.log("BUILD 410 MAINTENANCE / FLEET COMMERCIAL ACCEPTANCE: PASS");
console.log(" - current configured rulebooks are source-safe and truthfully remain owner_action");
console.log(" - source release GREEN is distinct from owner-approved commercial readiness");
console.log(" - capacity remains read-only under /api/availability and /api/checkout");
console.log(" - draft/sent quotes are not customer commitments; accepted evidence needs timestamp and recorded amounts");
console.log(" - automatic outreach/enrolment/booking/discount/invoice/billing/provider mutation remains prohibited");
