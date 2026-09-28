// Build 520 — Recovery Drill & Authenticated Device Manual Closure Outcome Continuity.
// Read-only reconciliation over retained Build 510/500 evidence.
// Recovery and authenticated-device populations remain independent and no manual outcome is persisted here.

const ALLOWED_OUTCOMES = ["retain_hold", "narrow_hold_with_dated_evidence"];

export function buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity({
  closure_review = {},
  execution_evidence = {},
  manual_recovery_hold_outcome = null,
  manual_device_hold_outcome = null,
  generated_at = null
} = {}) {
  const recoveryClosure = closure_review?.recovery_closure || {};
  const deviceClosure = closure_review?.authenticated_device_closure || {};
  const recoveryExecution = execution_evidence?.recovery || {};
  const deviceExecution = execution_evidence?.authenticated_device || {};

  const recoveryReady =
    clean(recoveryClosure?.status) === "recovery_manual_closure_review_ready" &&
    recoveryClosure?.successful_outcome_recorded === true &&
    clean(recoveryExecution?.status) === "bounded_nonproduction_execution_observation_recorded" &&
    recoveryExecution?.post_observation_requirements_complete === true &&
    clean(recoveryExecution?.outcome_classification).toLowerCase() === "successful" &&
    Boolean(validIso(recoveryExecution?.observed_at)) &&
    Boolean(clean(recoveryExecution?.evidence_trace_key));

  const currentRoleIds = strings(deviceExecution?.current_role_ids);
  const observedDeviceIds = strings(deviceExecution?.observed_device_ids);
  const observedBrowserIds = strings(deviceExecution?.observed_browser_ids);
  const regressionRoleIds = strings(deviceExecution?.regression_role_ids);
  const deviceReady =
    clean(deviceClosure?.status) === "authenticated_device_manual_closure_review_ready" &&
    clean(deviceExecution?.status) === "current_authenticated_observation_execution_evidence_recorded" &&
    deviceExecution?.current_observation_coverage_complete === true &&
    ["customer","detailer","operations","admin"].every((id) => currentRoleIds.includes(id)) &&
    ["phone","tablet","desktop"].every((id) => observedDeviceIds.includes(id)) &&
    observedBrowserIds.length > 0 &&
    regressionRoleIds.length === 0;

  const recoveryTrace = [
    "recovery",
    clean(recoveryExecution?.evidence_trace_key) || "missing",
    validIso(recoveryExecution?.observed_at) || "missing",
    clean(recoveryExecution?.outcome_classification) || "missing"
  ].join(":");
  const deviceTrace = buildDeviceTrace(deviceExecution?.rows, currentRoleIds, observedDeviceIds, observedBrowserIds);

  const recoveryOutcome = normalizeManualOutcome(manual_recovery_hold_outcome, recoveryTrace, recoveryReady);
  const deviceOutcome = normalizeManualOutcome(manual_device_hold_outcome, deviceTrace, deviceReady);

  const recoveryStatus = populationStatus(recoveryReady, recoveryOutcome);
  const deviceStatus = populationStatus(deviceReady, deviceOutcome);

  let status = "manual_closure_operator_outcome_required";
  if (recoveryOutcome.present && !recoveryOutcome.valid) status = "manual_closure_evidence_conflict";
  else if (deviceOutcome.present && !deviceOutcome.valid) status = "manual_closure_evidence_conflict";
  else if (!recoveryReady || !deviceReady) status = "owning_hold_retained_by_current_evidence";
  else if (!recoveryOutcome.valid || !deviceOutcome.valid) status = "manual_closure_operator_outcome_required";
  else if (recoveryOutcome.outcome === "retain_hold" && deviceOutcome.outcome === "retain_hold") status = "manual_holds_retained_observed";
  else status = "manual_closure_outcomes_observed";

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    manual_closure_outcome_build: 520,
    manual_closure_outcome_authority: "recovery_authenticated_device_manual_closure_outcome_continuity",
    retained_closure_review_authority: "recovery_authenticated_device_closure_review",
    retained_execution_evidence_authority: "recovery_authenticated_device_observation_execution_evidence",
    retained_continuity_authority: "recovery_authenticated_device_evidence_continuity",
    status,
    recovery: Object.freeze({
      status: recoveryStatus,
      evidence_ready: recoveryReady,
      expected_evidence_trace_key: recoveryTrace,
      observed_at: validIso(recoveryExecution?.observed_at),
      evidence_trace_key: clean(recoveryExecution?.evidence_trace_key) || null,
      outcome_classification: clean(recoveryExecution?.outcome_classification) || "not_recorded",
      manual_hold_outcome: freezeOutcome(recoveryOutcome),
      canonical_hold_area: "Recovery / backup evidence"
    }),
    authenticated_device: Object.freeze({
      status: deviceStatus,
      evidence_ready: deviceReady,
      expected_evidence_trace_key: deviceTrace,
      current_role_ids: Object.freeze(currentRoleIds),
      observed_device_ids: Object.freeze(observedDeviceIds),
      observed_browser_ids: Object.freeze(observedBrowserIds),
      regression_role_ids: Object.freeze(regressionRoleIds),
      manual_hold_outcome: freezeOutcome(deviceOutcome),
      canonical_hold_area: "Independent device / visual evidence"
    }),
    closure_contract: Object.freeze({
      build510_closure_review_required: true,
      build500_execution_evidence_required: true,
      recovery_and_device_populations_joined: false,
      current_attributable_bounded_nonproduction_recovery_required: true,
      current_direct_authenticated_role_device_browser_observation_required: true,
      negative_missing_stale_or_unavailable_evidence_retains_owning_hold: true,
      explicit_operator_reviewed_manual_hold_outcome_required: true,
      manual_outcome_must_match_own_population_evidence_trace: true,
      credentials_must_not_be_stored: true,
      provider_owned_device_session_network_evidence_remains_separate: true,
      automatic_canonical_hold_narrowing_performed: false
    }),
    truth_boundary: Object.freeze({
      production_restore_performed: false,
      recovery_drill_executed_by_this_build: false,
      authenticated_login_action_performed: false,
      account_or_session_mutated: false,
      browser_farm_created: false,
      automated_screenshot_capture_performed: false,
      restricted_credentials_stored: false,
      provider_owned_device_session_network_state_inferred: false,
      historical_acceptance_overrode_current_negative: false,
      recovery_and_device_success_combined: false,
      canonical_hold_mutated: false,
      schema_or_storage_mutated: false,
      business_data_mutated: false,
      permanent_polling: false
    })
  });
}

