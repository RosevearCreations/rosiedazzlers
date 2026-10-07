#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildControlledEnvironmentRoutingOutcomeFreshnessCapacityReview } from "../functions/api/_lib/controlled-environment-routing-outcome-freshness-capacity-review.js";
import { buildControlledEnvironmentRoutingCapacityEvidenceIntegrityReview } from "../functions/api/_lib/controlled-environment-routing-capacity-evidence-integrity-review.js";

const commonReview={
  capability_evidence_current:true,
  owner_review_decision:"approve_public_claim_review",owner_reviewed_at:"2026-09-26T14:00:00-04:00",owner_review_reference:"owner-review-496",
  activation_readiness_owner_decision:"approve_activation_readiness_review",activation_reviewed_at:"2026-09-26T14:05:00-04:00",activation_review_reference:"owner-review-497",
  public_claim_activation_decision:"approve_public_claim_activation",public_claim_activation_reviewed_at:"2026-09-26T14:10:00-04:00",public_claim_activation_reference:"owner-review-506",public_claim_activation_wording_confirmed:true,
  winter_rule_customer_transparency_confirmed:true,winter_rule_controlled_activation_decision:"approve_controlled_activation",winter_rule_controlled_activation_reviewed_at:"2026-09-26T14:15:00-04:00",winter_rule_controlled_activation_reference:"owner-review-507"
};
const qualified={
  controlled_environment_site_reference:"site-bay-A",controlled_environment_site_evidence_current:true,controlled_environment_site_suitable:true,
  controlled_environment_workflow_reference:"indoor-sop",controlled_environment_workflow_evidence_current:true,controlled_environment_workflow_supported:true,
  controlled_environment_equipment_reference:"indoor-equipment",controlled_environment_equipment_evidence_current:true,controlled_environment_equipment_supported:true,
  controlled_environment_product_reference:"product-tds",controlled_environment_product_evidence_current:true,controlled_environment_product_supported:true,
  controlled_environment_routing_continuity_reference:"routing-runbook",controlled_environment_routing_continuity_evidence_current:true,
  controlled_environment_site_confirmation_practice_reference:"site-confirmation-practice",controlled_environment_site_confirmation_practice_current:true,
  manual_safe_reschedule_practice_reference:"safe-reschedule-practice",manual_safe_reschedule_practice_current:true
};
const route=(code,kind="add_on",capacity=false)=>({
  ...commonReview,...qualified,
  [kind==="package"?"package_code":kind==="service"?"service_code":"add_on_code"]:code,
  classification:kind==="package"?"temperature_limited_outdoor":"controlled_environment_required",
  evidence_source_type:"process",evidence_source:code+"-process",
  controlled_environment_alternative_supported:kind==="package",
  controlled_environment_source_type:"site",controlled_environment_reference:"heated-bay-option",
  indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:code+"-indoor-sop",
  booking_rule_candidate:"controlled_environment_only",quote_rule_candidate:"quote_for_controlled_environment_only",
  controlled_environment_routing_outcome:"routed_to_confirmed_site",
  controlled_environment_routing_outcome_observed_at:"2026-10-02T10:00:00-04:00",
  controlled_environment_routing_outcome_reference:"route-518-"+code,
  controlled_environment_routing_outcome_site_reference:"site-bay-A",
  controlled_environment_site_confirmation_observed_at:"2026-10-03T09:55:00-04:00",
  controlled_environment_site_confirmation_observation_reference:"confirm-518-"+code,
  ...(capacity?{
    controlled_environment_observed_capacity_jobs:3,
    controlled_environment_capacity_observed_at:"2026-10-03T18:00:00-04:00",
    controlled_environment_capacity_observation_reference:"capacity-"+code,
    controlled_environment_capacity_observation_window_days:7,
    controlled_environment_capacity_observation_site_reference:"site-bay-A"
  }:{})
});
const safe=(code)=>({
  ...commonReview,...qualified,add_on_code:code,classification:"controlled_environment_required",
  evidence_source_type:"process",evidence_source:code+"-process",
  indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:code+"-indoor-sop",
  booking_rule_candidate:"controlled_environment_only",quote_rule_candidate:"quote_for_controlled_environment_only",
  controlled_environment_routing_outcome:"safe_rescheduled",
  controlled_environment_routing_outcome_observed_at:"2026-10-02T10:20:00-04:00",
  controlled_environment_routing_outcome_reference:"route-518-"+code,
  controlled_environment_safe_reschedule_observed_at:"2026-10-02T10:22:00-04:00",
  controlled_environment_safe_reschedule_reference:"safe-518-"+code
});
const rows=[
  route("premium_wash","package",true),
  safe("ceramic"),
  route("paint_correction","service"),
  route("wax"),
  safe("polish"),
  route("graphene","add_on",true)
];
const economics={totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},rows:[],seasonal_operability_evidence:{rows}};
const pre=buildControlledEnvironmentRoutingOutcomeFreshnessCapacityReview({economics,generated_at:"2026-10-06T12:00:00-04:00",freshness_window_days:30});
for(const source of rows){
  const code=source.package_code||source.add_on_code||source.service_code;
  const retained=pre.economics.controlled_environment_routing_outcome_freshness_capacity_review.rows.find(row=>row.code===code);
  source.controlled_environment_outcome_service_classification=source.classification;
  source.controlled_environment_outcome_site_reference=retained.expected_site_reference;
  source.controlled_environment_outcome_workflow_reference=source.controlled_environment_workflow_reference||source.indoor_workflow_reference;
  source.controlled_environment_outcome_routing_state=retained.current_routing_outcome;
  source.controlled_environment_outcome_routing_reference=retained.routing_outcome_reference;
  source.controlled_environment_outcome_site_confirmation_reference=retained.current_site_confirmation_reference||"";
  source.controlled_environment_outcome_safe_reschedule_reference=retained.safe_reschedule_reference||"";
  source.controlled_environment_outcome_capacity_state_snapshot=retained.capacity_state;
  source.controlled_environment_outcome_capacity_observation_reference=retained.capacity_observation_reference||"";
  source.controlled_environment_outcome_capacity_observation_site_reference=retained.capacity_observation_site_reference||"";
  source.controlled_environment_outcome_capacity_observation_window_days=retained.capacity_observation_window_days;
  source.controlled_environment_outcome_observed_capacity_jobs=retained.observed_capacity_jobs;
}
rows[1].controlled_environment_outcome_workflow_reference="different-workflow";
rows[2].controlled_environment_outcome_routing_reference="";
rows[3].controlled_environment_outcome_site_confirmation_reference="different-confirmation";
rows[4].controlled_environment_outcome_safe_reschedule_reference="different-safe-reschedule";
rows[5].controlled_environment_outcome_observed_capacity_jobs=4;

