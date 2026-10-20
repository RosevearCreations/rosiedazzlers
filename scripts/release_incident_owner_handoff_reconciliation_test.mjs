import assert from "node:assert/strict";
import {createHash,generateKeyPairSync,sign} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build601Fixture} from "./release_incident_owner_exception_handoff_test.mjs";
import {verifyOwnerExceptionReviewHandoff} from "./release_incident_owner_exception_handoff.mjs";
import {exceptionReconciliationClaims,verifyExceptionReconciliation} from "./release_incident_owner_handoff_reconciliation.mjs";
const {args,owner,pem,fp,impostor,now}=build601Fixture;
const upstream=await verifyOwnerExceptionReviewHandoff(args);
const reviewer=generateKeyPairSync("ed25519");
const claims=exceptionReconciliationClaims({verifiedHandoff:upstream,
 action:"REQUEST_MANUAL_RECHECK",reviewRef:"independent:review-602",
 issuedAt:"2026-10-20T10:00:06.000Z"});
const signature=x=>({algorithm:"Ed25519",claims:x,signature:sign(null,canonicalBytes(x),reviewer.privateKey).toString("base64")});
const receipt=signature(claims);
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const pin={receiptDigest:hash(receipt),handoffReceiptDigest:upstream.handoffReceiptDigest,
 ownerFollowUpHeadDigest:upstream.ownerFollowUpHeadDigest,exportDigest:upstream.exportDigest,
 issueNumber:upstream.issueNumber,reviewRef:claims.reviewRef,externalReference:"independent:pin-602"};
const payload={handoffArguments:args,reconciliationReceipt:receipt,
 reviewerPublicKeyPem:pem(reviewer),pinnedReviewerFingerprint:fp(reviewer),
 independentReconciliationPin:pin,now};
const result=await verifyExceptionReconciliation(payload);
assert.equal(result.status,"INDEPENDENT_OWNER_HANDOFF_EXCEPTION_RECONCILED_FOR_MANUAL_REVIEW");
assert.equal(result.auditHoldCleared,false);
assert.equal(result.automaticClosure,false);
assert.equal(result.externalWritePerformed,false);
const fail=delta=>assert.rejects(verifyExceptionReconciliation({...payload,...delta}));
await fail({reconciliationReceipt:{...receipt,claims:{...claims,action:"ACKNOWLEDGE_EXCEPTION_HANDOFF"}}});
await fail({reconciliationReceipt:{...receipt,signature:"AAAA"}});
await fail({reconciliationReceipt:signature({...claims,issuedAt:"2026-10-20T10:00:04.000Z"})});
await fail({independentReconciliationPin:null});
await fail({independentReconciliationPin:{...pin,receiptDigest:"f".repeat(64)}});
await fail({reviewerPublicKeyPem:pem(impostor)});
await fail({pinnedReviewerFingerprint:fp(owner)});
await fail({handoffArguments:{...args,independentHandoffPin:null}});
assert.throws(()=>exceptionReconciliationClaims({verifiedHandoff:upstream,
 action:"CLOSE_EXCEPTION",reviewRef:"owner:unsafe",issuedAt:claims.issuedAt}),/HOLD/);
console.log("Build 602 independent signed owner handoff exception reconciliation PASS");
