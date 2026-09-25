// Build 502 — Booking & Quote Experiment Outcome Interpretation.
// Read-only descriptive interpretation over retained Build 481 measurement locks and Build 492 execution evidence.
// Complete evidence may be summarized, but no winner, success claim, pricing/discount, booking-rule or availability change is inferred.

export function buildBookingQuoteExperimentOutcomeInterpretation({
  measurement_lock = {},
  controlled_execution_evidence = {},
  generated_at = new Date().toISOString()
} = {}) {
  const locks = Array.isArray(measurement_lock?.definitions) ? measurement_lock.definitions : [];
  const executionRows = Array.isArray(controlled_execution_evidence?.rows) ? controlled_execution_evidence.rows : [];
  const byKey = new Map(executionRows.map(row => [clean(row?.key) || "unknown", row]));

  const rows = locks.map(lockDef => {
    const key = clean(lockDef?.key) || "unknown";
    const contract = objectOrEmpty(lockDef?.measurement_contract);
    const lock = objectOrEmpty(lockDef?.lock);
    const execution = objectOrEmpty(byKey.get(key));
    const executionEvidence = objectOrEmpty(execution.execution_evidence);
    const authorization = objectOrEmpty(execution.execution_authorization);
    const observedRows = safeArray(executionEvidence.rows);
    const primaryMetric = clean(contract.primary_metric) || null;
    const allocationArms = uniqueStrings(authorization.allocation_arms);
    const stopTriggeredCount = nonnegativeWhole(executionEvidence.stop_condition_triggered_count) ?? 0;
    const executionReady = execution.status === "bounded_execution_evidence_review_ready";
    const stopReviewRequired =
      execution.status === "stop_condition_triggered_review_required" ||
      stopTriggeredCount > 0;

    const eligibleRows = observedRows.filter(row =>
      row?.weather?.eligible === true &&
      row?.outcome?.included_in_conversion_denominator === true
    );
    const metricRows = eligibleRows.filter(row =>
      row?.outcome?.observed === true &&
      clean(row?.outcome?.metric_key) === primaryMetric &&
      finiteNumber(row?.outcome?.metric_value) !== null
    );
    const metricMismatchCount = eligibleRows.filter(row =>
      row?.outcome?.observed === true &&
      primaryMetric &&
      clean(row?.outcome?.metric_key) !== primaryMetric
    ).length;
    const missingMetricValueCount = eligibleRows.filter(row =>
      row?.outcome?.observed !== true ||
      finiteNumber(row?.outcome?.metric_value) === null
    ).length;

    const armSummaries = allocationArms.map(arm => {
      const armRows = metricRows.filter(row => clean(row?.allocation_arm).toLowerCase() === arm);
      const values = armRows.map(row => finiteNumber(row?.outcome?.metric_value)).filter(value => value !== null);
      return Object.freeze({
        allocation_arm: arm,
        observed_metric_count: values.length,
        metric_key: primaryMetric,
        metric_unit: uniqueNonEmpty(armRows.map(row => clean(row?.outcome?.metric_unit))).join(" / ") || null,
        mean_metric_value: mean(values),
        minimum_metric_value: values.length ? Math.min(...values) : null,
        maximum_metric_value: values.length ? Math.max(...values) : null
      });
    });
    const allocationComparisonComplete =
      allocationArms.length >= 2 &&
      armSummaries.every(row => row.observed_metric_count > 0);

    let status = "measurement_lock_required";
    if (lock.measurement_locked === true && stopReviewRequired) status = "stop_condition_review_required";
    else if (lock.measurement_locked === true && !executionReady) status = "execution_evidence_not_ready";
    else if (executionReady && eligibleRows.length === 0) status = "outcome_measurement_required";
    else if (executionReady && (metricMismatchCount > 0 || missingMetricValueCount > 0)) status = "outcome_measurement_incomplete";
    else if (executionReady && !allocationComparisonComplete) status = "allocation_comparison_incomplete";
    else if (executionReady) status = "descriptive_outcome_interpretation_ready";

    return Object.freeze({
      key,
      area: clean(lockDef?.area) || clean(execution?.area) || "unknown",
      status,
      measurement_contract: Object.freeze({
        measurement_locked: lock.measurement_locked === true,
        revision: positiveWhole(lock.revision),
        primary_metric: primaryMetric,
        baseline_rule: clean(contract.baseline_rule) || null,
        success_threshold: clean(contract.success_threshold) || null,
        target_direction: clean(contract.target_direction) || null,
        winner_rule: clean(contract.winner_rule) || null,
        duration_days: positiveWhole(contract.duration_days),
        allocation_rule: clean(contract.allocation_rule) || null,
        weather_ineligible_handling: clean(contract.weather_ineligible_handling) || null
      }),
      execution_context: Object.freeze({
        retained_build_492_status: clean(execution.status) || "execution_evidence_unavailable",
        execution_review_ready: executionReady,
        authorized_duration_days: positiveWhole(authorization.duration_days),
        allocation_arms: Object.freeze(allocationArms),
        observed_duration_days: positiveWhole(executionEvidence.observed_duration_days),
        duration_within_authorization: executionEvidence.duration_within_authorization === true,
        allocation_coverage_complete: executionEvidence.allocation_coverage_complete === true,
        weather_eligible_row_count: nonnegativeWhole(executionEvidence.weather_eligible_row_count) ?? 0,
        weather_ineligible_row_count: nonnegativeWhole(executionEvidence.weather_ineligible_row_count) ?? 0,
        stop_condition_triggered_count: stopTriggeredCount
      }),
      interpretation_evidence: Object.freeze({
        conversion_denominator_row_count: eligibleRows.length,
        attributable_metric_row_count: metricRows.length,
        metric_mismatch_count: metricMismatchCount,
        missing_metric_value_count: missingMetricValueCount,
        allocation_comparison_complete: allocationComparisonComplete,
        arm_summaries: Object.freeze(armSummaries)
      }),
      interpretation: Object.freeze({
        descriptive_only: true,
        threshold_evaluation: "owner_review_required",
        success: null,
        winner: null,
        recommended_price_change: null,
        recommended_discount_change: null,
        recommended_booking_rule_change: null,
        recommended_availability_change: null,
        next_step: nextStep(status)
      }),
      truth_boundary: Object.freeze({
        weather_ineligible_session_is_conversion_failure: false,
        incomplete_or_incomparable_evidence_selects_winner: false,
        threshold_met_inferred: false,
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
        schema_or_storage_mutation_performed: false,
        permanent_polling: false
      })
    });
  });

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    build: 502,
    authority: "booking_quote_experiment_outcome_interpretation",
    retained_measurement_lock_build: 481,
    retained_execution_evidence_build: 492,
    definition_count: rows.length,
    descriptive_interpretation_ready_count:
      rows.filter(row => row.status === "descriptive_outcome_interpretation_ready").length,
    stop_condition_review_required_count:
      rows.filter(row => row.status === "stop_condition_review_required").length,
    rows: Object.freeze(rows),
    boundaries: Object.freeze({
      retained_measurement_lock_only: true,
      retained_execution_evidence_only: true,
      materially_comparable_allocation_required: true,
      weather_ineligible_excluded_from_conversion_denominator: true,
      stop_conditions_override_interpretation_readiness: true,
      owner_threshold_evaluation_required: true,
      automatic_winner_selection_allowed: false,
      automatic_success_claim_allowed: false,
      pricing_mutation_allowed: false,
      discount_mutation_allowed: false,
      booking_rule_mutation_allowed: false,
      availability_mutation_allowed: false,
      outreach_allowed: false,
      provider_mutation_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling_allowed: false
    })
  });
}

