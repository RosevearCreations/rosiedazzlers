/** Build 600 — independently signed recipient acknowledgement ledger and
 * manual owner follow-up review continuity. No delivery, write, auto-closure,
 * live signature creation or production customer/business mutation.
 *
 * A status flag from a caller is NEVER trusted: verify each Build599 owner/
 * recipient signed export, independent head pin and all upstream evidence.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyOwnerDecisionExportFollowUp}
  from "./release_incident_owner_handoff_decision_export.mjs";
const SHA=/^[0-9a-f]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const MAX=100;
const RECIPIENT_ACTIONS=new Set(["ACKNOWLEDGE_REVIEW_MATERIAL",
  "REQUEST_ADDITIONAL_EVIDENCE","REPORT_REVIEW_DISCREPANCY"]);
const OWNER_ACTIONS=new Set(["ACKNOWLEDGE_RECIPIENT_REVIEW",
  "REQUEST_MANUAL_EVIDENCE_RECHECK","DEFER_FOLLOWUP_REVIEW",
  "ESCALATE_TO_OWNER_MANUAL_REVIEW"]);
const RECIPIENT_FIELDS=["schema","repository","issueNumber","incidentRef",
  "exportDigest","ownerHandoffDigest","initialRecipientReceiptDigest",
  "governanceHeadDigest","recipientRef","sequence","previousReceiptDigest",
  "action","recipientReviewRef","issuedAt"];
const OWNER_FIELDS=["schema","repository","issueNumber","incidentRef",
  "exportDigest","ownerHandoffDigest","recipientLedgerHeadDigest",
  "initialRecipientReceiptDigest","recipientRef","sequence",
  "previousOwnerDecisionDigest","action","owner","ownerReviewRef","issuedAt"];
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
function canonicalTime(t){
  if(typeof t!=="string"||!Number.isFinite(Date.parse(t))||
      new Date(t).toISOString()!==t)
    throw Error("Canonical owner/recipient review timestamp required: HOLD");
  return Date.parse(t);
}
function exactFields(x,fields){
  return x!==null&&typeof x==="object"&&!Array.isArray(x)&&
    Object.keys(x).sort().join(",")===fields.slice().sort().join(",");
}
function keyFromPin(pem,fingerprint){
  if(typeof pem!=="string"||pem.length>8192||!SHA.test(fingerprint||""))
    throw Error("Independently pinned Ed25519 signer required: HOLD");
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519"||
     createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")!==fingerprint)
    throw Error("Independent owner/recipient signer fingerprint mismatch: HOLD");
  return key;
}
function signed(receipt,expected,fields,publicKey){
  if(receipt?.algorithm!=="Ed25519"||!exactFields(receipt.claims,fields)||
     typeof receipt.signature!=="string"||
     !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature)||
     fields.some(k=>receipt.claims[k]!==expected[k]))
    throw Error("Signed recipient/owner ledger claim altered, truncated or unlinked: HOLD");
  const bytes=Buffer.from(receipt.signature,"base64");
  if(bytes.length!==64||!verify(null,canonicalBytes(expected),publicKey,bytes))
    throw Error("Independent recipient/owner ledger signature invalid: HOLD");
}
export function recipientAcknowledgementClaims({verifiedExport,sequence,action,
  recipientReviewRef,issuedAt,previousReceiptDigest=null}){
  if(verifiedExport?.status!=="INDEPENDENT_OWNER_DECISION_EXPORT_FOLLOWUP_VERIFIED"||
     verifiedExport.auditHoldCleared!==false||verifiedExport.automaticClosure!==false||
     !Number.isSafeInteger(verifiedExport.issueNumber)||verifiedExport.issueNumber<1||
     !REF.test(verifiedExport.incidentRef||"")||
     !SHA.test(verifiedExport.exportDigest||"")||
     !SHA.test(verifiedExport.ownerHandoffDigest||"")||
     !SHA.test(verifiedExport.recipientReceiptDigest||"")||
     !SHA.test(verifiedExport.governanceHeadDigest||"")||
     !REF.test(verifiedExport.recipientRef||"")||
     !Number.isSafeInteger(sequence)||sequence<1||sequence>MAX||
     !RECIPIENT_ACTIONS.has(action)||!REF.test(recipientReviewRef||"")||
     !(previousReceiptDigest===null||SHA.test(previousReceiptDigest||"")))
    throw Error("Exact verified owner export and non-closing recipient review needed: HOLD");
  canonicalTime(issuedAt);
  return {schema:"rosie.independent-export-recipient-ledger.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:verifiedExport.issueNumber,incidentRef:verifiedExport.incidentRef,
    exportDigest:verifiedExport.exportDigest,
    ownerHandoffDigest:verifiedExport.ownerHandoffDigest,
    initialRecipientReceiptDigest:verifiedExport.recipientReceiptDigest,
    governanceHeadDigest:verifiedExport.governanceHeadDigest,
    recipientRef:verifiedExport.recipientRef,
    sequence,previousReceiptDigest,action,recipientReviewRef,issuedAt};
}
export async function verifyIndependentRecipientAcknowledgementLedger({
  exportArguments,recipientReviewReceipts,recipientPublicKeyPem,
  pinnedRecipientFingerprint,independentRecipientLedgerPin,now=new Date()
}){
  if(!exportArguments||!Array.isArray(recipientReviewReceipts)||
     recipientReviewReceipts.length<1||recipientReviewReceipts.length>MAX||
     pinnedRecipientFingerprint!==exportArguments.pinnedRecipientFingerprint||
     pinnedRecipientFingerprint===exportArguments.pinnedOwnerFingerprint||
     pinnedRecipientFingerprint===exportArguments.governanceArguments
       ?.reviewArguments?.pinnedReviewerFingerprint)
    throw Error("Complete recipient review ledger and distinct signer roots required: HOLD");
  // This rechecks signed owner approval, reviewer ack, off-repository pins,
  // all upstream independent evidence and exact immutable record versions.
  const verifiedExport=await verifyOwnerDecisionExportFollowUp({...exportArguments,now});
  const publicKey=keyFromPin(recipientPublicKeyPem,pinnedRecipientFingerprint);
  const lastOriginalAt=canonicalTime(exportArguments.recipientReceipt?.claims?.receivedAt);
  const clock=new Date(now).getTime();
  if(!Number.isFinite(clock))throw Error("Independent review time unavailable: HOLD");
  let previous=null,previousAt=lastOriginalAt;
  const rows=[];
  for(const receipt of recipientReviewReceipts){
    const claim=receipt?.claims;
    const expected=recipientAcknowledgementClaims({verifiedExport,
      sequence:rows.length+1,action:claim?.action,
      recipientReviewRef:claim?.recipientReviewRef,issuedAt:claim?.issuedAt,
      previousReceiptDigest:previous});
    const at=canonicalTime(expected.issuedAt);
    if(at<=previousAt||at>clock+300000)
      throw Error("Independent recipient review replay, rollback or future time: HOLD");
    signed(receipt,expected,RECIPIENT_FIELDS,publicKey);
    previous=digest(receipt);previousAt=at;
    rows.push({sequence:rows.length+1,action:expected.action,
      recipientReviewRef:expected.recipientReviewRef,
      issuedAt:expected.issuedAt,receiptDigest:previous});
  }
  const pin=independentRecipientLedgerPin;
  if(!pin||pin.headDigest!==previous||pin.receiptCount!==rows.length||
     pin.exportDigest!==verifiedExport.exportDigest||
     pin.initialRecipientReceiptDigest!==verifiedExport.recipientReceiptDigest||
     pin.ownerHandoffDigest!==verifiedExport.ownerHandoffDigest||
     pin.recipientRef!==verifiedExport.recipientRef||
     !REF.test(pin.externalReference||""))
    throw Error("Independently controlled complete recipient ledger head missing: HOLD");
  return {status:"INDEPENDENT_RECIPIENT_ACKNOWLEDGEMENT_LEDGER_VERIFIED",
    issueNumber:verifiedExport.issueNumber,incidentRef:verifiedExport.incidentRef,
    exportDigest:verifiedExport.exportDigest,
    governanceHeadDigest:verifiedExport.governanceHeadDigest,
    ownerHandoffDigest:verifiedExport.ownerHandoffDigest,
    initialRecipientReceiptDigest:verifiedExport.recipientReceiptDigest,
    recipientRef:verifiedExport.recipientRef,
    recipientLedgerHeadDigest:previous,
    recipientDecisionHistory:rows,externalReference:pin.externalReference,
    liveExceptionStatus:"UNCHANGED",auditHoldCleared:false,
    automaticClosure:false,automaticDelivery:false,externalWritePerformed:false};
}
export function ownerAcknowledgementFollowUpClaims({ledger,sequence,action,
  ownerReviewRef,issuedAt,previousOwnerDecisionDigest=null}){
  if(ledger?.status!=="INDEPENDENT_RECIPIENT_ACKNOWLEDGEMENT_LEDGER_VERIFIED"||
     ledger.auditHoldCleared!==false||ledger.automaticClosure!==false||
     !Number.isSafeInteger(ledger.issueNumber)||ledger.issueNumber<1||
     !REF.test(ledger.incidentRef||"")||
     !SHA.test(ledger.exportDigest||"")||
     !SHA.test(ledger.ownerHandoffDigest||"")||
     !SHA.test(ledger.recipientLedgerHeadDigest||"")||
     !SHA.test(ledger.initialRecipientReceiptDigest||"")||
     !REF.test(ledger.recipientRef||"")||
     !Number.isSafeInteger(sequence)||sequence<1||sequence>MAX||
     !OWNER_ACTIONS.has(action)||!REF.test(ownerReviewRef||"")||
     !(previousOwnerDecisionDigest===null||SHA.test(previousOwnerDecisionDigest||"")))
    throw Error("Exact recipient review history and manual owner action required: HOLD");
  canonicalTime(issuedAt);
  return {schema:"rosie.owner-recipient-followup-review.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:ledger.issueNumber,incidentRef:ledger.incidentRef,
    exportDigest:ledger.exportDigest,ownerHandoffDigest:ledger.ownerHandoffDigest,
    recipientLedgerHeadDigest:ledger.recipientLedgerHeadDigest,
    initialRecipientReceiptDigest:ledger.initialRecipientReceiptDigest,
    recipientRef:ledger.recipientRef,
    sequence,previousOwnerDecisionDigest,action,owner:"RosevearCreations",
    ownerReviewRef,issuedAt};
}
export async function verifyOwnerManualFollowUpContinuity({
  recipientLedgerArguments,ownerDecisionReceipts,ownerPublicKeyPem,
  pinnedOwnerFingerprint,independentOwnerFollowUpPin,now=new Date()
}){
  if(!recipientLedgerArguments||!Array.isArray(ownerDecisionReceipts)||
     ownerDecisionReceipts.length<1||ownerDecisionReceipts.length>MAX||
     pinnedOwnerFingerprint!==recipientLedgerArguments.exportArguments?.pinnedOwnerFingerprint||
     pinnedOwnerFingerprint===recipientLedgerArguments.pinnedRecipientFingerprint)
    throw Error("Complete owner review receipts and distinct owner signer required: HOLD");
  const ledger=await verifyIndependentRecipientAcknowledgementLedger({
    ...recipientLedgerArguments,now});
  const publicKey=keyFromPin(ownerPublicKeyPem,pinnedOwnerFingerprint);
  const clock=new Date(now).getTime();
  if(!Number.isFinite(clock))throw Error("Owner decision review clock unavailable: HOLD");
  let previous=null,previousAt=canonicalTime(ledger.recipientDecisionHistory.at(-1).issuedAt);
  const rows=[];
  for(const receipt of ownerDecisionReceipts){
    const claims=receipt?.claims;
    const expected=ownerAcknowledgementFollowUpClaims({ledger,
      sequence:rows.length+1,action:claims?.action,
      ownerReviewRef:claims?.ownerReviewRef,issuedAt:claims?.issuedAt,
      previousOwnerDecisionDigest:previous});
    const at=canonicalTime(expected.issuedAt);
    if(at<=previousAt||at>clock+300000)
      throw Error("Owner manual follow-up receipt replay, rollback or future: HOLD");
    signed(receipt,expected,OWNER_FIELDS,publicKey);
    previous=digest(receipt);previousAt=at;
    rows.push({sequence:rows.length+1,action:expected.action,
      ownerReviewRef:expected.ownerReviewRef,
      issuedAt:expected.issuedAt,receiptDigest:previous});
  }
  const pin=independentOwnerFollowUpPin;
  if(!pin||pin.headDigest!==previous||pin.receiptCount!==rows.length||
     pin.recipientLedgerHeadDigest!==ledger.recipientLedgerHeadDigest||
     pin.exportDigest!==ledger.exportDigest||
     pin.initialRecipientReceiptDigest!==ledger.initialRecipientReceiptDigest||
     pin.issueNumber!==ledger.issueNumber||
     !REF.test(pin.externalReference||""))
    throw Error("Independently held complete owner follow-up review pin missing: HOLD");
  return {status:"INDEPENDENT_OWNER_MANUAL_FOLLOWUP_CONTINUITY",
    issueNumber:ledger.issueNumber,incidentRef:ledger.incidentRef,
    exportDigest:ledger.exportDigest,recipientRef:ledger.recipientRef,
    recipientLedgerHeadDigest:ledger.recipientLedgerHeadDigest,
    ownerFollowUpHeadDigest:previous,ownerDecisions:rows,
    recipientDecisionHistory:ledger.recipientDecisionHistory,
    externalReference:pin.externalReference,
    manualOwnerActionRequired:true,liveExceptionStatus:"UNCHANGED",
    auditHoldCleared:false,automaticClosure:false,automaticDelivery:false,
    externalWritePerformed:false};
}
export async function ownerRecipientFollowUpWorkbench(args){
  const v=await verifyOwnerManualFollowUpContinuity(args);
  return {status:"READ_ONLY_OWNER_RECIPIENT_FOLLOWUP_WORKBENCH",
    issueNumber:v.issueNumber,incidentRef:v.incidentRef,
    latestRecipientAction:v.recipientDecisionHistory.at(-1).action,
    latestOwnerAction:v.ownerDecisions.at(-1).action,
    ownerReviewHistory:v.ownerDecisions,
    recipientReviewHistory:v.recipientDecisionHistory,
    exportDigest:v.exportDigest,
    recipientLedgerHeadDigest:v.recipientLedgerHeadDigest,
    ownerFollowUpHeadDigest:v.ownerFollowUpHeadDigest,
    independentReviewReference:v.externalReference,
    nextStep:"MANUAL_OWNER_RECONCILIATION_REVIEW",
    auditHoldCleared:false,liveExceptionStatus:"UNCHANGED",
    automaticClosure:false,automaticDelivery:false,externalWritePerformed:false};
}
