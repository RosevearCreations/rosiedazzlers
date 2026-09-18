import assert from "node:assert/strict";
import { buildInventoryJobCostOperationalEvidence } from "../functions/api/_lib/inventory-job-cost-operational-evidence.js";

const bookingId = "11111111-1111-4111-8111-111111111111";
const item = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  item_key: "soap",
  name: "Detailing Soap",
  qty_on_hand: 1,
  reorder_point: 2,
  reorder_qty: 6,
  unit_label: "L",
  cost_cents: 125
};
const approvedJobUse = {
  id: "m1",
  booking_id: bookingId,
  item_id: item.id,
  item_key: item.item_key,
  movement_type: "job_use",
  qty_delta: -2,
  previous_qty: 5,
  new_qty: 3,
  unit_label: "L",
  actor_name: "Detailer",
  actor_staff_user_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  source_kind: "job_usage",
  source_reference_id: "usage-1",
  approval_status: "approved",
  approved_at: "2026-09-17T12:00:00Z",
  approved_by_staff_user_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  posting_status: "posted",
  posted_at: "2026-09-17T12:01:00Z",
  accounting_entry_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
};

const ready = buildInventoryJobCostOperationalEvidence({
  booking_id: bookingId,
  movements: [approvedJobUse, { ...approvedJobUse }],
  items: [item],
  purchase_orders: [{
    id: "po-1",
    item_key: "soap",
    status: "requested",
    qty_ordered: 6,
    unit_cost_cents: 125,
    vendor_name: "Supplier"
  }]
});
assert.equal(ready.build, 409);
assert.equal(ready.status, "ready");
assert.equal(ready.operational_rows.length, 1);
assert.equal(ready.operational_rows[0].explicit_job_use, true);
assert.equal(ready.operational_rows[0].ambiguous_depletion_excluded, false);
assert.equal(ready.operational_rows[0].consumed_qty, 2);
assert.equal(ready.operational_rows[0].material_cost_cents, 250);
assert.equal(ready.operational_rows[0].quantity_evidence.status, "ready");
assert.equal(ready.operational_rows[0].approval_evidence.status, "recorded");
assert.equal(ready.operational_rows[0].accounting_posting_evidence.status, "recorded");
assert.equal(ready.job_material_cost_cents, 250);
assert.equal(ready.job_material_cost_complete, true);
assert.equal(ready.evidence.explicit_job_use_rows, 1);
assert.equal(ready.evidence.duplicate_rows_ignored, 1);
assert.equal(ready.evidence.ambiguous_depletion_rows_excluded, 0);
assert.equal(ready.reorder_evidence.length, 1);
assert.equal(ready.boundaries.explicit_job_use_only, true);
assert.equal(ready.boundaries.inferred_consumption, false);
assert.equal(ready.boundaries.inferred_purchasing, false);
assert.equal(ready.boundaries.inferred_accounting_posting, false);

const wasteIsNotUsage = buildInventoryJobCostOperationalEvidence({
  booking_id: bookingId,
  movements: [{
    ...approvedJobUse,
    id: "m2",
    movement_type: "waste",
    source_reference_id: "waste-1"
  }],
  items: [item],
  purchase_orders: []
});
assert.equal(wasteIsNotUsage.status, "review");
assert.equal(wasteIsNotUsage.evidence.explicit_job_use_rows, 0);
assert.equal(wasteIsNotUsage.evidence.ambiguous_depletion_rows_excluded, 1);
assert.equal(wasteIsNotUsage.operational_rows[0].explicit_job_use, false);
assert.equal(wasteIsNotUsage.operational_rows[0].consumed_qty, 0);
assert.equal(wasteIsNotUsage.operational_rows[0].material_cost_cents, 0);
assert.equal(wasteIsNotUsage.job_material_cost_cents, null);
assert.ok(wasteIsNotUsage.readiness.reasons.some((reason) => reason.includes("not explicit job_use")));

