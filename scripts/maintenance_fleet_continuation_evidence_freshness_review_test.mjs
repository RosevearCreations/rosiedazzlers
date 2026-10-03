#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildMaintenanceFleetContinuationEvidenceFreshnessReview } from "../functions/api/_lib/maintenance-fleet-continuation-evidence-freshness-review.js";

const rows=[
  {evidence_id:"pilot-1",participant_ref:"maintenance-001",participant_type:"maintenance",attributable:true,started_at:"2026-09-15T12:00:00Z",ended_at:"2026-09-18T12:00:00Z",availability_revalidated_at:"2026-09-15T11:00:00Z",checkout_revalidated_at:"2026-09-15T11:30:00Z",invoice:{observed_at:"2026-09-18T13:00:00Z",status:"issued"},travel:{observed_at:"2026-09-18T12:30:00Z",distance_km:18.4},stop_condition:{observed_at:"2026-09-18T12:05:00Z",triggered:false,reason:"none"}},
  {evidence_id:"pilot-2",participant_ref:"fleet-001",participant_type:"fleet",attributable:true,started_at:"2026-09-16T12:00:00Z",ended_at:"2026-09-20T12:00:00Z",availability_revalidated_at:"2026-09-16T11:00:00Z",checkout_revalidated_at:"2026-09-16T11:30:00Z",invoice:{observed_at:"2026-09-20T13:00:00Z",status:"issued"},travel:{observed_at:"2026-09-20T12:30:00Z",distance_km:32.6},stop_condition:{observed_at:"2026-09-20T12:05:00Z",triggered:false,reason:"none"}}
];
const trace=rows.map(row=>[row.evidence_id,row.participant_ref,new Date(row.started_at).toISOString(),new Date(row.ended_at).toISOString(),row.stop_condition.triggered?"stop":"continue"].join(":")).join("|");
const pilot={build:491,authority:"maintenance_fleet_pilot_outcome_evidence",status:"bounded_pilot_outcome_review_ready",execution_source:{available:true,attributed_row_count:2},participants:{bound_satisfied:true,observed_count:2,participant_limit:2},duration:{bound_satisfied:true,observed_duration_days:6,authorized_duration_days:14},capacity:{every_attributed_row_has_capacity_evidence:true},invoicing:{every_attributed_row_has_invoice_evidence:true},travel:{every_attributed_row_has_travel_evidence:true},stop_conditions:{every_attributed_row_has_stop_condition_evidence:true,triggered_count:0},rows};
const continuation={continuation_outcome_build:521,continuation_outcome_authority:"maintenance_fleet_continuation_outcome_continuity",status:"bounded_pilot_continuation_outcome_observed",evidence:{participant_bound_satisfied:true,duration_bound_satisfied:true,capacity_revalidation_complete:true,invoicing_evidence_complete:true,travel_evidence_complete:true,stop_condition_evidence_complete:true,stop_condition_triggered:false,source_evidence_trace_key:trace,record_trace_matches:true},owner_outcome:{outcome:"continue",attributable:true,reviewed_at:"2026-09-21T12:00:00Z",outcome_reference:"owner-521-current",continuation_authorized_at:"2026-09-21T12:05:00Z",continuation_observed_at:"2026-09-22T12:00:00Z"}};

const current=buildMaintenanceFleetContinuationEvidenceFreshnessReview({continuation_outcome:continuation,pilot_outcome_evidence:pilot,generated_at:"2026-10-03T12:00:00Z",freshness_window_days:30});
assert.equal(current.maintenance_fleet_continuation_freshness_build,531);
assert.equal(current.status,"bounded_pilot_continuation_outcome_current");
assert.equal(current.execution_evidence_freshness.current_row_count,2);
assert.equal(current.execution_evidence_freshness.trace_matches_current_evidence,true);
assert.equal(current.owner_outcome_freshness.review_current,true);
assert.equal(current.owner_outcome_freshness.continuation_observation_current,true);
assert.equal(current.truth_boundary.capacity_reserved,false);
assert.equal(current.truth_boundary.recurring_billing_enabled,false);

const held=structuredClone(continuation);
held.status="continuation_hold_outcome_observed";
held.owner_outcome={outcome:"hold",attributable:true,reviewed_at:"2026-09-22T12:00:00Z",outcome_reference:"owner-hold-current"};
assert.equal(buildMaintenanceFleetContinuationEvidenceFreshnessReview({continuation_outcome:held,pilot_outcome_evidence:pilot,generated_at:"2026-10-03T12:00:00Z"}).status,"continuation_hold_outcome_current");

const stalePilot=structuredClone(pilot);
stalePilot.rows[0].availability_revalidated_at="2026-07-01T11:00:00Z";
assert.equal(buildMaintenanceFleetContinuationEvidenceFreshnessReview({continuation_outcome:continuation,pilot_outcome_evidence:stalePilot,generated_at:"2026-10-03T12:00:00Z"}).status,"pilot_execution_evidence_freshness_review_required");

const staleOwner=structuredClone(continuation);
staleOwner.owner_outcome.reviewed_at="2026-07-01T12:00:00Z";
assert.equal(buildMaintenanceFleetContinuationEvidenceFreshnessReview({continuation_outcome:staleOwner,pilot_outcome_evidence:pilot,generated_at:"2026-10-03T12:00:00Z"}).status,"owner_outcome_freshness_review_required");

const staleObservation=structuredClone(continuation);
staleObservation.owner_outcome.continuation_authorized_at="2026-07-01T12:00:00Z";
staleObservation.owner_outcome.continuation_observed_at="2026-07-02T12:00:00Z";
assert.equal(buildMaintenanceFleetContinuationEvidenceFreshnessReview({continuation_outcome:staleObservation,pilot_outcome_evidence:pilot,generated_at:"2026-10-03T12:00:00Z"}).status,"continuation_observation_freshness_review_required");

const drift=structuredClone(continuation);
drift.evidence.source_evidence_trace_key="different-trace";
assert.equal(buildMaintenanceFleetContinuationEvidenceFreshnessReview({continuation_outcome:drift,pilot_outcome_evidence:pilot,generated_at:"2026-10-03T12:00:00Z"}).status,"continuation_outcome_trace_conflict_review_required");

const stoppedPilot=structuredClone(pilot);
stoppedPilot.rows[1].stop_condition.triggered=true;
const stopped=structuredClone(continuation);
stopped.evidence.stop_condition_triggered=true;
stopped.evidence.source_evidence_trace_key=stoppedPilot.rows.map(row=>[row.evidence_id,row.participant_ref,new Date(row.started_at).toISOString(),new Date(row.ended_at).toISOString(),row.stop_condition.triggered?"stop":"continue"].join(":")).join("|");
assert.equal(buildMaintenanceFleetContinuationEvidenceFreshnessReview({continuation_outcome:stopped,pilot_outcome_evidence:stoppedPilot,generated_at:"2026-10-03T12:00:00Z"}).status,"pilot_stop_condition_review_required");

const unavailable=buildMaintenanceFleetContinuationEvidenceFreshnessReview({continuation_outcome:continuation,pilot_outcome_evidence:{},generated_at:"2026-10-03T12:00:00Z"});
assert.equal(unavailable.status,"pilot_execution_evidence_source_unavailable");
assert.equal(unavailable.truth_boundary.canonical_hold_mutated,false);

console.log("BUILD 531 MAINTENANCE & FLEET CONTINUATION EVIDENCE FRESHNESS REVIEW TEST: PASS");
