// Build 518 — Controlled-Environment Routing Outcome Evidence Continuity.
// Read-only observed-outcome continuity over retained Build 517 and Build 508 authorities.
import { buildWinterBookingQuoteRuleControlledActivationOutcomeContinuity } from "./winter-booking-quote-rule-controlled-activation-outcome-continuity.js";
import { buildControlledEnvironmentOperationalReadinessRoutingContinuity } from "./controlled-environment-operational-readiness-routing-continuity.js";

export function buildControlledEnvironmentRoutingOutcomeEvidenceContinuity({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const predecessor = buildWinterBookingQuoteRuleControlledActivationOutcomeContinuity({
    economics, fleet, pricing, source_status, generated_at
  });
  const operational = buildControlledEnvironmentOperationalReadinessRoutingContinuity({
    economics, fleet, pricing, source_status, generated_at
  });
  const readiness = operational?.economics?.controlled_environment_operational_readiness || {};
  const readinessRows = Array.isArray(readiness.rows) ? readiness.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];

  const rows = [];
  const gaps = [];

  for (const retained of readinessRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, retained)) || {};
    const candidatePresent = retained.controlled_environment_candidate_present === true;
    const qualificationCurrent = qualificationEvidenceCurrent(retained);
    const operationalReady = retained.controlled_environment_operational_review_ready === true;

    const outcome = clean(source.controlled_environment_routing_outcome);
    const outcomeObservedAt = clean(source.controlled_environment_routing_outcome_observed_at) || null;
    const outcomeReference = clean(source.controlled_environment_routing_outcome_reference) || null;
    const expectedSiteReference = clean(retained?.site_evidence?.reference) || null;
    const outcomeSiteReference = clean(
      source.controlled_environment_routing_outcome_site_reference ||
      source.controlled_environment_site_confirmation_site_reference
    ) || null;

    const siteConfirmationObservedAt = clean(source.controlled_environment_site_confirmation_observed_at) || null;
    const siteConfirmationReference = clean(source.controlled_environment_site_confirmation_observation_reference) || null;
    const siteReferenceMatches = Boolean(expectedSiteReference) &&
      Boolean(outcomeSiteReference) &&
      expectedSiteReference === outcomeSiteReference;

    const safeRescheduleObservedAt = clean(source.controlled_environment_safe_reschedule_observed_at) || null;
    const safeRescheduleReference = clean(source.controlled_environment_safe_reschedule_reference) || null;

    const attributableOutcome = Boolean(outcomeObservedAt) && Boolean(outcomeReference);
    const routeOutcomeRequested = outcome === "routed_to_confirmed_site";
    const safeRescheduleRequested = outcome === "safe_rescheduled";

    const routeObserved =
      candidatePresent &&
      operationalReady &&
      qualificationCurrent &&
      routeOutcomeRequested &&
      attributableOutcome &&
      Boolean(siteConfirmationObservedAt) &&
      Boolean(siteConfirmationReference) &&
      siteReferenceMatches;

    const safeRescheduleObserved =
      candidatePresent &&
      operationalReady &&
      qualificationCurrent &&
      safeRescheduleRequested &&
      attributableOutcome &&
      Boolean(safeRescheduleObservedAt) &&
      Boolean(safeRescheduleReference);

    let outcomeState = "not_applicable";
    if (candidatePresent && routeObserved) {
      outcomeState = "route_outcome_observed";
    } else if (candidatePresent && safeRescheduleObserved) {
      outcomeState = "safe_reschedule_outcome_observed";
    } else if (candidatePresent && (routeOutcomeRequested || safeRescheduleRequested) && attributableOutcome) {
      outcomeState = "routing_outcome_evidence_conflict";
    } else if (candidatePresent) {
      outcomeState = "outcome_owner_action_required";
    }

    const missing = [];
    if (candidatePresent && !operationalReady) missing.push("build508_operational_review_readiness");
    if (candidatePresent && !qualificationCurrent) missing.push("current_site_workflow_equipment_product_evidence");
    if (candidatePresent && !outcome) missing.push("controlled_environment_routing_outcome");
    if (candidatePresent && !outcomeObservedAt) missing.push("routing_outcome_observed_at");
    if (candidatePresent && !outcomeReference) missing.push("routing_outcome_reference");
    if (routeOutcomeRequested && !siteConfirmationObservedAt) missing.push("current_site_confirmation_observed_at");
    if (routeOutcomeRequested && !siteConfirmationReference) missing.push("current_site_confirmation_observation_reference");
    if (routeOutcomeRequested && !outcomeSiteReference) missing.push("routing_outcome_site_reference");
    if (routeOutcomeRequested && outcomeSiteReference && !siteReferenceMatches) missing.push("qualified_site_reference_match");
    if (safeRescheduleRequested && !safeRescheduleObservedAt) missing.push("safe_reschedule_observed_at");
    if (safeRescheduleRequested && !safeRescheduleReference) missing.push("safe_reschedule_reference");

    rows.push(Object.freeze({
      entity_type: retained.entity_type,
      code: retained.code,
      classification: retained.classification,
      controlled_environment_candidate_present: candidatePresent,
      retained_operational_readiness_state: retained.operational_readiness_state,
      retained_controlled_environment_operational_review_ready: operationalReady,
      current_site_workflow_equipment_product_evidence: qualificationCurrent,
      expected_site_reference: expectedSiteReference,
      controlled_environment_routing_outcome: outcome || null,
      controlled_environment_routing_outcome_observed_at: outcomeObservedAt,
      controlled_environment_routing_outcome_reference: outcomeReference,
      controlled_environment_routing_outcome_site_reference: outcomeSiteReference,
      current_site_confirmation_observed_at: siteConfirmationObservedAt,
      current_site_confirmation_observation_reference: siteConfirmationReference,
      qualified_site_reference_matches_observed_route: routeOutcomeRequested ? siteReferenceMatches : null,
      safe_reschedule_observed_at: safeRescheduleObservedAt,
      safe_reschedule_reference: safeRescheduleReference,
      outcome_state: outcomeState,
      route_outcome_observed: routeObserved,
      safe_reschedule_outcome_observed: safeRescheduleObserved,
      service_site_specific_only: true,
      observed_outcome_not_inferred: true,
      automatic_appointment_move_authorized: false,
      automatic_routing_authorized: false,
      automatic_reschedule_authorized: false,
      universal_indoor_capability_authorized: false,
      future_capacity_authorized: false
    }));

    if (candidatePresent && !routeObserved && !safeRescheduleObserved) {
      gaps.push(Object.freeze({
        entity_type: retained.entity_type,
        code: retained.code,
        state: outcomeState,
        missing: Object.freeze(missing),
        safe_default: "retain_manual_site_confirmation_or_safe_reschedule_review"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    controlled_environment_candidate: rows.filter((row) => row.controlled_environment_candidate_present).length,
    route_outcome_observed: rows.filter((row) => row.route_outcome_observed).length,
    safe_reschedule_outcome_observed: rows.filter((row) => row.safe_reschedule_outcome_observed).length,
    routing_outcome_evidence_conflict: rows.filter((row) => row.outcome_state === "routing_outcome_evidence_conflict").length,
    outcome_owner_action_required: rows.filter((row) => row.outcome_state === "outcome_owner_action_required").length
  });

  return Object.freeze({
    ...predecessor,
    controlled_environment_routing_outcome_build: 518,
    controlled_environment_routing_outcome_authority: "controlled_environment_routing_outcome_evidence_continuity",
    retained_predecessor_authority: "winter_booking_quote_rule_controlled_activation_outcome_continuity",
    retained_operational_readiness_authority: "controlled_environment_operational_readiness_routing_continuity",
    economics: Object.freeze({
      ...(predecessor.economics || {}),
      controlled_environment_operational_readiness: readiness,
      controlled_environment_routing_outcome_continuity: Object.freeze({
        status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "observed",
        row_count: rows.length,
        gap_count: gaps.length,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        attributable_service_site_specific_outcome_required: true,
        current_site_confirmation_required_for_routed_outcome: true,
        safe_reschedule_outcome_must_be_observed: true,
        current_site_workflow_equipment_product_evidence_required: true,
        one_successful_route_establishes_universal_indoor_capability: false,
        one_successful_route_establishes_future_capacity: false,
        automatic_appointment_move_authorized: false,
        automatic_routing_authorized: false,
        automatic_reschedule_authorized: false
      })
    }),
    truth_boundary: Object.freeze({
      ...(predecessor.truth_boundary || {}),
      routing_outcome_is_observed_not_inferred: true,
      one_successful_route_proves_universal_indoor_capability: false,
      one_successful_route_proves_future_capacity: false,
      stale_site_workflow_equipment_product_evidence_may_support_outcome: false,
      missing_site_confirmation_may_be_inferred: false,
      safe_reschedule_may_be_inferred: false
    }),
    boundaries: Object.freeze({
      ...(predecessor.boundaries || {}),
      read_only: true,
      automatic_appointment_move_allowed: false,
      automatic_routing_allowed: false,
      automatic_reschedule_allowed: false,
      automatic_booking_availability_change_allowed: false,
      automatic_quote_rule_change_allowed: false,
      automatic_customer_message_allowed: false,
      automatic_public_indoor_claim_allowed: false,
      automatic_capacity_reservation_allowed: false,
      canonical_hold_mutation_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function qualificationEvidenceCurrent(row = {}) {
  return ["site_evidence", "workflow_evidence", "equipment_evidence", "product_evidence"].every((key) => {
    const item = row?.[key] || {};
    return Boolean(clean(item.reference)) && item.current === true && item.supported === true;
  });
}

function sameEntity(source = {}, target = {}) {
  const type = clean(target.entity_type).toLowerCase();
  const code = clean(target.code);
  if (!code) return false;
  const sourceType = clean(source.entity_type).toLowerCase();
  const sourceCode = clean(source.code);
  if (sourceType && sourceCode) return sourceType === type && sourceCode === code;
  if (type === "add_on") return clean(source.add_on_code) === code;
  if (type === "package") return clean(source.package_code) === code;
  if (type === "service") return clean(source.service_code) === code;
  return false;
}
function clean(value) { return String(value ?? "").trim(); }
