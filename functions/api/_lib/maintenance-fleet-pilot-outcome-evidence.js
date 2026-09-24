// Build 491 — Maintenance & Fleet Pilot Outcome Evidence.
// Read-only attributable outcome evidence over retained owner-decision / controlled-pilot authorities.
// A source-green release, commercial approval or pilot decision is never treated as executed pilot evidence.

export function buildMaintenanceFleetPilotOutcomeEvidence({
  owner_approval = {},
  execution_evidence = [],
  execution_source_available = false,
  generated_at = new Date().toISOString()
} = {}) {
  const decision = objectOrEmpty(owner_approval?.pilot_decision_record);
  const bounds = objectOrEmpty(decision.owner_bounds);
  const authorized =
    decision.status === "pilot_decision_recorded" &&
    decision.decision === "approve" &&
    decision.owner_pilot_authorization_recorded === true &&
    decision.commercial_rulebooks_approved === true &&
    bounds.complete === true &&
    positiveWhole(bounds.participant_limit) !== null &&
    positiveWhole(bounds.duration_days) !== null;

  const rows = safeArray(execution_evidence).map(normalizeEvidenceRow);
  const attributed = rows.filter(row => row.attributable === true);
  const participantRefs = unique(attributed.map(row => row.participant_ref).filter(Boolean));
  const maintenanceCount = attributed.filter(row => row.participant_type === "maintenance").length;
  const fleetCount = attributed.filter(row => row.participant_type === "fleet").length;
  const starts = attributed.map(row => row.started_at).filter(Boolean).map(Date.parse).filter(Number.isFinite);
  const ends = attributed.map(row => row.ended_at).filter(Boolean).map(Date.parse).filter(Number.isFinite);
  const firstStart = starts.length ? new Date(Math.min(...starts)).toISOString() : null;
  const lastEnd = ends.length ? new Date(Math.max(...ends)).toISOString() : null;
  const observedDurationDays = firstStart && lastEnd
    ? Math.max(1, Math.ceil((Date.parse(lastEnd) - Date.parse(firstStart)) / 86400000))
    : null;
  const availabilityObserved = attributed.filter(row => row.availability_revalidated_at).length;
  const checkoutObserved = attributed.filter(row => row.checkout_revalidated_at).length;
  const invoiceObserved = attributed.filter(row => row.invoice.observed === true).length;
  const travelObserved = attributed.filter(row => row.travel.observed === true).length;
  const stopObserved = attributed.filter(row => row.stop_condition.observed === true).length;
  const stopTriggered = attributed.filter(row => row.stop_condition.triggered === true).length;
  const participantLimit = positiveWhole(bounds.participant_limit);
  const durationLimit = positiveWhole(bounds.duration_days);
  const participantBoundSatisfied = participantLimit !== null && participantRefs.length <= participantLimit;
  const durationBoundSatisfied = durationLimit !== null && observedDurationDays !== null && observedDurationDays <= durationLimit;
  const everyAttributedRowHasCapacityEvidence = attributed.length > 0 &&
    availabilityObserved === attributed.length && checkoutObserved === attributed.length;
  const everyAttributedRowHasOutcomeEvidence = attributed.length > 0 &&
    invoiceObserved === attributed.length && travelObserved === attributed.length && stopObserved === attributed.length;

  let status = "owner_action_authorization_required";
  if (authorized && !execution_source_available) status = "owner_action_execution_source_required";
  else if (authorized && rows.length === 0) status = "owner_action_execution_evidence_required";
  else if (authorized && attributed.length === 0) status = "outcome_evidence_unattributable";
  else if (authorized && participantBoundSatisfied && durationBoundSatisfied &&
    everyAttributedRowHasCapacityEvidence && everyAttributedRowHasOutcomeEvidence) {
    status = "bounded_pilot_outcome_review_ready";
  } else if (authorized) status = "outcome_evidence_incomplete";

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    build: 491,
    authority: "maintenance_fleet_pilot_outcome_evidence",
    retained_owner_decision_authority: "maintenance_fleet_owner_approval_pilot_decision",
    retained_controlled_pilot_authority: "maintenance_fleet_controlled_pilot_activation_readiness",
    retained_operational_pilot_authority: "retention_maintenance_fleet_operational_pilot",
    status,
    authorization: Object.freeze({
      explicit_owner_approval_required: true,
      bounded_pilot_authorization_required: true,
      owner_pilot_authorization_recorded: decision.owner_pilot_authorization_recorded === true,
      commercial_rulebooks_approved: decision.commercial_rulebooks_approved === true,
      owner_bounds_complete: bounds.complete === true,
      participant_limit: participantLimit,
      duration_days: durationLimit,
      attributable_outcome_capture_allowed: authorized,
      source_release_green_is_not_execution_evidence: true
    }),
    execution_source: Object.freeze({
      available: execution_source_available === true,
      row_count: rows.length,
      attributed_row_count: attributed.length,
      missing_execution_evidence_is_owner_action: true
    }),
    participants: Object.freeze({
      observed_count: participantRefs.length,
      maintenance_evidence_rows: maintenanceCount,
      fleet_evidence_rows: fleetCount,
      participant_refs: Object.freeze(participantRefs),
      participant_limit: participantLimit,
      bound_satisfied: participantBoundSatisfied,
      participant_identity_exposed: false,
      participant_selection_inferred: false
    }),
    duration: Object.freeze({
      first_observed_start_at: firstStart,
      last_observed_end_at: lastEnd,
      observed_duration_days: observedDurationDays,
      authorized_duration_days: durationLimit,
      bound_satisfied: durationBoundSatisfied,
      duration_inferred_from_authorization: false
    }),
    capacity: Object.freeze({
      availability_authority: "/api/availability",
      collision_revalidation_authority: "/api/checkout",
      availability_revalidation_observed_count: availabilityObserved,
      checkout_revalidation_observed_count: checkoutObserved,
      every_attributed_row_has_capacity_evidence: everyAttributedRowHasCapacityEvidence,
      live_capacity_inferred: false,
      capacity_reservation_inferred: false
    }),
    invoicing: Object.freeze({
      observed_count: invoiceObserved,
      every_attributed_row_has_invoice_evidence: attributed.length > 0 && invoiceObserved === attributed.length,
      invoice_creation_performed: false,
      invoice_terms_inferred: false
    }),
    travel: Object.freeze({
      observed_count: travelObserved,
      observed_distance_km: round2(attributed.reduce((sum,row)=>sum+(row.travel.distance_km || 0),0)),
      every_attributed_row_has_travel_evidence: attributed.length > 0 && travelObserved === attributed.length,
      travel_limit_inferred: false
    }),
    stop_conditions: Object.freeze({
      observed_count: stopObserved,
      triggered_count: stopTriggered,
      every_attributed_row_has_stop_condition_evidence: attributed.length > 0 && stopObserved === attributed.length,
      stop_condition_inferred: false,
      automatic_stop_action_performed: false
    }),
    rows: Object.freeze(attributed),
    truth_boundary: Object.freeze({
      customer_activation_performed: false,
      maintenance_enrollment_performed: false,
      fleet_account_activation_performed: false,
      booking_created_or_changed: false,
      capacity_reserved: false,
      guaranteed_capacity_inferred: false,
      automatic_invoice_created: false,
      pricing_or_discount_changed: false,
      recurring_billing_enabled: false,
      customer_outreach_sent: false,
      provider_mutation_performed: false,
      accounting_or_inventory_mutation_performed: false,
      schema_or_storage_mutation_performed: false,
      canonical_hold_mutated: false,
      execution_success_inferred_from_source_green: false,
      permanent_polling: false
    })
  });
}

