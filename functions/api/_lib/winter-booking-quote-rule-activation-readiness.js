// Build 497 — Winter Booking & Quote Rule Activation Readiness.
// Read-only readiness preparation over the retained Build 496 owner/public-claim decision authority.
import { buildSeasonalCapabilityOwnerReviewPublicClaimDecision } from "./seasonal-capability-owner-review-public-claim-decision.js";

const ACTIVATION_DECISIONS = new Set(["approve_activation_readiness_review","hold_activation"]);
const BOOKING_RULES = new Set(["allow_with_current_conditions_check","temperature_limited_current_conditions_check","controlled_environment_only","hold_winter_booking"]);
const QUOTE_RULES = new Set(["quote_with_current_conditions_disclosure","quote_with_source_owned_temperature_limit","quote_for_controlled_environment_only","hold_winter_quote"]);

export function buildWinterBookingQuoteRuleActivationReadiness({ economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null } = {}) {
  const base = buildSeasonalCapabilityOwnerReviewPublicClaimDecision({ economics, fleet, pricing, source_status, generated_at });
  const ownerReview = base?.economics?.seasonal_owner_review_public_claim || {};
  const ownerRows = Array.isArray(ownerReview.rows) ? ownerReview.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows) ? economics.seasonal_operability_evidence.rows : [];
  const rows = [];
  const gaps = [];

  for (const row of ownerRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, row)) || {};
    const review = activationReview(source);
    const bookingRule = normalizeRule(source.booking_rule_candidate, BOOKING_RULES);
    const quoteRule = normalizeRule(source.quote_rule_candidate, QUOTE_RULES);
    const ownerCapabilityReady = row.publication_review_ready === true;
    const rulePairSupported = rulePairMatchesClassification(row.classification, bookingRule, quoteRule);
    const readinessReady = ownerCapabilityReady && review.valid && review.decision === "approve_activation_readiness_review" && rulePairSupported;

    let activationState = "owner_review_required";
    if (review.valid && review.decision === "hold_activation") activationState = "owner_hold";
    else if (readinessReady) activationState = "activation_readiness_review_ready";

    const missing = [];
    if (!ownerCapabilityReady) missing.push("build496_owner_capability_public_claim_review");
    if (!review.valid) {
      if (!review.decision) missing.push("explicit_activation_readiness_owner_decision");
      if (!review.reviewed_at) missing.push("dated_activation_readiness_review");
      if (!review.reference) missing.push("attributable_activation_readiness_reference");
    }
    if (!bookingRule) missing.push("service_specific_booking_rule_candidate");
    if (!quoteRule) missing.push("service_specific_quote_rule_candidate");
    if (bookingRule && quoteRule && !rulePairSupported) missing.push("classification_compatible_rule_pair");

    rows.push(Object.freeze({
      entity_type: row.entity_type,
      code: row.code,
      classification: row.classification,
      retained_public_claim_decision_state: row.decision_state,
      retained_publication_review_ready: ownerCapabilityReady,
      source_owned_temperature_limit_text: row.source_owned_temperature_limit_text || null,
      proposed_service_specific_public_wording: row.proposed_service_specific_public_wording || null,
      activation_readiness_owner_decision: review.decision,
      activation_reviewed_at: review.reviewed_at,
      activation_review_reference: review.reference,
      booking_rule_candidate: bookingRule,
      quote_rule_candidate: quoteRule,
      activation_state: activationState,
      activation_readiness_review_ready: readinessReady,
      current_availability_authority: "/api/availability",
      checkout_collision_revalidation_authority: "checkout_server_side_collision_revalidation",
      weather_ineligible_excluded_from_ordinary_conversion_interpretation: true,
      automatic_activation_authorized: false,
      automatic_booking_rule_change_authorized: false,
      automatic_quote_rule_change_authorized: false,
      broad_winter_availability_authorized: false
    }));

    if (missing.length) {
      gaps.push(Object.freeze({
        entity_type: row.entity_type,
        code: row.code,
        missing: Object.freeze(missing),
        safe_default: activationState === "owner_hold" ? "retain_owner_hold" : "retain_winter_booking_quote_hold"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    activation_readiness_review_ready: rows.filter((row) => row.activation_readiness_review_ready).length,
    owner_hold: rows.filter((row) => row.activation_state === "owner_hold").length,
    owner_review_required: rows.filter((row) => row.activation_state === "owner_review_required").length
  });

  return Object.freeze({
    ...base,
    winter_booking_quote_activation_readiness_build: 497,
    winter_booking_quote_activation_readiness_authority: "winter_booking_quote_rule_activation_readiness",
    retained_owner_review_authority: "seasonal_capability_owner_review_public_claim_decision",
    retained_availability_authority: "/api/availability",
    retained_checkout_collision_authority: "checkout_server_side_collision_revalidation",
    economics: Object.freeze({
      ...(base.economics || {}),
      winter_booking_quote_activation_readiness: Object.freeze({
        status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "prepared",
        row_count: rows.length,
        gap_count: gaps.length,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        allowed_owner_decisions: Object.freeze([...ACTIVATION_DECISIONS]),
        automatic_activation_authorized: false,
        automatic_booking_rule_change_authorized: false,
        automatic_quote_rule_change_authorized: false,
        broad_winter_availability_authorized: false,
        current_availability_and_checkout_collision_revalidation_remain_authoritative: true,
        weather_ineligible_sessions_excluded_from_ordinary_conversion_interpretation: true
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      activation_readiness_review_ready_is_live_activation: false,
      publication_review_ready_is_booking_rule_activation: false,
      availability_endpoint_green_proves_weather_eligibility: false,
      checkout_collision_revalidation_proves_weather_eligibility: false,
      weather_ineligible_session_is_conversion_failure: false,
      broad_winter_availability_inferred: false,
      missing_activation_review_may_be_inferred: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
      read_only: true,
      automatic_activation_allowed: false,
      automatic_booking_rule_change_allowed: false,
      automatic_quote_rule_change_allowed: false,
      automatic_availability_mutation_allowed: false,
      automatic_checkout_mutation_allowed: false,
      automatic_public_winter_claim_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function activationReview(source = {}) {
  const decision = clean(source.activation_readiness_owner_decision).toLowerCase();
  const reviewedAt = validDate(source.activation_reviewed_at) ? clean(source.activation_reviewed_at) : null;
  const reference = clean(source.activation_review_reference) || null;
  const validDecision = ACTIVATION_DECISIONS.has(decision);
  return Object.freeze({ decision: validDecision ? decision : null, reviewed_at: reviewedAt, reference, valid: validDecision && Boolean(reviewedAt) && Boolean(reference) });
}

function rulePairMatchesClassification(classification, bookingRule, quoteRule) {
  const cls = clean(classification).toLowerCase();
  if (!bookingRule || !quoteRule) return false;
  if (bookingRule === "hold_winter_booking" || quoteRule === "hold_winter_quote") return bookingRule === "hold_winter_booking" && quoteRule === "hold_winter_quote";
  if (cls === "cold_snap_capable") return bookingRule === "allow_with_current_conditions_check" && quoteRule === "quote_with_current_conditions_disclosure";
  if (cls === "temperature_limited_outdoor") return bookingRule === "temperature_limited_current_conditions_check" && quoteRule === "quote_with_source_owned_temperature_limit";
  if (cls === "controlled_environment_required") return bookingRule === "controlled_environment_only" && quoteRule === "quote_for_controlled_environment_only";
  return false;
}
function normalizeRule(value, allowed) { const normalized=clean(value).toLowerCase(); return allowed.has(normalized)?normalized:null; }
function sameEntity(source = {}, target = {}) {
  const type=clean(target.entity_type).toLowerCase(), code=clean(target.code);
  if(!code) return false;
  if(type==="add_on") return clean(source.add_on_code)===code;
  if(type==="package") return clean(source.package_code)===code;
  if(type==="service") return clean(source.service_code)===code;
  return false;
}
function validDate(value){ const raw=clean(value); return Boolean(raw)&&Number.isFinite(Date.parse(raw)); }
function clean(value){ return String(value ?? "").trim(); }
