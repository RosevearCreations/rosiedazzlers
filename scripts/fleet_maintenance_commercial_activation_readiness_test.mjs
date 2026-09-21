import assert from "node:assert/strict";
import {buildMaintenanceFleetOwnerApprovalConvergence} from "../functions/api/_lib/maintenance-fleet-owner-approval.js";

const blocked=buildMaintenanceFleetOwnerApprovalConvergence({
  commercial_activation:{
    maintenance:{rulebook_status:"awaiting_business_approval",metrics:{total:8,interested:3}},
    fleet:{rulebook_status:"awaiting_business_approval",metrics:{total:4,vehicles_requested:18}}
  },
  fleet_learning:{
    commercial_rules:{source_status:"awaiting_business_approval"},
    capacity:{status:"source_ready",availability_authority:"/api/availability",collision_revalidation_authority:"/api/checkout"}
  }
});
assert.equal(blocked.current_build,449);
assert.equal(blocked.activation_readiness_build,459);
assert.equal(blocked.activation_authority,"fleet_maintenance_commercial_activation_readiness");
assert.equal(blocked.activation_readiness.status,"owner_action");
assert.equal(blocked.activation_readiness.readiness_candidate,false);
assert.equal(blocked.activation_readiness.required_term_count,7);
assert.equal(blocked.activation_readiness.source_approved_term_count,0);
assert.equal(blocked.activation_readiness.owner_action_term_count,7);
assert.equal(blocked.activation_readiness.activation_allowed,false);
assert.equal(blocked.activation_readiness.automatic_activation_performed,false);
assert.equal(blocked.activation_readiness.live_capacity_inferred,false);
assert.equal(blocked.activation_readiness.capacity_reservation_performed,false);
assert.deepEqual(blocked.activation_readiness.owner_action_term_ids.sort(),["fleet_discount","fleet_invoicing","fleet_travel","maintenance_cadence","maintenance_capacity","maintenance_eligibility","maintenance_price"].sort());

const ready=buildMaintenanceFleetOwnerApprovalConvergence({
  commercial_activation:{maintenance:{rulebook_status:"rules_ready"},fleet:{rulebook_status:"rules_ready"}},
  fleet_learning:{commercial_rules:{source_status:"rules_ready"},capacity:{status:"source_ready",availability_authority:"/api/availability",collision_revalidation_authority:"/api/checkout"}}
});
assert.equal(ready.decision_closure.closure_candidate,true);
assert.equal(ready.activation_readiness.status,"operator_review_ready");
assert.equal(ready.activation_readiness.readiness_candidate,true);
assert.equal(ready.activation_readiness.source_approved_term_count,7);
assert.equal(ready.activation_readiness.all_commercial_domains_source_approved,true);
assert.equal(ready.activation_readiness.owner_review_required,true);
assert.equal(ready.activation_readiness.activation_authorization_separate,true);
assert.equal(ready.activation_readiness.activation_allowed,false);
assert.equal(ready.activation_readiness.terms.every(row=>row.owner_approved===true),true);
assert.equal(ready.boundaries.automatic_discount_allowed,false);
assert.equal(ready.boundaries.booking_creation_allowed,false);
assert.equal(ready.boundaries.invoice_creation_allowed,false);
assert.equal(ready.boundaries.recurring_billing_allowed,false);
assert.equal(ready.boundaries.provider_mutation_allowed,false);

console.log("FLEET & MAINTENANCE COMMERCIAL ACTIVATION READINESS TEST: PASS");
