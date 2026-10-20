import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyOwnerDecisionExportFollowUp}
  from "./release_incident_owner_handoff_decision_export.mjs";
import {recipientAcknowledgementClaims,verifyIndependentRecipientAcknowledgementLedger,
 ownerAcknowledgementFollowUpClaims,verifyOwnerManualFollowUpContinuity,
 ownerRecipientFollowUpWorkbench}
 from "./release_incident_recipient_acknowledgement_ledger.mjs";
import {build599Fixture}
 from "./release_incident_owner_handoff_decision_export_test.mjs";
const {args,owner,recipient,reviewer,impostor,pem,fp,signature,now}=build599Fixture;
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const verifiedExport=await verifyOwnerDecisionExportFollowUp(args);
assert.equal(verifiedExport.status,"INDEPENDENT_OWNER_DECISION_EXPORT_FOLLOWUP_VERIFIED");
const claim1=recipientAcknowledgementClaims({verifiedExport,sequence:1,
 action:"ACKNOWLEDGE_REVIEW_MATERIAL",recipientReviewRef:"recipient:decision-600-a",
 issuedAt:"2026-10-20T10:00:01.000Z"});
const receipt1=signature(claim1,recipient);
const claim2=recipientAcknowledgementClaims({verifiedExport,sequence:2,
 action:"REQUEST_ADDITIONAL_EVIDENCE",recipientReviewRef:"recipient:decision-600-b",
 issuedAt:"2026-10-20T10:00:02.000Z",previousReceiptDigest:hash(receipt1)});
const receipt2=signature(claim2,recipient);
const recipientPin={headDigest:hash(receipt2),receiptCount:2,
 exportDigest:verifiedExport.exportDigest,
 initialRecipientReceiptDigest:verifiedExport.recipientReceiptDigest,
 ownerHandoffDigest:verifiedExport.ownerHandoffDigest,
 recipientRef:verifiedExport.recipientRef,
 externalReference:"external-recipient:acknowledgement-head-600"};
const recipientArgs={exportArguments:args,recipientReviewReceipts:[receipt1,receipt2],
 recipientPublicKeyPem:pem(recipient),pinnedRecipientFingerprint:fp(recipient),
 independentRecipientLedgerPin:recipientPin,now};
const ledger=await verifyIndependentRecipientAcknowledgementLedger(recipientArgs);
assert.equal(ledger.status,"INDEPENDENT_RECIPIENT_ACKNOWLEDGEMENT_LEDGER_VERIFIED");
assert.equal(ledger.recipientDecisionHistory.length,2);
assert.equal(ledger.recipientLedgerHeadDigest,hash(receipt2));
assert.equal(ledger.auditHoldCleared,false);
assert.equal(ledger.automaticClosure,false);
const claim3=ownerAcknowledgementFollowUpClaims({ledger,sequence:1,
 action:"ACKNOWLEDGE_RECIPIENT_REVIEW",ownerReviewRef:"owner:recipient-600-a",
 issuedAt:"2026-10-20T10:00:03.000Z"});
const receipt3=signature(claim3,owner);
const claim4=ownerAcknowledgementFollowUpClaims({ledger,sequence:2,
 action:"ESCALATE_TO_OWNER_MANUAL_REVIEW",ownerReviewRef:"owner:recipient-600-b",
 issuedAt:"2026-10-20T10:00:04.000Z",
 previousOwnerDecisionDigest:hash(receipt3)});
const receipt4=signature(claim4,owner);
const ownerPin={headDigest:hash(receipt4),receiptCount:2,
 recipientLedgerHeadDigest:ledger.recipientLedgerHeadDigest,
 exportDigest:ledger.exportDigest,
 initialRecipientReceiptDigest:ledger.initialRecipientReceiptDigest,
 issueNumber:ledger.issueNumber,
 externalReference:"external-owner:followup-head-600"};
const ownerArgs={recipientLedgerArguments:recipientArgs,
 ownerDecisionReceipts:[receipt3,receipt4],
 ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 independentOwnerFollowUpPin:ownerPin,now};
const continuity=await verifyOwnerManualFollowUpContinuity(ownerArgs);
assert.equal(continuity.status,"INDEPENDENT_OWNER_MANUAL_FOLLOWUP_CONTINUITY");
assert.equal(continuity.ownerDecisions.length,2);
assert.equal(continuity.ownerFollowUpHeadDigest,hash(receipt4));
assert.equal(continuity.liveExceptionStatus,"UNCHANGED");
assert.equal(continuity.automaticClosure,false);
assert.equal(continuity.externalWritePerformed,false);
const workbench=await ownerRecipientFollowUpWorkbench(ownerArgs);
assert.equal(workbench.status,"READ_ONLY_OWNER_RECIPIENT_FOLLOWUP_WORKBENCH");
assert.equal(workbench.latestRecipientAction,"REQUEST_ADDITIONAL_EVIDENCE");
assert.equal(workbench.latestOwnerAction,"ESCALATE_TO_OWNER_MANUAL_REVIEW");
assert.equal(workbench.nextStep,"MANUAL_OWNER_RECONCILIATION_REVIEW");
assert.equal(workbench.auditHoldCleared,false);
assert.equal(JSON.stringify(workbench).includes('"signature"'),false);
const failRecipient=change=>assert.rejects(
 verifyIndependentRecipientAcknowledgementLedger({...recipientArgs,...change}));
