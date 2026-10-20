import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateReviewEnvironment} from "./release_incident_external_register_review_cli.mjs";
const env={GITHUB_REPOSITORY:"RosevearCreations/rosiedazzlers",
 GITHUB_REF:"refs/heads/main",GITHUB_EVENT_NAME:"workflow_dispatch",
 RD_EXTERNAL_REGISTER_REVIEW_ENABLED:"true",
 RD_EXTERNAL_TRUST_BUNDLE_PATH:"/operator/private/signed-trust.json",
 RD_EXTERNAL_REGISTER_URL:"https://independent-register.example.com/latest.json"};
assert.equal(validateReviewEnvironment(env).path,env.RD_EXTERNAL_TRUST_BUNDLE_PATH);
assert.throws(()=>validateReviewEnvironment({...env,GITHUB_EVENT_NAME:"schedule"}),/HOLD/);
assert.throws(()=>validateReviewEnvironment({...env,GITHUB_REF:"refs/heads/dev"}),/HOLD/);
assert.throws(()=>validateReviewEnvironment({...env,RD_EXTERNAL_REGISTER_REVIEW_ENABLED:"false"}),/HOLD/);
assert.throws(()=>validateReviewEnvironment({...env,RD_EXTERNAL_TRUST_BUNDLE_PATH:""}),/HOLD/);
const cli=readFileSync(new URL("./release_incident_external_register_review_cli.mjs",import.meta.url),"utf8");
for(const forbidden of ["put-object","delete-object","PATCH","method:\"POST\"","sign("])
 assert.ok(!cli.includes(forbidden),"read-only external review must not create evidence");
console.log("Build 587 manual external register reconciliation CLI is read-only and owner-scoped PASS");
