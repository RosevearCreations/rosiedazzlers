#!/usr/bin/env node
/** Build 586 manual-only operator entrypoint. No scheduled writers. */
import {readFile} from "node:fs/promises";
import {collectIssueComments} from "./release_incident_audit_snapshot.mjs";
import {crossAnchorHistory,persistRotationHandoff} from "./release_incident_rotation_handoff_receipts.mjs";
export function manualOperatorConfig(env){
  if(env.GITHUB_REPOSITORY!=="RosevearCreations/rosiedazzlers"||
     env.GITHUB_REF!=="refs/heads/main")throw Error("Trusted Rosie main branch required: HOLD");
  const issueNumber=Number(env.RD_ROTATION_ISSUE_NUMBER);
  if(!Number.isSafeInteger(issueNumber)||issueNumber<1)
    throw Error("Rotation audit issue number required: HOLD");
  const write=env.RD_ROTATION_MANUAL_COMMIT==="true";
  if(write&&(env.GITHUB_EVENT_NAME!=="workflow_dispatch"||
      env.GITHUB_ACTOR!=="RosevearCreations"||
      env.RD_ROTATION_OWNER_CONFIRMED!=="true"||
      !env.RD_ROTATION_SIGNED_PACKAGE_PATH))
    throw Error("Explicit authorized owner manual dispatch and signed evidence file required: HOLD");
  return {issueNumber,write};
}
export async function main(env=process.env){
  const cfg=manualOperatorConfig(env);
  if(!env.GITHUB_TOKEN)throw Error("Least privilege GitHub issue token required: HOLD");
  if(!cfg.write){
    const comments=await collectIssueComments({owner:"RosevearCreations",
      repo:"rosiedazzlers",issueNumber:cfg.issueNumber,token:env.GITHUB_TOKEN});
    const status=crossAnchorHistory({comments,expectedIssueNumber:cfg.issueNumber});
    console.log(JSON.stringify({status:status.status,receiptCount:status.entries.length,
      headDigest:status.headDigest,requiresIndependentHeadPin:true},null,2));
    return;
  }
  // The signed proof package and three independently pinned key fingerprints are
  // supplied by the operator, never created by this process or downloaded from comments.
  const evidence=JSON.parse(await readFile(env.RD_ROTATION_SIGNED_PACKAGE_PATH,"utf8"));
  const result=await persistRotationHandoff({
    evidence,issueNumber:cfg.issueNumber,token:env.GITHUB_TOKEN,
    authorization:{event:env.GITHUB_EVENT_NAME,actor:env.GITHUB_ACTOR,
      confirmed:env.RD_ROTATION_OWNER_CONFIRMED==="true",
      reference:env.RD_ROTATION_OWNER_APPROVAL_REF,
      trustedOwnerFingerprint:env.RD_ROTATION_OWNER_FINGERPRINT,
      trustedPriorFingerprint:env.RD_ROTATION_PRIOR_FINGERPRINT,
      trustedSuccessorFingerprint:env.RD_ROTATION_SUCCESSOR_FINGERPRINT}
  });
  console.log(JSON.stringify(result,null,2));
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
  main().catch(e=>{console.error("Build 586 owner handoff HOLD: "+e.message);process.exitCode=1;});
}
