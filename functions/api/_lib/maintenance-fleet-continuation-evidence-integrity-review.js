// Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review.
// Read-only fail-closed integrity review over retained Build 531 freshness and Build 521 outcomes.
// No enrollment, billing, booking, invoicing, capacity reservation or canonical-HOLD mutation is performed.

export function buildMaintenanceFleetContinuationEvidenceIntegrityReview({
  continuation_freshness = {},
  continuation_outcome = {},
  generated_at = null
} = {}) {
  const generatedAt = validIso(generated_at) || new Date().toISOString();
  const freshness = objectOrEmpty(continuation_freshness);
  const execution = objectOrEmpty(freshness.execution_evidence_freshness);
  const owner = objectOrEmpty(freshness.owner_outcome_freshness);
  const retainedEvidence = objectOrEmpty(continuation_outcome.evidence);
  const retainedOwner = objectOrEmpty(continuation_outcome.owner_outcome);

  const retainedFreshnessRecognized =
    Number(freshness.maintenance_fleet_continuation_freshness_build) === 531 &&
    clean(freshness.maintenance_fleet_continuation_freshness_authority) === "maintenance_fleet_continuation_evidence_freshness_review";
  const retainedFreshnessCurrent =
    retainedFreshnessRecognized &&
    ["continuation_hold_outcome_current","bounded_pilot_continuation_outcome_current"].includes(clean(freshness.status));

  const currentTrace = clean(execution.current_evidence_trace_key) || null;
  const retainedFreshnessTrace = clean(execution.retained_evidence_trace_key) || null;
  const retainedOutcomeTrace = clean(retainedEvidence.source_evidence_trace_key) || null;
  const executionIdentityComplete =
    execution.evidence_current === true &&
    execution.participant_bound_satisfied === true &&
    execution.duration_bound_satisfied === true &&
    execution.capacity_revalidation_complete === true &&
    execution.invoicing_evidence_complete === true &&
    execution.travel_evidence_complete === true &&
    execution.stop_condition_evidence_complete === true &&
    execution.stop_condition_triggered !== true &&
    Boolean(currentTrace && retainedFreshnessTrace && retainedOutcomeTrace);
  const executionTraceMatch =
    execution.trace_matches_current_evidence === true &&
    retainedEvidence.record_trace_matches === true &&
    Boolean(currentTrace && retainedFreshnessTrace && retainedOutcomeTrace) &&
    currentTrace === retainedFreshnessTrace &&
    currentTrace === retainedOutcomeTrace;

  const currentOutcome = normalizeOutcome(owner.outcome);
  const retainedOutcome = normalizeOutcome(retainedOwner.outcome);
  const currentReference = clean(owner.outcome_reference) || null;
  const retainedReference = clean(retainedOwner.outcome_reference) || null;
  const currentReviewedAt = validIso(owner.reviewed_at);
  const retainedReviewedAt = validIso(retainedOwner.reviewed_at);
  const ownerIdentityComplete =
    owner.outcome_observed === true &&
    owner.review_current === true &&
    Boolean(currentOutcome && retainedOutcome && currentReference && retainedReference && currentReviewedAt && retainedReviewedAt) &&
    currentOutcome === retainedOutcome &&
    currentReference === retainedReference &&
    currentReviewedAt === retainedReviewedAt;

  const currentAuthorizedAt = validIso(owner.continuation_authorized_at);
  const retainedAuthorizedAt = validIso(retainedOwner.continuation_authorized_at);
  const currentObservedAt = validIso(owner.continuation_observed_at);
  const retainedObservedAt = validIso(retainedOwner.continuation_observed_at);
  const continuationObservationIdentityComplete =
    currentOutcome !== "continue" ||
    (
      owner.continuation_observation_current === true &&
      Boolean(currentAuthorizedAt && retainedAuthorizedAt && currentObservedAt && retainedObservedAt) &&
      currentAuthorizedAt === retainedAuthorizedAt &&
      currentObservedAt === retainedObservedAt &&
      Date.parse(currentObservedAt) >= Date.parse(currentAuthorizedAt)
    );

  let status = "retained_freshness_review_required";
  if (!retainedFreshnessCurrent) status = "retained_freshness_review_required";
  else if (!executionIdentityComplete) status = "pilot_execution_identity_review_required";
  else if (!executionTraceMatch) status = "pilot_execution_identity_drift_review_required";
  else if (!ownerIdentityComplete) status = "owner_outcome_identity_review_required";
  else if (!continuationObservationIdentityComplete) status = "continuation_observation_identity_review_required";
  else status = "maintenance_fleet_continuation_integrity_current";

  return Object.freeze({
    generated_at: generatedAt,
    maintenance_fleet_continuation_integrity_build: 541,
    maintenance_fleet_continuation_integrity_authority: "maintenance_fleet_continuation_evidence_integrity_review",
    retained_freshness_build: 531,
    retained_freshness_authority: "maintenance_fleet_continuation_evidence_freshness_review",
    retained_outcome_build: 521,
    retained_outcome_authority: "maintenance_fleet_continuation_outcome_continuity",
    status,
    pilot_execution_identity: Object.freeze({
      identity_complete: executionIdentityComplete,
      current_evidence_trace_key: currentTrace,
      retained_freshness_trace_key: retainedFreshnessTrace,
      retained_outcome_trace_key: retainedOutcomeTrace,
      trace_match: executionTraceMatch,
      participant_bound_satisfied: execution.participant_bound_satisfied === true,
      duration_bound_satisfied: execution.duration_bound_satisfied === true,
      capacity_revalidation_complete: execution.capacity_revalidation_complete === true,
      invoicing_evidence_complete: execution.invoicing_evidence_complete === true,
      travel_evidence_complete: execution.travel_evidence_complete === true,
      stop_condition_evidence_complete: execution.stop_condition_evidence_complete === true,
      stop_condition_triggered: execution.stop_condition_triggered === true
    }),
    owner_outcome_identity: Object.freeze({
      identity_complete: ownerIdentityComplete,
      outcome: currentOutcome || "not_recorded",
      retained_outcome: retainedOutcome || "not_recorded",
      outcome_reference: currentReference,
      retained_outcome_reference: retainedReference,
      reviewed_at: currentReviewedAt,
      retained_reviewed_at: retainedReviewedAt,
      continuation_authorized_at: currentAuthorizedAt,
      retained_continuation_authorized_at: retainedAuthorizedAt,
      continuation_observed_at: currentObservedAt,
      retained_continuation_observed_at: retainedObservedAt,
      continuation_observation_identity_complete: continuationObservationIdentityComplete
    }),
    integrity_contract: Object.freeze({
      continuation_integrity_current: status === "maintenance_fleet_continuation_integrity_current",
      retained_build531_freshness_must_remain_current: true,
      exact_build491_execution_trace_required: true,
      participant_and_duration_identity_required: true,
      capacity_invoicing_travel_stop_identity_required: true,
      explicit_owner_continue_or_hold_identity_required: true,
      continue_requires_exact_authorization_and_later_observation_identity: true,
      triggered_stop_condition_retains_review: true,
      source_runtime_green_can_prove_continuation: false,
      historical_continue_can_reserve_future_capacity: false,
      automatic_canonical_hold_narrowing_performed: false
    }),
    truth_boundary: Object.freeze({
      maintenance_enrollment_performed: false,
      fleet_account_activation_performed: false,
      recurring_billing_enabled: false,
      booking_created_or_changed: false,
      invoice_created_or_changed: false,
      capacity_reserved: false,
      participant_selected: false,
      price_or_discount_changed: false,
      customer_outreach_performed: false,
      provider_action_performed: false,
      automatic_stop_action_executed: false,
      current_stop_condition_overridden_by_historical_acceptance: false,
      canonical_hold_mutated: false,
      business_data_mutated: false
    }),
    boundaries: Object.freeze({
      read_only: true,
      schema_or_storage_mutated: false,
      persistent_telemetry: false,
      permanent_polling: false
    })
  });
}
function normalizeOutcome(value){ const v=clean(value).toLowerCase(); return v==="continue"||v==="hold"?v:null; }
function objectOrEmpty(value){ return value&&typeof value==="object"&&!Array.isArray(value)?value:{}; }
function clean(value){ return String(value??"").trim(); }
function validIso(value){ const text=clean(value); return text&&Number.isFinite(Date.parse(text))?new Date(text).toISOString():null; }
