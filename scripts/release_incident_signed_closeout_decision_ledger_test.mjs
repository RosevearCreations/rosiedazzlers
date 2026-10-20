import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {evaluateExplicitOwnerExceptionCloseout} from "./release_incident_review_head_rotation_closeout.mjs";
import {signedCloseoutDecisionClaims,verifyCloseoutDecisionLedger,
 ownerCloseoutReviewWorkbench} from "./release_incident_signed_closeout_decision_ledger.mjs";
import {build592Fixture} from "./release_incident_review_head_rotation_closeout_test.mjs";
const {closeoutArgs,owner,impostor,pem,fp,signature,now}=build592Fixture;
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const candidate=await evaluateExplicitOwnerExceptionCloseout(closeoutArgs);
assert.equal(candidate.status,"OWNER_CLOSEOUT_REVIEW_CANDIDATE");
const sourceIssue=closeoutArgs.ownerCloseoutReceipt.claims.issueNumber;
const c1=signedCloseoutDecisionClaims({candidate,issueNumber:sourceIssue,
 action:"ACKNOWLEDGE_CANDIDATE",decisionRef:"owner:closeout-decision-593-1",
 issuedAt:"2026-10-20T09:30:00.000Z"});
const receipt1=signature(c1,owner);
const h1=digest(receipt1);
const c2=signedCloseoutDecisionClaims({candidate,issueNumber:sourceIssue,
 action:"REQUEST_MANUAL_HANDOFF",decisionRef:"owner:closeout-decision-593-2",
 issuedAt:"2026-10-20T09:40:00.000Z",previousDecisionDigest:h1});
const receipt2=signature(c2,owner);
const h2=digest(receipt2);
const decisionPin={headDigest:h2,receiptCount:2,
 sourceCloseoutReceiptDigest:candidate.closeoutReceiptDigest,
 exceptionRotationDigest:candidate.rotationHeadDigest,
 externalReference:"separate-owner-record:decision-head-593"};
const params={closeoutArguments:closeoutArgs,receipts:[receipt1,receipt2],
 ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 independentDecisionHeadPin:decisionPin,now};
const ledger=await verifyCloseoutDecisionLedger(params);
assert.equal(ledger.status,"SIGNED_OWNER_CLOSEOUT_LEDGER_VERIFIED");
assert.equal(ledger.headDigest,h2);
assert.equal(ledger.rows.length,2);
assert.equal(ledger.auditHoldCleared,false);
assert.equal(ledger.automaticClosure,false);
const workbench=await ownerCloseoutReviewWorkbench(params);
assert.equal(workbench.status,"OWNER_CLOSEOUT_REVIEW_WORKBENCH");
assert.equal(workbench.latestDecision,"REQUEST_MANUAL_HANDOFF");
assert.equal(workbench.liveExceptionStatus,"UNCHANGED");
assert.equal(workbench.externalWritePerformed,false);
assert.equal(workbench.manualOwnerActionRequired,true);
const fail=async (changed,pattern)=>assert.rejects(verifyCloseoutDecisionLedger({...params,...changed}),pattern);
await fail({receipts:[receipt2]},/predecessor|wrong incident/);
await fail({receipts:[receipt1]},/register head/);
await fail({receipts:[receipt1,receipt1]},/predecessor|rollback|replay/);
await fail({receipts:[receipt1,signature(c2,impostor)]},/signature/);
await fail({receipts:[receipt1,{...receipt2,claims:{...c2,action:"DEFER_REVIEW"}}]},/signature/);
await fail({independentDecisionHeadPin:null},/register head/);
await fail({independentDecisionHeadPin:{...decisionPin,headDigest:"f".repeat(64)}},/register head/);
await fail({independentDecisionHeadPin:{...decisionPin,receiptCount:1}},/register head/);
await fail({independentDecisionHeadPin:{...decisionPin,sourceCloseoutReceiptDigest:"e".repeat(64)}},/register head/);
await fail({pinnedOwnerFingerprint:fp(impostor)},/independently pinned/);
await fail({ownerPublicKeyPem:pem(impostor)},/fingerprint/);
await fail({closeoutArguments:{...closeoutArgs,rotationArguments:{
  ...closeoutArgs.rotationArguments,independentRotationPin:null}}},/rotation-register/);
await fail({closeoutArguments:{...closeoutArgs,handoffArguments:{
  ...closeoutArgs.handoffArguments,independentHandoffHeadPin:null}}},/pin/);
await fail({closeoutArguments:{...closeoutArgs,resolutionReceipt:{
 ...closeoutArgs.resolutionReceipt,signature:"A".repeat(86)+"=="}}},/signature/);
await fail({closeoutArguments:{...closeoutArgs,ownerCloseoutReceipt:{
 ...closeoutArgs.ownerCloseoutReceipt,signature:"A".repeat(86)+"=="}}},/signature/);
assert.throws(()=>signedCloseoutDecisionClaims({candidate,issueNumber:sourceIssue,
 action:"CLOSE_AUDIT_HOLD",decisionRef:"owner:unsafe",issuedAt:"2026-10-20T09:30:00.000Z"}),/HOLD/);
assert.throws(()=>signedCloseoutDecisionClaims({candidate:{...candidate,status:"VERIFIED"},
 issueNumber:sourceIssue,action:"DEFER_REVIEW",
 decisionRef:"owner:unsafe",issuedAt:"2026-10-20T09:30:00.000Z"}),/HOLD/);
console.log("Build 593 signed owner closeout decisions, independent ledger pin and read-only workbench PASS");

// Build 594 consumes only synthetic Ed25519 source proofs for cumulative tests.
export const build593Fixture={params,owner,impostor,pem,fp,signature,now};
