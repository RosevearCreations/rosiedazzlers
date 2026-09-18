import assert from "node:assert/strict";
import { buildCommercialActivationState } from "../functions/api/_lib/retention-maintenance-fleet-activation.js";
import { buildRetentionMaintenanceFleetOperationalPilot } from "../functions/api/_lib/retention-maintenance-fleet-operational-pilot.js";

const heldActivation = buildCommercialActivationState({
  maintenance_metrics: {
    total: 4,
    new: 1,
    contacted: 1,
    interested: 2,
    closed: 0,
    unsubscribed: 0
  },
  fleet_metrics: {
    total: 3,
    new: 1,
    reviewing: 1,
    contacted: 0,
    quoted: 1,
    converted: 0,
    closed: 0,
    vehicles_requested: 11
  },
  maintenance_rulebook_status: "awaiting_business_approval",
  fleet_rulebook_status: "awaiting_business_approval"
});

const held = buildRetentionMaintenanceFleetOperationalPilot({
  commercial_activation: heldActivation
});

assert.equal(held.build, 421);
assert.equal(held.mode, "retention_maintenance_fleet_operational_pilot");
assert.equal(held.source_acceptance.status, "ready");
assert.equal(held.source_acceptance.safe_to_promote_source, true);
assert.equal(held.pilot_readiness.status, "owner_action");
assert.equal(held.pilot_readiness.source_release_green_is_not_pilot_approval, true);
assert.equal(held.maintenance.status, "owner_action");
assert.equal(held.fleet.status, "owner_action");
assert.equal(held.maintenance.metrics.interested, 2);
assert.equal(held.fleet.metrics.vehicles_requested, 11);
assert.equal(held.capacity.availability_authority, "/api/availability");
assert.equal(held.capacity.collision_revalidation_authority, "/api/checkout");
assert.equal(held.capacity.current_date_slot_must_be_revalidated, true);
assert.equal(held.boundaries.automatic_outreach_allowed, false);
assert.equal(held.boundaries.automatic_booking_allowed, false);
assert.equal(held.boundaries.automatic_discount_application_allowed, false);
assert.equal(held.boundaries.automatic_invoice_creation_allowed, false);
assert.equal(held.boundaries.automatic_recurring_billing_allowed, false);
assert.equal(held.boundaries.provider_mutation_allowed, false);
assert.equal(held.boundaries.source_release_green_may_coexist_with_pilot_hold, true);

const preparedActivation = buildCommercialActivationState({
  maintenance_rulebook_status: "rules_ready",
  fleet_rulebook_status: "rules_ready",
  maintenance_metrics: { interested: 1 },
  fleet_metrics: { reviewing: 1, vehicles_requested: 4 }
});

const prepared = buildRetentionMaintenanceFleetOperationalPilot({
  commercial_activation: preparedActivation
});

assert.equal(prepared.source_acceptance.status, "ready");
assert.equal(prepared.pilot_readiness.status, "ready_for_bounded_operator_pilot");
assert.equal(prepared.maintenance.status, "prepared_for_manual_selection");
assert.equal(prepared.fleet.status, "prepared_for_manual_selection");
assert.equal(prepared.pilot_readiness.participant_selection_is_manual, true);
assert.equal(prepared.pilot_readiness.customer_commitment_inferred, false);
assert.equal(prepared.pilot_readiness.fleet_commitment_inferred, false);

const unsafeActivation = structuredClone(preparedActivation);
unsafeActivation.boundaries.automatic_outreach_allowed = true;
const unsafe = buildRetentionMaintenanceFleetOperationalPilot({
  commercial_activation: unsafeActivation
});

assert.equal(unsafe.source_acceptance.status, "review");
assert.equal(unsafe.pilot_readiness.status, "review");
assert.ok(unsafe.source_acceptance.reasons.some((reason) => reason.includes("Automatic outreach")));

console.log("RETENTION / MAINTENANCE / FLEET OPERATIONAL PILOT TEST: PASS");
console.log(" - current unapproved commercial terms remain owner_action rather than fabricated pilot readiness");
console.log(" - approved terms can only prepare manual participant selection; no participant or commitment is inferred");
console.log(" - capacity remains subordinate to /api/availability and /api/checkout");
console.log(" - automatic outreach, booking, discounts, invoicing, recurring billing and provider mutation remain prohibited");
