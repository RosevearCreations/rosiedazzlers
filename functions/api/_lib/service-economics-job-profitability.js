import { buildInventoryJobCostOperationalEvidence } from "./inventory-job-cost-operational-evidence.js";

const VALID_STATUSES = new Set(["ready", "review", "unavailable"]);

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function money(value) {
  const number = finite(value);
  return number == null ? null : Math.round(number * 100) / 100;
}

function hasOwnNumber(row, key) {
  return Object.prototype.hasOwnProperty.call(row || {}, key) && finite(row?.[key]) != null;
}

function normalizeRates(input) {
  if (input instanceof Map) return new Map(input);
  const map = new Map();
  if (Array.isArray(input)) {
    for (const row of input) {
      const id = String(row?.id || row?.staff_user_id || "").trim();
      if (id) map.set(id, finite(row?.hourly_rate_cents));
    }
    return map;
  }
  if (input && typeof input === "object") {
    for (const [id, value] of Object.entries(input)) map.set(String(id), finite(value));
  }
  return map;
}

function groupByBooking(rows = []) {
  const map = new Map();
  for (const row of rows || []) {
    const bookingId = String(row?.booking_id || "").trim();
    if (!bookingId) continue;
    const list = map.get(bookingId) || [];
    list.push(row);
    map.set(bookingId, list);
  }
  return map;
}

function revenueEvidence(row) {
  if (hasOwnNumber(row, "revenue_cad")) {
    return {
      status: "ready",
      recognized_revenue_cad: Math.max(0, money(row.revenue_cad) || 0),
      basis: "accounting_records.revenue_cad",
      reason: null
    };
  }
  if (hasOwnNumber(row, "total_cad") && hasOwnNumber(row, "refund_cad")) {
    return {
      status: "ready",
      recognized_revenue_cad: Math.max(0, money(Number(row.total_cad) - Number(row.refund_cad)) || 0),
      basis: "recorded total_cad less recorded refund_cad",
      reason: null
    };
  }
  return {
    status: "unavailable",
    recognized_revenue_cad: null,
    basis: null,
    reason: "Recorded revenue or the recorded total/refund pair is incomplete; recognized revenue is not inferred."
  };
}

function cashEvidence(row) {
  const collected = hasOwnNumber(row, "collected_total_cad") ? money(row.collected_total_cad) : null;
  const balance = hasOwnNumber(row, "balance_due_cad") ? money(row.balance_due_cad) : null;
  const refund = hasOwnNumber(row, "refund_cad") ? money(row.refund_cad) : null;
  const values = [collected, balance, refund];
  const present = values.filter((value) => value != null).length;
  return {
    status: present === 3 ? "ready" : present ? "review" : "unavailable",
    collected_revenue_cad: collected,
    balance_due_cad: balance,
    refund_cad: refund,
    reason: present === 3 ? null : "Collected revenue, balance due and refund evidence are not all recorded."
  };
}

function laborEvidence(rows, rateMap) {
  const positive = (rows || []).filter((row) => (finite(row?.minutes) || 0) > 0);
  if (!positive.length) {
    return {
      status: "unavailable",
      logged_minutes: 0,
      estimated_direct_labor_cad: null,
      partial_estimated_labor_cad: 0,
      missing_rate_staff_ids: [],
      reason: "No positive logged job-time evidence is recorded for this booking."
    };
  }

  let partial = 0;
  let minutes = 0;
  const missing = new Set();
  for (const row of positive) {
    const rowMinutes = Math.max(0, finite(row?.minutes) || 0);
    const staffId = String(row?.staff_user_id || "").trim();
    const rateCents = staffId ? finite(rateMap.get(staffId)) : null;
    minutes += rowMinutes;
    if (rateCents == null || rateCents <= 0) {
      missing.add(staffId || "unknown");
      continue;
    }
    partial += (rowMinutes / 60) * (rateCents / 100);
  }

  const partialCad = money(partial) || 0;
  if (missing.size) {
    return {
      status: "review",
      logged_minutes: Math.round(minutes),
      estimated_direct_labor_cad: null,
      partial_estimated_labor_cad: partialCad,
      missing_rate_staff_ids: [...missing],
      reason: "One or more logged time rows lack a positive recorded staff hourly rate; direct labour is not completed with zero-cost assumptions."
    };
  }
  return {
    status: "ready",
    logged_minutes: Math.round(minutes),
    estimated_direct_labor_cad: partialCad,
    partial_estimated_labor_cad: partialCad,
    missing_rate_staff_ids: [],
    reason: null
  };
}

