import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveAlaCarte889,ALA_CARTE_PACKAGE_CODE_889} from '../functions/api/_lib/ala-carte-v889.js';
const code='headlights', vehicle_size='mid';
const approved={
 booking_rules:{ala_carte_policy:{enabled:true,owner_approved:true,version:'fixture-only-v1',deposit_cad:25,minimum_duration_slots:1}},
 addon_map:{headlights:{code,name:'Headlight Restoration',standalone_allowed:true,quote_required:false,prices_cad:{small:70,mid:90,oversize:115}},
  tint:{code:'tint',name:'Tint',standalone_allowed:true,quote_required:true,prices_cad:{mid:150}},
  wax:{code:'wax',name:'Wax',standalone_allowed:false,quote_required:false,prices_cad:{mid:55}}}
};
const selection={booking_mode:'ala_carte',vehicle_size,service_codes:[code],duration_slots:1};
const resolve=(body=selection,catalog=approved)=>resolveAlaCarte889(catalog,body);
test('genuine approved standalone service uses server catalogue, not client price',()=>{
 const result=resolve({...selection,price_total_cents:1,deposit_cents:1});
 assert.equal(result.ok,true);assert.equal(result.package_code,ALA_CARTE_PACKAGE_CODE_889);
 assert.equal(result.subtotal_cents,9000);assert.equal(result.deposit_cents,2500);
 assert.deepEqual(result.items.map(i=>i.code),[code]);
});
test('unapproved catalogue never creates reservation or charges',()=>{
 const result=resolve(selection,{...approved,booking_rules:{ala_carte_policy:{enabled:false,owner_approved:false,version:'fixture'}}});
 assert.equal(result.ok,false);assert.match(result.reason,/APPROVAL_HOLD/);
 assert.equal(result.booking_created,false);assert.equal(result.payment_attempted,false);
});
test('only independently approved standalone items may be checked out',()=>{
 for(const service_codes of [['tint'],['wax'],['removed']]){
  const result=resolve({...selection,service_codes});
  assert.equal(result.ok,false);
  assert.match(result.reason,/NOT_APPROVED/);
 }
});
test('missing, repeated, excessive or invalid service codes held',()=>{
 for(const service_codes of [[],[code,code],Array(13).fill(code),['../../admin']]){
  assert.equal(resolve({...selection,service_codes}).ok,false);
 }
});
test('package mode cannot masquerade as a la carte',()=>{
 assert.equal(resolve({...selection,package_code:'basic_detail'}).ok,false);
 assert.equal(resolve({...selection,addon_codes:['wax']}).ok,false);
});
test('no gift or promo use without an approved atomic ledger adapter',()=>{
 assert.match(resolve({...selection,gift_code:'TEST'}).reason,/GIFT_PROMO/);
 assert.match(resolve({...selection,promo_code:'TEST'}).reason,/GIFT_PROMO/);
});
test('missing price/invalid vehicle size or invalid deposit are held',()=>{
 assert.equal(resolve({...selection,vehicle_size:'invalid'}).ok,false);
 assert.equal(resolve(selection,{...approved,addon_map:{headlights:{...approved.addon_map.headlights,prices_cad:{mid:null}}}}).ok,false);
 assert.equal(resolve(selection,{...approved,booking_rules:{ala_carte_policy:{...approved.booking_rules.ala_carte_policy,deposit_cad:200}}}).ok,false);
});
test('duration below owner-approved booking length held',()=>{
 const r=resolve(selection,{...approved,booking_rules:{ala_carte_policy:{...approved.booking_rules.ala_carte_policy,minimum_duration_slots:2}}});
 assert.match(r.reason,/DURATION/);
});
test('existing guided wizard and payment/capacity authority are preserved',()=>{
 const checkout=readFileSync(new URL('../functions/api/checkout.js',import.meta.url),'utf8');
 const wizard=readFileSync(new URL('../booking-planner.html',import.meta.url),'utf8');
 assert.match(checkout,/checkCheckoutCapacity738/);
 assert.match(checkout,/insertBookingWithOptionalFields/);
 assert.match(checkout,/applyGiftRedemption/);
 assert.match(checkout,/evaluateWorkability739/);
 assert.match(checkout,/createStripeSession/);
 assert.match(checkout,/createPayPalOrder/);
 assert.match(checkout,/resolveAlaCarte889\(pricing, body\)/);
 assert.match(checkout,/package_code: pkg\.code/);
 assert.match(wizard,/wizardProgress627/);
 assert.match(wizard,/fetch\("\/api\/checkout"/);
});
test('both book routes are identical and manual flow genuinely points to new form',()=>{
 const a=readFileSync(new URL('../book/index.html',import.meta.url),'utf8');
 const b=readFileSync(new URL('../book.html',import.meta.url),'utf8');
 assert.equal(a,b);
 assert.match(a,/id="manualPath888" href="\/book-custom"/);
 const page=readFileSync(new URL('../book-custom/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../assets/ala-carte-booking-v889.js',import.meta.url),'utf8');
 assert.match(page,/id="alaCarteForm889"/);
 assert.match(ui,/fetch\('\/api\/pricing_catalog_public'/);
 assert.match(ui,/fetch\('\/api\/checkout'/);
 assert.match(ui,/fetch\(u,\{cache:'no-store'/);
 assert.match(ui,/booking_mode:'ala_carte'/);
 assert.doesNotMatch(ui,/localStorage\./);
});
