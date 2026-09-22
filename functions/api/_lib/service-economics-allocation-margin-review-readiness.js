// Build 473 — additive service economics allocation & margin-review readiness authority.
import { buildServiceEconomicsCompletenessAddOnCostReadiness } from "./service-economics-completeness-addon-cost-readiness.js";

const COMPONENT_KEYS = ["revenue", "material", "labor", "cash_refund", "cogs"];

function clean(value) { return String(value ?? "").trim(); }
function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const out = Number(value);
  return Number.isFinite(out) ? out : null;
}
function money(value) {
  const out = finite(value);
  return out == null ? null : Math.round(out * 100) / 100;
}
function readyStatus(value) { return clean(value).toLowerCase() === "ready"; }
function explicitFlag(row, flagKey, statusKey) {
  return row?.[flagKey] === true || readyStatus(row?.[statusKey]);
}
function candidate(area, state, finding, bounded_operator_review, dependency) {
  return { area, state, finding, bounded_operator_review, dependency, automatic_action_authorized: false };
}

function servicePackageAllocation(economics = {}) {
  const rows = Array.isArray(economics?.rows) ? economics.rows : [];
  const cohorts = new Map();
  let unclassified = 0;
  let fullyLinked = 0;

  for (const row of rows) {
    const packageCode = clean(row?.package_code);
    if (!packageCode) { unclassified += 1; continue; }
    const components = {
      revenue: readyStatus(row?.revenue_evidence_status) && finite(row?.recognized_revenue_cad) != null,
      material: readyStatus(row?.material_evidence_status) && finite(row?.recorded_material_cost_cad) != null,
      labor: readyStatus(row?.labor_evidence_status) && finite(row?.estimated_direct_labor_cad) != null,
      cash_refund: readyStatus(row?.cash_evidence_status),
      cogs: readyStatus(row?.cogs_reconciliation_status) && finite(row?.direct_cogs_cad) != null
    };
    const allLinked = COMPONENT_KEYS.every((key) => components[key] === true);
    if (allLinked) fullyLinked += 1;

    const current = cohorts.get(packageCode) || {
      package_code: packageCode,
      booking_count: 0,
      allocation_ready_booking_count: 0,
      component_linked_booking_counts: { revenue: 0, material: 0, labor: 0, cash_refund: 0, cogs: 0 },
      recognized_revenue_cad: 0,
      recorded_material_cost_cad: 0,
      recorded_direct_labor_cad: 0,
      recorded_cogs_cad: 0,
      contribution_cad: 0,
      contribution_row_count: 0
    };
    current.booking_count += 1;
    if (allLinked) current.allocation_ready_booking_count += 1;
    for (const key of COMPONENT_KEYS) if (components[key]) current.component_linked_booking_counts[key] += 1;
    const revenue = finite(row?.recognized_revenue_cad);
    const material = finite(row?.recorded_material_cost_cad);
    const labor = finite(row?.estimated_direct_labor_cad);
    const cogs = finite(row?.direct_cogs_cad);
    const contribution = finite(row?.pricing_review_contribution_cad);
    if (revenue != null) current.recognized_revenue_cad += revenue;
    if (material != null) current.recorded_material_cost_cad += material;
    if (labor != null) current.recorded_direct_labor_cad += labor;
    if (cogs != null) current.recorded_cogs_cad += cogs;
    if (allLinked && contribution != null) {
      current.contribution_cad += contribution;
      current.contribution_row_count += 1;
    }
    cohorts.set(packageCode, current);
  }

  const items = [...cohorts.values()].map((row) => {
    const marginReady =
      row.booking_count > 0 &&
      row.allocation_ready_booking_count === row.booking_count &&
      row.contribution_row_count === row.booking_count;
    return {
      ...row,
      recognized_revenue_cad: money(row.recognized_revenue_cad),
      recorded_material_cost_cad: money(row.recorded_material_cost_cad),
      recorded_direct_labor_cad: money(row.recorded_direct_labor_cad),
      recorded_cogs_cad: money(row.recorded_cogs_cad),
      contribution_cad: marginReady ? money(row.contribution_cad) : null,
      allocation_basis: "recorded_booking_to_package_linkage",
      margin_review_ready: marginReady,
      inferred_booking_total_split_used: false,
      overhead_included_in_margin_readiness: false
    };
  }).sort((a, b) => b.booking_count - a.booking_count || a.package_code.localeCompare(b.package_code));

  const readyCohorts = items.filter((row) => row.margin_review_ready).length;
  const marginReady =
    rows.length > 0 &&
    unclassified === 0 &&
    fullyLinked === rows.length &&
    items.length > 0 &&
    readyCohorts === items.length;

  return {
    status: rows.length === 0 ? "unavailable" : marginReady ? "observed" : "review",
    booking_count: rows.length,
    classified_booking_count: Math.max(0, rows.length - unclassified),
    unclassified_booking_count: unclassified,
    fully_linked_booking_count: fullyLinked,
    cohort_count: items.length,
    review_ready_cohort_count: readyCohorts,
    blocked_cohort_count: Math.max(0, items.length - readyCohorts),
    service_package_margin_review_ready: marginReady,
    allocation_basis: "recorded_booking_to_package_linkage",
    cohorts: items,
    booking_level_total_reallocation_allowed: false,
    price_weighted_allocation_allowed: false,
    equal_split_allocation_allowed: false,
    overhead_allocation_margin_claim_allowed: false
  };
}

