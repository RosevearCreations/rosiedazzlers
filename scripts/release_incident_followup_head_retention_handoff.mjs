/** Build 597 — manual-only immutable follow-up decision-head retention and
 * signed owner reconciliation handoff. Source-level contract; no provider is
 * configured here. Always replays Build 596 signed source and exact WORM readback.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyManualReceiptReconciliationRegister}
  from "./release_incident_receipt_exception_followup.mjs";
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const KEY=/^[A-Za-z0-9][A-Za-z0-9._/-]{2,180}$/;
const MAX=100,DAY=86400000;
const HANDOFF_ACTIONS=new Set(["REQUEST_MANUAL_RECONCILIATION",
  "ACKNOWLEDGE_OPEN_EXCEPTION","DEFER_MANUAL_REVIEW"]);
const HANDOFF_FIELDS=["schema","repository","issueNumber","incidentRef","objectKey",
  "versionId","recordDigest","followUpHeadDigest","evidenceReceiptDigest","exportDigest",
  "action","owner","handoffRef","issuedAt","previousHandoffDigest"];
const digest=v=>createHash("sha256").update(canonicalBytes(v)).digest("hex");
function utc(s){
  if(typeof s!=="string"||!Number.isFinite(Date.parse(s))||
      new Date(s).toISOString()!==s)
    throw Error("Canonical UTC timestamp required: HOLD");
  return Date.parse(s);
}
function requireAdapter(adapter){
  if(!adapter||adapter.capabilities?.immutableCreate!==true||
     adapter.capabilities?.retentionLock!==true||
     adapter.capabilities?.independentTrustRoot!==true||
     typeof adapter.readVersioned!=="function"||
     typeof adapter.retentionEvidence!=="function"||
     typeof adapter.createOnce!=="function")
    throw Error("Independently administered exact-version WORM adapter required: HOLD");
}
function lockEvidence(lock,objectKey,versionId,now,minimumDays=0){
  const retainUntil=Date.parse(lock?.retainUntil||"");
  if(lock?.key!==objectKey||lock?.versionId!==versionId||
     lock?.mode!=="COMPLIANCE"||!Number.isFinite(retainUntil)||
     retainUntil<new Date(now).getTime()+minimumDays*DAY-(minimumDays?60000:0))
    throw Error("Exact COMPLIANCE-locked follow-up head version absent or expired: HOLD");
  return new Date(retainUntil).toISOString();
}
function independentOwnerPublicKey(pem,fingerprint){
  if(typeof pem!=="string"||pem.length>8192||!SHA.test(fingerprint||""))
    throw Error("Independently pinned owner Ed25519 signer required: HOLD");
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519"||
     createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")!==fingerprint)
    throw Error("Owner follow-up handoff signing-key trust mismatch: HOLD");
  return key;
}
export async function prepareFollowUpRetentionEnvelope({reconciliationArguments,
  issuedAt,now=new Date()}){
  if(!reconciliationArguments||typeof reconciliationArguments!=="object")
    throw Error("Complete signed owner reconciliation source required: HOLD");
  const verified=await verifyManualReceiptReconciliationRegister({
    ...reconciliationArguments,now});
  const issued=utc(issuedAt),clock=new Date(now).getTime();
  if(!Number.isFinite(clock)||issued>clock+300000||
     issued<utc(verified.decisions.at(-1).issuedAt))
    throw Error("Owner head retention cannot predate final signed decision: HOLD");
  const ownerFingerprint=reconciliationArguments.pinnedOwnerFingerprint;
  if(!SHA.test(ownerFingerprint||"")||
     ownerFingerprint!==reconciliationArguments.evidenceArguments?.registerArguments?.pinnedOwnerFingerprint)
    throw Error("Retained owner key fingerprint differs from verified reconciliation signer: HOLD");
  const payload={schema:"rosie.receipt-followup-head-retention.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
    exportDigest:verified.exportDigest,
    evidenceReceiptDigest:verified.evidenceReceiptDigest,
    followUpHeadDigest:verified.decisionHeadDigest,
    decisionCount:verified.decisions.length,
    ownerSignerFingerprint:ownerFingerprint,
    independentFollowUpRef:verified.externalReference,
    latestOwnerDecisionAt:verified.decisions.at(-1).issuedAt,
    issuedAt};
  if(!Number.isSafeInteger(payload.issueNumber)||payload.issueNumber<1||
     !REF.test(payload.incidentRef||"")||
     !REF.test(payload.independentFollowUpRef||"")||
     !SHA.test(payload.exportDigest||"")||
     !SHA.test(payload.evidenceReceiptDigest||"")||
     !SHA.test(payload.followUpHeadDigest||"")||
     !Number.isInteger(payload.decisionCount)||payload.decisionCount<1||
     payload.decisionCount>MAX)
    throw Error("Incomplete independently pinned follow-up head: HOLD");
  return {payload,contentDigest:digest(payload)};
}
export function authorizeManualFollowUpRetention({authorization,envelope}){
  if(authorization?.event!=="workflow_dispatch"||
     authorization.actor!=="RosevearCreations"||
     authorization.confirmed!==true||
     !REF.test(authorization.approvalRef||"")||
     authorization.expectedContentDigest!==envelope.contentDigest||
     authorization.expectedFollowUpHeadDigest!==envelope.payload.followUpHeadDigest||
     authorization.trustedOwnerFingerprint!==envelope.payload.ownerSignerFingerprint)
    throw Error("Explicit owner manual immutable retention authorization missing: HOLD");
  return true;
}
/** This is deliberately not attached to a production route or cron. WORM
 * creation can be irreversible and may incur a charge; only a separately
 * authorized operator can pass an adapter and exact signed source proof.
 */