function populationStatus(ready, outcome) {
  if (!ready) return "evidence_not_ready_retains_hold";
  if (outcome.present && !outcome.valid) return "manual_outcome_evidence_conflict";
  if (!outcome.valid) return "manual_closure_operator_outcome_required";
  return outcome.outcome === "retain_hold" ? "manual_hold_retained_observed" : "manual_closure_outcome_observed";
}

function normalizeManualOutcome(value, expectedTraceKey, evidenceReady) {
  const present = Boolean(value && typeof value === "object" && Object.keys(value).length);
  if (!present) {
    return { present:false, valid:false, trace_match:false, status:"operator_outcome_not_recorded", reviewed_at:null, reviewer_role:null, outcome:null, outcome_reference:null };
  }
  const reviewedAt = validIso(value?.reviewed_at);
  const reviewerRole = clean(value?.reviewer_role) || null;
  const outcome = clean(value?.outcome) || null;
  const outcomeReference = clean(value?.outcome_reference) || null;
  const traceMatch = clean(value?.evidence_trace_key) === expectedTraceKey;
  const allowed = ALLOWED_OUTCOMES.includes(outcome);
  const evidenceEligible = evidenceReady === true;
  const valid = Boolean(reviewedAt && reviewerRole && outcomeReference && traceMatch && allowed && evidenceEligible);
  let status = "operator_outcome_invalid";
  if (!traceMatch) status = "operator_outcome_trace_mismatch";
  else if (!evidenceEligible) status = "operator_outcome_not_currently_eligible";
  else if (valid && outcome === "retain_hold") status = "operator_reviewed_retain_hold_observed";
  else if (valid && outcome === "narrow_hold_with_dated_evidence") status = "operator_reviewed_manual_closure_observed";
  return { present:true, valid, trace_match:traceMatch, status, reviewed_at:reviewedAt, reviewer_role:reviewerRole, outcome, outcome_reference:outcomeReference };
}

function freezeOutcome(outcome) {
  return Object.freeze({
    status: outcome.status,
    required_fields: Object.freeze(["reviewed_at","reviewer_role","outcome","evidence_trace_key","outcome_reference"]),
    allowed_outcomes: Object.freeze([...ALLOWED_OUTCOMES]),
    present: outcome.present,
    valid: outcome.valid,
    trace_match: outcome.trace_match,
    reviewed_at: outcome.reviewed_at,
    reviewer_role: outcome.reviewer_role,
    outcome: outcome.outcome,
    outcome_reference: outcome.outcome_reference,
    operator_reviewed: outcome.valid,
    observed_not_inferred: true,
    canonical_hold_mutated_by_this_authority: false
  });
}

function buildDeviceTrace(rows, roleIds, deviceIds, browserIds) {
  const observedRows = (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.observed === true)
    .map((row) => [
      clean(row?.id) || "unknown",
      validIso(row?.observed_at) || "missing",
      clean(row?.outcome) || "recorded",
      strings(row?.device_ids).sort().join(",") || "missing-device",
      strings(row?.browser_ids).sort().join(",") || "missing-browser"
    ].join("|"))
    .sort()
    .join("||");
  return [
    "authenticated_device",
    observedRows || "missing-observation-rows",
    strings(roleIds).sort().join(",") || "missing-roles",
    strings(deviceIds).sort().join(",") || "missing-devices",
    strings(browserIds).sort().join(",") || "missing-browsers"
  ].join(":");
}

function strings(value) { return Array.isArray(value) ? [...new Set(value.map(clean).filter(Boolean))] : []; }
function clean(value) { return String(value ?? "").trim(); }
function validIso(value) {
  const text = clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}
