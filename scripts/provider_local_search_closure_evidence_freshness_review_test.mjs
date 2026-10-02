#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildProviderLocalSearchManualClosureOutcomeContinuity } from "../functions/api/_lib/provider-local-search-manual-closure-outcome-continuity.js";
import { buildProviderLocalSearchClosureEvidenceFreshnessReview } from "../functions/api/_lib/provider-local-search-closure-evidence-freshness-review.js";

const readyClosure={
 status:"closure_evidence_continuity_review_ready",
 provider_closure_evidence:{status:"provider_closure_evidence_review_ready",required_count:4,closure_review_ready_count:4,evidence_trace_key:"stripe_payment:2026-09-27|paypal_payment:2026-09-27|refund:2026-09-27|delivery:2026-09-27",rows:[
  {id:"stripe_payment",source:"Stripe",source_available:true,provider_identity_present:true,evidence_at:"2026-09-27T14:00:00Z",freshness:"current",source_contract_satisfied:true,current_attributable_outcome_present:true},
  {id:"paypal_payment",source:"PayPal",source_available:true,provider_identity_present:true,evidence_at:"2026-09-27T14:05:00Z",freshness:"current",source_contract_satisfied:true,current_attributable_outcome_present:true},
  {id:"refund",source:"Refund",source_available:true,provider_identity_present:true,evidence_at:"2026-09-27T14:10:00Z",freshness:"current",source_contract_satisfied:true,current_attributable_outcome_present:true},
  {id:"delivery",source:"Delivery",source_available:true,provider_identity_present:true,evidence_at:"2026-09-27T14:15:00Z",freshness:"current",source_contract_satisfied:true,current_attributable_outcome_present:true}
 ]},
 local_search_closure_evidence:{status:"local_search_closure_evidence_review_ready",required_count:2,closure_review_ready_count:2,rows:[
  {provider:"search_console",identity_kind:"property",current_identity:"https://rosiedazzlers.ca/",previous_identity:"https://rosiedazzlers.ca/",current_period_start:"2026-08-29",current_period_end:"2026-09-27",previous_period_start:"2026-07-30",previous_period_end:"2026-08-28",current_observed_at:"2026-09-27T15:00:00Z",identity_match:true,equal_length_window:true,distinct_window:true,correct_provider_property_location_window_source:true,first_party_context_available:true},
  {provider:"google_business_profile",identity_kind:"location",current_identity:"Rosie Dazzlers Tillsonburg",previous_identity:"Rosie Dazzlers Tillsonburg",current_period_start:"2026-08-29",current_period_end:"2026-09-27",previous_period_start:"2026-07-30",previous_period_end:"2026-08-28",current_observed_at:"2026-09-27T15:05:00Z",identity_match:true,equal_length_window:true,distinct_window:true,correct_provider_property_location_window_source:true,first_party_context_available:true}
 ]}
};
const baseline519=buildProviderLocalSearchManualClosureOutcomeContinuity({closure_review:readyClosure,generated_at:"2026-09-28T14:00:00Z"});
const trace=baseline519.evidence_continuity.expected_evidence_trace_key;
const current519=buildProviderLocalSearchManualClosureOutcomeContinuity({
 closure_review:readyClosure,
 manual_hold_outcome:{reviewed_at:"2026-09-28T14:05:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:trace,outcome_reference:"manual-hold-review-529-current"},
 generated_at:"2026-09-28T14:05:00Z"
});
const current=buildProviderLocalSearchClosureEvidenceFreshnessReview({closure_review:readyClosure,manual_closure_outcome:current519,generated_at:"2026-10-01T12:00:00Z",freshness_window_days:30});
assert.equal(current.provider_local_search_closure_freshness_build,529);
assert.equal(current.status,"manual_hold_retained_current");
assert.equal(current.provider_evidence.current_count,4);
assert.equal(current.local_search_evidence.current_count,2);
assert.equal(current.operator_review.freshness_state,"operator_review_current");
assert.equal(current.operator_review.trace_matches_current_evidence,true);
assert.equal(current.review_contract.first_party_context_used_as_provider_substitute,false);
assert.equal(current.truth_boundary.ranking_outcome_inferred,false);
assert.equal(current.truth_boundary.booking_conversion_causation_inferred,false);
assert.equal(current.boundaries.hold_inventory_mutated,false);

const noOperator=buildProviderLocalSearchClosureEvidenceFreshnessReview({closure_review:readyClosure,manual_closure_outcome:baseline519,generated_at:"2026-10-01T12:00:00Z"});
assert.equal(noOperator.status,"closure_evidence_current_operator_review_required");
assert.equal(noOperator.review_contract.closure_review_ready,true);

const staleProvider=structuredClone(readyClosure); staleProvider.provider_closure_evidence.rows[0].evidence_at="2026-07-01T12:00:00Z";
const providerReview=buildProviderLocalSearchClosureEvidenceFreshnessReview({closure_review:staleProvider,manual_closure_outcome:current519,generated_at:"2026-10-01T12:00:00Z"});
assert.equal(providerReview.status,"provider_evidence_freshness_review_required");
assert.equal(providerReview.provider_evidence.current_count,3);

const staleLocal=structuredClone(readyClosure); staleLocal.local_search_closure_evidence.rows[1].current_observed_at="2026-07-01T12:00:00Z";
const localReview=buildProviderLocalSearchClosureEvidenceFreshnessReview({closure_review:staleLocal,manual_closure_outcome:current519,generated_at:"2026-10-01T12:00:00Z"});
assert.equal(localReview.status,"local_search_evidence_freshness_review_required");
assert.equal(localReview.local_search_evidence.current_count,1);

const staleOperator519=buildProviderLocalSearchManualClosureOutcomeContinuity({closure_review:readyClosure,manual_hold_outcome:{reviewed_at:"2026-07-01T14:05:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:trace,outcome_reference:"manual-hold-review-529-stale"},generated_at:"2026-07-01T14:05:00Z"});
const operatorReview=buildProviderLocalSearchClosureEvidenceFreshnessReview({closure_review:readyClosure,manual_closure_outcome:staleOperator519,generated_at:"2026-10-01T12:00:00Z"});
assert.equal(operatorReview.status,"operator_review_freshness_required");
console.log("BUILD 529 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE FRESHNESS REVIEW TEST: PASS");
