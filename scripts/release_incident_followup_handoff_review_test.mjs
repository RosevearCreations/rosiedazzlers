import assert from "node:assert/strict";
import {createHash,generateKeyPairSync} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyManualFollowUpHandoff}
  from "./release_incident_followup_head_retention_handoff.mjs";
import {independentFollowUpReviewClaims,verifyIndependentFollowUpReview,
 manualExceptionHandoffDecisionClaims,verifyManualExceptionHandoffGovernance,
 ownerManualHandoffReviewWorkbench}
  from "./release_incident_followup_handoff_review.mjs";
import {build597Fixture}
  from "./release_incident_followup_head_retention_handoff_test.mjs";

const {handoffArgs,owner,impostor,pem,fp,signature,now}=build597Fixture;
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const reviewer=generateKeyPairSync("ed25519");
const handoff=await verifyManualFollowUpHandoff(handoffArgs);
assert.equal(handoff.status,"SIGNED_MANUAL_FOLLOWUP_HANDOFF_VERIFIED");
const reviewerClaims=independentFollowUpReviewClaims({
  handoff,reviewRef:"independent:followup-review-598",
  finding:"FOLLOWUP_EXCEPTION_REPORTED",reviewedAt:"2026-10-20T09:59:52.000Z"
});
const reviewReceipt=signature(reviewerClaims,reviewer);
const reviewedDigest=hash(reviewReceipt);
const receiptPin={receiptDigest:reviewedDigest,
  retainedRecordDigest:handoff.recordDigest,
  ownerHandoffHeadDigest:handoff.handoffHeadDigest,
  reviewerFingerprint:fp(reviewer),
  externalReference:"independent-offline:receipt-review-598"};
const reviewArguments={handoffArguments:handoffArgs,reviewReceipt,
  reviewerPublicKeyPem:pem(reviewer),pinnedReviewerFingerprint:fp(reviewer),
  independentReviewReceiptPin:receiptPin,now};
const verifiedReview=await verifyIndependentFollowUpReview(reviewArguments);
assert.equal(verifiedReview.status,"INDEPENDENT_FOLLOWUP_HANDOFF_REVIEW_VERIFIED");
assert.equal(verifiedReview.independentReviewReceiptDigest,reviewedDigest);
assert.equal(verifiedReview.reviewFinding,"FOLLOWUP_EXCEPTION_REPORTED");
assert.equal(verifiedReview.auditHoldCleared,false);
const claim1=manualExceptionHandoffDecisionClaims({review:verifiedReview,sequence:1,
  action:"ACKNOWLEDGE_REVIEW_RECEIPT",
  decisionRef:"owner:manual-review-598-a",issuedAt:"2026-10-20T09:59:54.000Z"});
const signed1=signature(claim1,owner);
const claim2=manualExceptionHandoffDecisionClaims({review:verifiedReview,sequence:2,
  action:"ESCALATE_MANUAL_EXCEPTION_REVIEW",
  decisionRef:"owner:manual-review-598-b",issuedAt:"2026-10-20T09:59:57.000Z",
  previousDecisionDigest:hash(signed1)});
const signed2=signature(claim2,owner);
const pin={headDigest:hash(signed2),receiptCount:2,
  independentReviewReceiptDigest:reviewedDigest,
  retainedRecordDigest:handoff.recordDigest,
  ownerHandoffHeadDigest:handoff.handoffHeadDigest,
  issueNumber:handoff.issueNumber,
  externalReference:"owner-offsite:review-governance-598"};
const params={reviewArguments,decisionReceipts:[signed1,signed2],
  ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
  independentGovernanceHeadPin:pin,now};
const checked=await verifyManualExceptionHandoffGovernance(params);
assert.equal(checked.status,"INDEPENDENT_MANUAL_EXCEPTION_HANDOFF_GOVERNANCE");
assert.equal(checked.decisionHistory.length,2);
assert.equal(checked.governanceHeadDigest,hash(signed2));
assert.equal(checked.auditHoldCleared,false);
assert.equal(checked.automaticClosure,false);
assert.equal(checked.externalWritePerformed,false);
const view=await ownerManualHandoffReviewWorkbench(params);
assert.equal(view.status,"READ_ONLY_MANUAL_EXCEPTION_HANDOFF_WORKBENCH");
assert.equal(view.latestOwnerDecision,"ESCALATE_MANUAL_EXCEPTION_REVIEW");
assert.equal(view.liveExceptionStatus,"UNCHANGED");
assert.equal(view.nextStep,"MANUAL_OWNER_EXCEPTION_REVIEW");
assert.equal(JSON.stringify(view).includes("signature"),false);

