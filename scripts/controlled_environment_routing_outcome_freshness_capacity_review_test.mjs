#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildControlledEnvironmentRoutingOutcomeFreshnessCapacityReview } from "../functions/api/_lib/controlled-environment-routing-outcome-freshness-capacity-review.js";

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
const rows=[
  {...commonReview,...qualified,package_code:"premium_wash",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wash-product-tds",minimum_working_temperature_c:5,exact_temperature_claim_supported:true,controlled_environment_alternative_supported:true,controlled_environment_source_type:"site",controlled_environment_reference:"heated-bay-option",booking_rule_candidate:"temperature_limited_current_conditions_check",quote_rule_candidate:"quote_with_source_owned_temperature_limit",controlled_environment_routing_outcome:"routed_to_confirmed_site",controlled_environment_routing_outcome_observed_at:"2026-09-29T10:00:00-04:00",controlled_environment_routing_outcome_reference:"route-log-518-wash",controlled_environment_routing_outcome_site_reference:"site-bay-A",controlled_environment_site_confirmation_observed_at:"2026-09-30T09:55:00-04:00",controlled_environment_site_confirmation_observation_reference:"site-confirmation-518-wash",controlled_environment_observed_capacity_jobs:3,controlled_environment_capacity_observed_at:"2026-09-30T18:00:00-04:00",controlled_environment_capacity_observation_reference:"capacity-log-wash",controlled_environment_capacity_observation_window_days:7,controlled_environment_capacity_observation_site_reference:"site-bay-A"},
  {...commonReview,...qualified,add_on_code:"ceramic",classification:"controlled_environment_required",evidence_source_type:"process",evidence_source:"ceramic-process",indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"ceramic-indoor-sop",booking_rule_candidate:"controlled_environment_only",quote_rule_candidate:"quote_for_controlled_environment_only",controlled_environment_routing_outcome:"safe_rescheduled",controlled_environment_routing_outcome_observed_at:"2026-09-29T10:20:00-04:00",controlled_environment_routing_outcome_reference:"route-log-518-ceramic",controlled_environment_safe_reschedule_observed_at:"2026-09-29T10:22:00-04:00",controlled_environment_safe_reschedule_reference:"safe-reschedule-518-ceramic"},
  {...commonReview,...qualified,service_code:"paint_correction",classification:"controlled_environment_required",evidence_source_type:"process",evidence_source:"paint-process",indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"paint-indoor-sop",booking_rule_candidate:"controlled_environment_only",quote_rule_candidate:"quote_for_controlled_environment_only",controlled_environment_routing_outcome:"routed_to_confirmed_site",controlled_environment_routing_outcome_observed_at:"2026-08-01T10:40:00-04:00",controlled_environment_routing_outcome_reference:"route-log-518-paint",controlled_environment_routing_outcome_site_reference:"site-bay-A",controlled_environment_site_confirmation_observed_at:"2026-09-30T10:35:00-04:00",controlled_environment_site_confirmation_observation_reference:"site-confirmation-518-paint"},
  {...commonReview,...qualified,add_on_code:"wax",classification:"controlled_environment_required",evidence_source_type:"process",evidence_source:"wax-process",indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"wax-indoor-sop",booking_rule_candidate:"controlled_environment_only",quote_rule_candidate:"quote_for_controlled_environment_only",controlled_environment_product_evidence_current:false,controlled_environment_routing_outcome:"routed_to_confirmed_site",controlled_environment_routing_outcome_observed_at:"2026-09-30T11:00:00-04:00",controlled_environment_routing_outcome_reference:"route-log-518-wax",controlled_environment_routing_outcome_site_reference:"site-bay-A",controlled_environment_site_confirmation_observed_at:"2026-09-30T10:55:00-04:00",controlled_environment_site_confirmation_observation_reference:"site-confirmation-518-wax"},
  {...commonReview,...qualified,add_on_code:"polish",classification:"controlled_environment_required",evidence_source_type:"process",evidence_source:"polish-process",indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"polish-indoor-sop",booking_rule_candidate:"controlled_environment_only",quote_rule_candidate:"quote_for_controlled_environment_only",controlled_environment_routing_outcome:"routed_to_confirmed_site",controlled_environment_routing_outcome_observed_at:"2026-09-30T11:20:00-04:00",controlled_environment_routing_outcome_reference:"route-log-518-polish",controlled_environment_routing_outcome_site_reference:"site-bay-A",controlled_environment_site_confirmation_observed_at:"2026-09-30T11:15:00-04:00",controlled_environment_site_confirmation_observation_reference:"site-confirmation-518-polish",controlled_environment_observed_capacity_jobs:2,controlled_environment_capacity_observed_at:"2026-08-01T18:00:00-04:00",controlled_environment_capacity_observation_reference:"capacity-log-polish",controlled_environment_capacity_observation_window_days:7,controlled_environment_capacity_observation_site_reference:"site-bay-A"}
];
const economics={totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},rows:[],seasonal_operability_evidence:{rows}};
const report=buildControlledEnvironmentRoutingOutcomeFreshnessCapacityReview({economics,generated_at:"2026-10-01T12:00:00-04:00",freshness_window_days:30});
const review=report.economics.controlled_environment_routing_outcome_freshness_capacity_review;
assert.equal(report.controlled_environment_routing_freshness_capacity_build,528);
assert.equal(report.controlled_environment_routing_freshness_capacity_authority,"controlled_environment_routing_outcome_freshness_capacity_review");
assert.equal(review.row_count,5);
assert.equal(review.counts.route_outcome_current,2);
assert.equal(review.counts.safe_reschedule_outcome_current,1);
assert.equal(review.counts.stale_or_drift_review,2);
assert.equal(review.counts.bounded_observed_capacity_current,1);
assert.equal(review.counts.capacity_not_observed,3);
assert.equal(review.counts.capacity_review_required,1);
assert.equal(review.counts.manual_review_required,3);
assert.equal(review.rows.find(r=>r.code==="premium_wash")?.routing_freshness_state,"route_outcome_current");
assert.equal(review.rows.find(r=>r.code==="premium_wash")?.capacity_state,"bounded_observed_capacity_current");
assert.equal(review.rows.find(r=>r.code==="ceramic")?.routing_freshness_state,"safe_reschedule_outcome_current");
assert.equal(review.rows.find(r=>r.code==="ceramic")?.capacity_state,"capacity_not_observed");
assert.equal(review.rows.find(r=>r.code==="paint_correction")?.routing_freshness_state,"stale_routing_outcome_review_required");
assert.equal(review.rows.find(r=>r.code==="wax")?.routing_freshness_state,"service_site_workflow_drift_review_required");
assert.equal(review.rows.find(r=>r.code==="polish")?.routing_freshness_state,"route_outcome_current");
assert.equal(review.rows.find(r=>r.code==="polish")?.capacity_state,"stale_observed_capacity_review_required");
assert.equal(review.rows.find(r=>r.code==="premium_wash")?.observed_capacity_establishes_future_capacity,false);
assert.equal(report.truth_boundary.capacity_may_be_inferred_from_successful_route,false);
assert.equal(report.boundaries.automatic_capacity_reservation_allowed,false);
assert.equal(report.boundaries.automatic_appointment_move_allowed,false);
console.log("BUILD 528 CONTROLLED-ENVIRONMENT ROUTING OUTCOME FRESHNESS & CAPACITY REVIEW TEST: PASS");
