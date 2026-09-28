#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity } from "../functions/api/_lib/recovery-authenticated-device-manual-closure-outcome-continuity.js";

const execution={
  status:"execution_evidence_review_ready",
  recovery:{
    status:"bounded_nonproduction_execution_observation_recorded",
    source_available:true,
    observed:true,
    observed_at:"2026-09-28T14:00:00Z",
    freshness:"current",
    bounded_nonproduction_scope_explicit:true,
    observer_role_present:true,
    backup_reference_present:true,
    retention_reference_present:true,
    outcome_recorded:true,
    outcome_classification:"successful",
    abort_or_deviation_recorded:true,
    evidence_trace_key:"backup:current|retention:current|drill:current",
    post_observation_requirements_complete:true
  },
  authenticated_device:{
    status:"current_authenticated_observation_execution_evidence_recorded",
    source_available:true,
    current_observation_coverage_complete:true,
    current_role_ids:["customer","detailer","operations","admin"],
    observed_device_ids:["phone","tablet","desktop"],
    observed_browser_ids:["chrome","safari","edge"],
    regression_role_ids:[],
    rows:[
      {id:"customer",observed:true,observed_at:"2026-09-28T14:01:00Z",outcome:"pass",device_ids:["phone"],browser_ids:["safari"]},
      {id:"detailer",observed:true,observed_at:"2026-09-28T14:02:00Z",outcome:"pass",device_ids:["phone"],browser_ids:["chrome"]},
      {id:"operations",observed:true,observed_at:"2026-09-28T14:03:00Z",outcome:"pass",device_ids:["tablet"],browser_ids:["chrome"]},
      {id:"admin",observed:true,observed_at:"2026-09-28T14:04:00Z",outcome:"pass",device_ids:["desktop"],browser_ids:["edge"]}
    ]
  }
};
const closure={
  status:"manual_closure_review_ready",
  recovery_closure:{status:"recovery_manual_closure_review_ready",successful_outcome_recorded:true},
  authenticated_device_closure:{status:"authenticated_device_manual_closure_review_ready",current_observation_coverage_complete:true}
};

const awaiting=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({closure_review:closure,execution_evidence:execution,generated_at:"2026-09-28T14:10:00Z"});
assert.equal(awaiting.manual_closure_outcome_build,520);
assert.equal(awaiting.status,"manual_closure_operator_outcome_required");
assert.equal(awaiting.recovery.status,"manual_closure_operator_outcome_required");
assert.equal(awaiting.authenticated_device.status,"manual_closure_operator_outcome_required");
assert.equal(awaiting.closure_contract.recovery_and_device_populations_joined,false);
assert.equal(awaiting.truth_boundary.production_restore_performed,false);
assert.equal(awaiting.truth_boundary.authenticated_login_action_performed,false);
assert.equal(awaiting.truth_boundary.restricted_credentials_stored,false);

const recoveryTrace=awaiting.recovery.expected_evidence_trace_key;
const deviceTrace=awaiting.authenticated_device.expected_evidence_trace_key;
const closed=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({
  closure_review:closure,
  execution_evidence:execution,
  manual_recovery_hold_outcome:{reviewed_at:"2026-09-28T14:11:00Z",reviewer_role:"owner",outcome:"narrow_hold_with_dated_evidence",evidence_trace_key:recoveryTrace,outcome_reference:"recovery-review-2026-09-28"},
  manual_device_hold_outcome:{reviewed_at:"2026-09-28T14:12:00Z",reviewer_role:"owner",outcome:"narrow_hold_with_dated_evidence",evidence_trace_key:deviceTrace,outcome_reference:"device-review-2026-09-28"}
});
assert.equal(closed.status,"manual_closure_outcomes_observed");
assert.equal(closed.recovery.status,"manual_closure_outcome_observed");
assert.equal(closed.authenticated_device.status,"manual_closure_outcome_observed");

const retained=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({
  closure_review:closure,
  execution_evidence:execution,
  manual_recovery_hold_outcome:{reviewed_at:"2026-09-28T14:11:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:recoveryTrace,outcome_reference:"recovery-retain"},
  manual_device_hold_outcome:{reviewed_at:"2026-09-28T14:12:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:deviceTrace,outcome_reference:"device-retain"}
});
assert.equal(retained.status,"manual_holds_retained_observed");

const negativeExecution=structuredClone(execution);
negativeExecution.recovery.outcome_classification="unsuccessful";
const negativeClosure=structuredClone(closure);
negativeClosure.status="current_recovery_negative_evidence_retains_hold";
negativeClosure.recovery_closure.status="current_recovery_negative_evidence_retains_hold";
negativeClosure.recovery_closure.successful_outcome_recorded=false;
const negative=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({closure_review:negativeClosure,execution_evidence:negativeExecution});
assert.equal(negative.status,"owning_hold_retained_by_current_evidence");
assert.equal(negative.recovery.status,"evidence_not_ready_retains_hold");

const wrongTrace=buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({
  closure_review:closure,
  execution_evidence:execution,
  manual_recovery_hold_outcome:{reviewed_at:"2026-09-28T14:11:00Z",reviewer_role:"owner",outcome:"narrow_hold_with_dated_evidence",evidence_trace_key:"wrong",outcome_reference:"bad-trace"}
});
assert.equal(wrongTrace.status,"manual_closure_evidence_conflict");
assert.equal(wrongTrace.recovery.manual_hold_outcome.trace_match,false);

console.log("BUILD 520 RECOVERY DRILL & AUTHENTICATED DEVICE MANUAL CLOSURE OUTCOME CONTINUITY TEST: PASS");
