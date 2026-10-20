/** Build 589 — independently signed/pinned owner exception register and read-only escalation review.
 * Every register entry is backed by a verified Build 588 Ed25519 owner exception.
 * Separately pinned register digest and signing-key fingerprint are mandatory.
 * No storage writes, approval creation, automated escalation, exception closure or bypass.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {reviewExternalRegisterContinuity,verifyOwnerExceptionHistory} from "./release_incident_external_register_continuity.mjs";
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const MAX=100,DAY=86400000;
const FIELDS=["schema","repository","issueNumber","sourceRegisterDigest","sourceRegisterSequence",
  "sequence","previousExceptionRegisterDigest","headDigest","decisionCount",
  "entries","issuedAt","registerRef"];
const ENTRY_FIELDS=["decisionDigest","action","incidentRef","ownerApprovalRef",
  "issuedAt","sourceRegisterDigest"];
function time(value){
  if(typeof value!=="string"||!Number.isFinite(Date.parse(value))||
    new Date(value).toISOString()!==value)
    throw Error("Canonical register or exception timestamp required: HOLD");
  return Date.parse(value);
}
function publicKeyAndFingerprint(pem){
  if(typeof pem!=="string"||pem.length>8192)throw Error("Independent register public key missing: HOLD");
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519")throw Error("External exception register requires Ed25519: HOLD");
  const fp=createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex");
  return {key,fp};
}
function exactFields(value,keys){
  return value!==null&&typeof value==="object"&&!Array.isArray(value)&&
    Object.keys(value).sort().join(",")===keys.slice().sort().join(",");
}
function validateRecord(record){
  if(!exactFields(record,FIELDS)||
    record.schema!=="rosie.external-exception-register.v1"||
    record.repository!=="RosevearCreations/rosiedazzlers"||
    !Number.isSafeInteger(record.issueNumber)||record.issueNumber<1||
    !SHA.test(record.sourceRegisterDigest||"")||
    !Number.isSafeInteger(record.sourceRegisterSequence)||record.sourceRegisterSequence<1||
    !Number.isSafeInteger(record.sequence)||record.sequence<1||
    !(record.previousExceptionRegisterDigest===null||
      SHA.test(record.previousExceptionRegisterDigest||""))||
    !SHA.test(record.headDigest||"")||
    !Number.isSafeInteger(record.decisionCount)||record.decisionCount<1||
    record.decisionCount>MAX||!Array.isArray(record.entries)||
    record.entries.length!==record.decisionCount||
    !REF.test(record.registerRef||""))
    throw Error("Independently signed owner exception register schema invalid: HOLD");
  time(record.issuedAt);
  let last=0,previous=null;const seen=new Set();
  for(const entry of record.entries){
    if(!exactFields(entry,ENTRY_FIELDS)||!SHA.test(entry.decisionDigest||"")||
       !SHA.test(entry.sourceRegisterDigest||"")||
       entry.sourceRegisterDigest!==record.sourceRegisterDigest||
       !["OPEN_REVIEW","ACKNOWLEDGE_HOLD","DEFER_FOLLOWUP"].includes(entry.action)||
       !REF.test(entry.incidentRef||"")||!REF.test(entry.ownerApprovalRef||"")||
       seen.has(entry.decisionDigest))
      throw Error("External owner decision register contains an invalid entry: HOLD");
    const stamp=time(entry.issuedAt);
    if(stamp<=last||stamp>time(record.issuedAt)+300000)
      throw Error("External owner decision ordering or issue time invalid: HOLD");
    last=stamp;seen.add(entry.decisionDigest);previous=entry.decisionDigest;
  }
  if(previous!==record.headDigest)throw Error("External exception register head differs from last owner decision: HOLD");
  return record;
}
export function exceptionRegisterDigest(record){
  return createHash("sha256").update(canonicalBytes(record)).digest("hex");
}
function verifyExceptionRegisterRevision({revision,previousPin=null,continuity,
  ownerReceipts,ownerPublicKeyPem,pinnedOwnerFingerprint,pinnedSourceRegisterFingerprint,
  now=new Date()}){
  const {signedRegister,publicKeyPem,pinnedSignerFingerprint,externalPin}=revision||{};
  if(!signedRegister||signedRegister.algorithm!=="Ed25519"||
    typeof signedRegister.signature!=="string"||
    !SHA.test(pinnedSignerFingerprint||"")||
    !SHA.test(pinnedOwnerFingerprint||"")||
    !SHA.test(pinnedSourceRegisterFingerprint||"")||
    new Set([pinnedSignerFingerprint,pinnedOwnerFingerprint,pinnedSourceRegisterFingerprint]).size!==3)
    throw Error("Three separate independent signer identities required: HOLD");
  if(!continuity||continuity.status!=="CONTINUITY_VERIFIED"||
    !SHA.test(continuity.registerDigest||""))
    throw Error("Verified external rotation register continuity required: HOLD");
  const record=validateRecord(signedRegister.register);
  if(record.repository!==continuity.repository||record.issueNumber!==continuity.issueNumber||
    record.sourceRegisterDigest!==continuity.registerDigest||
    record.sourceRegisterSequence!==continuity.registerSequence)
    throw Error("External exception register must bind exact verified rotation register: HOLD");
  const current=new Date(now).getTime();
  if(!Number.isFinite(current)||time(record.issuedAt)>current+300000)
    throw Error("External exception register issued in future: HOLD");
  const {key,fp}=publicKeyAndFingerprint(publicKeyPem);
  if(fp!==pinnedSignerFingerprint)
    throw Error("Independent external exception register signer fingerprint mismatch: HOLD");
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(signedRegister.signature))
    throw Error("External exception register signature encoding invalid: HOLD");
  const bytes=Buffer.from(signedRegister.signature,"base64");
  if(bytes.length!==64||!verify(null,canonicalBytes(record),key,bytes))
    throw Error("Independent signed exception register signature invalid: HOLD");
  const registerDigest=exceptionRegisterDigest(record);
  if(!externalPin||!SHA.test(externalPin.registerDigest||"")||
    !SHA.test(externalPin.headDigest||"")||
    !REF.test(externalPin.externalReference||"")||
    externalPin.registerDigest!==registerDigest||
    externalPin.headDigest!==record.headDigest||
    externalPin.sequence!==record.sequence)
    throw Error("Separate owner register digest/head/sequence pin required: HOLD");
  if(previousPin===null){
    if(record.sequence!==1||record.previousExceptionRegisterDigest!==null)
      throw Error("Unanchored external exception register genesis/rollback: HOLD");
  }else if(!SHA.test(previousPin.registerDigest||"")||
    !Number.isSafeInteger(previousPin.sequence)||previousPin.sequence<1||
    record.sequence!==previousPin.sequence+1||
    record.previousExceptionRegisterDigest!==previousPin.registerDigest)
    throw Error("External exception register revision missing or rolled back: HOLD");
  const verified=verifyOwnerExceptionHistory({
    continuity,receipts:ownerReceipts,ownerPublicKeyPem,
    pinnedOwnerFingerprint,pinnedRegisterFingerprint:pinnedSourceRegisterFingerprint,now
  });
  if(verified.status!=="OWNER_EXCEPTION_HISTORY_VERIFIED"||
    verified.decisions.length!==record.decisionCount||
    verified.headDigest!==record.headDigest)
    throw Error("Signed external exception register differs from owner receipt history: HOLD");
  for(let i=0;i<record.entries.length;i++){
    const expected=record.entries[i],actual=verified.decisions[i];
    if(expected.decisionDigest!==actual.receiptDigest||
       expected.action!==actual.action||
       expected.incidentRef!==actual.incidentRef||
       expected.ownerApprovalRef!==actual.ownerApprovalRef||
       expected.issuedAt!==actual.issuedAt||
       expected.sourceRegisterDigest!==actual.registerDigest)
      throw Error("Externally pinned owner exception history altered or incomplete: HOLD");
  }
  return {status:"EXTERNAL_EXCEPTION_REGISTER_VERIFIED",registerDigest,
    sequence:record.sequence,headDigest:record.headDigest,
    sourceRegisterDigest:record.sourceRegisterDigest,
    decisions:verified.decisions,issueNumber:record.issueNumber,
    issuedAt:record.issuedAt,record,externalReference:externalPin.externalReference,
    externalWritePerformed:false};
}
export function verifyExceptionRegisterHistory({revisions,continuityArguments,
  ownerReceipts,ownerPublicKeyPem,pinnedOwnerFingerprint,
  pinnedSourceRegisterFingerprint,pinnedExceptionSignerFingerprint,now=new Date()}){
  if(!Array.isArray(continuityArguments?.revisions)||
     continuityArguments.revisions.length<1||
     pinnedSourceRegisterFingerprint!==continuityArguments.revisions.at(-1).trustedFingerprint)
    throw Error("Independently pinned rotation register signer required: HOLD");
  const continuity=reviewExternalRegisterContinuity({...continuityArguments,now});
  if(!SHA.test(pinnedExceptionSignerFingerprint||"")||
     !Array.isArray(ownerReceipts)||ownerReceipts.length>MAX)
    throw Error("Independent exception signer pin and complete signed owner receipts required: HOLD");
  if(!Array.isArray(revisions)||revisions.length<1||revisions.length>MAX)
    throw Error("Complete bounded exception-register history required: HOLD");
  let last=null,prevRecord=null,lastIssued=-Infinity;const checked=[];
  for(const revision of revisions){
    if(revision?.pinnedSignerFingerprint!==pinnedExceptionSignerFingerprint)
      throw Error("Exception register signing identity drift requires independent owner review: HOLD");
    const prefixCount=revision?.signedRegister?.register?.decisionCount;
    const result=verifyExceptionRegisterRevision({
      revision,previousPin:last?{registerDigest:last.registerDigest,sequence:last.sequence}:null,
      continuity,ownerReceipts:ownerReceipts.slice(0,prefixCount),
      ownerPublicKeyPem,pinnedOwnerFingerprint,
      pinnedSourceRegisterFingerprint,now});
    const issued=time(result.issuedAt);
    if(issued<=lastIssued)throw Error("Externally pinned exception register timestamp rollback: HOLD");
    if(prevRecord){
      if(result.record.decisionCount<prevRecord.decisionCount)
        throw Error("Owner exception register history truncated: HOLD");
      for(let i=0;i<prevRecord.entries.length;i++){
        if(Buffer.compare(canonicalBytes(prevRecord.entries[i]),
             canonicalBytes(result.record.entries[i]))!==0)
          throw Error("Historical owner exception was rewritten: HOLD");
      }
    }
    checked.push({sequence:result.sequence,registerDigest:result.registerDigest,
      headDigest:result.headDigest,decisionCount:result.decisions.length,
      externalReference:result.externalReference});
    last=result;prevRecord=result.record;lastIssued=issued;
  }
  return {status:"EXTERNAL_EXCEPTION_HISTORY_VERIFIED",latest:last,
    revisions:checked,externalWritePerformed:false};
}
export function ownerEscalationLedger({history,now=new Date(),reviewAfterDays=7}){
  if(history?.status!=="EXTERNAL_EXCEPTION_HISTORY_VERIFIED"||
    !Array.isArray(history.latest?.decisions)||
    !Number.isInteger(reviewAfterDays)||reviewAfterDays<1||reviewAfterDays>365)
    throw Error("Verified external exception history and valid review policy required: HOLD");
  const timestamp=new Date(now).getTime();
  if(!Number.isFinite(timestamp))throw Error("Current owner review clock unavailable: HOLD");
  const records=new Map();
  for(const e of history.latest.decisions){
    const previous=records.get(e.incidentRef);
    if(previous&&time(e.issuedAt)<=time(previous.lastDecisionAt))
      throw Error("Owner exception history out of order: HOLD");
    const prior=previous||{incidentRef:e.incidentRef,firstDecisionAt:e.issuedAt,count:0};
    records.set(e.incidentRef,{...prior,count:prior.count+1,
      action:e.action,lastDecisionAt:e.issuedAt,lastApprovalRef:e.ownerApprovalRef});
  }
  const rows=[...records.values()].map(r=>{
    const ageDays=Math.max(0,Math.floor((timestamp-time(r.lastDecisionAt))/DAY));
    return {...r,ageDays,reviewStatus:ageDays>=reviewAfterDays?
      "OWNER_ESCALATION_REVIEW_DUE":
      r.action==="DEFER_FOLLOWUP"?"OWNER_FOLLOWUP_DEFERRED":"OWNER_REVIEW_OPEN",
      auditHoldCleared:false};
  }).sort((a,b)=>a.incidentRef.localeCompare(b.incidentRef));
  return {status:"READ_ONLY_ESCALATION_LEDGER",rows,
    registerDigest:history.latest.registerDigest,
    sourceRegisterDigest:history.latest.sourceRegisterDigest,
    ownerReviewRequired:rows.some(r=>r.reviewStatus==="OWNER_ESCALATION_REVIEW_DUE"),
    automaticClosure:false,automaticEscalation:false,externalWritePerformed:false};
}
