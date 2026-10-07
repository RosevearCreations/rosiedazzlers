#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildProviderLocalSearchManualClosureOutcomeContinuity } from "../functions/api/_lib/provider-local-search-manual-closure-outcome-continuity.js";
import { buildProviderLocalSearchClosureEvidenceFreshnessReview } from "../functions/api/_lib/provider-local-search-closure-evidence-freshness-review.js";
import { buildProviderLocalSearchClosureEvidenceIntegrityReview } from "../functions/api/_lib/provider-local-search-closure-evidence-integrity-review.js";

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
const baseline=buildProviderLocalSearchManualClosureOutcomeContinuity({closure_review:readyClosure,generated_at:"2026-09-28T14:00:00Z"});
const trace=baseline.evidence_continuity.expected_evidence_trace_key;
const manual=buildProviderLocalSearchManualClosureOutcomeContinuity({
 closure_review:readyClosure,
 manual_hold_outcome:{reviewed_at:"2026-09-28T14:05:00Z",reviewer_role:"owner",outcome:"retain_hold",evidence_trace_key:trace,outcome_reference:"manual-hold-review-539"},
 generated_at:"2026-09-28T14:05:00Z"
});
const freshness=buildProviderLocalSearchClosureEvidenceFreshnessReview({closure_review:readyClosure,manual_closure_outcome:manual,generated_at:"2026-10-01T12:00:00Z",freshness_window_days:30});
const current=buildProviderLocalSearchClosureEvidenceIntegrityReview({closure_freshness:freshness,manual_closure_outcome:manual,generated_at:"2026-10-07T12:00:00Z"});
assert.equal(current.provider_local_search_closure_integrity_build,539);
assert.equal(current.status,"closure_integrity_current");
assert.equal(current.provider_source_identity.trace_match,true);
assert.equal(current.local_search_identity.trace_match,true);
assert.equal(current.operator_review_identity.current,true);
assert.equal(current.integrity_contract.first_party_context_used_as_provider_or_local_search_substitute,false);
assert.equal(current.truth_boundary.ranking_outcome_inferred,false);
assert.equal(current.truth_boundary.demand_causation_inferred,false);
assert.equal(current.truth_boundary.booking_conversion_causation_inferred,false);
assert.equal(current.boundaries.hold_inventory_mutated,false);
assert.equal(current.boundaries.schema_or_storage_mutated,false);

const providerMissing=structuredClone(freshness);
providerMissing.provider_evidence.rows[0].source="";
assert.equal(buildProviderLocalSearchClosureEvidenceIntegrityReview({closure_freshness:providerMissing,manual_closure_outcome:manual}).status,"provider_source_identity_review_required");

const providerDrift=structuredClone(freshness);
providerDrift.provider_evidence.evidence_trace_key="different-provider-trace";
assert.equal(buildProviderLocalSearchClosureEvidenceIntegrityReview({closure_freshness:providerDrift,manual_closure_outcome:manual}).status,"provider_source_identity_drift_review_required");

const localMissing=structuredClone(freshness);
localMissing.local_search_evidence.current_evidence_trace_key=null;
assert.equal(buildProviderLocalSearchClosureEvidenceIntegrityReview({closure_freshness:localMissing,manual_closure_outcome:manual}).status,"local_search_identity_review_required");

const localDrift=structuredClone(freshness);
localDrift.local_search_evidence.current_evidence_trace_key="different-local-trace";
assert.equal(buildProviderLocalSearchClosureEvidenceIntegrityReview({closure_freshness:localDrift,manual_closure_outcome:manual}).status,"local_search_identity_drift_review_required");

const operatorMissing=structuredClone(freshness);
operatorMissing.operator_review.present=false;
assert.equal(buildProviderLocalSearchClosureEvidenceIntegrityReview({closure_freshness:operatorMissing,manual_closure_outcome:manual}).status,"operator_review_identity_review_required");

const operatorDrift=structuredClone(freshness);
operatorDrift.operator_review.trace_matches_current_evidence=false;
assert.equal(buildProviderLocalSearchClosureEvidenceIntegrityReview({closure_freshness:operatorDrift,manual_closure_outcome:manual}).status,"operator_review_identity_drift_review_required");

const stale=structuredClone(freshness);
stale.status="closure_evidence_current_operator_review_required";
assert.equal(buildProviderLocalSearchClosureEvidenceIntegrityReview({closure_freshness:stale,manual_closure_outcome:manual}).status,"retained_freshness_review_required");

const unavailable=structuredClone(freshness);
unavailable.status="closure_evidence_source_unavailable";
assert.equal(buildProviderLocalSearchClosureEvidenceIntegrityReview({closure_freshness:unavailable,manual_closure_outcome:manual}).status,"integrity_source_unavailable");

console.log("BUILD 539 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE INTEGRITY REVIEW TEST: PASS");
