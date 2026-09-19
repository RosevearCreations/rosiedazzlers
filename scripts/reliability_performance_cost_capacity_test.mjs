import assert from "node:assert/strict";
import { buildReliabilityPerformanceCostCapacity } from "../functions/api/_lib/reliability-performance-cost-capacity.js";

const stable = buildReliabilityPerformanceCostCapacity({
  diagnostics: {
    overall: "healthy",
    duration_ms: 900,
    checks: [{ status: "ok" }, { status: "ok" }]
  },
  traffic: { events_24h: 100, events_7d: 700 }
});
assert.equal(stable.build, 423);
assert.equal(stable.overall, "stable");
assert.equal(stable.diagnostics.state, "stable");
assert.equal(stable.traffic.state, "stable");
assert.equal(stable.boundaries.permanent_polling, false);
assert.equal(stable.boundaries.automatic_retry_expansion_allowed, false);
assert.equal(stable.truth_boundary.cloudflare_billing_or_cpu_usage_measured, false);
assert.equal(stable.truth_boundary.future_capacity_guaranteed, false);

const trafficPressure = buildReliabilityPerformanceCostCapacity({
  diagnostics: { overall: "healthy", duration_ms: 1200, checks: [] },
  traffic: { events_24h: 300, events_7d: 600 }
});
assert.equal(trafficPressure.traffic.state, "pressure");
assert.equal(trafficPressure.overall, "pressure");
assert.ok(trafficPressure.recommendations.includes("review_hot_public_paths_and_analytics_batching_before_scaling_reads"));

const diagnosticsPressure = buildReliabilityPerformanceCostCapacity({
  diagnostics: {
    overall: "degraded",
    duration_ms: 3200,
    checks: [{ status: "degraded" }]
  },
  traffic: { events_24h: 40, events_7d: 280 }
});
assert.equal(diagnosticsPressure.diagnostics.state, "pressure");
assert.equal(diagnosticsPressure.overall, "pressure");
assert.ok(diagnosticsPressure.recommendations.includes("reduce_dependency_calls_before_adding_new_runtime_reads"));
assert.ok(diagnosticsPressure.recommendations.includes("review_safe_cache_opportunities_for_non_authoritative_reads"));

const partial = buildReliabilityPerformanceCostCapacity({
  diagnostics: { overall: "healthy", duration_ms: 1000, checks: [] },
  traffic: {}
});
assert.equal(partial.overall, "partial");
assert.equal(partial.traffic.state, "unavailable");
assert.equal(partial.truth_boundary.cost_amount_inferred, false);

console.log("RELIABILITY / PERFORMANCE / COST CAPACITY TEST: PASS");
console.log(" - bounded Production diagnostics and first-party traffic counts are classified without inventing Cloudflare billing or CPU metrics");
console.log(" - pressure recommendations never enable polling, automatic retries, cache mutation or capacity scaling");
console.log(" - missing traffic evidence remains partial rather than fabricated");
