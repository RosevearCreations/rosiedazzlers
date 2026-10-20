import assert from "node:assert/strict";
import {createHash,sign} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build602Fixture} from "./release_incident_owner_handoff_reconciliation_test.mjs";
import {verifyExceptionReconciliation} from "./release_incident_owner_handoff_reconciliation.mjs";
import {historyClaims,verifyPinnedReconciliationHistory,ownerManualDecisionContinuity} from "./release_incident_reconciliation_history.mjs";
const {payload,reviewer,owner,pem,fp,now}=build602Fixture;
const verified=await verifyExceptionReconciliation(payload);
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const signed=(claims,key)=>({algorithm:"Ed25519",claims,signature:sign(null,canonicalBytes(claims),key.privateKey).toString("base64")});
const claim=historyClaims({verified,sequence:1,action:"ESCALATE_OWNER_DECISION",reviewRef:"review:history-603",issuedAt:"2026-10-20T10:00:07.000Z"});
const receipt=signed(claim,reviewer);
const pin={headDigest:hash(receipt),receiptCount:1,reconciliationReceiptDigest:verified.receiptDigest,
 handoffReceiptDigest:verified.handoffReceiptDigest,issueNumber:verified.issueNumber,externalReference:"independent:history-603"};
const hargs={reconciliationArguments:payload,historyReceipts:[receipt],
 reviewerPublicKeyPem:pem(reviewer),pinnedReviewerFingerprint:fp(reviewer),independentHistoryPin:pin,now};
const history=await verifyPinnedReconciliationHistory(hargs);
assert.equal(history.auditHoldCleared,false);
const ownerClaims={schema:"rosie.reconciliation-owner-decision.v1",repository:"RosevearCreations/rosiedazzlers",
 issueNumber:history.issueNumber,incidentRef:history.incidentRef,historyHeadDigest:history.historyHeadDigest,
 reconciliationReceiptDigest:history.reconciliationReceiptDigest,
 action:"ESCALATE_MANUAL_EXCEPTION",ownerReviewRef:"owner:decision-603",issuedAt:"2026-10-20T10:00:08.000Z"};
const ownerReceipt=signed(ownerClaims,owner);
const pinOwner={receiptDigest:hash(ownerReceipt),historyHeadDigest:history.historyHeadDigest,
 issueNumber:history.issueNumber,externalReference:"independent:owner-603"};
const dargs={historyArguments:hargs,ownerDecisionReceipt:ownerReceipt,
 ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),independentOwnerDecisionPin:pinOwner,now};
const result=await ownerManualDecisionContinuity(dargs);
assert.equal(result.status,"OWNER_MANUAL_RECONCILIATION_DECISION_VERIFIED");
assert.equal(result.automaticClosure,false);
await assert.rejects(verifyPinnedReconciliationHistory({...hargs,historyReceipts:[receipt,receipt]}));
await assert.rejects(verifyPinnedReconciliationHistory({...hargs,independentHistoryPin:{...pin,headDigest:"f".repeat(64)}}));
await assert.rejects(verifyPinnedReconciliationHistory({...hargs,reconciliationArguments:{...payload,independentReconciliationPin:null}}));
await assert.rejects(ownerManualDecisionContinuity({...dargs,ownerDecisionReceipt:{...ownerReceipt,claims:{...ownerClaims,action:"CLOSE_EXCEPTION"}}}));
await assert.rejects(ownerManualDecisionContinuity({...dargs,independentOwnerDecisionPin:null}));
console.log("Build 603 signed pinned history and manual owner decision PASS");
