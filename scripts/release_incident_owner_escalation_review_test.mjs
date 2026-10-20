import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyExceptionRegisterHistory} from "./release_incident_external_exception_register.mjs";
import {build589Fixture} from "./release_incident_external_exception_register_test.mjs";
import {ownerReviewClaims,verifyOwnerReviewHistory,reviewContinuityGovernance}
  from "./release_incident_owner_escalation_review.mjs";
const {input,now,owner,impostor,pem,fp,signature}=build589Fixture;
const history=verifyExceptionRegisterHistory(input);
const last=history.latest.decisions.at(-1);
const first=ownerReviewClaims({verifiedHistory:history,incidentRef:last.incidentRef,
  decisionDigest:last.receiptDigest,action:"ACKNOWLEDGE_REVIEW",
  ownerReviewRef:"owner:review-590-a",evidenceRef:"external:owner-review-a",
  issuedAt:"2026-10-20T07:00:00.000Z"});
const signedFirst=signature(first,owner);
const firstDigest=createHash("sha256").update(canonicalBytes(signedFirst)).digest("hex");
const second=ownerReviewClaims({verifiedHistory:history,incidentRef:last.incidentRef,
  decisionDigest:last.receiptDigest,action:"REQUEST_FOLLOWUP",
  ownerReviewRef:"owner:review-590-b",evidenceRef:"external:owner-review-b",
  issuedAt:"2026-10-20T07:30:00.000Z",previousReviewDigest:firstDigest});
const signedSecond=signature(second,owner);
const secondDigest=createHash("sha256").update(canonicalBytes(signedSecond)).digest("hex");
const head={headDigest:secondDigest,receiptCount:2,
  exceptionRegisterDigest:history.latest.registerDigest,
  externalReference:"independent-owner-log:590"};
const args={verifyArguments:input,reviewReceipts:[signedFirst,signedSecond],
  ownerReviewPublicKeyPem:pem(owner),pinnedOwnerReviewFingerprint:fp(owner),
  independentReviewHeadPin:head,now};
const verified=verifyOwnerReviewHistory(args);
assert.equal(verified.status,"INDEPENDENTLY_PINNED_OWNER_REVIEW_CONTINUITY");
assert.equal(verified.rows.length,2);
assert.equal(verified.ownerReviewHeadDigest,secondDigest);
assert.equal(verified.automaticClosure,false);
const governance=reviewContinuityGovernance({...args,reviewAfterDays:7});
assert.equal(governance.status,"READ_ONLY_OWNER_EXCEPTION_CONTINUITY_GOVERNANCE");
assert.equal(governance.rows[0].latestOwnerAction,"REQUEST_FOLLOWUP");
assert.equal(governance.rows[0].reviewState,"OWNER_REVIEW_RECORDED");
assert.equal(governance.rows[0].auditHoldCleared,false);
assert.equal(governance.automaticEscalation,false);
assert.equal(governance.externalWritePerformed,false);
assert.equal(reviewContinuityGovernance({...args,
  now:new Date("2026-10-30T08:00:00.000Z")}).rows[0].reviewState,
  "OWNER_FOLLOWUP_REVIEW_DUE");
assert.throws(()=>verifyOwnerReviewHistory({...args,
  reviewReceipts:[signedSecond]}),/hash-chain|mismatch/);
assert.throws(()=>verifyOwnerReviewHistory({...args,
  reviewReceipts:[signedFirst]}),/complete|anchor|inconsistent/);
assert.throws(()=>verifyOwnerReviewHistory({...args,independentReviewHeadPin:{
  ...head,headDigest:"f".repeat(64)}}),/anchor|inconsistent/);
assert.throws(()=>verifyOwnerReviewHistory({...args,independentReviewHeadPin:{
  ...head,receiptCount:1}}),/anchor|inconsistent/);
assert.throws(()=>verifyOwnerReviewHistory({...args,independentReviewHeadPin:null}),/anchor|inconsistent/);
assert.throws(()=>verifyOwnerReviewHistory({...args,pinnedOwnerReviewFingerprint:fp(impostor)}),/trust/);
assert.throws(()=>verifyOwnerReviewHistory({...args,ownerReviewPublicKeyPem:pem(impostor)}),/fingerprint/);
assert.throws(()=>verifyOwnerReviewHistory({...args,reviewReceipts:[
  signedFirst,{...signedSecond,signature:signature(second,impostor).signature}]}),/signature/);
assert.throws(()=>verifyOwnerReviewHistory({...args,reviewReceipts:[
  signedFirst,{...signedSecond,claims:{...second,action:"DEFER_FOLLOWUP"}}]}),/signature/);
assert.throws(()=>verifyOwnerReviewHistory({...args,reviewReceipts:[
  signedFirst,signedFirst]}),/hash-chain|mismatch/);
assert.throws(()=>verifyOwnerReviewHistory({...args,verifyArguments:{
  status:"EXTERNAL_EXCEPTION_HISTORY_VERIFIED",latest:history.latest}}),/HOLD|required/);
assert.throws(()=>ownerReviewClaims({verifiedHistory:history,incidentRef:last.incidentRef,
  decisionDigest:last.receiptDigest,action:"CLOSE_HOLD",
  ownerReviewRef:"owner:bad",evidenceRef:"offsite:bad",
  issuedAt:"2026-10-20T07:00:00.000Z"}),/HOLD/);
assert.throws(()=>ownerReviewClaims({verifiedHistory:history,incidentRef:last.incidentRef,
  decisionDigest:"f".repeat(64),action:"ACKNOWLEDGE_REVIEW",
  ownerReviewRef:"owner:bad",evidenceRef:"offsite:bad",
  issuedAt:"2026-10-20T07:00:00.000Z"}),/unverified/);
console.log("Build 590 owner review Ed25519 receipts, complete externally pinned head, continuity and no closure PASS");
