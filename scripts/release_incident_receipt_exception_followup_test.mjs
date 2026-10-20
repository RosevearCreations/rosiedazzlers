import assert from "node:assert/strict";
import {generateKeyPairSync,createHash} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyOwnerHandoffReviewRegister}
 from "./release_incident_export_receipt_reconciliation.mjs";
import {receiptFollowUpEvidenceClaims,verifyReceiptFollowUpEvidence,
 ownerReceiptReconciliationClaims,verifyManualReceiptReconciliationRegister,
 receiptExceptionFollowUpWorkbench}
 from "./release_incident_receipt_exception_followup.mjs";
import {build595Fixture} from "./release_incident_export_receipt_reconciliation_test.mjs";
const {args,owner,recipient,impostor,pem,fp,signature,now}=build595Fixture;
const investigator=generateKeyPairSync("ed25519");
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const register=await verifyOwnerHandoffReviewRegister(args);
assert.equal(register.status,"INDEPENDENT_OWNER_HANDOFF_REVIEW_REGISTER_VERIFIED");
assert.equal(register.issueNumber,77);
assert.equal(register.incidentRef,"issue:77");
const evidenceClaims=receiptFollowUpEvidenceClaims({
 verifiedRegister:register,investigationRef:"independent-reviewer:case-596",
 evidenceRef:"outside-owner-store:596-observation",
 finding:"DISCREPANCY_OBSERVED",observedAt:"2026-10-20T09:58:00.000Z"
});
const evidenceReceipt=signature(evidenceClaims,investigator);
const evidenceArguments={registerArguments:args,evidenceReceipt,
 investigatorPublicKeyPem:pem(investigator),
 pinnedInvestigatorFingerprint:fp(investigator),now};
const evidence=await verifyReceiptFollowUpEvidence(evidenceArguments);
assert.equal(evidence.status,"INDEPENDENT_RECEIPT_FOLLOWUP_EVIDENCE_VERIFIED");
assert.equal(evidence.exportDigest,register.exportDigest);
assert.equal(evidence.evidenceReceiptDigest,digest(evidenceReceipt));
assert.equal(evidence.auditHoldCleared,false);
const firstClaim=ownerReceiptReconciliationClaims({verifiedEvidence:evidence,
 sequence:1,action:"ACKNOWLEDGE_EVIDENCE",
 ownerDecisionRef:"owner:receipt-596-review-1",
 issuedAt:"2026-10-20T09:59:00.000Z"});
const first=signature(firstClaim,owner),firstHash=digest(first);
const secondClaim=ownerReceiptReconciliationClaims({verifiedEvidence:evidence,
 sequence:2,action:"ESCALATE_FOR_MANUAL_REVIEW",
 ownerDecisionRef:"owner:receipt-596-escalate-2",
 issuedAt:"2026-10-20T09:59:30.000Z",
 previousDecisionDigest:firstHash});
const second=signature(secondClaim,owner),head=digest(second);
const pin={headDigest:head,receiptCount:2,
 evidenceReceiptDigest:evidence.evidenceReceiptDigest,
 exportDigest:evidence.exportDigest,
 ownerReviewHeadDigest:evidence.ownerReviewHeadDigest,
 externalReference:"owner-offline:followup-head-596"};
const params={evidenceArguments,decisionReceipts:[first,second],
 ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 independentFollowUpHeadPin:pin,now};
const verified=await verifyManualReceiptReconciliationRegister(params);
assert.equal(verified.status,"INDEPENDENT_MANUAL_RECEIPT_RECONCILIATION_VERIFIED");
assert.equal(verified.decisionHeadDigest,head);
assert.equal(verified.decisions.length,2);
assert.equal(verified.pendingManualReview,true);
assert.equal(verified.auditHoldCleared,false);
assert.equal(verified.automaticClosure,false);
assert.equal(verified.externalWritePerformed,false);
const workbench=await receiptExceptionFollowUpWorkbench(params);
assert.equal(workbench.status,"READ_ONLY_RECEIPT_EXCEPTION_FOLLOWUP_WORKBENCH");
assert.equal(workbench.recipientFinding,"DISCREPANCY_OBSERVED");
assert.equal(workbench.latestOwnerAction,"ESCALATE_FOR_MANUAL_REVIEW");
assert.equal(workbench.nextStep,"MANUAL_OWNER_FOLLOWUP_REVIEW");
assert.equal(workbench.liveExceptionStatus,"UNCHANGED");
const failEvidence=changes=>assert.rejects(
 verifyReceiptFollowUpEvidence({...evidenceArguments,...changes}));
await failEvidence({pinnedInvestigatorFingerprint:fp(owner)});
await failEvidence({pinnedInvestigatorFingerprint:fp(recipient)});
await failEvidence({investigatorPublicKeyPem:pem(impostor)});
await failEvidence({evidenceReceipt:signature(evidenceClaims,impostor)});
await failEvidence({evidenceReceipt:{...evidenceReceipt,claims:{
 ...evidenceClaims,evidenceRef:"other:evidence"}}});
await failEvidence({evidenceReceipt:signature({...evidenceClaims,
 observedAt:"2026-10-20T09:55:00.000Z"},investigator)});
await failEvidence({evidenceReceipt:signature({...evidenceClaims,
 observedAt:"2026-10-20T10:30:00.000Z"},investigator)});
await failEvidence({registerArguments:{...args,independentRegisterHeadPin:null}});
await failEvidence({registerArguments:{...args,reconciliationArguments:{
 ...args.reconciliationArguments,handoffArguments:{
 ...args.reconciliationArguments.handoffArguments,independentExportPin:null}}}});
const failRegister=change=>assert.rejects(
 verifyManualReceiptReconciliationRegister({...params,...change}));
await failRegister({decisionReceipts:[second]});
await failRegister({decisionReceipts:[first]});
await failRegister({decisionReceipts:[first,first]});
await failRegister({decisionReceipts:[first,signature(secondClaim,impostor)]});
await failRegister({decisionReceipts:[first,{...second,claims:{
 ...secondClaim,action:"DEFER_FOLLOWUP_REVIEW"}}]});
await failRegister({independentFollowUpHeadPin:null});
await failRegister({independentFollowUpHeadPin:{...pin,headDigest:"f".repeat(64)}});
await failRegister({independentFollowUpHeadPin:{...pin,receiptCount:1}});
await failRegister({independentFollowUpHeadPin:{...pin,exportDigest:"f".repeat(64)}});
await failRegister({ownerPublicKeyPem:pem(impostor)});
await failRegister({pinnedOwnerFingerprint:fp(impostor)});
assert.throws(()=>receiptFollowUpEvidenceClaims({verifiedRegister:register,
 investigationRef:"review:596",evidenceRef:"external:596",
 finding:"CLOSE_EXCEPTION",observedAt:"2026-10-20T09:58:00.000Z"}),/HOLD/);
assert.throws(()=>ownerReceiptReconciliationClaims({verifiedEvidence:evidence,
 sequence:1,action:"CLEAR_AUDIT_HOLD",ownerDecisionRef:"owner:unsafe",
 issuedAt:"2026-10-20T09:59:00.000Z"}),/HOLD/);
assert.equal(JSON.stringify(workbench).includes("signature"),false);
console.log("Build 596 independent receipt follow-up signer, pinned manual reconciliation and no-close workbench PASS");

// Build 597 synthetic signed owner follow-up fixture, never live keys or approvals.
export const build596Fixture={params,owner,investigator,impostor,pem,fp,signature,now};
