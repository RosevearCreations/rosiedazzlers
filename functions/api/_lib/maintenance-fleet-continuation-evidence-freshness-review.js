// Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review.
// Read-only freshness reconciliation over retained Build 521 explicit owner outcomes
// and the underlying Build 491 bounded pilot execution evidence.

const DEFAULT_FRESHNESS_WINDOW_DAYS = 30;

export function buildMaintenanceFleetContinuationEvidenceFreshnessReview({
  continuation_outcome = {},
  pilot_outcome_evidence = {},
  generated_at = null,
  freshness_window_days = DEFAULT_FRESHNESS_WINDOW_DAYS
} = {}) {
  const generatedAt = validDate(generated_at) ? new Date(generated_at) : new Date();
  const windowDays = normalizeWindow(freshness_window_days);
  const retained = objectOrEmpty(continuation_outcome);
  const retainedEvidence = objectOrEmpty(retained.evidence);
  const owner = objectOrEmpty(retained.owner_outcome);
  const pilot = objectOrEmpty(pilot_outcome_evidence);

  const continuationSourceRecognized =
    Number(retained.continuation_outcome_build) === 521 &&
    clean(retained.continuation_outcome_authority) === "maintenance_fleet_continuation_outcome_continuity";

  const executionSourceRecognized =
    Number(pilot.build) === 491 &&
    clean(pilot.authority) === "maintenance_fleet_pilot_outcome_evidence";
  const executionSourceAvailable =
    executionSourceRecognized &&
    objectOrEmpty(pilot.execution_source).available === true;

  const rows = safeArray(pilot.rows).map((row) => normalizeExecutionRow(row, generatedAt, windowDays));
  const currentRows = rows.filter((row) => row.freshness_state === "execution_evidence_current");
  const participantBoundsCurrent =
    objectOrEmpty(pilot.participants).bound_satisfied === true &&
    retainedEvidence.participant_bound_satisfied === true;
  const durationBoundsCurrent =
    objectOrEmpty(pilot.duration).bound_satisfied === true &&
    retainedEvidence.duration_bound_satisfied === true;
  const capacityComplete =
    objectOrEmpty(pilot.capacity).every_attributed_row_has_capacity_evidence === true &&
    retainedEvidence.capacity_revalidation_complete === true;
  const invoicingComplete =
    objectOrEmpty(pilot.invoicing).every_attributed_row_has_invoice_evidence === true &&
    retainedEvidence.invoicing_evidence_complete === true;
  const travelComplete =
    objectOrEmpty(pilot.travel).every_attributed_row_has_travel_evidence === true &&
    retainedEvidence.travel_evidence_complete === true;
  const stopComplete =
    objectOrEmpty(pilot.stop_conditions).every_attributed_row_has_stop_condition_evidence === true &&
    retainedEvidence.stop_condition_evidence_complete === true;
  const stopTriggered =
    retainedEvidence.stop_condition_triggered === true ||
    rows.some((row) => row.stop_triggered === true);

  const currentExecutionTraceKey = buildExecutionTraceKey(safeArray(pilot.rows));
  const retainedExecutionTraceKey = clean(retainedEvidence.source_evidence_trace_key) || null;
  const executionTraceMatches =
    Boolean(currentExecutionTraceKey && retainedExecutionTraceKey) &&
    currentExecutionTraceKey === retainedExecutionTraceKey;
  const retainedOutcomeTraceMatches = retainedEvidence.record_trace_matches === true;

  const ownerOutcome = normalizeOutcome(owner.outcome);
  const ownerReviewedAt = iso(owner.reviewed_at);
  const ownerReviewAge = ageDays(ownerReviewedAt, generatedAt);
  const ownerOutcomeObserved =
    owner.attributable === true &&
    Boolean(ownerOutcome) &&
    (
      retained.status === "bounded_pilot_continuation_outcome_observed" ||
      retained.status === "continuation_hold_outcome_observed"
    );
  const ownerReviewCurrent =
    ownerOutcomeObserved &&
    Boolean(ownerReviewedAt) &&
    ownerReviewAge !== null &&
    ownerReviewAge <= windowDays;

  const continuationAuthorizedAt = iso(owner.continuation_authorized_at);
  const continuationObservedAt = iso(owner.continuation_observed_at);
  const authorizationAge = ageDays(continuationAuthorizedAt, generatedAt);
  const observationAge = ageDays(continuationObservedAt, generatedAt);
  const continuationObservationCurrent =
    ownerOutcome !== "continue" ||
    (
      Boolean(continuationAuthorizedAt) &&
      Boolean(continuationObservedAt) &&
      authorizationAge !== null &&
      observationAge !== null &&
      authorizationAge <= windowDays &&
      observationAge <= windowDays &&
      Date.parse(continuationObservedAt) >= Date.parse(continuationAuthorizedAt)
    );

  const executionEvidenceCurrent =
    executionSourceAvailable &&
    rows.length > 0 &&
    currentRows.length === rows.length &&
    participantBoundsCurrent &&
    durationBoundsCurrent &&
    capacityComplete &&
    invoicingComplete &&
    travelComplete &&
    stopComplete;

  let status = "continuation_freshness_source_unavailable";
  if (continuationSourceRecognized && !executionSourceAvailable) {
    status = "pilot_execution_evidence_source_unavailable";
  } else if (continuationSourceRecognized && executionSourceAvailable && (!participantBoundsCurrent || !durationBoundsCurrent)) {
    status = "pilot_bounds_freshness_review_required";
  } else if (continuationSourceRecognized && executionSourceAvailable && !executionEvidenceCurrent) {
    status = "pilot_execution_evidence_freshness_review_required";
  } else if (continuationSourceRecognized && executionEvidenceCurrent && stopTriggered) {
    status = "pilot_stop_condition_review_required";
  } else if (continuationSourceRecognized && executionEvidenceCurrent && !ownerOutcomeObserved) {
    status = "owner_continuation_outcome_required";
  } else if (continuationSourceRecognized && executionEvidenceCurrent && (!executionTraceMatches || !retainedOutcomeTraceMatches)) {
    status = "continuation_outcome_trace_conflict_review_required";
  } else if (continuationSourceRecognized && executionEvidenceCurrent && !ownerReviewCurrent) {
    status = "owner_outcome_freshness_review_required";
  } else if (continuationSourceRecognized && executionEvidenceCurrent && ownerOutcome === "continue" && !continuationObservationCurrent) {
    status = "continuation_observation_freshness_review_required";
  } else if (continuationSourceRecognized && executionEvidenceCurrent && ownerOutcome === "hold") {
    status = "continuation_hold_outcome_current";
  } else if (continuationSourceRecognized && executionEvidenceCurrent && ownerOutcome === "continue") {
    status = "bounded_pilot_continuation_outcome_current";
  }

  return Object.freeze({
    generated_at: generatedAt.toISOString(),
    maintenance_fleet_continuation_freshness_build: 531,
    maintenance_fleet_continuation_freshness_authority: "maintenance_fleet_continuation_evidence_freshness_review",
    retained_continuation_outcome_build: 521,
    retained_continuation_outcome_authority: "maintenance_fleet_continuation_outcome_continuity",
    retained_continuation_decision_build: 511,
    retained_pilot_outcome_evidence_build: 491,
    status,
    freshness_window_days: windowDays,
    execution_evidence_freshness: Object.freeze({
      source_recognized: executionSourceRecognized,
      source_available: executionSourceAvailable,
      required_row_count: rows.length,
      current_row_count: currentRows.length,
      evidence_current: executionEvidenceCurrent,
      participant_bound_satisfied: participantBoundsCurrent,
      duration_bound_satisfied: durationBoundsCurrent,
      capacity_revalidation_complete: capacityComplete,
      invoicing_evidence_complete: invoicingComplete,
      travel_evidence_complete: travelComplete,
      stop_condition_evidence_complete: stopComplete,
      stop_condition_triggered: stopTriggered,
      current_evidence_trace_key: currentExecutionTraceKey,
      retained_evidence_trace_key: retainedExecutionTraceKey,
      trace_matches_current_evidence: executionTraceMatches,
      rows: Object.freeze(rows)
    }),
    owner_outcome_freshness: Object.freeze({
      outcome: ownerOutcome || "not_recorded",
      outcome_observed: ownerOutcomeObserved,
      reviewed_at: ownerReviewedAt,
      review_age_days: ownerReviewAge,
      review_current: ownerReviewCurrent,
      retained_outcome_trace_matches: retainedOutcomeTraceMatches,
      continuation_authorized_at: continuationAuthorizedAt,
      continuation_authorization_age_days: authorizationAge,
      continuation_observed_at: continuationObservedAt,
      continuation_observation_age_days: observationAge,
      continuation_observation_current: continuationObservationCurrent,
      outcome_reference: clean(owner.outcome_reference) || null
    }),
    review_contract: Object.freeze({
      explicit_owner_continue_or_hold_outcome_required: true,
      participant_and_duration_bounds_must_remain_current: true,
      capacity_revalidation_must_remain_current: true,
      invoicing_evidence_must_remain_current: true,
      travel_evidence_must_remain_current: true,
      stop_condition_evidence_must_remain_current: true,
      continue_outcome_requires_current_authorization_and_later_observation: true,
      current_triggered_stop_condition_requires_review: true,
      historical_outcome_carry_forward_used: false,
      source_or_runtime_green_proves_current_pilot_execution: false,
      prior_continue_outcome_reserves_future_capacity: false,
      prior_continue_outcome_creates_recurring_commitment: false,
      automatic_canonical_hold_narrowing_performed: false
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
      pilot_continuation_executed_by_this_build: false,
      automatic_stop_action_executed: false,
      canonical_hold_mutated: false,
      schema_or_storage_mutated: false,
      permanent_polling: false
    })
  });
}

