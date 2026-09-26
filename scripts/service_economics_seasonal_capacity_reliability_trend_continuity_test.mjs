#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildServiceEconomicsSeasonalCapacityReliabilityTrendContinuity } from "../functions/api/_lib/service-economics-seasonal-capacity-reliability-trend-continuity.js";

const sources = {
  service_economics_review:{ available:true, restricted:false },
  reliability_review:{ available:true, restricted:false }
};
const economics = {
  economics:{
    allocation_evidence_closure:{ status:"observed", service_package_closed:true, add_on_closed:true, service_package_gap_count:0, add_on_gap_count:0 },
    cold_weather_capability_matrix:{ status:"observed", valid_row_count:3, gap_count:0, counts:{ cold_snap_capable:1, temperature_limited_outdoor:1, controlled_environment_required:1, exact_temperature_limit:1 } },
    weather_safe_routing:{ status:"prepared" },
    allocation_continuity_evidence:{ rows:[
      { observed_at:"2026-08-31T20:00:00Z", cohort_kind:"service_package", cohort_key:"basic", explicit_linkage_complete:true, source_reference:"allocation-aug" },
      { observed_at:"2026-09-24T20:00:00Z", cohort_kind:"service_package", cohort_key:"basic", explicit_linkage_complete:true, source_reference:"allocation-sep" }
    ]},
    seasonal_operability_continuity_evidence:{ rows:[
      { observed_at:"2026-08-31T20:00:00Z", service_code:"interior", classification:"cold_snap_capable", source_reference:"process-aug" },
      { observed_at:"2026-09-24T20:00:00Z", service_code:"interior", classification:"cold_snap_capable", source_reference:"process-sep" }
    ]}
  },
  capacity:{
    evidence_status:"observed",
    capacity_claim_allowed:true,
    availability_authority:"/api/availability",
    collision_revalidation_authority:"/api/checkout",
    observed_capacity_continuity_evidence:{ rows:[
      { observed_at:"2026-08-31T20:00:00Z", metric:"completed_jobs_per_day", unit:"jobs", value:1, live_observation:true, source_reference:"capacity-aug" },
      { observed_at:"2026-09-24T20:00:00Z", metric:"completed_jobs_per_day", unit:"jobs", value:1, live_observation:true, source_reference:"capacity-sep" }
    ]}
  }
};
const reliability = {
  continuity_review:{
    status:"bounded_continuity_evidence_available",
    technical_availability:{ status:"bounded_first_party_continuity_observed" },
    provider_cost_quota:{ status:"external_provider_evidence_required" },
    recovery:{ status:"recovery_observation_evidence_required" },
    field_operability:{ status:"observed" }
  },
  trend_review:{
    first_party_traffic:{
      comparable_window_evidence:true,
      current_window:"most_recent_24h",
      comparison_window:"preceding_six_day_daily_average",
      current_events_24h:120,
      prior_six_day_average:80,
      recent_to_prior_ratio:1.5,
      direction:"higher_than_prior_six_day_average"
    }
  }
};

const ready = buildServiceEconomicsSeasonalCapacityReliabilityTrendContinuity({
  economics_review:economics,
  reliability_review:reliability,
  source_status:sources,
  generated_at:"2026-09-25T20:00:00Z"
});
assert.equal(ready.build,504);
assert.equal(ready.authority,"service_economics_seasonal_capacity_reliability_trend_continuity");
assert.equal(ready.review_status,"bounded_trend_continuity_review_ready");
assert.equal(ready.review_ready,true);
assert.equal(ready.domain_continuity.explicit_allocation.comparable_window_evidence,true);
assert.equal(ready.domain_continuity.seasonal_operability.comparable_window_evidence,true);
assert.equal(ready.domain_continuity.observed_capacity.comparable_window_evidence,true);
assert.equal(ready.domain_continuity.technical_reliability.comparable_window_evidence,true);
assert.equal(ready.domain_continuity.observed_capacity.comparisons[0].future_capacity_inferred,false);
assert.equal(ready.truth_boundary.provider_cost_or_quota_inferred,false);
assert.equal(ready.truth_boundary.seasonal_operability_continuity_proves_broad_winter_availability,false);
assert.equal(ready.truth_boundary.southern_ontario_field_restriction_is_application_reliability_failure,false);
assert.equal(ready.boundaries.permanent_polling,false);

const gaps = buildServiceEconomicsSeasonalCapacityReliabilityTrendContinuity({
  economics_review:{
    economics:{
      allocation_evidence_closure:{ status:"observed", service_package_closed:true, add_on_closed:true },
      cold_weather_capability_matrix:{ status:"observed", valid_row_count:1, gap_count:0, counts:{} }
    },
    capacity:{ evidence_status:"observed", capacity_claim_allowed:true }
  },
  reliability_review:{ continuity_review:{ status:"bounded_continuity_evidence_available" }, trend_review:{} },
  source_status:sources
});
assert.equal(gaps.review_status,"bounded_trend_continuity_review_required");
assert.equal(gaps.review_ready,false);
assert.equal(gaps.review_gaps.length,4);
assert.equal(gaps.domain_continuity.seasonal_operability.status,"insufficient_comparable_seasonal_history");
assert.equal(gaps.truth_boundary.unrelated_evidence_classes_joined_for_trend,false);

const unavailable = buildServiceEconomicsSeasonalCapacityReliabilityTrendContinuity({
  source_status:{
    service_economics_review:{ available:false, restricted:false },
    reliability_review:{ available:true, restricted:false }
  }
});
assert.equal(unavailable.review_status,"evidence_sources_unavailable");
assert.equal(unavailable.review_ready,false);

console.log("BUILD 504 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY TREND CONTINUITY TEST: PASS");
