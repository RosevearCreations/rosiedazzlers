import assert from "node:assert/strict";
import {createHash,sign} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build606Fixture} from "./release_incident_retention_followup_test.mjs";
import {verifyIndependentRetentionFollowUp} from "./release_incident_retention_followup.mjs";
import {manualOwnerFollowUpClaims,verifyManualOwnerFollowUpDecision} from "./release_incident_owner_retention_decision.mjs";
const {args,owner,pem,fp,now}=build606Fixture;
const verified=await verifyIndependentRetentionFollowUp(args);
const claims=manualOwnerFollowUpClaims({verified,action:"REQUEST_OWNER_EVIDENCE_RECHECK",
 decisionRef:"owner:decision-607",issuedAt:"2026-10-20T10:00:13.000Z"});
const receipt={algorithm:"Ed25519",claims,signature:sign(null,canonicalBytes(claims),owner.privateKey).toString("base64")};
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const pin={receiptDigest:hash(receipt),followUpReceiptDigest:verified.followUpReceiptDigest,
 ownerAcceptanceDigest:verified.ownerAcceptanceDigest,newHead:verified.newHead,
 issueNumber:verified.issueNumber,externalReference:"independent:owner-decision-607"};
const params={followUpArguments:args,ownerDecisionReceipt:receipt,ownerPublicKeyPem:pem(owner),
 pinnedOwnerFingerprint:fp(owner),independentOwnerDecisionPin:pin,now};
const result=await verifyManualOwnerFollowUpDecision(params);
assert.equal(result.auditHoldCleared,false);
assert.equal(result.automaticClosure,false);
assert.equal(result.externalWritePerformed,false);
const fails=change=>assert.rejects(verifyManualOwnerFollowUpDecision({...params,...change}));
await fails({independentOwnerDecisionPin:null});
await fails({independentOwnerDecisionPin:{...pin,newHead:"f".repeat(64)}});
await fails({ownerDecisionReceipt:{...receipt,claims:{...claims,action:"CLOSE_EXCEPTION"}}});
await fails({ownerDecisionReceipt:{...receipt,signature:"AAAA"}});
await fails({followUpArguments:{...args,independentFollowUpPin:null}});
assert.throws(()=>manualOwnerFollowUpClaims({verified,action:"CLOSE_EXCEPTION",
 decisionRef:"owner:unsafe",issuedAt:claims.issuedAt}),/HOLD/);
console.log("Build 607 signed manual owner decision continuity PASS");
