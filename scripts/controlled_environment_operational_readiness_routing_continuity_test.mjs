#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildControlledEnvironmentOperationalReadinessRoutingContinuity } from "../functions/api/_lib/controlled-environment-operational-readiness-routing-continuity.js";

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
  controlled_environment_product_supported:true
};
const economics={
  totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
  rows:[],
  seasonal_operability_evidence:{rows:[
    {
      ...commonReview,...qualified,
      package_code:"premium_wash",classification:"temperature_limited_outdoor",
      evidence_source_type:"product",evidence_source:"wash-product-tds",
      minimum_working_temperature_c:5,exact_temperature_claim_supported:true,
      controlled_environment_alternative_supported:true,
      controlled_environment_source_type:"site",controlled_environment_reference:"heated-bay-option",
      booking_rule_candidate:"temperature_limited_current_conditions_check",
      quote_rule_candidate:"quote_with_source_owned_temperature_limit",
      controlled_environment_routing_continuity_reference:"routing-runbook-wash",
      controlled_environment_routing_continuity_evidence_current:true,
      controlled_environment_site_confirmation_practice_reference:"site-confirmation-wash",
      controlled_environment_site_confirmation_practice_current:true,
      manual_safe_reschedule_practice_reference:"safe-reschedule-wash",
      manual_safe_reschedule_practice_current:true
    },
    {
      ...commonReview,...qualified,
      add_on_code:"ceramic",classification:"controlled_environment_required",
      evidence_source_type:"process",evidence_source:"ceramic-process",
      indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"ceramic-indoor-sop",
      booking_rule_candidate:"controlled_environment_only",
      quote_rule_candidate:"quote_for_controlled_environment_only",
      controlled_environment_routing_continuity_reference:"routing-runbook-ceramic",
      controlled_environment_routing_continuity_evidence_current:true,
      controlled_environment_site_confirmation_practice_reference:"site-confirmation-ceramic",
      controlled_environment_site_confirmation_practice_current:true
    },
    {
      ...commonReview,
      service_code:"paint_correction",classification:"controlled_environment_required",
      evidence_source_type:"process",evidence_source:"paint-process",
      indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"paint-indoor-sop",
      booking_rule_candidate:"controlled_environment_only",
      quote_rule_candidate:"quote_for_controlled_environment_only",
      controlled_environment_site_reference:"site-bay-C",
      controlled_environment_site_evidence_current:true,
      controlled_environment_site_suitable:true,
      controlled_environment_workflow_reference:"paint-indoor-sop",
      controlled_environment_workflow_evidence_current:true,
      controlled_environment_workflow_supported:true,
      controlled_environment_product_reference:"polish-tds",
      controlled_environment_product_evidence_current:true,
      controlled_environment_product_supported:true,
      controlled_environment_routing_continuity_reference:"routing-runbook-paint",
      controlled_environment_routing_continuity_evidence_current:true,
      controlled_environment_site_confirmation_practice_reference:"site-confirmation-paint",
      controlled_environment_site_confirmation_practice_current:true,
      manual_safe_reschedule_practice_reference:"safe-reschedule-paint",
      manual_safe_reschedule_practice_current:true
    },
    {
      ...commonReview,
      package_code:"interior",classification:"cold_snap_capable",
      evidence_source_type:"process",evidence_source:"interior-process",
      booking_rule_candidate:"allow_with_current_conditions_check",
      quote_rule_candidate:"quote_with_current_conditions_disclosure"
    }
  ]}
};

const report=buildControlledEnvironmentOperationalReadinessRoutingContinuity({economics});
const readiness=report.economics.controlled_environment_operational_readiness;
assert.equal(report.controlled_environment_operational_readiness_build,508);
assert.equal(report.controlled_environment_operational_readiness_authority,"controlled_environment_operational_readiness_routing_continuity");
assert.equal(readiness.row_count,4);
assert.equal(readiness.counts.controlled_environment_candidate,3);
assert.equal(readiness.counts.retained_site_qualified,2);
assert.equal(readiness.counts.operational_review_ready,1);
assert.equal(readiness.counts.routing_continuity_evidence_required,1);
assert.equal(readiness.counts.qualification_or_site_confirmation_required,1);

const wash=readiness.rows.find(row=>row.code==="premium_wash");
assert.equal(wash.operational_readiness_state,"controlled_environment_operational_review_ready");
assert.equal(wash.controlled_environment_operational_review_ready,true);
assert.equal(wash.manual_site_confirmation_required,true);
assert.equal(wash.automatic_appointment_move_authorized,false);

const ceramic=readiness.rows.find(row=>row.code==="ceramic");
assert.equal(ceramic.operational_readiness_state,"routing_continuity_evidence_required");
assert.ok(readiness.gaps.find(g=>g.code==="ceramic")?.missing.includes("manual_safe_reschedule_practice_reference"));

const paint=readiness.rows.find(row=>row.code==="paint_correction");
assert.equal(paint.operational_readiness_state,"qualification_or_site_confirmation_required");
assert.ok(readiness.gaps.find(g=>g.code==="paint_correction")?.missing.includes("build498_service_specific_site_qualification"));

const interior=readiness.rows.find(row=>row.code==="interior");
assert.equal(interior.operational_readiness_state,"not_applicable");
assert.equal(report.truth_boundary.qualified_service_site_proves_universal_indoor_capability,false);
assert.equal(report.truth_boundary.manual_site_confirmation_may_be_skipped,false);
assert.equal(report.boundaries.automatic_appointment_move_allowed,false);
console.log("BUILD 508 CONTROLLED-ENVIRONMENT OPERATIONAL READINESS & ROUTING CONTINUITY TEST: PASS");
