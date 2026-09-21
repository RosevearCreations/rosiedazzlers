// Build 463 — additive economics-completeness and add-on cost-readiness authority.
import { buildServiceEconomicsCapacityPricingReview } from "./service-economics-commercial-capacity-review.js";

function n(value) {
  const out = Number(value);
  return Number.isFinite(out) ? out : 0;
}
function clean(value) {
  return String(value ?? "").trim();
}
function sourceAvailable(source) {
  return source?.available === true && source?.restricted !== true;
}
function normalizedStatus(value) {
  const status = clean(value).toLowerCase();
  return status === "ready" || status === "observed"
    ? "ready"
    : status === "review" || status === "partial"
      ? "review"
      : "unavailable";
}
function summarizeLayer(rows, sourceKey, key, label) {
  const list = Array.isArray(rows) ? rows : [];
  const counts = { ready: 0, review: 0, unavailable: 0 };
  for (const row of list) counts[normalizedStatus(row?.[sourceKey])] += 1;
  const total = list.length;
  const completePct = total > 0 ? Math.round((counts.ready / total) * 1000) / 10 : null;
  const status = total === 0
    ? "unavailable"
    : counts.ready === total
      ? "observed"
      : counts.ready > 0 || counts.review > 0
        ? "review"
        : "unavailable";
  return {
    key,
    label,
    status,
    booking_count: total,
    ready_booking_count: counts.ready,
    review_booking_count: counts.review,
    unavailable_booking_count: counts.unavailable,
    completeness_pct: completePct,
    all_observed_jobs_ready: total > 0 && counts.ready === total
  };
}
function addOnAllocationReadiness(economics) {
  const evidence = economics?.add_on_allocation_evidence || {};
  const components = {
    recorded_add_on_revenue: evidence.recorded_add_on_revenue === true,
    material_usage_linked_to_add_on: evidence.material_usage_linked_to_add_on === true,
    labor_time_linked_to_add_on: evidence.labor_time_linked_to_add_on === true,
    cash_refund_linked_to_add_on: evidence.cash_refund_linked_to_add_on === true,
    posted_cogs_linked_to_add_on: evidence.posted_cogs_linked_to_add_on === true
  };
  const recordedBasis = evidence.recorded_basis === true;
  const allComponentsReady = Object.values(components).every(Boolean);
  const ready = recordedBasis && allComponentsReady;
  const status = ready ? "observed" : recordedBasis ? "review" : "unavailable";
  const missingComponents = Object.entries(components).filter(([, value]) => !value).map(([key]) => key);
  return {
    status,
    recorded_basis_present: recordedBasis,
    required_components: components,
    missing_components: missingComponents,
    defensible_allocation_ready: ready,
    allocation_method: ready ? clean(evidence.allocation_method) || "recorded_explicit_linkage" : null,
    add_on_margin_review_ready: ready,
    inferred_equal_split_allowed: false,
    inferred_price_weighted_split_allowed: false,
    inferred_booking_cost_division_allowed: false,
    source_schema_mutation_authorized: false,
    reason: ready
      ? "Explicit recorded add-on revenue, material, labour, cash/refund and posted COGS linkages are present for bounded review."
      : recordedBasis
        ? "An explicit recorded allocation basis is present, but one or more required add-on evidence linkages are missing."
        : "Retained job-level profitability evidence has no explicit recorded add-on allocation basis; add-on margin remains unavailable rather than inferred."
  };
}
function candidate(area, state, finding, bounded_operator_review, dependency) {
  return { area, state, finding, bounded_operator_review, dependency, automatic_action_authorized: false };
}

