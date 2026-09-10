import fs from 'node:fs';
import assert from 'node:assert/strict';
import { evaluateMaintenancePlanPilot, maintenancePlanPilotRequiredDomains } from '../functions/api/_lib/maintenance-plan-pilot.js';

const rulebook = JSON.parse(fs.readFileSync(new URL('../config/maintenance-plan-business-rulebook.json', import.meta.url), 'utf8'));

assert.deepEqual(maintenancePlanPilotRequiredDomains(), [
  'eligibility', 'cadence', 'price', 'inclusions', 'exclusions', 'cancellation', 'priority'
]);

const blocked = evaluateMaintenancePlanPilot({
  rulebook,
  customer: { id: 'customer-1' },
  vehicle: { id: 'vehicle-1', customer_id: 'customer-1' },
  activation_requested: true
});
assert.equal(blocked.can_activate, false);
assert.equal(blocked.mode, 'prepared_fail_closed');
assert.equal(blocked.unapproved_domains.length, 7);
assert.equal(blocked.mutation_authority, false);
assert.equal(blocked.provider_mutation_authority, false);
assert.equal(blocked.recurring_billing_allowed, false);
assert.equal(blocked.automatic_renewal_allowed, false);
assert.equal(blocked.guaranteed_priority_allowed, false);
assert.ok(blocked.pending.some((message) => message.includes('Pilot enrolment remains disabled')));

const missingVehicle = evaluateMaintenancePlanPilot({
  rulebook,
  customer: { id: 'customer-1' },
  activation_requested: true
});
assert.equal(missingVehicle.can_activate, false);
assert.ok(missingVehicle.pending.includes('Canonical vehicle identity is required.'));

const wrongOwner = evaluateMaintenancePlanPilot({
  rulebook,
  customer: { id: 'customer-1' },
  vehicle: { id: 'vehicle-1', customer_id: 'customer-2' },
  activation_requested: true
});
assert.equal(wrongOwner.can_activate, false);
assert.equal(wrongOwner.vehicle_belongs_to_customer, false);
assert.ok(wrongOwner.pending.some((message) => message.includes('Vehicle must belong')));

const noIntent = evaluateMaintenancePlanPilot({
  rulebook,
  customer: { id: 'customer-1' },
  vehicle: { id: 'vehicle-1', customer_id: 'customer-1' }
});
assert.equal(noIntent.can_activate, false);
assert.ok(noIntent.pending.some((message) => message.includes('Explicit staff activation intent')));

const approvedRulebook = structuredClone(rulebook);
for (const domain of maintenancePlanPilotRequiredDomains()) approvedRulebook.decisions[domain].approved = true;
approvedRulebook.activation.pilot_enrollment_allowed = true;
approvedRulebook.activation.plan_enabled = true;
const mechanicallyReady = evaluateMaintenancePlanPilot({
  rulebook: approvedRulebook,
  customer: { id: 'customer-1' },
  vehicle: { id: 'vehicle-1', customer_id: 'customer-1' },
  activation_requested: true
});
assert.equal(mechanicallyReady.can_activate, true);
assert.equal(mechanicallyReady.mode, 'approved_for_pilot_activation');
assert.equal(mechanicallyReady.mutation_authority, false);
assert.equal(mechanicallyReady.provider_mutation_authority, false);
assert.equal(mechanicallyReady.recurring_billing_allowed, false);
assert.equal(mechanicallyReady.automatic_renewal_allowed, false);

console.log('MAINTENANCE PLAN PILOT ACTIVATION TEST: PASS');
console.log(' - current Build 370 rulebook remains fail closed');
console.log(' - canonical customer and vehicle identity are required');
console.log(' - explicit activation intent is required');
console.log(' - evaluator grants no persistence, booking, billing or provider mutation authority');
