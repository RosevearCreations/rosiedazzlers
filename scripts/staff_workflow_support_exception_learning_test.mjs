#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildStaffWorkflowSupportExceptionLearning } from "../functions/api/_lib/staff-workflow-support-exception-learning.js";

const result = buildStaffWorkflowSupportExceptionLearning({
  generated_at: "2026-09-19T20:00:00.000Z",
  today: {
    items: [
      { urgency: "high", title: "Notification failed", detail: "Secret Person secret@example.com", booking_id: "booking-secret-1", source_type: "generated" },
      { urgency: "high", title: "Notification failed", detail: "another customer", booking_id: "booking-secret-2", source_type: "generated" },
      { urgency: "urgent", title: "Approve live media", booking_id: "booking-secret-3", source_type: "generated" },
      { urgency: "urgent", title: "Approve live media", booking_id: "booking-secret-4", source_type: "generated" },
      { urgency: "normal", title: "Quote follow-up due", booking_id: null, source_type: "generated" }
    ]
  },
  support: {
    queue: [
      { id: "secret-exception-1", source: "production_diagnostics", family: "runtime", state: "degraded", severity: "warning", label: "Runtime one" },
      { id: "secret-exception-2", source: "production_diagnostics", family: "runtime", state: "degraded", severity: "warning", label: "Runtime two" },
      { id: "secret-exception-3", source: "payment_reconciliation", family: "payment", state: "blocked_provider_unavailable", severity: "hold", label: "Provider hold" }
    ]
  },
  source_status: {
    today_needs_attention: { available: true, restricted: false, http_status: 200 },
    support_exceptions: { available: true, restricted: false, http_status: 200 }
  }
});

assert.equal(result.build, 442);
assert.equal(result.mode, "staff_workflow_support_exception_learning");
assert.equal(result.evidence_status, "observed");
assert.equal(result.staff_workflow.tasks_observed, 5);
assert.equal(result.staff_workflow.repeated_task_patterns, 2);
assert.equal(result.support_exceptions.exceptions_observed, 3);
assert.equal(result.support_exceptions.repeated_exception_patterns, 1);
assert.ok(result.learning_candidates.length >= 3);
assert.ok(result.learning_candidates.every((row) => row.root_cause_proven === false));
assert.ok(result.learning_candidates.every((row) => row.automatic_correction_authorized === false));
assert.equal(result.boundaries.read_only, true);
assert.equal(result.boundaries.aggregate_only, true);
assert.equal(result.boundaries.role_ceiling_change_allowed, false);
assert.equal(result.boundaries.automatic_exception_correction_allowed, false);
assert.equal(result.boundaries.provider_transaction_allowed, false);
assert.equal(result.boundaries.permanent_polling_allowed, false);

const serialized = JSON.stringify(result);
for (const forbidden of ["Secret Person", "secret@example.com", "booking-secret-1", "booking-secret-4", "secret-exception-1", "secret-exception-3"]) {
  assert.equal(serialized.includes(forbidden), false, "sanitized result leaked " + forbidden);
}

const partial = buildStaffWorkflowSupportExceptionLearning({
  today: { items: [] },
  support: { queue: [] },
  source_status: {
    today_needs_attention: { available: true, restricted: false, http_status: 200 },
    support_exceptions: { available: false, restricted: false, http_status: 503, error_class: "timeout" }
  }
});
assert.equal(partial.evidence_status, "partial");
assert.equal(partial.learning_candidates.length, 0);

console.log("BUILD 442 STAFF WORKFLOW SUPPORT EXCEPTION LEARNING TEST: PASS");
