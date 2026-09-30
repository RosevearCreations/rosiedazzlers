#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity } from "../functions/api/_lib/service-economics-seasonal-capacity-reliability-decision-outcome-continuity.js";

const ready=(owning,count)=>({status:"bounded_domain_decision_review_ready",decision_review_ready:true,comparable_window_evidence:true,owning_status:owning,comparison_count:count,automatic_action_authorized:false});
const readiness={
  decision_readiness_build:514,
  decision_readiness_authority:"service_economics_seasonal_capacity_reliability_decision_readiness",
  status:"bounded_decision_readiness_review_ready",decision_ready:true,
  retained_build504_status:"bounded_trend_continuity_review_ready",
  domains:{
    explicit_allocation:ready("bounded_continuity_observed",2),
    seasonal_operability:ready("bounded_continuity_observed",3),
    observed_capacity:ready("bounded_continuity_observed",2),
    technical_reliability:ready("bounded_continuity_observed",4)
  },
  adjacent_external_evidence:{provider_cost_quota_status:"unavailable",recovery_status:"retained_hold"}
};

const missing=buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity({decision_readiness:readiness,generated_at:"2026-09-30T17:30:00Z"});
assert.equal(missing.decision_outcome_build,524);
assert.equal(missing.source_recognized,true);
assert.equal(missing.status,"bounded_decision_outcome_continuity_review_required");
assert.equal(missing.rows.every(r=>r.status==="decision_outcome_required"),true);
assert.equal(missing.truth_boundary.missing_comparable_history_remains_insufficient,true);
assert.equal(missing.truth_boundary.cross_domain_substitution_allowed,false);

const records={records:{}};
for(const row of missing.rows){
  records.records[row.domain]={
    outcome:row.domain==="explicit_allocation"?"retain_current_controls":row.domain==="seasonal_operability"?"retain_hold":"bounded_manual_follow_up",
    reviewed_by:"owner-review",reviewed_at:"2026-09-30T17:35:00Z",
    outcome_reference:`build524-${row.domain}-001`,
    readiness_trace_key:row.retained_decision_readiness.expected_readiness_trace_key,
    outcome_observed:true,independent_domain_evidence_reviewed:true,cross_domain_substitution_rejected:true,
    missing_comparable_history_not_overridden:true,truth_boundaries_reviewed:true
  };
}
const observed=buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity({decision_readiness:readiness,decision_outcome_records:records});
assert.equal(observed.status,"bounded_decision_outcome_continuity_observed");
assert.equal(observed.observed_decision_outcome_count,4);
assert.equal(observed.rows.find(r=>r.domain==="explicit_allocation").status,"retain_current_controls_outcome_observed");
assert.equal(observed.rows.find(r=>r.domain==="seasonal_operability").status,"retain_hold_outcome_observed");
assert.equal(observed.rows.find(r=>r.domain==="observed_capacity").status,"bounded_manual_follow_up_outcome_observed");
assert.equal(observed.rows.find(r=>r.domain==="technical_reliability").truth_boundary.provider_billing_cpu_or_quota_inferred,false);
assert.equal(observed.rows.find(r=>r.domain==="seasonal_operability").truth_boundary.seasonal_outcome_proves_broad_winter_availability,false);
assert.equal(observed.boundaries.automatic_price_or_discount_change_allowed,false);
assert.equal(observed.boundaries.automatic_booking_or_availability_change_allowed,false);
assert.equal(observed.boundaries.automatic_capacity_or_scaling_change_allowed,false);
assert.equal(observed.boundaries.canonical_hold_mutation_allowed,false);
assert.equal(observed.boundaries.permanent_polling_allowed,false);

const wrong=structuredClone(records);wrong.records.explicit_allocation.readiness_trace_key="wrong-trace";
assert.equal(buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity({decision_readiness:readiness,decision_outcome_records:wrong}).rows.find(r=>r.domain==="explicit_allocation").status,"decision_outcome_evidence_conflict");
const incomplete=structuredClone(records);incomplete.records.observed_capacity.truth_boundaries_reviewed=false;
assert.equal(buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity({decision_readiness:readiness,decision_outcome_records:incomplete}).rows.find(r=>r.domain==="observed_capacity").status,"decision_outcome_review_incomplete");
const notReady=structuredClone(readiness);notReady.domains.seasonal_operability={status:"insufficient_comparable_history",decision_review_ready:false,comparable_window_evidence:false,owning_status:"insufficient_comparable_history",comparison_count:0};
assert.equal(buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity({decision_readiness:notReady,decision_outcome_records:records}).rows.find(r=>r.domain==="seasonal_operability").status,"decision_readiness_not_review_ready");
const unavailable=buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity({});
assert.equal(unavailable.status,"evidence_sources_unavailable");
assert.equal(unavailable.source_recognized,false);
assert.equal(unavailable.truth_boundary.provider_billing_cpu_or_quota_inferred,false);
assert.equal(unavailable.truth_boundary.recovery_success_inferred,false);
console.log("BUILD 524 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY DECISION OUTCOME CONTINUITY TEST: PASS");
