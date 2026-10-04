// Build 533 — Staff & Mobile Closure Evidence Freshness Review.
// Read-only freshness reconciliation over retained Build 523 closure outcomes.
// Like-for-like workflow/role/device/browser context, comparable sample/window evidence,
// explicit confounder review and bounded freshness are required. No causal/fault/effectiveness inference.

const DEFAULT_FRESHNESS_WINDOW_DAYS = 30;

export function buildStaffMobileClosureEvidenceFreshnessReview({
  closure_outcome_continuity = {},
  generated_at = null,
  freshness_window_days = DEFAULT_FRESHNESS_WINDOW_DAYS
} = {}) {
  const generatedAt = validDate(generated_at) ? new Date(generated_at) : new Date();
  const windowDays = normalizeWindow(freshness_window_days);
  const source = objectOrEmpty(closure_outcome_continuity);
  const sourceRecognized =
    Number(source.closure_outcome_build) === 523 &&
    clean(source.closure_outcome_authority) === "staff_mobile_remediation_closure_outcome_continuity";

  const rows = safeArray(source.rows).map((row) => reviewRow(row, generatedAt, windowDays, sourceRecognized));

  return Object.freeze({
    generated_at: generatedAt.toISOString(),
    staff_mobile_closure_freshness_build: 533,
    staff_mobile_closure_freshness_authority: "staff_mobile_closure_evidence_freshness_review",
    retained_closure_outcome_build: 523,
    retained_closure_readiness_build: 513,
    retained_outcome_interpretation_build: 503,
    retained_outcome_evidence_build: 493,
    retained_execution_readiness_build: 482,
    source_recognized: sourceRecognized,
    freshness_window_days: windowDays,
    definition_count: rows.length,
    current_closure_count: rows.filter((row) => row.freshness_state === "closure_outcome_current").length,
    current_retain_open_count: rows.filter((row) => row.freshness_state === "retain_open_outcome_current").length,
    review_required_count: rows.filter((row) => !row.freshness_state.endsWith("_current")).length,
    rows: Object.freeze(rows),
    review_contract: Object.freeze({
      retained_build_523_outcome_required: true,
      exact_readiness_trace_must_remain_matched: true,
      materially_like_for_like_observation_required: true,
      workflow_role_device_browser_context_required: true,
      comparable_window_or_sample_required: true,
      material_confounder_review_required: true,
      southern_ontario_weather_site_separation_required: true,
      retained_evidence_must_be_current: true,
      owner_outcome_review_must_be_current: true,
      historical_close_or_retain_open_carry_forward_used: false,
      source_or_runtime_green_proves_current_closure: false
    }),
    truth_boundary: Object.freeze({
      remediation_effective: null,
      causation: null,
      staff_fault: null,
      device_fault: null,
      business_impact: null,
      close_outcome_proves_effectiveness: false,
      retain_open_outcome_proves_failure: false,
      repeated_pattern_proves_root_cause: false,
      automatic_remediation_closure_performed: false,
      role_or_permission_changed: false,
      job_or_task_action_performed: false,
      support_exception_mutated: false,
      outreach_sent: false,
      provider_or_business_mutation_performed: false,
      canonical_hold_mutated: false,
      schema_or_storage_mutation_performed: false,
      background_telemetry_started: false,
      permanent_polling: false
    })
  });
}

