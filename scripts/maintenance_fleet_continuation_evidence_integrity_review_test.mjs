#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildMaintenanceFleetContinuationEvidenceFreshnessReview } from "../functions/api/_lib/maintenance-fleet-continuation-evidence-freshness-review.js";
import { buildMaintenanceFleetContinuationEvidenceIntegrityReview } from "../functions/api/_lib/maintenance-fleet-continuation-evidence-integrity-review.js";

const rows=[
  {evidence_id:"pilot-1",participant_ref:"maintenance-001",participant_type:"maintenance",attributable:true,started_at:"2026-09-15T12:00:00Z",ended_at:"2026-09-18T12:00:00Z",availability_revalidated_at:"2026-09-15T11:00:00Z",checkout_revalidated_at:"2026-09-15T11:30:00Z",invoice:{observed_at:"2026-09-18T13:00:00Z",status:"issued"},travel:{observed_at:"2026-09-18T12:30:00Z",distance_km:18.4},stop_condition:{observed_at:"2026-09-18T12:05:00Z",triggered:false}},
  {evidence_id:"pilot-2",participant_ref:"fleet-001",participant_type:"fleet",attributable:true,started_at:"2026-09-16T12:00:00Z",ended_at:"2026-09-20T12:00:00Z",availability_revalidated_at:"2026-09-16T11:00:00Z",checkout_revalidated_at:"2026-09-16T11:30:00Z",invoice:{observed_at:"2026-09-20T13:00:00Z",status:"issued"},travel:{observed_at:"2026-09-20T12:30:00Z",distance_km:32.6},stop_condition:{observed_at:"2026-09-20T12:05:00Z",triggered:false}}
];
const trace=rows.map(row=>[row.evidence_id,row.participant_ref,new Date(row.started_at).toISOString(),new Date(row.ended_at).toISOString(),row.stop_condition.triggered?"stop":"continue"].join(":")).join("|");
const pilot={build:491,authority:"maintenance_fleet_pilot_outcome_evidence",execution_source:{available:true},participants:{bound_satisfied:true},duration:{bound_satisfied:true},capacity:{every_attributed_row_has_capacity_evidence:true},invoicing:{every_attributed_row_has_invoice_evidence:true},travel:{every_attributed_row_has_travel_evidence:true},stop_conditions:{every_attributed_row_has_stop_condition_evidence:true},rows};
const continuation={continuation_outcome_build:521,continuation_outcome_authority:"maintenance_fleet_continuation_outcome_continuity",status:"bounded_pilot_continuation_outcome_observed",evidence:{participant_bound_satisfied:true,duration_bound_satisfied:true,capacity_revalidation_complete:true,invoicing_evidence_complete:true,travel_evidence_complete:true,stop_condition_evidence_complete:true,stop_condition_triggered:false,source_evidence_trace_key:trace,record_trace_matches:true},owner_outcome:{outcome:"continue",attributable:true,reviewed_at:"2026-09-21T12:00:00Z",outcome_reference:"owner-521-current",continuation_authorized_at:"2026-09-21T12:05:00Z",continuation_observed_at:"2026-09-22T12:00:00Z"}};
const freshness=buildMaintenanceFleetContinuationEvidenceFreshnessReview({continuation_outcome:continuation,pilot_outcome_evidence:pilot,generated_at:"2026-10-03T12:00:00Z",freshness_window_days:30});
const current=buildMaintenanceFleetContinuationEvidenceIntegrityReview({continuation_freshness:freshness,continuation_outcome:continuation,generated_at:"2026-10-07T12:00:00Z"});
assert.equal(current.maintenance_fleet_continuation_integrity_build,541);
assert.equal(current.status,"maintenance_fleet_continuation_integrity_current");
assert.equal(current.pilot_execution_identity.trace_match,true);
assert.equal(current.owner_outcome_identity.identity_complete,true);
assert.equal(current.owner_outcome_identity.continuation_observation_identity_complete,true);
assert.equal(current.integrity_contract.source_runtime_green_can_prove_continuation,false);
assert.equal(current.truth_boundary.capacity_reserved,false);
assert.equal(current.truth_boundary.recurring_billing_enabled,false);
assert.equal(current.boundaries.schema_or_storage_mutated,false);

const stale=structuredClone(freshness); stale.status="owner_outcome_freshness_review_required";
assert.equal(buildMaintenanceFleetContinuationEvidenceIntegrityReview({continuation_freshness:stale,continuation_outcome:continuation}).status,"retained_freshness_review_required");
const missing=structuredClone(freshness); missing.execution_evidence_freshness.current_evidence_trace_key=null;
assert.equal(buildMaintenanceFleetContinuationEvidenceIntegrityReview({continuation_freshness:missing,continuation_outcome:continuation}).status,"pilot_execution_identity_review_required");
const drift=structuredClone(continuation); drift.evidence.source_evidence_trace_key="different-trace";
assert.equal(buildMaintenanceFleetContinuationEvidenceIntegrityReview({continuation_freshness:freshness,continuation_outcome:drift}).status,"pilot_execution_identity_drift_review_required");
const ownerDrift=structuredClone(continuation); ownerDrift.owner_outcome.outcome_reference="different-owner-reference";
assert.equal(buildMaintenanceFleetContinuationEvidenceIntegrityReview({continuation_freshness:freshness,continuation_outcome:ownerDrift}).status,"owner_outcome_identity_review_required");
const observationDrift=structuredClone(continuation); observationDrift.owner_outcome.continuation_observed_at="2026-09-23T12:00:00Z";
assert.equal(buildMaintenanceFleetContinuationEvidenceIntegrityReview({continuation_freshness:freshness,continuation_outcome:observationDrift}).status,"continuation_observation_identity_review_required");
const stopped=structuredClone(freshness); stopped.execution_evidence_freshness.stop_condition_triggered=true;
assert.equal(buildMaintenanceFleetContinuationEvidenceIntegrityReview({continuation_freshness:stopped,continuation_outcome:continuation}).status,"pilot_execution_identity_review_required");

const hold=structuredClone(continuation);
hold.status="continuation_hold_outcome_observed";
hold.owner_outcome={outcome:"hold",attributable:true,reviewed_at:"2026-09-22T12:00:00Z",outcome_reference:"owner-hold-current"};
const holdFresh=buildMaintenanceFleetContinuationEvidenceFreshnessReview({continuation_outcome:hold,pilot_outcome_evidence:pilot,generated_at:"2026-10-03T12:00:00Z"});
assert.equal(buildMaintenanceFleetContinuationEvidenceIntegrityReview({continuation_freshness:holdFresh,continuation_outcome:hold}).status,"maintenance_fleet_continuation_integrity_current");

console.log("BUILD 541 MAINTENANCE & FLEET CONTINUATION EVIDENCE INTEGRITY REVIEW TEST: PASS");
