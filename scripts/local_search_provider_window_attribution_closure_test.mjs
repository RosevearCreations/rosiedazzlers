import assert from "node:assert/strict";
import {
  buildLocalSearchMeasurementConversionAttribution,
  buildLocalSearchProviderWindowAttributionClosure,
  deriveSameSessionConversionAttribution
} from "../functions/api/_lib/local-search-measurement-conversion-attribution.js";

const attribution=deriveSameSessionConversionAttribution([
  {session_id:"g1",event_type:"page_view",page_path:"/tillsonburg-auto-detailing",referrer:"https://google.ca/search?q=detailer",created_at:"2026-09-20T10:00:00Z",payload:{}},
  {session_id:"g1",event_type:"booking_step_view",page_path:"/book",created_at:"2026-09-20T10:02:00Z",payload:{step_number:1}},
  {session_id:"g1",event_type:"checkout_completed",page_path:"/book",checkout_state:"completed",created_at:"2026-09-20T10:05:00Z",payload:{}}
],true,false);

const providerRows=[
  {provider:"search_console",provider_label:"Google Search Console",classification:"observed",evidence_state:"observed_snapshot",property_location_label:"https://rosiedazzlers.ca/",observed_at:"2026-09-21T12:00:00Z",period_start:"2026-08-22",period_end:"2026-09-20",identity_explicit:true,freshness_days:1,freshness_limit_days:45,first_party_window_overlap:true},
  {provider:"google_business_profile",provider_label:"Google Business Profile",classification:"observed",evidence_state:"observed_snapshot",property_location_label:"Rosie Dazzlers · Ontario",observed_at:"2026-09-21T12:05:00Z",period_start:"2026-08-22",period_end:"2026-09-20",identity_explicit:true,freshness_days:1,freshness_limit_days:45,first_party_window_overlap:true}
];

const closure=buildLocalSearchProviderWindowAttributionClosure({
  provider_rows:providerRows,
  first_party_available:true,
  first_party_window:{start:"2026-08-23",end:"2026-09-21"},
  attribution,
  evidence_quality:{providers:providerRows.map((row)=>({provider:row.provider,comparison_state:"comparable_observed"}))}
});
assert.equal(closure.build,470);
assert.equal(closure.authority,"local_search_provider_window_attribution_closure");
assert.equal(closure.status,"closure_ready");
assert.equal(closure.counts.closure_ready,2);
assert.equal(closure.providers[0].identity_kind,"property");
assert.equal(closure.providers[1].identity_kind,"location");
assert.equal(closure.closure_rules.closure_ready_is_descriptive_evidence_only,true);
assert.equal(closure.closure_rules.provider_metric_to_session_join_performed,false);
assert.equal(closure.closure_rules.provider_outcome_to_funnel_causation_claimed,false);
assert.equal(closure.closure_rules.provider_ranking_or_visibility_outcome_inferred,false);

const missing=buildLocalSearchProviderWindowAttributionClosure({
  provider_rows:[{...providerRows[0],property_location_label:null,identity_explicit:false}],
  first_party_available:true,
  first_party_window:{start:"2026-08-23",end:"2026-09-21"},
  attribution
});
assert.equal(missing.status,"provider_dependent");

const mismatch=buildLocalSearchProviderWindowAttributionClosure({
  provider_rows:[{...providerRows[0],first_party_window_overlap:false}],
  first_party_available:true,
  first_party_window:{start:"2026-08-23",end:"2026-09-21"},
  attribution
});
assert.equal(mismatch.status,"window_mismatch");

const partial=buildLocalSearchProviderWindowAttributionClosure({
  provider_rows:[providerRows[0]],
  first_party_available:true,
  first_party_window:{start:"2026-08-23",end:"2026-09-21"},
  attribution:{...attribution,rows_truncated_possible:true}
});
assert.equal(partial.status,"bounded_partial");

const report=buildLocalSearchMeasurementConversionAttribution({
  provider_refresh:{
    status:"observed",
    reconciliation:{first_party:{available:true,window_start:"2026-08-23",window_end:"2026-09-21"}},
    providers:providerRows.map((row)=>({
      provider:row.provider,provider_label:row.provider_label,classification:row.classification,evidence_state:row.evidence_state,
      identity:{label:row.property_location_label,explicit:true,observed_at:row.observed_at,period_start:row.period_start,period_end:row.period_end},
      freshness_days:row.freshness_days,freshness_limit_days:row.freshness_limit_days,first_party_window_overlap:true
    }))
  },
  events:[
    {session_id:"g2",event_type:"page_view",page_path:"/simcoe-delhi-auto-detailing",referrer:"https://google.com/search?q=detailing",created_at:"2026-09-20T11:00:00Z",payload:{}},
    {session_id:"g2",event_type:"booking_step_view",page_path:"/book",created_at:"2026-09-20T11:02:00Z",payload:{step_number:1}}
  ],
  events_available:true,
  events_truncated_possible:false,
  generated_at:"2026-09-21T20:00:00Z"
});
assert.equal(report.provider_window_attribution_closure_build,470);
assert.equal(report.provider_window_attribution_closure_authority,"local_search_provider_window_attribution_closure");
assert.equal(report.provider_window_attribution_closure.status,"closure_ready");
assert.equal(report.truth_boundary.provider_window_closure_is_performance_claim,false);
assert.equal(report.truth_boundary.provider_window_closure_is_ranking_claim,false);
assert.equal(report.truth_boundary.provider_window_closure_is_causal_conversion_claim,false);

console.log("LOCAL SEARCH PROVIDER WINDOW & ATTRIBUTION CLOSURE TEST: PASS");
