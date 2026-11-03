import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildUsagePreview750,usagePreviewChanged750,signUsagePreview750,verifyUsagePreview750,buildConsumableCostTrace750} from '../functions/api/_lib/consumable-job-cost-v750.js';
import {onRequestPost} from '../functions/api/admin/catalog_consumables_v750.js';

const booking='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const actor='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const item={item_key:'soap-1000',name:'Detailing shampoo',item_type:'consumable',is_active:true,
  stock_unit:'bottle',usage_unit:'mL',usage_units_per_stock_unit:1000,qty_on_hand:2,cost_cents:2500};
const row={item_key:item.item_key,quantity:0.125,previous_qty:2,new_qty:1.875,unit_cost_cents:2500};
const preview=buildUsagePreview750(item,125,row);
assert.equal(preview.stockQuantity,0.125,'125 mL of 1,000 mL bottle is 0.125 bottle');
assert.equal(preview.estimatedCostCad,3.13);
assert.equal(preview.stock_after,1.875);
assert.equal(preview.costing_status,'ready');
assert.equal(usagePreviewChanged750(preview,item),false);
assert.equal(usagePreviewChanged750(preview,{...item,qty_on_hand:1.875}),true,'fresh stock matters');
assert.equal(usagePreviewChanged750(preview,{...item,cost_cents:2900}),true,'cost changed after preview');
assert.equal(usagePreviewChanged750(preview,{...item,usage_units_per_stock_unit:500}),true,'conversion changed');
assert.throws(()=>buildUsagePreview750({...item,item_type:'tool'},125,row),/Only active consumables/);
assert.throws(()=>buildUsagePreview750(item,0.1,row),/precision/);
assert.throws(()=>buildUsagePreview750({...item,qty_on_hand:0.1},125,row),/Insufficient stock/);
assert.throws(()=>buildUsagePreview750(item,125,{...row,unit_cost_cents:2600}),/unit cost changed/);
assert.equal(buildUsagePreview750({...item,cost_cents:null},125,{...row,unit_cost_cents:null}).estimatedCostCad,null,'missing cost never becomes zero cost');

const issued_at=Date.UTC(2026,10,2,18),secret='non-production-test-only-secret';
const receiptPayload={...preview,build:750,booking_id:booking,actor_id:actor,issued_at,operation_id:actor,note:'Sparingly used'};
const token=await signUsagePreview750(receiptPayload,secret);
assert.deepEqual(await verifyUsagePreview750(token,secret,{now:issued_at+60000,actorId:actor,bookingId:booking}),receiptPayload);
await assert.rejects(()=>verifyUsagePreview750(token,secret,{now:issued_at+60000,actorId:'different',bookingId:booking}),/another staff/);
await assert.rejects(()=>verifyUsagePreview750(token,secret,{now:issued_at+60000,actorId:actor,bookingId:actor}),/another staff/);
await assert.rejects(()=>verifyUsagePreview750(token,secret,{now:issued_at+600001,actorId:actor,bookingId:booking}),/expired/);
await assert.rejects(()=>verifyUsagePreview750(token.slice(0,-4)+'a.abc',secret,{now:issued_at+60000,actorId:actor,bookingId:booking}));

const batch=(id,status='posted',accounting_status='posted')=>({id,created_at:'2026-11-02T18:00:00Z',source_kind:'booking',source_reference_id:booking,status,accounting_status,actor_staff_email:'staff@example.invalid',reason:'Recorded'});
const line=(batchId,id,quantity,cost)=>({id,batch_id:batchId,item_key:'soap-1000',item_name:'Shampoo',quantity,unit_label:'bottle',unit_cost_cents:cost,previous_qty:2,new_qty:2-quantity,movement_id:'movement'});
const trace=buildConsumableCostTrace750([batch('one'),batch('two','reversed'),batch('three','posted','failed')],
  [line('one','l1',0.125,2500),line('two','l2',0.5,2500),line('three','l3',0.25,1200)]);
assert.equal(trace.net_material_cost_cents,313+300,'job cost uses historical cost, not current catalog');
assert.equal(trace.entries[1].net_cost_cents,0,'reversal cancels net cost while preserving original receipt');
assert.equal(trace.entries[1].recorded_cost_cents,1250);
assert.equal(trace.accounting_review_batches,1,'failed accounting visible without reposting stock');
const unknown=buildConsumableCostTrace750([batch('one')],[line('one','l1',0.125,null)]);
assert.equal(unknown.net_material_cost_cents,null,'never substitute missing cost with zero');
assert.equal(unknown.cost_status,'review');
assert.equal(unknown.missing_cost_lines,1);

// Unauthorized calls must not perform any Supabase reads or mutations.
let fetchCalls=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{fetchCalls++;throw Error('Unexpected network call for unauthorized request');};
try{
  const response=await onRequestPost({request:new Request('https://rosiedazzlers.ca/api/admin/catalog_consumables_v750',{
    method:'POST',headers:{origin:'https://untrusted.invalid','content-type':'application/json'},
    body:JSON.stringify({action:'commit',booking_id:booking,item_key:'soap-1000',operation_id:actor,receipt:token})}),
    env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-invalid'}});
  assert.ok(response.status>=400);assert.equal(fetchCalls,0);
}finally{globalThis.fetch=originalFetch;}
const source=(name)=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const page=source('admin-catalog.html'),app=source('assets/admin-catalog-v311.js'),endpoint=source('functions/api/admin/catalog_consumables_v750.js');
assert.equal(page,source('admin-catalog/index.html'),'root/index route parity');
assert.match(page,/Preview stock & cost · no deduction/);
assert.match(page,/Confirm exact deduction/);
assert.match(page,/Read booking cost trail/);
assert.match(app,/usageConfirmBtn/);
assert.match(app,/catalog_consumables_v750/);
assert.match(endpoint,/p_dry_run:true/);
assert.match(endpoint,/p_dry_run:false/);
assert.match(endpoint,/idempotent_replay/);
assert.match(endpoint,/postInventoryUsageCOGS/);
assert.match(endpoint,/sameOrigin\(request\)/);
assert.match(endpoint,/auth_mode!=='session'/);
console.log('Build 750 PASS: fractional deduction precision, signed preview, source drift, ledger cost/reversal trace, accounting review, session guard and route parity.');