await failRecipient({recipientReviewReceipts:[receipt2]});
await failRecipient({recipientReviewReceipts:[receipt1]});
await failRecipient({recipientReviewReceipts:[receipt1,receipt1]});
await failRecipient({recipientReviewReceipts:[receipt1,signature(claim2,impostor)]});
await failRecipient({recipientReviewReceipts:[receipt1,{...receipt2,claims:{
 ...claim2,action:"REPORT_REVIEW_DISCREPANCY"}}]});
await failRecipient({recipientReviewReceipts:[receipt1,signature({...claim2,
 issuedAt:"2026-10-20T09:59:58.000Z"},recipient)]});
await failRecipient({recipientReviewReceipts:[receipt1,signature({...claim2,
 issuedAt:"2026-10-20T10:30:00.000Z"},recipient)]});
await failRecipient({independentRecipientLedgerPin:null});
await failRecipient({independentRecipientLedgerPin:{...recipientPin,
 headDigest:"f".repeat(64)}});
await failRecipient({independentRecipientLedgerPin:{...recipientPin,
 receiptCount:1}});
await failRecipient({independentRecipientLedgerPin:{...recipientPin,
 initialRecipientReceiptDigest:"f".repeat(64)}});
await failRecipient({pinnedRecipientFingerprint:fp(owner)});
await failRecipient({pinnedRecipientFingerprint:fp(reviewer)});
await failRecipient({recipientPublicKeyPem:pem(impostor)});
await failRecipient({exportArguments:{...args,independentExportHeadPin:null}});
await failRecipient({exportArguments:{...args,governanceArguments:{
 ...args.governanceArguments,independentGovernanceHeadPin:null}}});
const failOwner=change=>assert.rejects(
 verifyOwnerManualFollowUpContinuity({...ownerArgs,...change}));
await failOwner({ownerDecisionReceipts:[receipt4]});
await failOwner({ownerDecisionReceipts:[receipt3]});
await failOwner({ownerDecisionReceipts:[receipt3,receipt3]});
await failOwner({ownerDecisionReceipts:[receipt3,signature(claim4,impostor)]});
await failOwner({ownerDecisionReceipts:[receipt3,{...receipt4,claims:{
 ...claim4,action:"DEFER_FOLLOWUP_REVIEW"}}]});
await failOwner({ownerDecisionReceipts:[receipt3,signature({...claim4,
 issuedAt:"2026-10-20T10:00:01.000Z"},owner)]});
await failOwner({independentOwnerFollowUpPin:null});
await failOwner({independentOwnerFollowUpPin:{...ownerPin,headDigest:"f".repeat(64)}});
await failOwner({independentOwnerFollowUpPin:{...ownerPin,receiptCount:1}});
await failOwner({independentOwnerFollowUpPin:{...ownerPin,issueNumber:98}});
await failOwner({ownerPublicKeyPem:pem(impostor)});
await failOwner({pinnedOwnerFingerprint:fp(recipient)});
await failOwner({recipientLedgerArguments:{...recipientArgs,
 independentRecipientLedgerPin:null}});
assert.throws(()=>recipientAcknowledgementClaims({verifiedExport,sequence:1,
 action:"CLOSE_AUDIT_HOLD",recipientReviewRef:"recipient:unsafe",
 issuedAt:"2026-10-20T10:00:01.000Z"}),/HOLD/);
assert.throws(()=>ownerAcknowledgementFollowUpClaims({ledger,sequence:1,
 action:"RELEASE_TO_PRODUCTION",ownerReviewRef:"owner:unsafe",
 issuedAt:"2026-10-20T10:00:03.000Z"}),/HOLD/);
assert.throws(()=>ownerAcknowledgementFollowUpClaims({
 ledger:{...ledger,status:"VERIFIED"},sequence:1,
 action:"ACKNOWLEDGE_RECIPIENT_REVIEW",ownerReviewRef:"owner:unsafe",
 issuedAt:"2026-10-20T10:00:03.000Z"}),/HOLD/);
console.log("Build 600 independent recipient Ed25519 acknowledgement and owner manual continuity with external pins PASS");

// Build 601 synthetic fully verified owner/recipient follow-up fixture.
export const build600Fixture={ownerArgs,owner,pem,fp,signature,impostor,now};
