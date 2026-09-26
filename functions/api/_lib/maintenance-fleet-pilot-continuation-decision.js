// Build 511 — Maintenance & Fleet Pilot Continuation Decision.
// Read-only explicit owner decision layer over retained Build 501 continuity review.
// A recorded decision never executes continuation or mutates customer/business state.

export function buildMaintenanceFleetPilotContinuationDecision({
  pilot_outcome_continuity_review = {},
  continuation_decision_record = {},
  generated_at = new Date().toISOString()
} = {}) {
  const continuity = objectOrEmpty(pilot_outcome_continuity_review);
  const decision = objectOrEmpty(continuation_decision_record);
  const authorization = objectOrEmpty(continuity.authorization_continuity);
  const execution = objectOrEmpty(continuity.execution_continuity);
  const bounds = objectOrEmpty(continuity.bounds);
  const dimensions = objectOrEmpty(continuity.outcome_dimensions);
  const continuityDecision = objectOrEmpty(continuity.continuity_decision);

  const sourceRecognized =
    Number(continuity.continuity_review_build) === 501 &&
    clean(continuity.continuity_authority) === "maintenance_fleet_pilot_outcome_continuity_review";

  const authorized = authorization.attributable_outcome_capture_allowed === true;
  const executionPresent =
    finiteWhole(execution.observed_row_count) > 0 &&
    finiteWhole(execution.attributed_row_count) > 0;
  const participantBoundSatisfied = bounds.participant_bound_satisfied === true;
  const durationBoundSatisfied = bounds.duration_bound_satisfied === true;
  const stopTriggered =
    dimensions.stop_condition_review_required === true ||
    (finiteWhole(dimensions.stop_condition_triggered_count) ?? 0) > 0;
  const evidenceComplete =
    dimensions.evidence_complete === true &&
    dimensions.capacity_revalidation_complete === true &&
    dimensions.invoicing_evidence_complete === true &&
    dimensions.travel_evidence_complete === true &&
    dimensions.stop_condition_evidence_complete === true;
  const continuityReviewReady =
    clean(continuity.status) === "bounded_pilot_continuity_review_ready" &&
    continuityDecision.review_ready === true &&
    authorized &&
    executionPresent &&
    participantBoundSatisfied &&
    durationBoundSatisfied &&
    evidenceComplete &&
    !stopTriggered;

  const explicitDecision = normalizeDecision(decision.decision);
  const decidedBy = clean(decision.decided_by);
  const decidedAt = validIso(decision.decided_at);
  const decisionAttributable =
    (explicitDecision === "continue" || explicitDecision === "hold") &&
    Boolean(decidedBy) &&
    Boolean(decidedAt);

  let status = "continuation_source_unavailable";
  if (sourceRecognized && !authorized) status = "owner_action_authorization_required";
  else if (sourceRecognized && authorized && !executionPresent) status = "owner_action_execution_evidence_required";
  else if (sourceRecognized && authorized && executionPresent && (!participantBoundSatisfied || !durationBoundSatisfied)) status = "pilot_bounds_review_required";
  else if (sourceRecognized && authorized && executionPresent && stopTriggered) status = "pilot_stop_condition_review_required";
  else if (sourceRecognized && authorized && executionPresent && !evidenceComplete) status = "continuation_evidence_incomplete";
  else if (sourceRecognized && continuityReviewReady && !decisionAttributable) status = "owner_action_continuation_decision_required";
  else if (sourceRecognized && continuityReviewReady && decisionAttributable && explicitDecision === "hold") status = "continuation_hold_recorded";
  else if (sourceRecognized && continuityReviewReady && decisionAttributable && explicitDecision === "continue") status = "bounded_pilot_continuation_decision_recorded";
  else if (sourceRecognized) status = "continuation_evidence_incomplete";

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    continuation_decision_build: 511,
    continuation_decision_authority: "maintenance_fleet_pilot_continuation_decision",
    retained_continuity_build: 501,
    retained_continuity_authority: "maintenance_fleet_pilot_outcome_continuity_review",
    status,
    source_status: clean(continuity.status) || "unavailable",
    evidence: Object.freeze({
      source_recognized: sourceRecognized,
      authorization_attributable: authorized,
      current_execution_evidence_present: executionPresent,
      participant_bound_satisfied: participantBoundSatisfied,
      duration_bound_satisfied: durationBoundSatisfied,
      capacity_revalidation_complete: dimensions.capacity_revalidation_complete === true,
      invoicing_evidence_complete: dimensions.invoicing_evidence_complete === true,
      travel_evidence_complete: dimensions.travel_evidence_complete === true,
      stop_condition_evidence_complete: dimensions.stop_condition_evidence_complete === true,
      stop_condition_triggered: stopTriggered,
      evidence_complete: evidenceComplete,
      continuity_review_ready: continuityReviewReady,
      evidence_trace_key: clean(execution.evidence_trace_key) || null,
      historical_outcome_carry_forward_used: false
    }),
    owner_decision: Object.freeze({
      decision: explicitDecision || "not_recorded",
      decided_by: decidedBy || null,
      decided_at: decidedAt,
      attributable: decisionAttributable,
      explicit_manual_decision_required: true,
      continue_decision_accepted: status === "bounded_pilot_continuation_decision_recorded",
      hold_decision_accepted: status === "continuation_hold_recorded"
    }),
    bounds: Object.freeze({
      participant_limit: finiteWhole(authorization.participant_limit),
      duration_days: finiteWhole(authorization.duration_days),
      observed_participant_count: finiteWhole(bounds.observed_participant_count),
      observed_duration_days: finiteWhole(bounds.observed_duration_days)
    }),
    decision_boundary: Object.freeze({
      review_ready:
        status === "owner_action_continuation_decision_required" ||
        status === "continuation_hold_recorded" ||
        status === "bounded_pilot_continuation_decision_recorded",
      owner_decision_recorded:
        status === "continuation_hold_recorded" ||
        status === "bounded_pilot_continuation_decision_recorded",
      pilot_continuation_execution_authorized: false,
      separate_activation_required: true,
      automatic_stop_action_authorized: false,
      next_step: nextStep(status)
    }),
    truth_boundary: Object.freeze({
      participant_identity_exposed: false,
      customer_activation_performed: false,
      maintenance_enrollment_performed: false,
      fleet_account_activation_performed: false,
      booking_created_or_changed: false,
      capacity_reserved: false,
      guaranteed_capacity_inferred: false,
      invoice_created_or_changed: false,
      recurring_billing_enabled: false,
      pricing_or_discount_changed: false,
      participant_selection_inferred: false,
      travel_limit_inferred: false,
      pilot_continuation_executed: false,
      stop_action_executed: false,
      provider_or_business_mutation_performed: false,
      accounting_or_inventory_mutation_performed: false,
      schema_or_storage_mutation_performed: false,
      canonical_hold_mutated: false,
      permanent_polling: false
    })
  });
}

