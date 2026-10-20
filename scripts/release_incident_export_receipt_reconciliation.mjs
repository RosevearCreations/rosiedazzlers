/** Build 595 — independently signed export receipt and owner handoff review register.
 * A recipient acknowledgement is NOT delivery evidence unless independently
 * signed and pinned. Every verification replays Build 594 signed export source.
 * This module is read-only; no storage, sending, closure or owner signing.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyManualCloseoutEvidenceHandoff} from "./release_incident_manual_closeout_evidence_export.mjs";
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const MAX=100;
const RECEIPT_KEYS=["schema","repository","issueNumber","incidentRef","exportDigest",
  "ownerHandoffDigest","recipientRef","receiptRef","disposition","receivedAt"];
const REGISTER_KEYS=["schema","repository","issueNumber","incidentRef","exportDigest",
  "ownerHandoffDigest","recipientReceiptDigest","sequence","previousRegisterDigest",
  "action","owner","ownerReviewRef","issuedAt"];
const RECEIPT_ACTIONS=new Set(["RECEIVED_FOR_REVIEW","RECEIPT_EXCEPTION_REPORTED"]);
const OWNER_ACTIONS=new Set(["ACKNOWLEDGE_RECEIPT","REQUEST_MANUAL_RECHECK","DEFER_HANDOFF_REVIEW"]);
const digest=obj=>createHash("sha256").update(canonicalBytes(obj)).digest("hex");
function time(t){
  if(typeof t!=="string"||!Number.isFinite(Date.parse(t))||
     new Date(t).toISOString()!==t)throw Error("Canonical export receipt time required: HOLD");
  return Date.parse(t);
}
function exact(obj,keys){return obj!==null&&typeof obj==="object"&&!Array.isArray(obj)&&
  Object.keys(obj).sort().join(",")===keys.slice().sort().join(",");}
function key(pem,independentFingerprint){
  if(typeof pem!=="string"||pem.length>8192||!SHA.test(independentFingerprint||""))
    throw Error("Independently pinned Ed25519 signer required: HOLD");
  const k=createPublicKey(pem);
  const fp=createHash("sha256").update(k.export({format:"der",type:"spki"})).digest("hex");
  if(k.asymmetricKeyType!=="ed25519"||fp!==independentFingerprint)
    throw Error("Independent signature signer fingerprint mismatch: HOLD");
  return k;
}
function checkSigned(receipt,fields,expected,publicKey){
  if(receipt?.algorithm!=="Ed25519"||!exact(receipt.claims,fields)||
     typeof receipt.signature!=="string"||
     !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature)||
     fields.some(f=>expected[f]!==receipt.claims[f]))
    throw Error("Signed handoff receipt fields or provenance mismatch: HOLD");
  const sig=Buffer.from(receipt.signature,"base64");
  if(sig.length!==64||!verify(null,canonicalBytes(expected),publicKey,sig))
    throw Error("Independent signed handoff receipt signature invalid: HOLD");
}
export function recipientExportReceiptClaims({handoff,receiptRef,disposition,receivedAt}){
  if(handoff?.status!=="SIGNED_MANUAL_EVIDENCE_HANDOFF_READY"||
     !SHA.test(handoff.exportDigest||"")||!SHA.test(handoff.ownerHandoffDigest||"")||
     !REF.test(handoff.recipientRef||"")||!REF.test(receiptRef||"")||
     !RECEIPT_ACTIONS.has(disposition))
    throw Error("Verified live owner export handoff required for recipient acknowledgement: HOLD");
  const at=time(receivedAt);
  if(at>time(handoff.expiresAt)||at<time(handoff.package.createdAt))
    throw Error("Recipient receipt outside bounded signed handoff window: HOLD");
  return {schema:"rosie.manual-export-recipient-receipt.v1",
    repository:"RosevearCreations/rosiedazzlers",issueNumber:handoff.package.issueNumber,
    incidentRef:handoff.package.incidentRef,exportDigest:handoff.exportDigest,
    ownerHandoffDigest:handoff.ownerHandoffDigest,recipientRef:handoff.recipientRef,
    receiptRef,disposition,receivedAt};
}
export async function verifyExportRecipientReconciliation({
  handoffArguments,recipientReceipt,recipientPublicKeyPem,pinnedRecipientFingerprint,
  now=new Date()
}){
  if(!handoffArguments||pinnedRecipientFingerprint===handoffArguments.pinnedOwnerFingerprint)
    throw Error("Independent recipient signer must differ from owner signing key: HOLD");
  const handoff=await verifyManualCloseoutEvidenceHandoff({...handoffArguments,now});
  if(handoff.status!=="SIGNED_MANUAL_EVIDENCE_HANDOFF_READY")
    throw Error("Signed owner export evidence is not verified: HOLD");
  const claims=recipientReceipt?.claims;
  const expected=recipientExportReceiptClaims({handoff,
    receiptRef:claims?.receiptRef,disposition:claims?.disposition,
    receivedAt:claims?.receivedAt});
  if(time(expected.receivedAt)<time(handoffArguments.handoffReceipt?.claims?.issuedAt))
    throw Error("Recipient receipt predates signed owner handoff approval: HOLD");
  if(time(expected.receivedAt)>new Date(now).getTime()+300000)
    throw Error("Recipient receipt cannot be dated in future: HOLD");
  checkSigned(recipientReceipt,RECEIPT_KEYS,expected,
    key(recipientPublicKeyPem,pinnedRecipientFingerprint));
  return {status:"INDEPENDENT_EXPORT_RECEIPT_RECONCILED",
    exportDigest:handoff.exportDigest,ownerHandoffDigest:handoff.ownerHandoffDigest,
    recipientReceiptDigest:digest(recipientReceipt),
    disposition:expected.disposition,recipientRef:handoff.recipientRef,
    issueNumber:expected.issueNumber,incidentRef:expected.incidentRef,
    receivedAt:expected.receivedAt,
    ownerHandoffExpiresAt:handoff.expiresAt,
    externalOwnerEvidenceRef:handoff.independentEvidenceRef,
    auditHoldCleared:false,automaticDelivery:false,automaticClosure:false,
    externalWritePerformed:false};
}
export function ownerReceiptReviewClaims({reconciled,sequence,action,ownerReviewRef,
  issuedAt,previousRegisterDigest=null}){
  if(reconciled?.status!=="INDEPENDENT_EXPORT_RECEIPT_RECONCILED"||
     !SHA.test(reconciled.exportDigest||"")||
     !SHA.test(reconciled.ownerHandoffDigest||"")||
     !SHA.test(reconciled.recipientReceiptDigest||"")||
     !Number.isSafeInteger(sequence)||sequence<1||sequence>MAX||
     !OWNER_ACTIONS.has(action)||!REF.test(ownerReviewRef||"")||
     !(previousRegisterDigest===null||SHA.test(previousRegisterDigest||"")))
    throw Error("Verified recipient receipt and safe manual owner review required: HOLD");
  if(time(issuedAt)<time(reconciled.receivedAt))
    throw Error("Owner review cannot predate independently signed recipient receipt: HOLD");
  return {schema:"rosie.owner-export-handoff-review.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:reconciled.issueNumber,incidentRef:reconciled.incidentRef,
    exportDigest:reconciled.exportDigest,
    ownerHandoffDigest:reconciled.ownerHandoffDigest,
    recipientReceiptDigest:reconciled.recipientReceiptDigest,
    sequence,previousRegisterDigest,action,
    owner:"RosevearCreations",ownerReviewRef,issuedAt};
}
export async function verifyOwnerHandoffReviewRegister({
  reconciliationArguments,revisions,ownerPublicKeyPem,pinnedOwnerFingerprint,
  independentRegisterHeadPin,now=new Date()
}){
  if(!reconciliationArguments||!Array.isArray(revisions)||
     revisions.length<1||revisions.length>MAX||
     pinnedOwnerFingerprint!==reconciliationArguments.handoffArguments?.pinnedOwnerFingerprint||
     pinnedOwnerFingerprint===reconciliationArguments.pinnedRecipientFingerprint)
    throw Error("Complete distinct independently pinned signer roots required: HOLD");
  const reconciled=await verifyExportRecipientReconciliation({...reconciliationArguments,now});
  const ownerKey=key(ownerPublicKeyPem,pinnedOwnerFingerprint);
  const clock=new Date(now).getTime();let lastAt=time(reconciled.receivedAt),previous=null;
  if(!Number.isFinite(clock))throw Error("Owner handoff register clock missing: HOLD");
  const entries=[];
  for(const receipt of revisions){
    const seq=entries.length+1,claims=receipt?.claims;
    const expected=ownerReceiptReviewClaims({reconciled,sequence:seq,
      action:claims?.action,ownerReviewRef:claims?.ownerReviewRef,
      issuedAt:claims?.issuedAt,previousRegisterDigest:previous});
    const at=time(expected.issuedAt);
    if(at<=lastAt||at>clock+300000)
      throw Error("Owner review register replay, rollback or future timestamp: HOLD");
    checkSigned(receipt,REGISTER_KEYS,expected,ownerKey);
    previous=digest(receipt);lastAt=at;
    entries.push({sequence:seq,action:expected.action,
      ownerReviewRef:expected.ownerReviewRef,issuedAt:expected.issuedAt,
      receiptDigest:previous,recipientReceiptDigest:reconciled.recipientReceiptDigest});
  }
  if(!independentRegisterHeadPin||
     independentRegisterHeadPin.headDigest!==previous||
     independentRegisterHeadPin.receiptCount!==entries.length||
     independentRegisterHeadPin.exportDigest!==reconciled.exportDigest||
     independentRegisterHeadPin.recipientReceiptDigest!==reconciled.recipientReceiptDigest||
     independentRegisterHeadPin.recipientRef!==reconciled.recipientRef||
     !REF.test(independentRegisterHeadPin.externalReference||""))
    throw Error("Independent complete signed owner handoff review register head missing: HOLD");
  return {status:"INDEPENDENT_OWNER_HANDOFF_REVIEW_REGISTER_VERIFIED",
    issueNumber:reconciled.issueNumber,incidentRef:reconciled.incidentRef,
    exportDigest:reconciled.exportDigest,
    recipientReceiptDigest:reconciled.recipientReceiptDigest,
    registerHeadDigest:previous,receiptCount:entries.length,
    recipientRef:reconciled.recipientRef,
    recipientDisposition:reconciled.disposition,
    externalReference:independentRegisterHeadPin.externalReference,
    entries,ownerReviewRequired:true,liveExceptionStatus:"UNCHANGED",
    auditHoldCleared:false,automaticDelivery:false,automaticClosure:false,
    externalWritePerformed:false};
}
export async function ownerHandoffReviewRegisterWorkbench(args){
  const v=await verifyOwnerHandoffReviewRegister(args);
  return {status:"READ_ONLY_OWNER_HANDOFF_REVIEW_REGISTER",
    latestOwnerAction:v.entries.at(-1).action,
    ownerReviewHistory:v.entries,
    recipientDisposition:v.recipientDisposition,
    recipientRef:v.recipientRef,
    exportDigest:v.exportDigest,
    recipientReceiptDigest:v.recipientReceiptDigest,
    registerHeadDigest:v.registerHeadDigest,
    nextStep:"MANUAL_OWNER_EXCEPTION_REVIEW",
    liveExceptionStatus:"UNCHANGED",auditHoldCleared:false,
    automaticDelivery:false,automaticClosure:false,externalWritePerformed:false};
}
