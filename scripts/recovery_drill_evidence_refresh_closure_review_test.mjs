import assert from "node:assert/strict";
import { buildRecoveryDrillEvidenceRefreshClosureReview } from "../functions/api/_lib/recovery-drill-evidence-refresh-closure-review.js";

const currentRows = [
  {id:"backup_artifact",title:"Backup",source_available:true,observed_at:"2026-09-21T10:00:00Z",age_days:0,freshness:"current",classification:"owner_action_observed"},
  {id:"retention_location",title:"Retention",source_available:true,observed_at:"2026-09-21T10:05:00Z",age_days:0,freshness:"current",classification:"owner_action_observed"},
  {id:"recovery_drill",title:"Drill",source_available:true,observed_at:"2026-09-21T10:10:00Z",age_days:0,freshness:"current",classification:"owner_action_observed"}
];

const currentValidation = {
  status:"operator_recovery_decision_ready",
  rows:currentRows,
  decision_package:{narrowing_review_eligible:true}
};

const awaitingClosure=buildRecoveryDrillEvidenceRefreshClosureReview({validation:currentValidation});
assert.equal(awaitingClosure.status,"retain_hold_closure_review_required");
assert.equal(awaitingClosure.refresh_or_drill_plan.kind,"none");
assert.equal(awaitingClosure.closure_review.default_if_no_owner_action,"retain_hold");

const currentTrace=awaitingClosure.evidence_traceability.evidence_trace_key;
const closureCandidate=buildRecoveryDrillEvidenceRefreshClosureReview({
  validation:currentValidation,
  owner_review:{reviewed_at:"2026-09-22T04:20:00Z",reviewer_role:"owner",decision:"narrow_hold_with_dated_recovery_evidence",evidence_trace_key:currentTrace}
});
assert.equal(closureCandidate.status,"closure_review_ready_for_manual_hold_update");
assert.equal(closureCandidate.closure_review.manual_hold_update_candidate,true);
assert.equal(closureCandidate.closure_review.canonical_hold_mutated,false);

const staleDrillRows=structuredClone(currentRows);
staleDrillRows[2].freshness="stale";
staleDrillRows[2].age_days=120;
const staleDrillValidation={
  status:"revalidate_before_drill_decision",
  rows:staleDrillRows,
  decision_package:{narrowing_review_eligible:false}
};
const staleDrill=buildRecoveryDrillEvidenceRefreshClosureReview({validation:staleDrillValidation});
assert.equal(staleDrill.status,"retain_hold_bounded_drill_plan_review_required");
assert.equal(staleDrill.refresh_or_drill_plan.kind,"bounded_nonproduction_drill");
assert.equal(staleDrill.refresh_or_drill_plan.production_restore_authorized,false);
assert.ok(staleDrill.refresh_or_drill_plan.prerequisites.length>=5);
assert.ok(staleDrill.refresh_or_drill_plan.post_observation_evidence_requirements.includes("environment_or_target"));

const staleTrace=staleDrill.evidence_traceability.evidence_trace_key;
const drillPlan=buildRecoveryDrillEvidenceRefreshClosureReview({
  validation:staleDrillValidation,
  owner_review:{reviewed_at:"2026-09-22T04:21:00Z",reviewer_role:"owner",decision:"approve_bounded_nonproduction_drill_plan",evidence_trace_key:staleTrace}
});
assert.equal(drillPlan.status,"bounded_nonproduction_drill_plan_ready_for_separate_execution");
assert.equal(drillPlan.refresh_or_drill_plan.execution_authorized_by_this_package,false);
assert.equal(drillPlan.truth_boundary.drill_executed,false);
assert.equal(drillPlan.truth_boundary.production_restore_performed,false);

const missingBackupRows=structuredClone(currentRows);
missingBackupRows[0].observed_at=null;
missingBackupRows[0].dated=false;
missingBackupRows[0].freshness="missing";
const missingValidation={
  status:"retain_hold_missing_evidence",
  rows:missingBackupRows,
  decision_package:{narrowing_review_eligible:false}
};
const missing=buildRecoveryDrillEvidenceRefreshClosureReview({validation:missingValidation});
assert.equal(missing.status,"retain_hold_evidence_refresh_review_required");
assert.equal(missing.refresh_or_drill_plan.kind,"evidence_refresh");
assert.deepEqual(missing.evidence_traceability.refresh_required_ids,["backup_artifact"]);

const missingTrace=missing.evidence_traceability.evidence_trace_key;
const refreshPlan=buildRecoveryDrillEvidenceRefreshClosureReview({
  validation:missingValidation,
  owner_review:{reviewed_at:"2026-09-22T04:22:00Z",reviewer_role:"owner",decision:"approve_evidence_refresh_plan",evidence_trace_key:missingTrace}
});
assert.equal(refreshPlan.status,"evidence_refresh_plan_ready_for_separate_execution");
assert.equal(refreshPlan.truth_boundary.evidence_refresh_executed,false);

const mismatch=buildRecoveryDrillEvidenceRefreshClosureReview({
  validation:staleDrillValidation,
  owner_review:{reviewed_at:"2026-09-22T04:23:00Z",reviewer_role:"owner",decision:"approve_bounded_nonproduction_drill_plan",evidence_trace_key:"old-evidence"}
});
assert.equal(mismatch.status,"retain_hold_bounded_drill_plan_review_required");
assert.equal(mismatch.owner_review_traceability.status,"owner_review_trace_mismatch");

const unavailableRows=structuredClone(currentRows);
unavailableRows[0].source_available=false;
unavailableRows[0].freshness="unavailable";
const unavailable=buildRecoveryDrillEvidenceRefreshClosureReview({
  validation:{status:"retain_hold_unavailable_source",rows:unavailableRows,decision_package:{}}
});
assert.equal(unavailable.status,"blocked_source_unavailable");
assert.equal(unavailable.canonical_hold.classification,"unavailable");

console.log("RECOVERY DRILL EVIDENCE REFRESH & CLOSURE REVIEW TEST: PASS");