function nextStep(status) {
  if (status === "bounded_pilot_continuation_decision_recorded") return "Retain the explicit owner decision record; any pilot continuation execution requires a separate authorized action.";
  if (status === "continuation_hold_recorded") return "Retain the explicit hold decision and do not execute pilot continuation.";
  if (status === "owner_action_continuation_decision_required") return "Record an attributable explicit owner continue-or-hold decision; do not infer one from review-ready evidence.";
  if (status === "pilot_stop_condition_review_required") return "Review the triggered stop condition before any continue decision can be accepted.";
  if (status === "pilot_bounds_review_required") return "Reconcile participant or duration evidence against the explicit owner-approved bounds.";
  if (status === "owner_action_execution_evidence_required") return "Record current attributable bounded pilot execution evidence before continuation can be decided.";
  if (status === "owner_action_authorization_required") return "Restore explicit owner approval and bounded pilot authorization before continuation review.";
  if (status === "continuation_source_unavailable") return "Restore the retained Build 501 continuity source; never infer continuation from source/runtime GREEN.";
  return "Complete the missing capacity, invoicing, travel or stop-condition evidence.";
}
function normalizeDecision(value) {
  const v = clean(value).toLowerCase();
  return v === "continue" || v === "hold" ? v : null;
}
function objectOrEmpty(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value){ return String(value ?? "").trim(); }
function validIso(value){ const text=clean(value); return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null; }
function finiteWhole(value){ if(value===null||value===undefined||value==="") return null; const n=Number(value); return Number.isFinite(n) && n>=0 ? Math.floor(n) : null; }
