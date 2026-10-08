// Build 542 — Booking & Quote Follow-Up Evidence Integrity Review.
// Read-only, fail-closed reconciliation of Build 532 freshness with exact Build 522 evidence.
// Never authorizes a winner, outreach, pricing, availability, booking or canonical HOLD mutation.

const CURRENT_STATES = Object.freeze({
  hold: "follow_up_hold_outcome_current",
  close_no_change: "no_change_closure_outcome_current",
  separate_change_review: "separate_change_review_outcome_current",
  continue_observation: "bounded_follow_up_observation_outcome_current"
});
const RETAINED_STATES = Object.freeze({
  hold: "follow_up_hold_outcome_observed",
  close_no_change: "no_change_closure_outcome_observed",
  separate_change_review: "separate_change_review_outcome_observed",
  continue_observation: "bounded_follow_up_observation_outcome_observed"
});

export function buildBookingQuoteFollowUpEvidenceIntegrityReview({
  follow_up_freshness = {},
  follow_up_outcome_continuity = {},
  generated_at = null
} = {}) {
  const evaluatedAt = iso(generated_at) || new Date().toISOString();
  const freshness = record(follow_up_freshness);
  const continuity = record(follow_up_outcome_continuity);
  const freshnessRecognized =
    Number(freshness.booking_quote_follow_up_freshness_build) === 532 &&
    clean(freshness.booking_quote_follow_up_freshness_authority) === "booking_quote_follow_up_evidence_freshness_review" &&
    freshness.source_recognized === true;
  const outcomeRecognized =
    Number(continuity.follow_up_outcome_build) === 522 &&
    clean(continuity.follow_up_outcome_authority) === "booking_quote_experiment_follow_up_outcome_continuity" &&
    continuity.source_recognized === true;
  const snapshotAt = iso(freshness.generated_at);
  // A previously computed "current" snapshot must not be carried forward indefinitely.
  const snapshotAgeMs = snapshotAt ? Date.parse(evaluatedAt) - Date.parse(snapshotAt) : NaN;
  const snapshotCurrent = Number.isFinite(snapshotAgeMs) && snapshotAgeMs >= -60000 && snapshotAgeMs <= 600000;
  const freshnessRows = Array.isArray(freshness.rows) ? freshness.rows : [];
  const retainedRows = Array.isArray(continuity.rows) ? continuity.rows : [];
  const freshMap = uniqueRows(freshnessRows);
  const retainedMap = uniqueRows(retainedRows);
  const rowSetExact = Boolean(freshMap && retainedMap && freshnessRows.length > 0 &&
    freshnessRows.length === retainedRows.length &&
    [...freshMap.keys()].every(key => retainedMap.has(key)));
  const rows = retainedRows.map(source => inspectRow(
    record(source), rowSetExact ? record(freshMap.get(clean(source.key))) : {},
    freshnessRecognized && outcomeRecognized && snapshotCurrent && rowSetExact,
    evaluatedAt, freshness.freshness_window_days
  ));
  const sourceAvailable = freshnessRecognized && outcomeRecognized && freshnessRows.length > 0 && retainedRows.length > 0;
  const status = !sourceAvailable ? "follow_up_integrity_source_unavailable" :
    !snapshotCurrent ? "retained_freshness_review_required" :
    !rowSetExact ? "follow_up_row_set_identity_review_required" :
    rows.find(row => row.integrity_state !== "booking_quote_follow_up_integrity_current")?.integrity_state ||
    "booking_quote_follow_up_integrity_current";
  return Object.freeze({
    generated_at: evaluatedAt,
    booking_quote_follow_up_integrity_build: 542,
    booking_quote_follow_up_integrity_authority: "booking_quote_follow_up_evidence_integrity_review",
    retained_freshness_build: 532,
    retained_outcome_build: 522,
    retained_decision_build: 512,
    retained_measurement_lock_build: 481,
    status,
    source_recognized: sourceAvailable,
    freshness_snapshot_current: snapshotCurrent,
    row_set_identity_exact: rowSetExact,
    definition_count: rows.length,
    integrity_current_count: rows.filter(row => row.integrity_state === "booking_quote_follow_up_integrity_current").length,
    review_required_count: rows.filter(row => row.integrity_state !== "booking_quote_follow_up_integrity_current").length,
    rows: Object.freeze(rows),
    integrity_contract: Object.freeze({
      retained_build532_freshness_must_remain_current: true,
      exact_build522_follow_up_decision_trace_required: true,
      measurement_lock_metric_allocation_duration_identity_required: true,
      explicit_owner_outcome_reference_and_timestamp_identity_required: true,
      continue_requires_exact_authorization_and_later_observation_identity: true,
      southern_ontario_weather_eligibility_and_exclusion_required: true,
      triggered_stop_conditions_retain_review: true,
      historical_outcome_carry_forward_allowed: false,
      source_runtime_green_proves_follow_up_outcome: false
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
      business_change_authorized: false,
      weather_ineligible_session_is_conversion_failure: false,
      exact_service_temperature_limit_inferred: false,
      schema_or_storage_mutated: false,
      persistent_telemetry: false,
      permanent_polling: false
    })
  });
}

