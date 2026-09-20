import assert from "node:assert/strict";
import {
  buildLocalSearchMeasurementConversionAttribution,
  deriveSameSessionConversionAttribution
} from "../functions/api/_lib/local-search-measurement-conversion-attribution.js";

const event = (session_id,event_type,created_at,extra={}) => ({
  session_id,
  event_type,
  created_at,
  page_path:extra.page_path || "/book",
  referrer:extra.referrer || "",
  source:extra.source || "",
  checkout_state:extra.checkout_state || null,
  payload:extra.payload || {}
});

const events=[
  event("g1","page_view","2026-09-10T10:00:00Z",{page_path:"/tillsonburg-auto-detailing",referrer:"https://www.google.ca/search?q=detailer"}),
  event("g1","booking_step_view","2026-09-10T10:05:00Z",{page_path:"/book",payload:{step_number:1}}),
  event("g1","checkout_started","2026-09-10T10:10:00Z",{checkout_state:"started"}),
  event("g1","checkout_completed","2026-09-10T10:12:00Z",{checkout_state:"completed"}),
  event("g2","page_view","2026-09-11T10:00:00Z",{page_path:"/ceramic-coating",source:"google"}),
  event("g2","booking_step_view","2026-09-11T10:02:00Z",{page_path:"/book",payload:{step_number:1}}),
  event("l1","page_view","2026-09-12T10:00:00Z",{page_path:"/paint-correction",referrer:"https://example.com"}),
  event("l1","booking_step_view","2026-09-12T10:02:00Z",{page_path:"/book",payload:{step_number:1}}),
  event("l1","checkout_started","2026-09-12T10:05:00Z",{checkout_state:"started"}),
  event("x1","page_view","2026-09-13T10:00:00Z",{page_path:"/about",referrer:"https://www.google.com/"})
];

const attribution=deriveSameSessionConversionAttribution(events,true,false);
assert.equal(attribution.available,true);
assert.equal(attribution.sessions_observed,4);
assert.equal(attribution.cohorts.google_referral.sessions,3);
assert.equal(attribution.cohorts.google_referral.booking_start_sessions,2);
assert.equal(attribution.cohorts.google_referral.checkout_completed_sessions,1);
assert.equal(attribution.cohorts.local_target_landing.sessions,3);
assert.equal(attribution.cohorts.google_referral_local_target_landing.sessions,2);
assert.equal(attribution.target_landing_pages.length,3);
assert.equal(attribution.persisted_booking_outcome_joined,false);
assert.equal(attribution.customer_identity_joined,false);
assert.equal(attribution.causal_attribution_claimed,false);

const providerRefresh={
  status:"observed",
  reconciliation:{
    first_party:{
      available:true,
      window_start:"2026-08-22",
      window_end:"2026-09-20",
      google_referral_events:20,
      target_local_service_page_views:55
    }
  },
  providers:[
    {
      provider:"search_console",
      provider_label:"Google Search Console",
      classification:"observed",
      evidence_state:"observed_snapshot",
      identity:{observed_at:"2026-09-20T12:00:00.000Z",period_start:"2026-08-22",period_end:"2026-09-19"},
      first_party_window_overlap:true
    },
    {
      provider:"google_business_profile",
      provider_label:"Google Business Profile",
      classification:"owner_action",
      evidence_state:"stale_observed_snapshot",
      identity:{observed_at:"2026-07-01T12:00:00.000Z",period_start:"2026-06-01",period_end:"2026-06-30"},
      first_party_window_overlap:false
    }
  ],
  actions:["Refresh the dated Google Business Profile snapshot."]
};

const report=buildLocalSearchMeasurementConversionAttribution({
  provider_refresh:providerRefresh,
  events,
  events_available:true,
  events_truncated_possible:false,
  generated_at:"2026-09-20T16:00:00.000Z"
});
assert.equal(report.build,450);
assert.equal(report.authority,"local_search_measurement_conversion_attribution");
assert.equal(report.status,"observed");
assert.equal(report.summary.provider_observed_count,1);
assert.equal(report.summary.provider_hold_count,1);
assert.equal(report.conversion_attribution.cohorts.google_referral.sessions,3);
assert.equal(report.truth_boundary.search_console_click_to_session_join,false);
assert.equal(report.truth_boundary.gbp_action_to_session_join,false);
assert.equal(report.truth_boundary.provider_metric_to_booking_join,false);
assert.equal(report.truth_boundary.anonymous_session_to_customer_identity_join,false);
assert.equal(report.truth_boundary.persisted_booking_attributed_to_anonymous_session,false);
assert.equal(report.boundaries.analytics_write_performed,false);
assert.equal(report.boundaries.provider_contact_performed,false);
assert.equal(report.boundaries.provider_snapshot_write_performed,false);
assert.equal(report.boundaries.permanent_polling,false);

const unavailable=buildLocalSearchMeasurementConversionAttribution({
  provider_refresh:{status:"provider_dependent",reconciliation:{first_party:{available:false}},providers:[]},
  events_available:false
});
assert.equal(unavailable.status,"unavailable");
assert.equal(unavailable.conversion_attribution.available,false);
assert.equal(unavailable.conversion_attribution.causal_attribution_claimed,false);

console.log("LOCAL SEARCH MEASUREMENT & CONVERSION ATTRIBUTION TEST: PASS");