const missingCost = buildInventoryJobCostOperationalEvidence({
  booking_id: bookingId,
  movements: [{ ...approvedJobUse, id: "m3", item_key: "unknown-cost", item_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }],
  items: [{
    ...item,
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    item_key: "unknown-cost",
    name: "Unknown Cost Product",
    cost_cents: null,
    qty_on_hand: 10,
    reorder_point: 2
  }]
});
assert.equal(missingCost.status, "review");
assert.equal(missingCost.job_material_cost_complete, false);
assert.equal(missingCost.job_material_cost_cents, null);
assert.equal(missingCost.evidence.missing_recorded_cost_rows, 1);
assert.ok(missingCost.readiness.reasons.some((reason) => reason.includes("Recorded cost is unavailable")));

const missingApprovalPosting = buildInventoryJobCostOperationalEvidence({
  booking_id: bookingId,
  movements: [{
    id: "m4",
    booking_id: bookingId,
    item_id: item.id,
    item_key: item.item_key,
    movement_type: "job_use",
    qty_delta: -0.5,
    previous_qty: 3,
    new_qty: 2.5,
    actor_name: "Detailer",
    actor_staff_user_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
  }],
  items: [{ ...item, qty_on_hand: 10, reorder_point: 2 }]
});
assert.equal(missingApprovalPosting.status, "review");
assert.equal(missingApprovalPosting.evidence.missing_approval_evidence_rows, 1);
assert.equal(missingApprovalPosting.evidence.missing_posting_evidence_rows, 1);
assert.equal(missingApprovalPosting.operational_rows[0].approval_evidence.status, "unavailable");
assert.equal(missingApprovalPosting.operational_rows[0].accounting_posting_evidence.status, "unavailable");

const quantityMismatch = buildInventoryJobCostOperationalEvidence({
  booking_id: bookingId,
  movements: [{ ...approvedJobUse, id: "m5", previous_qty: 5, new_qty: 4 }],
  items: [{ ...item, qty_on_hand: 10, reorder_point: 2 }]
});
assert.equal(quantityMismatch.status, "review");
assert.equal(quantityMismatch.evidence.quantity_review_rows, 1);
assert.ok(quantityMismatch.readiness.reasons.some((reason) => reason.includes("does not reconcile")));

const quantityUnavailable = buildInventoryJobCostOperationalEvidence({
  booking_id: bookingId,
  movements: [{ ...approvedJobUse, id: "m6", previous_qty: null, new_qty: null }],
  items: [{ ...item, qty_on_hand: 10, reorder_point: 2 }]
});
assert.equal(quantityUnavailable.status, "review");
assert.equal(quantityUnavailable.evidence.quantity_unavailable_rows, 1);
assert.ok(quantityUnavailable.readiness.reasons.some((reason) => reason.includes("quantity evidence is incomplete")));

const noReorder = buildInventoryJobCostOperationalEvidence({
  booking_id: bookingId,
  movements: [approvedJobUse],
  items: [item],
  purchase_orders: []
});
assert.equal(noReorder.status, "review");
assert.ok(noReorder.readiness.reasons.some((reason) => reason.includes("no active purchase-order evidence")));

const noMovements = buildInventoryJobCostOperationalEvidence({
  booking_id: bookingId,
  movements: [],
  items: [item]
});
assert.equal(noMovements.status, "unavailable");
assert.equal(noMovements.job_material_cost_cents, null);
assert.equal(noMovements.job_material_cost_complete, false);
assert.ok(noMovements.readiness.reasons.some((reason) => reason.includes("No canonical inventory movements")));

console.log("BUILD 409 INVENTORY / JOB-COST OPERATIONAL EVIDENCE: PASS");
console.log(" - explicit job_use is the only job-consumption authority");
console.log(" - waste/adjustment depletion is exposed but excluded from job material cost");
console.log(" - recorded quantities and costs fail closed when incomplete or inconsistent");
console.log(" - row-level approval and accounting-posting evidence are never inferred");
console.log(" - low-stock evidence never creates or infers a purchase order");
console.log(" - no second inventory ledger, schema mutation, purchasing, accounting posting or Production business-data mutation");
