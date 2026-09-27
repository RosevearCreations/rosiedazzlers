// Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity.
// Read-only outcome continuity over retained Build 507 controlled-activation decisions.
// Actual activation is observed only from explicit manual outcome evidence plus current runtime revalidation.
import { buildSeasonalCapabilityPublicClaimDecisionOutcomeContinuity } from "./seasonal-capability-public-claim-decision-outcome-continuity.js";
import { buildWinterBookingQuoteRuleControlledActivationDecision } from "./winter-booking-quote-rule-controlled-activation-decision.js";

const OUTCOMES = new Set(["activated","retain_hold"]);

export function buildWinterBookingQuoteRuleControlledActivationOutcomeContinuity({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildSeasonalCapabilityPublicClaimDecisionOutcomeContinuity({
    economics, fleet, pricing, source_status, generated_at
  });
  const retainedReport = buildWinterBookingQuoteRuleControlledActivationDecision({
    economics, fleet, pricing, source_status, generated_at
  });
  const retainedDecision = retainedReport?.economics?.winter_booking_quote_controlled_activation_decision || {};
  const retainedRows = Array.isArray(retainedDecision.rows) ? retainedDecision.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];

  const rows = [];
  const gaps = [];

  for (const retained of retainedRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, retained)) || {};
    const outcome = outcomeEvidence(source);
    const runtime = runtimeEvidence(source);
    const currentEvidence = source.capability_evidence_current === true;
    const classificationMatches =
      normalizeToken(source.classification) === normalizeToken(retained.classification) &&
      Boolean(normalizeToken(retained.classification));
    const wordingMatches = textMatches(
      runtime.customer_transparency_wording,
      retained.customer_limitation_text
    );
    const bookingRuleMatches = textMatches(runtime.booking_rule, retained.booking_rule_candidate);
    const quoteRuleMatches = textMatches(runtime.quote_rule, retained.quote_rule_candidate);
    const retainedReady = retained.controlled_activation_decision_ready === true;
    const retainedHold = retained.controlled_activation_decision_state === "owner_hold";
    const decisionTraceable = retainedReady || retainedHold;
    const runtimeRevalidated =
      runtime.availability_revalidated &&
      runtime.checkout_collision_revalidated &&
      Boolean(runtime.revalidated_at) &&
      Boolean(runtime.reference);

    let outcomeState = "outcome_owner_action_required";
    let outcomeObserved = false;

    if (
      outcome.valid &&
      outcome.kind === "activated" &&
      retainedReady &&
      currentEvidence &&
      classificationMatches &&
      wordingMatches &&
      bookingRuleMatches &&
      quoteRuleMatches &&
      runtimeRevalidated
    ) {
      outcomeState = "controlled_activation_observed";
      outcomeObserved = true;
    } else if (
      outcome.valid &&
      outcome.kind === "retain_hold" &&
      decisionTraceable &&
      currentEvidence &&
      classificationMatches &&
      wordingMatches &&
      runtimeRevalidated
    ) {
      outcomeState = "retain_hold_observed";
      outcomeObserved = true;
    } else if (outcome.valid && outcome.kind === "activated") {
      outcomeState = "controlled_activation_evidence_conflict";
    } else if (outcome.valid && outcome.kind === "retain_hold") {
      outcomeState = "retain_hold_evidence_conflict";
    }

    const missing = [];
    if (!outcome.kind) missing.push("explicit_controlled_activation_outcome");
    if (!outcome.observed_at) missing.push("dated_controlled_activation_outcome_observation");
    if (!outcome.reference) missing.push("attributable_controlled_activation_outcome_reference");
    if (!currentEvidence) missing.push("current_service_specific_capability_evidence");
    if (!classificationMatches) missing.push("current_service_classification_matches_build507");
    if (!retained.customer_limitation_text) missing.push("retained_customer_transparency_wording");
    if (!runtime.customer_transparency_wording) missing.push("observed_customer_transparency_wording");
    if (runtime.customer_transparency_wording && retained.customer_limitation_text && !wordingMatches) {
      missing.push("customer_transparency_wording_matches_build507");
    }
    if (!runtime.availability_revalidated) missing.push("api_availability_revalidated");
    if (!runtime.checkout_collision_revalidated) missing.push("checkout_collision_revalidated");
    if (!runtime.revalidated_at) missing.push("dated_runtime_revalidation");
    if (!runtime.reference) missing.push("attributable_runtime_revalidation_reference");

    if (outcome.kind === "activated") {
      if (!retainedReady) missing.push("build507_controlled_activation_decision_ready");
      if (!runtime.booking_rule) missing.push("observed_applied_booking_rule");
      if (!runtime.quote_rule) missing.push("observed_applied_quote_rule");
      if (runtime.booking_rule && retained.booking_rule_candidate && !bookingRuleMatches) {
        missing.push("applied_booking_rule_matches_build507");
      }
      if (runtime.quote_rule && retained.quote_rule_candidate && !quoteRuleMatches) {
        missing.push("applied_quote_rule_matches_build507");
      }
    } else if (outcome.kind === "retain_hold" && !decisionTraceable) {
      missing.push("build507_decision_traceability");
    }

    rows.push(Object.freeze({
      entity_type: retained.entity_type,
      code: retained.code,
      classification: retained.classification,
      current_service_classification_matches_build507: classificationMatches,
      capability_evidence_current: currentEvidence,
      retained_controlled_activation_decision_state: retained.controlled_activation_decision_state,
      retained_controlled_activation_decision_ready: retainedReady,
      retained_booking_rule_candidate: retained.booking_rule_candidate || null,
      retained_quote_rule_candidate: retained.quote_rule_candidate || null,
      retained_customer_limitation_text: retained.customer_limitation_text || null,
      source_owned_temperature_limit_text: retained.source_owned_temperature_limit_text || null,
      controlled_activation_outcome: outcome.kind,
      controlled_activation_outcome_observed_at: outcome.observed_at,
      controlled_activation_outcome_reference: outcome.reference,
      observed_applied_booking_rule: runtime.booking_rule,
      observed_applied_quote_rule: runtime.quote_rule,
      observed_customer_transparency_wording: runtime.customer_transparency_wording,
      customer_transparency_wording_matches_build507: wordingMatches,
      applied_booking_rule_matches_build507: bookingRuleMatches,
      applied_quote_rule_matches_build507: quoteRuleMatches,
      availability_revalidated: runtime.availability_revalidated,
      checkout_collision_revalidated: runtime.checkout_collision_revalidated,
      runtime_revalidated_at: runtime.revalidated_at,
      runtime_revalidation_reference: runtime.reference,
      outcome_state: outcomeState,
      controlled_activation_observed: outcomeState === "controlled_activation_observed",
      retain_hold_observed: outcomeState === "retain_hold_observed",
      controlled_activation_state_observed_not_inferred: true,
      availability_authority: "/api/availability",
      checkout_collision_revalidation_authority: "checkout_server_side_collision_revalidation",
      weather_ineligible_excluded_from_ordinary_conversion_interpretation: true,
      automatic_rule_activation_authorized: false,
      automatic_booking_availability_change_authorized: false,
      automatic_quote_rule_change_authorized: false,
      broad_winter_availability_authorized: false
    }));

    if (!outcomeObserved) {
      gaps.push(Object.freeze({
        entity_type: retained.entity_type,
        code: retained.code,
        state: outcomeState,
        missing: Object.freeze([...new Set(missing)]),
        safe_default: "retain_winter_booking_quote_hold"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    controlled_activation_observed: rows.filter((row) => row.controlled_activation_observed).length,
    retain_hold_observed: rows.filter((row) => row.retain_hold_observed).length,
    activation_evidence_conflict: rows.filter((row) => row.outcome_state === "controlled_activation_evidence_conflict").length,
    retain_hold_evidence_conflict: rows.filter((row) => row.outcome_state === "retain_hold_evidence_conflict").length,
    owner_action_required: rows.filter((row) => row.outcome_state === "outcome_owner_action_required").length
  });

  return Object.freeze({
    ...base,
    winter_booking_quote_controlled_activation_outcome_build: 517,
    winter_booking_quote_controlled_activation_outcome_authority: "winter_booking_quote_rule_controlled_activation_outcome_continuity",
    retained_controlled_activation_decision_authority: "winter_booking_quote_rule_controlled_activation_decision",
    retained_availability_authority: "/api/availability",
    retained_checkout_collision_authority: "checkout_server_side_collision_revalidation",
    economics: Object.freeze({
      ...(base.economics || {}),
      winter_booking_quote_controlled_activation_decision: retainedDecision,
      winter_booking_quote_controlled_activation_outcome_continuity: Object.freeze({
        status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "observed",
        row_count: rows.length,
        gap_count: gaps.length,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        allowed_outcomes: Object.freeze([...OUTCOMES]),
        activation_must_be_observed: true,
        retained_hold_must_be_explicit: true,
        current_service_classification_required: true,
        customer_transparency_wording_match_required: true,
        availability_revalidation_required: true,
        checkout_collision_revalidation_required: true,
        broad_winter_availability_authorized: false,
        automatic_rule_activation_authorized: false
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      controlled_activation_decision_ready_is_live_activation: false,
      controlled_activation_state_may_be_inferred_from_decision_readiness: false,
      controlled_activation_state_may_be_inferred_from_source_or_runtime_green: false,
      missing_activation_evidence_may_be_inferred_as_no_action: false,
      weather_ineligible_session_is_conversion_failure: false,
      broad_winter_availability_inferred: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
      read_only: true,
      automatic_rule_activation_allowed: false,
      automatic_booking_availability_change_allowed: false,
      automatic_quote_rule_change_allowed: false,
      automatic_checkout_mutation_allowed: false,
      automatic_customer_message_allowed: false,
      automatic_public_winter_claim_allowed: false,
      automatic_price_or_discount_change_allowed: false,
      canonical_hold_mutation_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function outcomeEvidence(source = {}) {
  const kind = clean(source.winter_rule_controlled_activation_outcome).toLowerCase();
  const observedAt = validDate(source.winter_rule_controlled_activation_outcome_observed_at)
    ? clean(source.winter_rule_controlled_activation_outcome_observed_at)
    : null;
  const reference = clean(source.winter_rule_controlled_activation_outcome_reference) || null;
  const validKind = OUTCOMES.has(kind);
  return Object.freeze({
    kind: validKind ? kind : null,
    observed_at: observedAt,
    reference,
    valid: validKind && Boolean(observedAt) && Boolean(reference)
  });
}

function runtimeEvidence(source = {}) {
  return Object.freeze({
    booking_rule: clean(source.winter_rule_applied_booking_rule) || null,
    quote_rule: clean(source.winter_rule_applied_quote_rule) || null,
    customer_transparency_wording: clean(source.winter_rule_outcome_customer_transparency_wording) || null,
    availability_revalidated: source.winter_rule_availability_revalidated === true,
    checkout_collision_revalidated: source.winter_rule_checkout_collision_revalidated === true,
    revalidated_at: validDate(source.winter_rule_runtime_revalidated_at)
      ? clean(source.winter_rule_runtime_revalidated_at)
      : null,
    reference: clean(source.winter_rule_runtime_revalidation_reference) || null
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
function validDate(value) {
  const raw = clean(value);
  return Boolean(raw) && Number.isFinite(Date.parse(raw));
}
function normalizeToken(value) { return clean(value).toLowerCase().replace(/[-\s]+/g, "_"); }
function normalizeText(value) { return clean(value).replace(/\s+/g, " ").toLowerCase(); }
function textMatches(left, right) {
  const a = normalizeText(left);
  const b = normalizeText(right);
  return Boolean(a && b && a === b);
}
function clean(value) { return String(value ?? "").trim(); }
