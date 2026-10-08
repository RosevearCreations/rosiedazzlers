import assert from "node:assert/strict";
import {buildServiceEconomicsSeasonalCapacityReliabilityEvidenceIntegrityReview as review} from "../functions/api/_lib/service-economics-seasonal-capacity-reliability-evidence-integrity-review.js";
const domains=["explicit_allocation","seasonal_operability","observed_capacity","technical_reliability"];
const t={build:504,authority:"service_economics_seasonal_capacity_reliability_trend_continuity",domain_continuity:{}};
const r={decision_readiness_build:514,decision_readiness_authority:"service_economics_seasonal_capacity_reliability_decision_readiness",domains:{}};
const o={decision_outcome_build:524,decision_outcome_authority:"service_economics_seasonal_capacity_reliability_decision_outcome_continuity",source_recognized:true,rows:[]};
const f={service_economics_seasonal_capacity_reliability_freshness_build:534,service_economics_seasonal_capacity_reliability_freshness_authority:"service_economics_seasonal_capacity_reliability_evidence_freshness_review",source_recognized:true,generated_at:"2026-10-08T12:00:00Z",rows:[]};
const sample=[
 {status:"comparable_explicit_allocation_continuity_observed",comparable_window_evidence:true,comparisons:[{cohort:"add_on:ceramic",prior_observed_at:"2026-10-01T12:00:00Z",current_observed_at:"2026-10-07T12:00:00Z",prior_explicit_linkage_complete:true,current_explicit_linkage_complete:true}]},
 {status:"comparable_seasonal_operability_continuity_observed",comparable_window_evidence:true,comparisons:[{service_code:"exterior_wash",prior_observed_at:"2026-10-01T12:00:00Z",current_observed_at:"2026-10-07T12:00:00Z",prior_classification:"temperature_limited_outdoor",current_classification:"temperature_limited_outdoor"}]},
 {status:"comparable_observed_capacity_continuity_observed",comparable_window_evidence:true,comparisons:[{metric:"jobs:per_day",prior_observed_at:"2026-10-01T12:00:00Z",current_observed_at:"2026-10-07T12:00:00Z",prior_value:1,current_value:1}]},
 {status:"bounded_first_party_technical_continuity_observed",comparable_window_evidence:true,first_party_only:true,current_window:"24h",comparison_window:"six_day_average",current_events_24h:21,prior_six_day_average:20,recent_to_prior_ratio:1.05}
];
for(const [i,domain] of domains.entries()){
 t.domain_continuity[domain]=sample[i];r.domains[domain]={status:"bounded_domain_decision_review_ready",owning_status:sample[i].status,decision_review_ready:true,comparable_window_evidence:true,comparison_count:1};
 const choice=i===1?"retain_hold":"retain_current_controls",reviewed_at="2026-10-07T14:00:00.000Z";
 o.rows.push({domain,status:choice+"_outcome_observed",retained_decision_readiness:{...r.domains[domain],expected_readiness_trace_key:"trace-"+domain},human_decision_outcome:{outcome:choice,outcome_observed:true,attributable:true,trace_matches:true,review_complete:true,independent_domain_evidence_reviewed:true,cross_domain_substitution_rejected:true,missing_comparable_history_not_overridden:true,truth_boundaries_reviewed:true,readiness_trace_key:"trace-"+domain,outcome_reference:"review-"+domain,reviewed_at}});
 f.rows.push({domain,retained_outcome_status:choice+"_outcome_observed",freshness_state:choice+"_evidence_current",current_readiness:{...r.domains[domain],trace_current:true},current_same_domain_evidence:{comparable_window_evidence:true,evidence_current:true,latest_observed_at:i===3?"2026-10-07T12:00:00.000Z":"2026-10-07T12:00:00.000Z"},owner_decision:{outcome:choice,outcome_observed:true,review_current:true,outcome_reference:"review-"+domain,reviewed_at}});
}
function run(ff=f,oo=o,rr=r,tt=t){return review({freshness_review:ff,decision_outcome_continuity:oo,decision_readiness:rr,trend_continuity:tt,generated_at:"2026-10-08T12:00:00Z"});}
assert.equal(run().status,"service_economics_integrity_current");
assert.equal(run().review_required_count,0);
const cross=structuredClone(t);cross.domain_continuity.observed_capacity.comparisons=t.domain_continuity.seasonal_operability.comparisons;
assert.equal(run(f,o,r,cross).status,"service_economics_same_domain_comparison_review_required");
const changed=structuredClone(t);changed.domain_continuity.seasonal_operability.comparisons[0].current_classification="unowned_cold_capability";
assert.equal(run(f,o,r,changed).status,"service_economics_same_domain_comparison_review_required");
const noHistory=structuredClone(t);noHistory.domain_continuity.explicit_allocation.comparable_window_evidence=false;
assert.equal(run(f,o,r,noHistory).status,"service_economics_same_domain_comparison_review_required");
const provider=structuredClone(t);provider.domain_continuity.technical_reliability.first_party_only=false;
assert.equal(run(f,o,r,provider).status,"service_economics_same_domain_comparison_review_required");
const drift=structuredClone(o);drift.rows[0].human_decision_outcome.readiness_trace_key="changed";
assert.equal(run(f,drift).status,"service_economics_outcome_readiness_trace_review_required");
const duplicate=structuredClone(f);duplicate.rows.push(duplicate.rows[0]);
assert.equal(run(duplicate).status,"service_economics_domain_set_identity_review_required");
const stale=structuredClone(f);stale.generated_at="2026-10-07T12:00:00Z";
assert.equal(run(stale).status,"service_economics_freshness_snapshot_review_required");
assert.equal(run({}).status,"service_economics_integrity_source_unavailable");
assert.equal(run().truth_boundary.canonical_hold_mutated,false);
assert.equal(run().truth_boundary.provider_billing_cpu_quota_inferred,false);
console.log("BUILD 544 SERVICE ECONOMICS EVIDENCE INTEGRITY: PASS");