function addOnAllocation(economics = {}) {
  const evidence = economics?.add_on_allocation_evidence || {};
  const rows = Array.isArray(evidence?.rows) ? evidence.rows : [];
  const cohorts = new Map();
  let invalidRows = 0;
  let readyRows = 0;

  for (const row of rows) {
    const addOnCode = clean(row?.add_on_code || row?.addon_code || row?.code || row?.name);
    if (!addOnCode) { invalidRows += 1; continue; }
    const recordedBasis = row?.recorded_basis === true || evidence?.recorded_basis === true;
    const components = {
      revenue: explicitFlag(row, "recorded_add_on_revenue", "revenue_evidence_status"),
      material: explicitFlag(row, "material_usage_linked_to_add_on", "material_evidence_status"),
      labor: explicitFlag(row, "labor_time_linked_to_add_on", "labor_evidence_status"),
      cash_refund: explicitFlag(row, "cash_refund_linked_to_add_on", "cash_refund_evidence_status"),
      cogs: explicitFlag(row, "posted_cogs_linked_to_add_on", "cogs_evidence_status")
    };
    const rowReady = recordedBasis && COMPONENT_KEYS.every((key) => components[key] === true);
    if (rowReady) readyRows += 1;
    const current = cohorts.get(addOnCode) || {
      add_on_code: addOnCode,
      evidence_row_count: 0,
      allocation_ready_row_count: 0,
      component_linked_row_counts: { revenue: 0, material: 0, labor: 0, cash_refund: 0, cogs: 0 }
    };
    current.evidence_row_count += 1;
    if (rowReady) current.allocation_ready_row_count += 1;
    for (const key of COMPONENT_KEYS) if (components[key]) current.component_linked_row_counts[key] += 1;
    cohorts.set(addOnCode, current);
  }

  const items = [...cohorts.values()].map((row) => ({
    ...row,
    allocation_basis: "recorded_explicit_add_on_linkage",
    margin_review_ready: row.evidence_row_count > 0 && row.allocation_ready_row_count === row.evidence_row_count,
    inferred_booking_total_split_used: false
  })).sort((a, b) => b.evidence_row_count - a.evidence_row_count || a.add_on_code.localeCompare(b.add_on_code));

  const readyCohorts = items.filter((row) => row.margin_review_ready).length;
  const allReady = rows.length > 0 && invalidRows === 0 && readyRows === rows.length && items.length > 0 && readyCohorts === items.length;
  const aggregateFlagsPresent = [
    evidence?.recorded_add_on_revenue,
    evidence?.material_usage_linked_to_add_on,
    evidence?.labor_time_linked_to_add_on,
    evidence?.cash_refund_linked_to_add_on,
    evidence?.posted_cogs_linked_to_add_on
  ].some((value) => value === true);

  return {
    status: rows.length === 0 ? (aggregateFlagsPresent ? "review" : "unavailable") : allReady ? "observed" : "review",
    explicit_allocation_row_count: rows.length,
    invalid_or_unclassified_row_count: invalidRows,
    allocation_ready_row_count: readyRows,
    add_on_count: items.length,
    review_ready_add_on_count: readyCohorts,
    blocked_add_on_count: Math.max(0, items.length - readyCohorts),
    add_on_margin_review_ready: allReady,
    allocation_basis: allReady ? "recorded_explicit_add_on_linkage" : null,
    cohorts: items,
    aggregate_component_flags_present: aggregateFlagsPresent,
    aggregate_flags_prove_add_on_allocation: false,
    explicit_row_linkage_required: true,
    booking_level_total_reallocation_allowed: false,
    price_weighted_allocation_allowed: false,
    equal_split_allocation_allowed: false,
    percentage_allocation_without_recorded_basis_allowed: false
  };
}

