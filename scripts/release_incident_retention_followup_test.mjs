import assert from "node:assert/strict";
import {createHash,generateKeyPairSync,sign} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build605Fixture} from "./release_incident_rotated_head_retention_acceptance_test.mjs";
import {verifyRotatedHeadReceiptAndAcceptance} from "./release_incident_rotated_head_retention_acceptance.mjs";
import {retentionFollowUpClaims,verifyIndependentRetentionFollowUp} from "./release_incident_retention_followup.mjs";
const {payload,pem,fp,owner,now}=build605Fixture;
const v=await verifyRotatedHeadReceiptAndAcceptance(payload);
const reviewer=generateKeyPairSync("ed25519");
const claims=retentionFollowUpClaims({verified:v,action:"REQUEST_INDEPENDENT_RECHECK",
 followUpRef:"independent:followup-606",issuedAt:"2026-10-20T10:00:12.000Z"});
const receipt={algorithm:"Ed25519",claims,signature:sign(null,canonicalBytes(claims),reviewer.privateKey).toString("base64")};
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const pin={receiptDigest:hash(receipt),ownerAcceptanceDigest:v.ownerAcceptanceDigest,
 reviewReceiptDigest:v.reviewReceiptDigest,newHead:v.newHead,issueNumber:v.issueNumber,
 externalReference:"independent:followup-pin-606"};
const args={retentionArguments:payload,followUpReceipt:receipt,
 independentReviewerPublicKeyPem:pem(reviewer),
 pinnedIndependentReviewerFingerprint:fp(reviewer),independentFollowUpPin:pin,now};
const result=await verifyIndependentRetentionFollowUp(args);
assert.equal(result.auditHoldCleared,false);
assert.equal(result.automaticClosure,false);
assert.equal(result.externalWritePerformed,false);
await assert.rejects(verifyIndependentRetentionFollowUp({...args,independentFollowUpPin:null}));
await assert.rejects(verifyIndependentRetentionFollowUp({...args,independentFollowUpPin:{...pin,newHead:"f".repeat(64)}}));
await assert.rejects(verifyIndependentRetentionFollowUp({...args,pinnedIndependentReviewerFingerprint:fp(owner)}));
await assert.rejects(verifyIndependentRetentionFollowUp({...args,followUpReceipt:{...receipt,claims:{...claims,action:"CLOSE_EXCEPTION"}}}));
await assert.rejects(verifyIndependentRetentionFollowUp({...args,retentionArguments:{...payload,independentOwnerAcceptancePin:null}}));
console.log("Build 606 independently pinned manual retention follow-up PASS");
