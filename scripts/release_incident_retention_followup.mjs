/** Build 606: independent retention follow-up review, read-only.
 * All upstream signed receipts and independently held digest pins reverified.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyRotatedHeadReceiptAndAcceptance} from "./release_incident_rotated_head_retention_acceptance.mjs";
const sha=/^[a-f0-9]{64}$/,ref=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const actions=new Set(["ACKNOWLEDGE_MANUAL_RETENTION_REVIEW","REQUEST_INDEPENDENT_RECHECK","DEFER_MANUAL_FOLLOWUP","ESCALATE_OWNER_REVIEW"]);
export function retentionFollowUpClaims({verified,action,followUpRef,issuedAt}){
 if(verified?.status!=="ROTATED_HEAD_REVIEW_AND_MANUAL_OWNER_RETENTION_VERIFIED"||
 verified.auditHoldCleared!==false||verified.automaticClosure!==false||
 !sha.test(verified.newHead||"")||!sha.test(verified.ownerAcceptanceDigest||"")||
 !sha.test(verified.reviewReceiptDigest||"")||!Number.isSafeInteger(verified.issueNumber)||
 verified.issueNumber<1||!ref.test(verified.incidentRef||"")||
 !actions.has(action)||!ref.test(followUpRef||"")||
 typeof issuedAt!=="string"||!Number.isFinite(Date.parse(issuedAt))||
 new Date(issuedAt).toISOString()!==issuedAt)
 throw Error("Verified manual retention context required: HOLD");
 return {schema:"rosie.retention-followup-review.v1",repository:"RosevearCreations/rosiedazzlers",
 issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
 newHead:verified.newHead,reviewReceiptDigest:verified.reviewReceiptDigest,
 ownerAcceptanceDigest:verified.ownerAcceptanceDigest,action,followUpRef,issuedAt};
}
export async function verifyIndependentRetentionFollowUp({retentionArguments,followUpReceipt,
 independentReviewerPublicKeyPem,pinnedIndependentReviewerFingerprint,
 independentFollowUpPin,now=new Date()}){
 if(!retentionArguments||!followUpReceipt||!sha.test(pinnedIndependentReviewerFingerprint||"")||
 pinnedIndependentReviewerFingerprint===retentionArguments.pinnedOwnerFingerprint||
 !independentFollowUpPin||!ref.test(independentFollowUpPin.externalReference||""))
 throw Error("Independent retention review required: HOLD");
 const verified=await verifyRotatedHeadReceiptAndAcceptance({...retentionArguments,now});
 const c=followUpReceipt.claims;
 const expected=retentionFollowUpClaims({verified,action:c?.action,followUpRef:c?.followUpRef,issuedAt:c?.issuedAt});
 if(!c||Object.keys(c).sort().join()!==Object.keys(expected).sort().join()||
 Object.keys(expected).some(k=>c[k]!==expected[k])||
 followUpReceipt.algorithm!=="Ed25519"||typeof followUpReceipt.signature!=="string"||
 !/^[A-Za-z0-9+/]+={0,2}$/.test(followUpReceipt.signature)||
 typeof independentReviewerPublicKeyPem!=="string"||independentReviewerPublicKeyPem.length>8192)
 throw Error("Review claims altered: HOLD");
 const key=createPublicKey(independentReviewerPublicKeyPem);
 const sig=Buffer.from(followUpReceipt.signature,"base64");
 if(key.asymmetricKeyType!=="ed25519"||
 createHash("sha256").update(key.export({type:"spki",format:"der"})).digest("hex")!==pinnedIndependentReviewerFingerprint||
 sig.length!==64||!verify(null,canonicalBytes(expected),key,sig))
 throw Error("Review signer invalid: HOLD");
 const clock=new Date(now).getTime(),at=Date.parse(expected.issuedAt);
 if(!Number.isFinite(clock)||at<=Date.parse(retentionArguments.ownerAcceptanceReceipt.claims.issuedAt)||
 at>clock+300000)throw Error("Follow-up chronology invalid: HOLD");
 const d=hash(followUpReceipt);
 if(independentFollowUpPin.receiptDigest!==d||
 independentFollowUpPin.ownerAcceptanceDigest!==verified.ownerAcceptanceDigest||
 independentFollowUpPin.reviewReceiptDigest!==verified.reviewReceiptDigest||
 independentFollowUpPin.newHead!==verified.newHead||
 independentFollowUpPin.issueNumber!==verified.issueNumber)
 throw Error("Independent follow-up pin mismatch: HOLD");
 return {status:"INDEPENDENT_RETENTION_MANUAL_FOLLOWUP_VERIFIED",
 issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,action:expected.action,
 followUpRef:expected.followUpRef,followUpReceiptDigest:d,newHead:verified.newHead,
 ownerAcceptanceDigest:verified.ownerAcceptanceDigest,
 externalReference:independentFollowUpPin.externalReference,
 nextStep:"MANUAL_OWNER_REVIEW_REQUIRED",manualOwnerActionRequired:true,
 liveExceptionStatus:"UNCHANGED",auditHoldCleared:false,automaticClosure:false,
 automaticDelivery:false,externalWritePerformed:false};
}
