import assert from "node:assert/strict";
import {createHash,generateKeyPairSync} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build598Fixture} from "./release_incident_followup_handoff_review_test.mjs";
import {prepareOwnerHandoffDecisionExport,ownerDecisionExportHandoffClaims,
 independentExportReviewReceiptClaims,verifyOwnerDecisionExportFollowUp,
 ownerExportFollowUpWorkbench} from "./release_incident_owner_handoff_decision_export.mjs";
const {params,owner,reviewer,impostor,pem,fp,signature,now}=build598Fixture;
const recipient=generateKeyPairSync("ed25519");
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const createdAt="2026-10-20T09:59:58.000Z";
const prepared=await prepareOwnerHandoffDecisionExport({governanceArguments:params,createdAt,now});
assert.equal(prepared.status,"OWNER_HANDOFF_DECISION_EXPORT_PREPARED");
assert.equal(prepared.payload.recordKind,"MANUAL_REVIEW_NOT_OPERATIONAL_CLOSEOUT");
assert.equal(prepared.payload.privacy,"METADATA_ONLY_NO_RAW_SIGNATURES_OR_CUSTOMER_DATA");
assert.equal(prepared.payload.decisionCount,2);
assert.equal(prepared.payload.decisions.at(-1).action,"ESCALATE_MANUAL_EXCEPTION_REVIEW");
assert.equal(prepared.payload.auditHoldCleared,false);
assert.equal(prepared.exportDigest,digest(prepared.payload));
assert.equal(prepared.externalWritePerformed,false);
assert.equal(JSON.stringify(prepared).includes("privateKey"),false);
assert.equal(JSON.stringify(prepared).includes('"signature"'),false);
const claims=ownerDecisionExportHandoffClaims({prepared,
 recipientRef:"independent-reviewer:team-599",
 approvalRef:"owner:decision-export-599",
 issuedAt:"2026-10-20T09:59:59.000Z",
 expiresAt:"2026-10-21T09:59:59.000Z"});
const ownerReceipt=signature(claims,owner),ownerDigest=digest(ownerReceipt);
const reviewClaims=independentExportReviewReceiptClaims({prepared,
 ownerHandoffDigest:ownerDigest,recipientRef:claims.recipientRef,
 ackRef:"independent-reviewer:receipt-599",disposition:"RECEIVED_FOR_MANUAL_REVIEW",
 receivedAt:"2026-10-20T10:00:00.000Z"});
const recipientReceipt=signature(reviewClaims,recipient),receiptDigest=digest(recipientReceipt);
const independentExportHeadPin={exportDigest:prepared.exportDigest,
 governanceHeadDigest:prepared.governanceHeadDigest,
 ownerHandoffDigest:ownerDigest,recipientReceiptDigest:receiptDigest,
 recipientRef:claims.recipientRef,externalReference:"external-owner-log:review-head-599"};
const args={governanceArguments:params,createdAt,
 ownerHandoffReceipt:ownerReceipt,ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 recipientReceipt,recipientPublicKeyPem:pem(recipient),pinnedRecipientFingerprint:fp(recipient),
 independentExportHeadPin,now};
const verified=await verifyOwnerDecisionExportFollowUp(args);
assert.equal(verified.status,"INDEPENDENT_OWNER_DECISION_EXPORT_FOLLOWUP_VERIFIED");
assert.equal(verified.recipientReceiptDigest,receiptDigest);
assert.equal(verified.auditHoldCleared,false);
assert.equal(verified.automaticDelivery,false);
assert.equal(verified.manualTransferRequired,true);
const workbench=await ownerExportFollowUpWorkbench(args);
assert.equal(workbench.status,"READ_ONLY_OWNER_DECISION_EXPORT_FOLLOWUP");
assert.equal(workbench.latestOwnerDecision,"ESCALATE_MANUAL_EXCEPTION_REVIEW");
assert.equal(workbench.nextStep,"MANUAL_OWNER_REVIEW_AND_TRANSFER");
assert.equal(workbench.liveExceptionStatus,"UNCHANGED");
assert.equal(JSON.stringify(workbench).includes('"signature"'),false);
const fails=x=>assert.rejects(verifyOwnerDecisionExportFollowUp({...args,...x}));
await fails({ownerPublicKeyPem:pem(impostor)});
await fails({pinnedOwnerFingerprint:fp(impostor)});
await fails({recipientPublicKeyPem:pem(impostor)});
await fails({pinnedRecipientFingerprint:fp(owner)});
await fails({pinnedRecipientFingerprint:fp(reviewer)});
await fails({ownerHandoffReceipt:signature(claims,impostor)});
await fails({recipientReceipt:signature(reviewClaims,impostor)});
await fails({ownerHandoffReceipt:{...ownerReceipt,claims:{...claims,recipientRef:"another:recipient"}}});
await fails({recipientReceipt:{...recipientReceipt,claims:{...reviewClaims,exportDigest:"f".repeat(64)}}});
await fails({recipientReceipt:{...recipientReceipt,claims:{...reviewClaims,recipientRef:"another:recipient"}}});
await fails({independentExportHeadPin:null});
await fails({independentExportHeadPin:{...independentExportHeadPin,exportDigest:"e".repeat(64)}});
await fails({independentExportHeadPin:{...independentExportHeadPin,recipientReceiptDigest:"e".repeat(64)}});
await fails({independentExportHeadPin:{...independentExportHeadPin,recipientRef:"other:reviewer"}});
await fails({recipientReceipt:signature({...reviewClaims,receivedAt:"2026-10-20T09:59:58.000Z"},recipient)});
await fails({recipientReceipt:signature({...reviewClaims,receivedAt:"2026-10-20T10:30:00.000Z"},recipient)});
await fails({now:new Date("2026-10-22T12:00:00.000Z")});
await fails({governanceArguments:{...params,independentGovernanceHeadPin:null}});
await fails({governanceArguments:{...params,reviewArguments:{
  ...params.reviewArguments,independentReviewReceiptPin:null}}});
await fails({governanceArguments:{...params,reviewArguments:{
  ...params.reviewArguments,handoffArguments:{
    ...params.reviewArguments.handoffArguments,independentHandoffHeadPin:null}}}});
assert.throws(()=>ownerDecisionExportHandoffClaims({prepared,
 recipientRef:"reviewer:1",approvalRef:"owner:1",issuedAt:"2026-10-20T09:59:59.000Z",
 expiresAt:"2026-11-20T09:59:59.000Z"}),/duration/);
assert.throws(()=>ownerDecisionExportHandoffClaims({prepared:{...prepared,exportDigest:"0".repeat(64)},
 recipientRef:"reviewer:1",approvalRef:"owner:1",issuedAt:"2026-10-20T09:59:59.000Z",
 expiresAt:"2026-10-21T09:59:59.000Z"}),/HOLD/);
assert.throws(()=>independentExportReviewReceiptClaims({prepared,ownerHandoffDigest:ownerDigest,
 recipientRef:claims.recipientRef,ackRef:"test:1",disposition:"CLOSE_AUDIT_HOLD",
 receivedAt:"2026-10-20T10:00:00.000Z"}),/HOLD/);
console.log("Build 599 metadata decision export, independent owner/recipient signatures, pin and no-close review PASS");
