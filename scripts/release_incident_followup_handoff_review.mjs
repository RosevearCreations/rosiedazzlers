/** Build 598 — independently signed follow-up handoff receipt review and
 * manual exception handoff governance. Read-only; no sender, signer, approval
 * creation, paid retention, delivery or live exception state mutation.
 *
 * Every review fully replays Build597's signed owner handoff and pinned,
 * immutable, exact-version Object Lock evidence. Separate owner and reviewer
 * signing keys and off-repository digest pins are mandatory.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyManualFollowUpHandoff}
  from "./release_incident_followup_head_retention_handoff.mjs";

const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const MAX=100;
const REVIEW_ACTIONS=new Set(["ACCEPT_FOR_MANUAL_REVIEW",
  "FOLLOWUP_EXCEPTION_REPORTED","ADDITIONAL_EVIDENCE_REQUIRED"]);
const OWNER_ACTIONS=new Set(["ACKNOWLEDGE_REVIEW_RECEIPT",
  "REQUEST_MANUAL_EVIDENCE_RECHECK","DEFER_OWNER_HANDOFF",
  "ESCALATE_MANUAL_EXCEPTION_REVIEW"]);
const REVIEW_FIELDS=["schema","repository","issueNumber","incidentRef",
  "retainedObjectKey","retainedVersionId","retainedRecordDigest",
  "followUpHeadDigest","ownerHandoffHeadDigest","reviewRef","finding",
  "reviewedAt"];
const OWNER_FIELDS=["schema","repository","issueNumber","incidentRef",
  "retainedRecordDigest","followUpHeadDigest","ownerHandoffHeadDigest",
  "independentReviewReceiptDigest","sequence","previousDecisionDigest",
  "action","owner","decisionRef","issuedAt"];

const digest=value=>createHash("sha256").update(canonicalBytes(value)).digest("hex");
function utc(value){
  if(typeof value!=="string"||!Number.isFinite(Date.parse(value))||
     new Date(value).toISOString()!==value)
    throw Error("Canonical handoff review timestamp required: HOLD");
  return Date.parse(value);
}
function exact(obj,fields){
  return obj!==null&&typeof obj==="object"&&!Array.isArray(obj)&&
    Object.keys(obj).sort().join(",")===fields.slice().sort().join(",");
}
function pinnedEd25519(pem,fingerprint){
  if(typeof pem!=="string"||pem.length>8192||!SHA.test(fingerprint||""))
    throw Error("Separate independently pinned Ed25519 public key required: HOLD");
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519"||
     createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")!==fingerprint)
    throw Error("Independent handoff review signer mismatch: HOLD");
  return key;
}
function signed(receipt,expected,fields,key){
  if(receipt?.algorithm!=="Ed25519"||!exact(receipt.claims,fields)||
     typeof receipt.signature!=="string"||
     !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature)||
     fields.some(field=>receipt.claims[field]!==expected[field]))
    throw Error("Incomplete or modified signed handoff review receipt: HOLD");
  const bytes=Buffer.from(receipt.signature,"base64");
  if(bytes.length!==64||!verify(null,canonicalBytes(expected),key,bytes))
    throw Error("Independent handoff review signature invalid: HOLD");
}
export function independentFollowUpReviewClaims({handoff,reviewRef,finding,reviewedAt}){
  if(handoff?.status!=="SIGNED_MANUAL_FOLLOWUP_HANDOFF_VERIFIED"||
     handoff.auditHoldCleared!==false||handoff.automaticClosure!==false||
     !Number.isSafeInteger(handoff.issueNumber)||handoff.issueNumber<1||
     !REF.test(handoff.incidentRef||"")||
     !REF.test(handoff.retainedObjectKey||"")||
     typeof handoff.retainedVersionId!=="string"||!handoff.retainedVersionId||
     !SHA.test(handoff.recordDigest||"")||
     !SHA.test(handoff.followUpHeadDigest||"")||
     !SHA.test(handoff.handoffHeadDigest||"")||
     !REF.test(reviewRef||"")||!REVIEW_ACTIONS.has(finding))
    throw Error("Verified independently retained owner follow-up handoff required: HOLD");
  utc(reviewedAt);
  return {schema:"rosie.independent-followup-handoff-review.v1",
    repository:"RosevearCreations/rosiedazzlers",issueNumber:handoff.issueNumber,
    incidentRef:handoff.incidentRef,retainedObjectKey:handoff.retainedObjectKey,
    retainedVersionId:handoff.retainedVersionId,
    retainedRecordDigest:handoff.recordDigest,
    followUpHeadDigest:handoff.followUpHeadDigest,
    ownerHandoffHeadDigest:handoff.handoffHeadDigest,
    reviewRef,finding,reviewedAt};
}
export async function verifyIndependentFollowUpReview({handoffArguments,
  reviewReceipt,reviewerPublicKeyPem,pinnedReviewerFingerprint,
  independentReviewReceiptPin,now=new Date()}){
  if(!handoffArguments||!SHA.test(pinnedReviewerFingerprint||"")||
     pinnedReviewerFingerprint===handoffArguments.pinnedOwnerFingerprint||
     pinnedReviewerFingerprint===handoffArguments.retentionVerification
       ?.reconciliationArguments?.evidenceArguments?.pinnedInvestigatorFingerprint)
    throw Error("Independent reviewer signer must differ from owner and investigator: HOLD");
  // This rereads exact COMPLIANCE WORM object versions and full upstream
  // detached Ed25519 evidence; an arbitrary VERIFIED claim cannot substitute.
  const handoff=await verifyManualFollowUpHandoff({...handoffArguments,now});
  const claims=reviewReceipt?.claims;
  const expected=independentFollowUpReviewClaims({handoff,
    reviewRef:claims?.reviewRef,finding:claims?.finding,reviewedAt:claims?.reviewedAt});
  const lastHandoffAt=handoffArguments.receipts?.at(-1)?.claims?.issuedAt;
  const at=utc(expected.reviewedAt),clock=new Date(now).getTime();
  if(!Number.isFinite(clock)||at<=utc(lastHandoffAt)||at>clock+300000)
    throw Error("Independent follow-up review predates signed owner handoff or lies in future: HOLD");
  signed(reviewReceipt,expected,REVIEW_FIELDS,
    pinnedEd25519(reviewerPublicKeyPem,pinnedReviewerFingerprint));
  const receiptDigest=digest(reviewReceipt);
  const pin=independentReviewReceiptPin;
  if(!pin||pin.receiptDigest!==receiptDigest||
     pin.retainedRecordDigest!==handoff.recordDigest||
     pin.ownerHandoffHeadDigest!==handoff.handoffHeadDigest||
     pin.reviewerFingerprint!==pinnedReviewerFingerprint||
     !REF.test(pin.externalReference||""))
    throw Error("Separately controlled signed reviewer receipt pin missing: HOLD");
  return {status:"INDEPENDENT_FOLLOWUP_HANDOFF_REVIEW_VERIFIED",
    issueNumber:handoff.issueNumber,incidentRef:handoff.incidentRef,
    retainedRecordDigest:handoff.recordDigest,
    followUpHeadDigest:handoff.followUpHeadDigest,
    ownerHandoffHeadDigest:handoff.handoffHeadDigest,
    independentReviewReceiptDigest:receiptDigest,
    reviewFinding:expected.finding,reviewedAt:expected.reviewedAt,
    reviewerEvidenceRef:pin.externalReference,
    auditHoldCleared:false,automaticDelivery:false,automaticClosure:false,
    externalWritePerformed:false};
}
export function manualExceptionHandoffDecisionClaims({review,sequence,
  action,decisionRef,issuedAt,previousDecisionDigest=null}){
  if(review?.status!=="INDEPENDENT_FOLLOWUP_HANDOFF_REVIEW_VERIFIED"||
     !Number.isSafeInteger(review.issueNumber)||review.issueNumber<1||
     !REF.test(review.incidentRef||"")||
     !SHA.test(review.retainedRecordDigest||"")||
     !SHA.test(review.followUpHeadDigest||"")||
     !SHA.test(review.ownerHandoffHeadDigest||"")||
     !SHA.test(review.independentReviewReceiptDigest||"")||
     !Number.isSafeInteger(sequence)||sequence<1||sequence>MAX||
     !OWNER_ACTIONS.has(action)||!REF.test(decisionRef||"")||
     !(previousDecisionDigest===null||SHA.test(previousDecisionDigest||"")))
    throw Error("Manual owner follow-up decision requires verified independent receipt: HOLD");
  if(utc(issuedAt)<=utc(review.reviewedAt))
    throw Error("Owner follow-up review cannot precede signed independent review: HOLD");
  return {schema:"rosie.manual-exception-handoff-decision.v1",
    repository:"RosevearCreations/rosiedazzlers",issueNumber:review.issueNumber,
    incidentRef:review.incidentRef,retainedRecordDigest:review.retainedRecordDigest,
    followUpHeadDigest:review.followUpHeadDigest,
    ownerHandoffHeadDigest:review.ownerHandoffHeadDigest,
    independentReviewReceiptDigest:review.independentReviewReceiptDigest,
    sequence,previousDecisionDigest,action,
    owner:"RosevearCreations",decisionRef,issuedAt};
}
export async function verifyManualExceptionHandoffGovernance({reviewArguments,
  decisionReceipts,ownerPublicKeyPem,pinnedOwnerFingerprint,
  independentGovernanceHeadPin,now=new Date()}){
  if(!reviewArguments||!Array.isArray(decisionReceipts)||
     decisionReceipts.length<1||decisionReceipts.length>MAX||
     pinnedOwnerFingerprint!==reviewArguments.handoffArguments?.pinnedOwnerFingerprint||
     pinnedOwnerFingerprint===reviewArguments.pinnedReviewerFingerprint)
    throw Error("Complete signed owner decision chain and distinct signer roots required: HOLD");
  const review=await verifyIndependentFollowUpReview({...reviewArguments,now});
  const key=pinnedEd25519(ownerPublicKeyPem,pinnedOwnerFingerprint);
  const clock=new Date(now).getTime();
  if(!Number.isFinite(clock))throw Error("Owner governance review clock missing: HOLD");
  let previous=null,lastAt=utc(review.reviewedAt);
  const rows=[];
  for(const receipt of decisionReceipts){
    const c=receipt?.claims;
    const expected=manualExceptionHandoffDecisionClaims({review,
      sequence:rows.length+1,action:c?.action,decisionRef:c?.decisionRef,
      issuedAt:c?.issuedAt,previousDecisionDigest:previous});
    const at=utc(expected.issuedAt);
    if(at<=lastAt||at>clock+300000)
      throw Error("Owner governance review replay, rollback or future timestamp: HOLD");
    signed(receipt,expected,OWNER_FIELDS,key);
    previous=digest(receipt);lastAt=at;
    rows.push({sequence:rows.length+1,action:expected.action,
      ownerDecisionRef:expected.decisionRef,issuedAt:expected.issuedAt,
      signedReceiptDigest:previous});
  }
  const pin=independentGovernanceHeadPin;
  if(!pin||pin.headDigest!==previous||pin.receiptCount!==rows.length||
     pin.independentReviewReceiptDigest!==review.independentReviewReceiptDigest||
     pin.retainedRecordDigest!==review.retainedRecordDigest||
     pin.ownerHandoffHeadDigest!==review.ownerHandoffHeadDigest||
     pin.issueNumber!==review.issueNumber||
     !REF.test(pin.externalReference||""))
    throw Error("Independently controlled complete owner governance head missing: HOLD");
  return {status:"INDEPENDENT_MANUAL_EXCEPTION_HANDOFF_GOVERNANCE",
    issueNumber:review.issueNumber,incidentRef:review.incidentRef,
    independentReviewReceiptDigest:review.independentReviewReceiptDigest,
    retainedRecordDigest:review.retainedRecordDigest,
    ownerHandoffHeadDigest:review.ownerHandoffHeadDigest,
    governanceHeadDigest:previous,reviewFinding:review.reviewFinding,
    decisionHistory:rows,externalReference:pin.externalReference,
    pendingManualOwnerReview:true,liveExceptionStatus:"UNCHANGED",
    auditHoldCleared:false,automaticDelivery:false,automaticClosure:false,
    externalWritePerformed:false};
}
export async function ownerManualHandoffReviewWorkbench(args){
  const verified=await verifyManualExceptionHandoffGovernance(args);
  const latest=verified.decisionHistory.at(-1);
  return {status:"READ_ONLY_MANUAL_EXCEPTION_HANDOFF_WORKBENCH",
    issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
    independentFinding:verified.reviewFinding,
    latestOwnerDecision:latest.action,
    decisionHistory:verified.decisionHistory,
    retainedRecordDigest:verified.retainedRecordDigest,
    governanceHeadDigest:verified.governanceHeadDigest,
    independentEvidenceRef:verified.externalReference,
    nextStep:"MANUAL_OWNER_EXCEPTION_REVIEW",
    liveExceptionStatus:"UNCHANGED",auditHoldCleared:false,
    automaticDelivery:false,automaticClosure:false,externalWritePerformed:false};
}
