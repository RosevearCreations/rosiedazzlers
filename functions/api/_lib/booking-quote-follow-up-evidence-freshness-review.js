// Build 532 — Booking & Quote Follow-Up Evidence Freshness Review.
// Read-only freshness reconciliation over retained Build 522 follow-up outcomes.
// Revalidates measurement-lock continuity, authorization/observation freshness,
// comparable allocation/duration, Southern Ontario weather eligibility and stop conditions.

const DEFAULT_FRESHNESS_WINDOW_DAYS = 30;

export function buildBookingQuoteFollowUpEvidenceFreshnessReview({
  follow_up_outcome_continuity = {},
  generated_at = null,
  freshness_window_days = DEFAULT_FRESHNESS_WINDOW_DAYS
} = {}) {
  const generatedAt = validDate(generated_at) ? new Date(generated_at) : new Date();
  const windowDays = normalizeWindow(freshness_window_days);
  const source = objectOrEmpty(follow_up_outcome_continuity);
  const sourceRecognized =
    Number(source.follow_up_outcome_build) === 522 &&
    clean(source.follow_up_outcome_authority) === "booking_quote_experiment_follow_up_outcome_continuity";

  const rows = safeArray(source.rows).map((value) => reviewRow(value, generatedAt, windowDays, sourceRecognized));
  const currentRows = rows.filter((row) => row.freshness_state.endsWith("_current"));

  return Object.freeze({
    generated_at: generatedAt.toISOString(),
    booking_quote_follow_up_freshness_build: 532,
    booking_quote_follow_up_freshness_authority: "booking_quote_follow_up_evidence_freshness_review",
    retained_follow_up_outcome_build: 522,
    retained_follow_up_decision_build: 512,
    retained_outcome_interpretation_build: 502,
    retained_execution_evidence_build: 492,
    retained_measurement_lock_build: 481,
    source_recognized: sourceRecognized,
    freshness_window_days: windowDays,
    definition_count: rows.length,
    current_outcome_count: currentRows.length,
    review_required_count: rows.filter((row) => !row.freshness_state.endsWith("_current")).length,
    stop_condition_review_required_count: rows.filter((row) => row.freshness_state === "follow_up_stop_condition_review_required").length,
    rows: Object.freeze(rows),
    review_contract: Object.freeze({
      retained_measurement_lock_must_match: true,
      retained_primary_metric_must_match: true,
      comparable_allocation_and_duration_must_remain_current: true,
      southern_ontario_weather_eligibility_must_remain_explicit: true,
      weather_ineligible_sessions_remain_excluded_from_conversion_denominator: true,
      continue_observation_requires_current_separate_authorization: true,
      continue_observation_requires_later_current_attributable_observation: true,
      current_triggered_stop_condition_requires_review: true,
      historical_outcome_carry_forward_used: false,
      source_or_runtime_green_proves_current_follow_up_evidence: false
    }),
    truth_boundary: Object.freeze({
      winner_selected: false,
      success_declared: false,
      price_or_discount_changed: false,
      booking_rule_changed: false,
      availability_rule_changed: false,
      outreach_sent: false,
      booking_created_or_changed: false,
      provider_mutation_performed: false,
      customer_identity_join_performed: false,
      canonical_hold_mutated: false,
      schema_or_storage_mutated: false,
      permanent_polling: false
    })
  });
}

