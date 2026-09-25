#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildStaffSupportMobileEfficiencyLearning } from "../functions/api/_lib/staff-support-mobile-efficiency-learning.js";

function baseArgs(extra = {}) {
  return {
    generated_at: "2026-09-25T16:40:00.000Z",
    source_status: {
      today_needs_attention: { available: true, http_status: 200 },
      support_exceptions: { available: true, http_status: 200 },
      detailer_workspace: { available: true, http_status: 200 }
    },
    today: {
      items: [
        { title: "Review arrival evidence", source_type: "booking", urgency: "high", booking_id: "private-b1" },
        { title: "Review arrival evidence", source_type: "booking", urgency: "normal", booking_id: "private-b2" }
      ]
    },
    support: {
      queue: [
        { source: "runtime", family: "deployment", state: "review", severity: "critical", exception_id: "private-e1" },
        { source: "runtime", family: "deployment", state: "review", severity: "critical", exception_id: "private-e2" }
      ]
    },
    detailer: {
      workspace: { bounded: true, row_limit: 80, rows: 3, automatic_refresh: false },
      jobs: [
        { id: "private-j1", customer_name: "Private One", current_workflow_stage: "arrival", job_status: "active", detailer_response_status: "pending" },
        { id: "private-j2", customer_name: "Private Two", current_workflow_stage: "arrival", job_status: "active", detailer_response_status: "pending" },
        { id: "private-j3", customer_name: "Private Three", current_workflow_stage: "during", job_status: "active", detailer_response_status: "accepted" }
      ]
    },
    ...extra
  };
}

const held = buildStaffSupportMobileEfficiencyLearning(baseArgs());
assert.equal(held.remediation_outcome_interpretation_follow_up_build, 503);
assert.equal(held.remediation_outcome_interpretation_follow_up_authority, "staff_mobile_remediation_outcome_interpretation_follow_up");
assert.equal(held.remediation_outcome_interpretation_follow_up_summary.state, "outcome_evidence_not_review_ready");
assert.equal(held.remediation_outcome_interpretation_follow_up.length, 0);

const priority = held.remediation_execution_evidence_readiness[0];
assert.ok(priority);
const evidence = [{
  evidence_id: "outcome-503-001",
  area: priority.area,
  pattern: priority.pattern,
  customer_name: "Private Customer",
  staff_name: "Private Staff",
  booking_id: "private-booking",
  execution: {
    authorization_reference: "auth-503-001",
    remediation_change_reference: "change-503-001",
    executed_at: "2026-09-21T14:00:00Z",
    evidence_source_reference: "approved-source-503",
    owning_workflow_scope: "detailer_mobile_workflow",
    role_scope: "detailer",
    device_browser_context: "android_chrome_mobile",
    observation_protocol_reference: "protocol-503-v1"
  },
  before: {
    observed_at: "2026-09-20T14:00:00Z",
    measure_definition: "steps_per_representative_task",
    value: 7,
    owning_workflow_scope: "detailer_mobile_workflow",
    role_scope: "detailer",
    device_browser_context: "android_chrome_mobile",
    window_or_sample_definition: "five_representative_tasks"
  },
  after: {
    observed_at: "2026-09-22T14:00:00Z",
    measure_definition: "steps_per_representative_task",
    value: 5,
    owning_workflow_scope: "detailer_mobile_workflow",
    role_scope: "detailer",
    device_browser_context: "android_chrome_mobile",
    window_or_sample_definition: "five_representative_tasks"
  },
  material_confounders: [],
  weather_site_constraint: { classification: "not_applicable" }
}];

const ready = buildStaffSupportMobileEfficiencyLearning(baseArgs({
  remediation_outcome_evidence: evidence,
  remediation_outcome_source_available: true
}));
assert.equal(ready.remediation_outcome_interpretation_follow_up_summary.state, "bounded_descriptive_interpretation_follow_up_ready");
assert.equal(ready.remediation_outcome_interpretation_follow_up_summary.materially_comparable_rows_interpreted, 1);
assert.equal(ready.remediation_outcome_interpretation_follow_up_summary.follow_up_required_count, 1);
const row = ready.remediation_outcome_interpretation_follow_up[0];
assert.equal(row.descriptive_observation.before_value, 7);
assert.equal(row.descriptive_observation.after_value, 5);
assert.equal(row.descriptive_observation.observed_delta, -2);
assert.equal(row.descriptive_observation.observed_percent_change, -28.5714);
assert.equal(row.descriptive_observation.observed_direction, "decrease");
assert.equal(row.descriptive_observation.favorable_or_unfavorable_inferred, false);
assert.equal(row.descriptive_observation.effectiveness_inferred, false);
assert.equal(row.descriptive_observation.causation_inferred, false);
assert.equal(row.claims.remediation_effective, null);
assert.equal(row.claims.causation, null);
assert.equal(row.claims.staff_fault, null);
assert.equal(row.claims.device_fault, null);
assert.equal(row.follow_up.state, "repeat_like_for_like_observation_required");
assert.equal(row.follow_up.automatic_remediation_or_closure_authorized, false);
assert.equal(row.weather_site.counts_as_staff_mobile_friction, false);
assert.equal(row.weather_site.service_temperature_limit_inferred, false);

const confounded = structuredClone(evidence);
confounded[0].material_confounders = ["different route mix"];
const heldConfounded = buildStaffSupportMobileEfficiencyLearning(baseArgs({
  remediation_outcome_evidence: confounded,
  remediation_outcome_source_available: true
}));
assert.equal(heldConfounded.remediation_outcome_evidence_summary.state, "materially_comparable_before_after_required");
assert.equal(heldConfounded.remediation_outcome_interpretation_follow_up_summary.state, "outcome_evidence_not_review_ready");
assert.equal(heldConfounded.remediation_outcome_interpretation_follow_up.length, 0);

const weather = structuredClone(evidence);
weather[0].weather_site_constraint = {
  classification: "temperature_limited_outdoor",
  evidence_reference: "service-weather-evidence-503"
};
const weatherReady = buildStaffSupportMobileEfficiencyLearning(baseArgs({
  remediation_outcome_evidence: weather,
  remediation_outcome_source_available: true
}));
assert.equal(weatherReady.remediation_outcome_interpretation_follow_up_summary.state, "bounded_descriptive_interpretation_follow_up_ready");
assert.equal(weatherReady.remediation_outcome_interpretation_follow_up[0].weather_site.classification, "temperature_limited_outdoor");
assert.equal(weatherReady.remediation_outcome_interpretation_follow_up[0].weather_site.separate_from_staff_mobile_friction, true);

const serialized = JSON.stringify(ready);
for (const forbidden of [
  "Private Customer", "Private Staff", "private-booking", "Private One", "private-j1", "private-b1", "private-e1",
  "\"customer_name\":", "\"staff_name\":", "\"booking_id\":", "\"exception_id\":"
]) assert.equal(serialized.includes(forbidden), false);

assert.equal(ready.truth_boundary.single_like_for_like_pair_proves_effectiveness, false);
assert.equal(ready.truth_boundary.descriptive_delta_proves_staff_or_device_fault, false);
assert.equal(ready.boundaries.automatic_follow_up_action_allowed, false);
assert.equal(ready.boundaries.interpretation_persistence_allowed, false);

console.log("BUILD 503 STAFF & MOBILE REMEDIATION OUTCOME INTERPRETATION & FOLLOW-UP TEST: PASS");
