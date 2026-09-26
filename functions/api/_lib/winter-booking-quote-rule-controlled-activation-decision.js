// Build 507 — Winter Booking & Quote Rule Controlled Activation Decision.
// Read-only final owner decision package over retained seasonal, transparency and booking/quote readiness authorities.
import { buildSeasonalCapabilityPublicClaimActivationDecision } from "./seasonal-capability-public-claim-activation-decision.js";

const CONTROLLED_ACTIVATION_DECISIONS = new Set(["approve_controlled_activation","hold_controlled_activation"]);

export function buildWinterBookingQuoteRuleControlledActivationDecision({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildSeasonalCapabilityPublicClaimActivationDecision({
    economics, fleet, pricing, source_status, generated_at
  });
  const readiness = base?.economics?.winter_booking_quote_activation_readiness || {};
  const readinessRows = Array.isArray(readiness.rows) ? readiness.rows : [];
  const eligibilityRows = Array.isArray(base?.economics?.winter_booking_eligibility?.rows)
    ? base.economics.winter_booking_eligibility.rows
    : [];
  const publicClaimRows = Array.isArray(base?.economics?.seasonal_public_claim_activation_decision?.rows)
    ? base.economics.seasonal_public_claim_activation_decision.rows
    : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];

  const rows = [];
  const gaps = [];

  for (const row of readinessRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, row)) || {};
    const eligibility = eligibilityRows.find((candidate) => sameEntity(candidate, row)) || {};
    const publicClaim = publicClaimRows.find((candidate) => sameEntity(candidate, row)) || {};
    const activation = controlledActivationReview(source);
    const retainedReady = row.activation_readiness_review_ready === true;
    const customerLimitationText = clean(eligibility.customer_limitation_text) || null;
    const transparencyConfirmed = source.winter_rule_customer_transparency_confirmed === true;
    const rulePairPresent = Boolean(clean(row.booking_rule_candidate)) && Boolean(clean(row.quote_rule_candidate));

    const decisionReady =
      retainedReady &&
      rulePairPresent &&
      Boolean(customerLimitationText) &&
      transparencyConfirmed &&
      activation.valid &&
      activation.decision === "approve_controlled_activation";

    let decisionState = "controlled_activation_owner_review_required";
    if (activation.valid && activation.decision === "hold_controlled_activation") {
      decisionState = "owner_hold";
    } else if (decisionReady) {
      decisionState = "controlled_activation_decision_ready";
    }

    const missing = [];
    if (!retainedReady) missing.push("build497_activation_readiness_review_ready");
    if (!rulePairPresent) missing.push("service_specific_booking_quote_rule_pair");
    if (!customerLimitationText) missing.push("retained_customer_transparency_wording");
    if (!transparencyConfirmed) missing.push("explicit_customer_transparency_confirmation");
    if (!activation.valid) {
      if (!activation.decision) missing.push("explicit_controlled_activation_owner_decision");
      if (!activation.reviewed_at) missing.push("dated_controlled_activation_review");
      if (!activation.reference) missing.push("attributable_controlled_activation_reference");
    }

    rows.push(Object.freeze({
      entity_type: row.entity_type,
      code: row.code,
      classification: row.classification,
      retained_activation_state: row.activation_state,
      retained_activation_readiness_review_ready: retainedReady,
      booking_rule_candidate: row.booking_rule_candidate || null,
      quote_rule_candidate: row.quote_rule_candidate || null,
      source_owned_temperature_limit_text: row.source_owned_temperature_limit_text || null,
      customer_limitation_text: customerLimitationText,
      winter_rule_customer_transparency_confirmed: transparencyConfirmed,
      retained_public_claim_activation_state: publicClaim.activation_decision_state || null,
      controlled_activation_owner_decision: activation.decision,
      controlled_activation_reviewed_at: activation.reviewed_at,
      controlled_activation_reference: activation.reference,
      controlled_activation_decision_state: decisionState,
      controlled_activation_decision_ready: decisionReady,
      current_availability_authority: "/api/availability",
      checkout_collision_revalidation_authority: "checkout_server_side_collision_revalidation",
      manual_rule_activation_required: true,
      automatic_rule_activation_authorized: false,
      automatic_booking_availability_change_authorized: false,
      automatic_quote_rule_change_authorized: false,
      broad_winter_availability_authorized: false,
      weather_ineligible_excluded_from_ordinary_conversion_interpretation: true
    }));

    if (missing.length) {
      gaps.push(Object.freeze({
        entity_type: row.entity_type,
        code: row.code,
        missing: Object.freeze(missing),
        safe_default: decisionState === "owner_hold"
          ? "retain_owner_hold"
          : "retain_winter_booking_quote_hold"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    controlled_activation_decision_ready: rows.filter((row) => row.controlled_activation_decision_ready).length,
    owner_hold: rows.filter((row) => row.controlled_activation_decision_state === "owner_hold").length,
    owner_review_required: rows.filter((row) => row.controlled_activation_decision_state === "controlled_activation_owner_review_required").length
  });

  return Object.freeze({
    ...base,
    winter_booking_quote_controlled_activation_build: 507,
    winter_booking_quote_controlled_activation_authority: "winter_booking_quote_rule_controlled_activation_decision",
    retained_activation_readiness_authority: "winter_booking_quote_rule_activation_readiness",
    retained_customer_transparency_authority: "winter_booking_eligibility_customer_transparency",
    retained_availability_authority: "/api/availability",
    retained_checkout_collision_authority: "checkout_server_side_collision_revalidation",
    economics: Object.freeze({
      ...(base.economics || {}),
      winter_booking_quote_controlled_activation_decision: Object.freeze({
        status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "prepared",
        row_count: rows.length,
        gap_count: gaps.length,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        allowed_owner_decisions: Object.freeze([...CONTROLLED_ACTIVATION_DECISIONS]),
        manual_rule_activation_required: true,
        automatic_rule_activation_authorized: false,
        automatic_booking_availability_change_authorized: false,
        automatic_quote_rule_change_authorized: false,
        broad_winter_availability_authorized: false,
        customer_transparency_confirmation_required: true,
        availability_and_checkout_collision_revalidation_remain_authoritative: true,
        weather_ineligible_sessions_excluded_from_ordinary_conversion_interpretation: true
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      controlled_activation_decision_ready_is_live_activation: false,
      controlled_activation_decision_changes_availability: false,
      controlled_activation_decision_changes_checkout: false,
      controlled_activation_decision_changes_quote_rules: false,
      booking_quote_rule_decision_proves_weather_eligibility: false,
      weather_ineligible_session_is_conversion_failure: false,
      broad_winter_availability_inferred: false,
      missing_controlled_activation_decision_may_be_inferred: false
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
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function controlledActivationReview(source = {}) {
  const decision = clean(source.winter_rule_controlled_activation_decision).toLowerCase();
  const reviewedAt = validDate(source.winter_rule_controlled_activation_reviewed_at)
    ? clean(source.winter_rule_controlled_activation_reviewed_at)
    : null;
  const reference = clean(source.winter_rule_controlled_activation_reference) || null;
  const validDecision = CONTROLLED_ACTIVATION_DECISIONS.has(decision);
  return Object.freeze({
    decision: validDecision ? decision : null,
    reviewed_at: reviewedAt,
    reference,
    valid: validDecision && Boolean(reviewedAt) && Boolean(reference)
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
function clean(value) { return String(value ?? "").trim(); }