function reviewRow(value, generatedAt, windowDays, sourceRecognized) {
  const row = objectOrEmpty(value);
  const retained = objectOrEmpty(row.retained_measurement_and_comparison);
  const owner = objectOrEmpty(row.owner_outcome);
  const boundary = objectOrEmpty(row.outcome_boundary);
  const truth = objectOrEmpty(row.truth_boundary);

  const outcome = normalizeOutcome(owner.outcome);
  const reviewedAt = iso(owner.reviewed_at);
  const reviewAgeDays = ageDays(reviewedAt, generatedAt);
  const reviewCurrent = Boolean(reviewedAt) && reviewAgeDays !== null && reviewAgeDays <= windowDays;

  const authorizedAt = iso(owner.follow_up_authorized_at);
  const observedAt = iso(owner.follow_up_observed_at);
  const authorizationAgeDays = ageDays(authorizedAt, generatedAt);
  const observationAgeDays = ageDays(observedAt, generatedAt);
  const authorizationCurrent =
    outcome !== "continue_observation" ||
    (Boolean(authorizedAt) && authorizationAgeDays !== null && authorizationAgeDays <= windowDays);
  const observationCurrent =
    outcome !== "continue_observation" ||
    (
      Boolean(observedAt) &&
      observationAgeDays !== null &&
      observationAgeDays <= windowDays &&
      Boolean(authorizedAt) &&
      Date.parse(observedAt) >= Date.parse(authorizedAt)
    );

  const retainedArms = uniqueStrings(retained.allocation_arms);
  const ownerArms = uniqueStrings(owner.allocation_arms);
  const measurementMatches =
    positiveWhole(retained.measurement_lock_revision) !== null &&
    positiveWhole(owner.measurement_lock_revision) === positiveWhole(retained.measurement_lock_revision) &&
    Boolean(clean(retained.primary_metric)) &&
    clean(owner.primary_metric) === clean(retained.primary_metric);

  const comparableCurrent =
    retained.current_comparable === true &&
    retained.duration_within_authorization === true &&
    retained.allocation_coverage_complete === true &&
    retained.allocation_comparison_complete === true &&
    positiveWhole(retained.authorized_duration_days) !== null &&
    retainedArms.length >= 2;

  const traceCurrent =
    owner.attributable === true &&
    owner.trace_matches === true &&
    owner.outcome_matches_source_decision === true &&
    Boolean(clean(owner.outcome_reference));

  const continueEvidenceCurrent =
    outcome !== "continue_observation" ||
    (
      measurementMatches &&
      sameStrings(retainedArms, ownerArms) &&
      owner.duration_within_retained_authorization === true &&
      owner.observed_duration_within_follow_up === true &&
      owner.weather_eligibility_observed === true &&
      owner.weather_ineligible_excluded === true &&
      owner.comparable_allocation_observations === true &&
      owner.outcome_observed === true &&
      owner.follow_up_activity_complete === true
    );

  const stopTriggered =
    boundary.triggered_stop_condition_requires_review === true ||
    owner.stop_condition_triggered === true ||
    positiveWhole(retained.stop_condition_triggered_count) > 0;

  let freshnessState = "follow_up_freshness_source_unavailable";
  if (sourceRecognized && !comparableCurrent) freshnessState = "retained_comparable_evidence_review_required";
  else if (sourceRecognized && comparableCurrent && stopTriggered) freshnessState = "follow_up_stop_condition_review_required";
  else if (sourceRecognized && comparableCurrent && !outcome) freshnessState = "follow_up_outcome_required";
  else if (sourceRecognized && comparableCurrent && !traceCurrent) freshnessState = "follow_up_outcome_trace_conflict_review_required";
  else if (sourceRecognized && comparableCurrent && !reviewCurrent) freshnessState = "owner_outcome_freshness_review_required";
  else if (sourceRecognized && comparableCurrent && outcome === "continue_observation" && !authorizationCurrent) freshnessState = "follow_up_authorization_freshness_review_required";
  else if (sourceRecognized && comparableCurrent && outcome === "continue_observation" && !observationCurrent) freshnessState = "follow_up_observation_freshness_review_required";
  else if (sourceRecognized && comparableCurrent && outcome === "continue_observation" && !continueEvidenceCurrent) freshnessState = "follow_up_evidence_freshness_review_required";
  else if (sourceRecognized && comparableCurrent && outcome === "continue_observation") freshnessState = "bounded_follow_up_observation_outcome_current";
  else if (sourceRecognized && comparableCurrent && outcome === "hold") freshnessState = "follow_up_hold_outcome_current";
  else if (sourceRecognized && comparableCurrent && outcome === "close_no_change") freshnessState = "no_change_closure_outcome_current";
  else if (sourceRecognized && comparableCurrent && outcome === "separate_change_review") freshnessState = "separate_change_review_outcome_current";

  return Object.freeze({
    key: clean(row.key) || "unknown",
    area: clean(row.area) || "unknown",
    retained_status: clean(row.status) || "unavailable",
    freshness_state: freshnessState,
    retained_measurement: Object.freeze({
      measurement_lock_revision: positiveWhole(retained.measurement_lock_revision),
      primary_metric: clean(retained.primary_metric) || null,
      authorized_duration_days: positiveWhole(retained.authorized_duration_days),
      allocation_arms: Object.freeze(retainedArms),
      current_comparable: comparableCurrent,
      weather_ineligible_row_count: nonnegativeWhole(retained.weather_ineligible_row_count),
      stop_condition_triggered_count: nonnegativeWhole(retained.stop_condition_triggered_count)
    }),
    owner_outcome_freshness: Object.freeze({
      outcome: outcome || "not_recorded",
      reviewed_at: reviewedAt,
      review_age_days: reviewAgeDays,
      review_current: reviewCurrent,
      outcome_reference: clean(owner.outcome_reference) || null,
      trace_current: traceCurrent,
      follow_up_authorized_at: authorizedAt,
      authorization_age_days: authorizationAgeDays,
      authorization_current: authorizationCurrent,
      follow_up_observed_at: observedAt,
      observation_age_days: observationAgeDays,
      observation_current: observationCurrent,
      measurement_matches_retained: measurementMatches,
      allocation_matches_retained: sameStrings(retainedArms, ownerArms),
      duration_within_retained_authorization: owner.duration_within_retained_authorization === true,
      observed_duration_within_follow_up: owner.observed_duration_within_follow_up === true,
      weather_eligibility_observed: owner.weather_eligibility_observed === true,
      weather_ineligible_excluded: owner.weather_ineligible_excluded === true,
      comparable_allocation_observations: owner.comparable_allocation_observations === true,
      outcome_observed: owner.outcome_observed === true,
      follow_up_activity_complete: owner.follow_up_activity_complete === true,
      stop_condition_triggered: owner.stop_condition_triggered === true
    }),
    outcome_boundary: Object.freeze({
      current: freshnessState.endsWith("_current"),
      review_required: !freshnessState.endsWith("_current"),
      triggered_stop_condition_requires_review: stopTriggered,
      winner_selected: false,
      success_declared: false,
      business_change_authorized: false
    }),
    truth_boundary: Object.freeze({
      weather_ineligible_session_is_conversion_failure: false,
      exact_service_temperature_limit_inferred: false,
      experiment_success_claimed: false,
      winner_selected: false,
      price_causation_claimed: false,
      customer_motive_inferred: false,
      price_or_discount_changed: truth.price_or_discount_changed === true ? true : false,
      booking_rule_changed: truth.booking_rule_changed === true ? true : false,
      availability_rule_changed: truth.availability_rule_changed === true ? true : false,
      outreach_sent: truth.outreach_sent === true ? true : false,
      booking_created_or_changed: truth.booking_created_or_changed === true ? true : false,
      provider_mutation_performed: truth.provider_mutation_performed === true ? true : false,
      customer_identity_join_performed: truth.customer_identity_join_performed === true ? true : false,
      canonical_hold_mutated: false,
      schema_or_storage_mutated: false,
      permanent_polling: false
    })
  });
}

