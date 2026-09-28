// Build 521 — Maintenance & Fleet Continuation Outcome Continuity.
// Read-only outcome continuity over retained Build 511 explicit owner decisions and Build 501/491 current evidence.
// A continue outcome is observed only when it is trace-matched, explicitly authorized and explicitly observed.

export function buildMaintenanceFleetContinuationOutcomeContinuity({
  pilot_continuation_decision = {},
  continuation_outcome_record = {},
  generated_at = new Date().toISOString()
} = {}) {
  const decision = objectOrEmpty(pilot_continuation_decision);
  const evidence = objectOrEmpty(decision.evidence);
  const ownerDecision = objectOrEmpty(decision.owner_decision);
  const bounds = objectOrEmpty(decision.bounds);
  const record = objectOrEmpty(continuation_outcome_record);

  const sourceRecognized =
    Number(decision.continuation_decision_build) === 511 &&
    clean(decision.continuation_decision_authority) === "maintenance_fleet_pilot_continuation_decision";
  const participantBoundSatisfied = evidence.participant_bound_satisfied === true;
  const durationBoundSatisfied = evidence.duration_bound_satisfied === true;
  const stopTriggered = evidence.stop_condition_triggered === true;
  const evidenceComplete =
    evidence.evidence_complete === true &&
    evidence.continuity_review_ready === true &&
    evidence.current_execution_evidence_present === true &&
    evidence.capacity_revalidation_complete === true &&
    evidence.invoicing_evidence_complete === true &&
    evidence.travel_evidence_complete === true &&
    evidence.stop_condition_evidence_complete === true;

  const sourceDecision = normalizeOutcome(ownerDecision.decision);
  const sourceDecisionAccepted =
    ownerDecision.attributable === true &&
    (
      (sourceDecision === "continue" && ownerDecision.continue_decision_accepted === true &&
        clean(decision.status) === "bounded_pilot_continuation_decision_recorded") ||
      (sourceDecision === "hold" && ownerDecision.hold_decision_accepted === true &&
        clean(decision.status) === "continuation_hold_recorded")
    );

  const decisionTraceKey = buildDecisionTraceKey(decision);
  const outcome = normalizeOutcome(record.outcome);
  const reviewedBy = clean(record.reviewed_by);
  const reviewedAt = validIso(record.reviewed_at);
  const outcomeReference = clean(record.outcome_reference);
  const recordTraceKey = clean(record.decision_trace_key);
  const outcomeRecordAttributable =
    Boolean(outcome) && Boolean(reviewedBy) && Boolean(reviewedAt) &&
    Boolean(outcomeReference) && Boolean(recordTraceKey);

  const traceMatches = Boolean(decisionTraceKey) && recordTraceKey === decisionTraceKey;
  const outcomeMatchesDecision = Boolean(outcome) && outcome === sourceDecision;
  const authorizedAt = validIso(record.continuation_authorized_at);
  const observedAt = validIso(record.continuation_observed_at);
  const sourceDecidedAt = validIso(ownerDecision.decided_at);
  const authorizationFollowsDecision =
    !authorizedAt || !sourceDecidedAt || Date.parse(authorizedAt) >= Date.parse(sourceDecidedAt);
  const continuationObservationComplete =
    outcome === "continue"
      ? Boolean(authorizedAt) && Boolean(observedAt) && authorizationFollowsDecision &&
        Date.parse(observedAt) >= Date.parse(authorizedAt)
      : outcome === "hold";

  let status = "continuation_source_unavailable";
  if (sourceRecognized && stopTriggered) status = "pilot_stop_condition_review_required";
  else if (sourceRecognized && (!participantBoundSatisfied || !durationBoundSatisfied)) status = "pilot_bounds_review_required";
  else if (sourceRecognized && !evidenceComplete) status = "continuation_evidence_incomplete";
  else if (sourceRecognized && !sourceDecisionAccepted) status = "owner_continuation_decision_required";
  else if (sourceRecognized && sourceDecisionAccepted && !outcomeRecordAttributable) status = "owner_continuation_outcome_required";
  else if (sourceRecognized && sourceDecisionAccepted && (!traceMatches || !outcomeMatchesDecision)) status = "continuation_outcome_evidence_conflict";
  else if (sourceRecognized && sourceDecisionAccepted && outcome === "continue" && !continuationObservationComplete) status = "continuation_observation_required";
  else if (sourceRecognized && sourceDecisionAccepted && outcome === "hold") status = "continuation_hold_outcome_observed";
  else if (sourceRecognized && sourceDecisionAccepted && outcome === "continue") status = "bounded_pilot_continuation_outcome_observed";

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    continuation_outcome_build: 521,
    continuation_outcome_authority: "maintenance_fleet_continuation_outcome_continuity",
    retained_decision_build: 511,
    retained_decision_authority: "maintenance_fleet_pilot_continuation_decision",
    retained_continuity_build: 501,
    retained_outcome_build: 491,
    status,
    source_status: clean(decision.status) || "unavailable",
    evidence: Object.freeze({
      source_recognized: sourceRecognized,
      source_decision_accepted: sourceDecisionAccepted,
      current_execution_evidence_present: evidence.current_execution_evidence_present === true,
      participant_bound_satisfied: participantBoundSatisfied,
      duration_bound_satisfied: durationBoundSatisfied,
      capacity_revalidation_complete: evidence.capacity_revalidation_complete === true,
      invoicing_evidence_complete: evidence.invoicing_evidence_complete === true,
      travel_evidence_complete: evidence.travel_evidence_complete === true,
      stop_condition_evidence_complete: evidence.stop_condition_evidence_complete === true,
      stop_condition_triggered: stopTriggered,
      evidence_complete: evidenceComplete,
      source_evidence_trace_key: clean(evidence.evidence_trace_key) || null,
      expected_decision_trace_key: decisionTraceKey,
      record_trace_matches: traceMatches,
      outcome_matches_source_decision: outcomeMatchesDecision,
      historical_outcome_carry_forward_used: false
    }),
    owner_outcome: Object.freeze({
      outcome: outcome || "not_recorded",
      reviewed_by: reviewedBy || null,
      reviewed_at: reviewedAt,
      outcome_reference: outcomeReference || null,
      decision_trace_key: recordTraceKey || null,
      attributable: outcomeRecordAttributable,
      continuation_authorized_at: authorizedAt,
      continuation_observed_at: observedAt,
      authorization_follows_decision: authorizationFollowsDecision,
      continuation_observation_complete: continuationObservationComplete,
      continue_outcome_observed: status === "bounded_pilot_continuation_outcome_observed",
      hold_outcome_observed: status === "continuation_hold_outcome_observed"
    }),
    bounds: Object.freeze({
      participant_limit: finiteWhole(bounds.participant_limit),
      duration_days: finiteWhole(bounds.duration_days),
      observed_participant_count: finiteWhole(bounds.observed_participant_count),
      observed_duration_days: finiteWhole(bounds.observed_duration_days)
    }),
    outcome_boundary: Object.freeze({
      outcome_review_complete:
        status === "bounded_pilot_continuation_outcome_observed" ||
        status === "continuation_hold_outcome_observed",
      continuation_observed: status === "bounded_pilot_continuation_outcome_observed",
      hold_observed: status === "continuation_hold_outcome_observed",
      triggered_stop_condition_requires_review: stopTriggered,
      customer_or_commercial_activation_authorized: false,
      automatic_stop_action_authorized: false,
      automatic_canonical_hold_narrowing_authorized: false,
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
      pilot_continuation_executed_by_this_authority: false,
      stop_action_executed: false,
      provider_or_business_mutation_performed: false,
      accounting_or_inventory_mutation_performed: false,
      schema_or_storage_mutation_performed: false,
      canonical_hold_mutated: false,
      permanent_polling: false
    })
  });
}

