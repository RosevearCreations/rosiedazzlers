import assert from "node:assert/strict";
import { buildProviderHoldDecisionTraceabilityClosureReview } from "../functions/api/_lib/provider-hold-decision-traceability-closure-review.js";

const rows = [
  {id:"stripe_payment",title:"Stripe",source_available:true,evidence_at:"2026-09-21T10:00:00Z",age_days:0,freshness:"current",outcome_status:"verified"},
  {id:"paypal_payment",title:"PayPal",source_available:true,evidence_at:"2026-09-21T10:05:00Z",age_days:0,freshness:"current",outcome_status:"verified"},
  {id:"refund",title:"Refund",source_available:true,evidence_at:"2026-09-21T10:10:00Z",age_days:0,freshness:"current",outcome_status:"verified"},
  {id:"delivery",title:"Delivery",source_available:true,evidence_at:"2026-09-21T10:15:00Z",age_days:0,freshness:"current",outcome_status:"verified"}
];
const decision = {
  status:"operator_hold_decision_ready",
  generated_at:"2026-09-21T11:00:00Z",
  rows,
  decision_package:{narrowing_review_eligible:true,retained_closure_candidate:true}
};
const availability={rows};
const reconciliation={rows};

const awaiting = buildProviderHoldDecisionTraceabilityClosureReview({
  decision_readiness:decision, availability_review:availability, reconciliation
});
assert.equal(awaiting.evidence_date_continuity.status,"current_complete");
assert.equal(awaiting.status,"retain_hold_operator_review_required");
assert.equal(awaiting.operator_review_traceability.status,"operator_review_not_recorded");
assert.equal(awaiting.closure_review.manual_hold_update_candidate,false);
assert.equal(awaiting.canonical_hold.retain_hold,true);

const traceKey=awaiting.evidence_date_continuity.evidence_trace_key;
const retained = buildProviderHoldDecisionTraceabilityClosureReview({
  decision_readiness:decision, availability_review:availability, reconciliation,
  operator_review:{reviewed_at:"2026-09-21T11:05:00Z",reviewer_role:"operator",decision:"retain_hold",evidence_trace_key:traceKey}
});
assert.equal(retained.status,"review_complete_retain_hold");
assert.equal(retained.operator_review_traceability.review_valid,true);

const narrowing = buildProviderHoldDecisionTraceabilityClosureReview({
  decision_readiness:decision, availability_review:availability, reconciliation,
  operator_review:{reviewed_at:"2026-09-21T11:05:00Z",reviewer_role:"operator",decision:"narrow_hold_with_dated_provider_evidence",evidence_trace_key:traceKey}
});
assert.equal(narrowing.status,"closure_review_ready_for_manual_hold_update");
assert.equal(narrowing.closure_review.manual_hold_update_candidate,true);
assert.equal(narrowing.closure_review.canonical_hold_mutated,false);
assert.equal(narrowing.truth_boundary.operator_review_record_persisted,false);

const mismatch = buildProviderHoldDecisionTraceabilityClosureReview({
  decision_readiness:decision, availability_review:availability, reconciliation,
  operator_review:{reviewed_at:"2026-09-21T11:05:00Z",reviewer_role:"operator",decision:"narrow_hold_with_dated_provider_evidence",evidence_trace_key:"old-snapshot"}
});
assert.equal(mismatch.status,"retain_hold_operator_review_required");
assert.equal(mismatch.operator_review_traceability.status,"operator_review_trace_mismatch");

const staleRows=structuredClone(rows);
staleRows[3].freshness="stale";
const staleDecision=structuredClone(decision);
staleDecision.status="revalidate_before_hold_decision";
staleDecision.decision_package.narrowing_review_eligible=false;
staleDecision.rows=staleRows;
const stale = buildProviderHoldDecisionTraceabilityClosureReview({
  decision_readiness:staleDecision, availability_review:{rows:staleRows}, reconciliation:{rows:staleRows}
});
assert.equal(stale.status,"blocked_evidence_date_continuity");
assert.equal(stale.evidence_date_continuity.status,"revalidation_required");

const unavailableRows=structuredClone(rows);
unavailableRows[0].source_available=false;
const unavailable=buildProviderHoldDecisionTraceabilityClosureReview({
  decision_readiness:{status:"retain_hold_unavailable_source",rows:unavailableRows,decision_package:{}},
  availability_review:{rows:unavailableRows}, reconciliation:{rows:unavailableRows}
});
assert.equal(unavailable.status,"blocked_source_unavailable");
assert.equal(unavailable.canonical_hold.classification,"unavailable");

console.log("PROVIDER HOLD DECISION TRACEABILITY & CLOSURE REVIEW TEST: PASS");
