/** Build 605: independently signed rotated-head receipt and manual owner retention acceptance.
 * Read-only verification; every prior signature and pin is replayed.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyManualHeadRotationRetention} from "./release_incident_owner_manual_rotation_retention.mjs";
const SHA=/^[a-f0-9]{64}$/, REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
function time(x){return typeof x==="string"&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;}
function signed(receipt,claims,pem,fingerprint){
 if(!receipt||receipt.algorithm!=="Ed25519"||!receipt.claims||
 Object.keys(receipt.claims).sort().join()!==Object.keys(claims).sort().join()||
 Object.keys(claims).some(k=>receipt.claims[k]!==claims[k])||
 typeof receipt.signature!=="string"||!/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature)||
 typeof pem!=="string"||pem.length>8192||!SHA.test(fingerprint||""))throw Error("Signed review claims invalid: HOLD");
 const key=createPublicKey(pem),bytes=Buffer.from(receipt.signature,"base64");
 if(key.asymmetricKeyType!=="ed25519"||
 createHash("sha256").update(key.export({type:"spki",format:"der"})).digest("hex")!==fingerprint||
 bytes.length!==64||!verify(null,canonicalBytes(claims),key,bytes))
 throw Error("Independent signature invalid: HOLD");
}
export function rotatedHeadReviewClaims({verified,action,reviewRef,issuedAt}){
 if(verified?.status!=="OWNER_MANUAL_ROTATION_AND_RETENTION_VERIFIED"||
 verified.auditHoldCleared!==false||verified.automaticClosure!==false||
 !Number.isSafeInteger(verified.issueNumber)||verified.issueNumber<1||
 !REF.test(verified.incidentRef||"")||!SHA.test(verified.newHead||"")||
 !SHA.test(verified.rotationReceiptDigest||"")||
 !new Set(["ACKNOWLEDGE_RETAINED_HEAD","DISPUTE_RETAINED_HEAD","REQUEST_MANUAL_EVIDENCE_RECHECK"]).has(action)||
 !REF.test(reviewRef||"")||!time(issuedAt))throw Error("Verified independent rotated head review required: HOLD");
 return {schema:"rosie.rotated-head-receipt-review.v1",repository:"RosevearCreations/rosiedazzlers",
 issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
 newHead:verified.newHead,rotationReceiptDigest:verified.rotationReceiptDigest,
 action,reviewRef,issuedAt};
}
export async function verifyRotatedHeadReceiptAndAcceptance({rotationArguments,
 reviewerReceipt,reviewerPublicKeyPem,pinnedReviewerFingerprint,independentReviewPin,
 ownerAcceptanceReceipt,ownerPublicKeyPem,pinnedOwnerFingerprint,independentOwnerAcceptancePin,
 now=new Date()}){
 if(!rotationArguments||!SHA.test(pinnedReviewerFingerprint||"")||
 pinnedReviewerFingerprint===rotationArguments.pinnedOwnerFingerprint||
 pinnedOwnerFingerprint!==rotationArguments.pinnedOwnerFingerprint)
 throw Error("Distinct independently pinned reviewer/owner identities required: HOLD");
 const verified=await verifyManualHeadRotationRetention({...rotationArguments,now});
 const c=reviewerReceipt?.claims;
 const claims=rotatedHeadReviewClaims({verified,action:c?.action,reviewRef:c?.reviewRef,issuedAt:c?.issuedAt});
 signed(reviewerReceipt,claims,reviewerPublicKeyPem,pinnedReviewerFingerprint);
 const earliest=Date.parse(rotationArguments.rotationReceipt.claims.issuedAt),clock=new Date(now).getTime();
 if(!Number.isFinite(clock)||Date.parse(claims.issuedAt)<=earliest||Date.parse(claims.issuedAt)>clock+300000)
 throw Error("Independent reviewer chronology invalid: HOLD");
 const reviewDigest=digest(reviewerReceipt),pin=independentReviewPin;
 if(!pin||pin.receiptDigest!==reviewDigest||pin.newHead!==verified.newHead||
 pin.rotationReceiptDigest!==verified.rotationReceiptDigest||
 pin.issueNumber!==verified.issueNumber||!REF.test(pin.externalReference||""))
 throw Error("Independent rotated head review pin mismatch: HOLD");
 const o=ownerAcceptanceReceipt?.claims;
 if(!o||!new Set(["ACCEPT_RETENTION_FOR_MANUAL_REVIEW","REQUEST_RETENTION_RECHECK","DEFER_RETENTION_ACCEPTANCE"]).has(o.action)||
 !REF.test(o.acceptanceRef||"")||!time(o.issuedAt))
 throw Error("Explicit manual owner retention action required: HOLD");
 const expected={schema:"rosie.manual-owner-retention-acceptance.v1",
 repository:"RosevearCreations/rosiedazzlers",issueNumber:verified.issueNumber,
 incidentRef:verified.incidentRef,newHead:verified.newHead,
 rotationReceiptDigest:verified.rotationReceiptDigest,reviewReceiptDigest:reviewDigest,
 action:o.action,acceptanceRef:o.acceptanceRef,issuedAt:o.issuedAt};
 signed(ownerAcceptanceReceipt,expected,ownerPublicKeyPem,pinnedOwnerFingerprint);
 if(Date.parse(o.issuedAt)<=Date.parse(claims.issuedAt)||Date.parse(o.issuedAt)>clock+300000)
 throw Error("Manual owner retention chronology invalid: HOLD");
 const ownerDigest=digest(ownerAcceptanceReceipt),ownerPin=independentOwnerAcceptancePin;
 if(!ownerPin||ownerPin.receiptDigest!==ownerDigest||ownerPin.reviewReceiptDigest!==reviewDigest||
 ownerPin.newHead!==verified.newHead||ownerPin.issueNumber!==verified.issueNumber||
 !REF.test(ownerPin.externalReference||"")||ownerPin.externalReference===pin.externalReference)
 throw Error("Separately pinned owner retention acceptance missing: HOLD");
 return {status:"ROTATED_HEAD_REVIEW_AND_MANUAL_OWNER_RETENTION_VERIFIED",
 issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
 newHead:verified.newHead,reviewAction:claims.action,ownerAction:o.action,
 reviewReceiptDigest:reviewDigest,ownerAcceptanceDigest:ownerDigest,
 manualOwnerActionRequired:true,nextStep:"MANUAL_INDEPENDENT_RETENTION_REVIEW",
 auditHoldCleared:false,liveExceptionStatus:"UNCHANGED",automaticClosure:false,
 automaticDelivery:false,externalWritePerformed:false};
}
