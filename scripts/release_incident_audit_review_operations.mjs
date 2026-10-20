#!/usr/bin/env node
/** Read-only Build 583 audit review. Provider writes/retention changes are forbidden.
 * The externally retained owner manifest values must be supplied; GitHub vars are not a trust root.
 */
import {appendFile} from "node:fs/promises";
import {collectIssueComments} from "./release_incident_audit_snapshot.mjs";
import {wormConfig,s3ComplianceAdapter} from "./release_incident_s3_worm_adapter.mjs";
import {reviewTrustedAudit} from "./release_incident_audit_retrieval_review.mjs";

export function reviewInputs(env){
  if(env.GITHUB_REPOSITORY!=="RosevearCreations/rosiedazzlers"||
     env.GITHUB_REF!=="refs/heads/main")throw Error("Audit review requires trusted main: HOLD");
  if(env.RD_WORM_AUDIT_ENABLED!=="true")return {enabled:false};
  if(env.RD_WORM_OWNER_ANCHOR_CONFIRMED!=="true")
    throw Error("Separately retained owner audit anchor not confirmed: HOLD");
  const issueNumber=Number(env.RD_WORM_ISSUE_NUMBER);
  const warningDays=Number(env.RD_WORM_EXPIRY_WARNING_DAYS||30);
  if(!Number.isInteger(warningDays)||warningDays<1||warningDays>365)
    throw Error("Expiry warning window invalid: HOLD");
  return {enabled:true,warningDays,manifest:{
    key:env.RD_WORM_AUDIT_KEY,versionId:env.RD_WORM_AUDIT_VERSION_ID,
    expectedDigest:env.RD_WORM_AUDIT_DIGEST,
    previousHash:env.RD_WORM_AUDIT_PREVIOUS_HASH||null,
    ownerApprovalRef:env.RD_WORM_AUDIT_APPROVAL_REF,
    independentEvidenceRef:env.RD_WORM_AUDIT_INDEPENDENT_REF,
    repository:env.GITHUB_REPOSITORY,issueNumber}};
}
const safe=s=>String(s??"").replace(/[<>`|\r\n]/g," ").slice(0,180);
async function summary(s){
  console.log(s);
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,s+"\n");
}
export async function main(env=process.env){
  const inputs=reviewInputs(env);
  if(!inputs.enabled){await summary("Build 583 owner audit review: HOLD — not enabled.");return;}
  const config=wormConfig(env);
  const adapter=s3ComplianceAdapter({config});
  await adapter.ensureReady();
  const [owner,repo]=inputs.manifest.repository.split("/");
  const comments=await collectIssueComments({owner,repo,issueNumber:inputs.manifest.issueNumber,
    token:env.GITHUB_TOKEN});
  const result=await reviewTrustedAudit({adapter,manifest:inputs.manifest,comments,
    warningDays:inputs.warningDays});
  await summary("## Rosie Dazzlers — exact-version retained audit review\n"+
    "- Result: **"+safe(result.status)+"**\n"+
    "- Object version: `"+safe(inputs.manifest.versionId)+"`\n"+
    "- Independent owner evidence reference: `"+safe(inputs.manifest.independentEvidenceRef)+"`\n"+
    "- Reason: "+safe(result.reason)+
    (result.expiry?"\n- Retain until: "+safe(result.expiry.retainUntil)+
      " ("+result.expiry.daysRemaining+" days remaining)":""));
  if(result.status==="HOLD")throw Error("Archived audit evidence is on HOLD");
  if(result.status==="REVIEW")console.warn("Owner audit review required; no retention extension or evidence edits were performed.");
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
  main().catch(e=>{console.error("Build 583 audit HOLD: "+e.message);process.exitCode=1;});
}
