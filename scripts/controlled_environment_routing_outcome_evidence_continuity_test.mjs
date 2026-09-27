#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildControlledEnvironmentRoutingOutcomeEvidenceContinuity } from "../functions/api/_lib/controlled-environment-routing-outcome-evidence-continuity.js";

const commonReview={
  capability_evidence_current:true,
  owner_review_decision:"approve_public_claim_review",
  owner_reviewed_at:"2026-09-26T14:00:00-04:00",
  owner_review_reference:"owner-review-496",
  activation_readiness_owner_decision:"approve_activation_readiness_review",
  activation_reviewed_at:"2026-09-26T14:05:00-04:00",
  activation_review_reference:"owner-review-497",
  public_claim_activation_decision:"approve_public_claim_activation",
  public_claim_activation_reviewed_at:"2026-09-26T14:10:00-04:00",
  public_claim_activation_reference:"owner-review-506",
  public_claim_activation_wording_confirmed:true,
  winter_rule_customer_transparency_confirmed:true,
  winter_rule_controlled_activation_decision:"approve_controlled_activation",
  winter_rule_controlled_activation_reviewed_at:"2026-09-26T14:15:00-04:00",
  winter_rule_controlled_activation_reference:"owner-review-507"
};
const qualified={
  controlled_environment_site_reference:"site-bay-A",
  controlled_environment_site_evidence_current:true,
  controlled_environment_site_suitable:true,
  controlled_environment_workflow_reference:"indoor-sop",
  controlled_environment_workflow_evidence_current:true,
  controlled_environment_workflow_supported:true,
  controlled_environment_equipment_reference:"indoor-equipment",
  controlled_environment_equipment_evidence_current:true,
  controlled_environment_equipment_supported:true,
  controlled_environment_product_reference:"product-tds",
  controlled_environment_product_evidence_current:true,
  controlled_environment_product_supported:true,
  controlled_environment_routing_continuity_reference:"routing-runbook",
  controlled_environment_routing_continuity_evidence_current:true,
  controlled_environment_site_confirmation_practice_reference:"site-confirmation-practice",
  controlled_environment_site_confirmation_practice_current:true,
  manual_safe_reschedule_practice_reference:"safe-reschedule-practice",
  manual_safe_reschedule_practice_current:true
};

const rows=[
  {
    ...commonReview,...qualified,
    package_code:"premium_wash",classification:"temperature_limited_outdoor",
    evidence_source_type:"product",evidence_source:"wash-product-tds",
    minimum_working_temperature_c:5,exact_temperature_claim_supported:true,
    controlled_environment_alternative_supported:true,
    controlled_environment_source_type:"site",controlled_environment_reference:"heated-bay-option",
    booking_rule_candidate:"temperature_limited_current_conditions_check",
    quote_rule_candidate:"quote_with_source_owned_temperature_limit",
    controlled_environment_routing_outcome:"routed_to_confirmed_site",
    controlled_environment_routing_outcome_observed_at:"2026-09-27T10:00:00-04:00",
    controlled_environment_routing_outcome_reference:"route-log-518-wash",
    controlled_environment_routing_outcome_site_reference:"site-bay-A",
    controlled_environment_site_confirmation_observed_at:"2026-09-27T09:55:00-04:00",
    controlled_environment_site_confirmation_observation_reference:"site-confirmation-518-wash"
  },
  {
    ...commonReview,...qualified,
    add_on_code:"ceramic",classification:"controlled_environment_required",
    evidence_source_type:"process",evidence_source:"ceramic-process",
    indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"ceramic-indoor-sop",
    booking_rule_candidate:"controlled_environment_only",
    quote_rule_candidate:"quote_for_controlled_environment_only",
    controlled_environment_routing_outcome:"safe_rescheduled",
    controlled_environment_routing_outcome_observed_at:"2026-09-27T10:20:00-04:00",
    controlled_environment_routing_outcome_reference:"route-log-518-ceramic",
    controlled_environment_safe_reschedule_observed_at:"2026-09-27T10:22:00-04:00",
    controlled_environment_safe_reschedule_reference:"safe-reschedule-518-ceramic"
  },
  {
    ...commonReview,...qualified,
    service_code:"paint_correction",classification:"controlled_environment_required",
    evidence_source_type:"process",evidence_source:"paint-process",
    indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"paint-indoor-sop",
    booking_rule_candidate:"controlled_environment_only",
    quote_rule_candidate:"quote_for_controlled_environment_only",
    controlled_environment_product_evidence_current:false,
    controlled_environment_routing_outcome:"routed_to_confirmed_site",
    controlled_environment_routing_outcome_observed_at:"2026-09-27T10:40:00-04:00",
    controlled_environment_routing_outcome_reference:"route-log-518-paint",
    controlled_environment_routing_outcome_site_reference:"site-bay-A",
    controlled_environment_site_confirmation_observed_at:"2026-09-27T10:35:00-04:00",
    controlled_environment_site_confirmation_observation_reference:"site-confirmation-518-paint"
  },
  {
    ...commonReview,
    package_code:"interior",classification:"cold_snap_capable",
    evidence_source_type:"process",evidence_source:"interior-process",
    booking_rule_candidate:"allow_with_current_conditions_check",
    quote_rule_candidate:"quote_with_current_conditions_disclosure"
  }
];

