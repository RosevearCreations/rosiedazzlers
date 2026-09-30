// Build 523 — Staff & Mobile Remediation Closure Outcome Continuity.
// Read-only manual outcome continuity over retained Build 513 closure-readiness evidence.
// Explicit closure/retain-open outcomes do not prove effectiveness, causation, staff fault, device fault or business impact.

export function buildStaffMobileRemediationClosureOutcomeContinuity({
  closure_readiness = {},
  closure_outcome_records = {},
  generated_at = new Date().toISOString()
} = {}) {
  const sourceRecognized =
    Number(closure_readiness?.closure_readiness_build) === 513 &&
    clean(closure_readiness?.closure_readiness_authority) === "staff_mobile_remediation_closure_readiness";
  const sourceRows = safeArray(closure_readiness?.rows);
  const records = objectOrEmpty(closure_outcome_records?.records || closure_outcome_records);

  const rows = sourceRows.map((source) => {
    const evidenceId = clean(source?.evidence_id) || "unknown";
    const record = objectOrEmpty(records[evidenceId]);
    const hasRecord = Object.keys(record).length > 0;
    const sourceReady =
      sourceRecognized &&
      clean(source?.status) === "bounded_closure_readiness_review_ready" &&
      source?.closure_readiness?.review_ready === true;
    const traceKey = buildReadinessTraceKey(source);
    const outcome = normalizeOutcome(record.outcome);
    const reviewedBy = clean(record.reviewed_by);
    const reviewedAt = validIso(record.reviewed_at);
    const outcomeReference = clean(record.outcome_reference);
    const recordTraceKey = clean(record.readiness_trace_key);
    const outcomeObserved = record.outcome_observed === true;
    const attributable = Boolean(outcome && reviewedBy && reviewedAt && outcomeReference && recordTraceKey && outcomeObserved);
    const traceMatches = Boolean(traceKey) && recordTraceKey === traceKey;
    const latestEvidenceAt = latestIso(safeArray(source?.closure_evidence?.rows).map(row => row?.observed_at));
    const reviewFollowsEvidence = Boolean(reviewedAt && latestEvidenceAt && Date.parse(reviewedAt) >= Date.parse(latestEvidenceAt));
    const contextReviewed = record.context_reviewed === true;
    const materialConfoundersReviewed = record.material_confounders_reviewed === true;
    const weatherSiteContextReviewed = record.weather_site_context_reviewed === true;
    const reviewComplete = contextReviewed && materialConfoundersReviewed && weatherSiteContextReviewed;

    let status = "closure_readiness_source_unavailable";
    if (sourceRecognized && !sourceReady) status = "closure_readiness_not_review_ready";
    else if (sourceReady && !hasRecord) status = "closure_outcome_required";
    else if (sourceReady && !attributable) status = "closure_outcome_unattributable";
    else if (sourceReady && (!traceMatches || !reviewFollowsEvidence)) status = "closure_outcome_evidence_conflict";
    else if (sourceReady && !reviewComplete) status = "closure_outcome_observation_incomplete";
    else if (sourceReady && outcome === "close") status = "closure_outcome_observed";
    else if (sourceReady && outcome === "retain_open") status = "closure_retained_open_outcome_observed";

    return Object.freeze({
      evidence_id: evidenceId,
      area: clean(source?.area) || "workflow_review",
      pattern: clean(source?.pattern) || "bounded_repeat",
      status,
      retained_closure_readiness: Object.freeze({
        build: 513,
        source_recognized: sourceRecognized,
        status: clean(source?.status) || "unavailable",
        review_ready: source?.closure_readiness?.review_ready === true,
        expected_readiness_trace_key: traceKey,
        latest_evidence_observed_at: latestEvidenceAt,
        context: Object.freeze({
          measure_definition: clean(source?.retained_context?.measure_definition) || null,
          owning_workflow_scope: clean(source?.retained_context?.owning_workflow_scope) || null,
          role_scope: clean(source?.retained_context?.role_scope) || null,
          device_browser_context: clean(source?.retained_context?.device_browser_context) || null,
          window_or_sample_definition: clean(source?.retained_context?.window_or_sample_definition) || null
        }),
        matching_row_count: nonnegativeWhole(source?.closure_evidence?.matching_row_count),
        attributable_row_count: nonnegativeWhole(source?.closure_evidence?.attributable_row_count),
        materially_like_for_like_row_count: nonnegativeWhole(source?.closure_evidence?.materially_like_for_like_row_count),
        unconfounded_like_for_like_row_count: nonnegativeWhole(source?.closure_evidence?.unconfounded_like_for_like_row_count)
      }),
      owner_closure_outcome: Object.freeze({
        outcome: outcome || "not_recorded",
        reviewed_by: reviewedBy || null,
        reviewed_at: reviewedAt,
        outcome_reference: outcomeReference || null,
        readiness_trace_key: recordTraceKey || null,
        outcome_observed: outcomeObserved,
        attributable,
        trace_matches: traceMatches,
        review_follows_retained_evidence: reviewFollowsEvidence,
        context_reviewed: contextReviewed,
        material_confounders_reviewed: materialConfoundersReviewed,
        weather_site_context_reviewed: weatherSiteContextReviewed,
        review_complete: reviewComplete
      }),
      outcome_boundary: Object.freeze({
        outcome_review_complete: ["closure_outcome_observed","closure_retained_open_outcome_observed"].includes(status),
        manual_closure_outcome_observed: status === "closure_outcome_observed",
        retained_open_outcome_observed: status === "closure_retained_open_outcome_observed",
        automatic_closure_performed: false,
        next_step: nextStep(status)
      }),
      truth_boundary: Object.freeze({
        remediation_effective: null,
        causation: null,
        staff_fault: null,
        device_fault: null,
        business_impact: null,
        repeated_pattern_proves_root_cause: false,
        like_for_like_repeat_proves_causation: false,
        closure_outcome_proves_effectiveness: false,
        retain_open_outcome_proves_failure: false,
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
  });

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    closure_outcome_build: 523,
    closure_outcome_authority: "staff_mobile_remediation_closure_outcome_continuity",
    retained_closure_readiness_build: 513,
    retained_outcome_interpretation_build: 503,
    retained_outcome_evidence_build: 493,
    retained_execution_readiness_build: 482,
    source_recognized: sourceRecognized,
    definition_count: rows.length,
    closure_outcome_observed_count: rows.filter(row => row.status === "closure_outcome_observed").length,
    retained_open_outcome_observed_count: rows.filter(row => row.status === "closure_retained_open_outcome_observed").length,
    outcome_review_complete_count: rows.filter(row => row.outcome_boundary.outcome_review_complete).length,
    rows: Object.freeze(rows),
    boundaries: Object.freeze({
      retained_build_513_closure_readiness_only: true,
      exact_readiness_trace_required: true,
      outcome_must_follow_retained_evidence: true,
      context_review_confirmation_required: true,
      material_confounder_review_confirmation_required: true,
      weather_site_context_review_confirmation_required: true,
      automatic_remediation_closure_allowed: false,
      effectiveness_inference_allowed: false,
      causation_inference_allowed: false,
      staff_fault_inference_allowed: false,
      device_fault_inference_allowed: false,
      business_impact_inference_allowed: false,
      role_or_permission_mutation_allowed: false,
      job_task_or_support_exception_mutation_allowed: false,
      outreach_allowed: false,
      provider_or_business_mutation_allowed: false,
      canonical_hold_mutation_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      background_telemetry_allowed: false,
      permanent_polling_allowed: false
    })
  });
}

function buildReadinessTraceKey(source) {
  const evidenceId = clean(source?.evidence_id);
  const context = objectOrEmpty(source?.retained_context);
  const measure = clean(context.measure_definition);
  const workflow = clean(context.owning_workflow_scope);
  const role = clean(context.role_scope);
  const device = clean(context.device_browser_context);
  const sample = clean(context.window_or_sample_definition);
  const status = clean(source?.status);
  const matching = nonnegativeWhole(source?.closure_evidence?.matching_row_count);
  const attributable = nonnegativeWhole(source?.closure_evidence?.attributable_row_count);
  const comparable = nonnegativeWhole(source?.closure_evidence?.materially_like_for_like_row_count);
  const unconfounded = nonnegativeWhole(source?.closure_evidence?.unconfounded_like_for_like_row_count);
  if (!evidenceId || !measure || !workflow || !role || !device || !sample || status !== "bounded_closure_readiness_review_ready" || unconfounded < 1) return null;
  return ["staff-mobile",evidenceId,measure,workflow,role,device,sample,matching,attributable,comparable,unconfounded].join("|");
}
function nextStep(status) {
  if (status === "closure_outcome_observed") return "Retain the explicit trace-matched manual closure outcome; do not infer effectiveness, causation, staff/device fault or business impact.";
  if (status === "closure_retained_open_outcome_observed") return "Retain the explicit trace-matched open outcome; it is not proof of remediation failure or staff/device fault.";
  if (status === "closure_outcome_observation_incomplete") return "Confirm workflow/role/device/browser context, material-confounder review and weather/site separation before accepting the manual outcome.";
  if (status === "closure_outcome_evidence_conflict") return "Reconcile the manual outcome with the exact current Build 513 readiness trace and ensure review follows the retained evidence.";
  if (status === "closure_outcome_unattributable") return "Record an explicit observed close-or-retain-open outcome with reviewer, time, reference and exact readiness trace.";
  if (status === "closure_outcome_required") return "Record an explicit manual close-or-retain-open outcome tied to the exact Build 513 readiness trace.";
  if (status === "closure_readiness_not_review_ready") return "Resolve the retained Build 513 readiness blocker; source/runtime GREEN is not closure evidence.";
  return "Restore the retained Build 513 closure-readiness source before outcome continuity review.";
}
function normalizeOutcome(value){ const v=clean(value).toLowerCase(); return ["close","retain_open"].includes(v)?v:null; }
function objectOrEmpty(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function safeArray(value){ return Array.isArray(value) ? value : []; }
function clean(value){ return String(value ?? "").trim(); }
function validIso(value){ const text=clean(value); return text&&Number.isFinite(Date.parse(text))?new Date(text).toISOString():null; }
function latestIso(values){ const valid=safeArray(values).map(validIso).filter(Boolean).sort((a,b)=>Date.parse(b)-Date.parse(a)); return valid[0] || null; }
function nonnegativeWhole(value){ if(value===null||value===undefined||value==="") return 0; const n=Number(value); return Number.isFinite(n)&&n>=0?Math.floor(n):0; }
