/** Build 596 — independently signed receipt exception follow-up evidence
 * and explicit, read-only owner reconciliation decision chain.
 * Every invocation re-verifies Build 595's independently pinned recipient and
 * owner handoff register. No "CLOSE", delivery, storage or automatic action.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyOwnerHandoffReviewRegister} from "./release_incident_export_receipt_reconciliation.mjs";
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const MAX=100;
const EVIDENCE_KEYS=["schema","repository","issueNumber","incidentRef","exportDigest",
  "recipientReceiptDigest","ownerReviewHeadDigest","investigationRef","evidenceRef",
  "finding","observedAt"];
const DECISION_KEYS=["schema","repository","issueNumber","incidentRef","exportDigest",
  "recipientReceiptDigest","ownerReviewHeadDigest","evidenceReceiptDigest","sequence",
  "previousDecisionDigest","action","owner","ownerDecisionRef","issuedAt"];
const FINDINGS=new Set(["RECEIPT_VERIFICATION_PENDING","DISCREPANCY_OBSERVED",
  "INDEPENDENT_RECHECK_RECORDED"]);
const DECISIONS=new Set(["ACKNOWLEDGE_EVIDENCE","REQUEST_ADDITIONAL_RECHECK",
  "DEFER_FOLLOWUP_REVIEW","ESCALATE_FOR_MANUAL_REVIEW"]);
const hash=value=>createHash("sha256").update(canonicalBytes(value)).digest("hex");
function timestamp(s){
  if(typeof s!=="string"||!Number.isFinite(Date.parse(s))||
    new Date(s).toISOString()!==s)throw Error("Canonical receipt follow-up time required: HOLD");
  return Date.parse(s);
}
function exact(obj,fields){return obj!==null&&typeof obj==="object"&&!Array.isArray(obj)&&
  Object.keys(obj).sort().join(",")===fields.slice().sort().join(",");}
function trustedKey(pem,fingerprint){
  if(typeof pem!=="string"||pem.length>8192||!SHA.test(fingerprint||""))
    throw Error("Separately pinned Ed25519 public key required: HOLD");
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519"||
    createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")!==fingerprint)
    throw Error("Independently pinned signer fingerprint mismatch: HOLD");
  return key;
}
function signed(receipt,expected,fields,key){
  if(receipt?.algorithm!=="Ed25519"||!exact(receipt.claims,fields)||
    fields.some(f=>receipt.claims[f]!==expected[f])||
    typeof receipt.signature!=="string"||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature))
    throw Error("Signed follow-up evidence or decision fields altered: HOLD");
  const bytes=Buffer.from(receipt.signature,"base64");
  if(bytes.length!==64||!verify(null,canonicalBytes(expected),key,bytes))
    throw Error("Independently signed follow-up receipt signature invalid: HOLD");
}
export function receiptFollowUpEvidenceClaims({verifiedRegister,investigationRef,evidenceRef,
  finding,observedAt}){
  if(verifiedRegister?.status!=="INDEPENDENT_OWNER_HANDOFF_REVIEW_REGISTER_VERIFIED"||
    !SHA.test(verifiedRegister.exportDigest||"")||
    !SHA.test(verifiedRegister.recipientReceiptDigest||"")||
    !SHA.test(verifiedRegister.registerHeadDigest||"")||
    !REF.test(investigationRef||"")||!REF.test(evidenceRef||"")||
    !FINDINGS.has(finding))
    throw Error("Complete independent owner handoff source required for follow-up: HOLD");
  timestamp(observedAt);
  return {schema:"rosie.receipt-exception-followup-evidence.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:verifiedRegister.issueNumber,
    incidentRef:verifiedRegister.incidentRef,
    exportDigest:verifiedRegister.exportDigest,
    recipientReceiptDigest:verifiedRegister.recipientReceiptDigest,
    ownerReviewHeadDigest:verifiedRegister.registerHeadDigest,
    investigationRef,evidenceRef,finding,observedAt};
}
export async function verifyReceiptFollowUpEvidence({registerArguments,evidenceReceipt,
  investigatorPublicKeyPem,pinnedInvestigatorFingerprint,now=new Date()}){
  if(!registerArguments||!SHA.test(pinnedInvestigatorFingerprint||"")||
    [registerArguments.pinnedOwnerFingerprint,
      registerArguments.reconciliationArguments?.pinnedRecipientFingerprint]
      .includes(pinnedInvestigatorFingerprint))
    throw Error("Independent investigator must have distinct independently pinned signer: HOLD");
  // Cannot rely on a caller-supplied "VERIFIED" flag or unverified GitHub comment.
  const verifiedRegister=await verifyOwnerHandoffReviewRegister({...registerArguments,now});
  const claims=evidenceReceipt?.claims;
  const expected=receiptFollowUpEvidenceClaims({verifiedRegister,
    investigationRef:claims?.investigationRef,
    evidenceRef:claims?.evidenceRef,finding:claims?.finding,
    observedAt:claims?.observedAt});
  if(timestamp(expected.observedAt)<
     timestamp(verifiedRegister.entries.at(-1).issuedAt)||
     timestamp(expected.observedAt)>new Date(now).getTime()+300000)
    throw Error("Investigator evidence predates owner review or is in future: HOLD");
  signed(evidenceReceipt,expected,EVIDENCE_KEYS,
    trustedKey(investigatorPublicKeyPem,pinnedInvestigatorFingerprint));
  return {status:"INDEPENDENT_RECEIPT_FOLLOWUP_EVIDENCE_VERIFIED",
    issueNumber:expected.issueNumber,incidentRef:expected.incidentRef,
    exportDigest:expected.exportDigest,
    recipientReceiptDigest:expected.recipientReceiptDigest,
    ownerReviewHeadDigest:expected.ownerReviewHeadDigest,
    evidenceReceiptDigest:hash(evidenceReceipt),
    investigationRef:expected.investigationRef,
    evidenceRef:expected.evidenceRef,finding:expected.finding,
    observedAt:expected.observedAt,
    auditHoldCleared:false,automaticClosure:false,externalWritePerformed:false};
}
export function ownerReceiptReconciliationClaims({verifiedEvidence,sequence,action,
  ownerDecisionRef,issuedAt,previousDecisionDigest=null}){
  if(verifiedEvidence?.status!=="INDEPENDENT_RECEIPT_FOLLOWUP_EVIDENCE_VERIFIED"||
    !SHA.test(verifiedEvidence.evidenceReceiptDigest||"")||
    !Number.isSafeInteger(sequence)||sequence<1||sequence>MAX||
    !DECISIONS.has(action)||!REF.test(ownerDecisionRef||"")||
    !(previousDecisionDigest===null||SHA.test(previousDecisionDigest||"")))
    throw Error("Manual follow-up decision requires signed investigator evidence: HOLD");
  if(timestamp(issuedAt)<timestamp(verifiedEvidence.observedAt))
    throw Error("Owner follow-up decision predates signed evidence: HOLD");
  return {schema:"rosie.owner-receipt-reconciliation-decision.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:verifiedEvidence.issueNumber,
    incidentRef:verifiedEvidence.incidentRef,
    exportDigest:verifiedEvidence.exportDigest,
    recipientReceiptDigest:verifiedEvidence.recipientReceiptDigest,
    ownerReviewHeadDigest:verifiedEvidence.ownerReviewHeadDigest,
    evidenceReceiptDigest:verifiedEvidence.evidenceReceiptDigest,
    sequence,previousDecisionDigest,action,
    owner:"RosevearCreations",ownerDecisionRef,issuedAt};
}
export async function verifyManualReceiptReconciliationRegister({
  evidenceArguments,decisionReceipts,ownerPublicKeyPem,pinnedOwnerFingerprint,
  independentFollowUpHeadPin,now=new Date()
}){
  if(!evidenceArguments||!Array.isArray(decisionReceipts)||
    decisionReceipts.length<1||decisionReceipts.length>MAX||
    !SHA.test(pinnedOwnerFingerprint||"")||
    pinnedOwnerFingerprint!==evidenceArguments.registerArguments?.pinnedOwnerFingerprint||
    pinnedOwnerFingerprint===evidenceArguments.pinnedInvestigatorFingerprint)
    throw Error("Complete owner decision chain with distinct trust roots required: HOLD");
  const evidence=await verifyReceiptFollowUpEvidence({...evidenceArguments,now});
  const ownerKey=trustedKey(ownerPublicKeyPem,pinnedOwnerFingerprint);
  const clock=new Date(now).getTime();
  if(!Number.isFinite(clock))throw Error("Owner reconciliation review clock unavailable: HOLD");
  const entries=[];let previous=null,lastAt=timestamp(evidence.observedAt);
  for(const receipt of decisionReceipts){
    const claims=receipt?.claims;
    const expected=ownerReceiptReconciliationClaims({verifiedEvidence:evidence,
      sequence:entries.length+1,action:claims?.action,
      ownerDecisionRef:claims?.ownerDecisionRef,issuedAt:claims?.issuedAt,
      previousDecisionDigest:previous});
    const at=timestamp(expected.issuedAt);
    if(at<=lastAt||at>clock+300000)
      throw Error("Owner reconciliation decision time replay, rollback or future: HOLD");
    signed(receipt,expected,DECISION_KEYS,ownerKey);
    previous=hash(receipt);lastAt=at;
    entries.push({sequence:entries.length+1,action:expected.action,
      ownerDecisionRef:expected.ownerDecisionRef,issuedAt:expected.issuedAt,
      receiptDigest:previous,evidenceReceiptDigest:evidence.evidenceReceiptDigest});
  }
  const pin=independentFollowUpHeadPin;
  if(!pin||pin.headDigest!==previous||pin.receiptCount!==entries.length||
     pin.evidenceReceiptDigest!==evidence.evidenceReceiptDigest||
     pin.exportDigest!==evidence.exportDigest||
     pin.ownerReviewHeadDigest!==evidence.ownerReviewHeadDigest||
     !REF.test(pin.externalReference||""))
    throw Error("Independent complete owner follow-up decision head missing: HOLD");
  return {status:"INDEPENDENT_MANUAL_RECEIPT_RECONCILIATION_VERIFIED",
    issueNumber:evidence.issueNumber,incidentRef:evidence.incidentRef,
    exportDigest:evidence.exportDigest,
    evidenceReceiptDigest:evidence.evidenceReceiptDigest,
    receiptFinding:evidence.finding,
    decisionHeadDigest:previous,decisions:entries,
    externalReference:pin.externalReference,
    pendingManualReview:true,liveExceptionStatus:"UNCHANGED",
    auditHoldCleared:false,automaticClosure:false,automaticDelivery:false,
    externalWritePerformed:false};
}
export async function receiptExceptionFollowUpWorkbench(args){
  const verified=await verifyManualReceiptReconciliationRegister(args);
  const latest=verified.decisions.at(-1);
  return {status:"READ_ONLY_RECEIPT_EXCEPTION_FOLLOWUP_WORKBENCH",
    issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
    recipientFinding:verified.receiptFinding,
    latestOwnerAction:latest.action,
    ownerDecisionHistory:verified.decisions,
    evidenceReceiptDigest:verified.evidenceReceiptDigest,
    decisionHeadDigest:verified.decisionHeadDigest,
    independentEvidenceRef:verified.externalReference,
    nextStep:"MANUAL_OWNER_FOLLOWUP_REVIEW",auditHoldCleared:false,
    liveExceptionStatus:"UNCHANGED",automaticClosure:false,
    automaticDelivery:false,externalWritePerformed:false};
}
