#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildMaintenanceFleetPilotContinuationDecision } from "../functions/api/_lib/maintenance-fleet-pilot-continuation-decision.js";

const base={
  continuity_review_build:501,
  continuity_authority:"maintenance_fleet_pilot_outcome_continuity_review",
  status:"bounded_pilot_continuity_review_ready",
  authorization_continuity:{
    attributable_outcome_capture_allowed:true,
    participant_limit:2,
    duration_days:14
  },
  execution_continuity:{
    observed_row_count:2,
    attributed_row_count:2,
    evidence_trace_key:"pilot-1:maintenance-001|pilot-2:fleet-001"
  },
  bounds:{
    participant_bound_satisfied:true,
    duration_bound_satisfied:true,
    observed_participant_count:2,
    observed_duration_days:7
  },
  outcome_dimensions:{
    capacity_revalidation_complete:true,
    invoicing_evidence_complete:true,
    travel_evidence_complete:true,
    stop_condition_evidence_complete:true,
    stop_condition_triggered_count:0,
    stop_condition_review_required:false,
    evidence_complete:true
  },
  continuity_decision:{review_ready:true,continue_pilot_authorized:false}
};

const missingDecision=buildMaintenanceFleetPilotContinuationDecision({
  pilot_outcome_continuity_review:base,
  generated_at:"2026-09-26T22:00:00Z"
});
assert.equal(missingDecision.continuation_decision_build,511);
assert.equal(missingDecision.status,"owner_action_continuation_decision_required");
assert.equal(missingDecision.evidence.continuity_review_ready,true);
assert.equal(missingDecision.decision_boundary.pilot_continuation_execution_authorized,false);
assert.equal(missingDecision.truth_boundary.recurring_billing_enabled,false);

const continueDecision=buildMaintenanceFleetPilotContinuationDecision({
  pilot_outcome_continuity_review:base,
  continuation_decision_record:{
    decision:"continue",
    decided_by:"owner-review",
    decided_at:"2026-09-26T22:15:00Z"
  }
});
assert.equal(continueDecision.status,"bounded_pilot_continuation_decision_recorded");
assert.equal(continueDecision.owner_decision.continue_decision_accepted,true);
assert.equal(continueDecision.decision_boundary.owner_decision_recorded,true);
assert.equal(continueDecision.decision_boundary.pilot_continuation_execution_authorized,false);
assert.equal(continueDecision.truth_boundary.capacity_reserved,false);

const holdDecision=buildMaintenanceFleetPilotContinuationDecision({
  pilot_outcome_continuity_review:base,
  continuation_decision_record:{
    decision:"hold",
    decided_by:"owner-review",
    decided_at:"2026-09-26T22:20:00Z"
  }
});
assert.equal(holdDecision.status,"continuation_hold_recorded");
assert.equal(holdDecision.owner_decision.hold_decision_accepted,true);

const stopped=structuredClone(base);
stopped.status="pilot_stop_condition_review_required";
stopped.outcome_dimensions.stop_condition_triggered_count=1;
stopped.outcome_dimensions.stop_condition_review_required=true;
stopped.continuity_decision.review_ready=false;
const stopResult=buildMaintenanceFleetPilotContinuationDecision({
  pilot_outcome_continuity_review:stopped,
  continuation_decision_record:{
    decision:"continue",
    decided_by:"owner-review",
    decided_at:"2026-09-26T22:25:00Z"
  }
});
assert.equal(stopResult.status,"pilot_stop_condition_review_required");
assert.equal(stopResult.owner_decision.continue_decision_accepted,false);
assert.equal(stopResult.truth_boundary.stop_action_executed,false);

const outOfBounds=structuredClone(base);
outOfBounds.bounds.participant_bound_satisfied=false;
outOfBounds.continuity_decision.review_ready=false;
const boundsResult=buildMaintenanceFleetPilotContinuationDecision({pilot_outcome_continuity_review:outOfBounds});
assert.equal(boundsResult.status,"pilot_bounds_review_required");

const incomplete=structuredClone(base);
incomplete.outcome_dimensions.capacity_revalidation_complete=false;
incomplete.outcome_dimensions.evidence_complete=false;
incomplete.continuity_decision.review_ready=false;
const incompleteResult=buildMaintenanceFleetPilotContinuationDecision({pilot_outcome_continuity_review:incomplete});
assert.equal(incompleteResult.status,"continuation_evidence_incomplete");

const unavailable=buildMaintenanceFleetPilotContinuationDecision({pilot_outcome_continuity_review:{}});
assert.equal(unavailable.status,"continuation_source_unavailable");
assert.equal(unavailable.truth_boundary.canonical_hold_mutated,false);
assert.equal(unavailable.truth_boundary.permanent_polling,false);

console.log("BUILD 511 MAINTENANCE & FLEET PILOT CONTINUATION DECISION TEST: PASS");
