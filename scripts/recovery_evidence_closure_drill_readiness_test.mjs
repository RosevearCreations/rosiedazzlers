import assert from "node:assert/strict";
import { buildRecoveryEvidenceClosureDrillReadiness } from "../functions/api/_lib/recovery-evidence-closure-drill-readiness.js";

const closure = {
  closure_candidate: true,
  required: [
    { id:"backup_artifact", title:"Backup", status:"observed_dated", classification:"owner_action_observed", observed_at:"2026-09-19T12:00:00Z" },
    { id:"retention_location", title:"Retention", status:"observed_dated", classification:"owner_action_observed", observed_at:"2026-09-18T12:00:00Z" },
    { id:"recovery_drill", title:"Drill", status:"observed_dated", classification:"owner_action_observed", observed_at:"2026-09-17T12:00:00Z" }
  ]
};
const review = {
  closure_candidate: true,
  rows: [
    { id:"backup_artifact", observed_at:"2026-09-19T12:00:00Z", evidence_age_days:1, freshness:"current" },
    { id:"retention_location", observed_at:"2026-09-18T12:00:00Z", evidence_age_days:2, freshness:"current" },
    { id:"recovery_drill", observed_at:"2026-09-17T12:00:00Z", evidence_age_days:3, freshness:"current" }
  ]
};

const ready=buildRecoveryEvidenceClosureDrillReadiness({closure,review,source_available:true,generated_at:"2026-09-20T12:00:00Z"});
assert.equal(ready.status,"operator_review_ready");
assert.equal(ready.source_availability.available_count,3);
assert.equal(ready.evidence_freshness.dated_count,3);
assert.equal(ready.drill_readiness.status,"bounded_drill_ready");
assert.equal(ready.canonical_hold.backlog_mutated,false);
assert.equal(ready.truth_boundary.production_restore_performed,false);

const stale=structuredClone(review);
stale.rows[2].freshness="stale";
stale.rows[2].evidence_age_days=120;
const staleResult=buildRecoveryEvidenceClosureDrillReadiness({closure,review:stale,source_available:true});
assert.equal(staleResult.status,"stale_revalidation_required");
assert.equal(staleResult.drill_readiness.status,"stale_revalidation_required");

const missingClosure=structuredClone(closure);
missingClosure.closure_candidate=false;
missingClosure.required[2]={id:"recovery_drill",title:"Drill",status:"owner_action",classification:"owner_action",observed_at:null};
const missingReview=structuredClone(review);
missingReview.closure_candidate=false;
missingReview.rows[2]={id:"recovery_drill",observed_at:null,evidence_age_days:null,freshness:"missing"};
const missing=buildRecoveryEvidenceClosureDrillReadiness({closure:missingClosure,review:missingReview,source_available:true});
assert.equal(missing.status,"not_ready_owner_action");
assert.equal(missing.drill_readiness.status,"owner_action");

const unavailable=buildRecoveryEvidenceClosureDrillReadiness({closure:{required:[]},review:{rows:[]},source_available:false});
assert.equal(unavailable.status,"not_ready_unavailable_source");
assert.equal(unavailable.source_availability.unavailable_count,3);
assert.equal(unavailable.canonical_hold.classification,"unavailable");

console.log("RECOVERY EVIDENCE CLOSURE & DRILL READINESS TEST: PASS");
