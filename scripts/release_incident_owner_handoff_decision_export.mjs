/** Build 599 — privacy-bounded owner handoff decision receipt export and
 * independently signed manual reviewer follow-up acknowledgement.
 * Rechecks the full Build 598 Ed25519 decision chain, external pins and
 * exact-version WORM evidence on every call. No network, storage or mutation.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyManualExceptionHandoffGovernance}
  from "./release_incident_followup_handoff_review.mjs";
const SHA=/^[0-9a-f]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const ACCEPT=new Set(["RECEIVED_FOR_MANUAL_REVIEW","ADDITIONAL_EVIDENCE_NEEDED"]);
const OWNER_FIELDS=["schema","repository","issueNumber","incidentRef",
  "exportDigest","governanceHeadDigest","reviewerReceiptDigest",
  "recipientRef","approvalRef","owner","issuedAt","expiresAt"];
const ACK_FIELDS=["schema","repository","issueNumber","incidentRef",
  "exportDigest","ownerHandoffDigest","governanceHeadDigest",
  "recipientRef","ackRef","disposition","receivedAt"];
const digest=obj=>createHash("sha256").update(canonicalBytes(obj)).digest("hex");
function time(s){
  if(typeof s!=="string"||!Number.isFinite(Date.parse(s))||
     new Date(s).toISOString()!==s)throw Error("Canonical owner export time required: HOLD");
  return Date.parse(s);
}
function fieldsMatch(obj,fields){
  return obj!==null&&typeof obj==="object"&&!Array.isArray(obj)&&
    Object.keys(obj).sort().join(",")===fields.slice().sort().join(",");
}
function key(pem,fp){
  if(typeof pem!=="string"||pem.length>8192||!SHA.test(fp||""))
    throw Error("Independently pinned Ed25519 signer required: HOLD");
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519"||
     createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")!==fp)
    throw Error("Owner decision export signer fingerprint mismatch: HOLD");
  return key;
}
function signed(receipt,expected,fields,key){
  if(receipt?.algorithm!=="Ed25519"||!fieldsMatch(receipt.claims,fields)||
     typeof receipt.signature!=="string"||
     !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature)||
     fields.some(f=>receipt.claims[f]!==expected[f]))
    throw Error("Signed export receipt altered or missing: HOLD");
  const bytes=Buffer.from(receipt.signature,"base64");
  if(bytes.length!==64||!verify(null,canonicalBytes(expected),key,bytes))
    throw Error("Signed export handoff/recipient signature invalid: HOLD");
}
export async function prepareOwnerHandoffDecisionExport({governanceArguments,createdAt,
  now=new Date()}){
  if(!governanceArguments||typeof governanceArguments!=="object"||
     time(createdAt)>new Date(now).getTime()+300000)
    throw Error("Complete signed owner governance evidence and current time required: HOLD");
  // Build598 verifies Build597 exact immutable WORM record, Build596-589
  // signature chains and distinct owner/reviewer/recipient signer trust roots.
  const result=await verifyManualExceptionHandoffGovernance({...governanceArguments,now});
  if(result.status!=="INDEPENDENT_MANUAL_EXCEPTION_HANDOFF_GOVERNANCE"||
     result.auditHoldCleared!==false||result.automaticClosure!==false||
     !Number.isSafeInteger(result.issueNumber)||result.issueNumber<1||
     !REF.test(result.incidentRef||"")||
     !SHA.test(result.retainedRecordDigest||"")||
     !SHA.test(result.governanceHeadDigest||"")||
     !SHA.test(result.independentReviewReceiptDigest||"")||
     !Array.isArray(result.decisionHistory)||result.decisionHistory.length<1||
     result.decisionHistory.length>100)
    throw Error("Verified complete owner decision history needed for export: HOLD");
  const latest=result.decisionHistory.at(-1);
  if(time(createdAt)<time(latest.issuedAt)||
     latest.signedReceiptDigest!==result.governanceHeadDigest)
    throw Error("Owner export predates the final independently pinned decision: HOLD");
  const decisions=result.decisionHistory.map((r,i)=>{
    if(r.sequence!==i+1||!REF.test(r.ownerDecisionRef||"")||
       !SHA.test(r.signedReceiptDigest||""))
      throw Error("Owner decision metadata discontinuity: HOLD");
    return {sequence:r.sequence,action:r.action,ownerDecisionRef:r.ownerDecisionRef,
      issuedAt:r.issuedAt,receiptDigest:r.signedReceiptDigest};
  });
  const payload={schema:"rosie.owner-handoff-decision-export.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:result.issueNumber,incidentRef:result.incidentRef,
    createdAt,recordKind:"MANUAL_REVIEW_NOT_OPERATIONAL_CLOSEOUT",
    evidenceDigests:{
      retainedRecordDigest:result.retainedRecordDigest,
      originalHandoffHeadDigest:result.ownerHandoffHeadDigest,
      independentReviewerReceiptDigest:result.independentReviewReceiptDigest,
      ownerGovernanceHeadDigest:result.governanceHeadDigest},
    decisionCount:decisions.length,decisions,
    privacy:"METADATA_ONLY_NO_RAW_SIGNATURES_OR_CUSTOMER_DATA",
    liveExceptionStatus:"UNCHANGED",manualReviewRequired:true,
    auditHoldCleared:false,automaticClosure:false};
  if(canonicalBytes(payload).length>65536)
    throw Error("Bounded owner decision export size exceeded: HOLD");
  return {status:"OWNER_HANDOFF_DECISION_EXPORT_PREPARED",
    payload,exportDigest:digest(payload),
    governanceHeadDigest:result.governanceHeadDigest,
    reviewerReceiptDigest:result.independentReviewReceiptDigest,
    externalWritePerformed:false,automaticDelivery:false};
}
export function ownerDecisionExportHandoffClaims({prepared,recipientRef,approvalRef,
  issuedAt,expiresAt}){
  if(prepared?.status!=="OWNER_HANDOFF_DECISION_EXPORT_PREPARED"||
     !prepared.payload||prepared.exportDigest!==digest(prepared.payload)||
     prepared.governanceHeadDigest!==prepared.payload.evidenceDigests?.ownerGovernanceHeadDigest||
     prepared.reviewerReceiptDigest!==prepared.payload.evidenceDigests?.independentReviewerReceiptDigest||
     !REF.test(recipientRef||"")||!REF.test(approvalRef||""))
    throw Error("Exact verified export and named owner handoff destination required: HOLD");
  const start=time(issuedAt),end=time(expiresAt);
  if(start<time(prepared.payload.createdAt)||end<=start||end-start>7*86400000)
    throw Error("Owner export authorization duration invalid: HOLD");
  return {schema:"rosie.owner-handoff-decision-export-approval.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:prepared.payload.issueNumber,incidentRef:prepared.payload.incidentRef,
    exportDigest:prepared.exportDigest,
    governanceHeadDigest:prepared.governanceHeadDigest,
    reviewerReceiptDigest:prepared.reviewerReceiptDigest,
    recipientRef,approvalRef,owner:"RosevearCreations",issuedAt,expiresAt};
}
export function independentExportReviewReceiptClaims({prepared,ownerHandoffDigest,
  recipientRef,ackRef,disposition,receivedAt}){
  if(prepared?.status!=="OWNER_HANDOFF_DECISION_EXPORT_PREPARED"||
     !SHA.test(prepared.exportDigest||"")||!SHA.test(ownerHandoffDigest||"")||
     !SHA.test(prepared.governanceHeadDigest||"")||
     !REF.test(recipientRef||"")||!REF.test(ackRef||"")||!ACCEPT.has(disposition))
    throw Error("Independent receipt requires exact owner-approved export and safe disposition: HOLD");
  time(receivedAt);
  return {schema:"rosie.independent-owner-export-review-ack.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:prepared.payload.issueNumber,incidentRef:prepared.payload.incidentRef,
    exportDigest:prepared.exportDigest,ownerHandoffDigest,
    governanceHeadDigest:prepared.governanceHeadDigest,
    recipientRef,ackRef,disposition,receivedAt};
}
export async function verifyOwnerDecisionExportFollowUp({governanceArguments,
  createdAt,ownerHandoffReceipt,ownerPublicKeyPem,pinnedOwnerFingerprint,
  recipientReceipt,recipientPublicKeyPem,pinnedRecipientFingerprint,
  independentExportHeadPin,now=new Date()}){
  if(!governanceArguments||
     pinnedOwnerFingerprint!==governanceArguments.pinnedOwnerFingerprint||
     pinnedRecipientFingerprint===pinnedOwnerFingerprint||
     pinnedRecipientFingerprint===governanceArguments.reviewArguments?.pinnedReviewerFingerprint)
    throw Error("Three independently pinned identities required for decision export: HOLD");
  const prepared=await prepareOwnerHandoffDecisionExport({
    governanceArguments,createdAt,now});
  const ownerClaims=ownerHandoffReceipt?.claims;
  const ownerExpected=ownerDecisionExportHandoffClaims({prepared,
    recipientRef:ownerClaims?.recipientRef,
    approvalRef:ownerClaims?.approvalRef,
    issuedAt:ownerClaims?.issuedAt,expiresAt:ownerClaims?.expiresAt});
  signed(ownerHandoffReceipt,ownerExpected,OWNER_FIELDS,
    key(ownerPublicKeyPem,pinnedOwnerFingerprint));
  const clock=new Date(now).getTime();
  if(time(ownerExpected.issuedAt)>clock+300000||
     time(ownerExpected.expiresAt)<=clock)
    throw Error("Owner approved export is not currently valid: HOLD");
  const ownerHandoffDigest=digest(ownerHandoffReceipt);
  const r=recipientReceipt?.claims;
  const expected=independentExportReviewReceiptClaims({prepared,ownerHandoffDigest,
    recipientRef:r?.recipientRef,ackRef:r?.ackRef,
    disposition:r?.disposition,receivedAt:r?.receivedAt});
  if(expected.recipientRef!==ownerExpected.recipientRef)
    throw Error("Recipient acknowledgment and signed owner destination differ: HOLD");
  if(time(expected.receivedAt)<time(ownerExpected.issuedAt)||
     time(expected.receivedAt)>time(ownerExpected.expiresAt)||
     time(expected.receivedAt)>clock+300000)
    throw Error("Recipient review acknowledgment outside owner-approved time: HOLD");
  signed(recipientReceipt,expected,ACK_FIELDS,
    key(recipientPublicKeyPem,pinnedRecipientFingerprint));
  const recipientReceiptDigest=digest(recipientReceipt);
  const pin=independentExportHeadPin;
  if(!pin||pin.exportDigest!==prepared.exportDigest||
     pin.governanceHeadDigest!==prepared.governanceHeadDigest||
     pin.ownerHandoffDigest!==ownerHandoffDigest||
     pin.recipientReceiptDigest!==recipientReceiptDigest||
     pin.recipientRef!==expected.recipientRef||
     !REF.test(pin.externalReference||""))
    throw Error("Separately controlled complete export and recipient receipt digest pin missing: HOLD");
  return {status:"INDEPENDENT_OWNER_DECISION_EXPORT_FOLLOWUP_VERIFIED",
    issueNumber:prepared.payload.issueNumber,
    incidentRef:prepared.payload.incidentRef,
    exportDigest:prepared.exportDigest,
    governanceHeadDigest:prepared.governanceHeadDigest,
    ownerHandoffDigest,recipientReceiptDigest,
    recipientDisposition:expected.disposition,
    recipientRef:expected.recipientRef,
    export:prepared.payload,externalReference:pin.externalReference,
    manualTransferRequired:true,manualOwnerReviewRequired:true,
    liveExceptionStatus:"UNCHANGED",auditHoldCleared:false,
    automaticClosure:false,automaticDelivery:false,externalWritePerformed:false};
}
export async function ownerExportFollowUpWorkbench(args){
  const verified=await verifyOwnerDecisionExportFollowUp(args);
  return {status:"READ_ONLY_OWNER_DECISION_EXPORT_FOLLOWUP",
    issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
    decisionCount:verified.export.decisionCount,
    latestOwnerDecision:verified.export.decisions.at(-1).action,
    recipientDisposition:verified.recipientDisposition,
    recipientRef:verified.recipientRef,
    exportDigest:verified.exportDigest,
    externalReference:verified.externalReference,
    nextStep:"MANUAL_OWNER_REVIEW_AND_TRANSFER",
    liveExceptionStatus:"UNCHANGED",auditHoldCleared:false,
    automaticClosure:false,automaticDelivery:false,externalWritePerformed:false};
}