const economics={
  totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
  rows:[],
  seasonal_operability_evidence:{rows}
};

const report=buildControlledEnvironmentRoutingOutcomeEvidenceContinuity({economics});
const continuity=report.economics.controlled_environment_routing_outcome_continuity;
assert.equal(report.controlled_environment_routing_outcome_build,518);
assert.equal(report.controlled_environment_routing_outcome_authority,"controlled_environment_routing_outcome_evidence_continuity");
assert.equal(report.retained_operational_readiness_authority,"controlled_environment_operational_readiness_routing_continuity");
assert.equal(continuity.row_count,4);
assert.equal(continuity.counts.controlled_environment_candidate,3);
assert.equal(continuity.counts.route_outcome_observed,1);
assert.equal(continuity.counts.safe_reschedule_outcome_observed,1);
assert.equal(continuity.counts.routing_outcome_evidence_conflict,1);

const wash=continuity.rows.find(row=>row.code==="premium_wash");
assert.equal(wash.outcome_state,"route_outcome_observed");
assert.equal(wash.route_outcome_observed,true);
assert.equal(wash.current_site_workflow_equipment_product_evidence,true);
assert.equal(wash.qualified_site_reference_matches_observed_route,true);

const ceramic=continuity.rows.find(row=>row.code==="ceramic");
assert.equal(ceramic.outcome_state,"safe_reschedule_outcome_observed");
assert.equal(ceramic.safe_reschedule_outcome_observed,true);
assert.equal(ceramic.safe_reschedule_reference,"safe-reschedule-518-ceramic");

const paint=continuity.rows.find(row=>row.code==="paint_correction");
assert.equal(paint.outcome_state,"routing_outcome_evidence_conflict");
assert.equal(paint.current_site_workflow_equipment_product_evidence,false);
assert.ok(continuity.gaps.find(g=>g.code==="paint_correction")?.missing.includes("current_site_workflow_equipment_product_evidence"));

const interior=continuity.rows.find(row=>row.code==="interior");
assert.equal(interior.outcome_state,"not_applicable");

assert.equal(continuity.one_successful_route_establishes_universal_indoor_capability,false);
assert.equal(continuity.one_successful_route_establishes_future_capacity,false);
assert.equal(report.truth_boundary.routing_outcome_is_observed_not_inferred,true);
assert.equal(report.truth_boundary.one_successful_route_proves_future_capacity,false);
assert.equal(report.boundaries.automatic_routing_allowed,false);
assert.equal(report.boundaries.automatic_reschedule_allowed,false);
console.log("BUILD 518 CONTROLLED-ENVIRONMENT ROUTING OUTCOME EVIDENCE CONTINUITY TEST: PASS");