function inspectRow(retained, fresh, sourcesCurrent, evaluatedAt, days) {
  const srcMeasurement = record(retained.retained_measurement_and_comparison);
  const srcDecision = record(retained.retained_follow_up_decision);
  const srcOwner = record(retained.owner_outcome);
  const srcBoundary = record(retained.outcome_boundary);
  const newMeasurement = record(fresh.retained_measurement);
  const newOwner = record(fresh.owner_outcome_freshness);
  const newBoundary = record(fresh.outcome_boundary);
  const outcome = clean(srcOwner.outcome);
  const currentState = CURRENT_STATES[outcome];
  const sourceState = RETAINED_STATES[outcome];
  const arms = canonicalArms(srcMeasurement.allocation_arms);
  const measureExact =
    srcMeasurement.source_recognized === true &&
    srcMeasurement.current_comparable === true &&
    srcMeasurement.duration_within_authorization === true &&
    srcMeasurement.allocation_coverage_complete === true &&
    srcMeasurement.allocation_comparison_complete === true &&
    positiveInt(srcMeasurement.measurement_lock_revision) !== null &&
    positiveInt(srcMeasurement.authorized_duration_days) !== null &&
    Boolean(clean(srcMeasurement.primary_metric)) &&
    arms.length >= 2 &&
    positiveInt(newMeasurement.measurement_lock_revision) === positiveInt(srcMeasurement.measurement_lock_revision) &&
    clean(newMeasurement.primary_metric) === clean(srcMeasurement.primary_metric) &&
    positiveInt(newMeasurement.authorized_duration_days) === positiveInt(srcMeasurement.authorized_duration_days) &&
    sameArms(arms, canonicalArms(newMeasurement.allocation_arms)) &&
    newMeasurement.current_comparable === true &&
    newMeasurement.weather_ineligible_row_count === srcMeasurement.weather_ineligible_row_count &&
    newMeasurement.stop_condition_triggered_count === srcMeasurement.stop_condition_triggered_count;
  const trace = clean(srcOwner.decision_trace_key);
  const ownerExact =
    Boolean(currentState && sourceState) &&
    clean(retained.status) === sourceState &&
    clean(fresh.freshness_state) === currentState &&
    srcDecision.accepted === true &&
    clean(srcDecision.decision) === outcome &&
    Boolean(trace && clean(srcDecision.expected_decision_trace_key)) &&
    trace === clean(srcDecision.expected_decision_trace_key) &&
    srcOwner.attributable === true &&
    srcOwner.trace_matches === true &&
    srcOwner.outcome_matches_source_decision === true &&
    Boolean(clean(srcOwner.reviewed_by) && clean(srcOwner.outcome_reference)) &&
    newOwner.trace_current === true &&
    newOwner.review_current === true &&
    clean(newOwner.outcome) === outcome &&
    clean(newOwner.outcome_reference) === clean(srcOwner.outcome_reference) &&
    iso(newOwner.reviewed_at) !== null &&
    iso(newOwner.reviewed_at) === iso(srcOwner.reviewed_at) &&
    withinWindow(srcOwner.reviewed_at, evaluatedAt, days);
  const followupExact =
    outcome !== "continue_observation" || (
      iso(srcOwner.follow_up_authorized_at) !== null &&
      iso(srcOwner.follow_up_observed_at) !== null &&
      iso(newOwner.follow_up_authorized_at) === iso(srcOwner.follow_up_authorized_at) &&
      iso(newOwner.follow_up_observed_at) === iso(srcOwner.follow_up_observed_at) &&
      newOwner.authorization_current === true &&
      newOwner.observation_current === true &&
      srcOwner.authorization_follows_decision === true &&
      srcOwner.observation_follows_authorization === true &&
      withinWindow(srcOwner.follow_up_authorized_at, evaluatedAt, days) &&
      withinWindow(srcOwner.follow_up_observed_at, evaluatedAt, days) &&
      Date.parse(srcOwner.follow_up_observed_at) >= Date.parse(srcOwner.follow_up_authorized_at) &&
      srcOwner.follow_up_activity_complete === true &&
      srcOwner.allocation_matches_retained === true &&
      srcOwner.duration_within_retained_authorization === true &&
      srcOwner.observed_duration_within_follow_up === true &&
      newOwner.duration_within_retained_authorization === true &&
      newOwner.observed_duration_within_follow_up === true &&
      srcOwner.measurement_lock_revision === srcMeasurement.measurement_lock_revision &&
      clean(srcOwner.primary_metric) === clean(srcMeasurement.primary_metric) &&
      sameArms(canonicalArms(srcOwner.allocation_arms), arms) &&
      newOwner.measurement_matches_retained === true &&
      newOwner.allocation_matches_retained === true
    );
  const weatherValid =
    outcome !== "continue_observation" || (
      srcOwner.weather_eligibility_observed === true &&
      srcOwner.weather_ineligible_excluded === true &&
      srcOwner.comparable_allocation_observations === true &&
      srcOwner.outcome_observed === true &&
      newOwner.weather_eligibility_observed === true &&
      newOwner.weather_ineligible_excluded === true &&
      newOwner.comparable_allocation_observations === true &&
      newOwner.outcome_observed === true &&
      newOwner.follow_up_activity_complete === true
    );
  const stopFree =
    srcBoundary.triggered_stop_condition_requires_review !== true &&
    newBoundary.triggered_stop_condition_requires_review !== true &&
    srcOwner.stop_condition_triggered !== true &&
    newOwner.stop_condition_triggered !== true &&
    srcMeasurement.stop_condition_triggered_count === 0;
  let integrityState = "retained_freshness_review_required";
  if (!sourcesCurrent || !newBoundary.current || newBoundary.review_required !== false) integrityState = "retained_freshness_review_required";
  else if (!stopFree || !weatherValid) integrityState = "weather_or_stop_condition_review_required";
  else if (!measureExact) integrityState = "measurement_allocation_duration_identity_review_required";
  else if (!ownerExact) integrityState = "owner_follow_up_identity_review_required";
  else if (!followupExact) integrityState = "follow_up_authorization_observation_identity_review_required";
  else integrityState = "booking_quote_follow_up_integrity_current";
  return Object.freeze({
    key: clean(retained.key) || "unknown",
    area: clean(retained.area) || "unknown",
    integrity_state: integrityState,
    freshness_state: clean(fresh.freshness_state) || "unavailable",
    retained_status: clean(retained.status) || "unavailable",
    measurement_allocation_duration_identity: Object.freeze({exact:measureExact, revision:positiveInt(srcMeasurement.measurement_lock_revision), primary_metric:clean(srcMeasurement.primary_metric)||null, allocation_arms:Object.freeze(arms)}),
    owner_follow_up_identity: Object.freeze({exact:ownerExact, outcome:outcome||"not_recorded", outcome_reference:clean(srcOwner.outcome_reference)||null, decision_trace_matches:trace === clean(srcDecision.expected_decision_trace_key) && Boolean(trace), reviewed_at:iso(srcOwner.reviewed_at)}),
    authorization_observation_identity: Object.freeze({exact:followupExact, authorized_at:iso(srcOwner.follow_up_authorized_at), observed_at:iso(srcOwner.follow_up_observed_at)}),
    seasonal_and_stop_evidence: Object.freeze({weather_eligibility_and_exclusion_complete:weatherValid, no_triggered_stop_condition:stopFree}),
    outcome_boundary: Object.freeze({current:integrityState==="booking_quote_follow_up_integrity_current", business_change_authorized:false, winner_selected:false, success_declared:false})
  });
}

function uniqueRows(rows) {
  const result = new Map();
  for (const item of rows) {
    const key = clean(item?.key);
    if (!key || result.has(key)) return null;
    result.set(key, item);
  }
  return result;
}
function canonicalArms(value) { return [...new Set((Array.isArray(value)?value:[]).map(x=>clean(x).toLowerCase()).filter(Boolean))].sort(); }
function sameArms(a,b) { return a.length===b.length && a.every((v,i)=>v===b[i]); }
function withinWindow(value, now, days) {
  const when=iso(value), duration=Number(days);
  const ms=when?Date.parse(now)-Date.parse(when):NaN;
  return Number.isFinite(duration) && duration>=1 && duration<=180 && Number.isFinite(ms) && ms>=0 && ms<=duration*86400000;
}
function positiveInt(value) { const n=Number(value); return value!==null && value!==undefined && value!=="" && Number.isInteger(n) && n>0?n:null; }
function record(value) { return value && typeof value==="object" && !Array.isArray(value)?value:{}; }
function clean(value) { return String(value??"").trim(); }
function iso(value) { const text=clean(value); return text && Number.isFinite(Date.parse(text))?new Date(text).toISOString():null; }
