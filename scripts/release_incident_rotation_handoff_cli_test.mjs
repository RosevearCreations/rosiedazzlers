import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {manualOperatorConfig} from "./release_incident_rotation_handoff_cli.mjs";
const base={GITHUB_REPOSITORY:"RosevearCreations/rosiedazzlers",
 GITHUB_REF:"refs/heads/main",RD_ROTATION_ISSUE_NUMBER:"77",
 RD_ROTATION_MANUAL_COMMIT:"false",GITHUB_EVENT_NAME:"schedule"};
assert.deepEqual(manualOperatorConfig(base),{issueNumber:77,write:false});
assert.throws(()=>manualOperatorConfig({...base,GITHUB_REF:"refs/heads/dev"}),/HOLD/);
assert.throws(()=>manualOperatorConfig({...base,RD_ROTATION_ISSUE_NUMBER:"0"}),/HOLD/);
assert.throws(()=>manualOperatorConfig({...base,RD_ROTATION_MANUAL_COMMIT:"true"}),/HOLD/);
assert.throws(()=>manualOperatorConfig({...base,RD_ROTATION_MANUAL_COMMIT:"true",
 GITHUB_EVENT_NAME:"workflow_dispatch",GITHUB_ACTOR:"stranger",
 RD_ROTATION_OWNER_CONFIRMED:"true",RD_ROTATION_SIGNED_PACKAGE_PATH:"/tmp/proof.json"}),/HOLD/);
assert.equal(manualOperatorConfig({...base,RD_ROTATION_MANUAL_COMMIT:"true",
 GITHUB_EVENT_NAME:"workflow_dispatch",GITHUB_ACTOR:"RosevearCreations",
 RD_ROTATION_OWNER_CONFIRMED:"true",RD_ROTATION_SIGNED_PACKAGE_PATH:"signed-evidence.json"}).write,true);
const cli=readFileSync(new URL("./release_incident_rotation_handoff_cli.mjs",import.meta.url),"utf8");
assert.ok(!cli.includes("AWS_ACCESS_KEY_ID"));
assert.ok(!cli.includes("put-object"));
assert.ok(!cli.includes("delete-object"));
console.log("Build 586 optional read-only operator and manual-only persisted handoff CLI PASS");
