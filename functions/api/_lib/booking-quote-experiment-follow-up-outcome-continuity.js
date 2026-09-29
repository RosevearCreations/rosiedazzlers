// Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity.
// Read-only outcome continuity over retained Build 512 decisions and current Build 502/492/481 evidence.
// A continued-observation outcome is observed only when separately authorized, bounded, comparable and later observed.

export function buildBookingQuoteExperimentFollowUpOutcomeContinuity({
  follow_up_decision = {},
  outcome_interpretation = {},
  follow_up_outcome_records = {},
  generated_at = new Date().toISOString()
} = {}) {
  const decisionSourceRecognized =
    Number(follow_up_decision?.follow_up_decision_build) === 512 &&
    clean(follow_up_decision?.follow_up_decision_authority) === "booking_quote_experiment_follow_up_decision";
  const interpretationSourceRecognized =
    Number(outcome_interpretation?.build) === 502 &&
    clean(outcome_interpretation?.authority) === "booking_quote_experiment_outcome_interpretation";
  const decisionRows = safeArray(follow_up_decision?.rows);
  const interpretationByKey = new Map(safeArray(outcome_interpretation?.rows).map(row => [clean(row?.key) || "unknown", row]));
  const records = objectOrEmpty(follow_up_outcome_records?.records || follow_up_outcome_records);

  const rows = decisionRows.map(decisionRow => {
    const key = clean(decisionRow?.key) || "unknown";
    const interpretation = objectOrEmpty(interpretationByKey.get(key));
    const measurement = objectOrEmpty(interpretation.measurement_contract);
    const execution = objectOrEmpty(interpretation.execution_context);
    const evidence = objectOrEmpty(interpretation.interpretation_evidence);
    const ownerDecision = objectOrEmpty(decisionRow.owner_follow_up);
    const record = objectOrEmpty(records[key]);

    const sourceDecision = normalizeOutcome(ownerDecision.decision);
    const sourceDecisionAccepted = ownerDecision.accepted === true && Boolean(sourceDecision);
    const sourceDecidedAt = validIso(ownerDecision.decided_at);
    const stopTriggered =
      clean(decisionRow.status) === "stop_condition_review_required" ||
      clean(interpretation.status) === "stop_condition_review_required" ||
      nonnegativeWhole(execution.stop_condition_triggered_count) > 0;
    const currentComparable =
      interpretationSourceRecognized &&
      clean(interpretation.status) === "descriptive_outcome_interpretation_ready" &&
      evidence.allocation_comparison_complete === true &&
      execution.duration_within_authorization === true &&
      execution.allocation_coverage_complete === true &&
      positiveWhole(measurement.revision) !== null &&
      Boolean(clean(measurement.primary_metric)) &&
      positiveWhole(execution.authorized_duration_days) !== null &&
      uniqueStrings(execution.allocation_arms).length >= 2 &&
      !stopTriggered;

    const traceKey = buildDecisionTraceKey({key, ownerDecision, interpretation});
    const outcome = normalizeOutcome(record.outcome);
    const reviewedBy = clean(record.reviewed_by);
    const reviewedAt = validIso(record.reviewed_at);
    const outcomeReference = clean(record.outcome_reference);
    const recordTraceKey = clean(record.decision_trace_key);
    const outcomeRecordAttributable = Boolean(outcome && reviewedBy && reviewedAt && outcomeReference && recordTraceKey);
    const traceMatches = Boolean(traceKey) && recordTraceKey === traceKey;
    const outcomeMatchesDecision = Boolean(outcome) && outcome === sourceDecision;

    const followUpAuthorizedAt = validIso(record.follow_up_authorized_at);
    const followUpObservedAt = validIso(record.follow_up_observed_at);
    const authorizationFollowsDecision =
      !followUpAuthorizedAt || !sourceDecidedAt || Date.parse(followUpAuthorizedAt) >= Date.parse(sourceDecidedAt);
    const observationFollowsAuthorization =
      !followUpObservedAt || !followUpAuthorizedAt || Date.parse(followUpObservedAt) >= Date.parse(followUpAuthorizedAt);
    const recordRevision = positiveWhole(record.measurement_lock_revision);
    const expectedRevision = positiveWhole(measurement.revision);
    const recordMetric = clean(record.primary_metric);
    const expectedMetric = clean(measurement.primary_metric);
    const durationDays = positiveWhole(record.duration_days);
    const observedDurationDays = positiveWhole(record.observed_duration_days);
    const maxDurationDays = positiveWhole(execution.authorized_duration_days);
    const expectedArms = uniqueStrings(execution.allocation_arms);
    const recordArms = uniqueStrings(record.allocation_arms);
    const allocationMatches = sameStrings(expectedArms, recordArms);
    const durationWithinBound = Boolean(durationDays && maxDurationDays && durationDays <= maxDurationDays);
    const observedDurationWithinBound = Boolean(observedDurationDays && durationDays && observedDurationDays <= durationDays);
    const weatherObserved = record.weather_eligibility_observed === true;
    const weatherExcluded = record.weather_ineligible_excluded === true;
    const comparableFollowUp = record.comparable_allocation_observations === true;
    const outcomeObserved = record.outcome_observed === true;
    const followUpStopTriggered = record.stop_condition_triggered === true;
    const followUpActivityComplete =
      sourceDecision === "continue_observation" &&
      Boolean(followUpAuthorizedAt && followUpObservedAt) &&
      authorizationFollowsDecision && observationFollowsAuthorization &&
      recordRevision === expectedRevision && recordMetric === expectedMetric &&
      allocationMatches && durationWithinBound && observedDurationWithinBound &&
      weatherObserved && weatherExcluded && comparableFollowUp && outcomeObserved &&
      !followUpStopTriggered;

    let status = "follow_up_source_unavailable";
    if (decisionSourceRecognized && interpretationSourceRecognized && stopTriggered) status = "stop_condition_review_required";
    else if (decisionSourceRecognized && interpretationSourceRecognized && !currentComparable) status = "comparable_follow_up_evidence_required";
    else if (decisionSourceRecognized && interpretationSourceRecognized && currentComparable && !sourceDecisionAccepted) status = "owner_follow_up_decision_required";
    else if (sourceDecisionAccepted && !outcomeRecordAttributable) status = "owner_follow_up_outcome_required";
    else if (sourceDecisionAccepted && (!traceMatches || !outcomeMatchesDecision)) status = "follow_up_outcome_evidence_conflict";
    else if (sourceDecision === "continue_observation" && !followUpAuthorizedAt) status = "follow_up_activity_authorization_required";
    else if (sourceDecision === "continue_observation" && followUpStopTriggered) status = "follow_up_activity_stop_condition_review_required";
    else if (sourceDecision === "continue_observation" && !followUpActivityComplete) status = "follow_up_activity_evidence_incomplete";
    else if (sourceDecision === "continue_observation") status = "bounded_follow_up_observation_outcome_observed";
    else if (sourceDecision === "hold") status = "follow_up_hold_outcome_observed";
    else if (sourceDecision === "close_no_change") status = "no_change_closure_outcome_observed";
    else if (sourceDecision === "separate_change_review") status = "separate_change_review_outcome_observed";

    return Object.freeze({
      key,
      area: clean(decisionRow?.area) || clean(interpretation?.area) || "unknown",
      status,
      retained_follow_up_decision: Object.freeze({
        build: 512,
        status: clean(decisionRow.status) || "unavailable",
        decision: sourceDecision,
        accepted: sourceDecisionAccepted,
        decided_by: sourceDecisionAccepted ? (clean(ownerDecision.decided_by) || null) : null,
        decided_at: sourceDecisionAccepted ? sourceDecidedAt : null,
        expected_decision_trace_key: traceKey
      }),
      retained_measurement_and_comparison: Object.freeze({
        build: 502,
        source_recognized: interpretationSourceRecognized,
        status: clean(interpretation.status) || "unavailable",
        measurement_lock_revision: expectedRevision,
        primary_metric: expectedMetric || null,
        authorized_duration_days: maxDurationDays,
        allocation_arms: Object.freeze(expectedArms),
        duration_within_authorization: execution.duration_within_authorization === true,
        allocation_coverage_complete: execution.allocation_coverage_complete === true,
        allocation_comparison_complete: evidence.allocation_comparison_complete === true,
        weather_ineligible_row_count: nonnegativeWhole(execution.weather_ineligible_row_count) ?? 0,
        stop_condition_triggered_count: nonnegativeWhole(execution.stop_condition_triggered_count) ?? 0,
        current_comparable: currentComparable,
        success: null,
        winner: null
      }),
      owner_outcome: Object.freeze({
        outcome: outcome || "not_recorded",
        reviewed_by: reviewedBy || null,
        reviewed_at: reviewedAt,
        outcome_reference: outcomeReference || null,
        decision_trace_key: recordTraceKey || null,
        attributable: outcomeRecordAttributable,
        trace_matches: traceMatches,
        outcome_matches_source_decision: outcomeMatchesDecision,
        follow_up_authorized_at: followUpAuthorizedAt,
        follow_up_observed_at: followUpObservedAt,
        authorization_follows_decision: authorizationFollowsDecision,
        observation_follows_authorization: observationFollowsAuthorization,
        measurement_lock_revision: recordRevision,
        primary_metric: recordMetric || null,
        duration_days: durationDays,
        observed_duration_days: observedDurationDays,
        allocation_arms: Object.freeze(recordArms),
        allocation_matches_retained: allocationMatches,
        duration_within_retained_authorization: durationWithinBound,
        observed_duration_within_follow_up: observedDurationWithinBound,
        weather_eligibility_observed: weatherObserved,
        weather_ineligible_excluded: weatherExcluded,
        comparable_allocation_observations: comparableFollowUp,
        outcome_observed: outcomeObserved,
        stop_condition_triggered: followUpStopTriggered,
        follow_up_activity_complete: followUpActivityComplete
      }),
      outcome_boundary: Object.freeze({
        outcome_review_complete: [
          "bounded_follow_up_observation_outcome_observed",
          "follow_up_hold_outcome_observed",
          "no_change_closure_outcome_observed",
          "separate_change_review_outcome_observed"
        ].includes(status),
        continued_observation_outcome_observed: status === "bounded_follow_up_observation_outcome_observed",
        triggered_stop_condition_requires_review: stopTriggered || followUpStopTriggered,
        winner_selected: false,
        success_declared: false,
        business_change_authorized: false,
        next_step: nextStep(status)
      }),
      truth_boundary: Object.freeze({
        weather_ineligible_session_is_conversion_failure: false,
        exact_service_temperature_limit_inferred: false,
        experiment_success_claimed: false,
        winner_selected: false,
        price_causation_claimed: false,
        customer_motive_inferred: false,
        price_or_discount_changed: false,
        booking_rule_changed: false,
        availability_rule_changed: false,
        booking_created_or_changed: false,
        outreach_sent: false,
        provider_mutation_performed: false,
        customer_identity_join_performed: false,
        canonical_hold_mutated: false,
        schema_or_storage_mutation_performed: false,
        permanent_polling: false
      })
    });
  });

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    follow_up_outcome_build: 522,
    follow_up_outcome_authority: "booking_quote_experiment_follow_up_outcome_continuity",
    retained_follow_up_decision_build: 512,
    retained_outcome_interpretation_build: 502,
    retained_execution_evidence_build: 492,
    retained_measurement_lock_build: 481,
    source_recognized: decisionSourceRecognized && interpretationSourceRecognized,
    definition_count: rows.length,
    observed_follow_up_outcome_count: rows.filter(row => row.outcome_boundary.outcome_review_complete).length,
    bounded_follow_up_observation_count: rows.filter(row => row.status === "bounded_follow_up_observation_outcome_observed").length,
    stop_condition_review_required_count: rows.filter(row => row.outcome_boundary.triggered_stop_condition_requires_review).length,
    rows: Object.freeze(rows),
    boundaries: Object.freeze({
      retained_follow_up_decision_only: true,
      retained_measurement_lock_and_execution_only: true,
      separate_follow_up_authorization_required_for_continued_observation: true,
      comparable_allocation_and_duration_required: true,
      weather_ineligible_excluded_from_conversion_denominator: true,
      triggered_stop_condition_blocks_follow_up_outcome_acceptance: true,
      automatic_winner_selection_allowed: false,
      automatic_success_claim_allowed: false,
      pricing_mutation_allowed: false,
      discount_mutation_allowed: false,
      booking_rule_mutation_allowed: false,
      availability_mutation_allowed: false,
      outreach_allowed: false,
      booking_mutation_allowed: false,
      provider_mutation_allowed: false,
      customer_identity_join_allowed: false,
      canonical_hold_mutation_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling_allowed: false
    })
  });
}

