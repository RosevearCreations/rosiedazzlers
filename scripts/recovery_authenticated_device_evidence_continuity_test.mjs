#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildRecoveryAuthenticatedDeviceEvidenceContinuity } from "../functions/api/_lib/recovery-authenticated-device-evidence-continuity.js";

const currentRecovery={
  refresh_closure_review:{
    status:"retain_hold_closure_review_required",
    evidence_traceability:{
      evidence_trace_key:"backup:current|retention:current|drill:current",
      required_count:3,current_count:3,stale_count:0,aging_count:0,missing_count:0
    },
    owner_review_traceability:{status:"owner_review_not_recorded"},
    refresh_or_drill_plan:{kind:"none"},
    rows:[
      {id:"backup_artifact",title:"Backup",source_available:true,observed_at:"2026-09-23T10:00:00Z",dated:true,freshness:"current",classification:"owner_action_observed"},
      {id:"retention_location",title:"Retention",source_available:true,observed_at:"2026-09-23T10:05:00Z",dated:true,freshness:"current",classification:"owner_action_observed"},
      {id:"recovery_drill",title:"Drill",source_available:true,observed_at:"2026-09-23T10:10:00Z",dated:true,freshness:"current",classification:"owner_action_observed"}
    ]
  },
  validation_drill_decision_readiness:{status:"operator_recovery_decision_ready"}
};
const currentDevice={
  observation_refresh_regression_triage:{
    status:"current_observation_review_ready",
    current_observation_coverage_complete:true,
    current_pass_role_ids:["customer","detailer","operations","admin"],
    newly_observed_regression_role_ids:[],
    refresh_required_role_ids:[],
    observed_device_ids:["phone","tablet","desktop"],
    refresh_required_device_ids:[],
    observed_browser_ids:["chrome","safari","edge"],
    regression_device_ids:[],
    regression_browser_ids:[]
  },
  regression_closure:{status:"no_current_regression_observed",current_coverage_complete:true}
};

const ready=buildRecoveryAuthenticatedDeviceEvidenceContinuity({
  recovery:currentRecovery,
  authenticated_device:currentDevice,
  generated_at:"2026-09-24T12:00:00Z"
});
assert.equal(ready.continuity_enrichment_build,490);
assert.equal(ready.status,"bounded_continuity_review_ready");
assert.equal(ready.recovery.status,"current_review_ready");
assert.equal(ready.authenticated_device.status,"current_observation_review_ready");
assert.deepEqual(ready.authenticated_device.observed_device_ids,["phone","tablet","desktop"]);
assert.deepEqual(ready.authenticated_device.observed_browser_ids,["chrome","safari","edge"]);
assert.equal(ready.continuity_rules.recovery_and_device_populations_joined,false);
assert.equal(ready.continuity_rules.current_negative_device_observation_overrides_historical_acceptance,true);
assert.equal(ready.truth_boundary.production_restore_performed,false);
assert.equal(ready.truth_boundary.automated_browser_farm_created,false);

const regression=buildRecoveryAuthenticatedDeviceEvidenceContinuity({
  recovery:currentRecovery,
  authenticated_device:{
    observation_refresh_regression_triage:{
      ...currentDevice.observation_refresh_regression_triage,
      status:"regression_triage_required",
      newly_observed_regression_role_ids:["detailer"],
      regression_device_ids:["phone"],
      regression_browser_ids:["safari"]
    },
    regression_closure:{status:"current_regression_observed",current_coverage_complete:true}
  }
});
assert.equal(regression.status,"current_device_regression_triage_required");
assert.deepEqual(regression.authenticated_device.regression_role_ids,["detailer"]);
assert.equal(regression.authenticated_device.current_negative_overrides_historical_acceptance,true);

const staleRecovery=structuredClone(currentRecovery);
staleRecovery.refresh_closure_review.evidence_traceability.current_count=2;
staleRecovery.refresh_closure_review.evidence_traceability.stale_count=1;
staleRecovery.refresh_closure_review.refresh_or_drill_plan.kind="bounded_nonproduction_drill";
staleRecovery.refresh_closure_review.rows[2].freshness="stale";
const stale=buildRecoveryAuthenticatedDeviceEvidenceContinuity({recovery:staleRecovery,authenticated_device:currentDevice});
assert.equal(stale.status,"recovery_refresh_or_drill_review_required");
assert.equal(stale.recovery.plan_kind,"bounded_nonproduction_drill");
assert.equal(stale.recovery.bounded_nonproduction_only,true);
assert.equal(stale.truth_boundary.recovery_drill_executed,false);

const incomplete=buildRecoveryAuthenticatedDeviceEvidenceContinuity({
  recovery:currentRecovery,
  authenticated_device:{
    observation_refresh_regression_triage:{
      status:"observation_refresh_required",
      current_observation_coverage_complete:false,
      current_pass_role_ids:["customer","admin"],
      newly_observed_regression_role_ids:[],
      refresh_required_role_ids:["detailer","operations"],
      observed_device_ids:["desktop"],
      refresh_required_device_ids:["phone","tablet"],
      observed_browser_ids:["chrome"],
      regression_device_ids:[],
      regression_browser_ids:[]
    },
    regression_closure:{status:"refresh_required",current_coverage_complete:false}
  }
});
assert.equal(incomplete.status,"device_observation_refresh_required");
assert.deepEqual(incomplete.authenticated_device.refresh_required_role_ids,["detailer","operations"]);

const unavailable=buildRecoveryAuthenticatedDeviceEvidenceContinuity({
  recovery:{refresh_closure_review:{status:"blocked_source_unavailable",rows:[]}},
  authenticated_device:{observation_refresh_regression_triage:{status:"unavailable"}}
});
assert.equal(unavailable.status,"continuity_source_unavailable");
assert.equal(unavailable.truth_boundary.canonical_hold_mutated,false);
assert.equal(unavailable.truth_boundary.schema_or_storage_mutated,false);
assert.equal(unavailable.truth_boundary.permanent_polling,false);

console.log("BUILD 490 RECOVERY & AUTHENTICATED DEVICE EVIDENCE CONTINUITY TEST: PASS");
