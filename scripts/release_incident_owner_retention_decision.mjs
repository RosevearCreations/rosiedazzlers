/** Build 607 — signed manual owner decision on verified independent retention follow-up.
 * Pure read-only verification. No closure, delivery, or live external writes.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyIndependentRetentionFollowUp} from "./release_incident_retention_followup.mjs";
const SHA=/^[a-f0-9]{64}$/, REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const allowed=new Set(["ACKNOWLEDGE_FOLLOWUP_FOR_MANUAL_REVIEW","REQUEST_OWNER_EVIDENCE_RECHECK","DEFER_OWNER_FOLLOWUP","ESCALATE_TO_INDEPENDENT_REVIEW"]);
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
export function manualOwnerFollowUpClaims({verified,action,decisionRef,issuedAt}){
 if(verified?.status!=="INDEPENDENT_RETENTION_MANUAL_FOLLOWUP_VERIFIED"||
 verified.auditHoldCleared!==false||verified.automaticClosure!==false||
 !Number.isSafeInteger(verified.issueNumber)||verified.issueNumber<1||
 !REF.test(verified.incidentRef||"")||!SHA.test(verified.newHead||"")||
 !SHA.test(verified.followUpReceiptDigest||"")||!SHA.test(verified.ownerAcceptanceDigest||"")||
 !allowed.has(action)||!REF.test(decisionRef||"")||
 typeof issuedAt!=="string"||!Number.isFinite(Date.parse(issuedAt))||
 new Date(issuedAt).toISOString()!==issuedAt)
 throw Error("Verified retained-head manual owner follow-up required: HOLD");
 return {schema:"rosie.manual-owner-retention-decision.v1",
 repository:"RosevearCreations/rosiedazzlers",issueNumber:verified.issueNumber,
 incidentRef:verified.incidentRef,newHead:verified.newHead,
 ownerAcceptanceDigest:verified.ownerAcceptanceDigest,
 followUpReceiptDigest:verified.followUpReceiptDigest,action,decisionRef,issuedAt};
}
export async function verifyManualOwnerFollowUpDecision({followUpArguments,ownerDecisionReceipt,
 ownerPublicKeyPem,pinnedOwnerFingerprint,independentOwnerDecisionPin,now=new Date()}){
 if(!followUpArguments||!ownerDecisionReceipt||
 pinnedOwnerFingerprint!==followUpArguments.retentionArguments?.pinnedOwnerFingerprint||
 !SHA.test(pinnedOwnerFingerprint||"")||!independentOwnerDecisionPin||
 !REF.test(independentOwnerDecisionPin.externalReference||""))
 throw Error("Independent owner decision root and receipt pin required: HOLD");
 const verified=await verifyIndependentRetentionFollowUp({...followUpArguments,now});
 const c=ownerDecisionReceipt.claims;
 const expected=manualOwnerFollowUpClaims({verified,action:c?.action,decisionRef:c?.decisionRef,issuedAt:c?.issuedAt});
 if(!c||Object.keys(c).sort().join()!==Object.keys(expected).sort().join()||
 Object.keys(expected).some(k=>c[k]!==expected[k])||
 ownerDecisionReceipt.algorithm!=="Ed25519"||
 typeof ownerDecisionReceipt.signature!=="string"||
 !/^[A-Za-z0-9+/]+={0,2}$/.test(ownerDecisionReceipt.signature)||
 typeof ownerPublicKeyPem!=="string"||ownerPublicKeyPem.length>8192)
 throw Error("Owner follow-up claim altered: HOLD");
 const key=createPublicKey(ownerPublicKeyPem),sig=Buffer.from(ownerDecisionReceipt.signature,"base64");
 if(key.asymmetricKeyType!=="ed25519"||
 createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")!==pinnedOwnerFingerprint||
 sig.length!==64||!verify(null,canonicalBytes(expected),key,sig))
 throw Error("Owner follow-up signature invalid: HOLD");
 const clock=new Date(now).getTime(),at=Date.parse(expected.issuedAt);
 if(!Number.isFinite(clock)||at<=Date.parse(followUpArguments.followUpReceipt.claims.issuedAt)||
 at>clock+300000)throw Error("Owner decision chronology invalid: HOLD");
 const receiptDigest=digest(ownerDecisionReceipt),pin=independentOwnerDecisionPin;
 if(pin.receiptDigest!==receiptDigest||pin.followUpReceiptDigest!==verified.followUpReceiptDigest||
 pin.ownerAcceptanceDigest!==verified.ownerAcceptanceDigest||
 pin.newHead!==verified.newHead||pin.issueNumber!==verified.issueNumber)
 throw Error("Independent owner decision pin mismatch: HOLD");
 return {status:"MANUAL_OWNER_RETENTION_FOLLOWUP_DECISION_VERIFIED",
 issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,action:expected.action,
 decisionRef:expected.decisionRef,newHead:verified.newHead,ownerDecisionDigest:receiptDigest,
 followUpReceiptDigest:verified.followUpReceiptDigest,
 externalReference:pin.externalReference,manualOwnerActionRequired:true,
 nextStep:"MANUAL_INDEPENDENT_OWNER_DECISION_REVIEW",liveExceptionStatus:"UNCHANGED",
 auditHoldCleared:false,automaticClosure:false,automaticDelivery:false,externalWritePerformed:false};
}
