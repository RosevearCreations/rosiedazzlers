#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity } from "../functions/api/_lib/recovery-authenticated-device-manual-closure-outcome-continuity.js";
import { buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview } from "../functions/api/_lib/recovery-authenticated-device-closure-evidence-freshness-review.js";
import { buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview } from "../functions/api/_lib/recovery-authenticated-device-closure-evidence-integrity-review.js";

const roles=["customer","detailer","operations","admin"];
const execution={
  recovery:{status:"bounded_nonproduction_execution_observation_recorded",source_available:true,observed:true,observed_at:"2026-10-01T12:00:00Z",freshness:"current",bounded_nonproduction_scope_explicit:true,observer_role_present:true,backup_reference_present:true,retention_reference_present:true,outcome_recorded:true,outcome_classification:"successful",abort_or_deviation_recorded:true,evidence_trace_key:"recovery-trace-540",post_observation_requirements_complete:true},
  authenticated_device:{status:"current_authenticated_observation_execution_evidence_recorded",source_available:true,current_observation_coverage_complete:true,current_role_ids:roles,observed_device_ids:["phone","tablet","desktop"],observed_browser_ids:["chrome","safari"],regression_role_ids:[],rows:[
    {id:"customer",observed:true,observed_at:"2026-10-01T13:00:00Z",outcome:"pass",device_ids:["phone"],browser_ids:["safari"]},
    {id:"detailer",observed:true,observed_at:"2026-10-01T13:05:00Z",outcome:"pass",device_ids:["phone"],browser_ids:["chrome"]},
    {id:"operations",observed:true,observed_at:"2026-10-01T13:10:00Z",outcome:"pass",device_ids:["tablet"],browser_ids:["chrome"]},
    {id:"admin",observed:true,observed_at:"2026-10-01T13:15:00Z",outcome:"pass",device_ids:["desktop"],browser_ids:["chrome"]}
  ]}
};
const closure={recovery_closure:{status:"recovery_manual_closure_review_ready",successful_outcome_recorded:true},authenticated_device_closure:{status:"authenticated_device_manual_closure_review_ready"}};
const baseline=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({closure_review:closure,execution_evidence:execution,generated_at:"2026-10-01T14:00:00Z"});
const manual=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({
  closure_review:closure,execution_evidence:execution,
  manual_recovery_hold_outcome:{reviewed_at:"2026-10-01T14:05:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:baseline.recovery.expected_evidence_trace_key,outcome_reference:"recovery-review-540"},
  manual_device_hold_outcome:{reviewed_at:"2026-10-01T14:06:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:baseline.authenticated_device.expected_evidence_trace_key,outcome_reference:"device-review-540"},
  generated_at:"2026-10-01T14:06:00Z"
});
const freshness=buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview({manual_closure_outcome:manual,execution_evidence:execution,generated_at:"2026-10-02T12:00:00Z",freshness_window_days:30});
const current=buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview({closure_freshness:freshness,manual_closure_outcome:manual,generated_at:"2026-10-07T12:00:00Z"});
assert.equal(current.recovery_authenticated_device_closure_integrity_build,540);
assert.equal(current.status,"closure_integrity_current");
assert.equal(current.recovery_identity.trace_match,true);
assert.equal(current.authenticated_device_identity.trace_match,true);
assert.equal(current.integrity_contract.recovery_and_authenticated_device_populations_joined,false);
assert.equal(current.integrity_contract.source_runtime_green_can_prove_recovery_or_device_closure,false);
assert.equal(current.truth_boundary.production_restore_performed,false);
assert.equal(current.truth_boundary.current_negative_overridden_by_historical_acceptance,false);
assert.equal(current.boundaries.hold_inventory_mutated,false);
assert.equal(current.boundaries.schema_or_storage_mutated,false);

const stale=structuredClone(freshness); stale.status="owning_hold_retained_by_freshness_review";
assert.equal(buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview({closure_freshness:stale,manual_closure_outcome:manual}).status,"retained_freshness_review_required");
const recoveryMissing=structuredClone(freshness); recoveryMissing.recovery.retained_evidence_trace_key=null;
assert.equal(buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview({closure_freshness:recoveryMissing,manual_closure_outcome:manual}).status,"recovery_source_identity_review_required");
const recoveryDrift=structuredClone(manual); recoveryDrift.recovery.expected_evidence_trace_key="different-recovery-trace";
assert.equal(buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview({closure_freshness:freshness,manual_closure_outcome:recoveryDrift}).status,"recovery_source_identity_drift_review_required");
const recoveryOperator=structuredClone(freshness); recoveryOperator.recovery.operator_review.current=false;
assert.equal(buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview({closure_freshness:recoveryOperator,manual_closure_outcome:manual}).status,"recovery_operator_review_identity_review_required");
const deviceMissing=structuredClone(freshness); deviceMissing.authenticated_device.current_browser_ids=[];
assert.equal(buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview({closure_freshness:deviceMissing,manual_closure_outcome:manual}).status,"authenticated_device_identity_review_required");
const deviceDrift=structuredClone(manual); deviceDrift.authenticated_device.expected_evidence_trace_key="different-device-trace";
assert.equal(buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview({closure_freshness:freshness,manual_closure_outcome:deviceDrift}).status,"authenticated_device_identity_drift_review_required");
const deviceOperator=structuredClone(freshness); deviceOperator.authenticated_device.operator_review.current=false;
assert.equal(buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview({closure_freshness:deviceOperator,manual_closure_outcome:manual}).status,"authenticated_device_operator_review_identity_review_required");

console.log("BUILD 540 RECOVERY & AUTHENTICATED DEVICE CLOSURE EVIDENCE INTEGRITY REVIEW TEST: PASS");
