// Build 537 — Winter Booking & Quote Rule Evidence Integrity Review.
// Read-only integrity verification over Build 527 freshness review and exact winter-rule evidence identity.
import { buildSeasonalCapabilityPublicClaimEvidenceIntegrityReview } from "./seasonal-capability-public-claim-evidence-integrity-review.js";

const CURRENT_STATES = new Set(["controlled_activation_current","retain_hold_current"]);

export function buildWinterBookingQuoteRuleEvidenceIntegrityReview({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null, freshness_window_days = 30
} = {}) {
  const base = buildSeasonalCapabilityPublicClaimEvidenceIntegrityReview({
    economics, fleet, pricing, source_status, generated_at, freshness_window_days
  });
  const freshness = base?.economics?.winter_booking_quote_rule_outcome_freshness_review || {};
  const retainedRows = Array.isArray(freshness.rows) ? freshness.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows : [];
  const rows = [], gaps = [];

  for (const retained of retainedRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, retained)) || null;
    const freshnessState = clean(retained.freshness_state) || "predecessor_outcome_review_required";
    const freshnessCurrent = retained.freshness_review_current === true && CURRENT_STATES.has(freshnessState);

    const currentDecisionReference = clean(source?.winter_rule_controlled_activation_reference) || null;
    const snapshotDecisionReference = clean(source?.winter_rule_outcome_decision_reference) || null;
    const currentOutcomeActionReference = clean(source?.winter_rule_controlled_activation_outcome_reference) || null;
    const snapshotOutcomeActionReference = clean(source?.winter_rule_outcome_owner_action_reference) || null;
    const decisionIdentityRecorded = Boolean(currentDecisionReference && snapshotDecisionReference && currentOutcomeActionReference && snapshotOutcomeActionReference);
    const decisionIdentityMatches = decisionIdentityRecorded &&
      currentDecisionReference === snapshotDecisionReference &&
      currentOutcomeActionReference === snapshotOutcomeActionReference;

    const currentClassification = clean(source?.classification) || null;
    const snapshotClassification = clean(source?.winter_rule_outcome_service_classification) || null;
    const classificationIdentityRecorded = Boolean(currentClassification && snapshotClassification);
    const classificationMatches = classificationIdentityRecorded &&
      normalizeToken(currentClassification) === normalizeToken(snapshotClassification) &&
      normalizeToken(currentClassification) === normalizeToken(retained.current_service_classification || retained.retained_service_classification);

    const currentWording = clean(retained.current_customer_transparency_wording) || clean(source?.winter_rule_outcome_customer_transparency_wording) || null;
    const snapshotWording = clean(source?.winter_rule_outcome_customer_transparency_wording_snapshot) || null;
    const wordingIdentityRecorded = Boolean(currentWording && snapshotWording);
    const wordingMatches = wordingIdentityRecorded && textMatches(currentWording, snapshotWording);

    const snapshotBookingRule = clean(source?.winter_rule_outcome_booking_rule_snapshot) || null;
    const snapshotQuoteRule = clean(source?.winter_rule_outcome_quote_rule_snapshot) || null;
    const ruleIdentityRecorded = Boolean(snapshotBookingRule && snapshotQuoteRule);
    const ruleIdentityMatches = ruleIdentityRecorded &&
      normalizeToken(snapshotBookingRule) === normalizeToken(retained.retained_booking_rule_candidate) &&
      normalizeToken(snapshotQuoteRule) === normalizeToken(retained.retained_quote_rule_candidate);

    const currentRuntimeReference = clean(source?.winter_rule_runtime_revalidation_reference) || clean(retained.runtime_revalidation_reference) || null;
    const snapshotRuntimeReference = clean(source?.winter_rule_outcome_runtime_revalidation_reference) || null;
    const snapshotAvailabilityAuthority = clean(source?.winter_rule_outcome_availability_authority) || null;
    const snapshotCheckoutAuthority = clean(source?.winter_rule_outcome_checkout_collision_authority) || null;
    const runtimeIdentityRecorded = Boolean(currentRuntimeReference && snapshotRuntimeReference && snapshotAvailabilityAuthority && snapshotCheckoutAuthority);
    const runtimeIdentityMatches = runtimeIdentityRecorded &&
      currentRuntimeReference === snapshotRuntimeReference &&
      snapshotAvailabilityAuthority === "/api/availability" &&
      snapshotCheckoutAuthority === "checkout_server_side_collision_revalidation";
    const runtimeSafetyCurrent = retained.availability_revalidated === true &&
      retained.checkout_collision_revalidated === true &&
      Boolean(currentRuntimeReference);

    let integrityState = "integrity_current";
    if (!source) integrityState = "integrity_source_unavailable";
    else if (!freshnessCurrent) integrityState = "freshness_window_integrity_review_required";
    else if (!decisionIdentityRecorded) integrityState = "decision_trace_identity_review_required";
    else if (!decisionIdentityMatches) integrityState = "decision_trace_identity_drift_review_required";
    else if (!classificationIdentityRecorded || !classificationMatches) integrityState = "service_classification_integrity_review_required";
    else if (!wordingIdentityRecorded || !wordingMatches) integrityState = "customer_transparency_integrity_review_required";
    else if (!ruleIdentityRecorded || !ruleIdentityMatches) integrityState = "booking_quote_rule_integrity_review_required";
    else if (!runtimeIdentityRecorded) integrityState = "runtime_safety_identity_review_required";
    else if (!runtimeIdentityMatches) integrityState = "runtime_safety_identity_drift_review_required";
    else if (!runtimeSafetyCurrent) integrityState = "runtime_safety_integrity_review_required";

    const integrityCurrent = integrityState === "integrity_current";
    const missing = [];
    if (!source) missing.push("current_service_specific_winter_rule_evidence");
    if (!freshnessCurrent) missing.push("current_build527_freshness_evidence");
    if (!currentDecisionReference || !currentOutcomeActionReference) missing.push("current_decision_and_outcome_action_identity");
    if (!snapshotDecisionReference || !snapshotOutcomeActionReference) missing.push("outcome_time_decision_and_action_identity_snapshot");
    if (decisionIdentityRecorded && !decisionIdentityMatches) missing.push("decision_trace_identity_matches_outcome_snapshot");
    if (!snapshotClassification) missing.push("outcome_time_service_classification_snapshot");
    if (classificationIdentityRecorded && !classificationMatches) missing.push("service_classification_matches_outcome_snapshot");
    if (!snapshotWording) missing.push("outcome_time_customer_transparency_wording_snapshot");
    if (wordingIdentityRecorded && !wordingMatches) missing.push("customer_transparency_wording_matches_outcome_snapshot");
    if (!snapshotBookingRule || !snapshotQuoteRule) missing.push("outcome_time_booking_quote_rule_pair_snapshot");
    if (ruleIdentityRecorded && !ruleIdentityMatches) missing.push("booking_quote_rule_pair_matches_retained_decision_trace");
    if (!snapshotRuntimeReference) missing.push("outcome_time_runtime_revalidation_reference_snapshot");
    if (!snapshotAvailabilityAuthority) missing.push("outcome_time_api_availability_authority_snapshot");
    if (!snapshotCheckoutAuthority) missing.push("outcome_time_checkout_collision_authority_snapshot");
    if (runtimeIdentityRecorded && !runtimeIdentityMatches) missing.push("runtime_safety_identity_matches_outcome_snapshot");
    if (!runtimeSafetyCurrent) missing.push("current_api_availability_and_checkout_collision_revalidation");

    rows.push(Object.freeze({
      entity_type: retained.entity_type, code: retained.code,
      retained_build527_freshness_state: freshnessState,
      retained_build527_freshness_review_current: freshnessCurrent,
      current_controlled_activation_outcome: retained.current_controlled_activation_outcome,
      current_decision_reference: currentDecisionReference,
      outcome_snapshot_decision_reference: snapshotDecisionReference,
      current_outcome_action_reference: currentOutcomeActionReference,
      outcome_snapshot_owner_action_reference: snapshotOutcomeActionReference,
      decision_trace_identity_recorded: decisionIdentityRecorded,
      decision_trace_identity_matches_outcome_snapshot: decisionIdentityMatches,
      current_service_classification: currentClassification,
      outcome_snapshot_service_classification: snapshotClassification,
      service_classification_integrity_current: classificationMatches,
      current_customer_transparency_wording: currentWording,
      outcome_snapshot_customer_transparency_wording: snapshotWording,
      customer_transparency_integrity_current: wordingMatches,
      retained_booking_rule_candidate: retained.retained_booking_rule_candidate || null,
      retained_quote_rule_candidate: retained.retained_quote_rule_candidate || null,
      outcome_snapshot_booking_rule: snapshotBookingRule,
      outcome_snapshot_quote_rule: snapshotQuoteRule,
      booking_quote_rule_integrity_current: ruleIdentityMatches,
      availability_revalidated: retained.availability_revalidated === true,
      checkout_collision_revalidated: retained.checkout_collision_revalidated === true,
      current_runtime_revalidation_reference: currentRuntimeReference,
      outcome_snapshot_runtime_revalidation_reference: snapshotRuntimeReference,
      outcome_snapshot_availability_authority: snapshotAvailabilityAuthority,
      outcome_snapshot_checkout_collision_authority: snapshotCheckoutAuthority,
      runtime_safety_identity_recorded: runtimeIdentityRecorded,
      runtime_safety_identity_matches_outcome_snapshot: runtimeIdentityMatches,
      runtime_safety_integrity_current: runtimeSafetyCurrent,
      integrity_state: integrityState,
      evidence_integrity_current: integrityCurrent,
      manual_review_required: !integrityCurrent,
      weather_ineligible_excluded_from_ordinary_conversion_interpretation: true,
      broad_winter_availability_authorized: false,
      automatic_rule_activation_authorized: false,
      automatic_booking_availability_change_authorized: false,
      automatic_quote_rule_change_authorized: false,
      automatic_checkout_mutation_authorized: false,
      automatic_hold_narrowing_authorized: false
    }));
    if (!integrityCurrent) gaps.push(Object.freeze({
      entity_type: retained.entity_type, code: retained.code, state: integrityState,
      missing: Object.freeze([...new Set(missing)]), safe_default: "retain_winter_booking_quote_hold"
    }));
  }

  const counts = Object.freeze({
    total: rows.length,
    integrity_current: rows.filter((row) => row.evidence_integrity_current).length,
    decision_trace_identity_review: rows.filter((row) => row.integrity_state.startsWith("decision_trace_identity_")).length,
    service_classification_review: rows.filter((row) => row.integrity_state === "service_classification_integrity_review_required").length,
    customer_transparency_review: rows.filter((row) => row.integrity_state === "customer_transparency_integrity_review_required").length,
    booking_quote_rule_review: rows.filter((row) => row.integrity_state === "booking_quote_rule_integrity_review_required").length,
    runtime_safety_identity_review: rows.filter((row) => row.integrity_state.startsWith("runtime_safety_identity_")).length,
    runtime_safety_review: rows.filter((row) => row.integrity_state === "runtime_safety_integrity_review_required").length,
    freshness_window_review: rows.filter((row) => row.integrity_state === "freshness_window_integrity_review_required").length,
    review_required: rows.filter((row) => row.manual_review_required).length
  });

  return Object.freeze({
    ...base,
    winter_booking_quote_rule_integrity_build: 537,
    winter_booking_quote_rule_integrity_authority: "winter_booking_quote_rule_evidence_integrity_review",
    retained_winter_rule_freshness_authority: "winter_booking_quote_rule_outcome_freshness_review",
    retained_controlled_activation_outcome_authority: "winter_booking_quote_rule_controlled_activation_outcome_continuity",
    retained_controlled_activation_decision_authority: "winter_booking_quote_rule_controlled_activation_decision",
    retained_availability_authority: "/api/availability",
    retained_checkout_collision_authority: "checkout_server_side_collision_revalidation",
    economics: Object.freeze({ ...(base.economics || {}), winter_booking_quote_rule_evidence_integrity_review: Object.freeze({
      status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "current",
      row_count: rows.length, gap_count: gaps.length, counts,
      rows: Object.freeze(rows), gaps: Object.freeze(gaps),
      exact_decision_trace_identity_required: true,
      service_classification_integrity_required: true,
      customer_transparency_wording_integrity_required: true,
      booking_quote_rule_pair_integrity_required: true,
      availability_and_checkout_collision_identity_required: true,
      weather_ineligible_sessions_excluded_from_ordinary_conversion_interpretation: true,
      broad_winter_availability_authorized: false,
      automatic_rule_activation_authorized: false,
      booking_availability_mutation_authorized: false,
      quote_rule_mutation_authorized: false,
      checkout_mutation_authorized: false,
      canonical_hold_mutation_authorized: false
    })}),
    truth_boundary: Object.freeze({ ...(base.truth_boundary || {}),
      winter_rule_identity_may_be_inferred_from_source_or_runtime_green: false,
      missing_outcome_identity_snapshot_may_be_treated_as_current: false,
      availability_endpoint_green_proves_weather_eligibility: false,
      checkout_collision_revalidation_proves_weather_eligibility: false,
      weather_ineligible_session_is_conversion_failure: false,
      broad_winter_availability_may_be_inferred: false
    }),
    boundaries: Object.freeze({ ...(base.boundaries || {}), read_only: true,
      automatic_rule_activation_allowed: false, automatic_booking_availability_change_allowed: false,
      automatic_quote_rule_change_allowed: false, automatic_checkout_mutation_allowed: false,
      automatic_customer_message_allowed: false, automatic_public_winter_claim_allowed: false,
      automatic_price_or_discount_change_allowed: false, canonical_hold_mutation_allowed: false,
      schema_mutation_allowed: false, storage_mutation_allowed: false, persistent_telemetry_allowed: false,
      permanent_polling: false
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
function normalizeToken(value) { return clean(value).replace(/[\s-]+/g,"_").toLowerCase(); }
function normalizeText(value) { return clean(value).replace(/\s+/g," ").toLowerCase(); }
function textMatches(left,right) { const a=normalizeText(left),b=normalizeText(right); return Boolean(a && b && a===b); }
function clean(value) { return String(value ?? "").trim(); }
