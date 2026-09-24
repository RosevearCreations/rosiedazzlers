#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildProviderLocalSearchEvidenceContinuity } from "../functions/api/_lib/provider-local-search-evidence-continuity.js";

const provider={
  hold_decision_traceability_closure_review:{
    evidence_date_continuity:{status:"current_complete",evidence_trace_key:"stripe_payment:2026-09-20|paypal_payment:2026-09-20|refund:2026-09-20|delivery:2026-09-20"},
    rows:[
      {id:"stripe_payment",title:"Stripe",source:"Stripe provider evidence",source_available:true,evidence_at:"2026-09-20T10:00:00Z",evidence_timestamp_valid:true,freshness:"current",outcome_status:"observed"},
      {id:"paypal_payment",title:"PayPal",source:"PayPal provider evidence",source_available:true,evidence_at:"2026-09-20T10:05:00Z",evidence_timestamp_valid:true,freshness:"current",outcome_status:"observed"},
      {id:"refund",title:"Refund",source:"Provider refund evidence",source_available:true,evidence_at:"2026-09-20T10:10:00Z",evidence_timestamp_valid:true,freshness:"current",outcome_status:"observed"},
      {id:"delivery",title:"Delivery",source:"Message delivery provider evidence",source_available:true,evidence_at:"2026-09-20T10:15:00Z",evidence_timestamp_valid:true,freshness:"current",outcome_status:"observed"}
    ]
  }
};
const local_search={
  provider_snapshot_continuity:{
    status:"descriptive_review_ready",
    providers:[
      {provider:"search_console",provider_label:"Google Search Console",continuity_state:"descriptive_review_ready",identity_match:true,comparable_window_length:true,current_window_days:30,previous_window_days:30,current_snapshot:{label:"https://rosiedazzlers.ca/",period_start:"2026-08-21",period_end:"2026-09-19",observed_at:"2026-09-20T11:00:00Z",metrics:{clicks:120}},previous_snapshot:{label:"https://rosiedazzlers.ca/",period_start:"2026-07-22",period_end:"2026-08-20",observed_at:"2026-08-21T11:00:00Z",metrics:{clicks:100}},metric_deltas:{clicks:{previous:100,current:120,delta:20,percent_change:20}},first_party_context:{available:true,window_start:"2026-08-21",window_end:"2026-09-19",google_referral_sessions:50}},
      {provider:"google_business_profile",provider_label:"Google Business Profile",continuity_state:"descriptive_review_ready",identity_match:true,comparable_window_length:true,current_window_days:30,previous_window_days:30,current_snapshot:{label:"Rosie Dazzlers Tillsonburg",period_start:"2026-08-21",period_end:"2026-09-19",observed_at:"2026-09-20T11:05:00Z",metrics:{profile_views:300}},previous_snapshot:{label:"Rosie Dazzlers Tillsonburg",period_start:"2026-07-22",period_end:"2026-08-20",observed_at:"2026-08-21T11:05:00Z",metrics:{profile_views:280}},metric_deltas:{profile_views:{previous:280,current:300,delta:20,percent_change:7.1}},first_party_context:{available:true,window_start:"2026-08-21",window_end:"2026-09-19",google_referral_sessions:50}}
    ]
  }
};
const report=buildProviderLocalSearchEvidenceContinuity({provider,local_search,generated_at:"2026-09-23T20:00:00Z"});
assert.equal(report.continuity_enrichment_build,489);
assert.equal(report.status,"bounded_continuity_review_ready");
assert.equal(report.provider_outcomes_and_communications.status,"current_complete");
assert.equal(report.local_search.status,"descriptive_review_ready");
assert.equal(report.local_search.descriptive_review_ready_count,2);
assert.equal(report.continuity_rules.cross_family_identity_join_performed,false);
assert.equal(report.truth_boundary.search_or_referral_movement_is_weather_causation,false);
assert.equal(report.truth_boundary.local_search_metric_movement_causes_booking_conversion,false);
assert.equal(report.boundaries.provider_snapshot_write_performed,false);
assert.equal(report.boundaries.permanent_polling,false);

const incomplete=buildProviderLocalSearchEvidenceContinuity({
  provider:{hold_decision_traceability_closure_review:{rows:[{id:"stripe_payment",source:"Stripe",source_available:false,freshness:"unavailable"}]}},
  local_search:{provider_snapshot_continuity:{status:"continuity_incomplete",providers:[]}}
});
assert.equal(incomplete.status,"continuity_source_unavailable");
assert.equal(incomplete.provider_outcomes_and_communications.status,"unavailable_source");
assert.equal(incomplete.local_search.status,"continuity_incomplete");

console.log("BUILD 489 PROVIDER & LOCAL SEARCH EVIDENCE CONTINUITY TEST: PASS");
