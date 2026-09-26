#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildProviderLocalSearchClosureEvidenceContinuityReview } from "../functions/api/_lib/provider-local-search-closure-evidence-continuity-review.js";

const outcome_refresh = {
  provider_outcomes_and_communications: {
    status: "provider_outcome_evidence_current",
    evidence_trace_key: "stripe_payment:2026-09-26|paypal_payment:2026-09-26|refund:2026-09-26|delivery:2026-09-26",
    rows: [
      {id:"stripe_payment",label:"Stripe payment outcome",source:"Stripe provider evidence",source_available:true,provider_identity_present:true,evidence_at:"2026-09-26T14:00:00Z",freshness:"current",outcome_status:"observed",source_contract_satisfied:true,current_attributable_outcome_present:true},
      {id:"paypal_payment",label:"PayPal payment outcome",source:"PayPal provider evidence",source_available:true,provider_identity_present:true,evidence_at:"2026-09-26T14:05:00Z",freshness:"current",outcome_status:"observed",source_contract_satisfied:true,current_attributable_outcome_present:true},
      {id:"refund",label:"Linked definitive refund outcome",source:"Provider refund evidence",source_available:true,provider_identity_present:true,evidence_at:"2026-09-26T14:10:00Z",freshness:"current",outcome_status:"observed",source_contract_satisfied:true,current_attributable_outcome_present:true},
      {id:"delivery",label:"Definitive message-delivery outcome",source:"Message delivery provider evidence",source_available:true,provider_identity_present:true,evidence_at:"2026-09-26T14:15:00Z",freshness:"current",outcome_status:"observed",source_contract_satisfied:true,current_attributable_outcome_present:true}
    ]
  },
  local_search_provider_outcomes: {
    status: "local_search_outcome_evidence_current",
    rows: [
      {provider:"search_console",provider_label:"Google Search Console",identity_kind:"property",current_identity:"https://rosiedazzlers.ca/",previous_identity:"https://rosiedazzlers.ca/",current_period_start:"2026-08-28",current_period_end:"2026-09-26",previous_period_start:"2026-07-29",previous_period_end:"2026-08-27",current_observed_at:"2026-09-26T14:20:00Z",continuity_state:"descriptive_review_ready",identity_match:true,equal_length_window:true,distinct_window:true,correct_provider_property_location_window_source:true,first_party_context_available:true},
      {provider:"google_business_profile",provider_label:"Google Business Profile",identity_kind:"location",current_identity:"Rosie Dazzlers Tillsonburg",previous_identity:"Rosie Dazzlers Tillsonburg",current_period_start:"2026-08-28",current_period_end:"2026-09-26",previous_period_start:"2026-07-29",previous_period_end:"2026-08-27",current_observed_at:"2026-09-26T14:25:00Z",continuity_state:"descriptive_review_ready",identity_match:true,equal_length_window:true,distinct_window:true,correct_provider_property_location_window_source:true,first_party_context_available:true}
    ]
  }
};

const report = buildProviderLocalSearchClosureEvidenceContinuityReview({outcome_refresh,generated_at:"2026-09-26T15:00:00Z"});
assert.equal(report.closure_evidence_continuity_review_build,509);
assert.equal(report.status,"closure_evidence_continuity_review_ready");
assert.equal(report.provider_closure_evidence.closure_review_ready_count,4);
assert.equal(report.local_search_closure_evidence.closure_review_ready_count,2);
assert.equal(report.closure_contract.manual_hold_update_required,true);
assert.equal(report.closure_contract.automatic_hold_closure_performed,false);
assert.equal(report.closure_contract.first_party_context_used_as_provider_substitute,false);
assert.equal(report.truth_boundary.ranking_outcome_inferred,false);
assert.equal(report.truth_boundary.weather_causation_inferred,false);
assert.equal(report.truth_boundary.booking_conversion_causation_inferred,false);
assert.equal(report.boundaries.hold_inventory_mutated,false);

const stale = structuredClone(outcome_refresh);
stale.provider_outcomes_and_communications.rows[0].freshness = "stale";
stale.provider_outcomes_and_communications.rows[0].current_attributable_outcome_present = false;
const needsReview = buildProviderLocalSearchClosureEvidenceContinuityReview({outcome_refresh:stale});
assert.equal(needsReview.status,"closure_evidence_continuity_review_required");
assert.equal(needsReview.provider_closure_evidence.status,"provider_closure_evidence_review_required");

const wrongLocation = structuredClone(outcome_refresh);
wrongLocation.local_search_provider_outcomes.rows[1].identity_match = false;
wrongLocation.local_search_provider_outcomes.rows[1].correct_provider_property_location_window_source = false;
const localBlocked = buildProviderLocalSearchClosureEvidenceContinuityReview({outcome_refresh:wrongLocation});
assert.equal(localBlocked.status,"closure_evidence_continuity_review_required");
assert.equal(localBlocked.local_search_closure_evidence.status,"local_search_closure_evidence_review_required");

const unavailable = structuredClone(outcome_refresh);
unavailable.provider_outcomes_and_communications.status = "provider_source_unavailable";
unavailable.provider_outcomes_and_communications.rows[1].source_available = false;
const sourceBlocked = buildProviderLocalSearchClosureEvidenceContinuityReview({outcome_refresh:unavailable});
assert.equal(sourceBlocked.status,"closure_evidence_source_unavailable");
assert.equal(sourceBlocked.provider_closure_evidence.status,"provider_closure_source_unavailable");

console.log("BUILD 509 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE CONTINUITY REVIEW TEST: PASS");
