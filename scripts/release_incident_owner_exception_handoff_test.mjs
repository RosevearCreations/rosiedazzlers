import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build600Fixture} from "./release_incident_recipient_acknowledgement_ledger_test.mjs";
import {verifyOwnerManualFollowUpContinuity} from "./release_incident_recipient_acknowledgement_ledger.mjs";
import {ownerExceptionHandoffClaims,verifyOwnerExceptionReviewHandoff} from "./release_incident_owner_exception_handoff.mjs";
const {ownerArgs,owner,pem,fp,signature,impostor,now}=build600Fixture;
const v=await verifyOwnerManualFollowUpContinuity(ownerArgs);
const claims=ownerExceptionHandoffClaims({continuity:v,action:"ESCALATE_INDEPENDENT_REVIEW",
 reviewRef:"owner:exception-601",handoffRef:"owner:handoff-601",
 issuedAt:"2026-10-20T10:00:05.000Z"});
const receipt=signature(claims,owner);
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const pin={receiptDigest:digest(receipt),exportDigest:v.exportDigest,
 recipientLedgerHeadDigest:v.recipientLedgerHeadDigest,
 ownerFollowUpHeadDigest:v.ownerFollowUpHeadDigest,
 issueNumber:v.issueNumber,handoffRef:claims.handoffRef,
 externalReference:"independent:owner-handoff-601"};
const args={ownerFollowUpArguments:ownerArgs,handoffReceipt:receipt,
 ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 independentHandoffPin:pin,now};
const result=await verifyOwnerExceptionReviewHandoff(args);
assert.equal(result.status,"OWNER_EXCEPTION_REVIEW_HANDOFF_VERIFIED");
assert.equal(result.auditHoldCleared,false);
assert.equal(result.automaticClosure,false);
assert.equal(result.externalWritePerformed,false);
assert.equal(JSON.stringify(result).includes('"signature"'),false);
const fails=change=>assert.rejects(verifyOwnerExceptionReviewHandoff({...args,...change}),/HOLD|invalid|signature|fingerprint/);
await fails({handoffReceipt:{...receipt,claims:{...claims,action:"REVIEW_EXCEPTION_EVIDENCE"}}});
await fails({handoffReceipt:signature(claims,impostor)});
await fails({independentHandoffPin:{...pin,receiptDigest:"f".repeat(64)}});
await fails({independentHandoffPin:null});
await fails({ownerPublicKeyPem:pem(impostor)});
await fails({ownerFollowUpArguments:{...ownerArgs,independentOwnerFollowUpPin:null}});
await fails({handoffReceipt:signature({...claims,issuedAt:"2026-10-20T10:00:01.000Z"},owner)});
assert.throws(()=>ownerExceptionHandoffClaims({...{continuity:v},
 action:"CLOSE_AUDIT_HOLD",reviewRef:"owner:unsafe",handoffRef:"owner:unsafe",
 issuedAt:"2026-10-20T10:00:05.000Z"}),/HOLD/);
console.log("Build 601 independently signed manual exception review handoff PASS");

// Build 602 verified synthetic owner handoff fixture.
export const build601Fixture={args,owner,pem,fp,impostor,now};
