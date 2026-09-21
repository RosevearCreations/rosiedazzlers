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
assert.equal(blocked.controlled_pilot_readiness_build,469);
assert.equal(blocked.controlled_pilot_authority,"maintenance_fleet_controlled_pilot_activation_readiness");
assert.equal(blocked.controlled_pilot_readiness.status,"owner_action");
assert.equal(blocked.controlled_pilot_readiness.decision_package_ready,false);
assert.equal(blocked.controlled_pilot_readiness.commercial_terms_ready,false);
assert.equal(blocked.controlled_pilot_readiness.owner_pilot_authorization_required,true);
assert.equal(blocked.controlled_pilot_readiness.owner_pilot_authorization_recorded,false);
assert.equal(blocked.controlled_pilot_readiness.pilot_activation_allowed,false);
assert.equal(blocked.controlled_pilot_readiness.customer_facing_automation_allowed,false);
assert.equal(blocked.controlled_pilot_readiness.participant_selection_is_manual,true);
assert.equal(blocked.controlled_pilot_readiness.current_date_slot_must_be_revalidated,true);
assert.equal(blocked.controlled_pilot_readiness.availability_authority,"/api/availability");
assert.equal(blocked.controlled_pilot_readiness.collision_revalidation_authority,"/api/checkout");
assert.equal(blocked.controlled_pilot_readiness.bounds.participant_limit,null);
assert.equal(blocked.controlled_pilot_readiness.bounds.duration_days,null);
assert.equal(blocked.controlled_pilot_readiness.participant_limit_inferred,false);
assert.equal(blocked.controlled_pilot_readiness.pilot_duration_inferred,false);
assert.equal(blocked.controlled_pilot_readiness.live_capacity_inferred,false);
assert.equal(blocked.controlled_pilot_readiness.capacity_reservation_performed,false);

const ready=buildMaintenanceFleetOwnerApprovalConvergence({
  commercial_activation:{
    maintenance:{rulebook_status:"rules_ready"},
    fleet:{rulebook_status:"rules_ready"}
  },
  fleet_learning:{
    commercial_rules:{source_status:"rules_ready"},
    capacity:{status:"source_ready",availability_authority:"/api/availability",collision_revalidation_authority:"/api/checkout"}
  }
});
assert.equal(ready.activation_readiness.status,"operator_review_ready");
assert.equal(ready.controlled_pilot_readiness.status,"operator_review_ready");
assert.equal(ready.controlled_pilot_readiness.decision_package_ready,true);
assert.equal(ready.controlled_pilot_readiness.commercial_terms_ready,true);
assert.equal(ready.controlled_pilot_readiness.eligibility_source_approved,true);
assert.equal(ready.controlled_pilot_readiness.source_approved_term_count,7);
assert.equal(ready.controlled_pilot_readiness.owner_action_term_ids.length,0);
assert.equal(ready.controlled_pilot_readiness.owner_pilot_authorization_recorded,false);
assert.equal(ready.controlled_pilot_readiness.pilot_activation_allowed,false);
assert.equal(ready.controlled_pilot_readiness.service_area_expansion_allowed,false);
assert.equal(ready.controlled_pilot_readiness.guaranteed_capacity_allowed,false);
assert.equal(ready.controlled_pilot_readiness.price_override_allowed,false);
assert.equal(ready.controlled_pilot_readiness.discount_override_allowed,false);
assert.equal(ready.controlled_pilot_readiness.invoice_term_override_allowed,false);
assert.equal(ready.controlled_pilot_readiness.recurring_billing_allowed,false);
assert.equal(ready.boundaries.controlled_pilot_activation_allowed,false);
assert.equal(ready.boundaries.automatic_pilot_participant_selection_allowed,false);
assert.equal(ready.boundaries.customer_facing_automation_allowed,false);
assert.ok(ready.controlled_pilot_readiness.safeguards.some(row=>row.id==="checkout_collision_revalidation"));

console.log("MAINTENANCE & FLEET CONTROLLED PILOT ACTIVATION READINESS TEST: PASS");
