/** Build 591 — owner-review head immutable retention and manual exception handoff.
 * The operation is OFF by default. Cryptographically reverify Build 590 owner
 * review history, only write on a separately approved manual dispatch, and never
 * confuse a successful S3 write with a separately pinned external audit head.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyOwnerReviewHistory} from "./release_incident_owner_escalation_review.mjs";
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const KEY=/^[A-Za-z0-9][A-Za-z0-9._/-]{2,180}$/;
const DAY=86400000;
const digestOf=obj=>createHash("sha256").update(canonicalBytes(obj)).digest("hex");
function checkedTime(value){
  if(typeof value!=="string"||!Number.isFinite(Date.parse(value))||
     new Date(value).toISOString()!==value)
    throw Error("Canonical owner review time required: HOLD");
  return Date.parse(value);
}
function trustedOwnerKey(pem,pin){
  if(typeof pem!=="string"||pem.length>8192||!SHA.test(pin||""))
    throw Error("Independently pinned Ed25519 owner signing key required: HOLD");
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519")throw Error("Owner review signing key must be Ed25519: HOLD");
  const fingerprint=createHash("sha256").update(
    key.export({format:"der",type:"spki"})).digest("hex");
  if(fingerprint!==pin)throw Error("Owner signing-key trust pin mismatch: HOLD");
  return key;
}
export function verifiedReviewHeadEnvelope({verifyArguments,reviewReceipts,
  ownerReviewPublicKeyPem,pinnedOwnerReviewFingerprint,independentReviewHeadPin,
  issuedAt,now=new Date()}){
  const review=verifyOwnerReviewHistory({verifyArguments,reviewReceipts,
    ownerReviewPublicKeyPem,pinnedOwnerReviewFingerprint,independentReviewHeadPin,now});
  if(review.status!=="INDEPENDENTLY_PINNED_OWNER_REVIEW_CONTINUITY"||
    !Array.isArray(review.rows)||review.rows.length<1||review.rows.length>100)
    throw Error("Complete signed and independent review-head evidence required: HOLD");
  const issued=checkedTime(issuedAt),current=new Date(now).getTime();
  if(!Number.isFinite(current)||issued>current+300000)
    throw Error("Owner review head record issued in future: HOLD");
  const payload={
    schema:"rosie.owner-review-head-retention.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:verifyArguments?.continuityArguments?.revisions?.at(-1)?.signedRegister?.register?.issueNumber,
    exceptionRegisterDigest:review.exceptionRegisterDigest,
    reviewHeadDigest:review.ownerReviewHeadDigest,
    reviewReceiptCount:review.rows.length,
    ownerSignerFingerprint:review.signingKeyFingerprint,
    independentReviewHeadRef:independentReviewHeadPin.externalReference,
    lastOwnerReviewAt:review.rows.at(-1).issuedAt,
    issuedAt
  };
  if(!Number.isSafeInteger(payload.issueNumber)||payload.issueNumber<1||
    !SHA.test(payload.exceptionRegisterDigest)||!SHA.test(payload.reviewHeadDigest)||
    !SHA.test(payload.ownerSignerFingerprint)||
    !REF.test(payload.independentReviewHeadRef))
    throw Error("Exact independently anchored owner review head incomplete: HOLD");
  if(issued<checkedTime(payload.lastOwnerReviewAt))
    throw Error("Archived review head cannot predate its last signed owner review: HOLD");
  const contentDigest=digestOf(payload);
  return {payload,contentDigest};
}
export function manualRetentionAuthorization({authorization,record}){
  if(authorization?.event!=="workflow_dispatch"||
    authorization.actor!=="RosevearCreations"||
    authorization.confirmed!==true||
    !REF.test(authorization.approvalRef||"")||
    authorization.expectedDigest!==record.contentDigest||
    authorization.expectedHeadDigest!==record.payload.reviewHeadDigest||
    authorization.trustedOwnerFingerprint!==record.payload.ownerSignerFingerprint)
    throw Error("Explicit owner manual WORM retention approval and exact pinned head required: HOLD");
  return true;
}
function validateRetentionProvider(adapter){
  if(!adapter||adapter.capabilities?.immutableCreate!==true||
    adapter.capabilities?.retentionLock!==true||
    adapter.capabilities?.independentTrustRoot!==true||
    typeof adapter.createOnce!=="function"||
    typeof adapter.readVersioned!=="function"||
    typeof adapter.retentionEvidence!=="function")
    throw Error("Independent versioned WORM provider unavailable: HOLD");
}
function checkLock(lock,key,versionId,now,minRetentionDays){
  const until=Date.parse(lock?.retainUntil||"");
  if(lock?.key!==key||lock?.versionId!==versionId||
    lock?.mode!=="COMPLIANCE"||!Number.isFinite(until)||
    until<new Date(now).getTime()+Math.max(0,minRetentionDays*DAY-(minRetentionDays?60000:0))
    throw Error("Exact-version S3 COMPLIANCE retention is shorter than approved: HOLD");
  return new Date(until).toISOString();
}
/** Only manual owners can create an irreversible COMPLIANCE version. A retained
 * object is NOT independently pinned until a separate external owner record
 * of exact key/version/digest is subsequently verified.
 */
