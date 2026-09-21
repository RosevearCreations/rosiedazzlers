// Build 462 — read-only remediation-priority enrichment over retained Build 452 staff/mobile learning.
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

  const remediation_priorities = buildRemediationPriorities(learning_candidates, evidence_status);

  return {
    build: 452,
    authority: "staff_support_mobile_efficiency_learning",
    release_enrichment_build: 462,
    release_authority: "staff_mobile_friction_remediation_priorities",
    generated_at: generated_at || new Date().toISOString(),
    evidence_status,
    staff_workflow: retained.staff_workflow,
    support_exceptions: retained.support_exceptions,
    mobile_field_workflow: mobile,
    learning_candidates,
    remediation_priorities,
    source_status: safeSourceStatus(source_status),
    truth_boundary: {
      repeated_pattern_proves_root_cause: false,
      repeated_stage_proves_mobile_friction: false,
      stage_count_proves_delay: false,
      pending_response_proves_refusal: false,
      current_snapshot_proves_frequency_over_time: false,
      remediation_priority_proves_root_cause: false,
      remediation_priority_proves_staff_fault: false,
      remediation_priority_proves_business_impact: false,
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
      automatic_remediation_allowed: false,
      role_ceiling_change_allowed: false,
      blame_inference_allowed: false,
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

function buildRemediationPriorities(candidates, evidenceStatus) {
  const rows = Array.isArray(candidates) ? candidates : [];
  return rows.slice(0, 10).map((row, index) => ({
    rank: index + 1,
    review_priority: ["urgent", "high", "normal", "low"].includes(row?.priority) ? row.priority : "normal",
    area: token(row?.area) || "workflow_review",
    pattern: token(row?.pattern) || "bounded_repeat",
    occurrence_count: positiveWhole(row?.occurrence_count),
    evidence_state: token(row?.evidence_state) || "unavailable",
    priority_basis: "Current retained urgency/severity plus repeated bounded occurrence count; this is a review-order signal, not proof of impact, root cause or staff performance.",
    remediation_candidate: remediationSuggestion(row?.area),
    manual_verification: "Open the existing owning workflow, reproduce the path with an allowed role on a representative device/browser, verify the underlying evidence, then decide whether a separately authorized change is warranted.",
    uncertainty: evidenceStatus === "observed" ? "bounded_current_snapshot_only" : "incomplete_or_bounded_source_snapshot",
    root_cause_proven: false,
    workflow_friction_proven: false,
    staff_fault_inferred: false,
    business_impact_proven: false,
    role_change_authorized: false,
    automatic_exception_resolution_authorized: false,
    automatic_remediation_authorized: false
  }));
}

function remediationSuggestion(area) {
  switch (String(area || "")) {
    case "staff_task_pattern":
      return "Review the canonical staff flow for unnecessary repeated navigation, duplicated evidence entry, or unclear handoff guidance.";
    case "support_exception_pattern":
      return "Review the owning support diagnostic path for repeated operator steps or unclear next-action guidance; do not auto-resolve the exception.";
    case "mobile_stage_cohort":
      return "Review the canonical Detailer mobile stage for tap count, navigation clarity, field-evidence prompts and handoff visibility on representative devices.";
    case "detailer_response_cohort":
      return "Review assignment visibility and accept/decline clarity in the canonical Detailer mobile flow without changing response authority.";
    default:
      return "Review the existing owning workflow for bounded operator-friction improvements without widening permissions or mutating business state automatically.";
  }
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