export async function retainManualFollowUpHead({reconciliationArguments,issuedAt,
  adapter,objectKey,authorization,minRetentionDays=30,now=new Date()}){
  if(!KEY.test(objectKey||"")||
     !Number.isInteger(minRetentionDays)||minRetentionDays<30||minRetentionDays>3650)
    throw Error("Approved immutable object key or duration invalid: HOLD");
  const envelope=await prepareFollowUpRetentionEnvelope({reconciliationArguments,issuedAt,now});
  authorizeManualFollowUpRetention({authorization,envelope});
  requireAdapter(adapter);
  if(typeof adapter.ensureReady==="function")await adapter.ensureReady();
  const created=await adapter.createOnce(objectKey,envelope);
  if(created?.created!==true||typeof created.versionId!=="string"||
     !created.versionId||created.versionId==="null")
    throw Error("Unique retained follow-up record version not confirmed: HOLD");
  const [lock,stored]=await Promise.all([
    adapter.retentionEvidence(objectKey,created.versionId),
    adapter.readVersioned(objectKey,created.versionId)]);
  const retainUntil=lockEvidence(lock,objectKey,created.versionId,now,minRetentionDays);
  if(digest(stored)!==digest(envelope)||
     stored?.contentDigest!==envelope.contentDigest)
    throw Error("New WORM follow-up head readback content mismatch: HOLD");
  return {status:"WORM_FOLLOWUP_HEAD_EXTERNAL_PIN_PENDING",
    objectKey,versionId:created.versionId,
    recordDigest:digest(envelope),
    followUpHeadDigest:envelope.payload.followUpHeadDigest,
    evidenceReceiptDigest:envelope.payload.evidenceReceiptDigest,
    exportDigest:envelope.payload.exportDigest,retainedUntil:retainUntil,
    requiresIndependentExternalPin:true,automaticClosure:false};
}
/** To claim independent retention, the exact version/digest must be pinned by
 * an independent owner register AFTER creation. Never trust GitHub head alone.
 */
