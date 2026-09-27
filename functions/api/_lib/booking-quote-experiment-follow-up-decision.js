// Build 512 — Booking & Quote Experiment Follow-Up Decision.
// Read-only owner follow-up decision over retained Build 502 interpretation.
// No accepted decision selects a winner or executes a business change.

export function buildBookingQuoteExperimentFollowUpDecision({
  outcome_interpretation = {},
  follow_up_decision_records = {},
  generated_at = new Date().toISOString()
} = {}) {
  const sourceRecognized =
    outcome_interpretation?.build === 502 &&
    outcome_interpretation?.authority === "booking_quote_experiment_outcome_interpretation";
  const rows = Array.isArray(outcome_interpretation?.rows) ? outcome_interpretation.rows : [];
  const records = objectOrEmpty(follow_up_decision_records?.records || follow_up_decision_records);

  const decisions = rows.map(row => {
    const key = clean(row?.key) || "unknown";
    const sourceStatus = clean(row?.status) || "outcome_interpretation_unavailable";
    const evidence = objectOrEmpty(row?.interpretation_evidence);
    const execution = objectOrEmpty(row?.execution_context);
    const record = objectOrEmpty(records[key]);
    const decision = normalizeDecision(record.decision);
    const decidedBy = clean(record.decided_by) || null;
    const decidedAt = validIso(record.decided_at);
    const decisionAttributable = Boolean(decision && decidedBy && decidedAt);
    const comparable = sourceStatus === "descriptive_outcome_interpretation_ready" &&
      evidence.allocation_comparison_complete === true;
    const stopTriggered = sourceStatus === "stop_condition_review_required" ||
      Number(execution.stop_condition_triggered_count || 0) > 0;

    let status = "outcome_interpretation_source_unavailable";
    if (sourceRecognized && stopTriggered) status = "stop_condition_review_required";
    else if (sourceRecognized && !comparable) status = "comparable_outcomes_required";
    else if (sourceRecognized && comparable && !decisionAttributable) status = "owner_follow_up_decision_required";
    else if (decision === "hold") status = "follow_up_hold_recorded";
    else if (decision === "continue_observation") status = "continued_observation_decision_recorded";
    else if (decision === "close_no_change") status = "no_change_closure_decision_recorded";
    else if (decision === "separate_change_review") status = "separate_change_review_decision_recorded";

    const accepted = sourceRecognized && comparable && !stopTriggered && decisionAttributable;
    return Object.freeze({
      key,
      area: clean(row?.area) || "unknown",
      status,
      retained_outcome_interpretation: Object.freeze({
        build: 502,
        status: sourceStatus,
        comparable_allocation_outcomes: comparable,
        attributable_metric_row_count: nonnegativeWhole(evidence.attributable_metric_row_count) ?? 0,
        weather_ineligible_row_count: nonnegativeWhole(execution.weather_ineligible_row_count) ?? 0,
        stop_condition_triggered_count: nonnegativeWhole(execution.stop_condition_triggered_count) ?? 0,
        threshold_evaluation: clean(row?.interpretation?.threshold_evaluation) || null,
        success: null,
        winner: null
      }),
      owner_follow_up: Object.freeze({
        decision: accepted ? decision : null,
        decided_by: accepted ? decidedBy : null,
        decided_at: accepted ? decidedAt : null,
        note: accepted ? (clean(record.note) || null) : null,
        accepted,
        allowed_decisions: Object.freeze(["hold","continue_observation","close_no_change","separate_change_review"])
      }),
      decision_boundary: Object.freeze({
        owner_follow_up_recorded: accepted,
        separate_business_change_review_requested: accepted && decision === "separate_change_review",
        business_change_authorized: false,
        experiment_execution_authorized: false,
        winner_selection_authorized: false
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
    follow_up_decision_build: 512,
    follow_up_decision_authority: "booking_quote_experiment_follow_up_decision",
    retained_outcome_interpretation_build: 502,
    retained_execution_evidence_build: 492,
    retained_measurement_lock_build: 481,
    source_recognized: sourceRecognized,
    definition_count: decisions.length,
    accepted_follow_up_decision_count: decisions.filter(row => row.owner_follow_up.accepted).length,
    stop_condition_review_required_count: decisions.filter(row => row.status === "stop_condition_review_required").length,
    owner_follow_up_decision_required_count: decisions.filter(row => row.status === "owner_follow_up_decision_required").length,
    rows: Object.freeze(decisions),
    boundaries: Object.freeze({
      retained_outcome_interpretation_only: true,
      comparable_attributable_outcomes_required: true,
      weather_ineligible_excluded_from_conversion_denominator: true,
      triggered_stop_condition_blocks_decision_acceptance: true,
      explicit_owner_follow_up_required: true,
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

function normalizeDecision(value){
  const v=clean(value).toLowerCase();
  return ["hold","continue_observation","close_no_change","separate_change_review"].includes(v)?v:null;
}
function objectOrEmpty(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value){ return String(value ?? "").trim(); }
function validIso(value){ const text=clean(value); return text&&Number.isFinite(Date.parse(text))?new Date(text).toISOString():null; }
function nonnegativeWhole(value){ if(value===null||value===undefined||value==="") return null; const n=Number(value); return Number.isFinite(n)&&n>=0?Math.floor(n):null; }
