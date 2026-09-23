// Build 487 — Winter Booking Eligibility & Customer Transparency.
// Read-only booking/quote eligibility preparation over the retained Build 486 capability matrix.
import { buildColdWeatherServiceCapabilityEvidenceMatrix } from "./cold-weather-service-capability-evidence-matrix.js";

export function buildWinterBookingEligibilityCustomerTransparency({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildColdWeatherServiceCapabilityEvidenceMatrix({ economics, fleet, pricing, source_status, generated_at });
  const matrix = base?.economics?.cold_weather_capability_matrix || {};
  const rows = Array.isArray(matrix.rows) ? matrix.rows.map(buildEligibilityRow) : [];
  const weatherEvidence = summarizeWeatherIneligibleEvidence(pricing?.booking?.weather_eligibility_evidence || {});
  const status = matrix.status === "unavailable"
    ? "unavailable"
    : matrix.status === "review" || rows.some((row) => row.eligibility_state === "owner_review_required")
      ? "review"
      : "prepared";

  return Object.freeze({
    ...base,
    winter_booking_eligibility_enrichment_build: 487,
    winter_booking_eligibility_authority: "winter_booking_eligibility_customer_transparency",
    retained_capability_authority: "cold_weather_service_capability_evidence_matrix",
    economics: Object.freeze({
      ...(base.economics || {}),
      winter_booking_eligibility: Object.freeze({
        status,
        matrix_status: matrix.status || "unavailable",
        row_count: rows.length,
        rows: Object.freeze(rows),
        customer_copy_status: rows.length ? "draft_owner_review_required" : "unavailable",
        broad_winter_claim_authorized: false,
        automatic_booking_availability_change_authorized: false,
        automatic_quote_eligibility_change_authorized: false,
        owner_publication_approval_required: true,
        weather_ineligible_conversion_interpretation: weatherEvidence
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      weather_ineligible_session_is_conversion_failure: false,
      weather_ineligible_session_may_remain_in_ordinary_conversion_denominator: false,
      capability_row_is_blanket_winter_availability: false,
      draft_customer_copy_is_published_claim: false,
      current_forecast_creates_service_capability: false,
      missing_session_weather_evidence_may_be_inferred: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
      read_only: true,
      automatic_booking_availability_change_allowed: false,
      automatic_quote_eligibility_change_allowed: false,
      automatic_public_winter_claim_allowed: false,
      automatic_customer_message_allowed: false,
      automatic_price_or_discount_change_allowed: false,
      schema_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function buildEligibilityRow(row = {}) {
  const classification = clean(row.classification).toLowerCase();
  const limit = temperatureText(row);
  if (classification === "cold_snap_capable") {
    return Object.freeze({
      entity_type: row.entity_type,
      code: row.code,
      classification,
      eligibility_state: "conditional_winter_consideration",
      booking_quote_guidance: "May be considered for winter booking/quote review when current site and weather conditions are separately confirmed.",
      customer_limitation_text: "Cold-weather capability is supported by recorded service evidence, but current site and weather conditions still need confirmation before service.",
      temperature_limit_text: limit,
      owner_review_required: true,
      automatic_eligibility_change_authorized: false
    });
  }
  if (classification === "temperature_limited_outdoor") {
    return Object.freeze({
      entity_type: row.entity_type,
      code: row.code,
      classification,
      eligibility_state: "weather_condition_check_required",
      booking_quote_guidance: "Do not treat as ordinarily eligible until current conditions are checked against the recorded source-owned limits, when present.",
      customer_limitation_text: "This outdoor service is temperature-limited. We confirm current conditions before booking or service" + (limit ? " (" + limit + ")" : "") + ".",
      temperature_limit_text: limit,
      owner_review_required: true,
      automatic_eligibility_change_authorized: false
    });
  }
  if (classification === "controlled_environment_required") {
    return Object.freeze({
      entity_type: row.entity_type,
      code: row.code,
      classification,
      eligibility_state: "controlled_environment_required",
      booking_quote_guidance: "Winter booking/quote review requires a suitable controlled environment; outdoor winter execution is not assumed.",
      customer_limitation_text: "This service requires a suitable controlled environment in cold weather. Outdoor winter service is not assumed.",
      temperature_limit_text: limit,
      owner_review_required: true,
      automatic_eligibility_change_authorized: false
    });
  }
  return Object.freeze({
    entity_type: row.entity_type || "unknown",
    code: row.code || null,
    classification: classification || "unavailable",
    eligibility_state: "owner_review_required",
    booking_quote_guidance: "Eligibility cannot be prepared from an unsupported capability classification.",
    customer_limitation_text: "Winter service eligibility is not yet established for this item.",
    temperature_limit_text: null,
    owner_review_required: true,
    automatic_eligibility_change_authorized: false
  });
}

function summarizeWeatherIneligibleEvidence(evidence = {}) {
  const rows = Array.isArray(evidence?.rows) ? evidence.rows : [];
  let eligible = 0, ineligible = 0, unknown = 0;
  for (const row of rows) {
    const state = clean(row?.eligibility_state).toLowerCase();
    const count = whole(row?.session_count);
    if (state === "weather_eligible") eligible += count;
    else if (state === "weather_ineligible") ineligible += count;
    else unknown += count;
  }
  const total = eligible + ineligible + unknown;
  return Object.freeze({
    status: total ? "observed" : "unavailable",
    recorded_session_count: total,
    weather_eligible_session_count: eligible,
    weather_ineligible_session_count: ineligible,
    unknown_session_count: unknown,
    ordinary_conversion_denominator_excludes_weather_ineligible: true,
    adjusted_conversion_metric_available: false,
    adjusted_conversion_metric_value: null,
    session_level_evidence_required_for_adjustment: true,
    weather_ineligible_count_is_conversion_failure: false,
    conclusion: total
      ? "Observed weather-ineligible sessions are explicitly separated from ordinary conversion interpretation. No adjusted rate is published until the retained funnel provides a like-for-like numerator and denominator."
      : "No attributable session-level weather eligibility evidence is available; ordinary conversion interpretation must not invent a seasonal adjustment."
  });
}
function temperatureText(row = {}) {
  if (row.exact_temperature_claim_supported !== true) return null;
  const parts = [];
  if (row.minimum_working_temperature_c !== null && row.minimum_working_temperature_c !== undefined) parts.push("minimum " + String(row.minimum_working_temperature_c) + "°C");
  if (row.maximum_working_temperature_c !== null && row.maximum_working_temperature_c !== undefined) parts.push("maximum " + String(row.maximum_working_temperature_c) + "°C");
  return parts.length ? "recorded working limit: " + parts.join(" · ") : null;
}
function clean(value){ return String(value ?? "").trim(); }
function whole(value){ const n=Number(value); return Number.isFinite(n) && n > 0 ? Math.round(n) : 0; }
