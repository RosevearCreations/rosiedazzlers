// Build 490 — Recovery & Authenticated Device Evidence Continuity.
// Read-only composition over retained recovery refresh/closure and authenticated device observation/triage evidence.
// Recovery and device evidence remain separate owner-observed populations.

export function buildRecoveryAuthenticatedDeviceEvidenceContinuity({
  recovery = {},
  authenticated_device = {},
  generated_at = new Date().toISOString()
} = {}) {
  const recoveryRefresh =
    recovery?.refresh_closure_review ||
    recovery?.recovery_drill_evidence_refresh_closure_review ||
    {};
  const recoveryValidation =
    recovery?.validation_drill_decision_readiness ||
    recovery?.recovery_evidence_validation_drill_decision_readiness ||
    {};
  const deviceEvidence =
    authenticated_device?.evidence ||
    authenticated_device?.authenticated_device_visual_acceptance ||
    authenticated_device ||
    {};
  const triage = deviceEvidence?.observation_refresh_regression_triage || {};
  const regression = deviceEvidence?.regression_closure || {};

  const recoveryRows = normalizeRecoveryRows(recoveryRefresh?.rows);
  const recoveryState = classifyRecovery(recoveryRefresh, recoveryValidation, recoveryRows);
  const deviceState = classifyDevice(triage, regression);

  const currentRoleIds = strings(triage?.current_pass_role_ids);
  const regressionRoleIds = strings(triage?.newly_observed_regression_role_ids);
  const refreshRoleIds = strings(triage?.refresh_required_role_ids);
  const observedDeviceIds = strings(triage?.observed_device_ids);
  const refreshDeviceIds = strings(triage?.refresh_required_device_ids);
  const observedBrowserIds = strings(triage?.observed_browser_ids);
  const regressionDeviceIds = strings(triage?.regression_device_ids);
  const regressionBrowserIds = strings(triage?.regression_browser_ids);

  let status = "continuity_review_incomplete";
  if (recoveryState === "unavailable" || deviceState === "unavailable") {
    status = "continuity_source_unavailable";
  } else if (deviceState === "current_regression_triage_required") {
    status = "current_device_regression_triage_required";
  } else if (recoveryState === "refresh_or_drill_review_required") {
    status = "recovery_refresh_or_drill_review_required";
  } else if (deviceState === "observation_refresh_required") {
    status = "device_observation_refresh_required";
  } else if (recoveryState === "current_review_ready" && deviceState === "current_observation_review_ready") {
    status = "bounded_continuity_review_ready";
  }

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    continuity_enrichment_build: 490,
    continuity_authority: "recovery_authenticated_device_evidence_continuity",
    retained_recovery_authority: "recovery_drill_evidence_refresh_closure_review",
    retained_device_authority: "authenticated_device_observation_refresh_regression_triage",
    status,
    recovery: Object.freeze({
      status: recoveryState,
      source_status: clean(recoveryRefresh?.status) || clean(recoveryValidation?.status) || "unknown",
      evidence_trace_key: clean(recoveryRefresh?.evidence_traceability?.evidence_trace_key) || null,
      required_count: recoveryRows.length,
      current_count: recoveryRows.filter(row=>row.freshness==="current" && row.dated).length,
      stale_count: recoveryRows.filter(row=>row.freshness==="stale").length,
      aging_count: recoveryRows.filter(row=>row.freshness==="aging").length,
      missing_count: recoveryRows.filter(row=>!row.dated && row.source_available).length,
      unavailable_count: recoveryRows.filter(row=>!row.source_available).length,
      plan_kind: clean(recoveryRefresh?.refresh_or_drill_plan?.kind) || "none",
      owner_review_status: clean(recoveryRefresh?.owner_review_traceability?.status) || "owner_review_not_recorded",
      bounded_nonproduction_only: true,
      rows: Object.freeze(recoveryRows)
    }),
    authenticated_device: Object.freeze({
      status: deviceState,
      triage_status: clean(triage?.status) || "observation_refresh_required",
      regression_status: clean(regression?.status) || "refresh_required",
      current_observation_coverage_complete: triage?.current_observation_coverage_complete === true,
      current_role_ids: Object.freeze(currentRoleIds),
      current_role_count: currentRoleIds.length,
      regression_role_ids: Object.freeze(regressionRoleIds),
      refresh_required_role_ids: Object.freeze(refreshRoleIds),
      observed_device_ids: Object.freeze(observedDeviceIds),
      refresh_required_device_ids: Object.freeze(refreshDeviceIds),
      observed_browser_ids: Object.freeze(observedBrowserIds),
      regression_device_ids: Object.freeze(regressionDeviceIds),
      regression_browser_ids: Object.freeze(regressionBrowserIds),
      current_negative_overrides_historical_acceptance: true,
      explicit_role_device_browser_coverage_required: true
    }),
    continuity_rules: Object.freeze({
      recovery_and_device_populations_joined: false,
      recovery_current_observation_required: true,
      recovery_drill_must_remain_bounded_nonproduction: true,
      current_negative_device_observation_overrides_historical_acceptance: true,
      historical_acceptance_can_prove_current_device_health: false,
      direct_authenticated_role_device_browser_observation_required: true,
      source_checks_can_prove_absence_of_device_regression: false
    }),
    canonical_holds: Object.freeze({
      recovery: Object.freeze({
        area: "Recovery / backup evidence",
        retain_hold: true,
        automatic_narrowing: false
      }),
      authenticated_device: Object.freeze({
        area: "Independent device / visual evidence",
        retain_hold: true,
        automatic_narrowing: false
      })
    }),
    truth_boundary: Object.freeze({
      production_restore_performed: false,
      rollback_performed: false,
      recovery_drill_executed: false,
      evidence_refresh_executed: false,
      automated_browser_farm_created: false,
      automated_screenshot_capture_performed: false,
      automated_remediation_performed: false,
      historical_acceptance_overrode_current_negative: false,
      root_cause_inferred_from_negative_observation: false,
      customer_identity_exposed: false,
      protected_content_exposed: false,
      canonical_hold_mutated: false,
      schema_or_storage_mutated: false,
      business_data_mutated: false,
      permanent_polling: false
    })
  });
}

