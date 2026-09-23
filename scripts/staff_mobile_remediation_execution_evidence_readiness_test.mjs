import assert from "node:assert/strict";
import { buildStaffSupportMobileEfficiencyLearning } from "../functions/api/_lib/staff-support-mobile-efficiency-learning.js";

function fixture(overrides = {}) {
  return buildStaffSupportMobileEfficiencyLearning({
    generated_at: "2026-09-23T03:20:00.000Z",
    source_status: {
      today_needs_attention: { available: true, http_status: 200 },
      support_exceptions: { available: true, http_status: 200 },
      detailer_workspace: { available: true, http_status: 200 },
      ...(overrides.source_status || {})
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
    }
  });
}

const result = fixture();
assert.equal(result.execution_evidence_readiness_build, 482);
assert.equal(result.execution_evidence_readiness_authority, "staff_mobile_remediation_execution_evidence_readiness");
assert.equal(result.evidence_status, "observed");

const summary = result.remediation_execution_evidence_readiness_summary;
assert.equal(summary.state, "execution_record_required_before_outcome_comparison");
assert.equal(summary.attributable_execution_records_present, 0);
assert.equal(summary.materially_comparable_before_after_pairs_present, 0);
assert.equal(summary.remediation_effectiveness_verified_count, 0);
assert.equal(summary.current_patterns_are_not_execution_proof, true);
assert.equal(summary.weather_site_classification_required, true);
assert.ok(summary.required_execution_fields.includes("authorization_reference"));
assert.ok(summary.required_execution_fields.includes("device_browser_context"));
assert.ok(summary.required_before_after_comparability_fields.includes("material_confounders_recorded"));

assert.ok(Array.isArray(result.remediation_execution_evidence_readiness));
assert.ok(result.remediation_execution_evidence_readiness.length >= 3);
for (const row of result.remediation_execution_evidence_readiness) {
  assert.equal(row.readiness_status, "separately_authorized_execution_record_required");
  assert.equal(row.separately_authorized_remediation_execution_evidence_present, false);
  assert.equal(row.materially_comparable_before_after_evidence_present, false);
  assert.equal(row.minimum_attributable_execution_record.authorization_reference, null);
  assert.equal(row.minimum_attributable_execution_record.remediation_change_reference, null);
  assert.equal(row.minimum_attributable_execution_record.executed_at, null);
  assert.equal(row.before_after_comparison.before_observation_recorded, false);
  assert.equal(row.before_after_comparison.after_observation_recorded, false);
  assert.equal(row.before_after_comparison.materially_like_for_like, false);
  assert.equal(row.before_after_comparison.current_pattern_is_not_a_before_measurement, true);
  assert.equal(row.weather_site_constraint.classification, "not_recorded");
  assert.equal(row.weather_site_constraint.operational_constraint_is_separate_from_staff_mobile_friction, true);
  assert.equal(row.weather_site_constraint.counts_as_staff_or_mobile_friction, false);
  assert.equal(row.weather_site_constraint.service_temperature_limit_inferred, false);
  assert.equal(row.remediation_effectiveness_verified, false);
  assert.equal(row.root_cause_proven, false);
  assert.equal(row.staff_fault_inferred, false);
  assert.equal(row.device_friction_proven, false);
  assert.equal(row.business_impact_proven, false);
}

assert.equal(result.truth_boundary.execution_record_readiness_proves_remediation_occurred, false);
assert.equal(result.truth_boundary.before_after_template_proves_effectiveness, false);
assert.equal(result.truth_boundary.weather_site_constraint_proves_staff_or_mobile_friction, false);
assert.equal(result.truth_boundary.service_temperature_limit_inferred, false);
assert.equal(result.boundaries.automatic_execution_record_creation_allowed, false);
assert.equal(result.boundaries.automatic_before_after_conclusion_allowed, false);
assert.equal(result.boundaries.weather_site_constraint_mutation_allowed, false);

const partial = fixture({
  source_status: {
    detailer_workspace: { available: false, restricted: true, http_status: 403, error_class: "forbidden" }
  }
});
assert.equal(partial.evidence_status, "partial");
assert.equal(partial.remediation_execution_evidence_readiness_summary.state, "evidence_incomplete");
for (const row of partial.remediation_execution_evidence_readiness) {
  assert.equal(row.readiness_status, "evidence_incomplete");
  assert.equal(row.remediation_effectiveness_verified, false);
}

const serialized = JSON.stringify(result);
for (const forbidden of [
  "Private One", "Private Two", "private-j1", "private-b1", "private-e1",
  "\"customer_name\":", "\"booking_id\":", "\"exception_id\":"
]) assert.equal(serialized.includes(forbidden), false);

console.log("BUILD 482 STAFF MOBILE REMEDIATION EXECUTION EVIDENCE READINESS TEST: PASS");
