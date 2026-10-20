/** Build 604: manual owner follow-up head rotation and independent retention.
 * Reverify all Build603 upstream signatures/pins; no live record mutation.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {ownerManualDecisionContinuity} from "./release_incident_reconciliation_history.mjs";
const SHA=/^[a-f0-9]{64}$/,REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
export function manualRotationClaims({verified,previousHead,newHead,rotationRef,issuedAt}){
 if(verified?.status!=="OWNER_MANUAL_RECONCILIATION_DECISION_VERIFIED"||
 verified.auditHoldCleared!==false||verified.automaticClosure!==false||
 !SHA.test(verified.ownerDecisionDigest||"")||!SHA.test(verified.historyHeadDigest||"")||
 previousHead!==verified.ownerDecisionDigest||!SHA.test(newHead||"")||
 newHead===previousHead||!REF.test(rotationRef||"")||
 !Number.isSafeInteger(verified.issueNumber)||verified.issueNumber<1||
 !REF.test(verified.incidentRef||"")||
 typeof issuedAt!=="string"||!Number.isFinite(Date.parse(issuedAt))||
 new Date(issuedAt).toISOString()!==issuedAt)
 throw Error("Bounded owner manual rotation evidence required: HOLD");
 return {schema:"rosie.owner-manual-head-rotation.v1",repository:"RosevearCreations/rosiedazzlers",
 issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
 historyHeadDigest:verified.historyHeadDigest,previousHead,newHead,rotationRef,issuedAt};
}
export async function verifyManualHeadRotationRetention({ownerDecisionArguments,rotationReceipt,
 ownerPublicKeyPem,pinnedOwnerFingerprint,independentRotationPin,
 independentRetentionPin,now=new Date()}){
 if(!ownerDecisionArguments||!rotationReceipt||
 pinnedOwnerFingerprint!==ownerDecisionArguments.pinnedOwnerFingerprint||
 !SHA.test(pinnedOwnerFingerprint||""))throw Error("Pinned owner rotation root required: HOLD");
 const verified=await ownerManualDecisionContinuity({...ownerDecisionArguments,now});
 const incoming=rotationReceipt.claims;
 const expected=manualRotationClaims({verified,previousHead:incoming?.previousHead,
 newHead:incoming?.newHead,rotationRef:incoming?.rotationRef,issuedAt:incoming?.issuedAt});
 if(!incoming||Object.keys(incoming).sort().join()!==Object.keys(expected).sort().join()||
 Object.keys(expected).some(k=>incoming[k]!==expected[k])||
 rotationReceipt.algorithm!=="Ed25519"||typeof rotationReceipt.signature!=="string"||
 !/^[A-Za-z0-9+/]+={0,2}$/.test(rotationReceipt.signature)||
 typeof ownerPublicKeyPem!=="string"||ownerPublicKeyPem.length>8192)
 throw Error("Signed owner rotation altered: HOLD");
 const key=createPublicKey(ownerPublicKeyPem);
 const signature=Buffer.from(rotationReceipt.signature,"base64");
 if(key.asymmetricKeyType!=="ed25519"||
 createHash("sha256").update(key.export({type:"spki",format:"der"})).digest("hex")!==pinnedOwnerFingerprint||
 signature.length!==64||!verify(null,canonicalBytes(expected),key,signature))
 throw Error("Rotation owner signature invalid: HOLD");
 const t=Date.parse(expected.issuedAt);
 const prior=Date.parse(ownerDecisionArguments.ownerDecisionReceipt.claims.issuedAt);
 if(!Number.isFinite(new Date(now).getTime())||t<=prior||t>new Date(now).getTime()+300000)
 throw Error("Rotation timestamp replay or future: HOLD");
 const receiptDigest=digest(rotationReceipt),p=independentRotationPin,r=independentRetentionPin;
 if(!p||p.receiptDigest!==receiptDigest||p.previousHead!==expected.previousHead||
 p.newHead!==expected.newHead||p.historyHeadDigest!==verified.historyHeadDigest||
 p.issueNumber!==verified.issueNumber||!REF.test(p.externalReference||"")||
 !r||r.retainedHead!==expected.newHead||r.rotationReceiptDigest!==receiptDigest||
 r.historyHeadDigest!==verified.historyHeadDigest||r.issueNumber!==verified.issueNumber||
 !REF.test(r.externalReference||"")||r.externalReference===p.externalReference)
 throw Error("Independent rotation and separately retained head pins required: HOLD");
 return {status:"OWNER_MANUAL_ROTATION_AND_RETENTION_VERIFIED",
 issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
 previousHead:expected.previousHead,newHead:expected.newHead,
 rotationReceiptDigest:receiptDigest,retentionExternalReference:r.externalReference,
 rotationExternalReference:p.externalReference,manualOwnerActionRequired:true,
 nextStep:"MANUAL_INDEPENDENT_REVIEW_OF_ROTATED_HEAD",auditHoldCleared:false,
 liveExceptionStatus:"UNCHANGED",automaticClosure:false,automaticDelivery:false,
 externalWritePerformed:false};
}