function materialEvidence(bookingId, movements, items) {
  const raw = buildInventoryJobCostOperationalEvidence({
    booking_id: bookingId,
    movements,
    items,
    purchase_orders: []
  });
  const explicitRows = Number(raw?.evidence?.explicit_job_use_rows || 0);
  const canonicalRows = Number(raw?.evidence?.canonical_movement_rows || 0);
  const missingCosts = Number(raw?.evidence?.missing_recorded_cost_rows || 0);
  const missingApprovals = Number(raw?.evidence?.missing_approval_evidence_rows || 0);
  const missingPostings = Number(raw?.evidence?.missing_posting_evidence_rows || 0);
  const recordedCost = raw?.job_material_cost_complete && raw?.job_material_cost_cents != null
    ? money(Number(raw.job_material_cost_cents) / 100)
    : null;

  let status = "unavailable";
  const reasons = [];
  if (explicitRows > 0) {
    status = recordedCost != null && missingCosts === 0 && missingApprovals === 0 && missingPostings === 0
      ? "ready"
      : "review";
    if (missingCosts) reasons.push("One or more explicit job-use rows lack recorded item cost.");
    if (missingApprovals) reasons.push("One or more explicit job-use rows lack row-level approval evidence.");
    if (missingPostings) reasons.push("One or more explicit job-use rows lack row-level accounting-posting evidence.");
  } else if (canonicalRows > 0) {
    status = "review";
    reasons.push("Inventory movements exist for the booking, but none is an explicit negative job_use movement.");
  } else {
    reasons.push("No canonical inventory movement is recorded for the booking.");
  }

  return {
    status,
    recorded_material_cost_cad: recordedCost,
    explicit_job_use_rows: explicitRows,
    canonical_movement_rows: canonicalRows,
    missing_recorded_cost_rows: missingCosts,
    missing_approval_evidence_rows: missingApprovals,
    missing_posting_evidence_rows: missingPostings,
    reasons
  };
}

function cogsReconciliation(postedRows, material) {
  const rows = postedRows || [];
  const posted = rows.length
    ? money(rows.reduce((sum, row) => sum + Math.max(0, finite(row?.amount_cad) || 0), 0))
    : null;
  const materialCost = material?.recorded_material_cost_cad;
  const variance = posted != null && materialCost != null ? money(posted - materialCost) : null;
  let status = "unavailable";
  let reason = "Neither posted booking COGS nor complete recorded job-use material cost is available.";

  if (posted != null && materialCost != null) {
    status = Math.abs(variance || 0) <= 0.01 ? "ready" : "review";
    reason = status === "ready"
      ? null
      : "Posted booking COGS does not reconcile to recorded explicit job-use material cost.";
  } else if (posted != null || materialCost != null) {
    status = "review";
    reason = posted == null
      ? "Recorded job-use material cost exists without booking-linked posted COGS."
      : "Booking-linked posted COGS exists without complete recorded job-use material cost.";
  }

  return {
    status,
    posted_cogs_cad: posted,
    recorded_material_cost_cad: materialCost,
    variance_cad: variance,
    posted_cogs_rows: rows.length,
    reason
  };
}

