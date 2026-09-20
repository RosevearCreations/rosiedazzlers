import assert from "node:assert/strict";
import { buildStaffSupportMobileEfficiencyLearning } from "../functions/api/_lib/staff-support-mobile-efficiency-learning.js";

const result = buildStaffSupportMobileEfficiencyLearning({
  generated_at: "2026-09-20T16:00:00.000Z",
  source_status: {
    today_needs_attention: { available: true, http_status: 200 },
    support_exceptions: { available: true, http_status: 200 },
    detailer_workspace: { available: true, http_status: 200 }
  },
  today: {
    items: [
      { title: "Review arrival evidence", source_type: "booking", urgency: "high", booking_id: "private-b1" },
      { title: "Review arrival evidence", source_type: "booking", urgency: "normal", booking_id: "private-b2" },
      { title: "Check assigned work", source_type: "staff", urgency: "low" }
    ]
  },
  support: {
    queue: [
      { source: "runtime", family: "deployment", state: "review", severity: "warning", exception_id: "private-e1" },
      { source: "runtime", family: "deployment", state: "review", severity: "warning", exception_id: "private-e2" }
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
assert.equal(result.evidence_status, "observed");
assert.equal(result.staff_workflow.tasks_observed, 3);
assert.equal(result.staff_workflow.repeated_task_patterns, 1);
assert.equal(result.support_exceptions.exceptions_observed, 2);
assert.equal(result.support_exceptions.repeated_exception_patterns, 1);
assert.equal(result.mobile_field_workflow.jobs_observed, 4);
assert.equal(result.mobile_field_workflow.response_counts.pending, 2);
assert.equal(result.mobile_field_workflow.response_counts.accepted, 1);
assert.equal(result.mobile_field_workflow.response_counts.declined, 1);
assert.equal(result.mobile_field_workflow.stage_cohorts.find((row) => row.stage === "arrival").count, 2);
assert.equal(result.mobile_field_workflow.stage_cohorts.find((row) => row.stage === "during").review_cohort_sufficient, true);
assert.ok(result.learning_candidates.some((row) => row.area === "mobile_stage_cohort"));
assert.ok(result.learning_candidates.some((row) => row.area === "detailer_response_cohort"));
assert.equal(result.truth_boundary.repeated_stage_proves_mobile_friction, false);
assert.equal(result.truth_boundary.stage_count_proves_delay, false);
assert.equal(result.boundaries.automatic_job_action_allowed, false);
assert.equal(result.boundaries.automatic_exception_resolution_allowed, false);
assert.equal(result.boundaries.role_ceiling_change_allowed, false);
assert.equal(result.boundaries.background_telemetry_added, false);
assert.equal(result.boundaries.permanent_polling_allowed, false);
assert.ok(result.learning_candidates.every((row) => row.workflow_friction_proven === false));

const serialized = JSON.stringify(result);
for (const forbidden of [
  "Private One", "Private Two", "private-j1", "private-b1", "private-e1",
  "\"customer_name\":", "\"booking_id\":", "\"exception_id\":"
]) assert.equal(serialized.includes(forbidden), false);

console.log("BUILD 452 STAFF SUPPORT MOBILE EFFICIENCY LEARNING TEST: PASS");
