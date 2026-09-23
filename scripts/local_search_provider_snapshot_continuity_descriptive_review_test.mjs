import assert from "node:assert/strict";
import {
  buildLocalSearchMeasurementConversionAttribution,
  buildLocalSearchProviderSnapshotContinuity,
  deriveSameSessionConversionAttribution
} from "../functions/api/_lib/local-search-measurement-conversion-attribution.js";

const currentRows=[
  {
    provider:"search_console",provider_label:"Google Search Console",classification:"observed",
    property_location_label:"https://rosiedazzlers.ca/",period_start:"2026-08-24",period_end:"2026-09-22",
    observed_at:"2026-09-22T15:00:00Z",metrics:{clicks:20,impressions:900,ctr_percent:2.22,average_position:16.8}
  },
  {
    provider:"google_business_profile",provider_label:"Google Business Profile",classification:"observed",
    property_location_label:"Rosie Dazzlers · Ontario",period_start:"2026-08-24",period_end:"2026-09-22",
    observed_at:"2026-09-22T15:05:00Z",metrics:{profile_views:90,website_clicks:16,calls:4,direction_requests:5}
  }
];
const history={
  search_console:[{
    provider:"search_console",label:"https://rosiedazzlers.ca/",period_start:"2026-07-25",period_end:"2026-08-23",
    observed_at:"2026-08-24T15:00:00Z",metrics:{clicks:10,impressions:800,ctr_percent:1.25,average_position:18.5}
  }],
  google_business_profile:[{
    provider:"google_business_profile",label:"Rosie Dazzlers · Ontario",period_start:"2026-07-25",period_end:"2026-08-23",
    observed_at:"2026-08-24T15:05:00Z",metrics:{profile_views:60,website_clicks:12,calls:3,direction_requests:4}
  }]
};
const attribution=deriveSameSessionConversionAttribution([
  {session_id:"a",event_type:"page_view",page_path:"/tillsonburg-auto-detailing",referrer:"https://google.ca/search?q=detailer",created_at:"2026-09-20T10:00:00Z",payload:{}},
  {session_id:"a",event_type:"booking_step_view",page_path:"/book",created_at:"2026-09-20T10:02:00Z",payload:{step_number:1}}
],true,false);

const ready=buildLocalSearchProviderSnapshotContinuity({
  provider_rows:currentRows,
  provider_history:history,
  first_party_available:true,
  first_party_window:{start:"2026-08-24",end:"2026-09-22"},
  attribution
});
assert.equal(ready.build,480);
assert.equal(ready.authority,"local_search_provider_snapshot_continuity_descriptive_review");
assert.equal(ready.status,"descriptive_review_ready");
assert.equal(ready.counts.descriptive_review_ready,2);
assert.equal(ready.providers[0].identity_match,true);
assert.equal(ready.providers[0].comparable_window_length,true);
assert.equal(ready.providers[0].current_window_days,30);
assert.equal(ready.providers[0].previous_window_days,30);
assert.equal(ready.providers[0].metric_deltas.clicks.delta,10);
assert.equal(ready.providers[0].metric_deltas.clicks.percent_change,100);
assert.equal(ready.review_rules.provider_performance_score_calculated,false);
assert.equal(ready.review_rules.provider_to_funnel_causation_claimed,false);
assert.equal(ready.southern_ontario_seasonal_truth_boundary.region,"Southern Ontario, Canada");
assert.equal(ready.southern_ontario_seasonal_truth_boundary.winter_service_availability_inferred,false);
assert.equal(ready.southern_ontario_seasonal_truth_boundary.service_temperature_limits_inferred,false);
assert.equal(ready.southern_ontario_seasonal_truth_boundary.cold_snap_service_capability_inferred,false);

const noHistory=buildLocalSearchProviderSnapshotContinuity({
  provider_rows:[currentRows[0]],provider_history:{},first_party_available:true,attribution
});
assert.equal(noHistory.status,"continuity_incomplete");
assert.equal(noHistory.providers[0].continuity_state,"insufficient_history");

const identityMismatch=buildLocalSearchProviderSnapshotContinuity({
  provider_rows:[currentRows[0]],
  provider_history:{search_console:[{...history.search_console[0],label:"https://different.example/"}]},
  first_party_available:true,attribution
});
assert.equal(identityMismatch.providers[0].continuity_state,"identity_mismatch");

const windowMismatch=buildLocalSearchProviderSnapshotContinuity({
  provider_rows:[currentRows[0]],
  provider_history:{search_console:[{...history.search_console[0],period_start:"2026-08-01",period_end:"2026-08-23"}]},
  first_party_available:true,attribution
});
assert.equal(windowMismatch.providers[0].continuity_state,"window_mismatch");
assert.deepEqual(windowMismatch.providers[0].metric_deltas,{});

const report=buildLocalSearchMeasurementConversionAttribution({
  provider_refresh:{
    status:"observed",
    reconciliation:{first_party:{available:true,window_start:"2026-08-24",window_end:"2026-09-22"}},
    providers:currentRows.map((row)=>({
      provider:row.provider,provider_label:row.provider_label,classification:row.classification,evidence_state:"observed_snapshot",
      identity:{label:row.property_location_label,period_start:row.period_start,period_end:row.period_end,observed_at:row.observed_at,explicit:true},
      metrics:row.metrics,first_party_window_overlap:true
    })),
    history
  },
  events:[
    {session_id:"b",event_type:"page_view",page_path:"/simcoe-delhi-auto-detailing",referrer:"https://google.com/search?q=detailer",created_at:"2026-09-21T11:00:00Z",payload:{}}
  ],
  events_available:true,
  events_truncated_possible:false,
  generated_at:"2026-09-22T16:00:00Z"
});
assert.equal(report.provider_snapshot_continuity_build,480);
assert.equal(report.provider_snapshot_continuity_authority,"local_search_provider_snapshot_continuity_descriptive_review");
assert.equal(report.provider_snapshot_continuity.status,"descriptive_review_ready");
assert.equal(report.truth_boundary.provider_snapshot_continuity_is_performance_claim,false);
assert.equal(report.truth_boundary.provider_snapshot_continuity_is_seasonal_demand_claim,false);
assert.equal(report.truth_boundary.winter_service_availability_inferred_from_search_data,false);
assert.equal(report.truth_boundary.service_temperature_limit_inferred_from_search_data,false);

console.log("LOCAL SEARCH PROVIDER SNAPSHOT CONTINUITY & DESCRIPTIVE REVIEW TEST: PASS");
