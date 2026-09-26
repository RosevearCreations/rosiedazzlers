// Build 508 — Controlled-Environment Operational Readiness & Routing Continuity.
// Read-only continuity review over retained Build 498 qualification and Build 507 booking/quote decision authorities.
import { buildWinterBookingQuoteRuleControlledActivationDecision } from "./winter-booking-quote-rule-controlled-activation-decision.js";

export function buildControlledEnvironmentOperationalReadinessRoutingContinuity({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildWinterBookingQuoteRuleControlledActivationDecision({
    economics, fleet, pricing, source_status, generated_at
  });
  const qualification = base?.economics?.controlled_environment_site_qualification || {};
  const qualificationRows = Array.isArray(qualification.rows) ? qualification.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];
  const rows = [];
  const gaps = [];

  for (const retained of qualificationRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, retained)) || {};
    const candidatePresent = retained.controlled_environment_candidate_present === true;
    const retainedQualified = retained.controlled_environment_site_qualified === true;
    const routing = practiceEvidence(
      source.controlled_environment_routing_continuity_reference,
      source.controlled_environment_routing_continuity_evidence_current
    );
    const siteConfirmation = practiceEvidence(
      source.controlled_environment_site_confirmation_practice_reference,
      source.controlled_environment_site_confirmation_practice_current
    );
    const safeReschedule = practiceEvidence(
      source.manual_safe_reschedule_practice_reference,
      source.manual_safe_reschedule_practice_current
    );

    const operationalReady =
      candidatePresent &&
      retainedQualified &&
      retained.service_routing_state === "controlled_environment_route_review_ready" &&
      routing.complete &&
      siteConfirmation.complete &&
      safeReschedule.complete;

    let operationalState = "not_applicable";
    if (candidatePresent && operationalReady) {
      operationalState = "controlled_environment_operational_review_ready";
    } else if (candidatePresent && retainedQualified) {
      operationalState = "routing_continuity_evidence_required";
    } else if (candidatePresent) {
      operationalState = "qualification_or_site_confirmation_required";
    }

    const missing = [];
    if (candidatePresent && !retainedQualified) missing.push("build498_service_specific_site_qualification");
    if (candidatePresent && retainedQualified && retained.service_routing_state !== "controlled_environment_route_review_ready") {
      missing.push("retained_controlled_environment_route_review_ready");
    }
    if (candidatePresent && !routing.reference) missing.push("current_routing_continuity_reference");
    if (candidatePresent && !routing.current) missing.push("current_routing_continuity_evidence");
    if (candidatePresent && !siteConfirmation.reference) missing.push("manual_site_confirmation_practice_reference");
    if (candidatePresent && !siteConfirmation.current) missing.push("current_manual_site_confirmation_practice");
    if (candidatePresent && !safeReschedule.reference) missing.push("manual_safe_reschedule_practice_reference");
    if (candidatePresent && !safeReschedule.current) missing.push("current_manual_safe_reschedule_practice");

    rows.push(Object.freeze({
      entity_type: retained.entity_type,
      code: retained.code,
      classification: retained.classification,
      controlled_environment_candidate_present: candidatePresent,
      retained_qualification_state: retained.qualification_state,
      retained_service_routing_state: retained.service_routing_state,
      retained_controlled_environment_site_qualified: retainedQualified,
      site_evidence: retained.site_evidence || null,
      workflow_evidence: retained.workflow_evidence || null,
      equipment_evidence: retained.equipment_evidence || null,
      product_evidence: retained.product_evidence || null,
      routing_continuity_evidence: routing,
      manual_site_confirmation_practice: siteConfirmation,
      manual_safe_reschedule_practice: safeReschedule,
      operational_readiness_state: operationalState,
      controlled_environment_operational_review_ready: operationalReady,
      service_specific_only: true,
      manual_site_confirmation_required: true,
      manual_safe_reschedule_preserved: true,
      universal_indoor_capability_authorized: false,
      automatic_appointment_move_authorized: false,
      automatic_routing_authorized: false,
      automatic_availability_change_authorized: false,
      operational_review_ready_is_execution_authorization: false
    }));

    if (candidatePresent && missing.length) {
      gaps.push(Object.freeze({
        entity_type: retained.entity_type,
        code: retained.code,
        missing: Object.freeze(missing),
        safe_default: retainedQualified
          ? "retain_manual_site_confirmation_and_safe_reschedule"
          : "retain_qualification_or_site_confirmation_hold"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    controlled_environment_candidate: rows.filter((row) => row.controlled_environment_candidate_present).length,
    retained_site_qualified: rows.filter((row) => row.retained_controlled_environment_site_qualified).length,
    operational_review_ready: rows.filter((row) => row.controlled_environment_operational_review_ready).length,
    routing_continuity_evidence_required: rows.filter((row) => row.operational_readiness_state === "routing_continuity_evidence_required").length,
    qualification_or_site_confirmation_required: rows.filter((row) => row.operational_readiness_state === "qualification_or_site_confirmation_required").length
  });

  return Object.freeze({
    ...base,
    controlled_environment_operational_readiness_build: 508,
    controlled_environment_operational_readiness_authority: "controlled_environment_operational_readiness_routing_continuity",
    retained_site_qualification_authority: "controlled_environment_site_qualification_service_routing_evidence",
    retained_controlled_activation_decision_authority: "winter_booking_quote_rule_controlled_activation_decision",
    economics: Object.freeze({
      ...(base.economics || {}),
      controlled_environment_operational_readiness: Object.freeze({
        status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "prepared",
        row_count: rows.length,
        gap_count: gaps.length,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        service_specific_only: true,
        site_workflow_equipment_product_qualification_retained: true,
        current_routing_continuity_evidence_required: true,
        manual_site_confirmation_required: true,
        manual_safe_reschedule_practice_required: true,
        automatic_appointment_move_authorized: false,
        automatic_routing_authorized: false,
        universal_indoor_capability_authorized: false
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      operational_review_ready_is_appointment_move: false,
      qualified_service_site_proves_universal_indoor_capability: false,
      manual_site_confirmation_may_be_skipped: false,
      safe_reschedule_practice_may_be_inferred: false,
      one_service_site_qualification_proves_another_service: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
      read_only: true,
      automatic_appointment_move_allowed: false,
      automatic_routing_allowed: false,
      automatic_booking_availability_change_allowed: false,
      automatic_quote_rule_change_allowed: false,
      automatic_customer_message_allowed: false,
      automatic_outreach_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function practiceEvidence(referenceValue, currentValue) {
  const reference = clean(referenceValue) || null;
  const current = currentValue === true;
  return Object.freeze({ reference, current, complete: Boolean(reference) && current });
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