function buildDecisionTraceKey(decision) {
  const evidence = objectOrEmpty(decision.evidence);
  const owner = objectOrEmpty(decision.owner_decision);
  const bounds = objectOrEmpty(decision.bounds);
  const evidenceTrace = clean(evidence.evidence_trace_key);
  const ownerDecision = normalizeOutcome(owner.decision);
  const decidedAt = validIso(owner.decided_at);
  if (!evidenceTrace || !ownerDecision || !decidedAt) return null;
  return [
    "maintenance-fleet", evidenceTrace, ownerDecision, decidedAt,
    finiteWhole(bounds.observed_participant_count) ?? "no-participants",
    finiteWhole(bounds.observed_duration_days) ?? "no-duration"
  ].join("|");
}
function nextStep(status) {
  if (status === "bounded_pilot_continuation_outcome_observed") return "Retain the trace-matched authorized and observed continuation outcome; any wider enrollment, billing, booking or capacity action remains separately authorized.";
  if (status === "continuation_hold_outcome_observed") return "Retain the explicit trace-matched hold outcome; do not infer continuation.";
  if (status === "continuation_observation_required") return "Record explicit continuation authorization and a later attributable continuation observation before treating the continue outcome as observed.";
  if (status === "continuation_outcome_evidence_conflict") return "Reconcile the owner outcome with the exact current Build 511 decision trace and decision value.";
  if (status === "owner_continuation_outcome_required") return "Record an attributable explicit owner continue-or-hold outcome tied to the expected decision trace.";
  if (status === "owner_continuation_decision_required") return "Complete the retained Build 511 explicit owner continuation decision first.";
  if (status === "pilot_stop_condition_review_required") return "Review the triggered stop condition before any continuation outcome can be accepted.";
  if (status === "pilot_bounds_review_required") return "Reconcile participant or duration evidence against the explicit owner-approved bounds.";
  if (status === "continuation_evidence_incomplete") return "Complete current participant/duration, capacity, invoicing, travel and stop-condition evidence.";
  return "Restore the retained Build 511 continuation decision source; source/runtime GREEN is not an observed outcome.";
}
function normalizeOutcome(value){ const v=clean(value).toLowerCase(); return v === "continue" || v === "hold" ? v : null; }
function objectOrEmpty(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value){ return String(value ?? "").trim(); }
function validIso(value){ const text=clean(value); return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null; }
function finiteWhole(value){ if(value===null||value===undefined||value==="") return null; const n=Number(value); return Number.isFinite(n) && n>=0 ? Math.floor(n) : null; }
