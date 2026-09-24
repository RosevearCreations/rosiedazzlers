#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildServiceEconomicsSeasonalOperationsReliabilityReview } from "../functions/api/_lib/service-economics-seasonal-operations-reliability-review.js";

const sources = {
  service_economics_review: { available:true, restricted:false },
  reliability_review: { available:true, restricted:false }
};
const ready = buildServiceEconomicsSeasonalOperationsReliabilityReview({
  economics_review:{
    economics:{
      allocation_evidence_closure:{
        status:"observed", service_package_closed:true, add_on_closed:true,
        service_package_gap_count:0, add_on_gap_count:0
      },
      cold_weather_capability_matrix:{
        status:"observed", valid_row_count:3, gap_count:0,
        counts:{ cold_snap_capable:1, temperature_limited_outdoor:1, controlled_environment_required:1, exact_temperature_limit:2 }
      },
      weather_safe_routing:{ status:"prepared" }
    },
    capacity:{
      evidence_status:"observed",
      capacity_claim_allowed:true,
      availability_authority:"/api/availability",
      collision_revalidation_authority:"/api/checkout"
    }
  },
  reliability_review:{
    continuity_review:{
      status:"bounded_continuity_evidence_available",
      technical_availability:{ status:"bounded_first_party_continuity_observed" },
      provider_cost_quota:{ status:"external_provider_evidence_required" },
      recovery:{ status:"recovery_observation_evidence_required" },
      field_operability:{ status:"observed" }
    }
  },
  source_status:sources,
  generated_at:"2026-09-24T22:00:00Z"
});
assert.equal(ready.build,494);
assert.equal(ready.authority,"service_economics_seasonal_operations_reliability_review");
assert.equal(ready.review_status,"bounded_reconciliation_review_ready");
assert.equal(ready.review_ready,true);
assert.equal(ready.domain_review.seasonal_operations.temperature_limited_outdoor_count,1);
assert.equal(ready.domain_review.operational_capacity.observed_capacity_evidence_present,true);
assert.equal(ready.domain_review.reliability_continuity.provider_billing_cpu_or_quota_inferred,false);
assert.equal(ready.truth_boundary.source_runtime_green_proves_recovery_success,false);
assert.equal(ready.truth_boundary.seasonal_restriction_is_application_reliability_failure,false);
assert.equal(ready.boundaries.automatic_price_or_discount_change_allowed,false);
assert.equal(ready.boundaries.automatic_booking_or_availability_change_allowed,false);
assert.equal(ready.boundaries.automatic_production_restore_allowed,false);

const gaps = buildServiceEconomicsSeasonalOperationsReliabilityReview({
  economics_review:{
    economics:{
      allocation_evidence_closure:{ status:"review", service_package_closed:false, add_on_closed:false },
      cold_weather_capability_matrix:{ status:"review", valid_row_count:0, gap_count:2, counts:{} }
    },
    capacity:{ evidence_status:"unavailable", capacity_claim_allowed:false }
  },
  reliability_review:{ continuity_review:{ status:"partial_continuity_evidence" } },
  source_status:sources
});
assert.equal(gaps.review_status,"bounded_reconciliation_review_required");
assert.equal(gaps.review_ready,false);
assert.equal(gaps.review_gaps.length,4);
assert.equal(gaps.truth_boundary.unrelated_evidence_may_close_missing_domain_evidence,false);

const unavailable = buildServiceEconomicsSeasonalOperationsReliabilityReview({
  source_status:{
    service_economics_review:{ available:false, restricted:false },
    reliability_review:{ available:true, restricted:false }
  }
});
assert.equal(unavailable.review_status,"evidence_sources_unavailable");
assert.equal(unavailable.review_ready,false);
assert.equal(unavailable.boundaries.permanent_polling,false);

console.log("BUILD 494 SERVICE ECONOMICS, SEASONAL OPERATIONS & RELIABILITY REVIEW TEST: PASS");
