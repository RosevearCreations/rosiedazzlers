const DEFAULT_THRESHOLDS = Object.freeze({
  diagnostics_watch_ms: 1800,
  diagnostics_pressure_ms: 3000,
  traffic_growth_watch_ratio: 1.5,
  traffic_growth_pressure_ratio: 2.25
});

export function buildReliabilityPerformanceCostCapacity(input = {}) {
  const diagnostics = objectOrEmpty(input.diagnostics);
  const traffic = objectOrEmpty(input.traffic);
  const thresholds = { ...DEFAULT_THRESHOLDS, ...objectOrEmpty(input.thresholds) };

  const diagnosticDuration = finiteNonNegative(diagnostics.duration_ms);
  const diagnosticState = classifyDiagnostics(diagnostics, diagnosticDuration, thresholds);
  const trafficState = classifyTraffic(traffic, thresholds);
  const recommendations = [];

  if (diagnosticState.state === "pressure") {
    recommendations.push("reduce_dependency_calls_before_adding_new_runtime_reads");
    recommendations.push("review_safe_cache_opportunities_for_non_authoritative_reads");
  } else if (diagnosticState.state === "watch") {
    recommendations.push("review_slowest_bounded_dependency_paths");
  }

  if (trafficState.state === "pressure") {
    recommendations.push("review_hot_public_paths_and_analytics_batching_before_scaling_reads");
  } else if (trafficState.state === "watch") {
    recommendations.push("compare_traffic_growth_against_request_and_error_diagnostics");
  }

  if (diagnostics.overall === "failed") {
    recommendations.push("resolve_runtime_failure_before_capacity_tuning");
  } else if (diagnostics.overall === "degraded") {
    recommendations.push("resolve_degraded_dependency_before_expanding_runtime_work");
  }

  const overall = diagnostics.overall === "failed"
    ? "critical"
    : diagnosticState.state === "pressure" || trafficState.state === "pressure"
      ? "pressure"
      : diagnosticState.state === "watch" || trafficState.state === "watch" || diagnostics.overall === "degraded"
        ? "watch"
        : trafficState.state === "unavailable"
          ? "partial"
          : "stable";

  return Object.freeze({
    build: 423,
    mode: "reliability_performance_cost_capacity",
    overall,
    diagnostics: Object.freeze(diagnosticState),
    traffic: Object.freeze(trafficState),
    recommendations: Object.freeze(unique(recommendations)),
    thresholds: Object.freeze({
      diagnostics_watch_ms: thresholds.diagnostics_watch_ms,
      diagnostics_pressure_ms: thresholds.diagnostics_pressure_ms,
      traffic_growth_watch_ratio: thresholds.traffic_growth_watch_ratio,
      traffic_growth_pressure_ratio: thresholds.traffic_growth_pressure_ratio
    }),
    truth_boundary: Object.freeze({
      cloudflare_billing_or_cpu_usage_measured: false,
      cost_amount_inferred: false,
      future_capacity_guaranteed: false,
      single_snapshot_is_capacity_forecast: false,
      production_traffic_counts_are_first_party_only: true
    }),
    boundaries: Object.freeze({
      read_only: true,
      manual_refresh_only: true,
      permanent_polling: false,
      automatic_retry_expansion_allowed: false,
      automatic_cache_policy_mutation_allowed: false,
      automatic_capacity_scaling_allowed: false,
      provider_mutation_allowed: false,
      business_mutation_allowed: false,
      schema_authority: false
    })
  });
}

function classifyDiagnostics(diagnostics, duration, thresholds) {
  if (!diagnostics || Object.keys(diagnostics).length === 0) {
    return { state: "unavailable", overall: "unavailable", duration_ms: null, failed_checks: 0, degraded_checks: 0 };
  }
  const checks = Array.isArray(diagnostics.checks) ? diagnostics.checks : [];
  const failed = checks.filter((row) => clean(row?.status) === "failed").length;
  const degraded = checks.filter((row) => clean(row?.status) === "degraded").length;
  let state = "stable";
  if (failed > 0 || diagnostics.overall === "failed") state = "pressure";
  else if (duration !== null && duration >= thresholds.diagnostics_pressure_ms) state = "pressure";
  else if (degraded > 0 || diagnostics.overall === "degraded" || (duration !== null && duration >= thresholds.diagnostics_watch_ms)) state = "watch";
  return {
    state,
    overall: clean(diagnostics.overall) || "unavailable",
    duration_ms: duration,
    failed_checks: failed,
    degraded_checks: degraded
  };
}

function classifyTraffic(traffic, thresholds) {
  const day = finiteNonNegative(traffic.events_24h);
  const week = finiteNonNegative(traffic.events_7d);
  if (day === null || week === null) {
    return {
      state: "unavailable",
      events_24h: day,
      events_7d: week,
      prior_six_day_average: null,
      recent_to_prior_ratio: null
    };
  }

  const priorSixDays = Math.max(0, week - day);
  const priorAverage = priorSixDays / 6;
  const ratio = priorAverage > 0 ? day / priorAverage : day > 0 ? null : 1;
  let state = "stable";
  if (ratio !== null && ratio >= thresholds.traffic_growth_pressure_ratio) state = "pressure";
  else if (ratio !== null && ratio >= thresholds.traffic_growth_watch_ratio) state = "watch";

  return {
    state,
    events_24h: day,
    events_7d: week,
    prior_six_day_average: round2(priorAverage),
    recent_to_prior_ratio: ratio === null ? null : round2(ratio)
  };
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function finiteNonNegative(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function round2(value) { return Math.round(value * 100) / 100; }
function clean(value) { return String(value ?? "").trim().toLowerCase(); }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