export async function retainOwnerReviewHead({verifyArguments,reviewReceipts,
  ownerReviewPublicKeyPem,pinnedOwnerReviewFingerprint,independentReviewHeadPin,
  adapter,objectKey,authorization,issuedAt,now=new Date(),minRetentionDays=30}){
  if(!KEY.test(objectKey||"")||!Number.isInteger(minRetentionDays)||
    minRetentionDays<30||minRetentionDays>3650)
    throw Error("Owner review head key or minimum retention invalid: HOLD");
  const record=verifiedReviewHeadEnvelope({verifyArguments,reviewReceipts,
    ownerReviewPublicKeyPem,pinnedOwnerReviewFingerprint,independentReviewHeadPin,issuedAt,now});
  manualRetentionAuthorization({authorization,record});
  validateRetentionProvider(adapter);
  if(typeof adapter.ensureReady==="function")await adapter.ensureReady();
  const put=await adapter.createOnce(objectKey,record);
  if(put?.created!==true||typeof put.versionId!=="string"||!put.versionId||
    put.versionId==="null")throw Error("New immutable object VersionId not confirmed: HOLD");
  const [lock,stored]=await Promise.all([
    adapter.retentionEvidence(objectKey,put.versionId),
    adapter.readVersioned(objectKey,put.versionId)
  ]);
  const retainedUntil=checkLock(lock,objectKey,put.versionId,now,minRetentionDays);
  if(digestOf(stored)!==digestOf(record)||
    stored?.contentDigest!==record.contentDigest)
    throw Error("WORM object content differs from signed owner review head: HOLD");
  return {status:"WORM_RETAINED_EXTERNAL_PIN_PENDING",objectKey,
    versionId:put.versionId,recordDigest:digestOf(record),
    contentDigest:record.contentDigest,reviewHeadDigest:record.payload.reviewHeadDigest,
    retainedUntil,independentPinRequired:true,automaticClosure:false};
}
/** Read-only exact-version readback. The immutable object pin must have been
 * independently secured outside the GitHub workflow AFTER a successful write.
 */
export async function verifyRetainedOwnerReviewHead({verifyArguments,reviewReceipts,
  ownerReviewPublicKeyPem,pinnedOwnerReviewFingerprint,independentReviewHeadPin,
  adapter,independentStoredObjectPin,issuedAt,now=new Date()}){
  const record=verifiedReviewHeadEnvelope({verifyArguments,reviewReceipts,
    ownerReviewPublicKeyPem,pinnedOwnerReviewFingerprint,independentReviewHeadPin,issuedAt,now});
  const pin=independentStoredObjectPin;
  if(!pin||!KEY.test(pin.objectKey||"")||
    typeof pin.versionId!=="string"||!pin.versionId||pin.versionId==="null"||
    !SHA.test(pin.recordDigest||"")||
    pin.recordDigest!==digestOf(record)||
    pin.reviewHeadDigest!==record.payload.reviewHeadDigest||
    !REF.test(pin.externalReference||""))
    throw Error("Separately retained exact immutable object pin unavailable: HOLD");
  validateRetentionProvider(adapter);
  const [lock,stored]=await Promise.all([
    adapter.retentionEvidence(pin.objectKey,pin.versionId),
    adapter.readVersioned(pin.objectKey,pin.versionId)]);
  const retainedUntil=checkLock(lock,pin.objectKey,pin.versionId,now,0);
  if(digestOf(stored)!==pin.recordDigest||stored?.contentDigest!==record.contentDigest)
    throw Error("Pinned retained owner review head digest mismatch: HOLD");
  return {status:"INDEPENDENTLY_PINNED_OWNER_HEAD_RETAINED",
    recordDigest:pin.recordDigest,reviewHeadDigest:pin.reviewHeadDigest,
    issueNumber:record.payload.issueNumber,
    objectKey:pin.objectKey,versionId:pin.versionId,
    externalReference:pin.externalReference,retainedUntil,
    automaticClosure:false,externalWritePerformed:false};
}
const HANDOFF_ACTIONS=new Set(["REQUEST_MANUAL_REVIEW","ACKNOWLEDGE_OPEN_HOLD","DEFER_HANDOFF"]);
const HANDOFF_FIELDS=["schema","repository","issueNumber","objectKey","versionId",
  "recordDigest","reviewHeadDigest","incidentRef","action","owner","handoffRef",
  "issuedAt","previousHandoffDigest"];
