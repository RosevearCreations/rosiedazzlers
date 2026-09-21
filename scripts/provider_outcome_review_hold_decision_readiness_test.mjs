import assert from "node:assert/strict";
import { buildProviderOutcomeReviewHoldDecisionReadiness } from "../functions/api/_lib/provider-outcome-review-hold-decision-readiness.js";

const outcome = {
  status: "closure_candidate",
  rows: [
    { id:"stripe_payment", status:"observed_dated", evidence_at:"2026-09-20T12:00:00Z" },
    { id:"paypal_payment", status:"observed_dated", evidence_at:"2026-09-19T12:00:00Z" },
    { id:"refund", status:"observed_dated", evidence_at:"2026-09-18T12:00:00Z" },
    { id:"delivery", status:"observed_dated", evidence_at:"2026-09-17T12:00:00Z" }
  ]
};
const reconciliation = {
  rows: [
    { id:"stripe_payment", source_available:true, evidence_at:"2026-09-20T12:00:00Z", age_days:0, freshness:"current" },
    { id:"paypal_payment", source_available:true, evidence_at:"2026-09-19T12:00:00Z", age_days:1, freshness:"current" },
    { id:"refund", source_available:true, evidence_at:"2026-09-18T12:00:00Z", age_days:2, freshness:"current" },
    { id:"delivery", source_available:true, evidence_at:"2026-09-17T12:00:00Z", age_days:3, freshness:"current" }
  ]
};
const availability = { closure_candidate_review: { retained_closure_candidate:true }, rows: reconciliation.rows };

const ready = buildProviderOutcomeReviewHoldDecisionReadiness({outcome,reconciliation,availability_review:availability});
assert.equal(ready.status,"operator_hold_decision_ready");
assert.equal(ready.decision_package.narrowing_review_eligible,true);
assert.equal(ready.decision_package.default_if_no_operator_action,"retain_hold");
assert.deepEqual(ready.decision_package.permitted_operator_actions,["retain_hold","narrow_hold_with_dated_provider_evidence"]);
assert.equal(ready.canonical_hold.backlog_mutated,false);
assert.equal(ready.truth_boundary.payment_or_refund_mutation_performed,false);

const aging = structuredClone(availability);
aging.rows[1].freshness="aging";
const agingResult=buildProviderOutcomeReviewHoldDecisionReadiness({outcome,reconciliation:{rows:aging.rows},availability_review:aging});
assert.equal(agingResult.status,"aging_evidence_review_required");
assert.deepEqual(agingResult.decision_package.permitted_operator_actions,["retain_hold"]);

const stale = structuredClone(availability);
stale.rows[2].freshness="stale";
const staleResult=buildProviderOutcomeReviewHoldDecisionReadiness({outcome,reconciliation:{rows:stale.rows},availability_review:stale});
assert.equal(staleResult.status,"revalidate_before_hold_decision");

const missingOutcome=structuredClone(outcome);
missingOutcome.status="hold";
const missing=structuredClone(availability);
missing.closure_candidate_review.retained_closure_candidate=false;
missing.rows[3]={id:"delivery",source_available:true,evidence_at:null,age_days:null,freshness:"missing"};
const missingResult=buildProviderOutcomeReviewHoldDecisionReadiness({outcome:missingOutcome,reconciliation:{rows:missing.rows},availability_review:missing});
assert.equal(missingResult.status,"retain_hold_missing_evidence");
assert.deepEqual(missingResult.decision_package.blocker_ids,["delivery"]);

const unavailableOutcome=structuredClone(outcome);
unavailableOutcome.status="unavailable";
const unavailable=structuredClone(availability);
unavailable.closure_candidate_review.retained_closure_candidate=false;
unavailable.rows[0]={id:"stripe_payment",source_available:false,evidence_at:null,age_days:null,freshness:"unavailable"};
const unavailableResult=buildProviderOutcomeReviewHoldDecisionReadiness({outcome:unavailableOutcome,reconciliation:{rows:unavailable.rows},availability_review:unavailable});
assert.equal(unavailableResult.status,"retain_hold_unavailable_source");
assert.equal(unavailableResult.canonical_hold.classification,"unavailable");

console.log("PROVIDER OUTCOME REVIEW & HOLD DECISION READINESS TEST: PASS");
