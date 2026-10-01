// Build 527 — Winter Booking & Quote Rule Outcome Freshness Review.
import { buildSeasonalCapabilityPublicClaimOutcomeFreshnessReview } from "./seasonal-capability-public-claim-outcome-freshness-review.js";

const CURRENT_STATES = new Set(["controlled_activation_current","retain_hold_current"]);

export function buildWinterBookingQuoteRuleOutcomeFreshnessReview({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null, freshness_window_days = 30
} = {}) {
  const base = buildSeasonalCapabilityPublicClaimOutcomeFreshnessReview({
    economics, fleet, pricing, source_status, generated_at, freshness_window_days
  });
  const continuity = base?.economics?.winter_booking_quote_controlled_activation_outcome_continuity || {};
  const retainedRows = Array.isArray(continuity.rows) ? continuity.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows) ? economics.seasonal_operability_evidence.rows : [];
  const generatedAt = validDate(generated_at) ? new Date(generated_at) : new Date();
  const windowDays = Math.max(1, Math.min(365, Number(freshness_window_days) || 30));
  const rows = [], gaps = [];

  for (const retained of retainedRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, retained)) || null;
    const currentOutcome = clean(source?.winter_rule_controlled_activation_outcome).toLowerCase() || null;
    const outcomeObservedAt = validDate(source?.winter_rule_controlled_activation_outcome_observed_at) ? clean(source.winter_rule_controlled_activation_outcome_observed_at) : retained.controlled_activation_outcome_observed_at || null;
    const runtimeRevalidatedAt = validDate(source?.winter_rule_runtime_revalidated_at) ? clean(source.winter_rule_runtime_revalidated_at) : retained.runtime_revalidated_at || null;
    const outcomeAgeDays = ageDays(outcomeObservedAt, generatedAt), runtimeAgeDays = ageDays(runtimeRevalidatedAt, generatedAt);
    const capabilityEvidenceCurrent = source?.capability_evidence_current === true;
    const classificationMatches = Boolean(source) && normalizeToken(source.classification) === normalizeToken(retained.classification) && Boolean(normalizeToken(retained.classification));
    const currentWording = clean(source?.winter_rule_outcome_customer_transparency_wording) || null;
    const retainedWording = clean(retained.retained_customer_limitation_text) || null;
    const wordingMatches = textMatches(currentWording, retainedWording);
    const bookingRule = clean(source?.winter_rule_applied_booking_rule) || null;
    const quoteRule = clean(source?.winter_rule_applied_quote_rule) || null;
    const bookingRuleMatches = currentOutcome !== "activated" || textMatches(bookingRule, retained.retained_booking_rule_candidate);
    const quoteRuleMatches = currentOutcome !== "activated" || textMatches(quoteRule, retained.retained_quote_rule_candidate);
    const availabilityRevalidated = source?.winter_rule_availability_revalidated === true;
    const checkoutCollisionRevalidated = source?.winter_rule_checkout_collision_revalidated === true;
    const runtimeReference = clean(source?.winter_rule_runtime_revalidation_reference) || retained.runtime_revalidation_reference || null;
    const outcomeReference = clean(source?.winter_rule_controlled_activation_outcome_reference) || retained.controlled_activation_outcome_reference || null;
    const outcomeChanged = Boolean(retained.controlled_activation_outcome && currentOutcome && retained.controlled_activation_outcome !== currentOutcome);
    const staleOutcome = outcomeAgeDays === null || outcomeAgeDays > windowDays;
    const staleRuntime = runtimeAgeDays === null || runtimeAgeDays > windowDays;

    let freshnessState = "predecessor_outcome_review_required";
    if (!source) freshnessState = "freshness_source_unavailable";
    else if (!capabilityEvidenceCurrent || !classificationMatches) freshnessState = "service_classification_or_capability_drift_review_required";
    else if (!wordingMatches) freshnessState = "customer_transparency_drift_review_required";
    else if (currentOutcome === "activated" && (!bookingRuleMatches || !quoteRuleMatches)) freshnessState = "applied_rule_drift_review_required";
    else if (!availabilityRevalidated || !checkoutCollisionRevalidated || !runtimeRevalidatedAt || !runtimeReference) freshnessState = "runtime_safety_revalidation_required";
    else if (outcomeChanged || ["controlled_activation_evidence_conflict","retain_hold_evidence_conflict"].includes(retained.outcome_state)) freshnessState = "outcome_evidence_conflict_review_required";
    else if (staleOutcome || staleRuntime) freshnessState = "stale_outcome_review_required";
    else if (retained.outcome_state === "controlled_activation_observed") freshnessState = "controlled_activation_current";
    else if (retained.outcome_state === "retain_hold_observed") freshnessState = "retain_hold_current";

    const current = CURRENT_STATES.has(freshnessState);
    const missing = [];
    if (!source) missing.push("current_service_specific_winter_rule_evidence");
    if (!capabilityEvidenceCurrent) missing.push("current_service_specific_capability_evidence");
    if (!classificationMatches) missing.push("current_service_classification_matches_retained_decision_trace");
    if (!currentWording) missing.push("current_customer_transparency_wording");
    if (currentWording && retainedWording && !wordingMatches) missing.push("customer_transparency_wording_matches_retained_decision_trace");
    if (currentOutcome === "activated" && !bookingRuleMatches) missing.push("applied_booking_rule_matches_retained_decision_trace");
    if (currentOutcome === "activated" && !quoteRuleMatches) missing.push("applied_quote_rule_matches_retained_decision_trace");
    if (!availabilityRevalidated) missing.push("api_availability_revalidated");
    if (!checkoutCollisionRevalidated) missing.push("checkout_collision_revalidated");
    if (!runtimeRevalidatedAt) missing.push("dated_runtime_revalidation");
    if (!runtimeReference) missing.push("attributable_runtime_revalidation_reference");
    if (!outcomeObservedAt) missing.push("dated_controlled_activation_outcome_observation");
    if (!outcomeReference) missing.push("attributable_controlled_activation_outcome_reference");
    if (staleOutcome && outcomeObservedAt) missing.push("fresh_controlled_activation_outcome_observation");
    if (staleRuntime && runtimeRevalidatedAt) missing.push("fresh_runtime_safety_revalidation");
    if (outcomeChanged) missing.push("controlled_activation_outcome_matches_retained_observation");

    rows.push(Object.freeze({
      entity_type: retained.entity_type, code: retained.code, retained_outcome_state: retained.outcome_state,
      current_controlled_activation_outcome: currentOutcome, controlled_activation_outcome_observed_at: outcomeObservedAt,
      outcome_age_days: outcomeAgeDays, runtime_revalidated_at: runtimeRevalidatedAt, runtime_age_days: runtimeAgeDays,
      freshness_window_days: windowDays, retained_service_classification: retained.classification,
      current_service_classification: source ? clean(source.classification) || null : null,
      current_service_classification_matches_retained_decision_trace: classificationMatches,
      capability_evidence_current: capabilityEvidenceCurrent,
      retained_booking_rule_candidate: retained.retained_booking_rule_candidate || null,
      current_applied_booking_rule: bookingRule, applied_booking_rule_matches_retained_decision_trace: bookingRuleMatches,
      retained_quote_rule_candidate: retained.retained_quote_rule_candidate || null,
      current_applied_quote_rule: quoteRule, applied_quote_rule_matches_retained_decision_trace: quoteRuleMatches,
      retained_customer_transparency_wording: retainedWording, current_customer_transparency_wording: currentWording,
      customer_transparency_wording_matches_retained_decision_trace: wordingMatches,
      availability_revalidated: availabilityRevalidated, checkout_collision_revalidated: checkoutCollisionRevalidated,
      runtime_revalidation_reference: runtimeReference, controlled_activation_outcome_reference: outcomeReference,
      controlled_activation_outcome_changed: outcomeChanged, freshness_state: freshnessState, freshness_review_current: current,
      manual_review_required: !current, availability_authority: "/api/availability",
      checkout_collision_revalidation_authority: "checkout_server_side_collision_revalidation",
      weather_ineligible_excluded_from_ordinary_conversion_interpretation: true,
      broad_winter_availability_authorized: false, automatic_rule_activation_authorized: false,
      automatic_booking_availability_change_authorized: false, automatic_quote_rule_change_authorized: false,
      automatic_hold_narrowing_authorized: false
    }));
    if (!current) gaps.push(Object.freeze({entity_type: retained.entity_type,code: retained.code,state:freshnessState,missing:Object.freeze([...new Set(missing)]),safe_default:"retain_winter_booking_quote_hold"}));
  }

  const counts = Object.freeze({
    total: rows.length, current: rows.filter(r=>r.freshness_review_current).length,
    controlled_activation_current: rows.filter(r=>r.freshness_state==="controlled_activation_current").length,
    retain_hold_current: rows.filter(r=>r.freshness_state==="retain_hold_current").length,
    stale: rows.filter(r=>r.freshness_state==="stale_outcome_review_required").length,
    rule_or_wording_drift: rows.filter(r=>["applied_rule_drift_review_required","customer_transparency_drift_review_required","service_classification_or_capability_drift_review_required"].includes(r.freshness_state)).length,
    runtime_safety_review: rows.filter(r=>r.freshness_state==="runtime_safety_revalidation_required").length,
    review_required: rows.filter(r=>r.manual_review_required).length
  });

  return Object.freeze({
    ...base,
    winter_booking_quote_outcome_freshness_build: 527,
    winter_booking_quote_outcome_freshness_authority: "winter_booking_quote_rule_outcome_freshness_review",
    retained_winter_rule_outcome_authority: "winter_booking_quote_rule_controlled_activation_outcome_continuity",
    retained_controlled_activation_decision_authority: "winter_booking_quote_rule_controlled_activation_decision",
    retained_availability_authority: "/api/availability",
    retained_checkout_collision_authority: "checkout_server_side_collision_revalidation",
    economics: Object.freeze({...base.economics,winter_booking_quote_rule_outcome_freshness_review:Object.freeze({
      status: rows.length===0?"unavailable":gaps.length?"review":"current",row_count:rows.length,gap_count:gaps.length,
      freshness_window_days:windowDays,counts,rows:Object.freeze(rows),gaps:Object.freeze(gaps),
      observed_rule_state_must_remain_current:true,availability_and_checkout_collision_revalidation_remain_authoritative:true,
      weather_ineligible_sessions_excluded_from_ordinary_conversion_interpretation:true,broad_winter_availability_authorized:false,
      automatic_rule_activation_authorized:false,automatic_booking_availability_change_authorized:false,
      automatic_quote_rule_change_authorized:false,canonical_hold_mutation_authorized:false
    })}),
    truth_boundary:Object.freeze({...base.truth_boundary,stale_rule_outcome_may_be_treated_as_current:false,
      rule_state_may_be_inferred_from_source_or_runtime_green:false,availability_endpoint_green_proves_weather_eligibility:false,
      checkout_collision_revalidation_proves_weather_eligibility:false,weather_ineligible_session_is_conversion_failure:false,
      broad_winter_availability_inferred:false}),
    boundaries:Object.freeze({...base.boundaries,read_only:true,automatic_rule_activation_allowed:false,
      automatic_booking_availability_change_allowed:false,automatic_quote_rule_change_allowed:false,automatic_checkout_mutation_allowed:false,
      automatic_customer_message_allowed:false,automatic_public_winter_claim_allowed:false,automatic_price_or_discount_change_allowed:false,
      canonical_hold_mutation_allowed:false,schema_mutation_allowed:false,storage_mutation_allowed:false,permanent_polling:false})
  });
}
function ageDays(value,generatedAt){if(!validDate(value))return null;const ms=generatedAt.getTime()-new Date(value).getTime();return Number.isFinite(ms)?Math.max(0,Math.floor(ms/86400000)):null;}
function sameEntity(source={},target={}){const type=clean(target.entity_type).toLowerCase(),code=clean(target.code);if(!code)return false;const st=clean(source.entity_type).toLowerCase(),sc=clean(source.code);if(st&&sc)return st===type&&sc===code;if(type==="add_on")return clean(source.add_on_code)===code;if(type==="package")return clean(source.package_code)===code;if(type==="service")return clean(source.service_code)===code;return false;}
function validDate(value){const raw=clean(value);return Boolean(raw)&&Number.isFinite(Date.parse(raw));}
function normalizeToken(value){return clean(value).toLowerCase().replace(/[-\s]+/g,"_");}
function normalizeText(value){return clean(value).replace(/\s+/g," ").toLowerCase();}
function textMatches(left,right){const a=normalizeText(left),b=normalizeText(right);return Boolean(a&&b&&a===b);}
function clean(value){return String(value??"").trim();}
