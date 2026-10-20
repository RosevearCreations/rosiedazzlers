/** Build 588: read-only external-register continuity and signed operator exception history.
 * Independently pinned Ed25519 register/owner keys and complete register history
 * are required; a signed exception NEVER overrides failed evidence or changes storage.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes,digestRegister,verifyExternalRotationRegister,
  reconcileExternalRotationRegister} from "./release_incident_external_rotation_register.mjs";
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const ACTIONS=new Set(["OPEN_REVIEW","ACKNOWLEDGE_HOLD","DEFER_FOLLOWUP"]);
const KEYS=["schema","repository","issueNumber","registerDigest","registerSequence",
  "action","incidentRef","owner","approvalRef","issuedAt","previousDecisionDigest"];
function canonicalTime(value){
  if(typeof value!=="string"||!Number.isFinite(Date.parse(value))||
     new Date(value).toISOString()!==value)throw Error("Non-canonical decision time: HOLD");
  return Date.parse(value);
}
function publicFingerprint(pem){
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519")throw Error("Independent Ed25519 key required: HOLD");
  return {key,fingerprint:createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")};
}
export function reviewExternalRegisterContinuity({revisions,comments,evidenceByReceiptDigest,
  trustedFingerprintsByReceiptDigest,now=new Date()}){
  if(!Array.isArray(revisions)||revisions.length<1||revisions.length>100)
    throw Error("Complete bounded, independently pinned register revisions required: HOLD");
  const verified=[];let previous=null,prevRecord=null,prevTime=-Infinity;
  for(const revision of revisions){
    const {signedRegister,publicKeyPem,trustedFingerprint,externalPin}=revision||{};
    const record=signedRegister?.register;
    const proof=verifyExternalRotationRegister({signedRegister,publicKeyPem,
      trustedFingerprint,externalPin,previousPin:previous,now});
    const issued=canonicalTime(record.issuedAt);
    if(issued<=prevTime)throw Error("Register timestamp rollback or duplicate: HOLD");
    if(prevRecord){
      if(record.repository!==prevRecord.repository||record.issueNumber!==prevRecord.issueNumber||
         record.receiptCount<prevRecord.receiptCount)
        throw Error("External register identity or receipt count rollback: HOLD");
      for(let i=0;i<prevRecord.entries.length;i++){
        if(JSON.stringify(record.entries[i])!==JSON.stringify(prevRecord.entries[i]))
          throw Error("Historical registered receipt was rewritten: HOLD");
      }
      if(record.receiptCount===prevRecord.receiptCount&&
         record.headDigest!==prevRecord.headDigest)
        throw Error("Register head changed without new receipts: HOLD");
    }
    previous={sequence:proof.sequence,registerDigest:proof.registerDigest,
      headDigest:proof.headDigest};
    verified.push({sequence:proof.sequence,registerDigest:proof.registerDigest,
      headDigest:proof.headDigest,receiptCount:proof.receiptCount,
      registerRef:proof.registerRef,issuedAt:record.issuedAt});
    prevTime=issued;prevRecord=record;
  }
  if(!Array.isArray(comments)||!(evidenceByReceiptDigest instanceof Map)||
    !(trustedFingerprintsByReceiptDigest instanceof Map))
    throw Error("Fresh complete GitHub receipts and detached signature packages required: HOLD");
  const latest=revisions.at(-1);
  const joined=reconcileExternalRotationRegister({
    ...latest,previousPin:revisions.length>1?{
      sequence:verified.at(-2).sequence,
      registerDigest:verified.at(-2).registerDigest,
      headDigest:verified.at(-2).headDigest
    }:null,comments,evidenceByReceiptDigest,trustedFingerprintsByReceiptDigest,now});
  if(joined.registerDigest!==previous.registerDigest||
     joined.verifiedReceipts!==prevRecord.receiptCount)
    throw Error("Latest signed register or handoff verification disagrees: HOLD");
  return {status:"CONTINUITY_VERIFIED",repository:prevRecord.repository,
    issueNumber:prevRecord.issueNumber,registerDigest:previous.registerDigest,
    headDigest:previous.headDigest,registerSequence:previous.sequence,
    verifiedReceipts:joined.verifiedReceipts,revisions:verified,
    externalWritePerformed:false};
}
export function ownerExceptionClaims({continuity,action,incidentRef,approvalRef,issuedAt,
  previousDecisionDigest=null}){
  if(!continuity||continuity.status!=="CONTINUITY_VERIFIED"||
     continuity.repository!=="RosevearCreations/rosiedazzlers"||
     !Number.isSafeInteger(continuity.issueNumber)||continuity.issueNumber<1||
     !SHA.test(continuity.registerDigest||"")||
     !Number.isSafeInteger(continuity.registerSequence)||continuity.registerSequence<1||
     !ACTIONS.has(action)||!REF.test(incidentRef||"")||!REF.test(approvalRef||"")||
     !(previousDecisionDigest===null||SHA.test(previousDecisionDigest||"")))
    throw Error("Signed owner exception cannot override unverified register: HOLD");
  canonicalTime(issuedAt);
  return {schema:"rosie.owner-register-exception.v1",
    repository:continuity.repository,issueNumber:continuity.issueNumber,
    registerDigest:continuity.registerDigest,
    registerSequence:continuity.registerSequence,action,incidentRef,
    owner:"RosevearCreations",approvalRef,issuedAt,previousDecisionDigest};
}
export function verifyOwnerExceptionHistory({continuity,receipts,ownerPublicKeyPem,
  pinnedOwnerFingerprint,pinnedRegisterFingerprint,now=new Date()}){
  if(!continuity||continuity.status!=="CONTINUITY_VERIFIED"||
     !Array.isArray(receipts)||receipts.length>100||
     !SHA.test(pinnedOwnerFingerprint||"")||!SHA.test(pinnedRegisterFingerprint||"")||
     pinnedOwnerFingerprint===pinnedRegisterFingerprint)
    throw Error("Separately pinned owner key and verified register continuity required: HOLD");
  const {key,fingerprint}=publicFingerprint(ownerPublicKeyPem);
  if(fingerprint!==pinnedOwnerFingerprint)
    throw Error("Operator exception signing key does not match independent owner pin: HOLD");
  let previous=null,lastAt=0;const history=[];const currentTime=new Date(now).getTime();
  for(const receipt of receipts){
    if(receipt?.algorithm!=="Ed25519"||typeof receipt.signature!=="string"||
       !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature)||
       !receipt.claims||typeof receipt.claims!=="object"||Array.isArray(receipt.claims)||
       Object.keys(receipt.claims).sort().join(",")!==KEYS.slice().sort().join(","))
      throw Error("Owner exception receipt shape or signature invalid: HOLD");
    const claims=receipt.claims;
    const expected=ownerExceptionClaims({continuity,action:claims.action,
      incidentRef:claims.incidentRef,approvalRef:claims.approvalRef,
      issuedAt:claims.issuedAt,previousDecisionDigest:previous});
    if(KEYS.some(field=>expected[field]!==claims[field]))
      throw Error("Exception history contains a changed, replayed or unlinked owner receipt: HOLD");
    const issued=canonicalTime(claims.issuedAt);
    if(issued<=lastAt||!Number.isFinite(currentTime)||issued>currentTime+300000)
      throw Error("Owner exception decision is replayed, out-of-order or future: HOLD");
    const bytes=Buffer.from(receipt.signature,"base64");
    if(bytes.length!==64||!verify(null,canonicalBytes(expected),key,bytes))
      throw Error("Owner exception signature invalid: HOLD");
    const digest=createHash("sha256").update(canonicalBytes(receipt)).digest("hex");
    history.push({action:claims.action,incidentRef:claims.incidentRef,
      ownerApprovalRef:claims.approvalRef,issuedAt:claims.issuedAt,
      registerDigest:claims.registerDigest,receiptDigest:digest});
    previous=digest;lastAt=issued;
  }
  return {status:history.length?"OWNER_EXCEPTION_HISTORY_VERIFIED":"NO_OWNER_EXCEPTION_DECISIONS",
    decisions:history,headDigest:previous,registerDigest:continuity.registerDigest,
    continuityStatus:continuity.status,
    executionAuthorized:false,externalWritePerformed:false};
}
export function registerOperatorReview({continuityArguments,ownerReceipts=[],
  ownerPublicKeyPem,pinnedOwnerFingerprint,pinnedRegisterFingerprint,now=new Date()}){
  const continuity=reviewExternalRegisterContinuity({...continuityArguments,now});
  const exceptions=verifyOwnerExceptionHistory({continuity,receipts:ownerReceipts,
    ownerPublicKeyPem,pinnedOwnerFingerprint,pinnedRegisterFingerprint,now});
  return {status:"READ_ONLY_OWNER_REVIEW_COMPLETE",continuity,exceptions,
    anyAutomaticExceptionClosure:false,externalWritePerformed:false};
}