function buildDecisionTraceKey({key, ownerDecision, interpretation}) {
  const measurement = objectOrEmpty(interpretation.measurement_contract);
  const execution = objectOrEmpty(interpretation.execution_context);
  const decision = normalizeOutcome(ownerDecision.decision);
  const decidedAt = validIso(ownerDecision.decided_at);
  const revision = positiveWhole(measurement.revision);
  const metric = clean(measurement.primary_metric);
  const duration = positiveWhole(execution.authorized_duration_days);
  const arms = uniqueStrings(execution.allocation_arms);
  if (!clean(key) || !decision || !decidedAt || !revision || !metric || !duration || arms.length < 2) return null;
  return ["booking-quote", clean(key), revision, metric, decision, decidedAt, duration, arms.join(",")].join("|");
}
function nextStep(status) {
  if (status === "bounded_follow_up_observation_outcome_observed") return "Retain the trace-matched separately authorized and observed follow-up outcome; no winner or business change is implied.";
  if (status === "follow_up_hold_outcome_observed") return "Retain the explicit trace-matched hold outcome; do not infer experiment continuation or a winner.";
  if (status === "no_change_closure_outcome_observed") return "Retain the explicit trace-matched no-change closure outcome; no pricing, booking or availability change is authorized.";
  if (status === "separate_change_review_outcome_observed") return "Retain the explicit separate-change-review request only; any business change requires a separate authority.";
  if (status === "follow_up_activity_stop_condition_review_required") return "Review the triggered follow-up stop condition before treating continued observation as an accepted outcome.";
  if (status === "follow_up_activity_authorization_required") return "Record a separate attributable follow-up authorization before continued observation can count as an outcome.";
  if (status === "follow_up_activity_evidence_incomplete") return "Complete bounded duration/allocation, locked metric/revision, weather eligibility, comparability and later observation evidence.";
  if (status === "follow_up_outcome_evidence_conflict") return "Reconcile the explicit outcome with the exact current Build 512 decision trace and decision value.";
  if (status === "owner_follow_up_outcome_required") return "Record an attributable explicit follow-up outcome tied to the expected decision trace.";
  if (status === "owner_follow_up_decision_required") return "Complete the retained Build 512 explicit owner follow-up decision first.";
  if (status === "stop_condition_review_required") return "Review the retained triggered stop condition before accepting any follow-up outcome.";
  if (status === "comparable_follow_up_evidence_required") return "Restore current comparable allocation/duration and locked measurement evidence before outcome continuity review.";
  return "Restore retained Build 512 and Build 502 sources; source/runtime GREEN is not an observed follow-up outcome.";
}
function normalizeOutcome(value){ const v=clean(value).toLowerCase(); return ["hold","continue_observation","close_no_change","separate_change_review"].includes(v)?v:null; }
function objectOrEmpty(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function safeArray(value){ return Array.isArray(value) ? value : []; }
function clean(value){ return String(value ?? "").trim(); }
function validIso(value){ const text=clean(value); return text&&Number.isFinite(Date.parse(text))?new Date(text).toISOString():null; }
function positiveWhole(value){ if(value===null||value===undefined||value==="") return null; const n=Number(value); return Number.isFinite(n)&&n>0?Math.floor(n):null; }
function nonnegativeWhole(value){ if(value===null||value===undefined||value==="") return 0; const n=Number(value); return Number.isFinite(n)&&n>=0?Math.floor(n):0; }
function uniqueStrings(value){ return [...new Set(safeArray(value).map(v=>clean(v).toLowerCase()).filter(Boolean))].sort(); }
function sameStrings(a,b){ return a.length===b.length && a.every((value,index)=>value===b[index]); }
