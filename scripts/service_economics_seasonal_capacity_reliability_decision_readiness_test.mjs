#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildServiceEconomicsSeasonalCapacityReliabilityDecisionReadiness } from "../functions/api/_lib/service-economics-seasonal-capacity-reliability-decision-readiness.js";

const readySource={
  review_status:"bounded_trend_continuity_review_ready",
  review_ready:true,
  domain_continuity:{
    explicit_allocation:{status:"comparable_explicit_allocation_continuity_observed",comparable_window_evidence:true,comparisons:[{cohort:"service_package:basic"}]},
    seasonal_operability:{status:"comparable_seasonal_operability_continuity_observed",comparable_window_evidence:true,comparisons:[{service_code:"interior"}]},
    observed_capacity:{status:"comparable_observed_capacity_continuity_observed",comparable_window_evidence:true,comparisons:[{metric:"completed_jobs_per_day:jobs"}]},
    technical_reliability:{status:"bounded_first_party_technical_continuity_observed",comparable_window_evidence:true}
  },
  adjacent_external_evidence:{
    provider_cost_quota_status:"external_provider_evidence_required",
    recovery_status:"recovery_observation_evidence_required"
  }
};

const ready=buildServiceEconomicsSeasonalCapacityReliabilityDecisionReadiness({
  trend_continuity:readySource,
  generated_at:"2026-09-27T03:00:00Z"
});
assert.equal(ready.decision_readiness_build,514);
assert.equal(ready.decision_readiness_authority,"service_economics_seasonal_capacity_reliability_decision_readiness");
assert.equal(ready.status,"bounded_decision_readiness_review_ready");
assert.equal(ready.decision_ready,true);
assert.equal(ready.decision_package.operator_review_required,true);
assert.equal(ready.decision_package.default_if_no_operator_action,"retain_current_controls_and_holds");
assert.deepEqual(ready.decision_package.ready_domains,["explicit_allocation","seasonal_operability","observed_capacity","technical_reliability"]);
assert.deepEqual(ready.decision_package.insufficient_domains,[]);
assert.equal(ready.decision_package.cross_domain_substitution_allowed,false);
assert.equal(ready.truth_boundary.provider_billing_cpu_or_quota_inferred,false);
assert.equal(ready.truth_boundary.recovery_success_inferred,false);
assert.equal(ready.truth_boundary.observed_capacity_proves_future_capacity,false);
assert.equal(ready.truth_boundary.working_temperature_threshold_inferred,false);
assert.equal(ready.truth_boundary.seasonal_operability_proves_broad_winter_availability,false);
assert.equal(ready.boundaries.canonical_hold_mutation_allowed,false);
assert.equal(ready.boundaries.permanent_polling_allowed,false);

const missingSeasonal=structuredClone(readySource);
missingSeasonal.review_status="bounded_trend_continuity_review_required";
missingSeasonal.review_ready=false;
missingSeasonal.domain_continuity.seasonal_operability={
  status:"insufficient_comparable_seasonal_history",
  comparable_window_evidence:false,
  comparisons:[]
};
const gaps=buildServiceEconomicsSeasonalCapacityReliabilityDecisionReadiness({trend_continuity:missingSeasonal});
assert.equal(gaps.status,"bounded_decision_readiness_review_required");
assert.equal(gaps.decision_ready,false);
assert.equal(gaps.domains.seasonal_operability.status,"insufficient_comparable_history");
assert.equal(gaps.domains.explicit_allocation.decision_review_ready,true);
assert.deepEqual(gaps.decision_package.insufficient_domains,["seasonal_operability"]);
assert.equal(gaps.truth_boundary.cross_domain_evidence_used_to_close_gap,false);
assert.equal(gaps.decision_package.automatic_action_authorized,false);

const unavailable=buildServiceEconomicsSeasonalCapacityReliabilityDecisionReadiness({
  trend_continuity:{review_status:"evidence_sources_unavailable",review_ready:false,domain_continuity:{}}
});
assert.equal(unavailable.status,"evidence_sources_unavailable");
assert.equal(unavailable.decision_ready,false);
assert.equal(unavailable.decision_package.ready_domains.length,0);
assert.equal(unavailable.decision_package.insufficient_domains.length,4);

console.log("BUILD 514 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY DECISION READINESS TEST: PASS");
