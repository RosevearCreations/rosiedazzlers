// Build 474 — Reliability, Cost & Resilience Trend Review.
// Additive read-only trend enrichment over the retained Build 464 operational guardrails.
import { buildReliabilityCostResilienceOperationalGuardrails } from "./reliability-cost-resilience-operational-guardrails.js";

const HIGHER_RATIO = 1.25;
const LOWER_RATIO = 0.80;

export function buildReliabilityCostResilienceTrendReview({
  reassessment = {},
  reliability = {},
  generated_at = null
} = {}) {
  const base = buildReliabilityCostResilienceOperationalGuardrails({ reassessment, generated_at });
  const traffic = buildFirstPartyTrafficTrend(reliability, base);
  const diagnostics = buildSingleSnapshotSignal("diagnostics", {
    current_state: clean(reliability?.diagnostics?.state) || bucketState(base, "reliability:diagnostics"),
    current_duration_ms: finiteNonNegative(reliability?.diagnostics?.duration_ms) ?? finiteNonNegative(base?.metrics?.diagnostics_duration_ms),
    current_failed_checks: finiteNonNegative(reliability?.diagnostics?.failed_checks) ?? finiteNonNegative(base?.metrics?.diagnostics_failed_checks),
    current_degraded_checks: finiteNonNegative(reliability?.diagnostics?.degraded_checks) ?? finiteNonNegative(base?.metrics?.diagnostics_degraded_checks)
  }, "Diagnostics have one current bounded snapshot; no comparable retained historical series is available to establish a direction.");
  const evidenceFreshness = buildSingleSnapshotSignal("evidence_freshness", {
    current_count: finiteNonNegative(base?.evidence_age_review?.current_count),
    aging_count: finiteNonNegative(base?.evidence_age_review?.aging_count),
    stale_count: finiteNonNegative(base?.evidence_age_review?.stale_count),
    undated_count: finiteNonNegative(base?.evidence_age_review?.undated_count)
  }, "Evidence-age distribution is a current classification, not a longitudinal trend without comparable prior snapshots.");
  const providerCost = externalSignal(
    "provider_cost_quota",
    "Cloudflare billing, CPU, quota and dollar-cost trend remain unavailable without provider-owned comparable evidence."
  );
  const recovery = externalSignal(
    "real_recovery_resilience",
    "Source readiness and drill metadata do not establish a trend in real Production recovery outcomes."
  );

  const signals = Object.freeze([traffic, diagnostics, evidenceFreshness, providerCost, recovery]);
  const comparable = signals.filter((row) => row.comparable_window_evidence === true);
  const trendReviewStatus = comparable.length > 0 ? "bounded_first_party_trend_available" : "insufficient_comparable_evidence";

  return Object.freeze({
    ...base,
    trend_enrichment_build: 474,
    trend_authority: "reliability_cost_resilience_trend_review",
    retained_trend_authority: "reliability_cost_resilience_operational_guardrails",
    trend_review: Object.freeze({
      status: trendReviewStatus,
      comparable_signal_count: comparable.length,
      signal_count: signals.length,
      signals,
      first_party_traffic: traffic,
      diagnostics,
      evidence_freshness: evidenceFreshness,
      provider_cost_quota: providerCost,
      real_recovery_resilience: recovery,
      scaling_need_established: false,
      provider_cost_trend_established: false,
      real_recovery_trend_established: false,
      forecast_established: false,
      automatic_action_authorized: false
    }),
    truth_boundary: Object.freeze({
      ...(base?.truth_boundary || {}),
      bounded_window_comparison_is_capacity_forecast: false,
      traffic_direction_proves_scaling_need: false,
      traffic_direction_proves_provider_cost: false,
      diagnostics_single_snapshot_proves_trend: false,
      evidence_age_distribution_proves_trend: false,
      source_readiness_proves_recovery_trend: false,
      cloudflare_provider_cost_trend_observed: false
    }),
    boundaries: Object.freeze({
      ...(base?.boundaries || {}),
      read_only: true,
      manual_refresh_only: true,
      permanent_polling: false,
      trend_storage_mutation_allowed: false,
      automatic_scaling_allowed: false,
      automatic_retry_expansion_allowed: false,
      cache_policy_mutation_allowed: false,
      provider_mutation_allowed: false,
      production_restore_allowed: false,
      schema_migration_allowed: false,
      business_mutation_allowed: false
    })
  });
}

