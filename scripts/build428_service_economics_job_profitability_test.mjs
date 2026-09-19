import assert from "node:assert/strict";
import { buildServiceEconomicsJobProfitability } from "../functions/api/_lib/service-economics-job-profitability.js";

const bookingId = "11111111-1111-4111-8111-111111111111";
const itemId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const staffId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const base = {
  month: 9,
  year: 2026,
  period_start: "2026-09-01",
  period_end_exclusive: "2026-10-01",
  records: [{
    booking_id: bookingId,
    service_date: "2026-09-18",
    customer_name: "Test Customer",
    package_code: "complete",
    order_status: "completed",
    accounting_stage: "closed",
    total_cad: 300,
    revenue_cad: 300,
    refund_cad: 0,
    collected_total_cad: 300,
    balance_due_cad: 0
  }],
  posted_cogs: [{ booking_id: bookingId, amount_cad: 20 }],
  time_entries: [{ booking_id: bookingId, minutes: 120, staff_user_id: staffId }],
  staff_rates: [{ id: staffId, hourly_rate_cents: 2500 }],
  inventory_items: [{
    id: itemId,
    item_key: "soap",
    name: "Detailing Soap",
    qty_on_hand: 8,
    reorder_point: 2,
    reorder_qty: 6,
    unit_label: "L",
    cost_cents: 1000,
    reuse_policy: "reorder"
  }],
  inventory_movements: [{
    id: "m1",
    booking_id: bookingId,
    item_id: itemId,
    item_key: "soap",
    movement_type: "job_use",
    qty_delta: -2,
    previous_qty: 10,
    new_qty: 8,
    unit_label: "L",
    approval_status: "approved",
    approved_at: "2026-09-18T12:00:00Z",
    approved_by_staff_user_id: staffId,
    posting_status: "posted",
    posted_at: "2026-09-18T12:01:00Z",
    accounting_entry_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
  }],
  overhead_pool_cad: 30
};

const ready = buildServiceEconomicsJobProfitability(base);
assert.equal(ready.build, 428);
assert.equal(ready.rows.length, 1);
assert.equal(ready.rows[0].evidence_status, "ready");
assert.equal(ready.rows[0].recognized_revenue_cad, 300);
assert.equal(ready.rows[0].recorded_material_cost_cad, 20);
assert.equal(ready.rows[0].direct_cogs_cad, 20);
assert.equal(ready.rows[0].cogs_reconciliation_status, "ready");
assert.equal(ready.rows[0].estimated_direct_labor_cad, 50);
assert.equal(ready.rows[0].pricing_review_contribution_cad, 230);
assert.equal(ready.rows[0].estimated_net_after_overhead_cad, 250);
assert.equal(ready.totals.ready_booking_count, 1);
assert.equal(ready.totals.review_booking_count, 0);
assert.equal(ready.boundaries.pricing_mutation, false);
assert.equal(ready.boundaries.accounting_posting_mutation, false);

const missingCost = buildServiceEconomicsJobProfitability({
  ...base,
  inventory_items: [{ ...base.inventory_items[0], cost_cents: null }]
});
assert.equal(missingCost.rows[0].evidence_status, "review");
assert.equal(missingCost.rows[0].recorded_material_cost_cad, null);
assert.equal(missingCost.rows[0].pricing_review_contribution_cad, null);
assert.ok(missingCost.rows[0].evidence_reasons.some((reason) => reason.includes("recorded item cost")));

const missingRate = buildServiceEconomicsJobProfitability({ ...base, staff_rates: [] });
assert.equal(missingRate.rows[0].evidence_status, "review");
assert.equal(missingRate.rows[0].estimated_direct_labor_cad, null);
assert.equal(missingRate.rows[0].pricing_review_contribution_cad, null);
assert.equal(missingRate.rows[0].missing_rate_staff_ids[0], staffId);

const cogsVariance = buildServiceEconomicsJobProfitability({
  ...base,
  posted_cogs: [{ booking_id: bookingId, amount_cad: 25 }]
});
assert.equal(cogsVariance.rows[0].evidence_status, "review");
assert.equal(cogsVariance.rows[0].cogs_reconciliation_status, "review");
assert.equal(cogsVariance.rows[0].cogs_variance_cad, 5);

const missingCash = buildServiceEconomicsJobProfitability({
  ...base,
  records: [{ ...base.records[0], collected_total_cad: undefined, balance_due_cad: undefined }]
});
assert.equal(missingCash.rows[0].evidence_status, "review");
assert.equal(missingCash.rows[0].cash_evidence_status, "review");

const refundDerived = buildServiceEconomicsJobProfitability({
  ...base,
  records: [{
    ...base.records[0],
    revenue_cad: undefined,
    total_cad: 300,
    refund_cad: 50,
    collected_total_cad: 250,
    balance_due_cad: 0
  }]
});
assert.equal(refundDerived.rows[0].recognized_revenue_cad, 250);
assert.equal(refundDerived.rows[0].revenue_basis, "recorded total_cad less recorded refund_cad");

console.log("BUILD 428 SERVICE ECONOMICS / JOB PROFITABILITY: PASS");
console.log(" - recorded job-use material cost and posted COGS reconcile explicitly");
console.log(" - missing item costs or staff rates fail closed instead of becoming zero-cost margin");
console.log(" - collected revenue, balance due and refunds stay visible beside recognized revenue");
console.log(" - profitability evidence remains read-only and cannot mutate pricing, inventory, accounting or providers");