export function buildServiceEconomicsCompletenessAddOnCostReadiness({
  economics = {},
  fleet = {},
  pricing = {},
  source_status = {},
  generated_at = null
} = {}) {
  const base = buildServiceEconomicsCapacityPricingReview({
    economics,
    fleet,
    pricing,
    source_status,
    generated_at
  });
  const rows = Array.isArray(economics?.rows) ? economics.rows : [];
  const bookingCount = rows.length;
  const layers = {
    recorded_revenue: summarizeLayer(rows, "revenue_evidence_status", "recorded_revenue", "Recorded revenue"),
    material: summarizeLayer(rows, "material_evidence_status", "material", "Material / job-use cost"),
    labor: summarizeLayer(rows, "labor_evidence_status", "labor", "Logged labour + recorded rate"),
    cash_refund: summarizeLayer(rows, "cash_evidence_status", "cash_refund", "Collected cash / balance / refund"),
    cogs_reconciliation: summarizeLayer(rows, "cogs_reconciliation_status", "cogs_reconciliation", "Posted COGS reconciliation")
  };
  const requiredForMargin = [layers.recorded_revenue, layers.material, layers.labor, layers.cash_refund, layers.cogs_reconciliation];
  const allRequiredReady = bookingCount > 0 && requiredForMargin.every((row) => row.all_observed_jobs_ready === true);
  const serviceMarginReviewReady = allRequiredReady && base.economics?.contribution_reliable_for_review === true;
  const addOnReadiness = addOnAllocationReadiness(economics);

  const completeness = {
    booking_count: bookingCount,
    layers,
    all_required_layers_ready: allRequiredReady,
    service_margin_review_ready: serviceMarginReviewReady,
    package_cohort_review_ready: serviceMarginReviewReady,
    add_on_margin_review_ready: serviceMarginReviewReady && addOnReadiness.defensible_allocation_ready,
    pricing_context_review_ready: serviceMarginReviewReady && base.pricing_review?.review_ready === true,
    pricing_decision_authorized: false,
    automatic_margin_conclusion_authorized: false
  };

  const candidates = (base.review_candidates || []).filter((row) => row?.area !== "add_on_cost_attribution");
  for (const layer of requiredForMargin) {
    if (layer.all_observed_jobs_ready) continue;
    const state = bookingCount === 0 || layer.status === "unavailable" ? "unavailable" : "review";
    candidates.push(candidate(
      "economics_completeness_" + layer.key,
      state,
      bookingCount === 0
        ? "No completed-job rows are available for " + layer.label.toLowerCase() + " completeness review."
        : layer.ready_booking_count + " of " + layer.booking_count + " observed job(s) have ready " + layer.label.toLowerCase() + " evidence.",
      "Resolve only the missing recorded evidence in the owning Finance, inventory, staff-time or accounting workflow. Do not fill gaps with assumed cost, zero labour, inferred cash/refund state or synthetic COGS.",
      "observed_evidence"
    ));
  }
  if (serviceMarginReviewReady) {
    candidates.push(candidate(
      "service_margin_readiness",
      "observed",
      "All required retained economics layers are ready across the bounded observed job sample.",
      "Service/package contribution may be reviewed as recorded evidence only. Keep overhead estimates, quote context and causal pricing conclusions separate.",
      "owner_action"
    ));
  } else {
    candidates.push(candidate(
      "service_margin_readiness",
      bookingCount > 0 ? "review" : "unavailable",
      "Service/package margin review is blocked until every required retained economics layer is complete for the bounded observed sample.",
      "Complete recorded revenue, material, labour, cash/refund and COGS reconciliation evidence before relying on contribution or margin figures.",
      "observed_evidence"
    ));
  }
  candidates.push(candidate(
    "add_on_cost_allocation_readiness",
    addOnReadiness.status,
    addOnReadiness.reason,
    addOnReadiness.defensible_allocation_ready
      ? "Review explicit recorded add-on allocations only; no price or discount change follows automatically."
      : "Keep add-on margin unavailable. Do not divide booking-level material, labour, cash/refund or COGS by count, price, percentage or equal split without an owning recorded allocation source.",
    addOnReadiness.defensible_allocation_ready ? "owner_action" : "internal_evidence"
  ));

  const economicsSourceReady = sourceAvailable(source_status?.service_economics);
  const economicsEvidenceStatus = !economicsSourceReady
    ? "partial"
    : serviceMarginReviewReady && addOnReadiness.defensible_allocation_ready
      ? "observed"
      : "review";
  const evidenceStatus = base.evidence_status === "partial" || economicsEvidenceStatus === "partial"
    ? "partial"
    : base.evidence_status === "observed" && economicsEvidenceStatus === "observed"
      ? "observed"
      : "review";

  return {
    ...base,
    release_enrichment_build: 463,
    release_authority: "service_economics_completeness_addon_cost_readiness",
    retained_authorities: [428, 443, 451, 453],
    generated_at: generated_at || base.generated_at || new Date().toISOString(),
    evidence_status: evidenceStatus,
    economics: {
      ...base.economics,
      evidence_completeness: completeness,
      add_on_allocation_readiness: addOnReadiness,
      add_on_cost_attribution_status: addOnReadiness.status,
      add_on_margin_inferred: false
    },
    review_candidates: candidates,
    truth_boundary: {
      ...base.truth_boundary,
      incomplete_material_allows_margin_conclusion: false,
      incomplete_labor_allows_margin_conclusion: false,
      incomplete_cash_refund_allows_margin_conclusion: false,
      incomplete_cogs_allows_margin_conclusion: false,
      add_on_allocation_without_recorded_basis_allowed: false,
      add_on_margin_without_recorded_linkage_allowed: false
    },
    boundaries: {
      ...base.boundaries,
      read_only: true,
      aggregate_only: true,
      add_on_allocation_inference_allowed: false,
      synthetic_cost_fill_allowed: false,
      automatic_margin_conclusion_allowed: false,
      automatic_price_change_allowed: false,
      automatic_discount_allowed: false,
      schema_mutation_allowed: false
    }
  };
}
