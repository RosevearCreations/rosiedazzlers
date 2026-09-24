// Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing.
// Read-only routing preparation over the retained Build 487 winter eligibility authority.
import { buildWinterBookingEligibilityCustomerTransparency } from "./winter-booking-eligibility-customer-transparency.js";

const SOURCE_TYPES = new Set(["service","product","equipment","site","process"]);

export function buildControlledEnvironmentWeatherSafeRouting({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildWinterBookingEligibilityCustomerTransparency({ economics, fleet, pricing, source_status, generated_at });
  const capability = base?.economics?.cold_weather_capability_matrix || {};
  const eligibility = base?.economics?.winter_booking_eligibility || {};
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];
  const eligibilityRows = Array.isArray(eligibility.rows) ? eligibility.rows : [];

  const rows = [];
  const gaps = [];
  for (const eligibilityRow of eligibilityRows) {
    const source = sourceRows.find((row) => sameEntity(row, eligibilityRow)) || {};
    const environment = explicitEnvironmentAlternative(source);
    const route = routeFor(eligibilityRow, environment);
    rows.push(Object.freeze({
      entity_type: eligibilityRow.entity_type,
      code: eligibilityRow.code,
      classification: eligibilityRow.classification,
      retained_eligibility_state: eligibilityRow.eligibility_state,
      routing_state: route.routing_state,
      routing_guidance: route.routing_guidance,
      customer_guidance_draft: route.customer_guidance_draft,
      controlled_environment_alternative_supported: environment.supported,
      controlled_environment_source_type: environment.source_type,
      controlled_environment_reference: environment.reference,
      indoor_capable_workflow_supported: environment.indoor_supported,
      indoor_workflow_source_type: environment.indoor_source_type,
      indoor_workflow_reference: environment.indoor_reference,
      source_owned_temperature_limit_text: eligibilityRow.temperature_limit_text || null,
      current_weather_evaluated: false,
      current_site_confirmed: false,
      automatic_booking_change_authorized: false,
      automatic_routing_authorized: false,
      customer_message_publication_authorized: false
    }));

    if (eligibilityRow.classification === "controlled_environment_required" && !environment.supported && !environment.indoor_supported) {
      gaps.push(Object.freeze({
        entity_type: eligibilityRow.entity_type,
        code: eligibilityRow.code,
        missing: Object.freeze(["explicit_controlled_environment_site_or_indoor_workflow_evidence"]),
        safe_default: "controlled_environment_site_confirmation_required"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    explicit_controlled_environment_alternative: rows.filter((row) => row.controlled_environment_alternative_supported).length,
    explicit_indoor_capable_workflow: rows.filter((row) => row.indoor_capable_workflow_supported).length,
    safe_reschedule_review: rows.filter((row) => row.routing_state === "weather_safe_reschedule_review").length,
    controlled_environment_site_confirmation: rows.filter((row) => row.routing_state === "controlled_environment_site_confirmation_required").length,
    conditional_field_review: rows.filter((row) => row.routing_state === "conditional_field_review").length
  });

  const status = capability.status === "unavailable" || eligibility.status === "unavailable"
    ? "unavailable"
    : gaps.length
      ? "review"
      : "prepared";

  return Object.freeze({
    ...base,
    weather_safe_routing_enrichment_build: 488,
    weather_safe_routing_authority: "controlled_environment_alternatives_weather_safe_routing",
    retained_winter_eligibility_authority: "winter_booking_eligibility_customer_transparency",
    economics: Object.freeze({
      ...(base.economics || {}),
      weather_safe_routing: Object.freeze({
        status,
        row_count: rows.length,
        gap_count: gaps.length,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        broad_indoor_capability_claim_authorized: false,
        broad_winter_claim_authorized: false,
        current_weather_evaluated: false,
        automatic_booking_or_route_change_authorized: false,
        customer_guidance_status: rows.length ? "draft_owner_review_required" : "unavailable"
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      every_service_can_move_indoors: false,
      controlled_environment_classification_proves_specific_site_available: false,
      current_forecast_creates_indoor_capability: false,
      current_forecast_creates_service_capability: false,
      safe_reschedule_guidance_is_booking_mutation: false,
      weather_safe_route_is_customer_commitment: false,
      missing_controlled_environment_evidence_may_be_inferred: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
      read_only: true,
      automatic_booking_availability_change_allowed: false,
      automatic_quote_eligibility_change_allowed: false,
      automatic_route_change_allowed: false,
      automatic_reschedule_allowed: false,
      automatic_customer_message_allowed: false,
      automatic_public_winter_claim_allowed: false,
      automatic_price_or_discount_change_allowed: false,
      schema_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function routeFor(row = {}, environment = {}) {
  const classification = clean(row.classification).toLowerCase();
  const explicitAlternative = environment.supported || environment.indoor_supported;

  if (classification === "cold_snap_capable") {
    if (explicitAlternative) {
      return {
        routing_state: "conditional_field_or_explicit_controlled_environment_option",
        routing_guidance: "Field execution remains conditional on current site/weather confirmation. An explicitly evidenced controlled-environment or indoor workflow may also be reviewed.",
        customer_guidance_draft: "This service has recorded cold-weather capability, but current site and weather conditions still need confirmation. An indoor/controlled option is discussed only where the recorded workflow supports it."
      };
    }
    return {
      routing_state: "conditional_field_review",
      routing_guidance: "Keep the service in conditional field review; current site/weather confirmation remains required and no indoor alternative is assumed.",
      customer_guidance_draft: "This service has recorded cold-weather capability, but current site and weather conditions still need confirmation."
    };
  }

  if (classification === "temperature_limited_outdoor") {
    if (explicitAlternative) {
      return {
        routing_state: "controlled_environment_alternative_available",
        routing_guidance: "When outdoor conditions do not meet source-owned limits, the explicitly evidenced controlled-environment or indoor workflow may be reviewed instead of assuming cancellation.",
        customer_guidance_draft: "This outdoor service is temperature-limited. When conditions are unsuitable, we may discuss a specifically supported controlled-environment option; otherwise we reschedule safely."
      };
    }
    return {
      routing_state: "weather_safe_reschedule_review",
      routing_guidance: "When outdoor conditions do not meet source-owned limits, retain the booking for manual reschedule review. Do not assume an indoor move.",
      customer_guidance_draft: "This outdoor service is temperature-limited. If conditions are unsuitable, we arrange a safer time rather than claiming the service can automatically move indoors."
    };
  }

  if (classification === "controlled_environment_required") {
    if (explicitAlternative) {
      return {
        routing_state: "controlled_environment_required_with_explicit_option",
        routing_guidance: "Use only the explicitly evidenced controlled-environment/site/workflow option after current site suitability is confirmed.",
        customer_guidance_draft: "This service requires a suitable controlled environment in cold weather. We confirm the specific supported site/workflow before service."
      };
    }
    return {
      routing_state: "controlled_environment_site_confirmation_required",
      routing_guidance: "A controlled environment is required, but no specific suitable site/workflow is evidenced here. Keep the route in owner/site review and do not imply indoor availability.",
      customer_guidance_draft: "This service requires a suitable controlled environment. A specific indoor/site option has not yet been confirmed."
    };
  }

  return {
    routing_state: "owner_review_required",
    routing_guidance: "No weather-safe route can be prepared from an unsupported classification.",
    customer_guidance_draft: "A weather-safe service route has not yet been established."
  };
}

function explicitEnvironmentAlternative(source = {}) {
  const altSupported = source.controlled_environment_alternative_supported === true;
  const altSourceType = clean(source.controlled_environment_source_type || source.alternative_evidence_source_type).toLowerCase();
  const altReference = clean(source.controlled_environment_reference || source.alternative_evidence_reference);
  const altValid = altSupported && SOURCE_TYPES.has(altSourceType) && Boolean(altReference);

  const indoorSupported = source.indoor_capable_workflow_supported === true;
  const indoorSourceType = clean(source.indoor_workflow_source_type).toLowerCase();
  const indoorReference = clean(source.indoor_workflow_reference);
  const indoorValid = indoorSupported && SOURCE_TYPES.has(indoorSourceType) && Boolean(indoorReference);

  return Object.freeze({
    supported: altValid,
    source_type: altValid ? altSourceType : null,
    reference: altValid ? altReference : null,
    indoor_supported: indoorValid,
    indoor_source_type: indoorValid ? indoorSourceType : null,
    indoor_reference: indoorValid ? indoorReference : null
  });
}

function sameEntity(source = {}, target = {}) {
  const type = clean(target.entity_type).toLowerCase();
  const code = clean(target.code);
  if (!code) return false;
  if (type === "add_on") return clean(source.add_on_code) === code;
  if (type === "package") return clean(source.package_code) === code;
  if (type === "service") return clean(source.service_code) === code;
  return false;
}
function clean(value){ return String(value ?? "").trim(); }
