// Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review.
// Read-only continuity review over retained Build 491 pilot outcome evidence.
// Missing execution remains owner action; complete evidence never activates a pilot or recurring commitment.

export function buildMaintenanceFleetPilotOutcomeContinuityReview({
  pilot_outcome_evidence = {},
  generated_at = new Date().toISOString()
} = {}) {
  const outcome = objectOrEmpty(pilot_outcome_evidence);
  const authorization = objectOrEmpty(outcome.authorization);
  const executionSource = objectOrEmpty(outcome.execution_source);
  const participants = objectOrEmpty(outcome.participants);
  const duration = objectOrEmpty(outcome.duration);
  const capacity = objectOrEmpty(outcome.capacity);
  const invoicing = objectOrEmpty(outcome.invoicing);
  const travel = objectOrEmpty(outcome.travel);
  const stopConditions = objectOrEmpty(outcome.stop_conditions);
  const rows = safeArray(outcome.rows).map(normalizeRow);

  const sourceRecognized =
    Number(outcome.build) === 491 &&
    clean(outcome.authority) === "maintenance_fleet_pilot_outcome_evidence";

  const authorized = authorization.attributable_outcome_capture_allowed === true;
  const sourceAvailable = executionSource.available === true;
  const participantBoundSatisfied = participants.bound_satisfied === true;
  const durationBoundSatisfied = duration.bound_satisfied === true;
  const capacityComplete = capacity.every_attributed_row_has_capacity_evidence === true;
  const invoicingComplete = invoicing.every_attributed_row_has_invoice_evidence === true;
  const travelComplete = travel.every_attributed_row_has_travel_evidence === true;
  const stopEvidenceComplete = stopConditions.every_attributed_row_has_stop_condition_evidence === true;
  const stopTriggeredCount = finiteWhole(stopConditions.triggered_count) ?? rows.filter(r=>r.stop_triggered===true).length;
  const stopTriggered = stopTriggeredCount > 0;
  const evidenceComplete =
    rows.length > 0 &&
    participantBoundSatisfied &&
    durationBoundSatisfied &&
    capacityComplete &&
    invoicingComplete &&
    travelComplete &&
    stopEvidenceComplete;

  let status = "continuity_source_unavailable";
  if (sourceRecognized && !authorized) status = "owner_action_authorization_required";
  else if (sourceRecognized && authorized && !sourceAvailable) status = "owner_action_execution_source_required";
  else if (sourceRecognized && authorized && sourceAvailable && rows.length === 0) status = "owner_action_execution_evidence_required";
  else if (sourceRecognized && authorized && sourceAvailable && (!participantBoundSatisfied || !durationBoundSatisfied)) status = "pilot_bounds_review_required";
  else if (sourceRecognized && authorized && sourceAvailable && stopTriggered) status = "pilot_stop_condition_review_required";
  else if (sourceRecognized && outcome.status === "bounded_pilot_outcome_review_ready" && evidenceComplete) status = "bounded_pilot_continuity_review_ready";
  else if (sourceRecognized) status = "continuity_review_incomplete";

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    continuity_review_build: 501,
    continuity_authority: "maintenance_fleet_pilot_outcome_continuity_review",
    retained_outcome_authority: "maintenance_fleet_pilot_outcome_evidence",
    retained_outcome_build: 491,
    status,
    source_status: clean(outcome.status) || "unavailable",
    authorization_continuity: Object.freeze({
      attributable_outcome_capture_allowed: authorized,
      explicit_owner_approval_required: true,
      bounded_participant_and_duration_authorization_required: true,
      participant_limit: finiteWhole(authorization.participant_limit),
      duration_days: finiteWhole(authorization.duration_days),
      source_green_is_not_pilot_execution: true
    }),
    execution_continuity: Object.freeze({
      execution_source_available: sourceAvailable,
      observed_row_count: rows.length,
      attributed_row_count: finiteWhole(executionSource.attributed_row_count) ?? rows.length,
      current_execution_evidence_required: true,
      historical_outcome_carry_forward_used: false,
      missing_execution_remains_owner_action: true,
      evidence_trace_key: buildTraceKey(rows)
    }),
    bounds: Object.freeze({
      participant_bound_satisfied: participantBoundSatisfied,
      duration_bound_satisfied: durationBoundSatisfied,
      observed_participant_count: finiteWhole(participants.observed_count),
      authorized_participant_limit: finiteWhole(participants.participant_limit),
      observed_duration_days: finiteWhole(duration.observed_duration_days),
      authorized_duration_days: finiteWhole(duration.authorized_duration_days)
    }),
    outcome_dimensions: Object.freeze({
      capacity_revalidation_complete: capacityComplete,
      availability_revalidation_observed_count: finiteWhole(capacity.availability_revalidation_observed_count) ?? 0,
      checkout_revalidation_observed_count: finiteWhole(capacity.checkout_revalidation_observed_count) ?? 0,
      invoicing_evidence_complete: invoicingComplete,
      invoice_observed_count: finiteWhole(invoicing.observed_count) ?? 0,
      travel_evidence_complete: travelComplete,
      travel_observed_count: finiteWhole(travel.observed_count) ?? 0,
      observed_distance_km: finiteNonNegative(travel.observed_distance_km),
      stop_condition_evidence_complete: stopEvidenceComplete,
      stop_condition_observed_count: finiteWhole(stopConditions.observed_count) ?? 0,
      stop_condition_triggered_count: stopTriggeredCount,
      stop_condition_review_required: stopTriggered,
      evidence_complete: evidenceComplete
    }),
    continuity_decision: Object.freeze({
      review_ready: status === "bounded_pilot_continuity_review_ready",
      continue_pilot_authorized: false,
      automatic_stop_action_authorized: false,
      next_step: nextStep(status)
    }),
    rows: Object.freeze(rows),
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
      pilot_continuation_inferred: false,
      stop_action_executed: false,
      provider_or_business_mutation_performed: false,
      accounting_or_inventory_mutation_performed: false,
      schema_or_storage_mutation_performed: false,
      canonical_hold_mutated: false,
      permanent_polling: false
    })
  });
}