function normalizeExecutionRow(value, generatedAt, windowDays) {
  const row = objectOrEmpty(value);
  const invoice = objectOrEmpty(row.invoice);
  const travel = objectOrEmpty(row.travel);
  const stop = objectOrEmpty(row.stop_condition);
  const startedAt = iso(row.started_at);
  const endedAt = iso(row.ended_at);
  const availabilityAt = iso(row.availability_revalidated_at);
  const checkoutAt = iso(row.checkout_revalidated_at);
  const invoiceAt = iso(invoice.observed_at);
  const travelAt = iso(travel.observed_at);
  const stopAt = iso(stop.observed_at);
  const dates = [startedAt, endedAt, availabilityAt, checkoutAt, invoiceAt, travelAt, stopAt];
  const ages = dates.map((value) => ageDays(value, generatedAt));
  const attributable =
    row.attributable === true &&
    ["maintenance","fleet"].includes(clean(row.participant_type).toLowerCase()) &&
    Boolean(startedAt && endedAt) &&
    Date.parse(endedAt) >= Date.parse(startedAt);
  const current =
    attributable &&
    dates.every(Boolean) &&
    ages.every((age) => age !== null && age <= windowDays) &&
    Boolean(clean(invoice.status)) &&
    finiteNonNegative(travel.distance_km) !== null &&
    typeof stop.triggered === "boolean";
  return Object.freeze({
    evidence_id: clean(row.evidence_id) || null,
    participant_type: ["maintenance","fleet"].includes(clean(row.participant_type).toLowerCase()) ? clean(row.participant_type).toLowerCase() : "unknown",
    started_at: startedAt,
    ended_at: endedAt,
    availability_revalidated_at: availabilityAt,
    checkout_revalidated_at: checkoutAt,
    invoice_observed_at: invoiceAt,
    travel_observed_at: travelAt,
    stop_condition_observed_at: stopAt,
    latest_evidence_age_days: ages.filter((age) => age !== null).length ? Math.min(...ages.filter((age) => age !== null)) : null,
    oldest_evidence_age_days: ages.filter((age) => age !== null).length ? Math.max(...ages.filter((age) => age !== null)) : null,
    stop_triggered: typeof stop.triggered === "boolean" ? stop.triggered : null,
    freshness_state: current ? "execution_evidence_current" : "execution_evidence_freshness_review_required"
  });
}