function nextStep(status) {
  if (status === "descriptive_outcome_interpretation_ready")
    return "Review the descriptive arm summaries against the locked owner-defined threshold and winner rule; no result or business change is automatic.";
  if (status === "stop_condition_review_required")
    return "Review the triggered locked stop condition before interpreting outcomes or considering any separate continuation decision.";
  if (status === "allocation_comparison_incomplete")
    return "Record comparable metric observations for every authorized allocation arm before interpretation.";
  if (status === "outcome_measurement_incomplete")
    return "Complete the locked primary-metric observations; mismatched or missing values are not comparable outcome evidence.";
  if (status === "outcome_measurement_required")
    return "Record attributable weather-eligible primary-metric observations before interpreting outcomes.";
  if (status === "execution_evidence_not_ready")
    return "Complete separately authorized Build 492 execution evidence within allocation, duration, weather and stop-condition bounds.";
  return "Lock the owner-approved measurement contract before any outcome interpretation.";
}

function safeArray(value){ return Array.isArray(value) ? value : []; }
function objectOrEmpty(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value){ return String(value ?? "").trim(); }
function positiveWhole(value){ if(value===null||value===undefined||value==="") return null; const n=Number(value); return Number.isFinite(n)&&n>0?Math.floor(n):null; }
function nonnegativeWhole(value){ if(value===null||value===undefined||value==="") return null; const n=Number(value); return Number.isFinite(n)&&n>=0?Math.floor(n):null; }
function finiteNumber(value){ if(value===null||value===undefined||value==="") return null; const n=Number(value); return Number.isFinite(n)?Math.round(n*10000)/10000:null; }
function validIso(value){ const text=clean(value); return text&&Number.isFinite(Date.parse(text))?new Date(text).toISOString():null; }
function uniqueStrings(value){ return [...new Set(safeArray(value).map(v=>clean(v).toLowerCase()).filter(Boolean))]; }
function uniqueNonEmpty(value){ return [...new Set(safeArray(value).map(clean).filter(Boolean))]; }
function mean(values){ return values.length?Math.round((values.reduce((sum,value)=>sum+value,0)/values.length)*10000)/10000:null; }
