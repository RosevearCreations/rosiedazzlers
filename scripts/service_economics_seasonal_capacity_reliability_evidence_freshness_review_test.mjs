#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview } from "../functions/api/_lib/service-economics-seasonal-capacity-reliability-evidence-freshness-review.js";

const domains=["explicit_allocation","seasonal_operability","observed_capacity","technical_reliability"];
const readiness={decision_readiness_build:514,decision_readiness_authority:"service_economics_seasonal_capacity_reliability_decision_readiness",domains:{}};
const trend={build:504,authority:"service_economics_seasonal_capacity_reliability_trend_continuity",generated_at:"2026-10-03T12:00:00Z",domain_continuity:{}};
const outcome={decision_outcome_build:524,decision_outcome_authority:"service_economics_seasonal_capacity_reliability_decision_outcome_continuity",rows:[]};

for(const [i,domain] of domains.entries()){
  readiness.domains[domain]={status:"bounded_domain_decision_review_ready",decision_review_ready:true,comparable_window_evidence:true,owning_status:"bounded_continuity_observed",comparison_count:2};
  trend.domain_continuity[domain]=domain==="technical_reliability"
    ? {status:"bounded_first_party_technical_continuity_observed",comparable_window_evidence:true,current_window:"last_24h",comparison_window:"prior_6d"}
    : {status:"bounded_continuity_observed",comparable_window_evidence:true,comparisons:[{current_observed_at:"2026-10-02T12:00:00Z"}]};
  const choice=i===0?"retain_current_controls":i===1?"retain_hold":"bounded_manual_follow_up";
  outcome.rows.push({
    domain,
    status:choice+"_outcome_observed",
    retained_decision_readiness:{status:"bounded_domain_decision_review_ready",decision_review_ready:true,comparable_window_evidence:true,owning_status:"bounded_continuity_observed",comparison_count:2,expected_readiness_trace_key:"trace-"+domain},
    human_decision_outcome:{outcome:choice,reviewed_at:"2026-10-02T13:00:00Z",outcome_reference:"build534-"+domain,outcome_observed:true,attributable:true,trace_matches:true,review_complete:true}
  });
}

const current=buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview({
  decision_outcome_continuity:outcome,decision_readiness:readiness,trend_continuity:trend,
  generated_at:"2026-10-04T12:00:00Z",freshness_window_days:30
});
assert.equal(current.service_economics_seasonal_capacity_reliability_freshness_build,534);
assert.equal(current.source_recognized,true);
assert.equal(current.current_domain_count,4);
assert.equal(current.review_required_count,0);
assert.equal(current.rows.find(r=>r.domain==="explicit_allocation").freshness_state,"retain_current_controls_evidence_current");
assert.equal(current.rows.find(r=>r.domain==="seasonal_operability").freshness_state,"retain_hold_evidence_current");
assert.equal(current.rows.find(r=>r.domain==="observed_capacity").freshness_state,"bounded_manual_follow_up_evidence_current");
assert.equal(current.rows.find(r=>r.domain==="technical_reliability").current_same_domain_evidence.evidence_current,true);
assert.equal(current.truth_boundary.provider_billing_cpu_or_quota_inferred,false);
assert.equal(current.truth_boundary.future_capacity_inferred,false);
assert.equal(current.truth_boundary.working_temperature_threshold_inferred,false);

const staleEvidence=structuredClone(trend);
staleEvidence.domain_continuity.explicit_allocation.comparisons[0].current_observed_at="2026-07-01T12:00:00Z";
assert.equal(buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview({
  decision_outcome_continuity:outcome,decision_readiness:readiness,trend_continuity:staleEvidence,generated_at:"2026-10-04T12:00:00Z"
}).rows.find(r=>r.domain==="explicit_allocation").freshness_state,"retained_same_domain_evidence_freshness_review_required");

const staleOwner=structuredClone(outcome);
staleOwner.rows.find(r=>r.domain==="seasonal_operability").human_decision_outcome.reviewed_at="2026-07-01T12:00:00Z";
assert.equal(buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview({
  decision_outcome_continuity:staleOwner,decision_readiness:readiness,trend_continuity:trend,generated_at:"2026-10-04T12:00:00Z"
}).rows.find(r=>r.domain==="seasonal_operability").freshness_state,"owner_decision_outcome_freshness_review_required");

const missingHistory=structuredClone(trend);
missingHistory.domain_continuity.observed_capacity.comparable_window_evidence=false;
assert.equal(buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview({
  decision_outcome_continuity:outcome,decision_readiness:readiness,trend_continuity:missingHistory,generated_at:"2026-10-04T12:00:00Z"
}).rows.find(r=>r.domain==="observed_capacity").freshness_state,"insufficient_comparable_history_review_required");

const drift=structuredClone(readiness);
drift.domains.explicit_allocation.comparison_count=3;
assert.equal(buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview({
  decision_outcome_continuity:outcome,decision_readiness:drift,trend_continuity:trend,generated_at:"2026-10-04T12:00:00Z"
}).rows.find(r=>r.domain==="explicit_allocation").freshness_state,"decision_readiness_trace_drift_review_required");

const unavailable=buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview({});
assert.equal(unavailable.source_recognized,false);
assert.equal(unavailable.truth_boundary.cross_domain_substitution_allowed,false);
assert.equal(unavailable.truth_boundary.permanent_polling,false);

console.log("BUILD 534 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY EVIDENCE FRESHNESS REVIEW TEST: PASS");
