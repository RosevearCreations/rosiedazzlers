// Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence.
// Read-only service-specific qualification over the retained Build 497 activation-readiness authority.
import { buildWinterBookingQuoteRuleActivationReadiness } from "./winter-booking-quote-rule-activation-readiness.js";

export function buildControlledEnvironmentSiteQualificationServiceRoutingEvidence({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildWinterBookingQuoteRuleActivationReadiness({ economics, fleet, pricing, source_status, generated_at });
  const readiness = base?.economics?.winter_booking_quote_activation_readiness || {};
  const readinessRows = Array.isArray(readiness.rows) ? readiness.rows : [];
  const routingRows = Array.isArray(base?.economics?.weather_safe_routing?.rows)
    ? base.economics.weather_safe_routing.rows
    : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];

  const rows = [];
  const gaps = [];

  for (const retained of readinessRows) {
    const source = sourceRows.find((row) => sameEntity(row, retained)) || {};
    const route = routingRows.find((row) => sameEntity(row, retained)) || {};
    const candidatePresent =
      retained.classification === "controlled_environment_required" ||
      route.controlled_environment_alternative_supported === true ||
      route.indoor_capable_workflow_supported === true;

    const evidence = qualificationEvidence(source);
    const qualificationReady = candidatePresent && evidence.complete;
    let qualificationState = "not_applicable";
    let routingState = route.routing_state || "owner_review_required";

    if (candidatePresent && qualificationReady) {
      qualificationState = "controlled_environment_site_qualified";
      routingState = "controlled_environment_route_review_ready";
    } else if (candidatePresent) {
      qualificationState = "qualification_evidence_required";
      routingState = retained.classification === "temperature_limited_outdoor"
        ? "manual_safe_reschedule_review"
        : "controlled_environment_site_confirmation_required";
    }

    const row = Object.freeze({
      entity_type: retained.entity_type,
      code: retained.code,
      classification: retained.classification,
      retained_activation_state: retained.activation_state,
      retained_routing_state: route.routing_state || null,
      controlled_environment_candidate_present: candidatePresent,
      site_evidence: evidence.site,
      workflow_evidence: evidence.workflow,
      equipment_evidence: evidence.equipment,
      product_evidence: evidence.product,
      qualification_state: qualificationState,
      service_routing_state: routingState,
      controlled_environment_site_qualified: qualificationReady,
      service_specific_only: true,
      current_site_confirmation_still_required: qualificationReady,
      manual_safe_reschedule_preserved: !qualificationReady && retained.classification === "temperature_limited_outdoor",
      universal_indoor_capability_authorized: false,
      automatic_appointment_move_authorized: false,
      automatic_routing_authorized: false,
      automatic_availability_change_authorized: false
    });
    rows.push(row);

    if (candidatePresent && !qualificationReady) {
      gaps.push(Object.freeze({
        entity_type: retained.entity_type,
        code: retained.code,
        missing: Object.freeze(evidence.missing),
        safe_default: retained.classification === "temperature_limited_outdoor"
          ? "manual_safe_reschedule_review"
          : "controlled_environment_site_confirmation_required"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    controlled_environment_candidate: rows.filter((row) => row.controlled_environment_candidate_present).length,
    controlled_environment_site_qualified: rows.filter((row) => row.controlled_environment_site_qualified).length,
    qualification_evidence_required: rows.filter((row) => row.qualification_state === "qualification_evidence_required").length,
    manual_safe_reschedule_review: rows.filter((row) => row.service_routing_state === "manual_safe_reschedule_review").length,
    site_confirmation_required: rows.filter((row) => row.service_routing_state === "controlled_environment_site_confirmation_required").length
  });

  return Object.freeze({
    ...base,
    controlled_environment_site_qualification_build: 498,
    controlled_environment_site_qualification_authority: "controlled_environment_site_qualification_service_routing_evidence",
    retained_activation_readiness_authority: "winter_booking_quote_rule_activation_readiness",
    retained_weather_safe_routing_authority: "controlled_environment_alternatives_weather_safe_routing",
    economics: Object.freeze({
      ...(base.economics || {}),
      controlled_environment_site_qualification: Object.freeze({
        status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "prepared",
        row_count: rows.length,
        gap_count: gaps.length,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        qualification_requires_site_workflow_equipment_product_evidence: true,
        service_specific_qualification_only: true,
        current_site_confirmation_required_before_execution: true,
        manual_safe_reschedule_preserved_for_missing_evidence: true,
        universal_indoor_capability_authorized: false,
        automatic_appointment_move_authorized: false,
        automatic_routing_authorized: false
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      one_qualified_service_proves_universal_indoor_capability: false,
      retained_controlled_environment_classification_proves_site_qualified: false,
      retained_route_candidate_proves_site_qualified: false,
      missing_site_workflow_equipment_product_evidence_may_be_inferred: false,
      qualified_site_route_is_live_booking_mutation: false,
      current_weather_creates_site_qualification: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
      read_only: true,
      automatic_appointment_move_allowed: false,
      automatic_routing_allowed: false,
      automatic_reschedule_allowed: false,
      automatic_booking_availability_change_allowed: false,
      automatic_quote_eligibility_change_allowed: false,
      automatic_public_indoor_claim_allowed: false,
      customer_message_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function qualificationEvidence(source = {}) {
  const nested = source.controlled_environment_qualification && typeof source.controlled_environment_qualification === "object"
    ? source.controlled_environment_qualification
    : {};
  const site = evidenceItem(
    nested.site,
    source.controlled_environment_site_reference,
    source.controlled_environment_site_evidence_current,
    source.controlled_environment_site_suitable
  );
  const workflow = evidenceItem(
    nested.workflow,
    source.controlled_environment_workflow_reference || source.indoor_workflow_reference,
    source.controlled_environment_workflow_evidence_current,
    source.controlled_environment_workflow_supported ?? source.indoor_capable_workflow_supported
  );
  const equipment = evidenceItem(
    nested.equipment,
    source.controlled_environment_equipment_reference,
    source.controlled_environment_equipment_evidence_current,
    source.controlled_environment_equipment_supported
  );
  const product = evidenceItem(
    nested.product,
    source.controlled_environment_product_reference,
    source.controlled_environment_product_evidence_current,
    source.controlled_environment_product_supported
  );
  const missing = [];
  for (const [name, item] of Object.entries({site, workflow, equipment, product})) {
    if (!item.reference) missing.push(name + "_reference");
    if (!item.current) missing.push(name + "_evidence_current");
    if (!item.supported) missing.push(name + "_compatibility_supported");
  }
  return Object.freeze({
    site, workflow, equipment, product,
    missing: Object.freeze(missing),
    complete: missing.length === 0
  });
}
function evidenceItem(nested, fallbackReference, fallbackCurrent, fallbackSupported) {
  const item = nested && typeof nested === "object" ? nested : {};
  const reference = clean(item.reference || item.evidence_reference || fallbackReference) || null;
  const current = item.current === true || item.evidence_current === true || fallbackCurrent === true;
  const supported = item.supported === true || item.compatible === true || fallbackSupported === true;
  return Object.freeze({ reference, current, supported, attributable: Boolean(reference) && current && supported });
}
function sameEntity(source = {}, target = {}) {
  const type = clean(target.entity_type).toLowerCase();
  const code = clean(target.code);
  if (!code) return false;
  const normalizedSourceType = clean(source.entity_type).toLowerCase();
  const normalizedSourceCode = clean(source.code);
  if (normalizedSourceType && normalizedSourceCode) {
    return normalizedSourceType === type && normalizedSourceCode === code;
  }
  if (type === "add_on") return clean(source.add_on_code) === code;
  if (type === "package") return clean(source.package_code) === code;
  if (type === "service") return clean(source.service_code) === code;
  return false;
}
function clean(value){ return String(value ?? "").trim(); }