function normalizeRow(value) {
  const row = objectOrEmpty(value);
  const invoice = objectOrEmpty(row.invoice);
  const travel = objectOrEmpty(row.travel);
  const stop = objectOrEmpty(row.stop_condition);
  return Object.freeze({
    evidence_id: clean(row.evidence_id) || null,
    participant_ref: clean(row.participant_ref) || null,
    participant_type: clean(row.participant_type) || "unknown",
    started_at: validIso(row.started_at),
    ended_at: validIso(row.ended_at),
    availability_revalidated_at: validIso(row.availability_revalidated_at),
    checkout_revalidated_at: validIso(row.checkout_revalidated_at),
    invoice_status: clean(invoice.status) || null,
    travel_distance_km: finiteNonNegative(travel.distance_km),
    stop_triggered: typeof stop.triggered === "boolean" ? stop.triggered : null,
    stop_reason: clean(stop.reason) || null
  });
}

function buildTraceKey(rows) {
  if (!rows.length) return null;
  return rows.map(row=>[
    row.evidence_id || "row",
    row.participant_ref || "participant",
    row.started_at || "no-start",
    row.ended_at || "no-end",
    row.stop_triggered === true ? "stop" : row.stop_triggered === false ? "continue" : "unknown"
  ].join(":")).join("|");
}
function nextStep(status) {
  if (status === "bounded_pilot_continuity_review_ready") return "Review current bounded outcome evidence; any continuation requires a separate explicit owner decision.";
  if (status === "pilot_stop_condition_review_required") return "Review the observed stop condition before any separately authorized continuation decision.";
  if (status === "pilot_bounds_review_required") return "Reconcile participant or duration evidence against the explicit owner-approved pilot bounds.";
  if (status === "owner_action_execution_evidence_required") return "Record attributable pilot execution evidence before outcome continuity can be reviewed.";
  if (status === "owner_action_execution_source_required") return "Provide an approved execution-evidence source before outcome continuity can be reviewed.";
  if (status === "owner_action_authorization_required") return "Explicit owner approval plus participant and duration bounds remain required.";
  if (status === "continuity_source_unavailable") return "Restore the retained Build 491 evidence source; do not infer pilot execution from source/runtime GREEN.";
  return "Complete the missing capacity, invoicing, travel or stop-condition observations.";
}
function safeArray(value){ return Array.isArray(value) ? value : []; }
function objectOrEmpty(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value){ return String(value ?? "").trim(); }
function validIso(value){ const text=clean(value); return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null; }
function finiteWhole(value){ const n=Number(value); return Number.isFinite(n) && n>=0 ? Math.floor(n) : null; }
function finiteNonNegative(value){ const n=Number(value); return Number.isFinite(n) && n>=0 ? Math.round(n*100)/100 : null; }
