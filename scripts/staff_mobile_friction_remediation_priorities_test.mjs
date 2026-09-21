import assert from "node:assert/strict";
import { buildStaffSupportMobileEfficiencyLearning } from "../functions/api/_lib/staff-support-mobile-efficiency-learning.js";

const result = buildStaffSupportMobileEfficiencyLearning({
  generated_at: "2026-09-21T03:00:00.000Z",
  source_status: {
    today_needs_attention: { available: true, http_status: 200 },
    support_exceptions: { available: true, http_status: 200 },
    detailer_workspace: { available: true, http_status: 200 }
  },
  today: {
    items: [
      { title: "Review arrival evidence", source_type: "booking", urgency: "high", booking_id: "private-b1" },
      { title: "Review arrival evidence", source_type: "booking", urgency: "normal", booking_id: "private-b2" },
      { title: "Review completion evidence", source_type: "booking", urgency: "normal", booking_id: "private-b3" },
      { title: "Review completion evidence", source_type: "booking", urgency: "normal", booking_id: "private-b4" }
    ]
  },
  support: {
    queue: [
      { source: "runtime", family: "deployment", state: "review", severity: "critical", exception_id: "private-e1" },
      { source: "runtime", family: "deployment", state: "review", severity: "critical", exception_id: "private-e2" }
    ]
  },
  detailer: {
    workspace: { bounded: true, row_limit: 80, rows: 4, automatic_refresh: false },
    jobs: [
      { id: "private-j1", customer_name: "Private One", current_workflow_stage: "arrival", job_status: "active", detailer_response_status: "pending" },
      { id: "private-j2", customer_name: "Private Two", current_workflow_stage: "arrival", job_status: "active", detailer_response_status: "pending" },
      { id: "private-j3", customer_name: "Private Three", current_workflow_stage: "during", job_status: "active", detailer_response_status: "accepted" },
      { id: "private-j4", customer_name: "Private Four", current_workflow_stage: "during", job_status: "complete", detailer_response_status: "declined" }
    ]
  }
});

assert.equal(result.build, 452);
assert.equal(result.authority, "staff_support_mobile_efficiency_learning");
assert.equal(result.release_enrichment_build, 462);
assert.equal(result.release_authority, "staff_mobile_friction_remediation_priorities");
assert.equal(result.evidence_status, "observed");
assert.ok(Array.isArray(result.remediation_priorities));
assert.ok(result.remediation_priorities.length >= 4);
assert.equal(result.remediation_priorities[0].review_priority, "urgent");
assert.equal(result.remediation_priorities[0].area, "support_exception_pattern");
assert.ok(result.remediation_priorities.some((row) => row.area === "staff_task_pattern"));
assert.ok(result.remediation_priorities.some((row) => row.area === "mobile_stage_cohort"));
assert.ok(result.remediation_priorities.some((row) => row.area === "detailer_response_cohort"));
assert.deepEqual(
  result.remediation_priorities.map((row) => row.rank),
  result.remediation_priorities.map((_, index) => index + 1)
);
for (const row of result.remediation_priorities) {
  assert.ok(["urgent", "high", "normal", "low"].includes(row.review_priority));
  assert.ok(row.priority_basis.includes("review-order signal"));
  assert.ok(row.manual_verification.includes("existing owning workflow"));
  assert.equal(row.root_cause_proven, false);
  assert.equal(row.workflow_friction_proven, false);
  assert.equal(row.staff_fault_inferred, false);
  assert.equal(row.business_impact_proven, false);
  assert.equal(row.role_change_authorized, false);
  assert.equal(row.automatic_exception_resolution_authorized, false);
  assert.equal(row.automatic_remediation_authorized, false);
}
assert.equal(result.truth_boundary.remediation_priority_proves_root_cause, false);
assert.equal(result.truth_boundary.remediation_priority_proves_staff_fault, false);
assert.equal(result.truth_boundary.remediation_priority_proves_business_impact, false);
assert.equal(result.boundaries.automatic_remediation_allowed, false);
assert.equal(result.boundaries.blame_inference_allowed, false);

const serialized = JSON.stringify(result);
for (const forbidden of [
  "Private One", "Private Two", "private-j1", "private-b1", "private-e1",
  "\"customer_name\":", "\"booking_id\":", "\"exception_id\":"
]) assert.equal(serialized.includes(forbidden), false);

console.log("BUILD 462 STAFF MOBILE FRICTION REMEDIATION PRIORITIES TEST: PASS");
