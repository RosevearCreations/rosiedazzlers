/** Build 594 — independently reconciled, privacy-bounded manual closeout
 * evidence export & Ed25519 owner-approved handoff. Entirely read-only.
 * Never exports raw signed evidence, customer data, secrets, or creates live
 * owner approvals, storage records, closures, or automatic delivery.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyCloseoutDecisionLedger} from "./release_incident_signed_closeout_decision_ledger.mjs";
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const MAX=100;
const HANDOFF_FIELDS=["schema","repository","issueNumber","incidentRef",
  "exportDigest","decisionHeadDigest","sourceCloseoutReceiptDigest","recipientRef",
  "approvalRef","owner","issuedAt","expiresAt"];
const digest=v=>createHash("sha256").update(canonicalBytes(v)).digest("hex");
function canonicalTime(s){
  if(typeof s!=="string"||!Number.isFinite(Date.parse(s))||
     new Date(s).toISOString()!==s)throw Error("Canonical handoff timestamp required: HOLD");
  return Date.parse(s);
}
function exactFields(obj,fields){
  return obj!==null&&typeof obj==="object"&&!Array.isArray(obj)&&
    Object.keys(obj).sort().join(",")===fields.slice().sort().join(",");
}
function trustOwnerPublicKey(pem,pin){
  if(typeof pem!=="string"||pem.length>8192||!SHA.test(pin||""))
    throw Error("Separately pinned Ed25519 owner key required: HOLD");
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=="ed25519"||
     createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")!==pin)
    throw Error("Independent owner handoff key fingerprint mismatch: HOLD");
  return key;
}
function exportFromVerifiedLedger(ledger,issueNumber,createdAt){
  if(ledger?.status!=="SIGNED_OWNER_CLOSEOUT_LEDGER_VERIFIED"||
     ledger.auditHoldCleared!==false||ledger.automaticClosure!==false||
     !Number.isSafeInteger(issueNumber)||issueNumber<1||
     !SHA.test(ledger.headDigest||"")||
     !SHA.test(ledger.candidate?.rotationHeadDigest||"")||
     !SHA.test(ledger.candidate?.handoffHeadDigest||"")||
     !SHA.test(ledger.candidate?.auditorReceiptDigest||"")||
     !SHA.test(ledger.sourceCloseoutReceiptDigest||"")||
     !Array.isArray(ledger.rows)||ledger.rows.length<1||ledger.rows.length>MAX)
    throw Error("Verified complete owner decision history required for bounded export: HOLD");
  canonicalTime(createdAt);
  const rows=ledger.rows.map((r,i)=>{
    if(!["ACKNOWLEDGE_CANDIDATE","DEFER_REVIEW","REJECT_CANDIDATE",
      "REQUEST_MANUAL_HANDOFF"].includes(r.action)||
       !REF.test(r.decisionRef||"")||!SHA.test(r.receiptDigest||"")||
       r.incidentRef!==ledger.candidate.incidentRef)
      throw Error("Unsafe or altered owner decision metadata: HOLD");
    return {index:i+1,action:r.action,ownerDecisionRef:r.decisionRef,
      signedAt:r.issuedAt,receiptDigest:r.receiptDigest};
  });
  if(rows.at(-1).receiptDigest!==ledger.headDigest)
    throw Error("Decision export does not match independently pinned head: HOLD");
  return {schema:"rosie.closeout-review-evidence-export.v1",
    repository:"RosevearCreations/rosiedazzlers",issueNumber,
    incidentRef:ledger.candidate.incidentRef,
    createdAt,recordKind:"OWNER_REVIEW_NOT_EXCEPTION_CLOSE",
    evidenceDigests:{
      rotationHeadDigest:ledger.candidate.rotationHeadDigest,
      manualHandoffHeadDigest:ledger.candidate.handoffHeadDigest,
      independentAuditorReceiptDigest:ledger.candidate.auditorReceiptDigest,
      ownerCloseoutReceiptDigest:ledger.sourceCloseoutReceiptDigest,
      ownerDecisionHeadDigest:ledger.headDigest
    },
    externalOwnerDecisionRef:ledger.externalReference,
    decisionCount:rows.length,decisions:rows,
    privacy:"METADATA_ONLY_NO_RAW_EVIDENCE_OR_CUSTOMER_DATA",
    liveExceptionStatus:"UNCHANGED",auditHoldCleared:false,
    automaticClosure:false,manualOwnerReviewRequired:true};
}
/** Re-evaluates the entire Build 593 chain on every export. Does not accept
 * unverified ledger objects from a caller and never fetches from the network.
 */
