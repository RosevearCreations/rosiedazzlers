// Build 494 — Service Economics, Seasonal Operations & Reliability Review.
// Read-only reconciliation across retained evidence authorities. No new ledger, weather engine,
// capacity model, provider telemetry source or recovery engine is created.

export function buildServiceEconomicsSeasonalOperationsReliabilityReview({
  economics_review = {},
  reliability_review = {},
  source_status = {},
  generated_at = null
} = {}) {
  const allocation = economics_review?.economics?.allocation_evidence_closure || {};
  const capability = economics_review?.economics?.cold_weather_capability_matrix || {};
  const routing = economics_review?.economics?.weather_safe_routing || {};
  const capacity = economics_review?.capacity || {};
  const continuity = reliability_review?.continuity_review || {};

  const economicsSourceReady = sourceReady(source_status?.service_economics_review);
  const reliabilitySourceReady = sourceReady(source_status?.reliability_review);
  const allocationReady =
    allocation.status === "observed" &&
    allocation.service_package_closed === true &&
    allocation.add_on_closed === true;
  const seasonalCapabilityReady =
    capability.status === "observed" &&
    finiteNonNegative(capability.valid_row_count) > 0;
  const observedCapacity =
    clean(capacity.evidence_status).toLowerCase() === "observed" &&
    capacity.capacity_claim_allowed === true;
  const reliabilityContinuityReady =
    clean(continuity.status).toLowerCase() === "bounded_continuity_evidence_available";

  const domainReview = Object.freeze({
    service_add_on_allocation: Object.freeze({
      status: clean(allocation.status) || "unavailable",
      service_package_closed: allocation.service_package_closed === true,
      add_on_closed: allocation.add_on_closed === true,
      service_package_gap_count: finiteNonNegative(allocation.service_package_gap_count),
      add_on_gap_count: finiteNonNegative(allocation.add_on_gap_count),
      explicit_recorded_linkage_required: true,
      booking_total_allocation_inference_allowed: false,
      price_or_discount_change_authorized: false
    }),
    seasonal_operations: Object.freeze({
      status: clean(capability.status) || "unavailable",
      valid_capability_row_count: finiteNonNegative(capability.valid_row_count),
      gap_count: finiteNonNegative(capability.gap_count),
      cold_snap_capable_count: finiteNonNegative(capability?.counts?.cold_snap_capable),
      temperature_limited_outdoor_count: finiteNonNegative(capability?.counts?.temperature_limited_outdoor),
      controlled_environment_required_count: finiteNonNegative(capability?.counts?.controlled_environment_required),
      exact_temperature_limit_count: finiteNonNegative(capability?.counts?.exact_temperature_limit),
      weather_safe_routing_status: clean(routing.status) || "unavailable",
      exact_temperature_thresholds_inferred: false,
      broad_winter_availability_inferred: false,
      automatic_booking_or_route_change_authorized: false
    }),
    operational_capacity: Object.freeze({
      status: observedCapacity ? "observed" : "unavailable",
      retained_evidence_status: clean(capacity.evidence_status) || "unavailable",
      availability_authority: clean(capacity.availability_authority) || "/api/availability",
      collision_revalidation_authority: clean(capacity.collision_revalidation_authority) || "/api/checkout",
      observed_capacity_evidence_present: observedCapacity,
      demand_used_as_capacity_proxy: false,
      future_capacity_inferred: false,
      booking_slot_reserved: false
    }),
    reliability_continuity: Object.freeze({
      status: clean(continuity.status) || "unavailable",
      technical_availability_status: clean(continuity?.technical_availability?.status) || "unavailable",
      provider_cost_quota_status: clean(continuity?.provider_cost_quota?.status) || "unavailable",
      recovery_status: clean(continuity?.recovery?.status) || "unavailable",
      field_operability_status: clean(continuity?.field_operability?.status) || "unavailable",
      provider_billing_cpu_or_quota_inferred: false,
      recovery_success_inferred_from_source_runtime_green: false,
      field_operability_inferred_from_technical_availability: false,
      automatic_provider_or_recovery_action_authorized: false
    })
  });

  const gaps = [];
  if (!economicsSourceReady) gaps.push(gap("service_economics_review_source", "unavailable", "Retained Service Economics review source is unavailable.", "Restore the owning read-only economics authority; do not infer allocations, margin, capacity or seasonal capability."));
  if (!reliabilitySourceReady) gaps.push(gap("reliability_review_source", "unavailable", "Retained Reliability review source is unavailable.", "Restore the owning read-only reliability authority; do not infer provider cost, recovery success or technical continuity."));
  if (economicsSourceReady && !allocationReady) gaps.push(gap("service_add_on_allocation", "review", "Explicit service/add-on allocation evidence is not fully closed.", "Resolve only missing recorded revenue/material/labour/cash-refund/COGS linkage in the owning workflows."));
  if (economicsSourceReady && !seasonalCapabilityReady) gaps.push(gap("seasonal_capability", "review", "Southern Ontario cold-weather capability evidence is incomplete or unavailable.", "Keep winter capability bounded to explicit service/product/equipment/site/process evidence; do not invent temperature thresholds."));
  if (economicsSourceReady && !observedCapacity) gaps.push(gap("operational_capacity", "review", "Observed live capacity is not established by the retained authority.", "Use authoritative availability and checkout collision revalidation; inquiry demand or historical work does not prove live capacity."));
  if (reliabilitySourceReady && !reliabilityContinuityReady) gaps.push(gap("reliability_continuity", "review", "Comparable reliability continuity remains partial or insufficient.", "Keep first-party technical activity, provider-owned cost/quota evidence, recovery observations and field operability separate."));

  const sourcesReady = economicsSourceReady && reliabilitySourceReady;
  const reviewReady = sourcesReady && allocationReady && seasonalCapabilityReady && observedCapacity && reliabilityContinuityReady;
  const reviewStatus = !sourcesReady
    ? "evidence_sources_unavailable"
    : reviewReady
      ? "bounded_reconciliation_review_ready"
      : "bounded_reconciliation_review_required";

  return Object.freeze({
    build: 494,
    authority: "service_economics_seasonal_operations_reliability_review",
    mode: "read_only_cross_domain_reconciliation",
    generated_at: generated_at || new Date().toISOString(),
    review_status: reviewStatus,
    review_ready: reviewReady,
    domain_review: domainReview,
    review_gaps: Object.freeze(gaps),
    source_status: Object.freeze({ ...(source_status || {}) }),
    truth_boundary: Object.freeze({
      allocation_proves_seasonal_capability: false,
      seasonal_capability_proves_winter_availability: false,
      margin_or_revenue_proves_cold_weather_capability: false,
      inquiry_demand_proves_live_capacity: false,
      observed_capacity_proves_future_capacity: false,
      technical_activity_proves_provider_billing_cpu_or_quota: false,
      source_runtime_green_proves_recovery_success: false,
      reliability_continuity_proves_price_sensitivity: false,
      seasonal_restriction_is_application_reliability_failure: false,
      unrelated_evidence_may_close_missing_domain_evidence: false
    }),
    boundaries: Object.freeze({
      read_only: true,
      manual_refresh_only: true,
      aggregate_only: true,
      customer_identity_exposed: false,
      staff_identity_exposed: false,
      raw_booking_or_support_identifiers_exposed: false,
      automatic_allocation_allowed: false,
      automatic_price_or_discount_change_allowed: false,
      automatic_booking_or_availability_change_allowed: false,
      automatic_public_winter_claim_allowed: false,
      automatic_scaling_allowed: false,
      automatic_provider_action_allowed: false,
      automatic_production_restore_allowed: false,
      accounting_or_inventory_posting_allowed: false,
      schema_or_storage_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function gap(area, state, finding, bounded_operator_review) {
  return Object.freeze({
    area,
    state,
    finding,
    bounded_operator_review,
    automatic_action_authorized: false
  });
}
function clean(value) { return String(value ?? "").trim(); }
function sourceReady(value) { return value?.available === true && value?.restricted !== true; }
function finiteNonNegative(value) {
  if (value === null || value === undefined || String(value).trim() === "") return 0;
  const out = Number(value);
  return Number.isFinite(out) && out >= 0 ? out : 0;
}
