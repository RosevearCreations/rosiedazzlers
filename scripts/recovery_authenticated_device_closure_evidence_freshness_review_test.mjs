#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity } from "../functions/api/_lib/recovery-authenticated-device-manual-closure-outcome-continuity.js";
import { buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview } from "../functions/api/_lib/recovery-authenticated-device-closure-evidence-freshness-review.js";

const roles=["customer","detailer","operations","admin"];
const execution={
  recovery:{
    status:"bounded_nonproduction_execution_observation_recorded",
    source_available:true,
    observed:true,
    observed_at:"2026-10-01T12:00:00Z",
    freshness:"current",
    bounded_nonproduction_scope_explicit:true,
    observer_role_present:true,
    backup_reference_present:true,
    retention_reference_present:true,
    outcome_recorded:true,
    outcome_classification:"successful",
    abort_or_deviation_recorded:true,
    evidence_trace_key:"recovery-trace-530",
    post_observation_requirements_complete:true
  },
  authenticated_device:{
    status:"current_authenticated_observation_execution_evidence_recorded",
    source_available:true,
    current_observation_coverage_complete:true,
    current_role_ids:roles,
    observed_device_ids:["phone","tablet","desktop"],
    observed_browser_ids:["chrome","safari"],
    regression_role_ids:[],
    rows:[
      {id:"customer",observed:true,observed_at:"2026-10-01T13:00:00Z",outcome:"pass",device_ids:["phone"],browser_ids:["safari"]},
      {id:"detailer",observed:true,observed_at:"2026-10-01T13:05:00Z",outcome:"pass",device_ids:["phone"],browser_ids:["chrome"]},
      {id:"operations",observed:true,observed_at:"2026-10-01T13:10:00Z",outcome:"pass",device_ids:["tablet"],browser_ids:["chrome"]},
      {id:"admin",observed:true,observed_at:"2026-10-01T13:15:00Z",outcome:"pass",device_ids:["desktop"],browser_ids:["chrome"]}
    ]
  }
};
const closure={
  recovery_closure:{status:"recovery_manual_closure_review_ready",successful_outcome_recorded:true},
  authenticated_device_closure:{status:"authenticated_device_manual_closure_review_ready"}
};
const baseline=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({closure_review:closure,execution_evidence:execution,generated_at:"2026-10-01T14:00:00Z"});
const currentManual=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({
  closure_review:closure,
  execution_evidence:execution,
  manual_recovery_hold_outcome:{reviewed_at:"2026-10-01T14:05:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:baseline.recovery.expected_evidence_trace_key,outcome_reference:"recovery-review-530"},
  manual_device_hold_outcome:{reviewed_at:"2026-10-01T14:06:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:baseline.authenticated_device.expected_evidence_trace_key,outcome_reference:"device-review-530"},
  generated_at:"2026-10-01T14:06:00Z"
});

const current=buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview({
  manual_closure_outcome:currentManual,
  execution_evidence:execution,
  generated_at:"2026-10-02T12:00:00Z",
  freshness_window_days:30
});
assert.equal(current.recovery_authenticated_device_closure_freshness_build,530);
assert.equal(current.status,"manual_holds_retained_current");
assert.equal(current.recovery.freshness_state,"recovery_evidence_current");
assert.equal(current.authenticated_device.freshness_state,"authenticated_device_evidence_current");
assert.equal(current.recovery.operator_review.freshness_state,"operator_review_current");
assert.equal(current.authenticated_device.operator_review.freshness_state,"operator_review_current");
assert.equal(current.freshness_contract.recovery_and_authenticated_device_populations_joined,false);
assert.equal(current.truth_boundary.production_restore_performed,false);
assert.equal(current.truth_boundary.canonical_hold_mutated,false);

const missingOperator=buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview({
  manual_closure_outcome:baseline,
  execution_evidence:execution,
  generated_at:"2026-10-02T12:00:00Z"
});
assert.equal(missingOperator.status,"closure_evidence_current_operator_review_required");

const staleExecution=buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview({
  manual_closure_outcome:currentManual,
  execution_evidence:execution,
  generated_at:"2026-12-15T12:00:00Z",
  freshness_window_days:30
});
assert.equal(staleExecution.status,"owning_hold_retained_by_freshness_review");
assert.equal(staleExecution.recovery.evidence_current,false);
assert.equal(staleExecution.authenticated_device.evidence_current,false);

const freshExecution={...execution,recovery:{...execution.recovery,observed_at:"2026-10-02T12:00:00Z"},authenticated_device:{...execution.authenticated_device,rows:execution.authenticated_device.rows.map((row)=>({...row,observed_at:"2026-10-02T12:00:00Z"}))}};
const freshBaseline=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({closure_review:closure,execution_evidence:freshExecution,generated_at:"2026-10-02T12:30:00Z"});
const staleManual=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({
  closure_review:closure,
  execution_evidence:freshExecution,
  manual_recovery_hold_outcome:{reviewed_at:"2026-08-01T12:00:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:freshBaseline.recovery.expected_evidence_trace_key,outcome_reference:"old-recovery"},
  manual_device_hold_outcome:{reviewed_at:"2026-08-01T12:00:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:freshBaseline.authenticated_device.expected_evidence_trace_key,outcome_reference:"old-device"},
  generated_at:"2026-10-02T12:30:00Z"
});
const staleReview=buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview({manual_closure_outcome:staleManual,execution_evidence:freshExecution,generated_at:"2026-10-02T13:00:00Z"});
assert.equal(staleReview.status,"operator_review_freshness_required");

const regressionExecution={...execution,authenticated_device:{...execution.authenticated_device,status:"current_regression_observed",regression_role_ids:["admin"],rows:execution.authenticated_device.rows.map((row)=>row.id==="admin"?{...row,outcome:"regression"}:row)}};
const regression=buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview({manual_closure_outcome:currentManual,execution_evidence:regressionExecution,generated_at:"2026-10-02T12:00:00Z"});
assert.equal(regression.status,"owning_hold_retained_by_freshness_review");
assert.equal(regression.authenticated_device.evidence_current,false);

console.log("BUILD 530 RECOVERY & AUTHENTICATED DEVICE CLOSURE EVIDENCE FRESHNESS REVIEW: PASS");
