#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildMaintenanceFleetPilotOutcomeContinuityReview } from "../functions/api/_lib/maintenance-fleet-pilot-outcome-continuity-review.js";

const ownerAction=buildMaintenanceFleetPilotOutcomeContinuityReview({
  pilot_outcome_evidence:{
    build:491,authority:"maintenance_fleet_pilot_outcome_evidence",
    status:"owner_action_authorization_required",
    authorization:{attributable_outcome_capture_allowed:false},
    execution_source:{available:false,attributed_row_count:0},
    participants:{bound_satisfied:false},duration:{bound_satisfied:false},
    capacity:{},invoicing:{},travel:{},stop_conditions:{},rows:[]
  },
  generated_at:"2026-09-25T12:00:00Z"
});
assert.equal(ownerAction.continuity_review_build,501);
assert.equal(ownerAction.status,"owner_action_authorization_required");
assert.equal(ownerAction.execution_continuity.historical_outcome_carry_forward_used,false);
assert.equal(ownerAction.truth_boundary.recurring_billing_enabled,false);

const readyOutcome={
  build:491,authority:"maintenance_fleet_pilot_outcome_evidence",
  status:"bounded_pilot_outcome_review_ready",
  authorization:{attributable_outcome_capture_allowed:true,participant_limit:2,duration_days:14},
  execution_source:{available:true,attributed_row_count:2},
  participants:{observed_count:2,participant_limit:2,bound_satisfied:true},
  duration:{observed_duration_days:7,authorized_duration_days:14,bound_satisfied:true},
  capacity:{availability_revalidation_observed_count:2,checkout_revalidation_observed_count:2,every_attributed_row_has_capacity_evidence:true},
  invoicing:{observed_count:2,every_attributed_row_has_invoice_evidence:true},
  travel:{observed_count:2,observed_distance_km:51,every_attributed_row_has_travel_evidence:true},
  stop_conditions:{observed_count:2,triggered_count:0,every_attributed_row_has_stop_condition_evidence:true},
  rows:[
    {evidence_id:"pilot-1",participant_ref:"maintenance-001",participant_type:"maintenance",started_at:"2026-09-01T12:00:00Z",ended_at:"2026-09-04T12:00:00Z",availability_revalidated_at:"2026-09-01T11:00:00Z",checkout_revalidated_at:"2026-09-01T11:30:00Z",invoice:{status:"issued"},travel:{distance_km:18.4},stop_condition:{triggered:false,reason:"none"}},
    {evidence_id:"pilot-2",participant_ref:"fleet-001",participant_type:"fleet",started_at:"2026-09-02T12:00:00Z",ended_at:"2026-09-08T12:00:00Z",availability_revalidated_at:"2026-09-02T11:00:00Z",checkout_revalidated_at:"2026-09-02T11:30:00Z",invoice:{status:"issued"},travel:{distance_km:32.6},stop_condition:{triggered:false,reason:"none"}}
  ]
};
const ready=buildMaintenanceFleetPilotOutcomeContinuityReview({pilot_outcome_evidence:readyOutcome});
assert.equal(ready.status,"bounded_pilot_continuity_review_ready");
assert.equal(ready.outcome_dimensions.evidence_complete,true);
assert.equal(ready.continuity_decision.review_ready,true);
assert.equal(ready.continuity_decision.continue_pilot_authorized,false);
assert.equal(ready.truth_boundary.capacity_reserved,false);
assert.match(ready.execution_continuity.evidence_trace_key,/pilot-1/);

const stopped=structuredClone(readyOutcome);
stopped.stop_conditions.triggered_count=1;
stopped.rows[1].stop_condition={triggered:true,reason:"owner stop condition"};
const stopReview=buildMaintenanceFleetPilotOutcomeContinuityReview({pilot_outcome_evidence:stopped});
assert.equal(stopReview.status,"pilot_stop_condition_review_required");
assert.equal(stopReview.outcome_dimensions.stop_condition_review_required,true);
assert.equal(stopReview.continuity_decision.continue_pilot_authorized,false);
assert.equal(stopReview.truth_boundary.stop_action_executed,false);

const outOfBounds=structuredClone(readyOutcome);
outOfBounds.participants={observed_count:3,participant_limit:2,bound_satisfied:false};
const boundsReview=buildMaintenanceFleetPilotOutcomeContinuityReview({pilot_outcome_evidence:outOfBounds});
assert.equal(boundsReview.status,"pilot_bounds_review_required");

const incomplete=structuredClone(readyOutcome);
incomplete.status="outcome_evidence_incomplete";
incomplete.capacity.every_attributed_row_has_capacity_evidence=false;
const missing=buildMaintenanceFleetPilotOutcomeContinuityReview({pilot_outcome_evidence:incomplete});
assert.equal(missing.status,"continuity_review_incomplete");
assert.equal(missing.outcome_dimensions.evidence_complete,false);

const unavailable=buildMaintenanceFleetPilotOutcomeContinuityReview({pilot_outcome_evidence:{}});
assert.equal(unavailable.status,"continuity_source_unavailable");
assert.equal(unavailable.truth_boundary.canonical_hold_mutated,false);
assert.equal(unavailable.truth_boundary.permanent_polling,false);

console.log("BUILD 501 MAINTENANCE & FLEET PILOT OUTCOME CONTINUITY REVIEW TEST: PASS");