function reviewRow(value, generatedAt, windowDays, sourceRecognized) {
  const row = objectOrEmpty(value);
  const retained = objectOrEmpty(row.retained_closure_readiness);
  const context = objectOrEmpty(retained.context);
  const owner = objectOrEmpty(row.owner_closure_outcome);
  const outcome = normalizeOutcome(owner.outcome);

  const reviewedAt = iso(owner.reviewed_at);
  const latestEvidenceAt = iso(retained.latest_evidence_observed_at);
  const reviewAgeDays = ageDays(reviewedAt, generatedAt);
  const evidenceAgeDays = ageDays(latestEvidenceAt, generatedAt);
  const reviewCurrent = Boolean(reviewedAt) && reviewAgeDays !== null && reviewAgeDays <= windowDays;
  const evidenceCurrent = Boolean(latestEvidenceAt) && evidenceAgeDays !== null && evidenceAgeDays <= windowDays;

  const contextComplete =
    Boolean(clean(context.measure_definition)) &&
    Boolean(clean(context.owning_workflow_scope)) &&
    Boolean(clean(context.role_scope)) &&
    Boolean(clean(context.device_browser_context)) &&
    Boolean(clean(context.window_or_sample_definition));

  const comparableCurrent =
    contextComplete &&
    nonnegativeWhole(retained.matching_row_count) >= 1 &&
    nonnegativeWhole(retained.attributable_row_count) >= 1 &&
    nonnegativeWhole(retained.materially_like_for_like_row_count) >= 1 &&
    nonnegativeWhole(retained.unconfounded_like_for_like_row_count) >= 1;

  const traceCurrent =
    owner.attributable === true &&
    owner.trace_matches === true &&
    owner.review_follows_retained_evidence === true &&
    Boolean(clean(owner.readiness_trace_key)) &&
    clean(owner.readiness_trace_key) === clean(retained.expected_readiness_trace_key);

  const reviewContextComplete =
    owner.context_reviewed === true &&
    owner.material_confounders_reviewed === true &&
    owner.weather_site_context_reviewed === true &&
    owner.review_complete === true;

  const retainedOutcomeObserved =
    ["closure_outcome_observed", "closure_retained_open_outcome_observed"].includes(clean(row.status)) &&
    owner.outcome_observed === true &&
    ["close", "retain_open"].includes(outcome);

  let freshnessState = "staff_mobile_closure_freshness_source_unavailable";
  if (sourceRecognized && !retainedOutcomeObserved) freshnessState = "retained_closure_outcome_review_required";
  else if (sourceRecognized && retainedOutcomeObserved && !traceCurrent) freshnessState = "closure_outcome_trace_conflict_review_required";
  else if (sourceRecognized && retainedOutcomeObserved && !contextComplete) freshnessState = "workflow_role_device_browser_context_review_required";
  else if (sourceRecognized && retainedOutcomeObserved && !comparableCurrent) freshnessState = "like_for_like_sample_window_review_required";
  else if (sourceRecognized && retainedOutcomeObserved && !reviewContextComplete) freshnessState = "confounder_weather_site_review_required";
  else if (sourceRecognized && retainedOutcomeObserved && !evidenceCurrent) freshnessState = "retained_closure_evidence_freshness_review_required";
  else if (sourceRecognized && retainedOutcomeObserved && !reviewCurrent) freshnessState = "owner_closure_outcome_freshness_review_required";
  else if (sourceRecognized && retainedOutcomeObserved && outcome === "close") freshnessState = "closure_outcome_current";
  else if (sourceRecognized && retainedOutcomeObserved && outcome === "retain_open") freshnessState = "retain_open_outcome_current";

  return Object.freeze({
    evidence_id: clean(row.evidence_id) || "unknown",
    area: clean(row.area) || "workflow_review",
    pattern: clean(row.pattern) || "bounded_repeat",
    retained_status: clean(row.status) || "unavailable",
    freshness_state: freshnessState,
    comparison_context: Object.freeze({
      measure_definition: clean(context.measure_definition) || null,
      owning_workflow_scope: clean(context.owning_workflow_scope) || null,
      role_scope: clean(context.role_scope) || null,
      device_browser_context: clean(context.device_browser_context) || null,
      window_or_sample_definition: clean(context.window_or_sample_definition) || null,
      context_complete: contextComplete,
      matching_row_count: nonnegativeWhole(retained.matching_row_count),
      attributable_row_count: nonnegativeWhole(retained.attributable_row_count),
      materially_like_for_like_row_count: nonnegativeWhole(retained.materially_like_for_like_row_count),
      unconfounded_like_for_like_row_count: nonnegativeWhole(retained.unconfounded_like_for_like_row_count),
      materially_like_for_like_current: comparableCurrent
    }),
    freshness: Object.freeze({
      latest_retained_evidence_observed_at: latestEvidenceAt,
      retained_evidence_age_days: evidenceAgeDays,
      retained_evidence_current: evidenceCurrent,
      owner_outcome: outcome || "not_recorded",
      owner_reviewed_at: reviewedAt,
      owner_review_age_days: reviewAgeDays,
      owner_review_current: reviewCurrent,
      owner_outcome_reference: clean(owner.outcome_reference) || null,
      trace_current: traceCurrent,
      context_reviewed: owner.context_reviewed === true,
      material_confounders_reviewed: owner.material_confounders_reviewed === true,
      weather_site_context_reviewed: owner.weather_site_context_reviewed === true,
      review_complete: reviewContextComplete
    }),
    outcome_boundary: Object.freeze({
      current: freshnessState.endsWith("_current"),
      review_required: !freshnessState.endsWith("_current"),
      retained_manual_close: outcome === "close",
      retained_manual_retain_open: outcome === "retain_open",
      automatic_closure_performed: false
    }),
    truth_boundary: Object.freeze({
      remediation_effective: null,
      causation: null,
      staff_fault: null,
      device_fault: null,
      business_impact: null,
      close_outcome_proves_effectiveness: false,
      retain_open_outcome_proves_failure: false,
      repeated_pattern_proves_root_cause: false,
      weather_site_constraint_proves_staff_or_mobile_friction: false,
      exact_service_temperature_limit_inferred: false,
      role_or_permission_changed: false,
      job_or_task_action_performed: false,
      support_exception_mutated: false,
      outreach_sent: false,
      provider_or_business_mutation_performed: false,
      canonical_hold_mutated: false,
      schema_or_storage_mutation_performed: false,
      background_telemetry_started: false,
      permanent_polling: false
    })
  });
}

function normalizeOutcome(value){ const v=clean(value).toLowerCase(); return ["close","retain_open"].includes(v)?v:null; }
function normalizeWindow(value){ const n=Number(value); return Number.isFinite(n)&&n>=1&&n<=180?Math.floor(n):DEFAULT_FRESHNESS_WINDOW_DAYS; }
function ageDays(value, generatedAt){ if(!validDate(value)) return null; const ms=generatedAt.getTime()-new Date(value).getTime(); return Number.isFinite(ms)?Math.max(0,Math.floor(ms/86400000)):null; }
function objectOrEmpty(value){ return value&&typeof value==="object"&&!Array.isArray(value)?value:{}; }
function safeArray(value){ return Array.isArray(value)?value:[]; }
function clean(value){ return String(value??"").trim(); }
function validDate(value){ const text=clean(value); return Boolean(text)&&Number.isFinite(Date.parse(text)); }
function iso(value){ return validDate(value)?new Date(value).toISOString():null; }
function nonnegativeWhole(value){ if(value===null||value===undefined||value==="")return 0; const n=Number(value); return Number.isFinite(n)&&n>=0?Math.floor(n):0; }
