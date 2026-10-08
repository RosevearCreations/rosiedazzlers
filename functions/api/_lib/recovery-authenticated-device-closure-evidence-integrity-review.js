// Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review.
// Read-only fail-closed integrity review over retained Build 530 freshness.
// Recovery and authenticated-device populations remain separate and preserve their owning HOLDs.

const REQUIRED_ROLE_IDS = Object.freeze(["customer","detailer","operations","admin"]);
const REQUIRED_DEVICE_IDS = Object.freeze(["phone","tablet","desktop"]);

export function buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview({
  closure_freshness = {},
  manual_closure_outcome = {},
  generated_at = null
} = {}) {
  const generatedAt = validIso(generated_at) || new Date().toISOString();
  const recovery = closure_freshness?.recovery || {};
  const device = closure_freshness?.authenticated_device || {};
  const manualRecovery = manual_closure_outcome?.recovery || {};
  const manualDevice = manual_closure_outcome?.authenticated_device || {};

  const retainedBuildCurrent = Number(closure_freshness?.recovery_authenticated_device_closure_freshness_build) === 530;
  const freshnessCurrent = retainedBuildCurrent &&
    ["manual_holds_retained_current","manual_closure_outcomes_current"].includes(clean(closure_freshness?.status));

  const recoveryTraceKey = clean(recovery?.retained_evidence_trace_key) || null;
  const recoveryObservedAt = validIso(recovery?.observed_at);
  const recoveryExpectedTrace = recoveryTraceKey && recoveryObservedAt
    ? ["recovery", recoveryTraceKey, recoveryObservedAt, clean(recovery?.outcome_classification) || "missing"].join(":")
    : null;
  const retainedRecoveryTrace = clean(manualRecovery?.expected_evidence_trace_key) || null;
  const recoveryIdentityComplete =
    recovery?.evidence_current === true &&
    recovery?.bounded_nonproduction_scope_explicit === true &&
    clean(recovery?.outcome_classification).toLowerCase() === "successful" &&
    Boolean(recoveryTraceKey && recoveryObservedAt && recoveryExpectedTrace && retainedRecoveryTrace);
  const recoveryTraceMatch = Boolean(recoveryExpectedTrace && retainedRecoveryTrace && recoveryExpectedTrace === retainedRecoveryTrace);
  const recoveryOperator = recovery?.operator_review || {};
  const recoveryOperatorComplete =
    recoveryOperator?.current === true &&
    recoveryOperator?.valid === true &&
    recoveryOperator?.trace_match === true &&
    Boolean(validIso(recoveryOperator?.reviewed_at)) &&
    Boolean(clean(recoveryOperator?.reviewer_role)) &&
    Boolean(clean(recoveryOperator?.outcome)) &&
    Boolean(clean(recoveryOperator?.outcome_reference)) &&
    manualRecovery?.manual_hold_outcome?.valid === true &&
    manualRecovery?.manual_hold_outcome?.trace_match === true;

  const deviceRows = safeArray(device?.rows);
  const currentRoleIds = strings(device?.current_role_ids);
  const currentDeviceIds = strings(device?.current_device_ids);
  const currentBrowserIds = strings(device?.current_browser_ids);
  const regressionRoleIds = strings(device?.regression_role_ids);
  const deviceRowsComplete =
    deviceRows.length >= REQUIRED_ROLE_IDS.length &&
    deviceRows.every((row) =>
      row?.observed === true &&
      row?.current === true &&
      REQUIRED_ROLE_IDS.includes(clean(row?.id)) &&
      Boolean(validIso(row?.observed_at)) &&
      clean(row?.outcome) !== "regression" &&
      strings(row?.device_ids).length > 0 &&
      strings(row?.browser_ids).length > 0
    );
  const deviceIdentityComplete =
    device?.evidence_current === true &&
    deviceRowsComplete &&
    REQUIRED_ROLE_IDS.every((id) => currentRoleIds.includes(id)) &&
    REQUIRED_DEVICE_IDS.every((id) => currentDeviceIds.includes(id)) &&
    currentBrowserIds.length > 0 &&
    regressionRoleIds.length === 0;
  const currentDeviceTrace = deviceIdentityComplete
    ? buildDeviceTrace(deviceRows, currentRoleIds, currentDeviceIds, currentBrowserIds)
    : null;
  const retainedDeviceTrace = clean(manualDevice?.expected_evidence_trace_key) || null;
  const deviceTracePresent = Boolean(currentDeviceTrace && retainedDeviceTrace);
  const deviceTraceMatch = deviceTracePresent && currentDeviceTrace === retainedDeviceTrace;
  const deviceOperator = device?.operator_review || {};
  const deviceOperatorComplete =
    deviceOperator?.current === true &&
    deviceOperator?.valid === true &&
    deviceOperator?.trace_match === true &&
    Boolean(validIso(deviceOperator?.reviewed_at)) &&
    Boolean(clean(deviceOperator?.reviewer_role)) &&
    Boolean(clean(deviceOperator?.outcome)) &&
    Boolean(clean(deviceOperator?.outcome_reference)) &&
    manualDevice?.manual_hold_outcome?.valid === true &&
    manualDevice?.manual_hold_outcome?.trace_match === true;

  let status = "retained_freshness_review_required";
  if (!freshnessCurrent) status = "retained_freshness_review_required";
  else if (!recoveryIdentityComplete) status = "recovery_source_identity_review_required";
  else if (!recoveryTraceMatch) status = "recovery_source_identity_drift_review_required";
  else if (!recoveryOperatorComplete) status = "recovery_operator_review_identity_review_required";
  else if (!deviceIdentityComplete || !deviceTracePresent) status = "authenticated_device_identity_review_required";
  else if (!deviceTraceMatch) status = "authenticated_device_identity_drift_review_required";
  else if (!deviceOperatorComplete) status = "authenticated_device_operator_review_identity_review_required";
  else status = "closure_integrity_current";

  return Object.freeze({
    generated_at: generatedAt,
    recovery_authenticated_device_closure_integrity_build: 540,
    recovery_authenticated_device_closure_integrity_authority: "recovery_authenticated_device_closure_evidence_integrity_review",
    retained_freshness_authority: "recovery_authenticated_device_closure_evidence_freshness_review",
    retained_manual_closure_authority: "recovery_authenticated_device_manual_closure_outcome_continuity",
    status,
    recovery_identity: Object.freeze({
      identity_complete: recoveryIdentityComplete,
      current_evidence_trace_key: recoveryExpectedTrace,
      retained_evidence_trace_key: retainedRecoveryTrace,
      trace_match: recoveryTraceMatch,
      bounded_nonproduction_scope_required: true,
      production_recovery_is_not_substitutable: true,
      operator_review_identity_complete: recoveryOperatorComplete,
      canonical_hold_area: "Recovery / backup evidence"
    }),
    authenticated_device_identity: Object.freeze({
      identity_complete: deviceIdentityComplete,
      current_evidence_trace_key: currentDeviceTrace,
      retained_evidence_trace_key: retainedDeviceTrace,
      trace_present: deviceTracePresent,
      trace_match: deviceTraceMatch,
      required_role_ids: REQUIRED_ROLE_IDS,
      required_device_ids: REQUIRED_DEVICE_IDS,
      current_browser_ids: Object.freeze(currentBrowserIds),
      current_regression_role_ids: Object.freeze(regressionRoleIds),
      operator_review_identity_complete: deviceOperatorComplete,
      canonical_hold_area: "Independent device / visual evidence"
    }),
    integrity_contract: Object.freeze({
      closure_integrity_current: status === "closure_integrity_current",
      retained_build530_freshness_must_remain_current: true,
      recovery_and_authenticated_device_populations_joined: false,
      exact_bounded_nonproduction_recovery_trace_required: true,
      exact_authenticated_role_device_browser_trace_required: true,
      explicit_current_trace_matched_operator_reviews_required: true,
      missing_stale_negative_or_unavailable_evidence_retains_owning_hold: true,
      source_runtime_green_can_prove_recovery_or_device_closure: false,
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
      recovery_and_device_success_combined: false,
      canonical_hold_mutated: false,
      business_data_mutated: false
    }),
    boundaries: Object.freeze({
      read_only: true,
      production_restore_or_recovery_mutation_performed: false,
      authenticated_session_or_role_mutation_performed: false,
      provider_action_performed: false,
      customer_or_booking_mutation_performed: false,
      hold_inventory_mutated: false,
      schema_or_storage_mutated: false,
      persistent_telemetry: false,
      permanent_polling: false
    })
  });
}

function buildDeviceTrace(rows, roleIds, deviceIds, browserIds) {
  const observedRows = safeArray(rows)
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
function strings(value){ return [...new Set(safeArray(value).map(clean).filter(Boolean))]; }
function safeArray(value){ return Array.isArray(value) ? value : []; }
function clean(value){ return String(value ?? "").trim(); }
function validIso(value){
  const text=clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}
