import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {reviewInputs} from "./release_incident_audit_review_operations.mjs";
const base={GITHUB_REPOSITORY:"RosevearCreations/rosiedazzlers",GITHUB_REF:"refs/heads/main",
 RD_WORM_AUDIT_ENABLED:"true",RD_WORM_OWNER_ANCHOR_CONFIRMED:"true",
 RD_WORM_ISSUE_NUMBER:"22",RD_WORM_EXPIRY_WARNING_DAYS:"30",
 RD_WORM_AUDIT_KEY:"rosie/release-incident/22/evidence.json",
 RD_WORM_AUDIT_VERSION_ID:"s3-version-583",RD_WORM_AUDIT_DIGEST:"a".repeat(64),
 RD_WORM_AUDIT_APPROVAL_REF:"issue:22",RD_WORM_AUDIT_INDEPENDENT_REF:"owner-record:583"};
assert.equal(reviewInputs(base).manifest.versionId,"s3-version-583");
assert.equal(reviewInputs({...base,RD_WORM_AUDIT_ENABLED:"false"}).enabled,false);
assert.throws(()=>reviewInputs({...base,RD_WORM_OWNER_ANCHOR_CONFIRMED:"false"}),/HOLD/);
assert.throws(()=>reviewInputs({...base,GITHUB_REF:"refs/heads/dev"}),/HOLD/);
assert.throws(()=>reviewInputs({...base,RD_WORM_EXPIRY_WARNING_DAYS:"0"}),/HOLD/);
const workflow=readFileSync(new URL("../.github/workflows/trusted-worm-owner-audit-review.yml",import.meta.url),"utf8");
assert.match(workflow,/cron:/);
assert.match(workflow,/workflow_dispatch:/);
assert.match(workflow,/RD_WORM_AUDIT_ENABLED == 'true'/);
assert.match(workflow,/RD_WORM_AUDIT_ROLE_ARN/);
assert.match(workflow,/id-token: write/);
assert.match(workflow,/persist-credentials: false/);
assert.match(workflow,/scripts\/release_incident_audit_review_operations.mjs/);
assert.doesNotMatch(workflow,/write_snapshot|s3api put-object|retention-extension/);
console.log("Build 583 independent owner audit read-only schedule and gate PASS");
