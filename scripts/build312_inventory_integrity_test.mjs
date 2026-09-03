import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  roundInventoryQuantity,
  planInventoryAdjustment,
  validateInventoryPayloadNumbers,
  isPurchaseOrderReceiptReplay
} from '../functions/api/_lib/catalog-integrity.js';

assert.equal(roundInventoryQuantity(1.2346), 1.235);
assert.equal(roundInventoryQuantity('2.001'), 2.001);
assert.ok(Number.isNaN(roundInventoryQuantity('bad')));

const down = planInventoryAdjustment(1.005, 0.004, -1);
assert.equal(down.ok, true);
assert.equal(down.previous_qty, 1.005);
assert.equal(down.qty_delta, -0.004);
assert.equal(down.new_qty, 1.001);
assert.equal(planInventoryAdjustment(1, 2, -1).ok, false, 'stock overdraw must fail instead of clamping to zero');
assert.equal(planInventoryAdjustment(1, 2, 1).new_qty, 3);

assert.deepEqual(validateInventoryPayloadNumbers({ qty_on_hand: 1, reorder_point: 0, reorder_qty: 0, cost_cents: 10, rating_count: 0, rating_value: 5 }), []);
assert.ok(validateInventoryPayloadNumbers({ qty_on_hand: -1 }).length);
assert.ok(validateInventoryPayloadNumbers({ rating_value: 6 }).length);
assert.ok(validateInventoryPayloadNumbers({ reorder_point: Number.NaN }).length);

assert.equal(isPurchaseOrderReceiptReplay({ status:'received', received_at:null }, 'received'), true);
assert.equal(isPurchaseOrderReceiptReplay({ status:'ordered', received_at:'2026-09-03T00:00:00Z' }, 'received'), true);
assert.equal(isPurchaseOrderReceiptReplay({ status:'ordered', received_at:null }, 'received'), false);

const stock = fs.readFileSync('functions/api/admin/catalog_stock_action.js','utf8');
assert.ok(stock.includes('planInventoryAdjustment'));
assert.ok(!stock.includes('Math.max(0'), 'stock action must not hide overdraw by clamping');
assert.ok(stock.includes("source_kind:'manual'"));

const purchase = fs.readFileSync('functions/api/admin/catalog_purchase_order_update.js','utf8');
assert.ok(purchase.includes('isPurchaseOrderReceiptReplay'));
assert.ok(purchase.includes('idempotent_replay:true'));
assert.ok(purchase.includes("movement_type:'receive'"));
assert.ok(purchase.includes("source_reference_id:id"));

const save = fs.readFileSync('functions/api/admin/catalog_inventory_save.js','utf8');
assert.ok(save.includes('validateInventoryPayloadNumbers'));
assert.ok(save.includes('integrity_validation: true'));

const reorder = fs.readFileSync('functions/api/admin/catalog_reorder_request.js','utf8');
assert.ok(reorder.includes("['draft','requested','ordered']"));
assert.ok(reorder.includes('qty_ordered must be a finite number greater than zero.'));

const audit = fs.readFileSync('scripts/build312_inventory_integrity_audit.query','utf8');
for (const token of ['inventory_duplicate_asin_groups','movement_arithmetic_mismatch','posting_batch_rollup_mismatch','purchase_order_orphan_key','reservation_posting_batch_source_mismatch']) assert.ok(audit.includes(token));
const queryWithoutComments = audit.replace(/^\s*--.*$/gm,'');
assert.ok(!/\b(insert|update|delete|alter|create|drop|truncate|grant|revoke|call)\b/i.test(queryWithoutComments), 'Build 312 audit query must stay read-only');

console.log('Build 312 inventory integrity tests: PASS');