export async function prepareManualCloseoutEvidenceExport({
  ledgerArguments,createdAt,now=new Date()
}){
  if(!ledgerArguments||typeof ledgerArguments!=="object"||
    !Number.isFinite(new Date(now).getTime())||
    canonicalTime(createdAt)>new Date(now).getTime()+300000)
    throw Error("Current review and canonical export time required: HOLD");
  const ledger=await verifyCloseoutDecisionLedger({...ledgerArguments,now});
  const sourceIssue=ledgerArguments.closeoutArguments?.ownerCloseoutReceipt?.claims?.issueNumber;
  const bundle=exportFromVerifiedLedger(ledger,sourceIssue,createdAt);
  const bytes=canonicalBytes(bundle);
  if(bytes.length>65536)throw Error("Closeout metadata export size cap exceeded: HOLD");
  return {status:"READ_ONLY_EVIDENCE_EXPORT_PREPARED",
    bundle,exportDigest:digest(bundle),
    decisionHeadDigest:ledger.headDigest,
    automaticDelivery:false,externalWritePerformed:false};
}
export function manualEvidenceHandoffClaims({
  exportPackage,recipientRef,approvalRef,issuedAt,expiresAt
}){
  const b=exportPackage?.bundle;
  if(exportPackage?.status!=="READ_ONLY_EVIDENCE_EXPORT_PREPARED"||
     !b||b.schema!=="rosie.closeout-review-evidence-export.v1"||
     b.liveExceptionStatus!=="UNCHANGED"||
     !SHA.test(exportPackage.exportDigest||"")||
     exportPackage.exportDigest!==digest(b)||
     exportPackage.decisionHeadDigest!==b.evidenceDigests?.ownerDecisionHeadDigest||
     !REF.test(recipientRef||"")||!REF.test(approvalRef||""))
    throw Error("Manually reviewed exact export, destination and approval required: HOLD");
  const at=canonicalTime(issuedAt),expires=canonicalTime(expiresAt);
  if(at<canonicalTime(b.createdAt)||expires<=at||expires-at>7*86400000)
    throw Error("Owner evidence handoff approval must have bounded validity: HOLD");
  return {schema:"rosie.manual-closeout-export-handoff.v1",
    repository:b.repository,issueNumber:b.issueNumber,incidentRef:b.incidentRef,
    exportDigest:exportPackage.exportDigest,
    decisionHeadDigest:exportPackage.decisionHeadDigest,
    sourceCloseoutReceiptDigest:b.evidenceDigests.ownerCloseoutReceiptDigest,
    recipientRef,approvalRef,owner:"RosevearCreations",issuedAt,expiresAt};
}
/** Never sends a file. This verifier produces a manually transferable, bounded,
 * redacted package only after signature and independent head pin validation.
 */
export async function verifyManualCloseoutEvidenceHandoff({
  ledgerArguments,createdAt,handoffReceipt,ownerPublicKeyPem,
  pinnedOwnerFingerprint,independentExportPin,now=new Date()
}){
  if(!SHA.test(pinnedOwnerFingerprint||"")||
     pinnedOwnerFingerprint!==ledgerArguments?.pinnedOwnerFingerprint)
    throw Error("Signed owner handoff must match independently pinned closeout owner identity: HOLD");
  const exportPackage=await prepareManualCloseoutEvidenceExport({
    ledgerArguments,createdAt,now});
  const claims=handoffReceipt?.claims;
  if(handoffReceipt?.algorithm!=="Ed25519"||!exactFields(claims,HANDOFF_FIELDS)||
     typeof handoffReceipt.signature!=="string"||
     !/^[A-Za-z0-9+/]+={0,2}$/.test(handoffReceipt.signature))
    throw Error("Complete owner-signed manual export receipt required: HOLD");
  const expected=manualEvidenceHandoffClaims({
    exportPackage,recipientRef:claims.recipientRef,approvalRef:claims.approvalRef,
    issuedAt:claims.issuedAt,expiresAt:claims.expiresAt});
  if(HANDOFF_FIELDS.some(f=>claims[f]!==expected[f]))
    throw Error("Signed manual handoff refers to wrong export or destination: HOLD");
  const clock=new Date(now).getTime();
  if(canonicalTime(claims.issuedAt)>clock+300000||
     canonicalTime(claims.expiresAt)<=clock)
    throw Error("Manual closeout export handoff expired or signed in future: HOLD");
  const key=trustOwnerPublicKey(ownerPublicKeyPem,pinnedOwnerFingerprint);
  const signed=Buffer.from(handoffReceipt.signature,"base64");
  if(signed.length!==64||!verify(null,canonicalBytes(expected),key,signed))
    throw Error("Owner evidence handoff signature invalid: HOLD");
  const receiptDigest=digest(handoffReceipt);
  if(!independentExportPin||
     independentExportPin.exportDigest!==exportPackage.exportDigest||
     independentExportPin.ownerHandoffDigest!==receiptDigest||
     independentExportPin.decisionHeadDigest!==exportPackage.decisionHeadDigest||
     independentExportPin.recipientRef!==expected.recipientRef||
     !REF.test(independentExportPin.externalReference||""))
    throw Error("Independently held exported evidence and signed handoff pin missing: HOLD");
  return {status:"SIGNED_MANUAL_EVIDENCE_HANDOFF_READY",
    package:exportPackage.bundle,exportDigest:exportPackage.exportDigest,
    ownerHandoffDigest:receiptDigest,recipientRef:expected.recipientRef,
    expiresAt:expected.expiresAt,
    independentEvidenceRef:independentExportPin.externalReference,
    manualTransferRequired:true,ownerReviewRequired:true,
    auditHoldCleared:false,automaticClosure:false,automaticDelivery:false,
    externalWritePerformed:false};
}
export async function ownerEvidenceHandoffSummary(args){
  const handoff=await verifyManualCloseoutEvidenceHandoff(args);
  return {status:"READ_ONLY_OWNER_EVIDENCE_HANDOFF_SUMMARY",
    incidentRef:handoff.package.incidentRef,
    recipientRef:handoff.recipientRef,
    decisionCount:handoff.package.decisionCount,
    latestOwnerAction:handoff.package.decisions.at(-1).action,
    exportDigest:handoff.exportDigest,
    independentEvidenceRef:handoff.independentEvidenceRef,
    expiresAt:handoff.expiresAt,
    nextStep:"MANUAL_OWNER_TRANSFER_AND_REVIEW",
    auditHoldCleared:false,automaticClosure:false,externalWritePerformed:false};
}
