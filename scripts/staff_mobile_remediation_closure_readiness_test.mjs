#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildStaffMobileRemediationClosureReadiness } from "../functions/api/_lib/staff-mobile-remediation-closure-readiness.js";

const sourceSummary={state:"bounded_descriptive_interpretation_follow_up_ready"};
const sourceRows=[{
  evidence_id:"outcome-503-001",
  area:"mobile_stage_cohort",
  pattern:"detailer_stage_arrival",
  interpretation_status:"descriptive_follow_up_required",
  context:{
    measure_definition:"steps_per_representative_task",
    owning_workflow_scope:"detailer_mobile_workflow",
    role_scope:"detailer",
    device_browser_context:"android_chrome_mobile",
    window_or_sample_definition:"five_representative_tasks"
  },
  confounders:{materially_like_for_like:true,material_confounders_recorded:true,material_confounders:[]},
  weather_site:{
    classification:"not_applicable",
    evidence_reference:null,
    explicitly_classified:true,
    separate_from_staff_mobile_friction:true
  },
  claims:{remediation_effective:null,causation:null,staff_fault:null,device_fault:null,business_impact:null}
}];

const noSource=buildStaffMobileRemediationClosureReadiness({
  interpretation_summary:sourceSummary,interpretation_rows:sourceRows
});
assert.equal(noSource.summary.state,"closure_evidence_source_required");
assert.equal(noSource.rows[0].status,"closure_evidence_source_required");

const baseEvidence={
  closure_evidence_id:"closure-513-001",
  source_interpretation_evidence_id:"outcome-503-001",
  observed_at:"2026-09-27T02:00:00Z",
  observation_protocol_reference:"protocol-503-v1-repeat",
  measure_definition:"steps_per_representative_task",
  owning_workflow_scope:"detailer_mobile_workflow",
  role_scope:"detailer",
  device_browser_context:"android_chrome_mobile",
  window_or_sample_definition:"five_representative_tasks",
  material_confounders_recorded:true,
  material_confounders:[],
  weather_site:{classification:"not_applicable"}
};

const ready=buildStaffMobileRemediationClosureReadiness({
  interpretation_summary:sourceSummary,
  interpretation_rows:sourceRows,
  closure_evidence:[baseEvidence],
  closure_source_available:true
});
assert.equal(ready.summary.state,"bounded_closure_readiness_review_ready");
assert.equal(ready.summary.closure_ready_count,1);
assert.equal(ready.rows[0].status,"bounded_closure_readiness_review_ready");
assert.equal(ready.rows[0].closure_readiness.review_ready,true);
assert.equal(ready.rows[0].closure_readiness.closure_performed,false);
assert.equal(ready.rows[0].closure_readiness.remediation_effective,null);
assert.equal(ready.rows[0].closure_readiness.causation,null);
assert.equal(ready.rows[0].truth_boundary.staff_fault_inferred,false);
assert.equal(ready.rows[0].truth_boundary.device_fault_inferred,false);
assert.equal(ready.boundaries.automatic_remediation_closure_allowed,false);

const mismatch=structuredClone(baseEvidence);
mismatch.device_browser_context="ios_safari_mobile";
const mismatchResult=buildStaffMobileRemediationClosureReadiness({
  interpretation_summary:sourceSummary,interpretation_rows:sourceRows,closure_evidence:[mismatch],closure_source_available:true
});
assert.equal(mismatchResult.rows[0].status,"like_for_like_closure_evidence_required");

const confounded=structuredClone(baseEvidence);
confounded.material_confounders=["different route mix"];
const confoundedResult=buildStaffMobileRemediationClosureReadiness({
  interpretation_summary:sourceSummary,interpretation_rows:sourceRows,closure_evidence:[confounded],closure_source_available:true
});
assert.equal(confoundedResult.rows[0].status,"material_confounder_review_required");
assert.equal(confoundedResult.rows[0].closure_readiness.review_ready,false);

const unattributable=structuredClone(baseEvidence);
unattributable.observation_protocol_reference="";
const unattributableResult=buildStaffMobileRemediationClosureReadiness({
  interpretation_summary:sourceSummary,interpretation_rows:sourceRows,closure_evidence:[unattributable],closure_source_available:true
});
assert.equal(unattributableResult.rows[0].status,"closure_follow_up_unattributable");

const weatherRows=structuredClone(sourceRows);
weatherRows[0].weather_site.classification="temperature_limited_outdoor";
weatherRows[0].weather_site.evidence_reference="weather-source-503";
const weatherEvidence=structuredClone(baseEvidence);
weatherEvidence.weather_site={classification:"temperature_limited_outdoor",evidence_reference:"weather-source-513"};
const weatherReady=buildStaffMobileRemediationClosureReadiness({
  interpretation_summary:sourceSummary,interpretation_rows:weatherRows,closure_evidence:[weatherEvidence],closure_source_available:true
});
assert.equal(weatherReady.rows[0].status,"bounded_closure_readiness_review_ready");
assert.equal(weatherReady.rows[0].truth_boundary.weather_site_constraint_proves_staff_or_mobile_friction,false);
assert.equal(weatherReady.rows[0].truth_boundary.service_temperature_limit_inferred,false);

const sourceHeld=buildStaffMobileRemediationClosureReadiness({
  interpretation_summary:{state:"outcome_evidence_not_review_ready"},
  interpretation_rows:[],
  closure_evidence:[baseEvidence],
  closure_source_available:true
});
assert.equal(sourceHeld.summary.state,"interpretation_not_review_ready");

console.log("BUILD 513 STAFF & MOBILE REMEDIATION CLOSURE READINESS TEST: PASS");
