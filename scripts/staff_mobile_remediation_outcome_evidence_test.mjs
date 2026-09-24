#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildStaffSupportMobileEfficiencyLearning } from "../functions/api/_lib/staff-support-mobile-efficiency-learning.js";

function baseArgs(extra = {}) {
  return {
    generated_at: "2026-09-24T22:15:00.000Z",
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
assert.equal(held.remediation_outcome_evidence_build, 493);
assert.equal(held.remediation_outcome_evidence_authority, "staff_mobile_remediation_outcome_evidence");
assert.equal(held.remediation_outcome_evidence_summary.state, "outcome_evidence_source_required");
assert.equal(held.remediation_outcome_evidence_summary.effectiveness_claimed, false);
assert.equal(held.remediation_outcome_evidence_summary.causation_claimed, false);

const priority = held.remediation_execution_evidence_readiness[0];
assert.ok(priority);
const evidence = [{
  evidence_id: "outcome-001",
  area: priority.area,
  pattern: priority.pattern,
  customer_name: "Private Customer",
  staff_name: "Private Staff",
  booking_id: "private-booking",
  execution: {
    authorization_reference: "auth-493-001",
    remediation_change_reference: "change-493-001",
    executed_at: "2026-09-21T14:00:00Z",
    evidence_source_reference: "approved-source-493",
    owning_workflow_scope: "detailer_mobile_workflow",
    role_scope: "detailer",
    device_browser_context: "android_chrome_mobile",
    observation_protocol_reference: "protocol-493-v1"
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
assert.equal(ready.remediation_outcome_evidence_summary.state, "bounded_outcome_evidence_review_ready");
assert.equal(ready.remediation_outcome_evidence_summary.attributable_execution_records_present, 1);
assert.equal(ready.remediation_outcome_evidence_summary.materially_comparable_before_after_pairs_present, 1);
assert.equal(ready.remediation_outcome_evidence[0].execution.attributable, true);
assert.equal(ready.remediation_outcome_evidence[0].comparison.materially_like_for_like, true);
assert.equal(ready.remediation_outcome_evidence[0].comparison.observed_delta, -2);
assert.equal(ready.remediation_outcome_evidence[0].comparison.observed_direction, "decrease");
assert.equal(ready.remediation_outcome_evidence[0].comparison.effectiveness_claimed, false);
assert.equal(ready.remediation_outcome_evidence[0].comparison.causation_claimed, false);
assert.equal(ready.remediation_outcome_evidence[0].weather_site.counts_as_staff_mobile_friction, false);
assert.equal(ready.remediation_outcome_evidence[0].weather_site.service_temperature_limit_inferred, false);

const mismatch = structuredClone(evidence);
mismatch[0].after.device_browser_context = "windows_edge_desktop";
const notComparable = buildStaffSupportMobileEfficiencyLearning(baseArgs({
  remediation_outcome_evidence: mismatch,
  remediation_outcome_source_available: true
}));
assert.equal(notComparable.remediation_outcome_evidence_summary.state, "materially_comparable_before_after_required");
assert.equal(notComparable.remediation_outcome_evidence[0].comparison.same_device_browser_context, false);
assert.equal(notComparable.remediation_outcome_evidence[0].comparison.materially_like_for_like, false);

const weatherMissingEvidence = structuredClone(evidence);
weatherMissingEvidence[0].weather_site_constraint = { classification: "temperature_limited_outdoor" };
const weatherHeld = buildStaffSupportMobileEfficiencyLearning(baseArgs({
  remediation_outcome_evidence: weatherMissingEvidence,
  remediation_outcome_source_available: true
}));
assert.equal(weatherHeld.remediation_outcome_evidence_summary.state, "materially_comparable_before_after_required");
assert.equal(weatherHeld.remediation_outcome_evidence[0].weather_site.explicitly_classified, false);
assert.equal(weatherHeld.remediation_outcome_evidence[0].weather_site.counts_as_staff_mobile_friction, false);

const serialized = JSON.stringify(ready);
for (const forbidden of [
  "Private Customer", "Private Staff", "private-booking", "Private One", "private-j1", "private-b1", "private-e1",
  "\"customer_name\":", "\"staff_name\":", "\"booking_id\":", "\"exception_id\":"
]) assert.equal(serialized.includes(forbidden), false);

assert.equal(ready.truth_boundary.attributable_execution_alone_proves_effectiveness, false);
assert.equal(ready.truth_boundary.materially_comparable_observation_alone_proves_causation, false);
assert.equal(ready.boundaries.automatic_outcome_claim_allowed, false);
assert.equal(ready.boundaries.outcome_evidence_persistence_allowed, false);

console.log("BUILD 493 STAFF & MOBILE REMEDIATION OUTCOME EVIDENCE TEST: PASS");