export function buildServiceEconomicsAllocationMarginReviewReadiness({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildServiceEconomicsCompletenessAddOnCostReadiness({ economics, fleet, pricing, source_status, generated_at });
  const servicePackage = servicePackageAllocation(economics);
  const addOn = addOnAllocation(economics);
  const allocationStatus =
    base.evidence_status === "partial" ? "partial" :
    servicePackage.status === "observed" && addOn.status === "observed" ? "observed" :
    servicePackage.status === "unavailable" && addOn.status === "unavailable" ? "unavailable" : "review";

  const candidates = (base.review_candidates || []).filter((row) => row?.area !== "add_on_cost_allocation_readiness");
  candidates.push(candidate(
    "service_package_allocation_readiness",
    servicePackage.status,
    servicePackage.service_package_margin_review_ready
      ? servicePackage.review_ready_cohort_count + " service/package cohort(s) have complete recorded revenue, material, labour, cash/refund and COGS linkage."
      : "Service/package margin remains bounded to cohorts with complete recorded booking-to-package linkage across every required economics component.",
    "Review only cohorts marked margin-review ready. Do not spread incomplete booking totals across services, add-ons or periods, and keep overhead estimates outside this readiness decision.",
    servicePackage.service_package_margin_review_ready ? "owner_action" : "observed_evidence"
  ));
  candidates.push(candidate(
    "add_on_allocation_readiness",
    addOn.status,
    addOn.add_on_margin_review_ready
      ? addOn.review_ready_add_on_count + " add-on cohort(s) have explicit recorded per-add-on allocation rows across every required component."
      : addOn.explicit_allocation_row_count
        ? "Recorded add-on allocation rows exist, but one or more required revenue/material/labour/cash-refund/COGS linkages are incomplete."
        : "No explicit per-add-on allocation rows are recorded; aggregate flags or booking totals do not establish add-on margin.",
    addOn.add_on_margin_review_ready
      ? "Review only the explicitly linked add-on cohorts; no price or discount change follows automatically."
      : "Keep add-on margin unavailable until an owning source records explicit per-add-on linkage. Never infer equal, price-weighted, percentage or booking-total allocation.",
    addOn.add_on_margin_review_ready ? "owner_action" : "internal_evidence"
  ));

  return {
    ...base,
    allocation_enrichment_build: 473,
    allocation_authority: "service_economics_allocation_margin_review_readiness",
    retained_allocation_authority: "service_economics_completeness_addon_cost_readiness",
    evidence_status: allocationStatus,
    economics: {
      ...base.economics,
      allocation_margin_readiness: {
        status: allocationStatus,
        service_package: servicePackage,
        add_on: addOn,
        automatic_margin_conclusion_authorized: false,
        automatic_price_or_discount_change_authorized: false
      }
    },
    review_candidates: candidates,
    truth_boundary: {
      ...base.truth_boundary,
      service_margin_without_recorded_package_linkage_allowed: false,
      add_on_margin_without_explicit_row_linkage_allowed: false,
      aggregate_add_on_flags_prove_allocation: false,
      booking_total_proves_component_allocation: false,
      overhead_estimate_proves_margin: false
    },
    boundaries: {
      ...base.boundaries,
      read_only: true,
      aggregate_only: true,
      booking_level_total_reallocation_allowed: false,
      inferred_service_or_add_on_allocation_allowed: false,
      overhead_allocation_margin_claim_allowed: false,
      automatic_margin_conclusion_allowed: false,
      automatic_price_change_allowed: false,
      automatic_discount_allowed: false,
      accounting_posting_allowed: false,
      inventory_posting_allowed: false,
      schema_mutation_allowed: false
    }
  };
}
