import assert from "node:assert/strict";
import {createHash,sign} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build603Fixture} from "./release_incident_reconciliation_history_test.mjs";
import {ownerManualDecisionContinuity} from "./release_incident_reconciliation_history.mjs";
import {manualRotationClaims,verifyManualHeadRotationRetention} from "./release_incident_owner_manual_rotation_retention.mjs";
const {dargs,owner,pem,fp,now}=build603Fixture;
const verified=await ownerManualDecisionContinuity(dargs);
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const claims=manualRotationClaims({verified,previousHead:verified.ownerDecisionDigest,
 newHead:"a".repeat(64),rotationRef:"owner:rotation-604",issuedAt:"2026-10-20T10:00:09.000Z"});
const receipt={algorithm:"Ed25519",claims,signature:sign(null,canonicalBytes(claims),owner.privateKey).toString("base64")};
const pin={receiptDigest:hash(receipt),previousHead:claims.previousHead,newHead:claims.newHead,
 historyHeadDigest:verified.historyHeadDigest,issueNumber:verified.issueNumber,externalReference:"independent:rotation-604"};
const retention={retainedHead:claims.newHead,rotationReceiptDigest:hash(receipt),
 historyHeadDigest:verified.historyHeadDigest,issueNumber:verified.issueNumber,externalReference:"retention:owner-604"};
const args={ownerDecisionArguments:dargs,rotationReceipt:receipt,ownerPublicKeyPem:pem(owner),
 pinnedOwnerFingerprint:fp(owner),independentRotationPin:pin,independentRetentionPin:retention,now};
const result=await verifyManualHeadRotationRetention(args);
assert.equal(result.auditHoldCleared,false);
assert.equal(result.automaticClosure,false);
assert.equal(result.externalWritePerformed,false);
const fail=x=>assert.rejects(verifyManualHeadRotationRetention({...args,...x}));
await fail({rotationReceipt:{...receipt,claims:{...claims,newHead:"b".repeat(64)}}});
await fail({independentRotationPin:null});
await fail({independentRetentionPin:{...retention,retainedHead:"f".repeat(64)}});
await fail({independentRetentionPin:{...retention,externalReference:pin.externalReference}});
await fail({ownerDecisionArguments:{...dargs,independentOwnerDecisionPin:null}});
await fail({rotationReceipt:{...receipt,signature:"AAAA"}});
assert.throws(()=>manualRotationClaims({verified,previousHead:verified.ownerDecisionDigest,
 newHead:verified.ownerDecisionDigest,rotationRef:"owner:bad",issuedAt:claims.issuedAt}),/HOLD/);
console.log("Build 604 signed manual head rotation and independent retention PASS");
