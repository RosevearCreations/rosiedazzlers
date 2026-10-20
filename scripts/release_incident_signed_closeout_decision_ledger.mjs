/** Build 593 — owner-signed closeout DECISION ledger and read-only workbench.
 * Revalidates Build 592's immutable owner-head, handoff, owner closeout and
 * independent auditor signatures on each invocation. No CLOSE action exists:
 * all status changes require a separate explicitly authorized operational flow.
 * No external writes, mutable GitHub receipts, customer changes or live keys.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {evaluateExplicitOwnerExceptionCloseout} from "./release_incident_review_head_rotation_closeout.mjs";
const SHA=/^[0-9a-f]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const ACTIONS=new Set(["ACKNOWLEDGE_CANDIDATE","DEFER_REVIEW",
  "REJECT_CANDIDATE","REQUEST_MANUAL_HANDOFF"]);
const FIELDS=["schema","repository","issueNumber","incidentRef",
  "rotationHeadDigest","handoffHeadDigest","closeoutReceiptDigest",
  "auditorReceiptDigest","action","owner","decisionRef","issuedAt",
  "previousDecisionDigest"];
const MAX=100;
const digest=value=>createHash("sha256").update(canonicalBytes(value)).digest("hex");
function time(value){
  if(typeof value!=="string"||!Number.isFinite(Date.parse(value))||
     new Date(value).toISOString()!==value)
    throw Error("Owner decision timestamp must be canonical: HOLD");
  return Date.parse(value);
}
function fingerprintOf(pem){
  if(typeof pem!=="string"||pem.length>8192)
    throw Error("Owner signing public key missing: HOLD");
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519")
    throw Error("Owner decision must use Ed25519: HOLD");
  return {key,fingerprint:createHash("sha256").update(
    key.export({format:"der",type:"spki"})).digest("hex")};
}
function exactKeys(obj,names){
  return obj!==null&&typeof obj==="object"&&!Array.isArray(obj)&&
    Object.keys(obj).sort().join(",")===names.slice().sort().join(",");
}
export function signedCloseoutDecisionClaims({candidate,issueNumber,action,
  decisionRef,issuedAt,previousDecisionDigest=null}){
  if(candidate?.status!=="OWNER_CLOSEOUT_REVIEW_CANDIDATE"||
     candidate.auditHoldCleared!==false||candidate.automaticClosure!==false||
     !Number.isSafeInteger(issueNumber)||issueNumber<1||
     !REF.test(candidate.incidentRef||"")||
     !SHA.test(candidate.rotationHeadDigest||"")||
     !SHA.test(candidate.handoffHeadDigest||"")||
     !SHA.test(candidate.closeoutReceiptDigest||"")||
     !SHA.test(candidate.auditorReceiptDigest||"")||
     !ACTIONS.has(action)||!REF.test(decisionRef||"")||
     !(previousDecisionDigest===null||SHA.test(previousDecisionDigest||"")))
    throw Error("Only independently verified manual owner closeout candidates may be reviewed: HOLD");
  time(issuedAt);
  return {schema:"rosie.owner-closeout-decision.v1",
    repository:"RosevearCreations/rosiedazzlers",issueNumber,
    incidentRef:candidate.incidentRef,
    rotationHeadDigest:candidate.rotationHeadDigest,
    handoffHeadDigest:candidate.handoffHeadDigest,
    closeoutReceiptDigest:candidate.closeoutReceiptDigest,
    auditorReceiptDigest:candidate.auditorReceiptDigest,
    action,owner:"RosevearCreations",decisionRef,issuedAt,previousDecisionDigest};
}
export async function verifyCloseoutDecisionLedger({closeoutArguments,receipts,
  ownerPublicKeyPem,pinnedOwnerFingerprint,independentDecisionHeadPin,
  now=new Date()}){
  if(!closeoutArguments||!Array.isArray(receipts)||
     receipts.length<1||receipts.length>MAX||
     !SHA.test(pinnedOwnerFingerprint||"")||
     closeoutArguments.pinnedOwnerFingerprint!==pinnedOwnerFingerprint||
     pinnedOwnerFingerprint===closeoutArguments.pinnedAuditorFingerprint)
    throw Error("Complete independently pinned signed owner decision history required: HOLD");
  // This performs ALL Build 592 WORM exact-VersionId and external trust proof checks.
  const candidate=await evaluateExplicitOwnerExceptionCloseout({...closeoutArguments,now});
  if(candidate.status!=="OWNER_CLOSEOUT_REVIEW_CANDIDATE")
    throw Error("Owner closeout candidate is not independently verified: HOLD");
  const closeout=closeoutArguments.ownerCloseoutReceipt?.claims;
  if(!closeout||closeout.incidentRef!==candidate.incidentRef||
     !Number.isSafeInteger(closeout.issueNumber)||closeout.issueNumber<1)
    throw Error("Source owner closeout receipt identity unavailable: HOLD");
  const {key,fingerprint}=fingerprintOf(ownerPublicKeyPem);
  if(fingerprint!==pinnedOwnerFingerprint)
    throw Error("Owner closeout signing-key fingerprint mismatch: HOLD");
  const clock=new Date(now).getTime();
  if(!Number.isFinite(clock))throw Error("Owner decision clock invalid: HOLD");
  let previous=null,lastAt=time(closeout.issuedAt),rows=[];
  for(const receipt of receipts){
    if(receipt?.algorithm!=="Ed25519"||!exactKeys(receipt.claims,FIELDS)||
       typeof receipt.signature!=="string"||
       !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature))
      throw Error("Unsigned, malformed or altered closeout decision: HOLD");
    const c=receipt.claims;
    const expected=signedCloseoutDecisionClaims({candidate,
      issueNumber:closeout.issueNumber,
      action:c.action,decisionRef:c.decisionRef,
      issuedAt:c.issuedAt,previousDecisionDigest:previous});
    if(FIELDS.some(k=>c[k]!==expected[k]))
      throw Error("Closeout decision has wrong incident, source digest or predecessor: HOLD");
    const at=time(c.issuedAt);
    if(at<=lastAt||at>clock+300000)
      throw Error("Owner decision replay, rollback, premature or future timestamp: HOLD");
    const bytes=Buffer.from(receipt.signature,"base64");
    if(bytes.length!==64||!verify(null,canonicalBytes(expected),key,bytes))
      throw Error("Owner closeout decision signature invalid: HOLD");
    previous=digest(receipt);lastAt=at;
    rows.push({action:c.action,decisionRef:c.decisionRef,
      incidentRef:c.incidentRef,issuedAt:c.issuedAt,receiptDigest:previous});
  }
  const pin=independentDecisionHeadPin;
  if(!pin||pin.headDigest!==previous||pin.receiptCount!==rows.length||
     pin.sourceCloseoutReceiptDigest!==candidate.closeoutReceiptDigest||
     pin.exceptionRotationDigest!==candidate.rotationHeadDigest||
     !REF.test(pin.externalReference||""))
    throw Error("Separately retained complete owner decision register head missing: HOLD");
  return {status:"SIGNED_OWNER_CLOSEOUT_LEDGER_VERIFIED",
    candidate,headDigest:previous,
    sourceCloseoutReceiptDigest:candidate.closeoutReceiptDigest,
    externalReference:pin.externalReference,rows,
    auditHoldCleared:false,automaticClosure:false,externalWritePerformed:false};
}
/** Operator workbench is a nonmutating presentation model: no close button,
 * override, generated approval, storage write or automatic decision.
 */
export async function ownerCloseoutReviewWorkbench(input){
  const ledger=await verifyCloseoutDecisionLedger(input);
  const latest=ledger.rows.at(-1);
  const labels={
    ACKNOWLEDGE_CANDIDATE:"Owner acknowledged review candidate",
    DEFER_REVIEW:"Owner deferred review",
    REJECT_CANDIDATE:"Owner rejected closeout candidate",
    REQUEST_MANUAL_HANDOFF:"Manual handoff requested"
  };
  return {status:"OWNER_CLOSEOUT_REVIEW_WORKBENCH",
    incidentRef:latest.incidentRef,
    latestDecision:latest.action,
    reviewLabel:labels[latest.action],
    decisionHistory:ledger.rows,
    independentDecisionHead:ledger.headDigest,
    sourceCloseoutReceiptDigest:ledger.sourceCloseoutReceiptDigest,
    externalReference:ledger.externalReference,
    manualOwnerActionRequired:true,
    liveExceptionStatus:"UNCHANGED",
    auditHoldCleared:false,automaticClosure:false,automaticEscalation:false,
    externalWritePerformed:false};
}
