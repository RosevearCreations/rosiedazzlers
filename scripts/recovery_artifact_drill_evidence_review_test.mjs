import assert from "node:assert/strict";
import { buildRecoveryArtifactDrillEvidenceReview } from "../functions/api/_lib/recovery-artifact-drill-evidence-review.js";
const review=buildRecoveryArtifactDrillEvidenceReview({generated_at:"2026-09-20T12:00:00Z",closure:{closure_candidate:true,required:[
{id:"backup_artifact",observed_at:"2026-09-19T12:00:00Z"},
{id:"retention_location",observed_at:"2026-08-15T12:00:00Z"},
{id:"recovery_drill",observed_at:"2026-05-01T12:00:00Z"}]}});
assert.equal(review.backup_artifact.freshness,"current");
assert.equal(review.retention_location.freshness,"aging");
assert.equal(review.recovery_drill.freshness,"stale");
assert.equal(review.status,"stale_review");
assert.equal(review.truth_boundary.production_restore_performed,false);
assert.equal(review.canonical_hold.backlog_mutated,false);
const missing=buildRecoveryArtifactDrillEvidenceReview({closure:{required:[{id:"backup_artifact",observed_at:null},{id:"retention_location",observed_at:null},{id:"recovery_drill",observed_at:null}]}});
assert.equal(missing.status,"owner_action");
assert.equal(missing.missing_count,3);
console.log("RECOVERY ARTIFACT & DRILL EVIDENCE REVIEW TEST: PASS");
