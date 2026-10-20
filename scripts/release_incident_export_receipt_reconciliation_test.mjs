import assert from "node:assert/strict";
import {createHash,generateKeyPairSync} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyManualCloseoutEvidenceHandoff}
 from "./release_incident_manual_closeout_evidence_export.mjs";
import {recipientExportReceiptClaims,verifyExportRecipientReconciliation,
 ownerReceiptReviewClaims,verifyOwnerHandoffReviewRegister,
 ownerHandoffReviewRegisterWorkbench} from "./release_incident_export_receipt_reconciliation.mjs";
import {build594Fixture} from "./release_incident_manual_closeout_evidence_export_test.mjs";
const {inputs,owner,impostor,pem,fp,signature,now}=build594Fixture;
const recipient=generateKeyPairSync("ed25519");
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const ownerHandoff=await verifyManualCloseoutEvidenceHandoff(inputs);
assert.equal(ownerHandoff.status,"SIGNED_MANUAL_EVIDENCE_HANDOFF_READY");
const claims=recipientExportReceiptClaims({handoff:ownerHandoff,
 receiptRef:"independent-receiver:ack-595",
 disposition:"RECEIVED_FOR_REVIEW",
 receivedAt:"2026-10-20T09:52:00.000Z"});
const signedAck=signature(claims,recipient);
const reconciliationArguments={handoffArguments:inputs,
 recipientReceipt:signedAck,recipientPublicKeyPem:pem(recipient),
 pinnedRecipientFingerprint:fp(recipient),now};
const rec=await verifyExportRecipientReconciliation(reconciliationArguments);
assert.equal(rec.status,"INDEPENDENT_EXPORT_RECEIPT_RECONCILED");
assert.equal(rec.exportDigest,ownerHandoff.exportDigest);
assert.equal(rec.ownerHandoffDigest,ownerHandoff.ownerHandoffDigest);
assert.equal(rec.recipientReceiptDigest,digest(signedAck));
assert.equal(rec.auditHoldCleared,false);
const one=ownerReceiptReviewClaims({reconciled:rec,sequence:1,
 action:"ACKNOWLEDGE_RECEIPT",ownerReviewRef:"owner:receipt-595-a",
 issuedAt:"2026-10-20T09:55:00.000Z"});
const r1=signature(one,owner);
const two=ownerReceiptReviewClaims({reconciled:rec,sequence:2,
 action:"REQUEST_MANUAL_RECHECK",ownerReviewRef:"owner:receipt-595-b",
 issuedAt:"2026-10-20T09:57:00.000Z",previousRegisterDigest:digest(r1)});
const r2=signature(two,owner);
const pin={headDigest:digest(r2),receiptCount:2,
 exportDigest:rec.exportDigest,recipientReceiptDigest:rec.recipientReceiptDigest,
 recipientRef:rec.recipientRef,externalReference:"owner-external:review-head-595"};
const args={reconciliationArguments,ownerPublicKeyPem:pem(owner),
 pinnedOwnerFingerprint:fp(owner),revisions:[r1,r2],
 independentRegisterHeadPin:pin,now};
const ledger=await verifyOwnerHandoffReviewRegister(args);
assert.equal(ledger.status,"INDEPENDENT_OWNER_HANDOFF_REVIEW_REGISTER_VERIFIED");
assert.equal(ledger.entries.length,2);
assert.equal(ledger.liveExceptionStatus,"UNCHANGED");
assert.equal(ledger.automaticDelivery,false);
const workbench=await ownerHandoffReviewRegisterWorkbench(args);
assert.equal(workbench.status,"READ_ONLY_OWNER_HANDOFF_REVIEW_REGISTER");
assert.equal(workbench.latestOwnerAction,"REQUEST_MANUAL_RECHECK");
assert.equal(workbench.nextStep,"MANUAL_OWNER_EXCEPTION_REVIEW");
assert.equal(workbench.auditHoldCleared,false);
const badReconciliation=async change=>verifyExportRecipientReconciliation({
 ...reconciliationArguments,...change});
await assert.rejects(badReconciliation({pinnedRecipientFingerprint:fp(owner)}),/differ/);
await assert.rejects(badReconciliation({recipientPublicKeyPem:pem(impostor)}),/fingerprint/);
await assert.rejects(badReconciliation({recipientReceipt:signature(claims,impostor)}),/signature/);
await assert.rejects(badReconciliation({recipientReceipt:{...signedAck,
 claims:{...claims,recipientRef:"wrong-destination"}}}),/provenance/);
await assert.rejects(badReconciliation({recipientReceipt:{...signedAck,
 claims:{...claims,exportDigest:"f".repeat(64)}}}),/provenance/);
await assert.rejects(badReconciliation({recipientReceipt:signature({...claims,
 receivedAt:"2026-10-20T09:47:00.000Z"},recipient)}),/predates/);
await assert.rejects(badReconciliation({recipientReceipt:signature({...claims,
 receivedAt:"2026-10-20T11:00:00.000Z"},recipient)}),/future/);
await assert.rejects(badReconciliation({handoffArguments:{
 ...inputs,independentExportPin:null}}),/pin missing/);
const badRegister=async change=>verifyOwnerHandoffReviewRegister({...args,...change});
await assert.rejects(badRegister({revisions:[r2]}),/provenance|predecessor/);
await assert.rejects(badRegister({revisions:[r1]}),/register head/);
await assert.rejects(badRegister({revisions:[r1,r1]}),/provenance|replay|rollback/);
await assert.rejects(badRegister({revisions:[r1,signature(two,impostor)]}),/signature/);
await assert.rejects(badRegister({revisions:[r1,{...r2,claims:{...two,action:"DEFER_HANDOFF_REVIEW"}}]}),/signature/);
await assert.rejects(badRegister({independentRegisterHeadPin:null}),/register head/);
await assert.rejects(badRegister({independentRegisterHeadPin:{...pin,headDigest:"f".repeat(64)}}),/register head/);
await assert.rejects(badRegister({independentRegisterHeadPin:{...pin,receiptCount:1}}),/register head/);
await assert.rejects(badRegister({independentRegisterHeadPin:{...pin,recipientRef:"other"}}),/register head/);
await assert.rejects(badRegister({ownerPublicKeyPem:pem(impostor)}),/fingerprint/);
await assert.rejects(badRegister({pinnedOwnerFingerprint:fp(impostor)}),/signer roots/);
assert.throws(()=>recipientExportReceiptClaims({handoff:ownerHandoff,
 receiptRef:"recipient:bad",disposition:"RELEASE_TO_PRODUCTION",
 receivedAt:"2026-10-20T09:52:00.000Z"}),/HOLD/);
assert.throws(()=>ownerReceiptReviewClaims({reconciled:rec,sequence:1,
 action:"CLOSE_EXCEPTION",ownerReviewRef:"owner:bad",
 issuedAt:"2026-10-20T09:55:00.000Z"}),/HOLD/);
assert.equal(JSON.stringify(workbench).includes("signature"),false);
console.log("Build 595 recipient signed export reconciliation, independently pinned owner review history, replay HOLD and no-close workbench PASS");

// Build 596 reuses synthetic independently signed recipient/owner register evidence.
export const build595Fixture={args,owner,recipient,impostor,pem,fp,signature,now};