function buildExecutionTraceKey(rows) {
  const normalized = safeArray(rows).map((value) => {
    const row = objectOrEmpty(value);
    const stop = objectOrEmpty(row.stop_condition);
    const startedAt = iso(row.started_at);
    const endedAt = iso(row.ended_at);
    return [
      clean(row.evidence_id) || "row",
      clean(row.participant_ref) || "participant",
      startedAt || "no-start",
      endedAt || "no-end",
      stop.triggered === true ? "stop" : stop.triggered === false ? "continue" : "unknown"
    ].join(":");
  });
  return normalized.length ? normalized.join("|") : null;
}
function normalizeOutcome(value) { const v=clean(value).toLowerCase(); return v==="continue"||v==="hold"?v:null; }
function normalizeWindow(value) { const n=Number(value); return Number.isFinite(n)&&n>=1&&n<=180?Math.floor(n):DEFAULT_FRESHNESS_WINDOW_DAYS; }
function ageDays(value, generatedAt) { if(!validDate(value))return null; const ms=generatedAt.getTime()-new Date(value).getTime(); return Number.isFinite(ms)?Math.max(0,Math.floor(ms/86400000)):null; }
function finiteNonNegative(value) { if(value===null||value===undefined||value==="")return null; const n=Number(value); return Number.isFinite(n)&&n>=0?n:null; }
function safeArray(value) { return Array.isArray(value)?value:[]; }
function objectOrEmpty(value) { return value&&typeof value==="object"&&!Array.isArray(value)?value:{}; }
function clean(value) { return String(value??"").trim(); }
function validDate(value) { const text=clean(value); return Boolean(text)&&Number.isFinite(Date.parse(text)); }
function iso(value) { return validDate(value)?new Date(value).toISOString():null; }
