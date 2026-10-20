import assert from "node:assert/strict";
import {generateKeyPairSync,createHash,sign} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build604Fixture} from "./release_incident_owner_manual_rotation_retention_test.mjs";
import {verifyManualHeadRotationRetention} from "./release_incident_owner_manual_rotation_retention.mjs";
import {rotatedHeadReviewClaims,verifyRotatedHeadReceiptAndAcceptance} from "./release_incident_rotated_head_retention_acceptance.mjs";
const {args,owner,pem,fp,now}=build604Fixture;
const v=await verifyManualHeadRotationRetention(args),reviewer=generateKeyPairSync("ed25519");
const signReceipt=(claims,k)=>({algorithm:"Ed25519",claims,signature:sign(null,canonicalBytes(claims),k.privateKey).toString("base64")});
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const c=rotatedHeadReviewClaims({verified:v,action:"ACKNOWLEDGE_RETAINED_HEAD",
 reviewRef:"review:rotated-605",issuedAt:"2026-10-20T10:00:10.000Z"});
const receipt=signReceipt(c,reviewer);
const pin={receiptDigest:hash(receipt),newHead:v.newHead,rotationReceiptDigest:v.rotationReceiptDigest,
 issueNumber:v.issueNumber,externalReference:"review:pin-605"};
const oc={schema:"rosie.manual-owner-retention-acceptance.v1",
 repository:"RosevearCreations/rosiedazzlers",issueNumber:v.issueNumber,incidentRef:v.incidentRef,
 newHead:v.newHead,rotationReceiptDigest:v.rotationReceiptDigest,reviewReceiptDigest:hash(receipt),
 action:"ACCEPT_RETENTION_FOR_MANUAL_REVIEW",acceptanceRef:"owner:accept-605",issuedAt:"2026-10-20T10:00:11.000Z"};
const ownerReceipt=signReceipt(oc,owner);
const ownerPin={receiptDigest:hash(ownerReceipt),reviewReceiptDigest:hash(receipt),newHead:v.newHead,
 issueNumber:v.issueNumber,externalReference:"owner:retention-pin-605"};
const payload={rotationArguments:args,reviewerReceipt:receipt,reviewerPublicKeyPem:pem(reviewer),
 pinnedReviewerFingerprint:fp(reviewer),independentReviewPin:pin,
 ownerAcceptanceReceipt:ownerReceipt,ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 independentOwnerAcceptancePin:ownerPin,now};
const result=await verifyRotatedHeadReceiptAndAcceptance(payload);
assert.equal(result.auditHoldCleared,false);
assert.equal(result.automaticClosure,false);
assert.equal(result.externalWritePerformed,false);
const fail=delta=>assert.rejects(verifyRotatedHeadReceiptAndAcceptance({...payload,...delta}));
await fail({reviewerReceipt:{...receipt,claims:{...c,action:"DISPUTE_RETAINED_HEAD"}}});
await fail({independentReviewPin:null});
await fail({independentOwnerAcceptancePin:{...ownerPin,newHead:"f".repeat(64)}});
await fail({pinnedReviewerFingerprint:fp(owner)});
await fail({rotationArguments:{...args,independentRetentionPin:null}});
await fail({ownerAcceptanceReceipt:{...ownerReceipt,claims:{...oc,action:"CLOSE_EXCEPTION"}}});
console.log("Build 605 independent rotated receipt review and manual owner retention PASS");

// Build 606 synthetic end-to-end independently signed retention evidence fixture.
export const build605Fixture={payload,pem,fp,owner,now};
