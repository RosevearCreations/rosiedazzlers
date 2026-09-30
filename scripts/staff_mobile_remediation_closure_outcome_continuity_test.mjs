#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildStaffMobileRemediationClosureOutcomeContinuity } from "../functions/api/_lib/staff-mobile-remediation-closure-outcome-continuity.js";

const readiness={
  closure_readiness_build:513,
  closure_readiness_authority:"staff_mobile_remediation_closure_readiness",
  summary:{state:"bounded_closure_readiness_review_ready"},
  rows:[{
    evidence_id:"outcome-503-001",
    area:"mobile_stage_cohort",
    pattern:"detailer_stage_arrival",
    status:"bounded_closure_readiness_review_ready",
    retained_context:{
      measure_definition:"steps_per_representative_task",
      owning_workflow_scope:"detailer_mobile_workflow",
      role_scope:"detailer",
      device_browser_context:"android_chrome_mobile",
      window_or_sample_definition:"five_representative_tasks"
    },
    closure_evidence:{
      matching_row_count:1,
      attributable_row_count:1,
      materially_like_for_like_row_count:1,
      unconfounded_like_for_like_row_count:1,
      rows:[{closure_evidence_id:"closure-513-001",observed_at:"2026-09-29T14:00:00Z",material_confounders_recorded:true,material_confounders:[],weather_site:{classification:"not_applicable",evidence_reference:null}}]
    },
    closure_readiness:{review_ready:true,closure_performed:false,remediation_effective:null,causation:null,staff_fault:null,device_fault:null,business_impact:null}
  }]
};

const missing=buildStaffMobileRemediationClosureOutcomeContinuity({closure_readiness:readiness,generated_at:"2026-09-30T12:00:00Z"});
assert.equal(missing.closure_outcome_build,523);
assert.equal(missing.source_recognized,true);
assert.equal(missing.rows[0].status,"closure_outcome_required");
assert.ok(missing.rows[0].retained_closure_readiness.expected_readiness_trace_key);
assert.equal(missing.rows[0].truth_boundary.remediation_effective,null);
assert.equal(missing.boundaries.automatic_remediation_closure_allowed,false);

const trace=missing.rows[0].retained_closure_readiness.expected_readiness_trace_key;
const baseRecord={
  outcome:"close",reviewed_by:"owner-review",reviewed_at:"2026-09-30T12:05:00Z",outcome_reference:"staff-mobile-closure-523-001",
  readiness_trace_key:trace,outcome_observed:true,context_reviewed:true,material_confounders_reviewed:true,weather_site_context_reviewed:true
};
const closed=buildStaffMobileRemediationClosureOutcomeContinuity({closure_readiness:readiness,closure_outcome_records:{records:{"outcome-503-001":baseRecord}}});
assert.equal(closed.rows[0].status,"closure_outcome_observed");
assert.equal(closed.rows[0].outcome_boundary.manual_closure_outcome_observed,true);
assert.equal(closed.rows[0].outcome_boundary.automatic_closure_performed,false);
assert.equal(closed.rows[0].truth_boundary.causation,null);
assert.equal(closed.rows[0].truth_boundary.staff_fault,null);
assert.equal(closed.rows[0].truth_boundary.device_fault,null);
assert.equal(closed.rows[0].truth_boundary.business_impact,null);
assert.equal(closed.rows[0].truth_boundary.canonical_hold_mutated,false);

const retainedOpen=structuredClone(baseRecord); retainedOpen.outcome="retain_open";
const open=buildStaffMobileRemediationClosureOutcomeContinuity({closure_readiness:readiness,closure_outcome_records:{records:{"outcome-503-001":retainedOpen}}});
assert.equal(open.rows[0].status,"closure_retained_open_outcome_observed");
assert.equal(open.rows[0].truth_boundary.retain_open_outcome_proves_failure,false);

const wrongTrace=structuredClone(baseRecord); wrongTrace.readiness_trace_key="wrong-trace";
assert.equal(buildStaffMobileRemediationClosureOutcomeContinuity({closure_readiness:readiness,closure_outcome_records:{records:{"outcome-503-001":wrongTrace}}}).rows[0].status,"closure_outcome_evidence_conflict");

const early=structuredClone(baseRecord); early.reviewed_at="2026-09-29T13:00:00Z";
assert.equal(buildStaffMobileRemediationClosureOutcomeContinuity({closure_readiness:readiness,closure_outcome_records:{records:{"outcome-503-001":early}}}).rows[0].status,"closure_outcome_evidence_conflict");

const incomplete=structuredClone(baseRecord); incomplete.material_confounders_reviewed=false;
assert.equal(buildStaffMobileRemediationClosureOutcomeContinuity({closure_readiness:readiness,closure_outcome_records:{records:{"outcome-503-001":incomplete}}}).rows[0].status,"closure_outcome_observation_incomplete");

const notReady=structuredClone(readiness); notReady.rows[0].status="material_confounder_review_required"; notReady.rows[0].closure_readiness.review_ready=false;
assert.equal(buildStaffMobileRemediationClosureOutcomeContinuity({closure_readiness:notReady,closure_outcome_records:{records:{"outcome-503-001":baseRecord}}}).rows[0].status,"closure_readiness_not_review_ready");

const unavailable=buildStaffMobileRemediationClosureOutcomeContinuity({});
assert.equal(unavailable.source_recognized,false);
assert.equal(unavailable.boundaries.permanent_polling_allowed,false);
console.log("BUILD 523 STAFF & MOBILE REMEDIATION CLOSURE OUTCOME CONTINUITY TEST: PASS");
