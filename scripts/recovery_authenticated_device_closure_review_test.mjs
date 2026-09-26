#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildRecoveryAuthenticatedDeviceClosureReview } from "../functions/api/_lib/recovery-authenticated-device-closure-review.js";

const execution={
  status:"execution_evidence_review_ready",
  recovery:{
    status:"bounded_nonproduction_execution_observation_recorded",
    source_available:true,
    observed:true,
    observed_at:"2026-09-26T15:00:00Z",
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
    required_role_ids:["customer","detailer","operations","admin"],
    current_role_ids:["customer","detailer","operations","admin"],
    required_device_ids:["phone","tablet","desktop"],
    observed_device_ids:["desktop","phone","tablet"],
    observed_browser_ids:["chrome","safari","edge"],
    regression_role_ids:[]
  }
};

const ready=buildRecoveryAuthenticatedDeviceClosureReview({execution_evidence:execution,generated_at:"2026-09-26T16:00:00Z"});
assert.equal(ready.closure_review_build,510);
assert.equal(ready.status,"manual_closure_review_ready");
assert.equal(ready.recovery_closure.status,"recovery_manual_closure_review_ready");
assert.equal(ready.authenticated_device_closure.status,"authenticated_device_manual_closure_review_ready");
assert.equal(ready.recovery_closure.manual_hold_update_candidate,true);
assert.equal(ready.authenticated_device_closure.manual_hold_update_candidate,true);
assert.equal(ready.closure_rules.recovery_and_device_populations_joined,false);
assert.equal(ready.closure_rules.manual_operator_review_required,true);
assert.equal(ready.closure_rules.automatic_hold_narrowing_performed,false);
assert.equal(ready.truth_boundary.production_restore_performed,false);
assert.equal(ready.truth_boundary.browser_farm_created,false);
assert.equal(ready.truth_boundary.canonical_hold_mutated,false);

const failedRecovery=structuredClone(execution);
failedRecovery.recovery.outcome_classification="unsuccessful";
const recoveryNegative=buildRecoveryAuthenticatedDeviceClosureReview({execution_evidence:failedRecovery});
assert.equal(recoveryNegative.status,"current_recovery_negative_evidence_retains_hold");
assert.equal(recoveryNegative.recovery_closure.manual_hold_update_candidate,false);

const regression=structuredClone(execution);
regression.authenticated_device.status="current_regression_observed";
regression.authenticated_device.regression_role_ids=["detailer"];
const deviceNegative=buildRecoveryAuthenticatedDeviceClosureReview({execution_evidence:regression});
assert.equal(deviceNegative.status,"current_authenticated_device_negative_evidence_retains_hold");
assert.equal(deviceNegative.authenticated_device_closure.manual_hold_update_candidate,false);

const missingDevice=structuredClone(execution);
missingDevice.authenticated_device.status="observation_execution_evidence_required";
missingDevice.authenticated_device.current_observation_coverage_complete=false;
missingDevice.authenticated_device.current_role_ids=["customer","detailer","admin"];
missingDevice.authenticated_device.observed_device_ids=["phone","desktop"];
const deviceRequired=buildRecoveryAuthenticatedDeviceClosureReview({execution_evidence:missingDevice});
assert.equal(deviceRequired.status,"authenticated_device_closure_review_required");

const unavailable=structuredClone(execution);
unavailable.recovery.source_available=false;
unavailable.recovery.status="source_unavailable";
const sourceBlocked=buildRecoveryAuthenticatedDeviceClosureReview({execution_evidence:unavailable});
assert.equal(sourceBlocked.status,"closure_review_source_unavailable");

console.log("BUILD 510 RECOVERY DRILL & AUTHENTICATED DEVICE CLOSURE REVIEW TEST: PASS");
