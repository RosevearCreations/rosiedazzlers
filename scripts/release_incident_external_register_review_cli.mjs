#!/usr/bin/env node
/** Build 587 optional manual, read-only reconciliation.
 * Config and external register trust pins must come from independently controlled
 * owner files, NEVER cloned GitHub source or fetched from register HTTP response.
 */
import {readFile} from "node:fs/promises";
import {collectIssueComments} from "./release_incident_audit_snapshot.mjs";
import {fetchExternalRotationRegister,reconcileExternalRotationRegister} from "./release_incident_external_rotation_register.mjs";
export function validateReviewEnvironment(env){
  if(env.GITHUB_REPOSITORY!=="RosevearCreations/rosiedazzlers"||
     env.GITHUB_REF!=="refs/heads/main"||
     env.GITHUB_EVENT_NAME!=="workflow_dispatch"||
     env.RD_EXTERNAL_REGISTER_REVIEW_ENABLED!=="true"||
     typeof env.RD_EXTERNAL_TRUST_BUNDLE_PATH!=="string"||
     !env.RD_EXTERNAL_TRUST_BUNDLE_PATH||
     typeof env.RD_EXTERNAL_REGISTER_URL!=="string"||
     !env.RD_EXTERNAL_REGISTER_URL)
    throw Error("Manual-only external owner audit review and separate trust bundle required: HOLD");
  return {url:env.RD_EXTERNAL_REGISTER_URL,path:env.RD_EXTERNAL_TRUST_BUNDLE_PATH};
}
export async function main(env=process.env){
  const input=validateReviewEnvironment(env);
  if(!env.GITHUB_TOKEN)throw Error("Authenticated read-only GitHub issue access required: HOLD");
  const trusted=JSON.parse(await readFile(input.path,"utf8"));
  if(!trusted||!Number.isSafeInteger(trusted.issueNumber)||trusted.issueNumber<1||
     !Array.isArray(trusted.signedEvidencePackages)||
     trusted.signedEvidencePackages.length<1||
     trusted.signedEvidencePackages.length>250)
    throw Error("Independently supplied signed history package invalid: HOLD");
  const signedRegister=await fetchExternalRotationRegister({url:input.url});
  const comments=await collectIssueComments({owner:"RosevearCreations",repo:"rosiedazzlers",
    issueNumber:trusted.issueNumber,token:env.GITHUB_TOKEN});
  const evidenceByReceiptDigest=new Map();
  const trustedFingerprintsByReceiptDigest=new Map();
  for(const item of trusted.signedEvidencePackages){
    if(!item||evidenceByReceiptDigest.has(item.receiptDigest))
      throw Error("Duplicate or missing independently pinned signed package: HOLD");
    evidenceByReceiptDigest.set(item.receiptDigest,item.evidence);
    trustedFingerprintsByReceiptDigest.set(item.receiptDigest,item.trustedFingerprints);
  }
  if(signedRegister.register?.issueNumber!==trusted.issueNumber)
    throw Error("External issue mismatch: HOLD");
  const result=reconcileExternalRotationRegister({
    comments,signedRegister,publicKeyPem:trusted.externalPublicKeyPem,
    trustedFingerprint:trusted.externalSigningFingerprint,
    externalPin:trusted.externalPin,previousPin:trusted.previousPin??null,
    evidenceByReceiptDigest,trustedFingerprintsByReceiptDigest});
  console.log(JSON.stringify({status:result.status,sequence:result.sequence,
    registerDigest:result.registerDigest,headDigest:result.headDigest,
    verifiedReceipts:result.verifiedReceipts,externalReference:result.externalReference,
    storageMutation:false},null,2));
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
  main().catch(e=>{console.error("External rotation register review HOLD: "+e.message);process.exitCode=1;});
}
