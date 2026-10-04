#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildStaffMobileRemediationClosureOutcomeContinuity } from "../functions/api/_lib/staff-mobile-remediation-closure-outcome-continuity.js";
import { buildStaffMobileClosureEvidenceFreshnessReview } from "../functions/api/_lib/staff-mobile-closure-evidence-freshness-review.js";

const readiness={
  closure_readiness_build:513,
  closure_readiness_authority:"staff_mobile_remediation_closure_readiness",
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
      matching_row_count:3,
      attributable_row_count:3,
      materially_like_for_like_row_count:2,
      unconfounded_like_for_like_row_count:2,
      rows:[{closure_evidence_id:"closure-513-001",observed_at:"2026-09-30T14:00:00Z",material_confounders_recorded:true,material_confounders:[],weather_site:{classification:"not_applicable",evidence_reference:null}}]
    },
    closure_readiness:{review_ready:true,closure_performed:false,remediation_effective:null,causation:null,staff_fault:null,device_fault:null,business_impact:null}
  }]
};

const probe=buildStaffMobileRemediationClosureOutcomeContinuity({closure_readiness:readiness,generated_at:"2026-10-01T12:00:00Z"});
const trace=probe.rows[0].retained_closure_readiness.expected_readiness_trace_key;
const record={
  outcome:"close",
  reviewed_by:"owner-review",
  reviewed_at:"2026-10-01T12:05:00Z",
  outcome_reference:"staff-mobile-closure-533",
  readiness_trace_key:trace,
  outcome_observed:true,
  context_reviewed:true,
  material_confounders_reviewed:true,
  weather_site_context_reviewed:true
};
const continuity=buildStaffMobileRemediationClosureOutcomeContinuity({
  closure_readiness:readiness,
  closure_outcome_records:{records:{"outcome-503-001":record}},
  generated_at:"2026-10-01T12:10:00Z"
});

const current=buildStaffMobileClosureEvidenceFreshnessReview({
  closure_outcome_continuity:continuity,
  generated_at:"2026-10-03T12:00:00Z",
  freshness_window_days:30
});
assert.equal(current.staff_mobile_closure_freshness_build,533);
assert.equal(current.rows[0].freshness_state,"closure_outcome_current");
assert.equal(current.rows[0].comparison_context.materially_like_for_like_current,true);
assert.equal(current.rows[0].freshness.trace_current,true);
assert.equal(current.rows[0].truth_boundary.causation,null);
assert.equal(current.truth_boundary.schema_or_storage_mutation_performed,false);

const openRecord=structuredClone(record);
openRecord.outcome="retain_open";
const openContinuity=buildStaffMobileRemediationClosureOutcomeContinuity({
  closure_readiness:readiness,
  closure_outcome_records:{records:{"outcome-503-001":openRecord}},
  generated_at:"2026-10-01T12:10:00Z"
});
assert.equal(buildStaffMobileClosureEvidenceFreshnessReview({
  closure_outcome_continuity:openContinuity,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"retain_open_outcome_current");

const staleEvidence=structuredClone(continuity);
staleEvidence.rows[0].retained_closure_readiness.latest_evidence_observed_at="2026-07-01T12:00:00Z";
assert.equal(buildStaffMobileClosureEvidenceFreshnessReview({
  closure_outcome_continuity:staleEvidence,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"retained_closure_evidence_freshness_review_required");

const staleReview=structuredClone(continuity);
staleReview.rows[0].owner_closure_outcome.reviewed_at="2026-07-01T12:00:00Z";
assert.equal(buildStaffMobileClosureEvidenceFreshnessReview({
  closure_outcome_continuity:staleReview,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"owner_closure_outcome_freshness_review_required");

const weakSample=structuredClone(continuity);
weakSample.rows[0].retained_closure_readiness.unconfounded_like_for_like_row_count=0;
assert.equal(buildStaffMobileClosureEvidenceFreshnessReview({
  closure_outcome_continuity:weakSample,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"like_for_like_sample_window_review_required");

const missingContext=structuredClone(continuity);
missingContext.rows[0].retained_closure_readiness.context.device_browser_context=null;
assert.equal(buildStaffMobileClosureEvidenceFreshnessReview({
  closure_outcome_continuity:missingContext,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"workflow_role_device_browser_context_review_required");

const conflict=structuredClone(continuity);
conflict.rows[0].owner_closure_outcome.trace_matches=false;
assert.equal(buildStaffMobileClosureEvidenceFreshnessReview({
  closure_outcome_continuity:conflict,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"closure_outcome_trace_conflict_review_required");

const incomplete=structuredClone(continuity);
incomplete.rows[0].owner_closure_outcome.material_confounders_reviewed=false;
incomplete.rows[0].owner_closure_outcome.review_complete=false;
assert.equal(buildStaffMobileClosureEvidenceFreshnessReview({
  closure_outcome_continuity:incomplete,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"confounder_weather_site_review_required");

const unavailable=buildStaffMobileClosureEvidenceFreshnessReview({});
assert.equal(unavailable.source_recognized,false);
assert.equal(unavailable.truth_boundary.permanent_polling,false);

console.log("BUILD 533 STAFF & MOBILE CLOSURE EVIDENCE FRESHNESS REVIEW TEST: PASS");
