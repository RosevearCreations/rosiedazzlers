// Build 482 — read-only remediation execution-evidence readiness over retained Build 472 verification.
import { buildStaffWorkflowSupportExceptionLearning } from "./staff-workflow-support-exception-learning.js";

const REVIEW_COHORT_MIN = 2;

export function buildStaffSupportMobileEfficiencyLearning({
  today = {},
  support = {},
  detailer = {},
  source_status = {},
  remediation_outcome_evidence = [],
  remediation_outcome_source_available = false,
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
  const remediation_verification = buildRemediationVerification(remediation_priorities, evidence_status);
  const execution_evidence_readiness = buildRemediationExecutionEvidenceReadiness(remediation_verification, evidence_status);
  const remediation_outcome = buildRemediationOutcomeEvidence({
    readiness: execution_evidence_readiness,
    evidenceStatus: evidence_status,
    outcomeEvidence: remediation_outcome_evidence,
    outcomeSourceAvailable: remediation_outcome_source_available
  });

  return {
    build: 452,
    authority: "staff_support_mobile_efficiency_learning",
    release_enrichment_build: 462,
    release_authority: "staff_mobile_friction_remediation_priorities",
    verification_enrichment_build: 472,
    verification_authority: "staff_mobile_remediation_verification",
    execution_evidence_readiness_build: 482,
    execution_evidence_readiness_authority: "staff_mobile_remediation_execution_evidence_readiness",
    remediation_outcome_evidence_build: 493,
    remediation_outcome_evidence_authority: "staff_mobile_remediation_outcome_evidence",
    generated_at: generated_at || new Date().toISOString(),
    evidence_status,
    staff_workflow: retained.staff_workflow,
    support_exceptions: retained.support_exceptions,
    mobile_field_workflow: mobile,
    learning_candidates,
    remediation_priorities,
    remediation_verification_summary: remediation_verification.summary,
    remediation_verification: remediation_verification.rows,
    remediation_execution_evidence_readiness_summary: execution_evidence_readiness.summary,
    remediation_execution_evidence_readiness: execution_evidence_readiness.rows,
    remediation_outcome_evidence_summary: remediation_outcome.summary,
    remediation_outcome_evidence: remediation_outcome.rows,
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
      current_pattern_proves_remediation_effect: false,
      remediation_verification_proves_device_friction: false,
      remediation_verification_proves_business_impact: false,
      execution_record_readiness_proves_remediation_occurred: false,
      before_after_template_proves_effectiveness: false,
      attributable_execution_alone_proves_effectiveness: false,
      materially_comparable_observation_alone_proves_causation: false,
      weather_site_constraint_proves_staff_or_mobile_friction: false,
      service_temperature_limit_inferred: false,
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
      automatic_verification_closure_allowed: false,
      automatic_execution_record_creation_allowed: false,
      automatic_before_after_conclusion_allowed: false,
      automatic_outcome_claim_allowed: false,
      outcome_evidence_persistence_allowed: false,
      weather_site_constraint_mutation_allowed: false,
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

function buildRemediationVerification(priorities, evidenceStatus) {
  const rows = Array.isArray(priorities) ? priorities : [];
  const currentEvidenceComplete = evidenceStatus === "observed";
  const currentPatternEvidenceCount = currentEvidenceComplete
    ? rows.filter((row) => positiveWhole(row?.occurrence_count) > 0).length
    : 0;

  const verificationRows = rows.map((row) => ({
    rank: row.rank,
    review_priority: row.review_priority,
    area: row.area,
    pattern: row.pattern,
    current_occurrence_count: positiveWhole(row.occurrence_count),
    evidence_state: row.evidence_state,
    verification_status: currentEvidenceComplete
      ? "current_pattern_observed_no_outcome_attribution"
      : "evidence_incomplete",
    current_pattern_evidence_present: currentEvidenceComplete && positiveWhole(row.occurrence_count) > 0,
    remediation_execution_evidence_present: false,
    before_after_comparable_evidence_present: false,
    remediation_outcome_verified: false,
    root_cause_proven: false,
    staff_fault_inferred: false,
    device_friction_proven: false,
    business_impact_proven: false,
    conclusion: currentEvidenceComplete
      ? "Current attributable pattern evidence is present, but this bounded source contains no recorded remediation execution or like-for-like before/after evidence; remediation outcome is not verified."
      : "Current source evidence is incomplete, so remediation outcome verification must remain open.",
    manual_verification: "Confirm any separately authorized remediation change, reproduce the owning workflow with an allowed role on a representative device/browser, and compare attributable like-for-like evidence before claiming an outcome."
  }));

  return {
    summary: {
      state: currentEvidenceComplete
        ? (rows.length ? "current_pattern_evidence_present_outcome_unverified" : "no_current_priority_pattern_outcome_unverified")
        : "evidence_incomplete",
      priorities_reviewed: rows.length,
      current_pattern_evidence_count: currentPatternEvidenceCount,
      remediation_execution_evidence_count: 0,
      comparable_before_after_evidence_count: 0,
      remediation_outcome_verified_count: 0,
      attribution_complete: false,
      operator_review_required: true
    },
    rows: verificationRows
  };
}


function buildRemediationExecutionEvidenceReadiness(verification, evidenceStatus) {
  const rows = Array.isArray(verification?.rows) ? verification.rows : [];
  const currentEvidenceComplete = evidenceStatus === "observed";
  const requiredExecutionFields = [
    "authorization_reference",
    "remediation_change_reference",
    "executed_at",
    "evidence_source_reference",
    "owning_workflow_scope",
    "role_scope",
    "device_browser_context",
    "observation_protocol_reference"
  ];
  const requiredComparisonFields = [
    "same_measure_definition",
    "same_owning_workflow_scope",
    "same_role_scope",
    "representative_device_browser_context",
    "comparable_window_or_sample_definition",
    "material_confounders_recorded"
  ];
  const weatherSiteClassifications = [
    "not_applicable",
    "cold_snap_capable",
    "temperature_limited_outdoor",
    "controlled_environment_required"
  ];

  const readinessRows = rows.map((row) => ({
    rank: row.rank,
    review_priority: row.review_priority,
    area: row.area,
    pattern: row.pattern,
    readiness_status: currentEvidenceComplete
      ? "separately_authorized_execution_record_required"
      : "evidence_incomplete",
    current_pattern_evidence_present: row.current_pattern_evidence_present === true,
    separately_authorized_remediation_execution_evidence_present: false,
    materially_comparable_before_after_evidence_present: false,
    minimum_attributable_execution_record: {
      authorization_reference: null,
      remediation_change_reference: null,
      executed_at: null,
      evidence_source_reference: null,
      owning_workflow_scope: row.area || null,
      role_scope: null,
      device_browser_context: null,
      observation_protocol_reference: null
    },
    before_after_comparison: {
      before_observation_recorded: false,
      after_observation_recorded: false,
      materially_like_for_like: false,
      required_fields: requiredComparisonFields,
      current_pattern_is_not_a_before_measurement: true
    },
    weather_site_constraint: {
      classification_required: true,
      classification: "not_recorded",
      allowed_values: weatherSiteClassifications,
      explicit_service_product_equipment_or_site_evidence_required: true,
      operational_constraint_is_separate_from_staff_mobile_friction: true,
      counts_as_staff_or_mobile_friction: false,
      service_temperature_limit_inferred: false
    },
    remediation_effectiveness_verified: false,
    root_cause_proven: false,
    staff_fault_inferred: false,
    device_friction_proven: false,
    business_impact_proven: false,
    conclusion: currentEvidenceComplete
      ? "A current bounded pattern is available for review, but Build 482 contains no separately authorized execution record and no materially comparable before/after pair; remediation effectiveness remains unverified."
      : "Current source evidence is incomplete, so execution evidence readiness and any remediation outcome remain open."
  }));

  return {
    summary: {
      state: currentEvidenceComplete
        ? (rows.length ? "execution_record_required_before_outcome_comparison" : "no_current_priority_pattern_execution_not_inferred")
        : "evidence_incomplete",
      priorities_reviewed: rows.length,
      attributable_execution_records_present: 0,
      materially_comparable_before_after_pairs_present: 0,
      remediation_effectiveness_verified_count: 0,
      required_execution_fields: requiredExecutionFields,
      required_before_after_comparability_fields: requiredComparisonFields,
      weather_site_classification_required: true,
      weather_site_classification_allowed_values: weatherSiteClassifications,
      current_patterns_are_not_execution_proof: true,
      operator_review_required: true
    },
    rows: readinessRows
  };
}


function buildRemediationOutcomeEvidence({ readiness, evidenceStatus, outcomeEvidence, outcomeSourceAvailable }) {
  const readinessRows = Array.isArray(readiness?.rows) ? readiness.rows : [];
  const allowedWeather = new Set(["not_applicable", "cold_snap_capable", "temperature_limited_outdoor", "controlled_environment_required"]);
  const priorityKeys = new Set(readinessRows.map((row) => priorityKey(row?.area, row?.pattern)).filter(Boolean));
  const normalized = Array.isArray(outcomeEvidence) ? outcomeEvidence.map((row) => normalizeOutcomeEvidenceRow(row, priorityKeys, allowedWeather)) : [];
  const attributable = normalized.filter((row) => row.execution.attributable === true);
  const comparable = attributable.filter((row) => row.comparison.materially_like_for_like === true && row.weather_site.explicitly_classified === true);
  let state = "evidence_incomplete";
  if (evidenceStatus === "observed") {
    if (outcomeSourceAvailable !== true) state = "outcome_evidence_source_required";
    else if (normalized.length === 0) state = "remediation_execution_evidence_required";
    else if (attributable.length === 0) state = "outcome_evidence_unattributable";
    else if (comparable.length === 0) state = "materially_comparable_before_after_required";
    else state = "bounded_outcome_evidence_review_ready";
  }

  return {
    summary: {
      state,
      priorities_reviewed: readinessRows.length,
      outcome_source_available: outcomeSourceAvailable === true,
      evidence_rows_observed: normalized.length,
      attributable_execution_records_present: attributable.length,
      materially_comparable_before_after_pairs_present: comparable.length,
      effectiveness_claimed: false,
      causation_claimed: false,
      operator_review_required: true,
      required_execution_fields: [
        "authorization_reference",
        "remediation_change_reference",
        "executed_at",
        "evidence_source_reference",
        "owning_workflow_scope",
        "role_scope",
        "device_browser_context",
        "observation_protocol_reference"
      ],
      required_comparison_context: [
        "same_measure_definition",
        "same_owning_workflow_scope",
        "same_role_scope",
        "same_device_browser_context",
        "same_window_or_sample_definition",
        "before_observed_before_execution",
        "after_observed_after_execution",
        "material_confounders_recorded"
      ],
      weather_site_classification_required: true,
      weather_site_restrictions_count_as_staff_mobile_friction: false
    },
    rows: normalized
  };
}

function normalizeOutcomeEvidenceRow(value, priorityKeys, allowedWeather) {
  const row = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const area = token(row.area) || "workflow_review";
  const pattern = token(row.pattern) || "bounded_repeat";
  const execution = row.execution && typeof row.execution === "object" && !Array.isArray(row.execution) ? row.execution : {};
  const before = normalizeObservation(row.before);
  const after = normalizeObservation(row.after);
  const executedAt = validIso(row.execution?.executed_at);
  const executionFields = {
    authorization_reference: cleanRef(execution.authorization_reference),
    remediation_change_reference: cleanRef(execution.remediation_change_reference),
    executed_at: executedAt,
    evidence_source_reference: cleanRef(execution.evidence_source_reference),
    owning_workflow_scope: token(execution.owning_workflow_scope),
    role_scope: token(execution.role_scope),
    device_browser_context: cleanContext(execution.device_browser_context),
    observation_protocol_reference: cleanRef(execution.observation_protocol_reference)
  };
  const executionAttributable = Boolean(
    priorityKeys.has(priorityKey(area, pattern)) &&
    executionFields.authorization_reference &&
    executionFields.remediation_change_reference &&
    executionFields.executed_at &&
    executionFields.evidence_source_reference &&
    executionFields.owning_workflow_scope &&
    executionFields.role_scope &&
    executionFields.device_browser_context &&
    executionFields.observation_protocol_reference
  );
  const materialConfoundersRecorded = Array.isArray(row.material_confounders);
  const materialConfounders = materialConfoundersRecorded
    ? row.material_confounders.map((item) => cleanContext(item)).filter(Boolean).slice(0, 8)
    : [];
  const sameMeasure = Boolean(before.measure_definition) && before.measure_definition === after.measure_definition;
  const sameWorkflow = Boolean(before.owning_workflow_scope) &&
    before.owning_workflow_scope === after.owning_workflow_scope &&
    before.owning_workflow_scope === executionFields.owning_workflow_scope;
  const sameRole = Boolean(before.role_scope) &&
    before.role_scope === after.role_scope &&
    before.role_scope === executionFields.role_scope;
  const sameDevice = Boolean(before.device_browser_context) &&
    before.device_browser_context === after.device_browser_context &&
    before.device_browser_context === executionFields.device_browser_context;
  const sameSample = Boolean(before.window_or_sample_definition) &&
    before.window_or_sample_definition === after.window_or_sample_definition;
  const temporalOrder = Boolean(executedAt && before.observed_at && after.observed_at) &&
    Date.parse(before.observed_at) <= Date.parse(executedAt) &&
    Date.parse(after.observed_at) >= Date.parse(executedAt);
  const comparable = executionAttributable &&
    before.value !== null && after.value !== null &&
    sameMeasure && sameWorkflow && sameRole && sameDevice && sameSample &&
    temporalOrder && materialConfoundersRecorded && materialConfounders.length === 0;

  const weather = row.weather_site_constraint && typeof row.weather_site_constraint === "object" && !Array.isArray(row.weather_site_constraint)
    ? row.weather_site_constraint : {};
  const classification = token(weather.classification);
  const weatherEvidenceRef = cleanRef(weather.evidence_reference);
  const explicitlyClassified = allowedWeather.has(classification) &&
    (classification === "not_applicable" || Boolean(weatherEvidenceRef));

  const delta = before.value !== null && after.value !== null
    ? Math.round((after.value - before.value) * 10000) / 10000
    : null;

  return {
    evidence_id: cleanRef(row.evidence_id) || null,
    area,
    pattern,
    outcome_status: comparable && explicitlyClassified
      ? "bounded_outcome_evidence_review_ready"
      : executionAttributable
        ? "materially_comparable_before_after_required"
        : "outcome_evidence_unattributable",
    execution: {
      ...executionFields,
      attributable: executionAttributable,
      staff_identity_exposed: false,
      customer_identity_exposed: false
    },
    comparison: {
      before,
      after,
      same_measure_definition: sameMeasure,
      same_owning_workflow_scope: sameWorkflow,
      same_role_scope: sameRole,
      same_device_browser_context: sameDevice,
      same_window_or_sample_definition: sameSample,
      before_observed_before_execution: Boolean(executedAt && before.observed_at) && Date.parse(before.observed_at) <= Date.parse(executedAt),
      after_observed_after_execution: Boolean(executedAt && after.observed_at) && Date.parse(after.observed_at) >= Date.parse(executedAt),
      material_confounders_recorded: materialConfoundersRecorded,
      material_confounders: materialConfounders,
      materially_like_for_like: comparable,
      observed_delta: delta,
      observed_direction: delta === null ? "not_available" : delta > 0 ? "increase" : delta < 0 ? "decrease" : "no_change",
      effectiveness_claimed: false,
      causation_claimed: false
    },
    weather_site: {
      classification: allowedWeather.has(classification) ? classification : "not_recorded",
      evidence_reference: weatherEvidenceRef || null,
      explicitly_classified: explicitlyClassified,
      separate_from_staff_mobile_friction: true,
      counts_as_staff_mobile_friction: false,
      service_temperature_limit_inferred: false
    },
    conclusion: comparable && explicitlyClassified
      ? "Attributable remediation execution and materially like-for-like before/after observations are present for operator review. The observed change remains descriptive; effectiveness and causation are not auto-claimed."
      : executionAttributable
        ? "An attributable remediation execution record is present, but a materially comparable before/after pair with explicit weather/site classification is still required."
        : "Outcome evidence is not attributable to a separately authorized remediation execution for a retained staff/mobile priority."
  };
}

function normalizeObservation(value) {
  const row = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    observed_at: validIso(row.observed_at),
    measure_definition: cleanContext(row.measure_definition),
    value: finiteNumber(row.value),
    owning_workflow_scope: token(row.owning_workflow_scope),
    role_scope: token(row.role_scope),
    device_browser_context: cleanContext(row.device_browser_context),
    window_or_sample_definition: cleanContext(row.window_or_sample_definition)
  };
}

function priorityKey(area, pattern) {
  const a = token(area), p = token(pattern);
  return a && p ? a + "|" + p : "";
}
function validIso(value) {
  const text = String(value ?? "").trim();
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}
function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function cleanRef(value) {
  const text = String(value ?? "").trim();
  return /^[A-Za-z0-9._:/-]{1,160}$/.test(text) ? text : "";
}
function cleanContext(value) {
  const text = String(value ?? "").trim();
  return text && text.length <= 180 ? text : "";
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
