#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildControlledEnvironmentSiteQualificationServiceRoutingEvidence } from "../functions/api/_lib/controlled-environment-site-qualification-service-routing-evidence.js";

const commonReview={
  capability_evidence_current:true,
  owner_review_decision:"approve_public_claim_review",
  owner_reviewed_at:"2026-09-24T18:00:00-04:00",
  owner_review_reference:"owner-review-496",
  activation_readiness_owner_decision:"approve_activation_readiness_review",
  activation_reviewed_at:"2026-09-24T20:00:00-04:00",
  activation_review_reference:"owner-review-497"
};
const economics={
  totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
  rows:[],
  seasonal_operability_evidence:{rows:[
    {
      ...commonReview,
      package_code:"premium_wash",classification:"temperature_limited_outdoor",
      evidence_source_type:"product",evidence_source:"wash-product-tds",
      minimum_working_temperature_c:5,exact_temperature_claim_supported:true,
      controlled_environment_alternative_supported:true,
      controlled_environment_source_type:"site",
      controlled_environment_reference:"heated-bay-option",
      booking_rule_candidate:"temperature_limited_current_conditions_check",
      quote_rule_candidate:"quote_with_source_owned_temperature_limit",
      controlled_environment_site_reference:"site-bay-A",controlled_environment_site_evidence_current:true,controlled_environment_site_suitable:true,
      controlled_environment_workflow_reference:"wash-indoor-sop",controlled_environment_workflow_evidence_current:true,controlled_environment_workflow_supported:true,
      controlled_environment_equipment_reference:"heated-water-equipment",controlled_environment_equipment_evidence_current:true,controlled_environment_equipment_supported:true,
      controlled_environment_product_reference:"wash-product-tds",controlled_environment_product_evidence_current:true,controlled_environment_product_supported:true
    },
    {
      ...commonReview,
      add_on_code:"ceramic",classification:"controlled_environment_required",
      evidence_source_type:"process",evidence_source:"ceramic-process",
      indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"ceramic-indoor-sop",
      booking_rule_candidate:"controlled_environment_only",
      quote_rule_candidate:"quote_for_controlled_environment_only",
      controlled_environment_site_reference:"site-bay-B",controlled_environment_site_evidence_current:true,controlled_environment_site_suitable:true,
      controlled_environment_workflow_reference:"ceramic-indoor-sop",controlled_environment_workflow_evidence_current:true,controlled_environment_workflow_supported:true,
      controlled_environment_product_reference:"ceramic-product-tds",controlled_environment_product_evidence_current:true,controlled_environment_product_supported:true
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

const report=buildControlledEnvironmentSiteQualificationServiceRoutingEvidence({economics});
const q=report.economics.controlled_environment_site_qualification;
assert.equal(report.controlled_environment_site_qualification_build,498);
assert.equal(report.controlled_environment_site_qualification_authority,"controlled_environment_site_qualification_service_routing_evidence");
assert.equal(q.row_count,3);
assert.equal(q.counts.controlled_environment_candidate,2);
assert.equal(q.counts.controlled_environment_site_qualified,1);
assert.equal(q.counts.qualification_evidence_required,1);
const wash=q.rows.find(row=>row.code==="premium_wash");
assert.equal(wash.qualification_state,"controlled_environment_site_qualified");
assert.equal(wash.service_routing_state,"controlled_environment_route_review_ready");
assert.equal(wash.automatic_appointment_move_authorized,false);
const ceramic=q.rows.find(row=>row.code==="ceramic");
assert.equal(ceramic.qualification_state,"qualification_evidence_required");
assert.ok(q.gaps.find(g=>g.code==="ceramic")?.missing.includes("equipment_reference"));
assert.equal(ceramic.service_routing_state,"controlled_environment_site_confirmation_required");
const interior=q.rows.find(row=>row.code==="interior");
assert.equal(interior.qualification_state,"not_applicable");
assert.equal(q.universal_indoor_capability_authorized,false);
assert.equal(report.truth_boundary.one_qualified_service_proves_universal_indoor_capability,false);
assert.equal(report.boundaries.automatic_appointment_move_allowed,false);
console.log("BUILD 498 CONTROLLED-ENVIRONMENT SITE QUALIFICATION & SERVICE ROUTING EVIDENCE TEST: PASS");
