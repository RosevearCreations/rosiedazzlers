// Build 503 — descriptive outcome interpretation and bounded follow-up over retained Build 493 evidence.
export function buildStaffMobileRemediationOutcomeInterpretationFollowUp({
  outcome_summary = {},
  outcome_rows = []
} = {}) {
  const sourceState = String(outcome_summary?.state || "unavailable");
  const rows = Array.isArray(outcome_rows) ? outcome_rows : [];
  const eligible = rows.filter((row) =>
    row?.outcome_status === "bounded_outcome_evidence_review_ready" &&
    row?.execution?.attributable === true &&
    row?.comparison?.materially_like_for_like === true &&
    row?.weather_site?.explicitly_classified === true
  );
  const interpretations = eligible.map((row) => interpretRow(row));

  let state = "outcome_evidence_not_review_ready";
  if (sourceState === "bounded_outcome_evidence_review_ready") {
    state = interpretations.length
      ? "bounded_descriptive_interpretation_follow_up_ready"
      : "comparable_outcome_rows_required";
  }

  return {
    summary: {
      state,
      source_outcome_state: sourceState,
      source_rows_observed: rows.length,
      materially_comparable_rows_interpreted: interpretations.length,
      follow_up_required_count: interpretations.length,
      effectiveness_claimed: false,
      causation_claimed: false,
      staff_fault_inferred: false,
      device_fault_inferred: false,
      business_impact_claimed: false,
      weather_site_restrictions_count_as_staff_mobile_friction: false,
      operator_review_required: true,
      automatic_follow_up_action_authorized: false,
      required_follow_up_context: [
        "same_measure_definition",
        "same_owning_workflow_scope",
        "same_role_scope",
        "same_device_browser_context",
        "same_window_or_sample_definition",
        "material_confounders_recorded",
        "weather_site_classification_preserved"
      ]
    },
    rows: interpretations
  };
}

function interpretRow(row) {
  const before = finite(row?.comparison?.before?.value);
  const after = finite(row?.comparison?.after?.value);
  const delta = finite(row?.comparison?.observed_delta);
  const percent = before !== null && after !== null && before !== 0
    ? round(((after - before) / Math.abs(before)) * 100)
    : null;
  const direction = String(row?.comparison?.observed_direction || "not_available");
  return {
    evidence_id: cleanRef(row?.evidence_id),
    area: token(row?.area) || "workflow_review",
    pattern: token(row?.pattern) || "bounded_repeat",
    interpretation_status: "descriptive_follow_up_required",
    context: {
      measure_definition: cleanText(row?.comparison?.before?.measure_definition),
      owning_workflow_scope: token(row?.execution?.owning_workflow_scope),
      role_scope: token(row?.execution?.role_scope),
      device_browser_context: cleanText(row?.execution?.device_browser_context),
      window_or_sample_definition: cleanText(row?.comparison?.before?.window_or_sample_definition)
    },
    descriptive_observation: {
      before_value: before,
      after_value: after,
      observed_delta: delta,
      observed_percent_change: percent,
      observed_direction: direction,
      favorable_or_unfavorable_inferred: false,
      effectiveness_inferred: false,
      causation_inferred: false
    },
    confounders: {
      materially_like_for_like: row?.comparison?.materially_like_for_like === true,
      material_confounders_recorded: row?.comparison?.material_confounders_recorded === true,
      material_confounders: Array.isArray(row?.comparison?.material_confounders)
        ? row.comparison.material_confounders.map(cleanText).filter(Boolean).slice(0, 8)
        : []
    },
    weather_site: {
      classification: token(row?.weather_site?.classification) || "not_recorded",
      evidence_reference: cleanRef(row?.weather_site?.evidence_reference),
      explicitly_classified: row?.weather_site?.explicitly_classified === true,
      separate_from_staff_mobile_friction: true,
      counts_as_staff_mobile_friction: false,
      service_temperature_limit_inferred: false
    },
    claims: {
      remediation_effective: null,
      causation: null,
      staff_fault: null,
      device_fault: null,
      business_impact: null
    },
    follow_up: {
      state: "repeat_like_for_like_observation_required",
      owner_action_required: true,
      preserve_same_context: true,
      preserve_weather_site_classification: true,
      material_confounders_must_be_recorded: true,
      automatic_remediation_or_closure_authorized: false,
      automatic_role_or_permission_change_authorized: false,
      automatic_outreach_authorized: false,
      note: "Repeat a materially like-for-like bounded observation before any effectiveness or causation decision. Keep workflow, role, representative device/browser, measure and sample/window context comparable."
    }
  };
}

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function round(value) {
  return Math.round(value * 10000) / 10000;
}
function token(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}
function cleanText(value) {
  const text = String(value ?? "").trim();
  return text && text.length <= 180 ? text : null;
}
function cleanRef(value) {
  const text = String(value ?? "").trim();
  return /^[A-Za-z0-9._:/-]{1,160}$/.test(text) ? text : null;
}