function buildFirstPartyTrafficTrend(reliability, base) {
  const traffic = reliability?.traffic || {};
  const current24 = finiteNonNegative(traffic?.events_24h) ?? finiteNonNegative(base?.metrics?.traffic_events_24h);
  const week = finiteNonNegative(traffic?.events_7d) ?? finiteNonNegative(base?.metrics?.traffic_events_7d);
  const priorAverageFromSource = finiteNonNegative(traffic?.prior_six_day_average);
  const priorAverage = priorAverageFromSource ?? (
    current24 != null && week != null ? round2(Math.max(0, week - current24) / 6) : null
  );
  const sourceRatio = finiteNonNegative(traffic?.recent_to_prior_ratio) ?? finiteNonNegative(base?.metrics?.traffic_recent_to_prior_ratio);
  const ratio = sourceRatio ?? (
    current24 != null && priorAverage != null && priorAverage > 0
      ? round2(current24 / priorAverage)
      : current24 === 0 && priorAverage === 0 ? 1 : null
  );
  const comparable = current24 != null && week != null && priorAverage != null && ratio != null;
  let direction = "insufficient_comparable_evidence";
  if (comparable) {
    direction = ratio >= HIGHER_RATIO
      ? "higher_than_prior_six_day_average"
      : ratio <= LOWER_RATIO
        ? "lower_than_prior_six_day_average"
        : "within_comparable_band";
  }
  return Object.freeze({
    id: "first_party_traffic_window",
    source: "reliability_performance_cost_capacity",
    status: comparable ? "observed_bounded_window_comparison" : "insufficient_comparable_evidence",
    comparable_window_evidence: comparable,
    current_window: "most_recent_24h",
    comparison_window: "preceding_six_day_daily_average",
    current_events_24h: current24,
    events_7d: week,
    prior_six_day_average: priorAverage,
    recent_to_prior_ratio: ratio,
    direction,
    threshold_higher_ratio: HIGHER_RATIO,
    threshold_lower_ratio: LOWER_RATIO,
    first_party_only: true,
    provider_metric: false,
    scaling_need_established: false,
    provider_cost_established: false,
    future_capacity_established: false,
    causal_explanation_established: false,
    conclusion: comparable
      ? "A bounded first-party activity window comparison is observed. Direction is descriptive only and does not establish provider cost, scaling need, root cause or future capacity."
      : "Comparable first-party traffic windows are incomplete; no traffic direction is established."
  });
}

function buildSingleSnapshotSignal(id, current, conclusion) {
  return Object.freeze({
    id,
    source: "retained_current_snapshot",
    status: "insufficient_comparable_history",
    comparable_window_evidence: false,
    current_snapshot: Object.freeze(current),
    trend_established: false,
    conclusion
  });
}
function externalSignal(id, conclusion) {
  return Object.freeze({
    id,
    source: "external_owning_evidence_required",
    status: "external_evidence_required",
    comparable_window_evidence: false,
    trend_established: false,
    conclusion
  });
}
function bucketState(base, id) {
  for (const rows of Object.values(base?.buckets || {})) {
    const hit = Array.isArray(rows) ? rows.find((row) => row?.id === id) : null;
    if (hit) return clean(hit.state);
  }
  return "";
}
function clean(value) { return String(value ?? "").trim().toLowerCase(); }
function finiteNonNegative(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const out = Number(value);
  return Number.isFinite(out) && out >= 0 ? out : null;
}
function round2(value) { return Math.round(value * 100) / 100; }
