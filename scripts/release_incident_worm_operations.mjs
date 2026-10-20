#!/usr/bin/env node
/** Build 582 — scheduled read-only evidence collection, explicitly approved WORM writes.
 * Scheduling NEVER writes: manual dispatch with owner approval is the only write path.
 */
import {appendFile} from "node:fs/promises";
import {collectIssueComments,createAuditSnapshot} from "./release_incident_audit_snapshot.mjs";
import {wormConfig,s3ComplianceAdapter} from "./release_incident_s3_worm_adapter.mjs";
import {retainSnapshot,ownerAuditEvidence} from "./release_incident_trusted_retention.mjs";

export function writeAuthorization(env) {
  const isOwner=env.GITHUB_ACTOR===env.RD_WORM_OWNER;
  const manual=env.GITHUB_EVENT_NAME==="workflow_dispatch";
  const approved=env.RD_WORM_WRITE==="true" && env.RD_WORM_OWNER_APPROVED==="true" &&
    /^[a-zA-Z0-9][a-zA-Z0-9._:/#-]{2,180}$/.test(env.RD_WORM_APPROVAL_REF||"");
  return {authorized:manual&&isOwner&&approved,manual,approved,isOwner};
}
const safe=s=>String(s??"").replace(/[<>|\r\n]/g," ").slice(0,180);
async function summary(message){
  console.log(message);
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,message+"\n");
}
export async function main(env=process.env) {
  if(env.GITHUB_REPOSITORY!=="RosevearCreations/rosiedazzlers"||
     env.GITHUB_REF!=="refs/heads/main")throw Error("Untrusted repository or ref: HOLD");
  if(env.RD_WORM_ENABLED!=="true") {await summary("Build 582 WORM operations: HOLD — owner has not enabled retention.");return;}
  const [owner,repo]=env.GITHUB_REPOSITORY.split("/");
  const issueNumber=Number(env.RD_WORM_ISSUE_NUMBER);
  if(!Number.isSafeInteger(issueNumber)||issueNumber<1)
    throw Error("Owner must configure RD_WORM_ISSUE_NUMBER: HOLD");
  const comments=await collectIssueComments({owner,repo,issueNumber,token:env.GITHUB_TOKEN});
  const snapshot=createAuditSnapshot({comments,owner,repository:env.GITHUB_REPOSITORY,issueNumber});
  await summary("Build 582 evidence scan: "+comments.length+" comments; "+snapshot.rows.length+
    " valid owner decisions; digest \`"+snapshot.digest+"\`.");
  const config=wormConfig(env);
  const adapter=s3ComplianceAdapter({config});
  await adapter.ensureReady();
  await summary("Independent S3 COMPLIANCE Object Lock and bucket versioning confirmed for "+safe(config.bucket)+".");
  const auth=writeAuthorization(env);
  if(!auth.authorized){
    await summary("PREVIEW ONLY. No immutable object written; a manual owner-approved dispatch is required.");
    return;
  }
  if(snapshot.rows.length===0)throw Error("No valid owner decision receipts; refuse immutable empty snapshot");
  const key="rosie/release-incident/"+issueNumber+"/"+new Date().toISOString().slice(0,10)+"-"+snapshot.digest+".json";
  const approval={approved:true,reference:env.RD_WORM_APPROVAL_REF};
  const receipt=await retainSnapshot({snapshot,adapter,key,ownerApproval:approval});
  const proof=await ownerAuditEvidence({adapter,key,expectedDigest:snapshot.digest});
  if(proof.status!=="VERIFIED")throw Error("Immutable read-back evidence unverified: HOLD");
  await summary("Immutable snapshot retained and independently read back: \`"+safe(receipt.key)+"\` ("+snapshot.digest+").");
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
  main().catch(err=>{console.error("Build 582 WORM HOLD: "+err.message);process.exitCode=1;});
}