function normalizeEvidenceRow(value) {
  const row = objectOrEmpty(value);
  const invoice = objectOrEmpty(row.invoice_evidence);
  const travel = objectOrEmpty(row.travel_evidence);
  const stop = objectOrEmpty(row.stop_condition);
  const participantType = clean(row.participant_type).toLowerCase();
  const participantRef = clean(row.participant_ref);
  const startedAt = validIso(row.started_at);
  const endedAt = validIso(row.ended_at);
  const availabilityAt = validIso(row.availability_revalidated_at);
  const checkoutAt = validIso(row.checkout_revalidated_at);
  const attributable = Boolean(participantRef) &&
    ["maintenance","fleet"].includes(participantType) &&
    Boolean(startedAt) && Boolean(endedAt) && Date.parse(endedAt) >= Date.parse(startedAt);
  return Object.freeze({
    evidence_id: clean(row.evidence_id) || null,
    participant_ref: participantRef || null,
    participant_type: ["maintenance","fleet"].includes(participantType) ? participantType : "unknown",
    started_at: startedAt,
    ended_at: endedAt,
    attributable,
    availability_revalidated_at: availabilityAt,
    checkout_revalidated_at: checkoutAt,
    invoice: Object.freeze({
      observed: Boolean(validIso(invoice.observed_at)) && Boolean(clean(invoice.status)),
      observed_at: validIso(invoice.observed_at),
      status: clean(invoice.status) || null
    }),
    travel: Object.freeze({
      observed: Boolean(validIso(travel.observed_at)) && finiteNonNegative(travel.distance_km) !== null,
      observed_at: validIso(travel.observed_at),
      distance_km: finiteNonNegative(travel.distance_km)
    }),
    stop_condition: Object.freeze({
      observed: Boolean(validIso(stop.observed_at)) && typeof stop.triggered === "boolean",
      observed_at: validIso(stop.observed_at),
      triggered: typeof stop.triggered === "boolean" ? stop.triggered : null,
      reason: clean(stop.reason) || null
    })
  });
}
function safeArray(value){ return Array.isArray(value) ? value : []; }
function objectOrEmpty(value){ return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value){ return String(value ?? "").trim(); }
function unique(values){ return [...new Set(values)]; }
function validIso(value){ const text=clean(value); return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null; }
function positiveWhole(value){ const n=Number(value); return Number.isFinite(n) && n>0 ? Math.floor(n) : null; }
function finiteNonNegative(value){ const n=Number(value); return Number.isFinite(n) && n>=0 ? n : null; }
function round2(value){ return Math.round((Number(value)||0)*100)/100; }
