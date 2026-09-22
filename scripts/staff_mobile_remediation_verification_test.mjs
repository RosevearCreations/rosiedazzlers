import assert from "node:assert/strict";
import { buildStaffSupportMobileEfficiencyLearning } from "../functions/api/_lib/staff-support-mobile-efficiency-learning.js";

function fixture(overrides = {}) {
  return buildStaffSupportMobileEfficiencyLearning({
    generated_at: "2026-09-22T01:00:00.000Z",
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
assert.equal(result.release_enrichment_build, 462);
assert.equal(result.release_authority, "staff_mobile_friction_remediation_priorities");
assert.equal(result.verification_enrichment_build, 472);
assert.equal(result.verification_authority, "staff_mobile_remediation_verification");
assert.equal(result.evidence_status, "observed");

assert.equal(result.remediation_verification_summary.state, "current_pattern_evidence_present_outcome_unverified");
assert.equal(result.remediation_verification_summary.remediation_execution_evidence_count, 0);
assert.equal(result.remediation_verification_summary.comparable_before_after_evidence_count, 0);
assert.equal(result.remediation_verification_summary.remediation_outcome_verified_count, 0);
assert.equal(result.remediation_verification_summary.attribution_complete, false);
assert.equal(result.remediation_verification_summary.operator_review_required, true);

assert.ok(Array.isArray(result.remediation_verification));
assert.ok(result.remediation_verification.length >= 3);
for (const row of result.remediation_verification) {
  assert.equal(row.verification_status, "current_pattern_observed_no_outcome_attribution");
  assert.equal(row.current_pattern_evidence_present, true);
  assert.equal(row.remediation_execution_evidence_present, false);
  assert.equal(row.before_after_comparable_evidence_present, false);
  assert.equal(row.remediation_outcome_verified, false);
  assert.equal(row.root_cause_proven, false);
  assert.equal(row.staff_fault_inferred, false);
  assert.equal(row.device_friction_proven, false);
  assert.equal(row.business_impact_proven, false);
  assert.ok(row.conclusion.includes("remediation outcome is not verified"));
  assert.ok(row.manual_verification.includes("separately authorized remediation"));
}

assert.equal(result.truth_boundary.current_pattern_proves_remediation_effect, false);
assert.equal(result.truth_boundary.remediation_verification_proves_device_friction, false);
assert.equal(result.truth_boundary.remediation_verification_proves_business_impact, false);
assert.equal(result.boundaries.automatic_verification_closure_allowed, false);
assert.equal(result.boundaries.automatic_remediation_allowed, false);

const partial = fixture({
  source_status: {
    detailer_workspace: { available: false, restricted: true, http_status: 403, error_class: "forbidden" }
  }
});
assert.equal(partial.evidence_status, "partial");
assert.equal(partial.remediation_verification_summary.state, "evidence_incomplete");
for (const row of partial.remediation_verification) {
  assert.equal(row.verification_status, "evidence_incomplete");
  assert.equal(row.remediation_outcome_verified, false);
}

const serialized = JSON.stringify(result);
for (const forbidden of [
  "Private One", "Private Two", "private-j1", "private-b1", "private-e1",
  "\"customer_name\":", "\"booking_id\":", "\"exception_id\":"
]) assert.equal(serialized.includes(forbidden), false);

console.log("BUILD 472 STAFF MOBILE REMEDIATION VERIFICATION TEST: PASS");
