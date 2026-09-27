// Build 513 — Staff & Mobile Remediation Closure Readiness.
// Read-only closure-readiness classification over retained Build 503 descriptive follow-up evidence.
// Closure readiness is not remediation effectiveness, causation, staff/device fault, or automatic closure.

export function buildStaffMobileRemediationClosureReadiness({
  interpretation_summary = {},
  interpretation_rows = [],
  closure_evidence = [],
  closure_source_available = false,
  generated_at = new Date().toISOString()
} = {}) {
  const sourceState = clean(interpretation_summary?.state) || "unavailable";
  const sourceRows = Array.isArray(interpretation_rows) ? interpretation_rows : [];
  const evidenceRows = Array.isArray(closure_evidence) ? closure_evidence : [];

  const rows = sourceRows.map((row) => classifyRow(row, evidenceRows, closure_source_available === true));

  let state = "interpretation_not_review_ready";
  if (sourceState === "bounded_descriptive_interpretation_follow_up_ready") {
    if (!closure_source_available) state = "closure_evidence_source_required";
    else if (!rows.length || rows.every((row) => row.status === "closure_follow_up_evidence_required")) state = "closure_follow_up_evidence_required";
    else if (rows.some((row) => row.status === "bounded_closure_readiness_review_ready")) state = "bounded_closure_readiness_review_ready";
    else state = "closure_evidence_review_required";
  }

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    closure_readiness_build: 513,
    closure_readiness_authority: "staff_mobile_remediation_closure_readiness",
    retained_interpretation_build: 503,
    retained_outcome_evidence_build: 493,
    retained_execution_readiness_build: 482,
    summary: Object.freeze({
      state,
      source_interpretation_state: sourceState,
      source_rows_observed: sourceRows.length,
      closure_evidence_source_available: closure_source_available === true,
      closure_evidence_rows_observed: evidenceRows.length,
      closure_ready_count: rows.filter((row) => row.status === "bounded_closure_readiness_review_ready").length,
      confounder_review_required_count: rows.filter((row) => row.status === "material_confounder_review_required").length,
      like_for_like_required_count: rows.filter((row) => row.status === "like_for_like_closure_evidence_required").length,
      operator_review_required: true,
      closure_performed: false,
      remediation_effectiveness_claimed: false,
      causation_claimed: false,
      staff_fault_inferred: false,
      device_fault_inferred: false,
      weather_site_restrictions_count_as_staff_mobile_friction: false
    }),
    rows: Object.freeze(rows),
    boundaries: Object.freeze({
      retained_interpretation_only: true,
      attributable_follow_up_evidence_required: true,
      same_measure_definition_required: true,
      same_owning_workflow_scope_required: true,
      same_role_scope_required: true,
      same_device_browser_context_required: true,
      same_window_or_sample_definition_required: true,
      material_confounders_must_be_recorded: true,
      material_confounder_blocks_closure_readiness: true,
      weather_site_classification_must_be_preserved: true,
      weather_site_restrictions_separate_from_staff_mobile_friction: true,
      automatic_remediation_closure_allowed: false,
      automatic_role_or_permission_change_allowed: false,
      automatic_job_or_task_action_allowed: false,
      automatic_outreach_allowed: false,
      canonical_hold_mutation_allowed: false,
      provider_transaction_allowed: false,
      accounting_or_inventory_mutation_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      background_telemetry_allowed: false,
      permanent_polling_allowed: false
    })
  });
}

