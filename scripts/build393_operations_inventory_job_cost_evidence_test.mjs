import assert from "node:assert/strict";
import { buildOperationsJobCostEvidence } from "../functions/api/_lib/operations-job-cost-evidence.js";

const bookingId = "11111111-1111-4111-8111-111111111111";
const items = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    item_key: "soap",
    name: "Detailing Soap",
    qty_on_hand: 1,
    reorder_point: 2,
    reorder_qty: 6,
    unit_label: "L",
    cost_cents: 100
  }
];
const movements = [
  {
    id: "m1",
    booking_id: bookingId,
    item_id: items[0].id,
    item_key: "soap",
    movement_type: "waste",
    qty_delta: -2,
    previous_qty: 5,
    new_qty: 3,
    source_kind: "manual",
    note: "Consumed on job"
  },
  {
    id: "m2",
    booking_id: bookingId,
    item_id: items[0].id,
    item_key: "soap",
    movement_type: "adjustment",
    qty_delta: 0.5,
    previous_qty: 3,
    new_qty: 3.5,
    source_kind: "manual",
    source_reference_id: "reversal-m1",
    note: "Partial reversal"
  },
  {
    id: "m1",
    booking_id: bookingId,
    item_id: items[0].id,
    item_key: "soap",
    movement_type: "waste",
    qty_delta: -2,
    previous_qty: 5,
    new_qty: 3,
    source_kind: "manual",
    note: "Duplicate replay evidence"
  }
];
const purchaseOrders = [
  {
    id: "po-1",
    item_key: "soap",
    status: "requested",
    qty_ordered: 6,
    unit_cost_cents: 100,
    vendor_name: "Supplier"
  }
];

const ready = buildOperationsJobCostEvidence({
  booking_id: bookingId,
  movements,
  items,
  purchase_orders: purchaseOrders
});
assert.equal(ready.build, 393);
assert.equal(ready.status, "ready");
assert.equal(ready.usage.length, 1);
assert.equal(ready.usage[0].net_qty_delta, -1.5);
assert.equal(ready.usage[0].consumed_qty, 1.5);
assert.equal(ready.usage[0].material_cost_cents, 150);
assert.equal(ready.material_cost_cents, 150);
assert.equal(ready.evidence.canonical_movement_rows, 2);
assert.equal(ready.evidence.duplicate_rows_ignored, 1);
assert.equal(ready.reorder_evidence.length, 1);
assert.equal(ready.reorder_evidence[0].low_stock, true);
assert.equal(ready.reorder_evidence[0].active_purchase_orders.length, 1);
assert.equal(ready.boundaries.read_only, true);
assert.equal(ready.boundaries.mutation_authority, false);
assert.equal(ready.boundaries.second_inventory_ledger_created, false);
assert.equal(ready.boundaries.replay_safe_projection, true);
assert.equal(ready.boundaries.reversal_aware_projection, true);

const missingCost = buildOperationsJobCostEvidence({
  booking_id: bookingId,
  movements: [{
    id: "m3",
    booking_id: bookingId,
    item_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    item_key: "unknown-cost",
    movement_type: "waste",
    qty_delta: -1
  }],
  items: [{
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    item_key: "unknown-cost",
    name: "Unknown Cost Product",
    qty_on_hand: 10,
    reorder_point: 2,
    cost_cents: null
  }]
});
assert.equal(missingCost.status, "review");
assert.equal(missingCost.material_cost_complete, false);
assert.equal(missingCost.material_cost_cents, null);
assert.ok(missingCost.readiness.reasons.some((reason) => reason.includes("Recorded cost is unavailable")));

const missingReorder = buildOperationsJobCostEvidence({
  booking_id: bookingId,
  movements: [{
    id: "m4",
    booking_id: bookingId,
    item_id: items[0].id,
    item_key: "soap",
    movement_type: "waste",
    qty_delta: -0.25
  }],
  items,
  purchase_orders: []
});
assert.equal(missingReorder.status, "review");
assert.ok(missingReorder.readiness.reasons.some((reason) => reason.includes("no active purchase order evidence")));

const substitution = buildOperationsJobCostEvidence({
  booking_id: bookingId,
  movements: [{
    id: "m5",
    booking_id: bookingId,
    item_id: items[0].id,
    item_key: "soap",
    movement_type: "waste",
    qty_delta: -0.5,
    substituted_for_item_key: "premium-soap",
    substitution_reason: "Approved equivalent product unavailable"
  }],
  items: [{ ...items[0], qty_on_hand: 10, reorder_point: 2 }]
});
assert.equal(substitution.status, "ready");
assert.equal(substitution.substitutions.length, 1);
assert.equal(substitution.substitutions[0].substituted_for_item_key, "premium-soap");
assert.equal(substitution.substitutions[0].reason, "Approved equivalent product unavailable");

const unavailable = buildOperationsJobCostEvidence({ booking_id: bookingId, movements: [], items });
assert.equal(unavailable.status, "unavailable");
assert.equal(unavailable.material_cost_cents, 0);
assert.ok(unavailable.readiness.reasons.some((reason) => reason.includes("No canonical inventory movements")));

console.log("BUILD 393 OPERATIONS / INVENTORY / JOB-COST EVIDENCE: PASS");
console.log(" - canonical booking-scoped inventory movements remain the only movement authority");
console.log(" - duplicate replay evidence is ignored and reversals net against depletion");
console.log(" - material cost uses recorded inventory cost only and fails closed when cost is missing");
console.log(" - low-stock/reorder and substitution provenance are exposed without mutation");
console.log(" - no second inventory ledger or schema authority is introduced");