function normalizeOutcome(value){ const v=clean(value).toLowerCase(); return ["hold","continue_observation","close_no_change","separate_change_review"].includes(v)?v:null; }
function normalizeWindow(value){ const n=Number(value); return Number.isFinite(n)&&n>=1&&n<=180?Math.floor(n):DEFAULT_FRESHNESS_WINDOW_DAYS; }
function ageDays(value, generatedAt){ if(!validDate(value)) return null; const ms=generatedAt.getTime()-new Date(value).getTime(); return Number.isFinite(ms)?Math.max(0,Math.floor(ms/86400000)):null; }
function objectOrEmpty(value){ return value&&typeof value==="object"&&!Array.isArray(value)?value:{}; }
function safeArray(value){ return Array.isArray(value)?value:[]; }
function clean(value){ return String(value??"").trim(); }
function validDate(value){ const text=clean(value); return Boolean(text)&&Number.isFinite(Date.parse(text)); }
function iso(value){ return validDate(value)?new Date(value).toISOString():null; }
function positiveWhole(value){ if(value===null||value===undefined||value==="")return null; const n=Number(value); return Number.isFinite(n)&&n>0?Math.floor(n):null; }
function nonnegativeWhole(value){ if(value===null||value===undefined||value==="")return 0; const n=Number(value); return Number.isFinite(n)&&n>=0?Math.floor(n):0; }
function uniqueStrings(value){ return [...new Set(safeArray(value).map(v=>clean(v).toLowerCase()).filter(Boolean))].sort(); }
function sameStrings(a,b){ return a.length===b.length&&a.every((value,index)=>value===b[index]); }