function classifyRow(source, allEvidence, sourceAvailable) {
  const evidenceId = cleanRef(source?.evidence_id);
  const matches = allEvidence
    .map(normalizeEvidence)
    .filter((row) => row.source_interpretation_evidence_id && row.source_interpretation_evidence_id === evidenceId);

  const attributable = matches.filter((row) => row.attributable);
  const contextMatches = attributable.filter((row) => sameContext(source, row));
  const unconfounded = contextMatches.filter((row) =>
    row.material_confounders_recorded === true &&
    row.material_confounders.length === 0 &&
    weatherPreserved(source, row)
  );

  let status = "closure_follow_up_evidence_required";
  if (!sourceAvailable) status = "closure_evidence_source_required";
  else if (!matches.length) status = "closure_follow_up_evidence_required";
  else if (!attributable.length) status = "closure_follow_up_unattributable";
  else if (!contextMatches.length) status = "like_for_like_closure_evidence_required";
  else if (contextMatches.some((row) => row.material_confounders_recorded !== true || row.material_confounders.length > 0)) status = "material_confounder_review_required";
  else if (!unconfounded.length) status = "like_for_like_closure_evidence_required";
  else status = "bounded_closure_readiness_review_ready";

  return Object.freeze({
    evidence_id: evidenceId,
    area: token(source?.area) || "workflow_review",
    pattern: token(source?.pattern) || "bounded_repeat",
    status,
    retained_interpretation_status: clean(source?.interpretation_status) || null,
    retained_context: Object.freeze({
      measure_definition: cleanText(source?.context?.measure_definition),
      owning_workflow_scope: token(source?.context?.owning_workflow_scope),
      role_scope: token(source?.context?.role_scope),
      device_browser_context: cleanText(source?.context?.device_browser_context),
      window_or_sample_definition: cleanText(source?.context?.window_or_sample_definition)
    }),
    closure_evidence: Object.freeze({
      matching_row_count: matches.length,
      attributable_row_count: attributable.length,
      materially_like_for_like_row_count: contextMatches.length,
      unconfounded_like_for_like_row_count: unconfounded.length,
      rows: Object.freeze(contextMatches)
    }),
    closure_readiness: Object.freeze({
      review_ready: status === "bounded_closure_readiness_review_ready",
      closure_performed: false,
      remediation_effective: null,
      causation: null,
      staff_fault: null,
      device_fault: null,
      business_impact: null,
      automatic_closure_authorized: false
    }),
    truth_boundary: Object.freeze({
      repeated_pattern_proves_root_cause: false,
      descriptive_delta_proves_effectiveness: false,
      like_for_like_repeat_proves_causation: false,
      staff_fault_inferred: false,
      device_fault_inferred: false,
      weather_site_constraint_proves_staff_or_mobile_friction: false,
      service_temperature_limit_inferred: false,
      canonical_hold_mutated: false
    })
  });
}

function normalizeEvidence(value) {
  const row = objectOrEmpty(value);
  const confounders = Array.isArray(row.material_confounders)
    ? row.material_confounders.map(cleanText).filter(Boolean).slice(0, 12)
    : [];
  const observedAt = validIso(row.observed_at);
  const protocol = cleanRef(row.observation_protocol_reference);
  const sourceRef = cleanRef(row.source_interpretation_evidence_id);
  return Object.freeze({
    closure_evidence_id: cleanRef(row.closure_evidence_id),
    source_interpretation_evidence_id: sourceRef,
    observed_at: observedAt,
    observation_protocol_reference: protocol,
    attributable: Boolean(sourceRef && observedAt && protocol),
    measure_definition: cleanText(row.measure_definition),
    owning_workflow_scope: token(row.owning_workflow_scope),
    role_scope: token(row.role_scope),
    device_browser_context: cleanText(row.device_browser_context),
    window_or_sample_definition: cleanText(row.window_or_sample_definition),
    material_confounders_recorded: row.material_confounders_recorded === true,
    material_confounders: Object.freeze(confounders),
    weather_site: Object.freeze({
      classification: token(row?.weather_site?.classification) || "not_recorded",
      evidence_reference: cleanRef(row?.weather_site?.evidence_reference)
    })
  });
}

function sameContext(source, evidence) {
  return Boolean(
    cleanText(source?.context?.measure_definition) &&
    cleanText(source?.context?.measure_definition) === evidence.measure_definition &&
    token(source?.context?.owning_workflow_scope) &&
    token(source?.context?.owning_workflow_scope) === evidence.owning_workflow_scope &&
    token(source?.context?.role_scope) &&
    token(source?.context?.role_scope) === evidence.role_scope &&
    cleanText(source?.context?.device_browser_context) &&
    cleanText(source?.context?.device_browser_context) === evidence.device_browser_context &&
    cleanText(source?.context?.window_or_sample_definition) &&
    cleanText(source?.context?.window_or_sample_definition) === evidence.window_or_sample_definition
  );
}

function weatherPreserved(source, evidence) {
  const sourceClass = token(source?.weather_site?.classification) || "not_recorded";
  if (sourceClass !== evidence.weather_site.classification) return false;
  if (sourceClass === "not_applicable") return true;
  return Boolean(evidence.weather_site.evidence_reference);
}

function objectOrEmpty(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value){ return String(value ?? "").trim(); }
function token(value){ return clean(value).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,96); }
function cleanText(value){ const text=clean(value); return text && text.length<=180 ? text : null; }
function cleanRef(value){ const text=clean(value); return /^[A-Za-z0-9._:/-]{1,160}$/.test(text) ? text : null; }
function validIso(value){ const text=clean(value); return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null; }
