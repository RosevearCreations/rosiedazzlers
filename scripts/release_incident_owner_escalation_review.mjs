/** Build 590 — independently pinned signed owner escalation-review receipt continuity.
 * Source-only, read-only governance: receipt ACK/DEFER never clears an audit HOLD,
 * signs an approval, mutates evidence, schedules work or changes live services.
 * Never accept a caller-supplied VERIFIED flag; recheck all signed register evidence.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyExceptionRegisterHistory,ownerEscalationLedger} from "./release_incident_external_exception_register.mjs";
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const ACTIONS=new Set(["ACKNOWLEDGE_REVIEW","REQUEST_FOLLOWUP","DEFER_FOLLOWUP"]);
const FIELDS=["schema","repository","issueNumber","exceptionRegisterDigest",
  "exceptionSequence","incidentRef","decisionDigest","action","owner","ownerReviewRef",
  "evidenceRef","issuedAt","previousReviewDigest"];
const MAX=100,DAY=86400000;
function canonicalTime(value){
  if(typeof value!=="string"||!Number.isFinite(Date.parse(value))||
     new Date(value).toISOString()!==value)
    throw Error("Non-canonical escalation-review timestamp: HOLD");
  return Date.parse(value);
}
function sameFields(value,fields){
  return value!==null&&typeof value==="object"&&!Array.isArray(value)&&
    Object.keys(value).sort().join(",")===fields.slice().sort().join(",");
}
const digestOf=value=>createHash("sha256").update(canonicalBytes(value)).digest("hex");
function underlying(history,incidentRef,decisionDigest){
  const decisions=history.latest.decisions;
  const match=decisions.find(d=>d.incidentRef===incidentRef&&d.receiptDigest===decisionDigest);
  if(!match)throw Error("Escalation review references unverified owner exception decision: HOLD");
  return match;
}
export function ownerReviewClaims({verifiedHistory,incidentRef,decisionDigest,action,
  ownerReviewRef,evidenceRef,issuedAt,previousReviewDigest=null}){
  if(verifiedHistory?.status!=="EXTERNAL_EXCEPTION_HISTORY_VERIFIED"||
     !SHA.test(verifiedHistory.latest?.registerDigest||"")||
     !Number.isSafeInteger(verifiedHistory.latest?.sequence)||
     !REF.test(incidentRef||"")||!SHA.test(decisionDigest||"")||
     !ACTIONS.has(action)||!REF.test(ownerReviewRef||"")||!REF.test(evidenceRef||"")||
     !(previousReviewDigest===null||SHA.test(previousReviewDigest||"")))
    throw Error("Verified signed register and bounded owner review decision required: HOLD");
  const decision=underlying(verifiedHistory,incidentRef,decisionDigest);
  if(canonicalTime(issuedAt)<canonicalTime(decision.issuedAt))
    throw Error("Owner review cannot predate its independently verified exception: HOLD");
  return {schema:"rosie.owner-escalation-review.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:verifiedHistory.latest.issueNumber,
    exceptionRegisterDigest:verifiedHistory.latest.registerDigest,
    exceptionSequence:verifiedHistory.latest.sequence,
    incidentRef,decisionDigest,action,owner:"RosevearCreations",
    ownerReviewRef,evidenceRef,issuedAt,previousReviewDigest};
}
export function verifyOwnerReviewHistory({verifyArguments,reviewReceipts,ownerReviewPublicKeyPem,
  pinnedOwnerReviewFingerprint,independentReviewHeadPin,now=new Date()}){
  if(!verifyArguments||typeof verifyArguments!=="object"||
     !Array.isArray(reviewReceipts)||reviewReceipts.length<1||reviewReceipts.length>MAX||
     !SHA.test(pinnedOwnerReviewFingerprint||"")||
     pinnedOwnerReviewFingerprint!==verifyArguments.pinnedOwnerFingerprint||
     [verifyArguments.pinnedExceptionSignerFingerprint,
       verifyArguments.pinnedSourceRegisterFingerprint].includes(pinnedOwnerReviewFingerprint))
    throw Error("Complete independently pinned owner review trust required: HOLD");
  const verifiedHistory=verifyExceptionRegisterHistory({...verifyArguments,now});
  const key=createPublicKey(ownerReviewPublicKeyPem);
  if(key.asymmetricKeyType!=="ed25519")throw Error("Signed owner escalation review must use Ed25519: HOLD");
  const fingerprint=createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex");
  if(fingerprint!==pinnedOwnerReviewFingerprint)
    throw Error("Owner escalation review signing-key fingerprint mismatch: HOLD");
  const t=new Date(now).getTime();
  if(!Number.isFinite(t))throw Error("Owner review clock unavailable: HOLD");
  let previous=null,lastAt=0;
  const rows=[];
  for(const receipt of reviewReceipts){
    if(receipt?.algorithm!=="Ed25519"||!sameFields(receipt.claims,FIELDS)||
       typeof receipt.signature!=="string"||
       !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature))
      throw Error("Owner escalation review receipt malformed: HOLD");
    const claims=receipt.claims;
    const expected=ownerReviewClaims({verifiedHistory,
      incidentRef:claims.incidentRef,decisionDigest:claims.decisionDigest,
      action:claims.action,ownerReviewRef:claims.ownerReviewRef,
      evidenceRef:claims.evidenceRef,issuedAt:claims.issuedAt,
      previousReviewDigest:previous});
    if(FIELDS.some(field=>expected[field]!==claims[field]))
      throw Error("Owner review claim or receipt hash-chain mismatch: HOLD");
    const issued=canonicalTime(claims.issuedAt);
    if(issued<=lastAt||issued>t+300000)
      throw Error("Owner review timestamp replay, rollback or future claim: HOLD");
    const bytes=Buffer.from(receipt.signature,"base64");
    if(bytes.length!==64||!verify(null,canonicalBytes(expected),key,bytes))
      throw Error("Owner review signature invalid: HOLD");
    const digest=digestOf(receipt);
    rows.push({incidentRef:claims.incidentRef,action:claims.action,
      exceptionDecisionDigest:claims.decisionDigest,
      ownerReviewRef:claims.ownerReviewRef,evidenceRef:claims.evidenceRef,
      issuedAt:claims.issuedAt,receiptDigest:digest});
    previous=digest;lastAt=issued;
  }
  if(!independentReviewHeadPin||!SHA.test(independentReviewHeadPin.headDigest||"")||
     !SHA.test(independentReviewHeadPin.exceptionRegisterDigest||"")||
     !REF.test(independentReviewHeadPin.externalReference||"")||
     !Number.isSafeInteger(independentReviewHeadPin.receiptCount)||
     independentReviewHeadPin.receiptCount!==rows.length||
     independentReviewHeadPin.headDigest!==previous||
     independentReviewHeadPin.exceptionRegisterDigest!==verifiedHistory.latest.registerDigest)
    throw Error("Separately controlled complete owner review receipt-head anchor missing or inconsistent: HOLD");
  return {status:"INDEPENDENTLY_PINNED_OWNER_REVIEW_CONTINUITY",
    exceptionRegisterDigest:verifiedHistory.latest.registerDigest,
    ownerReviewHeadDigest:previous,externalReference:independentReviewHeadPin.externalReference,
    rows,signingKeyFingerprint:fingerprint,automaticClosure:false,
    externalWritePerformed:false};
}
export function reviewContinuityGovernance({verifyArguments,reviewReceipts,ownerReviewPublicKeyPem,
  pinnedOwnerReviewFingerprint,independentReviewHeadPin,now=new Date(),
  reviewAfterDays=7}){
  const reviews=verifyOwnerReviewHistory({verifyArguments,reviewReceipts,
    ownerReviewPublicKeyPem,pinnedOwnerReviewFingerprint,independentReviewHeadPin,now});
  const escalation=ownerEscalationLedger({verifyArguments,now,reviewAfterDays});
  if(escalation.registerDigest!==reviews.exceptionRegisterDigest)
    throw Error("Owner review and exception register sources diverged: HOLD");
  const latestReviewByIncident=new Map();
  for(const r of reviews.rows)latestReviewByIncident.set(r.incidentRef,r);
  const clock=new Date(now).getTime();
  const rows=escalation.rows.map(e=>{
    const reviewed=latestReviewByIncident.get(e.incidentRef)||null;
    const overdue=reviewed?
      Math.floor((clock-canonicalTime(reviewed.issuedAt))/DAY)>=reviewAfterDays:
      e.reviewStatus==="OWNER_ESCALATION_REVIEW_DUE";
    return {incidentRef:e.incidentRef,exceptionStatus:e.reviewStatus,
      latestOwnerAction:reviewed?.action||"NONE",
      lastOwnerReviewAt:reviewed?.issuedAt||null,
      ownerReviewRef:reviewed?.ownerReviewRef||null,
      reviewDue:overdue,reviewState:overdue?"OWNER_FOLLOWUP_REVIEW_DUE":
        reviewed?.action==="DEFER_FOLLOWUP"?"OWNER_DEFERRED_REVIEW":
        reviewed?"OWNER_REVIEW_RECORDED":"OWNER_REVIEW_REQUIRED",
      auditHoldCleared:false};
  });
  return {status:"READ_ONLY_OWNER_EXCEPTION_CONTINUITY_GOVERNANCE",
    exceptionRegisterDigest:escalation.registerDigest,
    ownerReviewHeadDigest:reviews.ownerReviewHeadDigest,
    ownerReviewRequired:rows.some(r=>r.reviewDue),
    rows,automaticClosure:false,automaticEscalation:false,
    externalWritePerformed:false};
}
