#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildMaintenanceFleetContinuationOutcomeContinuity } from "../functions/api/_lib/maintenance-fleet-continuation-outcome-continuity.js";

const baseDecision={
  continuation_decision_build:511,
  continuation_decision_authority:"maintenance_fleet_pilot_continuation_decision",
  status:"bounded_pilot_continuation_decision_recorded",
  evidence:{
    current_execution_evidence_present:true,
    participant_bound_satisfied:true,
    duration_bound_satisfied:true,
    capacity_revalidation_complete:true,
    invoicing_evidence_complete:true,
    travel_evidence_complete:true,
    stop_condition_evidence_complete:true,
    stop_condition_triggered:false,
    evidence_complete:true,
    continuity_review_ready:true,
    evidence_trace_key:"pilot-1:maintenance-001:2026-09-01T12:00:00.000Z:2026-09-04T12:00:00.000Z:continue"
  },
  owner_decision:{
    decision:"continue",
    decided_by:"owner-review",
    decided_at:"2026-09-27T18:00:00.000Z",
    attributable:true,
    continue_decision_accepted:true,
    hold_decision_accepted:false
  },
  bounds:{participant_limit:2,duration_days:14,observed_participant_count:1,observed_duration_days:4}
};

const missing=buildMaintenanceFleetContinuationOutcomeContinuity({pilot_continuation_decision:baseDecision,generated_at:"2026-09-28T20:00:00Z"});
assert.equal(missing.continuation_outcome_build,521);
assert.equal(missing.status,"owner_continuation_outcome_required");
assert.equal(missing.outcome_boundary.customer_or_commercial_activation_authorized,false);
assert.ok(missing.evidence.expected_decision_trace_key);

const trace=missing.evidence.expected_decision_trace_key;
const noObservation=buildMaintenanceFleetContinuationOutcomeContinuity({
  pilot_continuation_decision:baseDecision,
  continuation_outcome_record:{outcome:"continue",reviewed_by:"owner-review",reviewed_at:"2026-09-28T20:10:00Z",decision_trace_key:trace,outcome_reference:"owner-observation-521"}
});
assert.equal(noObservation.status,"continuation_observation_required");

const continued=buildMaintenanceFleetContinuationOutcomeContinuity({
  pilot_continuation_decision:baseDecision,
  continuation_outcome_record:{
    outcome:"continue",reviewed_by:"owner-review",reviewed_at:"2026-09-28T20:10:00Z",
    decision_trace_key:trace,outcome_reference:"owner-observation-521",
    continuation_authorized_at:"2026-09-27T18:05:00Z",continuation_observed_at:"2026-09-28T19:30:00Z"
  }
});
assert.equal(continued.status,"bounded_pilot_continuation_outcome_observed");
assert.equal(continued.owner_outcome.continue_outcome_observed,true);
assert.equal(continued.owner_outcome.continuation_observation_complete,true);
assert.equal(continued.truth_boundary.maintenance_enrollment_performed,false);
assert.equal(continued.truth_boundary.recurring_billing_enabled,false);
assert.equal(continued.truth_boundary.capacity_reserved,false);

const wrongTrace=buildMaintenanceFleetContinuationOutcomeContinuity({
  pilot_continuation_decision:baseDecision,
  continuation_outcome_record:{
    outcome:"continue",reviewed_by:"owner-review",reviewed_at:"2026-09-28T20:10:00Z",
    decision_trace_key:"wrong-trace",outcome_reference:"owner-observation-521",
    continuation_authorized_at:"2026-09-27T18:05:00Z",continuation_observed_at:"2026-09-28T19:30:00Z"
  }
});
assert.equal(wrongTrace.status,"continuation_outcome_evidence_conflict");

const holdDecision=structuredClone(baseDecision);
holdDecision.status="continuation_hold_recorded";
holdDecision.owner_decision.decision="hold";
holdDecision.owner_decision.continue_decision_accepted=false;
holdDecision.owner_decision.hold_decision_accepted=true;
const holdProbe=buildMaintenanceFleetContinuationOutcomeContinuity({pilot_continuation_decision:holdDecision});
const held=buildMaintenanceFleetContinuationOutcomeContinuity({
  pilot_continuation_decision:holdDecision,
  continuation_outcome_record:{outcome:"hold",reviewed_by:"owner-review",reviewed_at:"2026-09-28T20:20:00Z",decision_trace_key:holdProbe.evidence.expected_decision_trace_key,outcome_reference:"owner-hold-521"}
});
assert.equal(held.status,"continuation_hold_outcome_observed");
assert.equal(held.owner_outcome.hold_outcome_observed,true);

const stopped=structuredClone(baseDecision);
stopped.evidence.stop_condition_triggered=true;
const stopResult=buildMaintenanceFleetContinuationOutcomeContinuity({
  pilot_continuation_decision:stopped,
  continuation_outcome_record:{
    outcome:"continue",reviewed_by:"owner-review",reviewed_at:"2026-09-28T20:25:00Z",
    decision_trace_key:trace,outcome_reference:"must-review-stop",
    continuation_authorized_at:"2026-09-27T18:05:00Z",continuation_observed_at:"2026-09-28T19:30:00Z"
  }
});
assert.equal(stopResult.status,"pilot_stop_condition_review_required");
assert.equal(stopResult.outcome_boundary.triggered_stop_condition_requires_review,true);

const outOfBounds=structuredClone(baseDecision);
outOfBounds.evidence.participant_bound_satisfied=false;
assert.equal(buildMaintenanceFleetContinuationOutcomeContinuity({pilot_continuation_decision:outOfBounds}).status,"pilot_bounds_review_required");

const noDecision=structuredClone(baseDecision);
noDecision.status="owner_action_continuation_decision_required";
noDecision.owner_decision={decision:"not_recorded",attributable:false};
assert.equal(buildMaintenanceFleetContinuationOutcomeContinuity({pilot_continuation_decision:noDecision}).status,"owner_continuation_decision_required");

const unavailable=buildMaintenanceFleetContinuationOutcomeContinuity({pilot_continuation_decision:{}});
assert.equal(unavailable.status,"continuation_source_unavailable");
assert.equal(unavailable.truth_boundary.canonical_hold_mutated,false);
assert.equal(unavailable.truth_boundary.permanent_polling,false);

console.log("BUILD 521 MAINTENANCE & FLEET CONTINUATION OUTCOME CONTINUITY TEST: PASS");
