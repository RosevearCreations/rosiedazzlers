#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildReliabilitySecurityCostReassessment } from "../functions/api/_lib/reliability-security-cost-reassessment.js";
import { buildReliabilityCostResilienceTrendReview } from "../functions/api/_lib/reliability-cost-resilience-trend-review.js";

const generated="2026-09-22T02:00:00.000Z";
const reassessment=buildReliabilitySecurityCostReassessment({
  generated_at:generated,
  reliability:{
    diagnostics:{state:"stable",duration_ms:700,failed_checks:0,degraded_checks:0},
    traffic:{state:"watch",events_24h:180,events_7d:600,recent_to_prior_ratio:2.57}
  },
  security:{
    security:{state:"ready"},sessions:{state:"ready"},privacy:{state:"ready"},recovery:{state:"owner_action"}
  },
  readiness:{items:[{id:"runtime",name:"Runtime",classification:"runtime_proven",evidence:{latest_accepted_at:"2026-09-21T02:00:00.000Z"}}]},
  source_status:{
    reliability_performance_cost_capacity:{available:true},
    security_privacy_recovery_drill:{available:true},
    go_live_readiness:{available:true}
  }
});

const review=buildReliabilityCostResilienceTrendReview({
  reassessment,
  reliability:{
    generated_at:generated,
    diagnostics:{state:"stable",duration_ms:700,failed_checks:0,degraded_checks:0},
    traffic:{state:"watch",events_24h:180,events_7d:600,prior_six_day_average:70,recent_to_prior_ratio:2.57}
  },
  generated_at:generated
});
assert.equal(review.trend_enrichment_build,474);
assert.equal(review.trend_authority,"reliability_cost_resilience_trend_review");
assert.equal(review.release_enrichment_build,464);
assert.equal(review.trend_review.first_party_traffic.comparable_window_evidence,true);
assert.equal(review.trend_review.first_party_traffic.direction,"higher_than_prior_six_day_average");
assert.equal(review.trend_review.first_party_traffic.prior_six_day_average,70);
assert.equal(review.trend_review.first_party_traffic.provider_cost_established,false);
assert.equal(review.trend_review.first_party_traffic.scaling_need_established,false);
assert.equal(review.trend_review.diagnostics.trend_established,false);
assert.equal(review.trend_review.evidence_freshness.trend_established,false);
assert.equal(review.trend_review.provider_cost_quota.status,"external_evidence_required");
assert.equal(review.trend_review.provider_cost_trend_established,false);
assert.equal(review.trend_review.real_recovery_trend_established,false);
assert.equal(review.truth_boundary.bounded_window_comparison_is_capacity_forecast,false);
assert.equal(review.truth_boundary.traffic_direction_proves_provider_cost,false);
assert.equal(review.boundaries.permanent_polling,false);
assert.equal(review.boundaries.trend_storage_mutation_allowed,false);

const flat=buildReliabilityCostResilienceTrendReview({
  reassessment,
  reliability:{traffic:{events_24h:100,events_7d:700,prior_six_day_average:100,recent_to_prior_ratio:1}},
  generated_at:generated
});
assert.equal(flat.trend_review.first_party_traffic.direction,"within_comparable_band");

const incomplete=buildReliabilityCostResilienceTrendReview({
  reassessment,
  reliability:{traffic:{events_24h:20}},
  generated_at:generated
});
assert.equal(incomplete.trend_review.first_party_traffic.comparable_window_evidence,false);
assert.equal(incomplete.trend_review.first_party_traffic.direction,"insufficient_comparable_evidence");
assert.equal(incomplete.trend_review.forecast_established,false);

console.log("BUILD 474 RELIABILITY COST RESILIENCE TREND REVIEW TEST: PASS");