function rowStatus(parts) {
  const reasons = parts.flatMap((part) => {
    if (!part) return [];
    if (Array.isArray(part.reasons)) return part.reasons;
    return part.reason ? [part.reason] : [];
  }).filter(Boolean);

  if (parts.some((part) => part?.status === "unavailable")) {
    return { status: parts[0]?.status === "unavailable" ? "unavailable" : "review", reasons: [...new Set(reasons)] };
  }
  if (parts.some((part) => part?.status === "review")) return { status: "review", reasons: [...new Set(reasons)] };
  return { status: "ready", reasons: [] };
}

export function buildServiceEconomicsJobProfitability({
  month = null,
  year = null,
  period_start = null,
  period_end_exclusive = null,
  records = [],
  posted_cogs = [],
  time_entries = [],
  staff_rates = [],
  inventory_movements = [],
  inventory_items = [],
  overhead_pool_cad = 0
} = {}) {
  const rateMap = normalizeRates(staff_rates);
  const timeByBooking = groupByBooking(time_entries);
  const movementsByBooking = groupByBooking(inventory_movements);
  const cogsByBooking = groupByBooking(posted_cogs);

  const preparedRevenue = new Map();
  let totalRecognizedRevenue = 0;
  for (const row of records || []) {
    const bookingId = String(row?.booking_id || "").trim();
    const revenue = revenueEvidence(row);
    preparedRevenue.set(bookingId || row, revenue);
    if (revenue.recognized_revenue_cad != null) {
      totalRecognizedRevenue = money(totalRecognizedRevenue + revenue.recognized_revenue_cad) || 0;
    }
  }

  const rows = (records || []).map((row) => {
    const bookingId = String(row?.booking_id || "").trim();
    const revenue = preparedRevenue.get(bookingId || row) || revenueEvidence(row);
    const cash = cashEvidence(row);
    const materials = materialEvidence(bookingId || null, movementsByBooking.get(bookingId) || [], inventory_items);
    const labor = laborEvidence(timeByBooking.get(bookingId) || [], rateMap);
    const cogs = cogsReconciliation(cogsByBooking.get(bookingId) || [], materials);

    const revenueShare = revenue.recognized_revenue_cad != null && totalRecognizedRevenue > 0
      ? revenue.recognized_revenue_cad / totalRecognizedRevenue
      : 0;
    const allocatedOverhead = money(Math.max(0, finite(overhead_pool_cad) || 0) * revenueShare) || 0;

    const contribution = revenue.recognized_revenue_cad != null &&
      materials.recorded_material_cost_cad != null &&
      labor.estimated_direct_labor_cad != null
      ? money(
          revenue.recognized_revenue_cad -
          materials.recorded_material_cost_cad -
          labor.estimated_direct_labor_cad
        )
      : null;

    const estimatedGrossProfit = revenue.recognized_revenue_cad != null && cogs.posted_cogs_cad != null
      ? money(revenue.recognized_revenue_cad - cogs.posted_cogs_cad)
      : null;
    const legacyNetAfterOverhead = estimatedGrossProfit != null
      ? money(estimatedGrossProfit - allocatedOverhead)
      : null;

    const evidence = rowStatus([revenue, cash, materials, labor, cogs]);
    if (!bookingId) {
      evidence.status = "unavailable";
      evidence.reasons.unshift("Booking identity is missing; job-level economics cannot be reconciled.");
    }
    if (!VALID_STATUSES.has(evidence.status)) evidence.status = "review";

    return {
      build: 428,
      booking_id: bookingId || null,
      service_date: row?.service_date || null,
      customer_name: row?.customer_name || null,
      customer_email: row?.customer_email || null,
      package_code: row?.package_code || null,
      order_status: row?.order_status || null,
      accounting_stage: row?.accounting_stage || null,
      evidence_status: evidence.status,
      evidence_reasons: [...new Set(evidence.reasons.filter(Boolean))],
      recognized_revenue_cad: revenue.recognized_revenue_cad,
      revenue_evidence_status: revenue.status,
      revenue_basis: revenue.basis,
      collected_revenue_cad: cash.collected_revenue_cad,
      balance_due_cad: cash.balance_due_cad,
      refund_cad: cash.refund_cad,
      cash_evidence_status: cash.status,
      recorded_material_cost_cad: materials.recorded_material_cost_cad,
      material_evidence_status: materials.status,
      explicit_job_use_rows: materials.explicit_job_use_rows,
      missing_material_cost_rows: materials.missing_recorded_cost_rows,
      missing_material_approval_rows: materials.missing_approval_evidence_rows,
      missing_material_posting_rows: materials.missing_posting_evidence_rows,
      direct_cogs_cad: cogs.posted_cogs_cad,
      cogs_reconciliation_status: cogs.status,
      cogs_variance_cad: cogs.variance_cad,
      estimated_direct_labor_cad: labor.estimated_direct_labor_cad,
      partial_estimated_labor_cad: labor.partial_estimated_labor_cad,
      logged_minutes: labor.logged_minutes,
      missing_rate_staff_ids: labor.missing_rate_staff_ids,
      labor_evidence_status: labor.status,
      pricing_review_contribution_cad: contribution,
      estimated_contribution_after_labor_cad: contribution,
      allocated_overhead_cad: allocatedOverhead,
      estimated_gross_profit_cad: estimatedGrossProfit,
      estimated_net_after_overhead_cad: legacyNetAfterOverhead
    };
  }).sort((a, b) => {
    const rank = { ready: 0, review: 1, unavailable: 2 };
    const statusDelta = (rank[a.evidence_status] ?? 9) - (rank[b.evidence_status] ?? 9);
    if (statusDelta) return statusDelta;
    return Number(b.pricing_review_contribution_cad ?? -Infinity) - Number(a.pricing_review_contribution_cad ?? -Infinity);
  });

  const sumNumeric = (key) => money(rows.reduce((sum, row) => {
    const value = finite(row?.[key]);
    return value == null ? sum : sum + value;
  }, 0)) || 0;

  return {
    build: 428,
    month,
    year,
    period_start,
    period_end_exclusive,
    method_note:
      "Build 428 separates recorded revenue/cash, explicit job-use material cost, booking-linked posted COGS and logged-time labour evidence. Missing cost/rate/refund/balance evidence remains review or unavailable; overhead remains an allocation estimate and no price is changed automatically.",
    totals: {
      booking_count: rows.length,
      ready_booking_count: rows.filter((row) => row.evidence_status === "ready").length,
      review_booking_count: rows.filter((row) => row.evidence_status === "review").length,
      unavailable_booking_count: rows.filter((row) => row.evidence_status === "unavailable").length,
      recognized_revenue_cad: sumNumeric("recognized_revenue_cad"),
      collected_revenue_cad: sumNumeric("collected_revenue_cad"),
      recorded_material_cost_cad: sumNumeric("recorded_material_cost_cad"),
      direct_cogs_cad: sumNumeric("direct_cogs_cad"),
      cogs_variance_booking_count: rows.filter((row) => row.cogs_reconciliation_status === "review").length,
      estimated_direct_labor_cad: sumNumeric("estimated_direct_labor_cad"),
      pricing_review_contribution_cad: sumNumeric("pricing_review_contribution_cad"),
      estimated_contribution_after_labor_cad: sumNumeric("estimated_contribution_after_labor_cad"),
      overhead_pool_cad: money(overhead_pool_cad) || 0,
      estimated_net_after_overhead_cad: sumNumeric("estimated_net_after_overhead_cad")
    },
    rows,
    boundaries: {
      read_only: true,
      schema_authority: false,
      pricing_mutation: false,
      discount_mutation: false,
      purchasing_mutation: false,
      inventory_quantity_mutation: false,
      accounting_posting_mutation: false,
      payment_provider_mutation: false,
      recorded_costs_only: true,
      explicit_job_use_only: true,
      missing_evidence_fails_closed: true,
      overhead_is_estimate: true
    }
  };
}
