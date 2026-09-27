// Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness.
// Read-only decision readiness over retained Build 504 same-domain continuity.
// Evidence classes remain independent; no business or provider mutation is authorized.

const DOMAIN_KEYS = Object.freeze([
  "explicit_allocation",
  "seasonal_operability",
  "observed_capacity",
  "technical_reliability"
]);

export function buildServiceEconomicsSeasonalCapacityReliabilityDecisionReadiness({
  trend_continuity = {},
  generated_at = null
} = {}) {
  const sourceAvailable = trend_continuity?.review_status !== "evidence_sources_unavailable";
  const retainedReady =
    sourceAvailable &&
    trend_continuity?.review_status === "bounded_trend_continuity_review_ready" &&
    trend_continuity?.review_ready === true;

  const sourceDomains = trend_continuity?.domain_continuity || {};
  const domains = {};
  for (const key of DOMAIN_KEYS) {
    const source = sourceDomains?.[key] || {};
    const comparable = sourceAvailable && source?.comparable_window_evidence === true;
    domains[key] = Object.freeze({
      status: !sourceAvailable
        ? "evidence_source_unavailable"
        : comparable
          ? "bounded_domain_decision_review_ready"
          : "insufficient_comparable_history",
      decision_review_ready: comparable,
      comparable_window_evidence: comparable,
      owning_status: clean(source?.status) || "unavailable",
      comparison_count: Array.isArray(source?.comparisons)
        ? source.comparisons.length
        : (comparable ? 1 : 0),
      automatic_action_authorized: false
    });
  }

  const readyDomains = DOMAIN_KEYS.filter((key) => domains[key].decision_review_ready);
  const insufficientDomains = DOMAIN_KEYS.filter((key) => !domains[key].decision_review_ready);
  const decisionReady = retainedReady && readyDomains.length === DOMAIN_KEYS.length;

  const adjacent = trend_continuity?.adjacent_external_evidence || {};

  return Object.freeze({
    decision_readiness_build: 514,
    decision_readiness_authority: "service_economics_seasonal_capacity_reliability_decision_readiness",
    mode: "read_only_independent_domain_decision_readiness",
    generated_at: generated_at || new Date().toISOString(),
    status: !sourceAvailable
      ? "evidence_sources_unavailable"
      : decisionReady
        ? "bounded_decision_readiness_review_ready"
        : "bounded_decision_readiness_review_required",
    decision_ready: decisionReady,
    retained_build504_status: clean(trend_continuity?.review_status) || "unavailable",
    domains: Object.freeze(domains),
    decision_package: Object.freeze({
      operator_review_required: true,
      default_if_no_operator_action: "retain_current_controls_and_holds",
      independent_domains_required: true,
      cross_domain_substitution_allowed: false,
      missing_comparable_history_remains_insufficient: true,
      ready_domains: Object.freeze(readyDomains),
      insufficient_domains: Object.freeze(insufficientDomains),
      automatic_action_authorized: false
    }),
    adjacent_external_evidence: Object.freeze({
      provider_cost_quota_status: clean(adjacent?.provider_cost_quota_status) || "unavailable",
      recovery_status: clean(adjacent?.recovery_status) || "unavailable",
      provider_cost_quota_part_of_decision_inference: false,
      recovery_success_part_of_decision_inference: false
    }),
    truth_boundary: Object.freeze({
      cross_domain_evidence_used_to_close_gap: false,
      allocation_continuity_proves_margin_or_price_action: false,
      seasonal_operability_proves_broad_winter_availability: false,
      working_temperature_threshold_inferred: false,
      observed_capacity_proves_future_capacity: false,
      provider_billing_cpu_or_quota_inferred: false,
      recovery_success_inferred: false,
      price_sensitivity_inferred: false,
      southern_ontario_field_restriction_is_application_reliability_failure: false
    }),
    boundaries: Object.freeze({
      read_only: true,
      manual_refresh_only: true,
      automatic_allocation_or_margin_change_allowed: false,
      automatic_price_or_discount_change_allowed: false,
      automatic_booking_or_availability_change_allowed: false,
      automatic_public_winter_claim_allowed: false,
      automatic_capacity_or_scaling_change_allowed: false,
      automatic_provider_action_allowed: false,
      automatic_production_restore_allowed: false,
      accounting_or_inventory_posting_allowed: false,
      canonical_hold_mutation_allowed: false,
      schema_or_storage_mutation_allowed: false,
      outreach_allowed: false,
      permanent_polling_allowed: false
    })
  });
}

function clean(value) {
  return String(value ?? "").trim();
}