function classifyRecovery(refresh, validation, rows) {
  const status = clean(refresh?.status);
  const unavailable = rows.length === 0 || rows.some(row=>!row.source_available) || status === "blocked_source_unavailable";
  if (unavailable) return "unavailable";

  const trace = refresh?.evidence_traceability || {};
  const required = finiteWhole(trace?.required_count) ?? rows.length;
  const current = finiteWhole(trace?.current_count) ?? rows.filter(row=>row.freshness==="current" && row.dated).length;
  const stale = finiteWhole(trace?.stale_count) ?? rows.filter(row=>row.freshness==="stale").length;
  const missing = finiteWhole(trace?.missing_count) ?? rows.filter(row=>!row.dated).length;
  const aging = finiteWhole(trace?.aging_count) ?? rows.filter(row=>row.freshness==="aging").length;
  const planKind = clean(refresh?.refresh_or_drill_plan?.kind);
  const currentValidation = clean(validation?.status) === "operator_recovery_decision_ready";

  if (stale > 0 || missing > 0 || planKind === "bounded_nonproduction_drill" || planKind === "evidence_refresh") {
    return "refresh_or_drill_review_required";
  }
  if (aging > 0) return "aging_review_required";
  if (required > 0 && current === required) return "current_review_ready";
  if (currentValidation && required === rows.length && rows.every(row=>row.dated && row.freshness==="current")) {
    return "current_review_ready";
  }
  return "review_required";
}

function classifyDevice(triage, regression) {
  const triageStatus = clean(triage?.status);
  if (triageStatus === "unavailable") return "unavailable";
  if (strings(triage?.newly_observed_regression_role_ids).length > 0 || triageStatus === "regression_triage_required") {
    return "current_regression_triage_required";
  }
  if (triageStatus === "observation_refresh_required" || regression?.current_coverage_complete === false) {
    return "observation_refresh_required";
  }
  if (triageStatus === "current_observation_review_ready" && triage?.current_observation_coverage_complete === true) {
    return "current_observation_review_ready";
  }
  return "observation_refresh_required";
}

function normalizeRecoveryRows(rows) {
  return safeArray(rows).map(row=>Object.freeze({
    id: clean(row?.id) || "unknown",
    title: clean(row?.title) || clean(row?.id) || "Recovery evidence",
    source_available: row?.source_available === true,
    observed_at: validIso(row?.observed_at),
    dated: row?.dated === true || Boolean(validIso(row?.observed_at)),
    freshness: clean(row?.freshness) || "unknown",
    classification: clean(row?.classification) || "owner_action"
  }));
}
function safeArray(value){ return Array.isArray(value) ? value : []; }
function strings(value){ return safeArray(value).map(clean).filter(Boolean); }
function clean(value){ return String(value ?? "").trim(); }
function validIso(value){
  const text=clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}
function finiteWhole(value){
  const n=Number(value);
  return Number.isFinite(n) && n>=0 ? Math.floor(n) : null;
}
