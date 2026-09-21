import assert from "node:assert/strict";
import {
  buildLocalSearchMeasurementConversionAttribution,
  buildProviderAttributionEvidenceQuality,
  deriveSameSessionConversionAttribution
} from "../functions/api/_lib/local-search-measurement-conversion-attribution.js";

const attribution=deriveSameSessionConversionAttribution([
  {session_id:"g1",event_type:"page_view",page_path:"/tillsonburg-auto-detailing",referrer:"https://google.ca/search?q=detailer",created_at:"2026-09-10T10:00:00Z",payload:{}},
  {session_id:"g1",event_type:"booking_step_view",page_path:"/book",created_at:"2026-09-10T10:02:00Z",payload:{step_number:1}},
  {session_id:"g1",event_type:"checkout_completed",page_path:"/book",checkout_state:"completed",created_at:"2026-09-10T10:05:00Z",payload:{}}
],true,false);

const providerRows=[
  {
    provider:"search_console",provider_label:"Google Search Console",classification:"observed",
    evidence_state:"observed_snapshot",identity_explicit:true,freshness_days:1,freshness_limit_days:45,
    first_party_window_overlap:true,session_level_join_performed:false
  },
  {
    provider:"google_business_profile",provider_label:"Google Business Profile",classification:"owner_action",
    evidence_state:"stale_observed_snapshot",identity_explicit:true,freshness_days:70,freshness_limit_days:45,
    first_party_window_overlap:false,session_level_join_performed:false
  }
];

const quality=buildProviderAttributionEvidenceQuality({
  provider_rows:providerRows,
  first_party_available:true,
  first_party_window:{start:"2026-08-22",end:"2026-09-20"},
  attribution
});
assert.equal(quality.build,460);
assert.equal(quality.authority,"local_search_provider_attribution_evidence_quality");
assert.equal(quality.status,"owner_action");
assert.equal(quality.providers[0].comparison_state,"comparable_observed");
assert.equal(quality.providers[1].comparison_state,"owner_action");
assert.equal(quality.comparison_rules.provider_metric_to_funnel_rate_comparison_performed,false);
assert.equal(quality.comparison_rules.provider_outcome_to_funnel_causation_claimed,false);
assert.equal(quality.comparison_rules.provider_metric_correlation_score_calculated,false);
assert.equal(quality.comparison_rules.cross_source_identity_join_performed,false);

const mismatch=buildProviderAttributionEvidenceQuality({
  provider_rows:[{...providerRows[0],first_party_window_overlap:false}],
  first_party_available:true,
  attribution
});
assert.equal(mismatch.status,"window_mismatch");
assert.equal(mismatch.providers[0].comparison_state,"window_mismatch");

const partial=buildProviderAttributionEvidenceQuality({
  provider_rows:[providerRows[0]],
  first_party_available:true,
  attribution:{...attribution,rows_truncated_possible:true}
});
assert.equal(partial.status,"bounded_partial");

const report=buildLocalSearchMeasurementConversionAttribution({
  provider_refresh:{
    status:"observed",
    reconciliation:{first_party:{available:true,window_start:"2026-08-22",window_end:"2026-09-20"}},
    providers:[{
      provider:"search_console",provider_label:"Google Search Console",classification:"observed",
      evidence_state:"observed_snapshot",
      identity:{explicit:true,observed_at:"2026-09-20T12:00:00Z",period_start:"2026-08-22",period_end:"2026-09-19"},
      freshness_days:1,freshness_limit_days:45,first_party_window_overlap:true
    }]
  },
  events:[
    {session_id:"g1",event_type:"page_view",page_path:"/tillsonburg-auto-detailing",referrer:"https://google.ca/",created_at:"2026-09-10T10:00:00Z",payload:{}},
    {session_id:"g1",event_type:"checkout_completed",page_path:"/book",checkout_state:"completed",created_at:"2026-09-10T10:05:00Z",payload:{}}
  ],
  events_available:true,
  events_truncated_possible:false,
  generated_at:"2026-09-20T16:00:00Z"
});
assert.equal(report.build,450);
assert.equal(report.evidence_quality_build,460);
assert.equal(report.evidence_quality_authority,"local_search_provider_attribution_evidence_quality");
assert.equal(report.evidence_quality.status,"comparable_observed");
assert.equal(report.truth_boundary.provider_metric_correlation_score_calculated,false);
assert.equal(report.truth_boundary.provider_outcome_to_funnel_causation_claimed,false);
assert.equal(report.truth_boundary.cross_source_identity_join_performed,false);

console.log("LOCAL SEARCH PROVIDER & ATTRIBUTION EVIDENCE QUALITY TEST: PASS");