export function manualExceptionHandoffClaims({retainedProof,issueNumber,incidentRef,
  action,handoffRef,issuedAt,previousHandoffDigest=null}){
  if(retainedProof?.status!=="INDEPENDENTLY_PINNED_OWNER_HEAD_RETAINED"||
    !SHA.test(retainedProof.recordDigest||"")||
    !SHA.test(retainedProof.reviewHeadDigest||"")||
    !KEY.test(retainedProof.objectKey||"")||
    typeof retainedProof.versionId!=="string"||!retainedProof.versionId||
    !Number.isSafeInteger(issueNumber)||issueNumber<1||
    issueNumber!==retainedProof.issueNumber||
    !REF.test(incidentRef||"")||!REF.test(handoffRef||"")||
    !HANDOFF_ACTIONS.has(action)||
    !(previousHandoffDigest===null||SHA.test(previousHandoffDigest||"")))
    throw Error("Manual handoff requires a verified independently pinned retained head: HOLD");
  checkedTime(issuedAt);
  return {schema:"rosie.owner-manual-exception-handoff.v1",
    repository:"RosevearCreations/rosiedazzlers",issueNumber,
    objectKey:retainedProof.objectKey,versionId:retainedProof.versionId,
    recordDigest:retainedProof.recordDigest,reviewHeadDigest:retainedProof.reviewHeadDigest,
    incidentRef,action,owner:"RosevearCreations",handoffRef,issuedAt,previousHandoffDigest};
}
export async function verifyManualExceptionHandoff({retentionVerification,issueNumber,receipts,
  ownerPublicKeyPem,pinnedOwnerFingerprint,independentHandoffHeadPin,now=new Date()}){
  const retainedProof=await verifyRetainedOwnerReviewHead({...retentionVerification,now});
  if(!Array.isArray(receipts)||receipts.length<1||receipts.length>100)
    throw Error("Complete signed manual handoff history required: HOLD");
  const key=trustedOwnerKey(ownerPublicKeyPem,pinnedOwnerFingerprint);
  const current=new Date(now).getTime();let previous=null,lastTime=0;
  if(!Number.isFinite(current))throw Error("Owner manual review time unavailable: HOLD");
  for(const receipt of receipts){
    if(receipt?.algorithm!=="Ed25519"||!receipt.claims||
      Object.keys(receipt.claims).sort().join(",")!==HANDOFF_FIELDS.slice().sort().join(",")||
      typeof receipt.signature!=="string"||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature))
      throw Error("Malformed signed manual exception handoff receipt: HOLD");
    const claims=receipt.claims;
    const expected=manualExceptionHandoffClaims({retainedProof,issueNumber,
      incidentRef:claims.incidentRef,action:claims.action,
      handoffRef:claims.handoffRef,issuedAt:claims.issuedAt,
      previousHandoffDigest:previous});
    if(HANDOFF_FIELDS.some(field=>claims[field]!==expected[field]))
      throw Error("Handoff receipt, retained head or predecessor changed: HOLD");
    const issued=checkedTime(claims.issuedAt);
    if(issued<=lastTime||issued>current+300000)
      throw Error("Manual owner handoff timestamp rollback/replay: HOLD");
    const bytes=Buffer.from(receipt.signature,"base64");
    if(bytes.length!==64||!verify(null,canonicalBytes(expected),key,bytes))
      throw Error("Manual owner handoff signature invalid: HOLD");
    previous=digestOf(receipt);lastTime=issued;
  }
  if(!independentHandoffHeadPin||independentHandoffHeadPin.headDigest!==previous||
    independentHandoffHeadPin.receiptCount!==receipts.length||
    independentHandoffHeadPin.recordDigest!==retainedProof.recordDigest||
    !REF.test(independentHandoffHeadPin.externalReference||""))
    throw Error("Independently controlled signed manual handoff head pin missing: HOLD");
  return {status:"SIGNED_MANUAL_EXCEPTION_HANDOFF_VERIFIED",
    handoffCount:receipts.length,headDigest:previous,
    recordDigest:retainedProof.recordDigest,
    externalReference:independentHandoffHeadPin.externalReference,
    ownerReviewRequired:true,auditHoldCleared:false,
    automaticClosure:false,automaticEscalation:false,externalWritePerformed:false};
}
