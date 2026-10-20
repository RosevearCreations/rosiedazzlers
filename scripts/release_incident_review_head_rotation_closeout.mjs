/** Build 592 — independently pinned owner review-head rotation register and
 * explicit owner exception closeout review rules. Fully read-only.
 * All stored heads are reread from exact Object Lock COMPLIANCE versions.
 * Neither a signed proposal nor an auditor attestation clears a live audit HOLD.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyRetainedOwnerReviewHead,verifyManualExceptionHandoff}
  from "./release_incident_owner_head_retention_handoff.mjs";
const SHA=/^[0-9a-f]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const MAX=100;
const digest=value=>createHash("sha256").update(canonicalBytes(value)).digest("hex");
const claimKeys=["schema","repository","issueNumber","previousReviewObjectKey",
  "previousReviewVersionId","previousRecordDigest","previousReviewHeadDigest",
  "successorReviewObjectKey","successorReviewVersionId","successorRecordDigest",
  "successorReviewHeadDigest","action","owner","approvalRef","issuedAt",
  "previousRotationDigest"];
const resolveKeys=["schema","repository","issueNumber","incidentRef","rotationDigest",
  "handoffDigest","evidenceRef","resolution","reviewedAt"];
const closeoutKeys=["schema","repository","issueNumber","incidentRef","rotationDigest",
  "handoffDigest","resolutionDigest","action","owner","approvalRef","issuedAt"];
function iso(value){
  if(typeof value!=="string"||!Number.isFinite(Date.parse(value))||
     new Date(value).toISOString()!==value)
    throw Error("Canonical manual review timestamp required: HOLD");
  return Date.parse(value);
}
function keys(obj,fields){
  return obj!==null&&typeof obj==="object"&&!Array.isArray(obj)&&
    Object.keys(obj).sort().join(",")===fields.slice().sort().join(",");
}
function pinnedKey(pem,pin){
  if(typeof pem!=="string"||pem.length>8192||!SHA.test(pin||""))
    throw Error("Independent Ed25519 fingerprint required: HOLD");
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519"||
     createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")!==pin)
    throw Error("Independent signing key fingerprint mismatch: HOLD");
  return key;
}
function signedClaim(receipt,fields,expected,key){
  if(receipt?.algorithm!=="Ed25519"||!keys(receipt.claims,fields)||
     typeof receipt.signature!=="string"||
     !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature)||
     fields.some(k=>receipt.claims[k]!==expected[k]))
    throw Error("Missing or mismatched signed manual owner evidence: HOLD");
  const sig=Buffer.from(receipt.signature,"base64");
  if(sig.length!==64||!verify(null,canonicalBytes(expected),key,sig))
    throw Error("Manual owner evidence signature invalid: HOLD");
}
export function reviewHeadRotationClaims(previous,successor,approvalRef,issuedAt,previousRotationDigest=null){
  if(previous?.status!=="INDEPENDENTLY_PINNED_OWNER_HEAD_RETAINED"||
     successor?.status!=="INDEPENDENTLY_PINNED_OWNER_HEAD_RETAINED"||
     !Number.isSafeInteger(previous.issueNumber)||previous.issueNumber<1||
     previous.issueNumber!==successor.issueNumber||
     !SHA.test(previous.recordDigest||"")||!SHA.test(successor.recordDigest||"")||
     previous.recordDigest===successor.recordDigest||
     !SHA.test(previous.reviewHeadDigest||"")||!SHA.test(successor.reviewHeadDigest||"")||
     previous.reviewHeadDigest===successor.reviewHeadDigest||
     previous.objectKey===successor.objectKey||
     previous.versionId===successor.versionId||
     previous.ownerSignerFingerprint!==successor.ownerSignerFingerprint||
     !REF.test(approvalRef||"")||
     !(previousRotationDigest===null||SHA.test(previousRotationDigest||"")))
    throw Error("Two distinct verified owner review heads and manual approval required: HOLD");
  iso(issuedAt);
  return {schema:"rosie.owner-review-head-rotation.v1",
    repository:"RosevearCreations/rosiedazzlers",issueNumber:previous.issueNumber,
    previousReviewObjectKey:previous.objectKey,previousReviewVersionId:previous.versionId,
    previousRecordDigest:previous.recordDigest,previousReviewHeadDigest:previous.reviewHeadDigest,
    successorReviewObjectKey:successor.objectKey,successorReviewVersionId:successor.versionId,
    successorRecordDigest:successor.recordDigest,successorReviewHeadDigest:successor.reviewHeadDigest,
    action:"REQUEST_MANUAL_ROTATION_REVIEW",owner:"RosevearCreations",
    approvalRef,issuedAt,previousRotationDigest};
}
export async function verifyReviewHeadRotationRegister({transitions,ownerPublicKeyPem,
  pinnedOwnerFingerprint,independentRotationPin,now=new Date()}){
  if(!Array.isArray(transitions)||!transitions.length||transitions.length>MAX)
    throw Error("Complete bounded owner rotation register required: HOLD");
  const key=pinnedKey(ownerPublicKeyPem,pinnedOwnerFingerprint),clock=new Date(now).getTime();
  if(!Number.isFinite(clock))throw Error("Rotation review clock invalid: HOLD");
  let previousDigest=null,previousHead=null,previousAt=0;
  const history=[];
  for(const transition of transitions){
    if(!transition?.priorVerification||!transition?.successorVerification||
       !transition.ownerApproval)
      throw Error("Each rotation requires both exact-version verified evidence packages: HOLD");
    const [prior,successor]=await Promise.all([
      verifyRetainedOwnerReviewHead({...transition.priorVerification,now}),
      verifyRetainedOwnerReviewHead({...transition.successorVerification,now})
    ]);
    if(prior.ownerSignerFingerprint!==pinnedOwnerFingerprint||
       successor.ownerSignerFingerprint!==pinnedOwnerFingerprint)
      throw Error("Rotation owner identity changed without independent owner review: HOLD");
    if(previousHead&&(previousHead.recordDigest!==prior.recordDigest||
       previousHead.versionId!==prior.versionId||
       previousHead.objectKey!==prior.objectKey))
      throw Error("Rotation predecessor retained head is not contiguous: HOLD");
    const claims=transition.ownerApproval.claims;
    const expected=reviewHeadRotationClaims(prior,successor,claims?.approvalRef,
      claims?.issuedAt,previousDigest);
    if(iso(expected.issuedAt)<=previousAt||iso(expected.issuedAt)>clock+300000)
      throw Error("Owner rotation approval timestamp replay or future claim: HOLD");
    signedClaim(transition.ownerApproval,claimKeys,expected,key);
    const rotationDigest=digest(transition.ownerApproval);
    history.push({rotationDigest,fromRecordDigest:prior.recordDigest,
      successorRecordDigest:successor.recordDigest,
      fromReviewHeadDigest:prior.reviewHeadDigest,
      successorReviewHeadDigest:successor.reviewHeadDigest,
      successorVersionId:successor.versionId,ownerApprovalRef:expected.approvalRef,
      issuedAt:expected.issuedAt});
    previousHead=successor;previousDigest=rotationDigest;previousAt=iso(expected.issuedAt);
  }
  if(!independentRotationPin||independentRotationPin.headDigest!==previousDigest||
     independentRotationPin.receiptCount!==history.length||
     independentRotationPin.successorRecordDigest!==previousHead.recordDigest||
     !REF.test(independentRotationPin.externalReference||""))
    throw Error("Independent complete rotation-register head anchor missing or inconsistent: HOLD");
  return {status:"INDEPENDENTLY_ANCHORED_ROTATION_REVIEW",
    issueNumber:previousHead.issueNumber,headDigest:previousDigest,
    successorRecordDigest:previousHead.recordDigest,
    successorReviewHeadDigest:previousHead.reviewHeadDigest,
    history,ownerFingerprint:pinnedOwnerFingerprint,automaticRotation:false,
    automaticClosure:false,externalWritePerformed:false};
}
export function independentResolutionClaims({rotation,handOff,incidentRef,evidenceRef,reviewedAt}){
  if(rotation?.status!=="INDEPENDENTLY_ANCHORED_ROTATION_REVIEW"||
     handOff?.status!=="SIGNED_MANUAL_EXCEPTION_HANDOFF_VERIFIED"||
     !REF.test(incidentRef||"")||!REF.test(evidenceRef||""))
    throw Error("Verified owner handoff and external rotation required for closeout: HOLD");
  iso(reviewedAt);
  return {schema:"rosie.independent-exception-resolution.v1",
    repository:"RosevearCreations/rosiedazzlers",issueNumber:rotation.issueNumber,
    incidentRef,rotationDigest:rotation.headDigest,
    handoffDigest:handOff.headDigest,evidenceRef,resolution:"REVIEWED_RESOLUTION_EVIDENCE",
    reviewedAt};
}
export function ownerCloseoutReviewClaims(rotation,handOff,auditor,ownerReceipt){
  const claims=ownerReceipt?.claims;
  if(!claims||!REF.test(claims.incidentRef||"")||!REF.test(claims.approvalRef||""))
    throw Error("Explicit owner closeout receipt missing: HOLD");
  iso(claims.issuedAt);
  return {schema:"rosie.owner-exception-closeout-review.v1",
    repository:"RosevearCreations/rosiedazzlers",issueNumber:rotation.issueNumber,
    incidentRef:claims.incidentRef,rotationDigest:rotation.headDigest,
    handoffDigest:handOff.headDigest,resolutionDigest:digest(auditor),
    action:"REQUEST_MANUAL_CLOSEOUT_REVIEW",owner:"RosevearCreations",
    approvalRef:claims.approvalRef,issuedAt:claims.issuedAt};
}
/** Closeout NEVER modifies the audit HOLD. Independent auditor and owner must
 * both sign; this is only a candidate for explicit human operational decision.
 */
