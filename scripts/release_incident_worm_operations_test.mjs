import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {writeAuthorization} from "./release_incident_worm_operations.mjs";
const base={GITHUB_ACTOR:"RosevearCreations",RD_WORM_OWNER:"RosevearCreations",
 GITHUB_EVENT_NAME:"workflow_dispatch",RD_WORM_WRITE:"true",
 RD_WORM_OWNER_APPROVED:"true",RD_WORM_APPROVAL_REF:"issue:123"};
assert.equal(writeAuthorization(base).authorized,true);
assert.equal(writeAuthorization({...base,GITHUB_EVENT_NAME:"schedule"}).authorized,false);
assert.equal(writeAuthorization({...base,GITHUB_ACTOR:"untrusted-user"}).authorized,false);
assert.equal(writeAuthorization({...base,RD_WORM_WRITE:"false"}).authorized,false);
assert.equal(writeAuthorization({...base,RD_WORM_OWNER_APPROVED:"false"}).authorized,false);
assert.equal(writeAuthorization({...base,RD_WORM_APPROVAL_REF:""}).authorized,false);
const workflow=readFileSync(new URL("../.github/workflows/trusted-worm-evidence-retention.yml",import.meta.url),"utf8");
assert.match(workflow,/cron:/);
assert.match(workflow,/id-token: write/);
assert.match(workflow,/github.ref == 'refs\/heads\/main'/);
assert.match(workflow,/vars.RD_WORM_ENABLED == 'true'/);
assert.match(workflow,/inputs.write_snapshot/);
assert.match(workflow,/inputs.owner_approved/);
assert.match(workflow,/inputs.owner_approval_ref/);
assert.match(workflow,/configure-aws-credentials@/);
assert.match(workflow,/persist-credentials: false/);
assert.ok(!workflow.includes("cancel-in-progress: true"));
console.log("Build 582 owner-only approval and scheduled read-only WORM workflow PASS");
