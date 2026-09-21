import assert from "node:assert/strict";
import { buildRecoveryEvidenceValidationDrillDecisionReadiness } from "../functions/api/_lib/recovery-evidence-validation-drill-decision-readiness.js";

const closure = {
  closure_candidate: true,
  required: [
    {id:"backup_artifact",title:"Backup",status:"observed_dated",classification:"owner_action_observed",observed_at:"2026-09-20T12:00:00Z"},
    {id:"retention_location",title:"Retention",status:"observed_dated",classification:"owner_action_observed",observed_at:"2026-09-19T12:00:00Z"},
    {id:"recovery_drill",title:"Drill",status:"observed_dated",classification:"owner_action_observed",observed_at:"2026-09-18T12:00:00Z"}
  ]
};
const review = {
  closure_candidate: true,
  rows: [
    {id:"backup_artifact",observed_at:"2026-09-20T12:00:00Z",evidence_age_days:1,freshness:"current"},
    {id:"retention_location",observed_at:"2026-09-19T12:00:00Z",evidence_age_days:2,freshness:"current"},
    {id:"recovery_drill",observed_at:"2026-09-18T12:00:00Z",evidence_age_days:3,freshness:"current"}
  ]
};
const readiness = {
  status:"operator_review_ready",
  rows: review.rows.map(row=>({...row,source_available:true,age_days:row.evidence_age_days})),
  closure_readiness:{retained_closure_candidate:true},
  drill_readiness:{status:"bounded_drill_ready"}
};

const ready=buildRecoveryEvidenceValidationDrillDecisionReadiness({closure,review,readiness,source_available:true,generated_at:"2026-09-21T12:00:00Z"});
assert.equal(ready.status,"operator_recovery_decision_ready");
assert.equal(ready.decision_package.narrowing_review_eligible,true);
assert.equal(ready.decision_package.default_if_no_operator_action,"retain_hold");
assert.deepEqual(ready.decision_package.permitted_operator_actions,["retain_hold","narrow_hold_with_dated_recovery_evidence"]);
assert.equal(ready.drill_decision.status,"no_new_drill_required_for_validation");
assert.equal(ready.drill_decision.production_restore_authorized,false);
assert.equal(ready.truth_boundary.drill_executed,false);

const aging=structuredClone(readiness);
aging.rows[1].freshness="aging";
const agingResult=buildRecoveryEvidenceValidationDrillDecisionReadiness({closure,review:{...review,rows:aging.rows},readiness:aging,source_available:true});
assert.equal(agingResult.status,"aging_evidence_review_required");
assert.equal(agingResult.decision_package.narrowing_review_eligible,false);

const stale=structuredClone(readiness);
stale.rows[2].freshness="stale";
stale.rows[2].age_days=120;
stale.status="stale_revalidation_required";
stale.drill_readiness.status="stale_revalidation_required";
const staleResult=buildRecoveryEvidenceValidationDrillDecisionReadiness({closure,review:{...review,rows:stale.rows},readiness:stale,source_available:true});
assert.equal(staleResult.status,"revalidate_before_drill_decision");
assert.equal(staleResult.drill_decision.status,"bounded_nonproduction_drill_candidate");
assert.deepEqual(staleResult.decision_package.permitted_operator_actions,["retain_hold","review_bounded_nonproduction_drill_plan"]);

const missingClosure=structuredClone(closure);
missingClosure.closure_candidate=false;
missingClosure.required[2].observed_at=null;
const missingReview=structuredClone(review);
missingReview.closure_candidate=false;
missingReview.rows[2]={id:"recovery_drill",observed_at:null,evidence_age_days:null,freshness:"missing"};
const missingReadiness=structuredClone(readiness);
missingReadiness.status="not_ready_owner_action";
missingReadiness.closure_readiness.retained_closure_candidate=false;
missingReadiness.rows[2]={id:"recovery_drill",source_available:true,observed_at:null,age_days:null,freshness:"missing"};
missingReadiness.drill_readiness.status="owner_action";
const missing=buildRecoveryEvidenceValidationDrillDecisionReadiness({closure:missingClosure,review:missingReview,readiness:missingReadiness,source_available:true});
assert.equal(missing.status,"retain_hold_missing_evidence");
assert.equal(missing.drill_decision.status,"bounded_nonproduction_drill_candidate");
assert.equal(missing.decision_package.narrowing_review_eligible,false);

const unavailable=buildRecoveryEvidenceValidationDrillDecisionReadiness({closure:{required:[]},review:{rows:[]},readiness:{rows:[]},source_available:false});
assert.equal(unavailable.status,"retain_hold_unavailable_source");
assert.equal(unavailable.drill_decision.status,"blocked_source_unavailable");
assert.equal(unavailable.canonical_hold.classification,"unavailable");

console.log("RECOVERY EVIDENCE VALIDATION & DRILL DECISION READINESS TEST: PASS");
