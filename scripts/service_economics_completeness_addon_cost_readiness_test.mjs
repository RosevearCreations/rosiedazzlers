#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildServiceEconomicsCompletenessAddOnCostReadiness } from "../functions/api/_lib/service-economics-completeness-addon-cost-readiness.js";

const complete = buildServiceEconomicsCompletenessAddOnCostReadiness({
  generated_at: "2026-09-21T04:00:00.000Z",
  economics: {
    totals: { booking_count: 2, ready_booking_count: 2, review_booking_count: 0, unavailable_booking_count: 0, cogs_variance_booking_count: 0, recognized_revenue_cad: 700, recorded_material_cost_cad: 120, estimated_direct_labor_cad: 180, pricing_review_contribution_cad: 400 },
    rows: [
      { package_code: "complete", evidence_status: "ready", revenue_evidence_status: "ready", material_evidence_status: "ready", labor_evidence_status: "ready", cash_evidence_status: "ready", cogs_reconciliation_status: "ready", recognized_revenue_cad: 400, pricing_review_contribution_cad: 235 },
      { package_code: "basic", evidence_status: "ready", revenue_evidence_status: "ready", material_evidence_status: "ready", labor_evidence_status: "ready", cash_evidence_status: "ready", cogs_reconciliation_status: "ready", recognized_revenue_cad: 300, pricing_review_contribution_cad: 165 }
    ]
  },
  fleet: {
    inquiry_demand: { inquiry_count: 1, vehicles_requested: 2 },
    commercial_rules: { unresolved_domain_count: 0, commercial_terms_complete: true },
    operations: {},
    capacity: { status: "observed", current_live_capacity_inferred: true }
  },
  pricing: {
    evidence_status: "observed",
    quotes: {
      rows_observed: 5, sent_quotes: 5, accepted_quotes: 3, declined_quotes: 1, possibly_truncated: false,
      value_bands: [{ key: "250_399", label: "$250-$399", sent_quotes: 5, accepted_quotes: 3, declined_quotes: 1, unresolved_quotes: 1, review_cohort_sufficient: true }]
    }
  },
  source_status: {
    service_economics: { available: true, restricted: false, http_status: 200 },
    fleet_commercial: { available: true, restricted: false, http_status: 200 },
    pricing_learning: { available: true, restricted: false, http_status: 200 }
  }
});

assert.equal(complete.release_enrichment_build, 463);
assert.equal(complete.release_authority, "service_economics_completeness_addon_cost_readiness");
assert.deepEqual(complete.retained_authorities, [428, 443, 451, 453]);
assert.equal(complete.economics.evidence_completeness.layers.material.ready_booking_count, 2);
assert.equal(complete.economics.evidence_completeness.layers.labor.ready_booking_count, 2);
assert.equal(complete.economics.evidence_completeness.layers.cash_refund.ready_booking_count, 2);
assert.equal(complete.economics.evidence_completeness.layers.cogs_reconciliation.ready_booking_count, 2);
assert.equal(complete.economics.evidence_completeness.service_margin_review_ready, true);
assert.equal(complete.economics.add_on_allocation_readiness.status, "unavailable");
assert.equal(complete.economics.add_on_allocation_readiness.defensible_allocation_ready, false);
assert.equal(complete.economics.evidence_completeness.add_on_margin_review_ready, false);
assert.equal(complete.truth_boundary.add_on_allocation_without_recorded_basis_allowed, false);
assert.equal(complete.boundaries.add_on_allocation_inference_allowed, false);
assert.ok(complete.review_candidates.some((row) => row.area === "add_on_cost_allocation_readiness" && row.state === "unavailable"));

const partial = buildServiceEconomicsCompletenessAddOnCostReadiness({
  economics: {
    totals: { booking_count: 2, ready_booking_count: 0, review_booking_count: 2, unavailable_booking_count: 0, cogs_variance_booking_count: 1 },
    rows: [
      { package_code: "basic", evidence_status: "review", revenue_evidence_status: "ready", material_evidence_status: "review", labor_evidence_status: "ready", cash_evidence_status: "review", cogs_reconciliation_status: "review" },
      { package_code: "complete", evidence_status: "review", revenue_evidence_status: "ready", material_evidence_status: "ready", labor_evidence_status: "unavailable", cash_evidence_status: "ready", cogs_reconciliation_status: "ready" }
    ]
  },
  source_status: {
    service_economics: { available: true, restricted: false, http_status: 200 },
    fleet_commercial: { available: false, restricted: false, http_status: 503 },
    pricing_learning: { available: false, restricted: false, http_status: 503 }
  }
});
assert.equal(partial.economics.evidence_completeness.layers.material.ready_booking_count, 1);
assert.equal(partial.economics.evidence_completeness.layers.material.review_booking_count, 1);
assert.equal(partial.economics.evidence_completeness.layers.labor.unavailable_booking_count, 1);
assert.equal(partial.economics.evidence_completeness.service_margin_review_ready, false);
assert.equal(partial.economics.evidence_completeness.pricing_context_review_ready, false);
assert.ok(partial.review_candidates.some((row) => row.area === "economics_completeness_material"));
assert.ok(partial.review_candidates.every((row) => row.automatic_action_authorized === false));

const futureExplicit = buildServiceEconomicsCompletenessAddOnCostReadiness({
  economics: {
    totals: { booking_count: 1, ready_booking_count: 1, review_booking_count: 0, unavailable_booking_count: 0, cogs_variance_booking_count: 0 },
    rows: [{ package_code: "basic", evidence_status: "ready", revenue_evidence_status: "ready", material_evidence_status: "ready", labor_evidence_status: "ready", cash_evidence_status: "ready", cogs_reconciliation_status: "ready" }],
    add_on_allocation_evidence: {
      recorded_basis: true,
      recorded_add_on_revenue: true,
      material_usage_linked_to_add_on: true,
      labor_time_linked_to_add_on: true,
      cash_refund_linked_to_add_on: true,
      posted_cogs_linked_to_add_on: true,
      allocation_method: "recorded_explicit_linkage"
    }
  },
  source_status: {
    service_economics: { available: true, restricted: false, http_status: 200 },
    fleet_commercial: { available: false, restricted: false, http_status: 503 },
    pricing_learning: { available: false, restricted: false, http_status: 503 }
  }
});
assert.equal(futureExplicit.economics.add_on_allocation_readiness.defensible_allocation_ready, true);
assert.equal(futureExplicit.economics.add_on_allocation_readiness.inferred_equal_split_allowed, false);
assert.equal(futureExplicit.economics.add_on_allocation_readiness.inferred_price_weighted_split_allowed, false);

console.log("BUILD 463 SERVICE ECONOMICS COMPLETENESS ADD-ON COST READINESS TEST: PASS");
