// Build 492 — Booking & Quote Controlled Experiment Execution Evidence.
// Read-only evidence classification over retained Build 481 measurement locks.
// A measurement lock is not execution authorization, and execution evidence never selects a winner.

export function buildBookingQuoteControlledExperimentExecutionEvidence({
  measurement_lock = {},
  execution_authorization = {},
  execution_evidence = [],
  execution_source_available = false,
  generated_at = new Date().toISOString()
} = {}) {
  const definitions = Array.isArray(measurement_lock?.definitions) ? measurement_lock.definitions : [];
  const authRecords = objectOrEmpty(execution_authorization?.records || execution_authorization);
  const evidenceRows = safeArray(execution_evidence);

  const rows = definitions.map(definition => {
    const key = clean(definition?.key) || "unknown";
    const lock = objectOrEmpty(definition?.lock);
    const contract = objectOrEmpty(definition?.measurement_contract);
    const locked = definition?.state === "measurement_locked" && lock.measurement_locked === true;
    const auth = objectOrEmpty(authRecords[key]);
    const authAt = validIso(auth.authorized_at);
    const authBy = clean(auth.authorized_by) || null;
    const authDuration = positiveWhole(auth.duration_days);
    const lockDuration = positiveWhole(contract.duration_days);
    const allocationArms = uniqueStrings(auth.allocation_arms);
    const lockRevision = positiveWhole(lock.revision);
    const authRevision = positiveWhole(auth.measurement_lock_revision);

    const authorized = Boolean(
      locked &&
      auth.authorized === true &&
      authAt &&
      authBy &&
      authDuration &&
      lockDuration &&
      authDuration <= lockDuration &&
      allocationArms.length >= 2 &&
      auth.weather_eligibility_required === true &&
      auth.outcome_capture_authorized === true &&
      auth.stop_conditions_acknowledged === true &&
      (!lockRevision || authRevision === lockRevision)
    );

    const matching = evidenceRows
      .filter(value => clean(value?.experiment_key) === key)
      .map(value => normalizeExecutionRow(value, allocationArms));

    const attributable = matching.filter(row => row.attributable);
    const weatherEligible = attributable.filter(row => row.weather.eligible === true);
    const weatherIneligible = attributable.filter(row => row.weather.eligible === false);
    const stopTriggered = attributable.filter(row => row.stop_condition.triggered === true);
    const incomplete = attributable.filter(row => {
      if (!row.weather.observed || !row.stop_condition.observed) return true;
      if (row.weather.eligible === true && !row.outcome.observed) return true;
      if (row.weather.eligible === false && row.outcome.included_in_conversion_denominator === true) return true;
      return false;
    });

    const firstAllocated = minIso(attributable.map(row => row.allocated_at));
    const lastObserved = maxIso(attributable.map(row => row.observed_at));
    const observedDurationDays = firstAllocated && lastObserved
      ? Math.max(1, Math.ceil((Date.parse(lastObserved) - Date.parse(firstAllocated)) / 86400000))
      : null;

    const allocationCounts = Object.fromEntries(allocationArms.map(arm => [
      arm,
      weatherEligible.filter(row => row.allocation_arm === arm).length
    ]));
    const allocationCoverageComplete = allocationArms.length >= 2 &&
      allocationArms.every(arm => Number(allocationCounts[arm] || 0) > 0);
    const durationWithinAuthorization = Boolean(
      observedDurationDays &&
      authDuration &&
      lockDuration &&
      observedDurationDays <= authDuration &&
      observedDurationDays <= lockDuration
    );

    let status = "measurement_lock_required";
    if (locked && !authorized) status = "execution_authorization_required";
    else if (authorized && !execution_source_available) status = "execution_source_required";
    else if (authorized && matching.length === 0) status = "execution_evidence_required";
    else if (authorized && attributable.length === 0) status = "execution_evidence_unattributable";
    else if (authorized && stopTriggered.length > 0) status = "stop_condition_triggered_review_required";
    else if (
      authorized &&
      incomplete.length === 0 &&
      durationWithinAuthorization &&
      allocationCoverageComplete &&
      weatherEligible.length > 0
    ) status = "bounded_execution_evidence_review_ready";
    else if (authorized) status = "execution_evidence_incomplete";

    return Object.freeze({
      key,
      area: clean(definition?.area) || "unknown",
      status,
      measurement_lock: Object.freeze({
        locked,
        locked_at: validIso(lock.locked_at),
        revision: lockRevision,
        duration_days: lockDuration,
        allocation_rule: clean(contract.allocation_rule) || null,
        weather_ineligible_handling: clean(contract.weather_ineligible_handling) || null,
        stop_conditions: Object.freeze(safeArray(contract.stop_conditions).map(clean).filter(Boolean))
      }),
      execution_authorization: Object.freeze({
        separately_required: true,
        authorized,
        authorized_at: authorized ? authAt : null,
        authorized_by: authorized ? authBy : null,
        duration_days: authorized ? authDuration : null,
        allocation_arms: Object.freeze(authorized ? allocationArms : []),
        weather_eligibility_required: authorized && auth.weather_eligibility_required === true,
        outcome_capture_authorized: authorized && auth.outcome_capture_authorized === true,
        stop_conditions_acknowledged: authorized && auth.stop_conditions_acknowledged === true,
        measurement_lock_revision: authorized ? authRevision : null
      }),
      execution_evidence: Object.freeze({
        source_available: execution_source_available === true,
        observed_row_count: matching.length,
        attributable_row_count: attributable.length,
        weather_eligible_row_count: weatherEligible.length,
        weather_ineligible_row_count: weatherIneligible.length,
        weather_ineligible_excluded_from_conversion_denominator_count:
          weatherIneligible.filter(row => row.outcome.included_in_conversion_denominator === false).length,
        incomplete_row_count: incomplete.length,
        stop_condition_triggered_count: stopTriggered.length,
        first_allocated_at: firstAllocated,
        last_observed_at: lastObserved,
        observed_duration_days: observedDurationDays,
        duration_within_authorization: durationWithinAuthorization,
        allocation_coverage_complete: allocationCoverageComplete,
        allocation_counts: Object.freeze(allocationCounts),
        rows: Object.freeze(attributable)
      }),
      truth_boundary: Object.freeze({
        measurement_lock_is_execution_authorization: false,
        execution_authorization_is_execution_evidence: false,
        weather_ineligible_session_is_conversion_failure: false,
        winner_selected: false,
        experiment_success_claimed: false,
        price_causation_claimed: false,
        customer_motive_inferred: false,
        price_or_discount_changed: false,
        booking_rule_changed: false,
        availability_rule_changed: false,
        booking_created_or_changed: false,
        outreach_sent: false,
        provider_mutation_performed: false,
        customer_identity_join_performed: false
      })
    });
  });

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    build: 492,
    authority: "booking_quote_controlled_experiment_execution_evidence",
    retained_measurement_lock_authority: "booking_quote_experiment_approval_measurement_lock",
    retained_framework_authority: "booking_quote_controlled_experiment_framework",
    definition_count: rows.length,
    review_ready_count: rows.filter(row => row.status === "bounded_execution_evidence_review_ready").length,
    execution_authorization_required_count: rows.filter(row => row.status === "execution_authorization_required").length,
    execution_evidence_required_count: rows.filter(row => row.status === "execution_evidence_required").length,
    rows: Object.freeze(rows),
    boundaries: Object.freeze({
      existing_workbench_only: true,
      separate_execution_authorization_required: true,
      manual_execution_only: true,
      weather_eligibility_must_be_observed: true,
      weather_ineligible_excluded_from_conversion_denominator: true,
      stop_conditions_must_be_observed: true,
      outcome_capture_must_be_observed: true,
      automatic_experiment_activation_allowed: false,
      automatic_winner_selection_allowed: false,
      pricing_mutation_allowed: false,
      discount_mutation_allowed: false,
      booking_rule_mutation_allowed: false,
      availability_mutation_allowed: false,
      outreach_allowed: false,
      customer_identity_join_allowed: false,
      provider_mutation_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling_allowed: false
    })
  });
}

