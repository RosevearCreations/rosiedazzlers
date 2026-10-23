import assert from 'node:assert/strict';
import { calculateInventoryUsage } from '../functions/api/_lib/inventory-usage-units.js';

const bottle={stock_unit:'bottle',usage_unit:'ml',usage_units_per_stock_unit:1000,qty_on_hand:2,cost_cents:2500};
assert.deepEqual(calculateInventoryUsage(bottle,125),{
  usageQuantity:125,usageUnit:'ml',stockQuantity:0.125,stockUnit:'bottle',conversion:1000,estimatedCostCad:3.13
});
assert.equal(calculateInventoryUsage(bottle,1000).stockQuantity,1);
assert.equal(calculateInventoryUsage({unit_label:'piece',qty_on_hand:2,cost_cents:100},0.5).stockQuantity,0.5);
for(const invalid of [0,-1,Number.NaN,Infinity,0.0001]) {
  assert.throws(()=>calculateInventoryUsage(bottle,invalid));
}
assert.throws(()=>calculateInventoryUsage(bottle,2100),/Insufficient stock/);
assert.equal(calculateInventoryUsage({...bottle,qty_on_hand:0},125,{checkStock:false}).stockQuantity,0.125);
assert.throws(()=>calculateInventoryUsage({...bottle,usage_units_per_stock_unit:0},100),/positive finite/);
assert.throws(()=>calculateInventoryUsage({...bottle,usage_units_per_stock_unit:300},1),/precision/);
console.log('Build 619 partial usage conversion and cost checks passed.');
