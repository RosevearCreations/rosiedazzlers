import assert from "node:assert/strict";
import {buildMaintenanceFleetOwnerApprovalConvergence} from "../functions/api/_lib/maintenance-fleet-owner-approval.js";

const blocked=buildMaintenanceFleetOwnerApprovalConvergence({
  commercial_activation:{
    maintenance:{rulebook_status:"awaiting_business_approval"},
    fleet:{rulebook_status:"awaiting_business_approval"}
  },
  fleet_learning:{
    commercial_rules:{source_status:"awaiting_business_approval"},
    capacity:{status:"source_ready",availability_authority:"/api/availability",collision_revalidation_authority:"/api/checkout"}
  }
});

assert.equal(blocked.pilot_decision_build,479);
assert.equal(blocked.pilot_decision_authority,"maintenance_fleet_owner_approval_pilot_decision");
assert.equal(blocked.pilot_decision_record.status,"owner_action");
assert.equal(blocked.pilot_decision_record.decision,"not_recorded");
assert.equal(blocked.pilot_decision_record.owner_decision_recorded,false);
assert.equal(blocked.pilot_decision_record.owner_pilot_authorization_recorded,false);
assert.equal(blocked.pilot_decision_record.owner_bounds.participant_limit,null);
assert.equal(blocked.pilot_decision_record.owner_bounds.duration_days,null);
assert.equal(blocked.pilot_decision_record.owner_bounds.complete,false);
assert.equal(blocked.pilot_decision_record.participant_selection.mode,"manual");
assert.equal(blocked.pilot_decision_record.participant_selection.automatic_selection_allowed,false);
assert.equal(blocked.pilot_decision_record.participant_selection.customer_auto_enrollment_allowed,false);
assert.equal(blocked.pilot_decision_record.booking_safeguards.availability_authority,"/api/availability");
assert.equal(blocked.pilot_decision_record.booking_safeguards.collision_revalidation_authority,"/api/checkout");
assert.equal(blocked.pilot_decision_record.booking_safeguards.capacity_reservation_allowed,false);
assert.equal(blocked.pilot_decision_record.pilot_activation_allowed,false);
assert.equal(blocked.pilot_decision_record.recurring_commitment_activation_allowed,false);
assert.equal(blocked.pilot_decision_record.canonical_hold_mutated,false);

const reviewReady=buildMaintenanceFleetOwnerApprovalConvergence({
  commercial_activation:{
    maintenance:{rulebook_status:"rules_ready"},
    fleet:{rulebook_status:"rules_ready"}
  },
  fleet_learning:{
    commercial_rules:{source_status:"rules_ready"},
    capacity:{status:"source_ready",availability_authority:"/api/availability",collision_revalidation_authority:"/api/checkout"}
  },
  pilot_decision:{decision:"approve",participant_limit:3,duration_days:30}
});

assert.equal(reviewReady.controlled_pilot_readiness.status,"operator_review_ready");
assert.equal(reviewReady.pilot_decision_record.status,"pilot_decision_recorded");
assert.equal(reviewReady.pilot_decision_record.decision,"approve");
assert.equal(reviewReady.pilot_decision_record.owner_decision_recorded,true);
assert.equal(reviewReady.pilot_decision_record.owner_pilot_authorization_recorded,true);
assert.equal(reviewReady.pilot_decision_record.owner_bounds.participant_limit,3);
assert.equal(reviewReady.pilot_decision_record.owner_bounds.duration_days,30);
assert.equal(reviewReady.pilot_decision_record.owner_bounds.complete,true);
assert.equal(reviewReady.pilot_decision_record.decision_record_ready,true);
assert.equal(reviewReady.pilot_decision_record.pilot_activation_allowed,false);
assert.equal(reviewReady.boundaries.pilot_decision_record_write_available,false);
assert.equal(reviewReady.boundaries.automatic_owner_pilot_decision_allowed,false);
assert.equal(reviewReady.boundaries.capacity_reservation_allowed,false);

const explicitHold=buildMaintenanceFleetOwnerApprovalConvergence({
  commercial_activation:{
    maintenance:{rulebook_status:"rules_ready"},
    fleet:{rulebook_status:"rules_ready"}
  },
  fleet_learning:{commercial_rules:{source_status:"rules_ready"}},
  pilot_decision:{decision:"hold",participant_limit:4,duration_days:14}
});
assert.equal(explicitHold.pilot_decision_record.owner_decision_recorded,true);
assert.equal(explicitHold.pilot_decision_record.owner_pilot_authorization_recorded,false);
assert.equal(explicitHold.pilot_decision_record.status,"owner_action");
assert.equal(explicitHold.pilot_decision_record.pilot_activation_allowed,false);

console.log("MAINTENANCE & FLEET OWNER APPROVAL & PILOT DECISION TEST: PASS");