const rejectReview=change=>assert.rejects(
  verifyIndependentFollowUpReview({...reviewArguments,...change}));
await rejectReview({pinnedReviewerFingerprint:fp(owner)});
await rejectReview({reviewerPublicKeyPem:pem(impostor)});
await rejectReview({reviewReceipt:signature(reviewerClaims,impostor)});
await rejectReview({reviewReceipt:{...reviewReceipt,claims:{
  ...reviewerClaims,retainedRecordDigest:"f".repeat(64)}}});
await rejectReview({reviewReceipt:{...reviewReceipt,claims:{
  ...reviewerClaims,incidentRef:"wrong:incident"}}});
await rejectReview({independentReviewReceiptPin:null});
await rejectReview({independentReviewReceiptPin:{...receiptPin,receiptDigest:"e".repeat(64)}});
await rejectReview({independentReviewReceiptPin:{...receiptPin,reviewerFingerprint:fp(impostor)}});
await rejectReview({reviewReceipt:signature({...reviewerClaims,
  reviewedAt:"2026-10-20T09:59:49.000Z"},reviewer)});
await rejectReview({reviewReceipt:signature({...reviewerClaims,
  reviewedAt:"2026-10-20T10:30:00.000Z"},reviewer)});
await rejectReview({handoffArguments:{...handoffArgs,independentHandoffHeadPin:null}});
await rejectReview({handoffArguments:{...handoffArgs,
  retentionVerification:{...handoffArgs.retentionVerification,independentObjectPin:null}}});
const rejectOwner=change=>assert.rejects(
  verifyManualExceptionHandoffGovernance({...params,...change}));
await rejectOwner({decisionReceipts:[signed2]});
await rejectOwner({decisionReceipts:[signed1]});
await rejectOwner({decisionReceipts:[signed1,signed1]});
await rejectOwner({decisionReceipts:[signed1,signature(claim2,impostor)]});
await rejectOwner({decisionReceipts:[signed1,{...signed2,claims:{
  ...claim2,action:"DEFER_OWNER_HANDOFF"}}]});
await rejectOwner({independentGovernanceHeadPin:null});
await rejectOwner({independentGovernanceHeadPin:{...pin,headDigest:"f".repeat(64)}});
await rejectOwner({independentGovernanceHeadPin:{...pin,receiptCount:1}});
await rejectOwner({independentGovernanceHeadPin:{...pin,issueNumber:98}});
await rejectOwner({ownerPublicKeyPem:pem(impostor)});
await rejectOwner({pinnedOwnerFingerprint:fp(reviewer)});
assert.throws(()=>independentFollowUpReviewClaims({handoff,
  reviewRef:"independent:unsafe",finding:"CLOSE_AUDIT_HOLD",
  reviewedAt:"2026-10-20T09:59:52.000Z"}),/HOLD/);
assert.throws(()=>manualExceptionHandoffDecisionClaims({review:verifiedReview,
  sequence:1,action:"CLEAR_EXCEPTION",decisionRef:"owner:unsafe",
  issuedAt:"2026-10-20T09:59:54.000Z"}),/HOLD/);
assert.throws(()=>manualExceptionHandoffDecisionClaims({review:{
  ...verifiedReview,status:"VERIFIED"},sequence:1,action:"ACKNOWLEDGE_REVIEW_RECEIPT",
  decisionRef:"owner:unsafe",issuedAt:"2026-10-20T09:59:54.000Z"}),/HOLD/);
console.log("Build 598 independent reviewer Ed25519 receipt, complete owner governance chain, external pins and no-close policy PASS");

// Build 599 deterministic signed owner governance fixture; no real customer or signer data.
export const build598Fixture={params,owner,reviewer,impostor,pem,fp,signature,now};