const report=buildControlledEnvironmentRoutingCapacityEvidenceIntegrityReview({economics,generated_at:"2026-10-06T12:00:00-04:00",freshness_window_days:30});
const review=report.economics.controlled_environment_routing_capacity_evidence_integrity_review;
assert.equal(report.controlled_environment_routing_capacity_integrity_build,538);
assert.equal(report.controlled_environment_routing_capacity_integrity_authority,"controlled_environment_routing_capacity_evidence_integrity_review");
assert.equal(review.row_count,6);
assert.equal(review.counts.integrity_current,1);
assert.equal(review.counts.service_site_workflow_identity_review,1);
assert.equal(review.counts.routing_outcome_identity_review,1);
assert.equal(review.counts.site_confirmation_identity_review,1);
assert.equal(review.counts.safe_reschedule_identity_review,1);
assert.equal(review.counts.bounded_capacity_context_identity_review,1);
assert.equal(review.counts.review_required,5);
assert.equal(review.rows.find(r=>r.code==="premium_wash")?.integrity_state,"integrity_current");
assert.equal(review.rows.find(r=>r.code==="ceramic")?.integrity_state,"service_site_workflow_identity_drift_review_required");
assert.equal(review.rows.find(r=>r.code==="paint_correction")?.integrity_state,"routing_outcome_identity_review_required");
assert.equal(review.rows.find(r=>r.code==="wax")?.integrity_state,"site_confirmation_identity_drift_review_required");
assert.equal(review.rows.find(r=>r.code==="polish")?.integrity_state,"safe_reschedule_identity_drift_review_required");
assert.equal(review.rows.find(r=>r.code==="graphene")?.integrity_state,"bounded_capacity_context_identity_drift_review_required");
assert.equal(review.universal_indoor_capability_authorized,false);
assert.equal(review.future_capacity_authorized,false);
assert.equal(report.truth_boundary.successful_route_proves_another_service_safe_operability,false);
assert.equal(report.boundaries.automatic_capacity_reservation_allowed,false);
assert.equal(report.boundaries.storage_mutation_allowed,false);
assert.equal(report.boundaries.persistent_telemetry_allowed,false);
console.log("BUILD 538 CONTROLLED-ENVIRONMENT ROUTING & CAPACITY EVIDENCE INTEGRITY REVIEW TEST: PASS");
