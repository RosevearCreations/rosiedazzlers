// Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review.
// Read-only freshness reconciliation over retained Build 520/510/500 evidence.
// Recovery and authenticated-device populations remain separate; no HOLD is mutated here.

const REQUIRED_ROLE_IDS = Object.freeze(["customer","detailer","operations","admin"]);
const REQUIRED_DEVICE_IDS = Object.freeze(["phone","tablet","desktop"]);
const DEFAULT_FRESHNESS_WINDOW_DAYS = 30;

export function buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview({
  manual_closure_outcome = {},
  execution_evidence = {},
  generated_at = null,
  freshness_window_days = DEFAULT_FRESHNESS_WINDOW_DAYS
} = {}) {
  const generatedAt = validDate(generated_at) ? new Date(generated_at) : new Date();
  const windowDays = normalizeWindow(freshness_window_days);

  const recoveryExecution = execution_evidence?.recovery || {};
  const recoveryManual = manual_closure_outcome?.recovery || {};
  const recoveryObservedAt = iso(recoveryExecution?.observed_at);
  const recoveryAge = ageDays(recoveryObservedAt, generatedAt);
  const recoveryCurrent =
    recoveryExecution?.source_available !== false &&
    clean(recoveryExecution?.status) === "bounded_nonproduction_execution_observation_recorded" &&
    recoveryExecution?.post_observation_requirements_complete === true &&
    recoveryExecution?.bounded_nonproduction_scope_explicit === true &&
    clean(recoveryExecution?.outcome_classification).toLowerCase() === "successful" &&
    clean(recoveryExecution?.freshness).toLowerCase() === "current" &&
    Boolean(recoveryObservedAt) &&
    recoveryAge !== null &&
    recoveryAge <= windowDays &&
    recoveryManual?.evidence_ready === true &&
    clean(recoveryManual?.evidence_trace_key) === clean(recoveryExecution?.evidence_trace_key);

  const deviceExecution = execution_evidence?.authenticated_device || {};
  const deviceManual = manual_closure_outcome?.authenticated_device || {};
  const deviceRows = safeArray(deviceExecution?.rows).map((row) => normalizeDeviceRow(row, generatedAt, windowDays));
  const currentRoleIds = unique(deviceRows.filter((row) => row.current).map((row) => row.id));
  const currentDeviceIds = unique(deviceRows.filter((row) => row.current).flatMap((row) => row.device_ids));
  const currentBrowserIds = unique(deviceRows.filter((row) => row.current).flatMap((row) => row.browser_ids));
  const regressionRoleIds = unique(deviceRows.filter((row) => row.outcome === "regression").map((row) => row.id));
  const deviceCurrent =
    deviceExecution?.source_available !== false &&
    clean(deviceExecution?.status) === "current_authenticated_observation_execution_evidence_recorded" &&
    deviceExecution?.current_observation_coverage_complete === true &&
    regressionRoleIds.length === 0 &&
    REQUIRED_ROLE_IDS.every((id) => currentRoleIds.includes(id)) &&
    REQUIRED_DEVICE_IDS.every((id) => currentDeviceIds.includes(id)) &&
    currentBrowserIds.length > 0 &&
    deviceManual?.evidence_ready === true;

  const recoveryOperator = normalizeOperatorOutcome(recoveryManual?.manual_hold_outcome, generatedAt, windowDays);
  const deviceOperator = normalizeOperatorOutcome(deviceManual?.manual_hold_outcome, generatedAt, windowDays);

  let status = "closure_evidence_current_operator_review_required";
  if (!recoveryCurrent || !deviceCurrent) status = "owning_hold_retained_by_freshness_review";
  else if ((recoveryOperator.present && !recoveryOperator.current) || (deviceOperator.present && !deviceOperator.current)) status = "operator_review_freshness_required";
  else if (!recoveryOperator.current || !deviceOperator.current) status = "closure_evidence_current_operator_review_required";
  else if (recoveryOperator.outcome === "retain_hold" && deviceOperator.outcome === "retain_hold") status = "manual_holds_retained_current";
  else status = "manual_closure_outcomes_current";

  return Object.freeze({
    generated_at: generatedAt.toISOString(),
    recovery_authenticated_device_closure_freshness_build: 530,
    recovery_authenticated_device_closure_freshness_authority: "recovery_authenticated_device_closure_evidence_freshness_review",
    retained_manual_closure_outcome_authority: "recovery_authenticated_device_manual_closure_outcome_continuity",
    retained_closure_review_authority: "recovery_authenticated_device_closure_review",
    retained_execution_evidence_authority: "recovery_authenticated_device_observation_execution_evidence",
    freshness_window_days: windowDays,
    status,
    recovery: Object.freeze({
      freshness_state: recoveryCurrent ? "recovery_evidence_current" : "recovery_evidence_freshness_review_required",
      evidence_current: recoveryCurrent,
      observed_at: recoveryObservedAt,
      evidence_age_days: recoveryAge,
      retained_evidence_trace_key: clean(recoveryExecution?.evidence_trace_key) || null,
      bounded_nonproduction_scope_explicit: recoveryExecution?.bounded_nonproduction_scope_explicit === true,
      outcome_classification: clean(recoveryExecution?.outcome_classification) || "not_recorded",
      operator_review: Object.freeze(recoveryOperator),
      canonical_hold_area: "Recovery / backup evidence"
    }),
    authenticated_device: Object.freeze({
      freshness_state: deviceCurrent ? "authenticated_device_evidence_current" : "authenticated_device_evidence_freshness_review_required",
      evidence_current: deviceCurrent,
      required_role_ids: REQUIRED_ROLE_IDS,
      current_role_ids: Object.freeze(currentRoleIds),
      required_device_ids: REQUIRED_DEVICE_IDS,
      current_device_ids: Object.freeze(currentDeviceIds),
      current_browser_ids: Object.freeze(currentBrowserIds),
      regression_role_ids: Object.freeze(regressionRoleIds),
      rows: Object.freeze(deviceRows),
      operator_review: Object.freeze(deviceOperator),
      canonical_hold_area: "Independent device / visual evidence"
    }),
    freshness_contract: Object.freeze({
      recovery_and_authenticated_device_populations_joined: false,
      bounded_nonproduction_recovery_required: true,
      current_direct_authenticated_role_device_browser_evidence_required: true,
      current_negative_device_observation_retains_owning_hold: true,
      stale_missing_or_unavailable_evidence_retains_owning_hold: true,
      operator_review_must_remain_current_and_trace_matched: true,
      historical_acceptance_can_prove_current_device_health: false,
      source_runtime_green_can_prove_recovery_or_device_closure: false,
      production_restore_performed: false,
      automatic_canonical_hold_narrowing_performed: false
    }),
    truth_boundary: Object.freeze({
      production_restore_performed: false,
      recovery_drill_executed_by_this_build: false,
      authenticated_login_action_performed: false,
      browser_farm_created: false,
      automated_screenshot_capture_performed: false,
      restricted_credentials_stored: false,
      provider_owned_device_session_network_state_inferred: false,
      current_negative_overridden_by_historical_acceptance: false,
      canonical_hold_mutated: false,
      business_data_mutated: false,
      permanent_polling: false
    })
  });
}

