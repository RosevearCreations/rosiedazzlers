#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildProviderLocalSearchManualClosureOutcomeContinuity } from "../functions/api/_lib/provider-local-search-manual-closure-outcome-continuity.js";

const readyClosure = {
  status:"closure_evidence_continuity_review_ready",
  provider_closure_evidence:{
    status:"provider_closure_evidence_review_ready",
    required_count:4,
    closure_review_ready_count:4,
    evidence_trace_key:"stripe_payment:2026-09-27|paypal_payment:2026-09-27|refund:2026-09-27|delivery:2026-09-27",
    rows:[]
  },
  local_search_closure_evidence:{
    status:"local_search_closure_evidence_review_ready",
    required_count:2,
    closure_review_ready_count:2,
    rows:[
      {provider:"search_console",identity_kind:"property",current_identity:"https://rosiedazzlers.ca/",current_period_start:"2026-08-29",current_period_end:"2026-09-27",previous_period_start:"2026-07-30",previous_period_end:"2026-08-28",current_observed_at:"2026-09-27T15:00:00Z"},
      {provider:"google_business_profile",identity_kind:"location",current_identity:"Rosie Dazzlers Tillsonburg",current_period_start:"2026-08-29",current_period_end:"2026-09-27",previous_period_start:"2026-07-30",previous_period_end:"2026-08-28",current_observed_at:"2026-09-27T15:05:00Z"}
    ]
  }
};

const baseline = buildProviderLocalSearchManualClosureOutcomeContinuity({closure_review:readyClosure,generated_at:"2026-09-28T14:00:00Z"});
assert.equal(baseline.manual_closure_outcome_build,519);
assert.equal(baseline.status,"manual_closure_operator_outcome_required");
assert.equal(baseline.evidence_continuity.closure_review_ready,true);
assert.equal(baseline.manual_hold_outcome.present,false);

const trace = baseline.evidence_continuity.expected_evidence_trace_key;
const narrowed = buildProviderLocalSearchManualClosureOutcomeContinuity({
  closure_review:readyClosure,
  manual_hold_outcome:{reviewed_at:"2026-09-28T14:05:00Z",reviewer_role:"owner",outcome:"narrow_hold_with_dated_evidence",evidence_trace_key:trace,outcome_reference:"manual-hold-review-519-001"}
});
assert.equal(narrowed.status,"manual_closure_outcome_observed");
assert.equal(narrowed.manual_hold_outcome.valid,true);
assert.equal(narrowed.manual_hold_outcome.observed_not_inferred,true);
assert.equal(narrowed.closure_contract.automatic_canonical_hold_narrowing_performed,false);
assert.equal(narrowed.boundaries.hold_inventory_mutated,false);

const retained = buildProviderLocalSearchManualClosureOutcomeContinuity({
  closure_review:readyClosure,
  manual_hold_outcome:{reviewed_at:"2026-09-28T14:10:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:trace,outcome_reference:"manual-hold-review-519-002"}
});
assert.equal(retained.status,"manual_hold_retained_observed");

const staleClosure = structuredClone(readyClosure);
staleClosure.status = "closure_evidence_continuity_review_required";
staleClosure.provider_closure_evidence.status = "provider_closure_evidence_review_required";
staleClosure.provider_closure_evidence.closure_review_ready_count = 3;
const staleBaseline = buildProviderLocalSearchManualClosureOutcomeContinuity({closure_review:staleClosure});
const invalidNarrow = buildProviderLocalSearchManualClosureOutcomeContinuity({
  closure_review:staleClosure,
  manual_hold_outcome:{reviewed_at:"2026-09-28T14:15:00Z",reviewer_role:"owner",outcome:"narrow_hold_with_dated_evidence",evidence_trace_key:staleBaseline.evidence_continuity.expected_evidence_trace_key,outcome_reference:"manual-hold-review-519-003"}
});
assert.equal(invalidNarrow.status,"manual_closure_evidence_conflict");
assert.equal(invalidNarrow.manual_hold_outcome.status,"operator_outcome_not_currently_eligible");

const wrongTrace = buildProviderLocalSearchManualClosureOutcomeContinuity({
  closure_review:readyClosure,
  manual_hold_outcome:{reviewed_at:"2026-09-28T14:20:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:"wrong-trace",outcome_reference:"manual-hold-review-519-004"}
});
assert.equal(wrongTrace.status,"manual_closure_evidence_conflict");
assert.equal(wrongTrace.manual_hold_outcome.trace_match,false);
assert.equal(narrowed.truth_boundary.ranking_outcome_inferred,false);
assert.equal(narrowed.truth_boundary.weather_causation_inferred,false);
assert.equal(narrowed.truth_boundary.booking_conversion_causation_inferred,false);
console.log("BUILD 519 PROVIDER & LOCAL SEARCH MANUAL CLOSURE OUTCOME CONTINUITY TEST: PASS");