function normalizeExecutionRow(value, allocationArms) {
  const row = objectOrEmpty(value);
  const weather = objectOrEmpty(row.weather);
  const stop = objectOrEmpty(row.stop_condition);
  const outcome = objectOrEmpty(row.outcome);
  const assignmentRef = clean(row.assignment_ref);
  const arm = clean(row.allocation_arm).toLowerCase();
  const allocatedAt = validIso(row.allocated_at);
  const observedAt = validIso(row.observed_at);
  const weatherObservedAt = validIso(weather.observed_at);
  const stopObservedAt = validIso(stop.observed_at);
  const outcomeObservedAt = validIso(outcome.observed_at);
  const weatherEligible = typeof weather.eligible === "boolean" ? weather.eligible : null;
  const denominatorIncluded = typeof outcome.included_in_conversion_denominator === "boolean"
    ? outcome.included_in_conversion_denominator
    : null;
  const attributable = Boolean(
    assignmentRef &&
    allocationArms.includes(arm) &&
    allocatedAt &&
    observedAt &&
    Date.parse(observedAt) >= Date.parse(allocatedAt)
  );

  return Object.freeze({
    evidence_id: clean(row.evidence_id) || null,
    assignment_ref: assignmentRef || null,
    allocation_arm: arm || null,
    allocated_at: allocatedAt,
    observed_at: observedAt,
    attributable,
    weather: Object.freeze({
      observed: Boolean(weatherObservedAt) && weatherEligible !== null && Boolean(clean(weather.rule_evidence)),
      observed_at: weatherObservedAt,
      eligible: weatherEligible,
      rule_evidence: clean(weather.rule_evidence) || null,
      exact_temperature_inferred: false
    }),
    stop_condition: Object.freeze({
      observed: Boolean(stopObservedAt) && typeof stop.triggered === "boolean",
      observed_at: stopObservedAt,
      triggered: typeof stop.triggered === "boolean" ? stop.triggered : null,
      reason: clean(stop.reason) || null
    }),
    outcome: Object.freeze({
      observed: Boolean(outcomeObservedAt) && Boolean(clean(outcome.metric_key)),
      observed_at: outcomeObservedAt,
      metric_key: clean(outcome.metric_key) || null,
      metric_value: finiteNumber(outcome.metric_value),
      metric_unit: clean(outcome.metric_unit) || null,
      included_in_conversion_denominator: denominatorIncluded,
      winner_inferred: false,
      success_inferred: false
    })
  });
}
function safeArray(value){ return Array.isArray(value) ? value : []; }
function objectOrEmpty(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value){ return String(value ?? "").trim(); }
function positiveWhole(value){ const n=Number(value); return Number.isFinite(n) && n>0 ? Math.floor(n) : null; }
function validIso(value){ const text=clean(value); return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null; }
function finiteNumber(value){ if(value===null||value===undefined||value==="") return null; const n=Number(value); return Number.isFinite(n)?Math.round(n*10000)/10000:null; }
function uniqueStrings(value){ return [...new Set(safeArray(value).map(v=>clean(v).toLowerCase()).filter(Boolean))]; }
function minIso(values){ const nums=values.filter(Boolean).map(Date.parse).filter(Number.isFinite); return nums.length?new Date(Math.min(...nums)).toISOString():null; }
function maxIso(values){ const nums=values.filter(Boolean).map(Date.parse).filter(Number.isFinite); return nums.length?new Date(Math.max(...nums)).toISOString():null; }