function normalizeDeviceRow(row, generatedAt, windowDays) {
  const observedAt = iso(row?.observed_at);
  const age = ageDays(observedAt, generatedAt);
  const outcome = clean(row?.outcome) || "not_current";
  const current = row?.observed === true && Boolean(observedAt) && age !== null && age <= windowDays && outcome !== "regression";
  return Object.freeze({
    id: clean(row?.id) || "unknown",
    observed: row?.observed === true,
    observed_at: observedAt,
    evidence_age_days: age,
    outcome,
    device_ids: Object.freeze(strings(row?.device_ids)),
    browser_ids: Object.freeze(strings(row?.browser_ids)),
    current
  });
}

function normalizeOperatorOutcome(outcome = {}, generatedAt, windowDays) {
  const present = outcome?.present === true;
  const reviewedAt = iso(outcome?.reviewed_at);
  const age = ageDays(reviewedAt, generatedAt);
  const valid = outcome?.valid === true && outcome?.trace_match === true;
  const current = Boolean(present && valid && reviewedAt && age !== null && age <= windowDays);
  return {
    present,
    valid,
    trace_match: outcome?.trace_match === true,
    reviewed_at: reviewedAt,
    review_age_days: age,
    reviewer_role: clean(outcome?.reviewer_role) || null,
    outcome: clean(outcome?.outcome) || null,
    outcome_reference: clean(outcome?.outcome_reference) || null,
    freshness_state: current ? "operator_review_current" : present ? "operator_review_freshness_required" : "operator_review_not_recorded",
    current
  };
}

function normalizeWindow(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 && n <= 180 ? Math.floor(n) : DEFAULT_FRESHNESS_WINDOW_DAYS;
}
function ageDays(value, generatedAt) {
  if (!validDate(value)) return null;
  const ms = generatedAt.getTime() - new Date(value).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 86400000)) : null;
}
function strings(value) { return safeArray(value).map(clean).filter(Boolean); }
function unique(value) { return [...new Set(safeArray(value).map(clean).filter(Boolean))]; }
function safeArray(value) { return Array.isArray(value) ? value : []; }
function clean(value) { return String(value ?? "").trim(); }
function validDate(value) { const text = clean(value); return Boolean(text) && Number.isFinite(Date.parse(text)); }
function iso(value) { return validDate(value) ? new Date(value).toISOString() : null; }
