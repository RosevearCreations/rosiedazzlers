// Build 452 — read-only staff workflow, support and mobile efficiency learning.
import { buildStaffWorkflowSupportExceptionLearning } from "./staff-workflow-support-exception-learning.js";

const REVIEW_COHORT_MIN = 2;

export function buildStaffSupportMobileEfficiencyLearning({
  today = {},
  support = {},
  detailer = {},
  source_status = {},
  generated_at = null
} = {}) {
  const retained = buildStaffWorkflowSupportExceptionLearning({
    today,
    support,
    source_status: {
      today_needs_attention: source_status?.today_needs_attention || {},
      support_exceptions: source_status?.support_exceptions || {}
    },
    generated_at
  });
  const mobile = summarizeDetailerWorkspace(
    detailer,
    source_status?.detailer_workspace?.available === true
  );
  const values = Object.values(source_status || {});
  const total = values.length;
  const available = values.filter((row) => row?.available === true).length;
  const restricted = values.filter((row) => row?.restricted === true).length;
  const evidence_status = total && available === total
    ? (mobile.possibly_truncated ? "partial" : "observed")
    : available
      ? "partial"
      : restricted
        ? "restricted"
        : "unavailable";

  const learning_candidates = [
    ...(retained.learning_candidates || []).map((row) => ({
      ...row,
      workflow_friction_proven: false,
      duration_or_latency_proven: false
    })),
    ...mobile.review_candidates
  ].sort(compareCandidates).slice(0, 15);

  return {
    build: 452,
    authority: "staff_support_mobile_efficiency_learning",
    generated_at: generated_at || new Date().toISOString(),
    evidence_status,
    staff_workflow: retained.staff_workflow,
    support_exceptions: retained.support_exceptions,
    mobile_field_workflow: mobile,
    learning_candidates,
    source_status: safeSourceStatus(source_status),
    truth_boundary: {
      repeated_pattern_proves_root_cause: false,
      repeated_stage_proves_mobile_friction: false,
      stage_count_proves_delay: false,
      pending_response_proves_refusal: false,
      current_snapshot_proves_frequency_over_time: false,
      efficiency_improvement_claimed: false
    },
    boundaries: {
      read_only_learning: true,
      aggregate_only: true,
      manual_refresh_only: true,
      existing_role_ceilings_authoritative: true,
      existing_job_booking_state_authoritative: true,
      staff_identity_exposed: false,
      customer_identity_exposed: false,
      raw_booking_ids_exposed: false,
      raw_exception_ids_exposed: false,
      automatic_job_action_allowed: false,
      automatic_task_completion_allowed: false,
      automatic_exception_resolution_allowed: false,
      role_ceiling_change_allowed: false,
      customer_or_provider_outreach_allowed: false,
      provider_transaction_allowed: false,
      accounting_or_inventory_mutation_allowed: false,
      schema_or_storage_mutation_allowed: false,
      background_telemetry_added: false,
      permanent_polling_allowed: false
    }
  };
}

function summarizeDetailerWorkspace(detailer, sourceAvailable) {
  const jobs = Array.isArray(detailer?.jobs) ? detailer.jobs.filter((row) => row && typeof row === "object") : [];
  const rowLimit = positiveWhole(detailer?.workspace?.row_limit) || 80;
  if (!sourceAvailable) {
    return {
      state: "unavailable",
      jobs_observed: 0,
      row_limit: rowLimit,
      possibly_truncated: false,
      stage_cohorts: [],
      job_status_counts: {},
      response_counts: { accepted: 0, pending: 0, declined: 0, unknown: 0 },
      review_candidates: []
    };
  }

  const stageCounts = new Map();
  const jobStatusCounts = {};
  const responseCounts = { accepted: 0, pending: 0, declined: 0, unknown: 0 };

  for (const job of jobs) {
    const stage = token(job?.current_workflow_stage) || token(job?.job_status) || token(job?.status) || "unknown";
    stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);

    const jobStatus = token(job?.job_status) || "unknown";
    jobStatusCounts[jobStatus] = (jobStatusCounts[jobStatus] || 0) + 1;

    const response = normalizeResponse(job?.detailer_response_status);
    responseCounts[response] += 1;
  }

  const stageCohorts = [...stageCounts.entries()]
    .map(([stage, count]) => ({
      stage,
      count,
      review_cohort_sufficient: count >= REVIEW_COHORT_MIN
    }))
    .sort((a, b) => b.count - a.count || a.stage.localeCompare(b.stage));

  const reviewCandidates = stageCohorts
    .filter((row) => row.review_cohort_sufficient)
    .slice(0, 6)
    .map((row) => ({
      area: "mobile_stage_cohort",
      evidence_state: "observed_repeat",
      occurrence_count: row.count,
      priority: "normal",
      pattern: "detailer_stage:" + row.stage,
      finding: row.count + " current bounded Detailer workspace job(s) share the “" + label(row.stage) + "” workflow stage.",
      bounded_operator_review: "Review the canonical Detailer workflow for repeated navigation, handoff or evidence-entry friction. Stage concentration alone does not prove delay or mobile friction.",
      root_cause_proven: false,
      workflow_friction_proven: false,
      duration_or_latency_proven: false,
      automatic_correction_authorized: false,
      automatic_action_authorized: false
    }));

  if (responseCounts.pending >= REVIEW_COHORT_MIN) {
    reviewCandidates.push({
      area: "detailer_response_cohort",
      evidence_state: "observed_repeat",
      occurrence_count: responseCounts.pending,
      priority: "normal",
      pattern: "detailer_response:pending",
      finding: responseCounts.pending + " current bounded Detailer workspace job(s) have a pending detailer response state.",
      bounded_operator_review: "Review assignment visibility and the existing accept/decline flow. Pending state does not establish refusal, missed notification or staff fault.",
      root_cause_proven: false,
      workflow_friction_proven: false,
      duration_or_latency_proven: false,
      automatic_correction_authorized: false,
      automatic_action_authorized: false
    });
  }

  return {
    state: jobs.length >= rowLimit ? "partial" : "observed",
    jobs_observed: jobs.length,
    row_limit: rowLimit,
    possibly_truncated: jobs.length >= rowLimit,
    stage_cohorts: stageCohorts,
    job_status_counts: jobStatusCounts,
    response_counts: responseCounts,
    review_candidates: reviewCandidates
  };
}

function safeSourceStatus(sourceStatus) {
  const out = {};
  for (const [name, value] of Object.entries(sourceStatus || {})) {
    const key = token(name) || "unknown";
    out[key] = {
      available: value?.available === true,
      restricted: value?.restricted === true,
      http_status: Number(value?.http_status) || null,
      error_class: token(value?.error_class) || null
    };
  }
  return out;
}

function compareCandidates(a, b) {
  return priorityRank(a?.priority) - priorityRank(b?.priority)
    || Number(b?.occurrence_count || 0) - Number(a?.occurrence_count || 0)
    || String(a?.pattern || "").localeCompare(String(b?.pattern || ""));
}
function priorityRank(value) { return ({ urgent: 0, high: 1, normal: 2, low: 3 })[value] ?? 4; }
function normalizeResponse(value) {
  const v = token(value);
  if (["accepted", "accept"].includes(v)) return "accepted";
  if (["pending", "offered", "assigned", "awaiting"].includes(v)) return "pending";
  if (["declined", "decline", "rejected"].includes(v)) return "declined";
  return "unknown";
}
function positiveWhole(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
function token(value) {
  const text = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9._:-]{1,120}$/.test(text) ? text : "";
}
function label(value) {
  return String(value || "unknown").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
