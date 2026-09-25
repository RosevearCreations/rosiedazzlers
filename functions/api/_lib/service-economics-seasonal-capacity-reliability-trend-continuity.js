// Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity.
// Read-only continuity over retained Build 494 evidence. A trend exists only from attributable
// like-for-like observations inside the same owning evidence class.
import { buildServiceEconomicsSeasonalOperationsReliabilityReview } from "./service-economics-seasonal-operations-reliability-review.js";

const SEASONAL_CLASSES = new Set(["cold_snap_capable","temperature_limited_outdoor","controlled_environment_required"]);

export function buildServiceEconomicsSeasonalCapacityReliabilityTrendContinuity({
  economics_review = {},
  reliability_review = {},
  source_status = {},
  generated_at = null
} = {}) {
  const retained = buildServiceEconomicsSeasonalOperationsReliabilityReview({
    economics_review,
    reliability_review,
    source_status,
    generated_at
  });

  const allocation = allocationContinuity(economics_review?.economics?.allocation_continuity_evidence || {});
  const seasonal = seasonalContinuity(economics_review?.economics?.seasonal_operability_continuity_evidence || {});
  const capacity = capacityContinuity(economics_review?.capacity?.observed_capacity_continuity_evidence || {});
  const technical = technicalReliabilityContinuity(reliability_review);
  const provider = reliability_review?.continuity_review?.provider_cost_quota || {};
  const recovery = reliability_review?.continuity_review?.recovery || {};

  const economicsSourceReady = sourceReady(source_status?.service_economics_review);
  const reliabilitySourceReady = sourceReady(source_status?.reliability_review);
  const sourcesReady = economicsSourceReady && reliabilitySourceReady;
  const reviewReady =
    sourcesReady &&
    allocation.comparable_window_evidence === true &&
    seasonal.comparable_window_evidence === true &&
    capacity.comparable_window_evidence === true &&
    technical.comparable_window_evidence === true;

  const gaps = [];
  if (!economicsSourceReady) gaps.push(gap("service_economics_review_source", "Restore the owning read-only Service Economics source; do not infer allocation, seasonal or capacity continuity."));
  if (!reliabilitySourceReady) gaps.push(gap("reliability_review_source", "Restore the owning read-only reliability source; do not infer technical, provider-cost or recovery continuity."));
  if (economicsSourceReady && !allocation.comparable_window_evidence) gaps.push(gap("explicit_allocation_continuity", "Record at least two attributable like-for-like explicit allocation observations for the same cohort before describing continuity."));
  if (economicsSourceReady && !seasonal.comparable_window_evidence) gaps.push(gap("seasonal_operability_continuity", "Retain at least two dated attributable service-specific operability observations; do not invent temperature thresholds or broad winter availability."));
  if (economicsSourceReady && !capacity.comparable_window_evidence) gaps.push(gap("observed_capacity_continuity", "Retain at least two attributable observed-capacity observations with the same metric and unit; demand is not a capacity proxy."));
  if (reliabilitySourceReady && !technical.comparable_window_evidence) gaps.push(gap("technical_reliability_continuity", "Use the retained bounded first-party technical window comparison; do not infer provider billing, quota, CPU, scaling need or future capacity."));

  return Object.freeze({
    build: 504,
    authority: "service_economics_seasonal_capacity_reliability_trend_continuity",
    mode: "read_only_same_domain_trend_continuity",
    generated_at: generated_at || new Date().toISOString(),
    review_status: !sourcesReady
      ? "evidence_sources_unavailable"
      : reviewReady
        ? "bounded_trend_continuity_review_ready"
        : "bounded_trend_continuity_review_required",
    review_ready: reviewReady,
    retained_build494_status: retained.review_status,
    domain_continuity: Object.freeze({
      explicit_allocation: allocation,
      seasonal_operability: seasonal,
      observed_capacity: capacity,
      technical_reliability: technical
    }),
    adjacent_external_evidence: Object.freeze({
      provider_cost_quota_status: clean(provider?.status) || "unavailable",
      recovery_status: clean(recovery?.status) || "unavailable",
      provider_cost_quota_part_of_cross_domain_inference: false,
      recovery_success_part_of_cross_domain_inference: false
    }),
    review_gaps: Object.freeze(gaps),
    source_status: Object.freeze({ ...(source_status || {}) }),
    truth_boundary: Object.freeze({
      unrelated_evidence_classes_joined_for_trend: false,
      allocation_continuity_proves_margin_trend: false,
      seasonal_operability_continuity_proves_broad_winter_availability: false,
      seasonal_history_infers_temperature_thresholds: false,
      observed_capacity_continuity_proves_future_capacity: false,
      inquiry_demand_used_as_capacity_proxy: false,
      technical_reliability_proves_provider_billing_cpu_or_quota: false,
      technical_reliability_proves_recovery_success: false,
      source_runtime_green_proves_recovery_success: false,
      provider_cost_or_quota_inferred: false,
      price_sensitivity_inferred: false,
      southern_ontario_field_restriction_is_application_reliability_failure: false
    }),
    boundaries: Object.freeze({
      read_only: true,
      manual_refresh_only: true,
      aggregate_only: true,
      automatic_allocation_allowed: false,
      automatic_price_or_discount_change_allowed: false,
      automatic_booking_or_availability_change_allowed: false,
      automatic_public_winter_claim_allowed: false,
      automatic_capacity_change_allowed: false,
      booking_slot_reserved: false,
      automatic_scaling_allowed: false,
      automatic_provider_action_allowed: false,
      automatic_production_restore_allowed: false,
      accounting_or_inventory_posting_allowed: false,
      schema_or_storage_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function allocationContinuity(evidence = {}) {
  const rows = validRows(evidence?.rows, normalizeAllocationRow);
  const groups = group(rows, (row) => row.cohort_kind + ":" + row.cohort_key);
  const comparable = [];
  for (const [key, values] of groups) {
    const sorted = byTime(values);
    if (sorted.length < 2) continue;
    const prior = sorted[sorted.length - 2];
    const current = sorted[sorted.length - 1];
    comparable.push(Object.freeze({
      cohort: key,
      prior_observed_at: prior.observed_at,
      current_observed_at: current.observed_at,
      prior_explicit_linkage_complete: prior.explicit_linkage_complete,
      current_explicit_linkage_complete: current.explicit_linkage_complete,
      direction: prior.explicit_linkage_complete === current.explicit_linkage_complete ? "unchanged_recorded_state" : "recorded_state_changed",
      margin_trend_inferred: false
    }));
  }
  return Object.freeze({
    status: comparable.length ? "comparable_explicit_allocation_continuity_observed" : "insufficient_comparable_allocation_history",
    recorded_row_count: Array.isArray(evidence?.rows) ? evidence.rows.length : 0,
    valid_attributable_row_count: rows.length,
    comparable_cohort_count: comparable.length,
    comparable_window_evidence: comparable.length > 0,
    comparisons: Object.freeze(comparable),
    explicit_recorded_linkage_required: true,
    booking_total_or_equal_split_used_as_proxy: false,
    margin_trend_inferred: false
  });
}

function seasonalContinuity(evidence = {}) {
  const rows = validRows(evidence?.rows, normalizeSeasonalRow);
  const groups = group(rows, (row) => row.service_code);
  const comparable = [];
  for (const [serviceCode, values] of groups) {
    const sorted = byTime(values);
    if (sorted.length < 2) continue;
    const prior = sorted[sorted.length - 2];
    const current = sorted[sorted.length - 1];
    comparable.push(Object.freeze({
      service_code: serviceCode,
      prior_observed_at: prior.observed_at,
      current_observed_at: current.observed_at,
      prior_classification: prior.classification,
      current_classification: current.classification,
      direction: prior.classification === current.classification ? "classification_unchanged" : "recorded_classification_changed",
      exact_temperature_threshold_inferred: false,
      broad_winter_availability_inferred: false
    }));
  }
  return Object.freeze({
    status: comparable.length ? "comparable_seasonal_operability_continuity_observed" : "insufficient_comparable_seasonal_history",
    recorded_row_count: Array.isArray(evidence?.rows) ? evidence.rows.length : 0,
    valid_attributable_row_count: rows.length,
    comparable_service_count: comparable.length,
    comparable_window_evidence: comparable.length > 0,
    comparisons: Object.freeze(comparable),
    allowed_classifications: Object.freeze([...SEASONAL_CLASSES]),
    exact_temperature_thresholds_inferred: false,
    broad_winter_availability_inferred: false,
    technical_availability_used_as_field_operability_proxy: false
  });
}

function capacityContinuity(evidence = {}) {
  const rows = validRows(evidence?.rows, normalizeCapacityRow);
  const groups = group(rows, (row) => row.metric + ":" + row.unit);
  const comparable = [];
  for (const [metricKey, values] of groups) {
    const sorted = byTime(values);
    if (sorted.length < 2) continue;
    const prior = sorted[sorted.length - 2];
    const current = sorted[sorted.length - 1];
    comparable.push(Object.freeze({
      metric: metricKey,
      prior_observed_at: prior.observed_at,
      current_observed_at: current.observed_at,
      prior_value: prior.value,
      current_value: current.value,
      delta: round2(current.value - prior.value),
      direction: current.value > prior.value ? "higher_recorded_observation" : current.value < prior.value ? "lower_recorded_observation" : "unchanged_recorded_observation",
      future_capacity_inferred: false
    }));
  }
  return Object.freeze({
    status: comparable.length ? "comparable_observed_capacity_continuity_observed" : "insufficient_comparable_capacity_history",
    recorded_row_count: Array.isArray(evidence?.rows) ? evidence.rows.length : 0,
    valid_attributable_row_count: rows.length,
    comparable_metric_count: comparable.length,
    comparable_window_evidence: comparable.length > 0,
    comparisons: Object.freeze(comparable),
    demand_used_as_capacity_proxy: false,
    future_capacity_inferred: false,
    booking_slot_reserved: false
  });
}

function technicalReliabilityContinuity(reliability = {}) {
  const traffic = reliability?.trend_review?.first_party_traffic || {};
  const comparable = traffic.comparable_window_evidence === true;
  return Object.freeze({
    status: comparable ? "bounded_first_party_technical_continuity_observed" : "insufficient_comparable_technical_history",
    comparable_window_evidence: comparable,
    current_window: clean(traffic.current_window) || null,
    comparison_window: clean(traffic.comparison_window) || null,
    current_events_24h: finiteNonNegative(traffic.current_events_24h),
    prior_six_day_average: finiteNonNegative(traffic.prior_six_day_average),
    recent_to_prior_ratio: finiteNonNegative(traffic.recent_to_prior_ratio),
    direction: comparable ? (clean(traffic.direction) || "descriptive_direction_unavailable") : "insufficient_comparable_evidence",
    first_party_only: true,
    provider_billing_cpu_or_quota_inferred: false,
    recovery_success_inferred: false,
    scaling_need_established: false,
    future_capacity_established: false,
    causal_explanation_established: false
  });
}

function normalizeAllocationRow(row = {}) {
  const observed_at = iso(row.observed_at);
  const cohort_kind = clean(row.cohort_kind).toLowerCase();
  const cohort_key = clean(row.cohort_key || row.package_code || row.add_on_code);
  const source_reference = clean(row.source_reference || row.evidence_reference);
  if (!observed_at || !["service_package","add_on"].includes(cohort_kind) || !cohort_key || !source_reference) return null;
  return Object.freeze({ observed_at, cohort_kind, cohort_key, source_reference, explicit_linkage_complete: row.explicit_linkage_complete === true });
}
function normalizeSeasonalRow(row = {}) {
  const observed_at = iso(row.observed_at);
  const service_code = clean(row.service_code || row.package_code || row.add_on_code);
  const classification = clean(row.classification).toLowerCase();
  const source_reference = clean(row.source_reference || row.evidence_reference || row.evidence_source);
  if (!observed_at || !service_code || !SEASONAL_CLASSES.has(classification) || !source_reference) return null;
  return Object.freeze({ observed_at, service_code, classification, source_reference });
}
function normalizeCapacityRow(row = {}) {
  const observed_at = iso(row.observed_at);
  const metric = clean(row.metric).toLowerCase();
  const unit = clean(row.unit).toLowerCase();
  const value = finiteNonNegative(row.value);
  const source_reference = clean(row.source_reference || row.evidence_reference);
  if (!observed_at || !metric || !unit || value == null || !source_reference || row.live_observation !== true) return null;
  return Object.freeze({ observed_at, metric, unit, value, source_reference, live_observation: true });
}
function validRows(rows, normalizer) { return (Array.isArray(rows) ? rows : []).map(normalizer).filter(Boolean); }
function group(rows, keyer) { const out = new Map(); for (const row of rows) { const key = keyer(row); if (!out.has(key)) out.set(key, []); out.get(key).push(row); } return out; }
function byTime(rows) { return [...rows].sort((a,b) => Date.parse(a.observed_at) - Date.parse(b.observed_at)); }
function gap(area, bounded_operator_review) { return Object.freeze({ area, state:"review", bounded_operator_review, automatic_action_authorized:false }); }
function sourceReady(value) { return value?.available === true && value?.restricted !== true; }
function clean(value) { return String(value ?? "").trim(); }
function iso(value) { const t = Date.parse(String(value ?? "").trim()); return Number.isFinite(t) ? new Date(t).toISOString() : null; }
function finiteNonNegative(value) { if (value === null || value === undefined || String(value).trim() === "") return null; const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : null; }
function round2(value) { return Math.round(value * 100) / 100; }
