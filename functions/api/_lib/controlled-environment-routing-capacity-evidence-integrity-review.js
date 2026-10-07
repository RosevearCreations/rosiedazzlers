// Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review.
// Read-only integrity verification over Build 528 routing/capacity freshness and exact outcome-time identity.
import { buildWinterBookingQuoteRuleEvidenceIntegrityReview } from "./winter-booking-quote-rule-evidence-integrity-review.js";

const CURRENT_ROUTING_STATES = new Set(["route_outcome_current","safe_reschedule_outcome_current"]);

export function buildControlledEnvironmentRoutingCapacityEvidenceIntegrityReview({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null, freshness_window_days = 30
} = {}) {
  const base = buildWinterBookingQuoteRuleEvidenceIntegrityReview({
    economics, fleet, pricing, source_status, generated_at, freshness_window_days
  });
  const freshness = base?.economics?.controlled_environment_routing_outcome_freshness_capacity_review || {};
  const retainedRows = Array.isArray(freshness.rows) ? freshness.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows : [];
  const rows = [], gaps = [];

  for (const retained of retainedRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, retained)) || null;
    const candidatePresent = retained.controlled_environment_candidate_present === true;
    const routingState = clean(retained.routing_freshness_state) || "predecessor_outcome_review_required";
    const retainedReviewCurrent = candidatePresent &&
      retained.routing_freshness_current === true &&
      CURRENT_ROUTING_STATES.has(routingState) &&
      retained.manual_review_required !== true;

    const currentClassification = clean(retained.classification) || clean(source?.classification) || null;
    const currentSiteReference = clean(source?.controlled_environment_site_reference) || clean(retained.expected_site_reference) || null;
    const currentWorkflowReference = clean(source?.controlled_environment_workflow_reference || source?.indoor_workflow_reference) || null;
    const snapshotClassification = clean(source?.controlled_environment_outcome_service_classification) || null;
    const snapshotSiteReference = clean(source?.controlled_environment_outcome_site_reference) || null;
    const snapshotWorkflowReference = clean(source?.controlled_environment_outcome_workflow_reference) || null;
    const serviceIdentityRecorded = Boolean(
      currentClassification && currentSiteReference && currentWorkflowReference &&
      snapshotClassification && snapshotSiteReference && snapshotWorkflowReference
    );
    const serviceIdentityMatches = serviceIdentityRecorded &&
      normalizeToken(currentClassification) === normalizeToken(snapshotClassification) &&
      currentSiteReference === snapshotSiteReference &&
      currentWorkflowReference === snapshotWorkflowReference &&
      (!retained.expected_site_reference || clean(retained.expected_site_reference) === snapshotSiteReference);

    const currentRoutingOutcome = clean(retained.current_routing_outcome) || null;
    const currentRoutingReference = clean(retained.routing_outcome_reference) || null;
    const snapshotRoutingOutcome = clean(source?.controlled_environment_outcome_routing_state) || null;
    const snapshotRoutingReference = clean(source?.controlled_environment_outcome_routing_reference) || null;
    const routingIdentityRecorded = Boolean(currentRoutingOutcome && currentRoutingReference && snapshotRoutingOutcome && snapshotRoutingReference);
    const routingIdentityMatches = routingIdentityRecorded &&
      normalizeToken(currentRoutingOutcome) === normalizeToken(snapshotRoutingOutcome) &&
      currentRoutingReference === snapshotRoutingReference;

    const routeOutcome = currentRoutingOutcome === "routed_to_confirmed_site";
    const safeRescheduleOutcome = currentRoutingOutcome === "safe_rescheduled";

    const currentSiteConfirmationReference = clean(retained.current_site_confirmation_reference) || null;
    const snapshotSiteConfirmationReference = clean(source?.controlled_environment_outcome_site_confirmation_reference) || null;
    const siteConfirmationIdentityRecorded = !routeOutcome || Boolean(currentSiteConfirmationReference && snapshotSiteConfirmationReference);
    const siteConfirmationIdentityMatches = !routeOutcome || (
      siteConfirmationIdentityRecorded &&
      currentSiteConfirmationReference === snapshotSiteConfirmationReference &&
      retained.qualified_site_reference_matches_current_route === true
    );

    const currentSafeRescheduleReference = clean(retained.safe_reschedule_reference) || null;
    const snapshotSafeRescheduleReference = clean(source?.controlled_environment_outcome_safe_reschedule_reference) || null;
    const safeRescheduleIdentityRecorded = !safeRescheduleOutcome || Boolean(currentSafeRescheduleReference && snapshotSafeRescheduleReference);
    const safeRescheduleIdentityMatches = !safeRescheduleOutcome || (
      safeRescheduleIdentityRecorded &&
      currentSafeRescheduleReference === snapshotSafeRescheduleReference
    );

    const currentCapacityState = clean(retained.capacity_state) || "capacity_not_observed";
    const snapshotCapacityState = clean(source?.controlled_environment_outcome_capacity_state_snapshot) || null;
    const boundedCapacityCurrent = currentCapacityState === "bounded_observed_capacity_current";
    const capacityContextRecorded = Boolean(snapshotCapacityState) && (
      !boundedCapacityCurrent ||
      (
        clean(source?.controlled_environment_outcome_capacity_observation_reference) &&
        clean(source?.controlled_environment_outcome_capacity_observation_site_reference) &&
        finiteInteger(source?.controlled_environment_outcome_capacity_observation_window_days) !== null &&
        finiteInteger(source?.controlled_environment_outcome_observed_capacity_jobs) !== null
      )
    );
    const capacityContextMatches = capacityContextRecorded &&
      snapshotCapacityState === currentCapacityState &&
      (!boundedCapacityCurrent || (
        clean(source?.controlled_environment_outcome_capacity_observation_reference) === clean(retained.capacity_observation_reference) &&
        clean(source?.controlled_environment_outcome_capacity_observation_site_reference) === clean(retained.capacity_observation_site_reference) &&
        finiteInteger(source?.controlled_environment_outcome_capacity_observation_window_days) === finiteInteger(retained.capacity_observation_window_days) &&
        finiteInteger(source?.controlled_environment_outcome_observed_capacity_jobs) === finiteInteger(retained.observed_capacity_jobs) &&
        retained.capacity_site_matches_retained_site === true
      ));

    let integrityState = candidatePresent ? "integrity_current" : "not_applicable";
    if (candidatePresent && !source) integrityState = "integrity_source_unavailable";
    else if (candidatePresent && !retainedReviewCurrent) integrityState = "retained_routing_capacity_review_required";
    else if (candidatePresent && !serviceIdentityRecorded) integrityState = "service_site_workflow_identity_review_required";
    else if (candidatePresent && !serviceIdentityMatches) integrityState = "service_site_workflow_identity_drift_review_required";
    else if (candidatePresent && !routingIdentityRecorded) integrityState = "routing_outcome_identity_review_required";
    else if (candidatePresent && !routingIdentityMatches) integrityState = "routing_outcome_identity_drift_review_required";
    else if (candidatePresent && !siteConfirmationIdentityRecorded) integrityState = "site_confirmation_identity_review_required";
    else if (candidatePresent && !siteConfirmationIdentityMatches) integrityState = "site_confirmation_identity_drift_review_required";
    else if (candidatePresent && !safeRescheduleIdentityRecorded) integrityState = "safe_reschedule_identity_review_required";
    else if (candidatePresent && !safeRescheduleIdentityMatches) integrityState = "safe_reschedule_identity_drift_review_required";
    else if (candidatePresent && !capacityContextRecorded) integrityState = "bounded_capacity_context_identity_review_required";
    else if (candidatePresent && !capacityContextMatches) integrityState = "bounded_capacity_context_identity_drift_review_required";

    const integrityCurrent = candidatePresent && integrityState === "integrity_current";
    const missing = [];
    if (candidatePresent && !source) missing.push("current_service_site_workflow_source_evidence");
    if (candidatePresent && !retainedReviewCurrent) missing.push("current_build528_routing_capacity_freshness_evidence");
    if (candidatePresent && !snapshotClassification) missing.push("outcome_time_service_classification_snapshot");
    if (candidatePresent && !snapshotSiteReference) missing.push("outcome_time_site_reference_snapshot");
    if (candidatePresent && !snapshotWorkflowReference) missing.push("outcome_time_workflow_reference_snapshot");
    if (serviceIdentityRecorded && !serviceIdentityMatches) missing.push("service_site_workflow_identity_matches_outcome_snapshot");
    if (candidatePresent && !snapshotRoutingOutcome) missing.push("outcome_time_routing_state_snapshot");
    if (candidatePresent && !snapshotRoutingReference) missing.push("outcome_time_routing_reference_snapshot");
    if (routingIdentityRecorded && !routingIdentityMatches) missing.push("routing_outcome_identity_matches_outcome_snapshot");
    if (routeOutcome && !snapshotSiteConfirmationReference) missing.push("outcome_time_site_confirmation_reference_snapshot");
    if (routeOutcome && siteConfirmationIdentityRecorded && !siteConfirmationIdentityMatches) missing.push("site_confirmation_identity_matches_outcome_snapshot");
    if (safeRescheduleOutcome && !snapshotSafeRescheduleReference) missing.push("outcome_time_safe_reschedule_reference_snapshot");
    if (safeRescheduleOutcome && safeRescheduleIdentityRecorded && !safeRescheduleIdentityMatches) missing.push("safe_reschedule_identity_matches_outcome_snapshot");
    if (candidatePresent && !snapshotCapacityState) missing.push("outcome_time_capacity_state_snapshot");
    if (boundedCapacityCurrent && !clean(source?.controlled_environment_outcome_capacity_observation_reference)) missing.push("outcome_time_capacity_reference_snapshot");
    if (boundedCapacityCurrent && !clean(source?.controlled_environment_outcome_capacity_observation_site_reference)) missing.push("outcome_time_capacity_site_snapshot");
    if (boundedCapacityCurrent && finiteInteger(source?.controlled_environment_outcome_capacity_observation_window_days) === null) missing.push("outcome_time_capacity_window_snapshot");
    if (boundedCapacityCurrent && finiteInteger(source?.controlled_environment_outcome_observed_capacity_jobs) === null) missing.push("outcome_time_observed_capacity_jobs_snapshot");
    if (capacityContextRecorded && !capacityContextMatches) missing.push("bounded_capacity_context_matches_outcome_snapshot");

    rows.push(Object.freeze({
      entity_type: retained.entity_type, code: retained.code,
      controlled_environment_candidate_present: candidatePresent,
      retained_build528_routing_freshness_state: routingState,
      retained_build528_review_current: retainedReviewCurrent,
      current_service_classification: currentClassification,
      current_site_reference: currentSiteReference,
      current_workflow_reference: currentWorkflowReference,
      outcome_snapshot_service_classification: snapshotClassification,
      outcome_snapshot_site_reference: snapshotSiteReference,
      outcome_snapshot_workflow_reference: snapshotWorkflowReference,
      service_site_workflow_identity_recorded: serviceIdentityRecorded,
      service_site_workflow_identity_matches_outcome_snapshot: serviceIdentityMatches,
      current_routing_outcome: currentRoutingOutcome,
      current_routing_reference: currentRoutingReference,
      outcome_snapshot_routing_outcome: snapshotRoutingOutcome,
      outcome_snapshot_routing_reference: snapshotRoutingReference,
      routing_outcome_identity_recorded: routingIdentityRecorded,
      routing_outcome_identity_matches_outcome_snapshot: routingIdentityMatches,
      current_site_confirmation_reference: currentSiteConfirmationReference,
      outcome_snapshot_site_confirmation_reference: snapshotSiteConfirmationReference,
      site_confirmation_identity_recorded: siteConfirmationIdentityRecorded,
      site_confirmation_identity_matches_outcome_snapshot: siteConfirmationIdentityMatches,
      current_safe_reschedule_reference: currentSafeRescheduleReference,
      outcome_snapshot_safe_reschedule_reference: snapshotSafeRescheduleReference,
      safe_reschedule_identity_recorded: safeRescheduleIdentityRecorded,
      safe_reschedule_identity_matches_outcome_snapshot: safeRescheduleIdentityMatches,
      current_capacity_state: currentCapacityState,
      outcome_snapshot_capacity_state: snapshotCapacityState,
      observed_capacity_jobs: retained.observed_capacity_jobs ?? null,
      capacity_observation_reference: retained.capacity_observation_reference || null,
      capacity_observation_window_days: retained.capacity_observation_window_days ?? null,
      capacity_observation_site_reference: retained.capacity_observation_site_reference || null,
      bounded_capacity_context_identity_recorded: capacityContextRecorded,
      bounded_capacity_context_identity_matches_outcome_snapshot: capacityContextMatches,
      integrity_state: integrityState,
      evidence_integrity_current: integrityCurrent,
      manual_review_required: candidatePresent && !integrityCurrent,
      service_site_workflow_specific_only: true,
      qualified_site_establishes_universal_indoor_capability: false,
      successful_route_establishes_another_service_safe_operability: false,
      successful_route_establishes_future_capacity: false,
      bounded_observed_capacity_establishes_future_capacity: false,
      automatic_appointment_move_authorized: false,
      automatic_routing_authorized: false,
      automatic_reschedule_authorized: false,
      automatic_capacity_reservation_authorized: false
    }));

    if (candidatePresent && !integrityCurrent) {
      gaps.push(Object.freeze({
        entity_type: retained.entity_type, code: retained.code, state: integrityState,
        missing: Object.freeze([...new Set(missing)]),
        safe_default: "retain_manual_site_confirmation_safe_reschedule_or_capacity_review"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    controlled_environment_candidate: rows.filter((row) => row.controlled_environment_candidate_present).length,
    integrity_current: rows.filter((row) => row.evidence_integrity_current).length,
    retained_routing_capacity_review: rows.filter((row) => row.integrity_state === "retained_routing_capacity_review_required").length,
    service_site_workflow_identity_review: rows.filter((row) => row.integrity_state.startsWith("service_site_workflow_identity_")).length,
    routing_outcome_identity_review: rows.filter((row) => row.integrity_state.startsWith("routing_outcome_identity_")).length,
    site_confirmation_identity_review: rows.filter((row) => row.integrity_state.startsWith("site_confirmation_identity_")).length,
    safe_reschedule_identity_review: rows.filter((row) => row.integrity_state.startsWith("safe_reschedule_identity_")).length,
    bounded_capacity_context_identity_review: rows.filter((row) => row.integrity_state.startsWith("bounded_capacity_context_identity_")).length,
    review_required: rows.filter((row) => row.manual_review_required).length
  });

  return Object.freeze({
    ...base,
    controlled_environment_routing_capacity_integrity_build: 538,
    controlled_environment_routing_capacity_integrity_authority: "controlled_environment_routing_capacity_evidence_integrity_review",
    retained_routing_capacity_freshness_authority: "controlled_environment_routing_outcome_freshness_capacity_review",
    retained_routing_outcome_authority: "controlled_environment_routing_outcome_evidence_continuity",
    retained_operational_readiness_authority: "controlled_environment_operational_readiness_routing_continuity",
    economics: Object.freeze({ ...(base.economics || {}), controlled_environment_routing_capacity_evidence_integrity_review: Object.freeze({
      status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "current",
      row_count: rows.length, gap_count: gaps.length, counts,
      rows: Object.freeze(rows), gaps: Object.freeze(gaps),
      exact_service_site_workflow_identity_required: true,
      exact_routing_outcome_identity_required: true,
      current_site_confirmation_identity_required_for_routed_outcome: true,
      exact_safe_reschedule_identity_required_for_safe_reschedule: true,
      bounded_capacity_context_identity_required: true,
      capacity_not_observed_remains_no_capacity_claim: true,
      universal_indoor_capability_authorized: false,
      future_capacity_authorized: false,
      automatic_routing_authorized: false,
      automatic_capacity_reservation_authorized: false
    })}),
    truth_boundary: Object.freeze({ ...(base.truth_boundary || {}),
      controlled_environment_identity_may_be_inferred_from_source_or_runtime_green: false,
      missing_outcome_identity_snapshot_may_be_treated_as_current: false,
      qualified_site_proves_universal_indoor_capability: false,
      successful_route_proves_another_service_safe_operability: false,
      successful_route_proves_future_capacity: false,
      bounded_observed_capacity_proves_future_capacity: false
    }),
    boundaries: Object.freeze({ ...(base.boundaries || {}), read_only: true,
      automatic_appointment_move_allowed: false, automatic_routing_allowed: false,
      automatic_reschedule_allowed: false, automatic_booking_availability_change_allowed: false,
      automatic_quote_rule_change_allowed: false, automatic_customer_message_allowed: false,
      automatic_public_indoor_claim_allowed: false, automatic_capacity_reservation_allowed: false,
      canonical_hold_mutation_allowed: false, schema_mutation_allowed: false,
      storage_mutation_allowed: false, persistent_telemetry_allowed: false, permanent_polling: false
    })
  });
}

function sameEntity(source = {}, target = {}) {
  const type = clean(target.entity_type).toLowerCase(), code = clean(target.code);
  if (!code) return false;
  const sourceType = clean(source.entity_type).toLowerCase(), sourceCode = clean(source.code);
  if (sourceType && sourceCode) return sourceType === type && sourceCode === code;
  if (type === "add_on") return clean(source.add_on_code) === code;
  if (type === "package") return clean(source.package_code) === code;
  if (type === "service") return clean(source.service_code) === code;
  return false;
}
function finiteInteger(value){ if(value===null||value===undefined||value==="") return null; const n=Number(value); return Number.isInteger(n)?n:null; }
function normalizeToken(value){ return clean(value).replace(/[\s-]+/g,"_").toLowerCase(); }
function clean(value){ return String(value ?? "").trim(); }
