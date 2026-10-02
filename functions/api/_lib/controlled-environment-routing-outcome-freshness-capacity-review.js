// Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review.
// Read-only freshness and bounded observed-capacity review over retained Build 518 routing outcomes.
import { buildWinterBookingQuoteRuleOutcomeFreshnessReview } from "./winter-booking-quote-rule-outcome-freshness-review.js";

const CURRENT_ROUTING_STATES = new Set(["route_outcome_current","safe_reschedule_outcome_current"]);

export function buildControlledEnvironmentRoutingOutcomeFreshnessCapacityReview({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null, freshness_window_days = 30
} = {}) {
  const base = buildWinterBookingQuoteRuleOutcomeFreshnessReview({
    economics, fleet, pricing, source_status, generated_at, freshness_window_days
  });
  const continuity = base?.economics?.controlled_environment_routing_outcome_continuity || {};
  const retainedRows = Array.isArray(continuity.rows) ? continuity.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];
  const generatedAt = validDate(generated_at) ? new Date(generated_at) : new Date();
  const windowDays = Math.max(1, Math.min(365, Number(freshness_window_days) || 30));

  const rows = [];
  const gaps = [];

  for (const retained of retainedRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, retained)) || null;
    const candidatePresent = retained.controlled_environment_candidate_present === true;

    const currentOutcome = clean(source?.controlled_environment_routing_outcome) || null;
    const retainedOutcome = clean(retained.controlled_environment_routing_outcome) || null;
    const outcomeObservedAt = validDate(source?.controlled_environment_routing_outcome_observed_at)
      ? clean(source.controlled_environment_routing_outcome_observed_at)
      : retained.controlled_environment_routing_outcome_observed_at || null;
    const outcomeReference = clean(source?.controlled_environment_routing_outcome_reference) || retained.controlled_environment_routing_outcome_reference || null;
    const outcomeAgeDays = ageDays(outcomeObservedAt, generatedAt);

    const expectedSiteReference = clean(retained.expected_site_reference) || null;
    const currentRouteSiteReference = clean(
      source?.controlled_environment_routing_outcome_site_reference ||
      source?.controlled_environment_site_confirmation_site_reference
    ) || null;
    const siteReferenceMatches = Boolean(expectedSiteReference && currentRouteSiteReference && expectedSiteReference === currentRouteSiteReference);

    const siteConfirmationObservedAt = validDate(source?.controlled_environment_site_confirmation_observed_at)
      ? clean(source.controlled_environment_site_confirmation_observed_at)
      : retained.current_site_confirmation_observed_at || null;
    const siteConfirmationReference = clean(source?.controlled_environment_site_confirmation_observation_reference) || retained.current_site_confirmation_observation_reference || null;
    const siteConfirmationAgeDays = ageDays(siteConfirmationObservedAt, generatedAt);

    const safeRescheduleObservedAt = validDate(source?.controlled_environment_safe_reschedule_observed_at)
      ? clean(source.controlled_environment_safe_reschedule_observed_at)
      : retained.safe_reschedule_observed_at || null;
    const safeRescheduleReference = clean(source?.controlled_environment_safe_reschedule_reference) || retained.safe_reschedule_reference || null;
    const safeRescheduleAgeDays = ageDays(safeRescheduleObservedAt, generatedAt);

    const classificationMatches = Boolean(source) &&
      normalizeToken(source.classification) === normalizeToken(retained.classification) &&
      Boolean(normalizeToken(retained.classification));
    const qualificationCurrent = source ? qualificationEvidenceCurrent(source) : false;
    const routingPracticeCurrent = source ? practiceCurrent(source.controlled_environment_routing_continuity_reference, source.controlled_environment_routing_continuity_evidence_current) : false;
    const siteConfirmationPracticeCurrent = source ? practiceCurrent(source.controlled_environment_site_confirmation_practice_reference, source.controlled_environment_site_confirmation_practice_current) : false;
    const safeReschedulePracticeCurrent = source ? practiceCurrent(source.manual_safe_reschedule_practice_reference, source.manual_safe_reschedule_practice_current) : false;

    const outcomeChanged = Boolean(retainedOutcome && currentOutcome && retainedOutcome !== currentOutcome);
    const routeOutcome = currentOutcome === "routed_to_confirmed_site";
    const safeRescheduleOutcome = currentOutcome === "safe_rescheduled";
    const outcomeStale = outcomeAgeDays === null || outcomeAgeDays > windowDays;
    const siteConfirmationStale = routeOutcome && (siteConfirmationAgeDays === null || siteConfirmationAgeDays > windowDays);
    const safeRescheduleStale = safeRescheduleOutcome && (safeRescheduleAgeDays === null || safeRescheduleAgeDays > windowDays);

    let routingFreshnessState = "not_applicable";
    if (candidatePresent && !source) {
      routingFreshnessState = "freshness_source_unavailable";
    } else if (candidatePresent && (!classificationMatches || !qualificationCurrent || !routingPracticeCurrent || !siteConfirmationPracticeCurrent || !safeReschedulePracticeCurrent)) {
      routingFreshnessState = "service_site_workflow_drift_review_required";
    } else if (candidatePresent && outcomeChanged) {
      routingFreshnessState = "routing_outcome_drift_review_required";
    } else if (candidatePresent && routeOutcome && (!siteReferenceMatches || !siteConfirmationReference || siteConfirmationStale)) {
      routingFreshnessState = "site_confirmation_freshness_review_required";
    } else if (candidatePresent && safeRescheduleOutcome && (!safeRescheduleReference || safeRescheduleStale)) {
      routingFreshnessState = "safe_reschedule_freshness_review_required";
    } else if (candidatePresent && outcomeStale) {
      routingFreshnessState = "stale_routing_outcome_review_required";
    } else if (candidatePresent && routeOutcome && outcomeReference) {
      routingFreshnessState = "route_outcome_current";
    } else if (candidatePresent && safeRescheduleOutcome && outcomeReference) {
      routingFreshnessState = "safe_reschedule_outcome_current";
    } else if (candidatePresent) {
      routingFreshnessState = "predecessor_outcome_review_required";
    }

    const capacity = capacityEvidence(source, expectedSiteReference, generatedAt, windowDays);
    const routingCurrent = CURRENT_ROUTING_STATES.has(routingFreshnessState);
    const capacityReviewCurrent = capacity.state === "bounded_observed_capacity_current";
    const manualReviewRequired = !routingCurrent || ["capacity_site_mismatch_review_required","stale_observed_capacity_review_required","capacity_evidence_invalid_review_required"].includes(capacity.state);

    const missing = [];
    if (candidatePresent && !source) missing.push("current_service_site_workflow_source_evidence");
    if (candidatePresent && !classificationMatches) missing.push("current_service_classification_matches_retained_route");
    if (candidatePresent && !qualificationCurrent) missing.push("current_site_workflow_equipment_product_evidence");
    if (candidatePresent && !routingPracticeCurrent) missing.push("current_routing_continuity_practice");
    if (candidatePresent && !siteConfirmationPracticeCurrent) missing.push("current_site_confirmation_practice");
    if (candidatePresent && !safeReschedulePracticeCurrent) missing.push("current_safe_reschedule_practice");
    if (candidatePresent && !currentOutcome) missing.push("current_controlled_environment_routing_outcome");
    if (candidatePresent && !outcomeObservedAt) missing.push("dated_routing_outcome_observation");
    if (candidatePresent && !outcomeReference) missing.push("attributable_routing_outcome_reference");
    if (candidatePresent && outcomeChanged) missing.push("routing_outcome_matches_retained_build518_observation");
    if (routeOutcome && !siteReferenceMatches) missing.push("qualified_site_reference_matches_current_route");
    if (routeOutcome && !siteConfirmationReference) missing.push("current_site_confirmation_observation_reference");
    if (routeOutcome && siteConfirmationStale) missing.push("fresh_site_confirmation_observation");
    if (safeRescheduleOutcome && !safeRescheduleReference) missing.push("safe_reschedule_observation_reference");
    if (safeRescheduleOutcome && safeRescheduleStale) missing.push("fresh_safe_reschedule_observation");
    if (capacity.state === "capacity_site_mismatch_review_required") missing.push("capacity_observation_site_matches_retained_site");
    if (capacity.state === "stale_observed_capacity_review_required") missing.push("fresh_bounded_capacity_observation");
    if (capacity.state === "capacity_evidence_invalid_review_required") missing.push("complete_bounded_capacity_observation");

    rows.push(Object.freeze({
      entity_type: retained.entity_type,
      code: retained.code,
      classification: retained.classification,
      controlled_environment_candidate_present: candidatePresent,
      retained_routing_outcome_state: retained.outcome_state,
      retained_routing_outcome: retainedOutcome,
      current_routing_outcome: currentOutcome,
      routing_outcome_observed_at: outcomeObservedAt,
      routing_outcome_age_days: outcomeAgeDays,
      routing_outcome_reference: outcomeReference,
      expected_site_reference: expectedSiteReference,
      current_route_site_reference: currentRouteSiteReference,
      qualified_site_reference_matches_current_route: routeOutcome ? siteReferenceMatches : null,
      current_site_confirmation_observed_at: siteConfirmationObservedAt,
      current_site_confirmation_age_days: siteConfirmationAgeDays,
      current_site_confirmation_reference: siteConfirmationReference,
      safe_reschedule_observed_at: safeRescheduleObservedAt,
      safe_reschedule_age_days: safeRescheduleAgeDays,
      safe_reschedule_reference: safeRescheduleReference,
      current_service_classification_matches_retained_route: classificationMatches,
      current_site_workflow_equipment_product_evidence: qualificationCurrent,
      current_routing_continuity_practice: routingPracticeCurrent,
      current_site_confirmation_practice: siteConfirmationPracticeCurrent,
      current_safe_reschedule_practice: safeReschedulePracticeCurrent,
      routing_outcome_changed: outcomeChanged,
      routing_freshness_state: routingFreshnessState,
      routing_freshness_current: routingCurrent,
      capacity_state: capacity.state,
      capacity_review_current: capacityReviewCurrent,
      observed_capacity_jobs: capacity.jobs,
      capacity_observed_at: capacity.observedAt,
      capacity_age_days: capacity.ageDays,
      capacity_observation_reference: capacity.reference,
      capacity_observation_window_days: capacity.windowDays,
      capacity_observation_site_reference: capacity.siteReference,
      capacity_site_matches_retained_site: capacity.siteMatches,
      capacity_is_bounded_historical_observation_only: true,
      capacity_claim_hold: !capacityReviewCurrent,
      manual_review_required: manualReviewRequired,
      service_site_workflow_specific_only: true,
      one_successful_route_establishes_universal_indoor_capability: false,
      one_successful_route_establishes_future_capacity: false,
      observed_capacity_establishes_future_capacity: false,
      automatic_appointment_move_authorized: false,
      automatic_routing_authorized: false,
      automatic_reschedule_authorized: false,
      automatic_capacity_reservation_authorized: false
    }));

    if (candidatePresent && manualReviewRequired) {
      gaps.push(Object.freeze({
        entity_type: retained.entity_type,
        code: retained.code,
        routing_state: routingFreshnessState,
        capacity_state: capacity.state,
        missing: Object.freeze([...new Set(missing)]),
        safe_default: routingCurrent ? "retain_capacity_claim_hold" : "retain_manual_site_confirmation_or_safe_reschedule_review"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    controlled_environment_candidate: rows.filter((row) => row.controlled_environment_candidate_present).length,
    route_outcome_current: rows.filter((row) => row.routing_freshness_state === "route_outcome_current").length,
    safe_reschedule_outcome_current: rows.filter((row) => row.routing_freshness_state === "safe_reschedule_outcome_current").length,
    stale_or_drift_review: rows.filter((row) => row.controlled_environment_candidate_present && !row.routing_freshness_current).length,
    bounded_observed_capacity_current: rows.filter((row) => row.capacity_state === "bounded_observed_capacity_current").length,
    capacity_not_observed: rows.filter((row) => row.capacity_state === "capacity_not_observed").length,
    capacity_review_required: rows.filter((row) => ["capacity_site_mismatch_review_required","stale_observed_capacity_review_required","capacity_evidence_invalid_review_required"].includes(row.capacity_state)).length,
    manual_review_required: rows.filter((row) => row.manual_review_required).length
  });

  return Object.freeze({
    ...base,
    controlled_environment_routing_freshness_capacity_build: 528,
    controlled_environment_routing_freshness_capacity_authority: "controlled_environment_routing_outcome_freshness_capacity_review",
    retained_routing_outcome_authority: "controlled_environment_routing_outcome_evidence_continuity",
    retained_operational_readiness_authority: "controlled_environment_operational_readiness_routing_continuity",
    economics: Object.freeze({
      ...(base.economics || {}),
      controlled_environment_routing_outcome_freshness_capacity_review: Object.freeze({
        status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "current",
        row_count: rows.length,
        gap_count: gaps.length,
        freshness_window_days: windowDays,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        route_outcome_must_remain_service_site_workflow_specific: true,
        current_site_confirmation_required_for_route_current: true,
        safe_reschedule_must_remain_observed_and_fresh: true,
        bounded_capacity_requires_dated_attributable_site_matched_observation: true,
        capacity_is_historical_observation_not_future_commitment: true,
        one_successful_route_establishes_universal_indoor_capability: false,
        one_successful_route_establishes_future_capacity: false,
        automatic_appointment_move_authorized: false,
        automatic_capacity_reservation_authorized: false
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      routing_freshness_may_be_inferred_from_source_or_runtime_green: false,
      stale_route_or_site_confirmation_may_be_treated_as_current: false,
      safe_reschedule_may_be_inferred_from_prior_route: false,
      capacity_may_be_inferred_from_successful_route: false,
      bounded_observed_capacity_proves_future_capacity: false,
      one_successful_route_proves_universal_indoor_capability: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
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

function capacityEvidence(source, expectedSiteReference, generatedAt, freshnessWindowDays) {
  if (!source) return Object.freeze({ state:"capacity_not_observed", jobs:null, observedAt:null, ageDays:null, reference:null, windowDays:null, siteReference:null, siteMatches:null });
  const jobs = finiteInteger(source.controlled_environment_observed_capacity_jobs);
  const observedAt = validDate(source.controlled_environment_capacity_observed_at) ? clean(source.controlled_environment_capacity_observed_at) : null;
  const reference = clean(source.controlled_environment_capacity_observation_reference) || null;
  const windowDays = finiteInteger(source.controlled_environment_capacity_observation_window_days);
  const siteReference = clean(source.controlled_environment_capacity_observation_site_reference) || null;
  const anyEvidence = jobs !== null || Boolean(observedAt || reference || windowDays !== null || siteReference);
  if (!anyEvidence) return Object.freeze({ state:"capacity_not_observed", jobs:null, observedAt:null, ageDays:null, reference:null, windowDays:null, siteReference:null, siteMatches:null });
  const age = ageDays(observedAt, generatedAt);
  const siteMatches = Boolean(expectedSiteReference && siteReference && expectedSiteReference === siteReference);
  if (jobs === null || jobs < 0 || !observedAt || !reference || windowDays === null || windowDays < 1 || windowDays > 90 || !siteReference) {
    return Object.freeze({ state:"capacity_evidence_invalid_review_required", jobs, observedAt, ageDays:age, reference, windowDays, siteReference, siteMatches });
  }
  if (!siteMatches) return Object.freeze({ state:"capacity_site_mismatch_review_required", jobs, observedAt, ageDays:age, reference, windowDays, siteReference, siteMatches });
  if (age === null || age > freshnessWindowDays) return Object.freeze({ state:"stale_observed_capacity_review_required", jobs, observedAt, ageDays:age, reference, windowDays, siteReference, siteMatches });
  return Object.freeze({ state:"bounded_observed_capacity_current", jobs, observedAt, ageDays:age, reference, windowDays, siteReference, siteMatches });
}

function qualificationEvidenceCurrent(source = {}) {
  const values = [
    [source.controlled_environment_site_reference, source.controlled_environment_site_evidence_current, source.controlled_environment_site_suitable],
    [source.controlled_environment_workflow_reference || source.indoor_workflow_reference, source.controlled_environment_workflow_evidence_current, source.controlled_environment_workflow_supported ?? source.indoor_capable_workflow_supported],
    [source.controlled_environment_equipment_reference, source.controlled_environment_equipment_evidence_current, source.controlled_environment_equipment_supported],
    [source.controlled_environment_product_reference, source.controlled_environment_product_evidence_current, source.controlled_environment_product_supported]
  ];
  return values.every(([reference,current,supported]) => Boolean(clean(reference)) && current === true && supported === true);
}
function practiceCurrent(reference,current){ return Boolean(clean(reference)) && current === true; }
function ageDays(value,generatedAt){ if(!validDate(value)) return null; const ms=generatedAt.getTime()-new Date(value).getTime(); return Number.isFinite(ms)?Math.max(0,Math.floor(ms/86400000)):null; }
function finiteInteger(value){ if(value===null||value===undefined||value==="") return null; const number=Number(value); return Number.isInteger(number)?number:null; }
function validDate(value){ const raw=clean(value); return Boolean(raw)&&Number.isFinite(Date.parse(raw)); }
function normalizeToken(value){ return clean(value).toLowerCase().replace(/[-\s]+/g,"_"); }
function sameEntity(source={},target={}){ const type=clean(target.entity_type).toLowerCase(),code=clean(target.code); if(!code)return false; const st=clean(source.entity_type).toLowerCase(),sc=clean(source.code); if(st&&sc)return st===type&&sc===code; if(type==="add_on")return clean(source.add_on_code)===code; if(type==="package")return clean(source.package_code)===code; if(type==="service")return clean(source.service_code)===code; return false; }
function clean(value){ return String(value ?? "").trim(); }