export async function verifyIndependentlyRetainedFollowUpHead({reconciliationArguments,
  issuedAt,adapter,independentObjectPin,now=new Date()}){
  const envelope=await prepareFollowUpRetentionEnvelope({reconciliationArguments,issuedAt,now});
  const pin=independentObjectPin;
  if(!pin||!KEY.test(pin.objectKey||"")||
     typeof pin.versionId!=="string"||!pin.versionId||pin.versionId==="null"||
     pin.recordDigest!==digest(envelope)||
     pin.followUpHeadDigest!==envelope.payload.followUpHeadDigest||
     pin.evidenceReceiptDigest!==envelope.payload.evidenceReceiptDigest||
     pin.exportDigest!==envelope.payload.exportDigest||
     !REF.test(pin.externalReference||""))
    throw Error("Separately pinned exact follow-up version and digests required: HOLD");
  requireAdapter(adapter);
  const [lock,stored]=await Promise.all([
    adapter.retentionEvidence(pin.objectKey,pin.versionId),
    adapter.readVersioned(pin.objectKey,pin.versionId)]);
  const retainedUntil=lockEvidence(lock,pin.objectKey,pin.versionId,now);
  if(digest(stored)!==pin.recordDigest||
     stored?.contentDigest!==envelope.contentDigest)
    throw Error("Exact independently retained follow-up record does not match: HOLD");
  return {status:"INDEPENDENTLY_PINNED_FOLLOWUP_HEAD_RETAINED",
    objectKey:pin.objectKey,versionId:pin.versionId,
    issueNumber:envelope.payload.issueNumber,
    incidentRef:envelope.payload.incidentRef,
    recordDigest:pin.recordDigest,
    followUpHeadDigest:pin.followUpHeadDigest,
    evidenceReceiptDigest:pin.evidenceReceiptDigest,
    exportDigest:pin.exportDigest,
    ownerSignerFingerprint:envelope.payload.ownerSignerFingerprint,
    independentEvidenceRef:pin.externalReference,retainedUntil,
    auditHoldCleared:false,automaticClosure:false,externalWritePerformed:false};
}
export function manualFollowUpHandoffClaims({retained,action,handoffRef,
  issuedAt,previousHandoffDigest=null}){
  if(retained?.status!=="INDEPENDENTLY_PINNED_FOLLOWUP_HEAD_RETAINED"||
     !Number.isSafeInteger(retained.issueNumber)||retained.issueNumber<1||
     !REF.test(retained.incidentRef||"")||
     !SHA.test(retained.recordDigest||"")||
     !SHA.test(retained.followUpHeadDigest||"")||
     !SHA.test(retained.evidenceReceiptDigest||"")||
     !SHA.test(retained.exportDigest||"")||
     !HANDOFF_ACTIONS.has(action)||!REF.test(handoffRef||"")||
     !(previousHandoffDigest===null||SHA.test(previousHandoffDigest||"")))
    throw Error("Independent immutable follow-up and safe manual handoff required: HOLD");
  utc(issuedAt);
  return {schema:"rosie.manual-followup-reconciliation-handoff.v1",
    repository:"RosevearCreations/rosiedazzlers",
    issueNumber:retained.issueNumber,incidentRef:retained.incidentRef,
    objectKey:retained.objectKey,versionId:retained.versionId,
    recordDigest:retained.recordDigest,
    followUpHeadDigest:retained.followUpHeadDigest,
    evidenceReceiptDigest:retained.evidenceReceiptDigest,
    exportDigest:retained.exportDigest,
    action,owner:"RosevearCreations",handoffRef,
    issuedAt,previousHandoffDigest};
}
export async function verifyManualFollowUpHandoff({retentionVerification,
  ownerPublicKeyPem,pinnedOwnerFingerprint,receipts,independentHandoffHeadPin,
  now=new Date()}){
  // No accepting a caller's "VERIFIED" flag: replay all signatures, independent
  // reconciliation head, exact WORM version, retention expiry and outside pins.
  const retained=await verifyIndependentlyRetainedFollowUpHead({
    ...retentionVerification,now});
  if(!Array.isArray(receipts)||receipts.length<1||receipts.length>MAX||
     pinnedOwnerFingerprint!==retained.ownerSignerFingerprint)
    throw Error("Complete manual owner handoff and source owner signer required: HOLD");
  const ownerKey=independentOwnerPublicKey(ownerPublicKeyPem,pinnedOwnerFingerprint);
  const current=new Date(now).getTime();let prior=null,lastAt=0;
  for(const receipt of receipts){
    const c=receipt?.claims;
    const expected=manualFollowUpHandoffClaims({retained,action:c?.action,
      handoffRef:c?.handoffRef,issuedAt:c?.issuedAt,previousHandoffDigest:prior});
    if(receipt.algorithm!=="Ed25519"||!c||typeof receipt.signature!=="string"||
       !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature)||
       Object.keys(c).sort().join(",")!==HANDOFF_FIELDS.slice().sort().join(",")||
       HANDOFF_FIELDS.some(f=>c[f]!==expected[f]))
      throw Error("Changed, incomplete or unlinked owner follow-up handoff receipt: HOLD");
    const when=utc(c.issuedAt),signature=Buffer.from(receipt.signature,"base64");
    if(when<=lastAt||when>current+300000)
      throw Error("Owner manual handoff timestamp replay/rollback/future: HOLD");
    if(signature.length!==64||!verify(null,canonicalBytes(expected),ownerKey,signature))
      throw Error("Owner signed follow-up reconciliation handoff signature invalid: HOLD");
    prior=digest(receipt);lastAt=when;
  }
  const pin=independentHandoffHeadPin;
  if(!pin||pin.headDigest!==prior||pin.receiptCount!==receipts.length||
     pin.recordDigest!==retained.recordDigest||
     pin.followUpHeadDigest!==retained.followUpHeadDigest||
     pin.issueNumber!==retained.issueNumber||
     !REF.test(pin.externalReference||""))
    throw Error("Separately controlled complete owner handoff receipt-head pin required: HOLD");
  return {status:"SIGNED_MANUAL_FOLLOWUP_HANDOFF_VERIFIED",
    issueNumber:retained.issueNumber,incidentRef:retained.incidentRef,
    retainedVersionId:retained.versionId,retainedObjectKey:retained.objectKey,
    recordDigest:retained.recordDigest,followUpHeadDigest:retained.followUpHeadDigest,
    handoffHeadDigest:prior,handoffCount:receipts.length,
    independentEvidenceRef:pin.externalReference,
    nextStep:"MANUAL_OWNER_RECONCILIATION",
    liveExceptionStatus:"UNCHANGED",auditHoldCleared:false,
    automaticClosure:false,automaticDelivery:false,externalWritePerformed:false};
}
