// Build 510 — Recovery Drill & Authenticated Device Closure Review.
// Read-only closure review over retained Build 500 execution evidence.
// Recovery and authenticated-device evidence remain separate populations.

export function buildRecoveryAuthenticatedDeviceClosureReview({
  execution_evidence = {},
  generated_at = new Date().toISOString()
} = {}) {
  const recovery = execution_evidence?.recovery || {};
  const device = execution_evidence?.authenticated_device || {};
  const recoverySourceAvailable = recovery?.source_available === true;
  const deviceSourceAvailable = device?.source_available === true;

  const recoveryCurrent =
    recoverySourceAvailable &&
    recovery?.status === "bounded_nonproduction_execution_observation_recorded" &&
    recovery?.post_observation_requirements_complete === true &&
    recovery?.bounded_nonproduction_scope_explicit === true &&
    recovery?.observer_role_present === true &&
    recovery?.backup_reference_present === true &&
    recovery?.retention_reference_present === true &&
    recovery?.outcome_recorded === true &&
    recovery?.abort_or_deviation_recorded === true &&
    Boolean(clean(recovery?.evidence_trace_key)) &&
    Boolean(validIso(recovery?.observed_at));

  const recoverySuccessful =
    recoveryCurrent && clean(recovery?.outcome_classification).toLowerCase() === "successful";

  let recoveryStatus = "recovery_closure_evidence_review_required";
  if (!recoverySourceAvailable) recoveryStatus = "recovery_closure_source_unavailable";
  else if (recoveryCurrent && !recoverySuccessful) recoveryStatus = "current_recovery_negative_evidence_retains_hold";
  else if (recoverySuccessful) recoveryStatus = "recovery_manual_closure_review_ready";

  const regressionRoleIds = strings(device?.regression_role_ids);
  const currentRoleIds = strings(device?.current_role_ids);
  const observedDeviceIds = strings(device?.observed_device_ids);
  const observedBrowserIds = strings(device?.observed_browser_ids);
  const deviceCurrent =
    deviceSourceAvailable &&
    device?.status === "current_authenticated_observation_execution_evidence_recorded" &&
    device?.current_observation_coverage_complete === true &&
    ["customer","detailer","operations","admin"].every(id => currentRoleIds.includes(id)) &&
    ["phone","tablet","desktop"].every(id => observedDeviceIds.includes(id));
  const devicePositive = deviceCurrent && regressionRoleIds.length === 0;

  let deviceStatus = "authenticated_device_closure_observation_refresh_required";
  if (!deviceSourceAvailable) deviceStatus = "authenticated_device_closure_source_unavailable";
  else if (regressionRoleIds.length || device?.status === "current_regression_observed") {
    deviceStatus = "current_authenticated_device_negative_evidence_retains_hold";
  } else if (devicePositive) {
    deviceStatus = "authenticated_device_manual_closure_review_ready";
  }

  let status = "closure_review_required";
  if (!recoverySourceAvailable || !deviceSourceAvailable) status = "closure_review_source_unavailable";
  else if (recoveryStatus === "current_recovery_negative_evidence_retains_hold") status = "current_recovery_negative_evidence_retains_hold";
  else if (deviceStatus === "current_authenticated_device_negative_evidence_retains_hold") status = "current_authenticated_device_negative_evidence_retains_hold";
  else if (recoveryStatus !== "recovery_manual_closure_review_ready") status = "recovery_closure_review_required";
  else if (deviceStatus !== "authenticated_device_manual_closure_review_ready") status = "authenticated_device_closure_review_required";
  else status = "manual_closure_review_ready";

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    closure_review_build: 510,
    closure_review_authority: "recovery_authenticated_device_closure_review",
    retained_execution_evidence_authority: "recovery_authenticated_device_observation_execution_evidence",
    status,
    recovery_closure: Object.freeze({
      status: recoveryStatus,
      source_available: recoverySourceAvailable,
      current_attributable_bounded_nonproduction_observation: recoveryCurrent,
      successful_outcome_recorded: recoverySuccessful,
      observed_at: validIso(recovery?.observed_at),
      outcome_classification: clean(recovery?.outcome_classification) || "not_recorded",
      evidence_trace_key: clean(recovery?.evidence_trace_key) || null,
      post_observation_requirements_complete: recovery?.post_observation_requirements_complete === true,
      manual_hold_update_candidate: recoverySuccessful,
      canonical_hold_area: "Recovery / backup evidence"
    }),
    authenticated_device_closure: Object.freeze({
      status: deviceStatus,
      source_available: deviceSourceAvailable,
      current_observation_coverage_complete: device?.current_observation_coverage_complete === true,
      required_role_ids: Object.freeze(["customer","detailer","operations","admin"]),
      current_role_ids: Object.freeze(currentRoleIds),
      required_device_ids: Object.freeze(["phone","tablet","desktop"]),
      observed_device_ids: Object.freeze(observedDeviceIds),
      observed_browser_ids: Object.freeze(observedBrowserIds),
      regression_role_ids: Object.freeze(regressionRoleIds),
      manual_hold_update_candidate: devicePositive,
      canonical_hold_area: "Independent device / visual evidence"
    }),
    closure_rules: Object.freeze({
      recovery_and_device_populations_joined: false,
      each_population_requires_independent_current_evidence: true,
      current_negative_evidence_overrides_historical_acceptance: true,
      historical_acceptance_can_close_current_hold: false,
      source_checks_can_close_recovery_hold: false,
      source_checks_can_close_device_hold: false,
      source_runtime_green_can_close_hold: false,
      manual_operator_review_required: true,
      automatic_hold_narrowing_performed: false
    }),
    truth_boundary: Object.freeze({
      production_restore_performed: false,
      recovery_drill_executed_by_this_build: false,
      browser_farm_created: false,
      automated_screenshot_capture_performed: false,
      automated_remediation_performed: false,
      historical_acceptance_overrode_current_negative: false,
      recovery_and_device_success_combined: false,
      canonical_hold_mutated: false,
      schema_or_storage_mutated: false,
      business_data_mutated: false,
      customer_identity_exposed: false,
      protected_content_exposed: false,
      permanent_polling: false
    })
  });
}

function strings(value){ return Array.isArray(value) ? [...new Set(value.map(clean).filter(Boolean))] : []; }
function clean(value){ return String(value ?? "").trim(); }
function validIso(value){
  const text=clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}
