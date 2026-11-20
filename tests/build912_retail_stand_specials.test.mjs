import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeProduct912,normalizeLocation912,normalizeSpecial912,
 publicCatalog912,priceRetailIntent912} from '../assets/build912-retail-contract.mjs';
import {onRequestPost as staffPost} from '../functions/api/admin/retail_ops_v912.js';
import {onRequestPost as customerPost} from '../functions/api/client/retail_order_v912.js';
import {onRequestPost as interestPost} from '../functions/api/client/retail_interest_v912.js';
const productId='11111111-1111-4111-8111-111111111111';
const locationId='22222222-2222-4222-8222-222222222222';
const key='33333333-3333-4333-8333-333333333333';
const product={id:productId,sku:'ROSIE-001',title:'Microfiber sample pack',
 description:'Approved listing',category:'care',price_cents:2500,stock_on_hand:4,
 active:true,publish_approved:true,supplier_review_id:key};
const location={id:locationId,name:'Original sample pickup point',mode:'pickup',active:true,
 service_area:'Oxford',customer_directions:'',starts_at:null,ends_at:null};
const remote={...location,mode:'remote_service'};
const stand={...location,mode:'stand'};
const special={code:'REMOTE-10',title:'Remote region quote special',location_id:locationId,
 percent_off:10,quote_required:true,active:true,
 starts_at:'2026-11-18T00:00:00.000Z',ends_at:'2026-12-18T00:00:00.000Z'};
test('912: products require explicit staff approval for public exposure',()=>{
 const draft=normalizeProduct912({sku:'rosie-001',title:'Microfiber sample pack',price_cents:2500,
  stock_on_hand:4,active:true,publish_confirmed:false});
 assert.equal(draft.publish_approved,false);
 assert.equal(normalizeProduct912({sku:'rosie-001',title:'Microfiber sample pack',price_cents:2500,
  stock_on_hand:4,active:true,publish_confirmed:true}).publish_approved,true);
 assert.throws(()=>normalizeProduct912({sku:'rosie-001',title:'Microfiber sample pack',price_cents:1.1,stock_on_hand:2,active:true}),/Price/);
 assert.throws(()=>normalizeProduct912({sku:'x',title:'Invalid',price_cents:120,stock_on_hand:2}),/SKU/);
 assert.throws(()=>normalizeProduct912({sku:'ROSIE-001',title:'Microfiber sample pack',price_cents:100,stock_on_hand:2,arbitrary:'secret'}),/Unexpected/);
});
test('912: public catalog omits supplier reviews, unpublished items, and private DAIP references',()=>{
 const result=publicCatalog912([product,{...product,id:key,active:false}],[remote],
  [special],Date.parse('2026-11-19T10:00:00Z'));
 assert.equal(result.products.length,1);
 assert.equal(result.remote_specials.length,1);
 assert.equal(result.remote_specials[0].quote_required,true);
 assert.equal('supplier_review_id' in result.products[0],false);
 assert.equal(JSON.stringify(result).includes('daip_project_id'),false);
 assert.equal(publicCatalog912([product],[location],[special],Date.parse('2026-11-19T10:00:00Z')).remote_specials.length,0);
 assert.equal(publicCatalog912([product],[remote],[special],Date.parse('2027-01-01T10:00:00Z')).remote_specials.length,0);
});
test('912: stand/pickup pricing comes only from server rows and cannot trust browser amount',()=>{
 const input={mode:'pickup',location_id:locationId,
  idempotency_key:key,items:[{product_id:productId,quantity:2}]};
 const x=priceRetailIntent912(input,[product],[location]);
 assert.equal(x.subtotal_cents,5000);
 assert.equal(x.estimated_hst_cents,650);
 assert.equal(x.stock_reserved,false);assert.equal(x.payment_status,'NOT_ATTEMPTED');
 assert.throws(()=>priceRetailIntent912({...input,total_cents:1},[product],[location]),/Unexpected/);
 assert.throws(()=>priceRetailIntent912({...input,items:[{product_id:productId,quantity:5}]},[product],[location]),/Stock/);
 assert.throws(()=>priceRetailIntent912({...input,items:[{product_id:productId,quantity:2,price_cents:1}]},[product],[location]),/Unexpected/);
 assert.throws(()=>priceRetailIntent912({...input,mode:'stand'},[product],[location]),/not currently/);
 assert.equal(priceRetailIntent912({...input,mode:'stand'},[product],[stand]).subtotal_cents,5000);
});
test('912: dates, remote specials, location and quantities fail closed',()=>{
 const l=normalizeLocation912({name:'Remote test zone',mode:'remote_service',service_area:'Norfolk',active:true});
 assert.equal(l.mode,'remote_service');
 assert.throws(()=>normalizeLocation912({name:'bad',mode:'remote_service',service_area:'Norfolk'}),/Location/);
 assert.throws(()=>normalizeSpecial912({...special,starts_at:'2030-01-01',ends_at:'2029-01-01'}),/date range/);
 assert.throws(()=>normalizeSpecial912({...special,percent_off:100}),/discount/);
});
test('912: cross-origin staff, customer and interest mutations fail before database calls',async()=>{
 const request=url=>new Request(url,{method:'POST',headers:{origin:'https://attacker.invalid',
  'content-type':'application/json'},body:'{}'});
 assert.equal((await staffPost({request:request('https://rosiedazzlers.ca/api/admin/retail_ops_v912'),env:{}})).status,403);
 assert.equal((await customerPost({request:request('https://rosiedazzlers.ca/api/client/retail_order_v912'),env:{}})).status,403);
 assert.equal((await interestPost({request:request('https://rosiedazzlers.ca/api/client/retail_interest_v912'),env:{}})).status,403);
});
test('912: original RLS migration protects customer and staff records, no public grants',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261119210000_build912_retail_pickup_stand_specials.sql',import.meta.url),'utf8');
 for(const table of ['products','locations','specials','order_requests','interest'])
  assert.match(sql,new RegExp('alter table public\\.rosie_retail_'+table+'_v912 enable row level security'));
 assert.match(sql,/revoke all on public\.rosie_retail_products_v912/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/unique\(customer_profile_id,idempotency_key\)/);
 assert.match(sql,/unique\(customer_profile_id,product_id,interest_kind,event_day\)/);
});
test('912: accessible customer and private operator workbenches have explicit unpaid boundaries',()=>{
 const customer=readFileSync(new URL('../retail.html',import.meta.url),'utf8');
 const admin=readFileSync(new URL('../admin-retail-912.html',import.meta.url),'utf8');
 assert.match(customer,/not a paid sale/i);
 assert.match(customer,/interestOptIn/);
 assert.match(customer,/remoteSpecials/);
 assert.match(admin,/private staff operations/i);
 assert.match(admin,/admin-finance-supplier-911/);
 assert.match(admin,/No automatic payment/);
});