export async function evaluateExplicitOwnerExceptionCloseout({
  rotationArguments,handoffArguments,
  resolutionReceipt,auditorPublicKeyPem,pinnedAuditorFingerprint,
  ownerCloseoutReceipt,ownerPublicKeyPem,pinnedOwnerFingerprint,
  now=new Date()
}){
  const rotation=await verifyReviewHeadRotationRegister({...rotationArguments,now});
  const handOff=await verifyManualExceptionHandoff({...handoffArguments,now});
  if(rotation.ownerFingerprint!==pinnedOwnerFingerprint||
     rotation.successorRecordDigest!==handoff.recordDigest||
     rotation.issueNumber!==handoffArguments.issueNumber||
     pinnedAuditorFingerprint===pinnedOwnerFingerprint)
    throw Error("Independent owner/auditor identity or retained owner head differs: HOLD");
  const auditKey=pinnedKey(auditorPublicKeyPem,pinnedAuditorFingerprint);
  const audit=resolutionReceipt?.claims;
  const expected=independentResolutionClaims({rotation,handOff,incidentRef:audit?.incidentRef,
    evidenceRef:audit?.evidenceRef,reviewedAt:audit?.reviewedAt});
  signedClaim(resolutionReceipt,resolveKeys,expected,auditKey);
  const ownerKey=pinnedKey(ownerPublicKeyPem,pinnedOwnerFingerprint);
  const close=ownerCloseoutReviewClaims(rotation,handOff,resolutionReceipt,ownerCloseoutReceipt);
  if(close.incidentRef!==expected.incidentRef||
     iso(close.issuedAt)<iso(expected.reviewedAt)||
     iso(close.issuedAt)>new Date(now).getTime()+300000)
    throw Error("Owner closeout consent absent, premature or for wrong incident: HOLD");
  signedClaim(ownerCloseoutReceipt,closeoutKeys,close,ownerKey);
  return {status:"OWNER_CLOSEOUT_REVIEW_CANDIDATE",
    incidentRef:close.incidentRef,closeoutReceiptDigest:digest(ownerCloseoutReceipt),
    auditorReceiptDigest:digest(resolutionReceipt),
    rotationHeadDigest:rotation.headDigest,handoffHeadDigest:handOff.headDigest,
    explicitHumanDecisionRequired:true,auditHoldCleared:false,
    automaticClosure:false,externalWritePerformed:false};
}
