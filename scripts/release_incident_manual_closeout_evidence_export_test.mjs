import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build593Fixture} from "./release_incident_signed_closeout_decision_ledger_test.mjs";
import {prepareManualCloseoutEvidenceExport,manualEvidenceHandoffClaims,
 verifyManualCloseoutEvidenceHandoff,ownerEvidenceHandoffSummary}
 from "./release_incident_manual_closeout_evidence_export.mjs";
const {params,owner,impostor,pem,fp,signature,now}=build593Fixture;
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const createdAt="2026-10-20T09:45:00.000Z";
const exportPackage=await prepareManualCloseoutEvidenceExport({
 ledgerArguments:params,createdAt,now});
assert.equal(exportPackage.status,"READ_ONLY_EVIDENCE_EXPORT_PREPARED");
assert.equal(exportPackage.bundle.schema,"rosie.closeout-review-evidence-export.v1");
assert.equal(exportPackage.bundle.recordKind,"OWNER_REVIEW_NOT_EXCEPTION_CLOSE");
assert.equal(exportPackage.bundle.privacy,"METADATA_ONLY_NO_RAW_EVIDENCE_OR_CUSTOMER_DATA");
assert.equal(exportPackage.bundle.decisionCount,2);
assert.equal(exportPackage.bundle.decisions.at(-1).action,"REQUEST_MANUAL_HANDOFF");
assert.equal(exportPackage.bundle.liveExceptionStatus,"UNCHANGED");
assert.equal(exportPackage.bundle.auditHoldCleared,false);
assert.equal(exportPackage.exportDigest,hash(exportPackage.bundle));
assert.equal(exportPackage.externalWritePerformed,false);
assert.ok(!JSON.stringify(exportPackage).includes("privateKey"));
assert.ok(!JSON.stringify(exportPackage).includes("signature"));
assert.ok(!JSON.stringify(exportPackage).includes("email"));
const claims=manualEvidenceHandoffClaims({
 exportPackage,recipientRef:"independent-owner-reviewer:team-594",
 approvalRef:"owner:explicit-manual-export-594",
 issuedAt:"2026-10-20T09:50:00.000Z",
 expiresAt:"2026-10-21T09:50:00.000Z"
});
const receipt=signature(claims,owner),receiptDigest=hash(receipt);
const pin={exportDigest:exportPackage.exportDigest,ownerHandoffDigest:receiptDigest,
 decisionHeadDigest:exportPackage.decisionHeadDigest,
 recipientRef:claims.recipientRef,externalReference:"independent-owner-log:handoff-594"};
const inputs={ledgerArguments:params,createdAt,handoffReceipt:receipt,
 ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 independentExportPin:pin,now};
const verified=await verifyManualCloseoutEvidenceHandoff(inputs);
assert.equal(verified.status,"SIGNED_MANUAL_EVIDENCE_HANDOFF_READY");
assert.equal(verified.recipientRef,claims.recipientRef);
assert.equal(verified.manualTransferRequired,true);
assert.equal(verified.automaticDelivery,false);
assert.equal(verified.auditHoldCleared,false);
assert.equal(verified.externalWritePerformed,false);
const summary=await ownerEvidenceHandoffSummary(inputs);
assert.equal(summary.status,"READ_ONLY_OWNER_EVIDENCE_HANDOFF_SUMMARY");
assert.equal(summary.decisionCount,2);
assert.equal(summary.nextStep,"MANUAL_OWNER_TRANSFER_AND_REVIEW");
assert.equal(summary.auditHoldCleared,false);
const fails=async(changes,pattern)=>assert.rejects(
 verifyManualCloseoutEvidenceHandoff({...inputs,...changes}),pattern);
await fails({independentExportPin:null},/pin missing/);
await fails({independentExportPin:{...pin,exportDigest:"f".repeat(64)}},/pin missing/);
await fails({independentExportPin:{...pin,ownerHandoffDigest:"f".repeat(64)}},/pin missing/);
await fails({independentExportPin:{...pin,recipientRef:"another-reviewer"}},/pin missing/);
await fails({ownerPublicKeyPem:pem(impostor)},/fingerprint/);
await fails({pinnedOwnerFingerprint:fp(impostor)},/pinned/);
await fails({handoffReceipt:signature(claims,impostor)},/signature/);
await fails({handoffReceipt:{...receipt,claims:{...claims,recipientRef:"stranger"}}},/signature/);
await fails({handoffReceipt:{...receipt,claims:{...claims,exportDigest:"f".repeat(64)}}},/wrong export/);
await fails({now:new Date("2026-10-22T12:00:00.000Z")},/expired/);
await fails({createdAt:"2026-10-21T12:00:00.000Z"},/Current review/);
await fails({ledgerArguments:{...params,independentDecisionHeadPin:null}},/register head/);
await fails({ledgerArguments:{...params,closeoutArguments:{...params.closeoutArguments,
 rotationArguments:{...params.closeoutArguments.rotationArguments,
 independentRotationPin:null}}}},/rotation-register/);
await fails({ledgerArguments:{...params,closeoutArguments:{...params.closeoutArguments,
 resolutionReceipt:{...params.closeoutArguments.resolutionReceipt,
 signature:"A".repeat(86)+"=="}}}},/signature/);
assert.throws(()=>manualEvidenceHandoffClaims({...{
 exportPackage,recipientRef:"reviewer:1",approvalRef:"owner:1",
 issuedAt:"2026-10-20T09:50:00.000Z"},
 expiresAt:"2026-11-20T09:50:00.000Z"}),/bounded validity/);
assert.throws(()=>manualEvidenceHandoffClaims({
 exportPackage:{...exportPackage,exportDigest:"0".repeat(64)},
 recipientRef:"reviewer:1",approvalRef:"owner:1",
 issuedAt:"2026-10-20T09:50:00.000Z",expiresAt:"2026-10-21T09:50:00.000Z"}),/exact export/);
console.log("Build 594 bounded redacted owner closeout export, independent signed handoff, pin, expiry and no-write PASS");
