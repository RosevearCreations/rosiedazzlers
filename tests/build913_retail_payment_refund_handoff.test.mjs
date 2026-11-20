import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {providerEvent913,financeGuard913,normalizeRefundCommand913,
 sha256Retail913,verifyStripeSignature913} from '../assets/build913-retail-provider-contract.mjs';
import {stripeCheckoutFields913} from '../functions/api/_lib/retail-finance-v913.js';
import {onRequestPost as checkout} from '../functions/api/client/retail_checkout_v913.js';
import {onRequestPost as admin} from '../functions/api/admin/retail_finance_v913.js';
import {onRequestPost as receipt} from '../functions/api/client/retail_receipt_v913.js';
import {onRequestPost as webhook} from '../functions/api/stripe/retail_webhook_v913.js';
globalThis.crypto ||= webcrypto;
const order='11111111-1111-4111-8111-111111111111';
const refund='22222222-2222-4222-8222-222222222222';
const session='cs_test_1234567890';
const intent='pi_1234567890';
const event={id:'evt_abcdef1234567',type:'checkout.session.completed',data:{object:{
 object:'checkout.session',id:session,mode:'payment',payment_status:'paid',currency:'cad',
 amount_total:5650,payment_intent:intent,metadata:{rosie_retail_order_id:order}}}};
const rEvent={id:'evt_abcdef12345678',type:'refund.created',data:{object:{
 object:'refund',id:'re_1234567890',status:'succeeded',currency:'cad',amount:5650}}};
const original={id:order,lines:[{product_id:refund,title:'Genuine sample item',unit_cents:2500,
 quantity:2,line_cents:5000}],subtotal_cents:5000,estimated_hst_cents:650};
test('913: provider event validates exact Stripe status, currency, original ID and amount',()=>{
 const value=providerEvent913(event);
 assert.equal(value.kind,'checkout_paid');assert.equal(value.amount_cents,5650);
 for(const bad of [
  {data:{object:{payment_status:'unpaid'}}},
  {data:{object:{currency:'usd'}}},
  {data:{object:{amount_total:0}}},
  {data:{object:{metadata:{rosie_retail_order_id:'fake'}}}},
  {data:{object:{payment_intent:'not-an-intent'}}},
 ])assert.throws(()=>providerEvent913({
  ...event,data:{object:{...event.data.object,...bad.data.object}}}));
 assert.equal(providerEvent913({...event,type:'payment_intent.created'}).kind,'ignored');
 assert.equal(providerEvent913(rEvent).kind,'refund_succeeded');
 assert.equal(providerEvent913({...rEvent,data:{object:{...rEvent.data.object,status:'pending'}}}).kind,'ignored');
});
test('913: signed HMAC, replay window and tamper resistance',async()=>{
 const secret='whsec_private_for_test_example_123456789',body=JSON.stringify(event);
 const now=1763590000;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(now+'.'+body));
 const sig=[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
 assert.equal(await verifyStripeSignature913(body,'t='+now+',v1='+sig,secret,now),true);
 assert.equal(await verifyStripeSignature913(body+' ', 't='+now+',v1='+sig,secret,now),false);
 assert.equal(await verifyStripeSignature913(body,'t='+now+',v1='+sig,secret,now+301),false);
 assert.equal(await verifyStripeSignature913(body,'t='+now+',v1='+sig,'bad_secret_but_long_enough',now),false);
});
test('913: all money movement remains gated without original credentials and owner mapping',()=>{
 assert.equal(financeGuard913({},'checkout').ok,false);
 assert.equal(financeGuard913({ROSIE_RETAIL_FINANCE_ENABLED_913:'true'},'checkout').ok,false);
 const env={ROSIE_RETAIL_FINANCE_ENABLED_913:'true',STRIPE_SECRET_KEY:'sk_test_fake',
  STRIPE_RETAIL_WEBHOOK_SECRET_913:'whsec_fake',
  ROSIE_RETAIL_HST_APPROVED_913:'true'};
 assert.equal(financeGuard913(env,'checkout').ok,true);
 assert.equal(financeGuard913(env,'refund').ok,false);
 assert.equal(financeGuard913({...env,ROSIE_RETAIL_REFUNDS_ENABLED_913:'true'},'refund').ok,true);
});
test('913: provider checkout amount comes from original immutable CAD lines and HST',()=>{
 const fields=stripeCheckoutFields913(original,'https://rosiedazzlers.ca','verified@example.com');
 assert.equal(fields['line_items[0][price_data][unit_amount]'],'2500');
 assert.equal(fields['line_items[0][quantity]'],'2');
 assert.equal(fields['line_items[1][price_data][unit_amount]'],'650');
 assert.equal(fields['metadata[rosie_retail_order_id]'],order);
 assert.equal(fields['payment_method_types[0]'],'card');
 assert.throws(()=>stripeCheckoutFields913({...original,subtotal_cents:1},'https://rosiedazzlers.ca','verified@example.com'),/mismatch/);
 assert.throws(()=>stripeCheckoutFields913(original,'https://attacker.example','verified@example.com'),/Canonical/);
 assert.throws(()=>stripeCheckoutFields913({...original,lines:[{...original.lines[0],unit_cents:1}]},'https://rosiedazzlers.ca','verified@example.com'),/invalid|mismatch/i);
});
test('913: privileged refund and physical handoff input rejects extra keys and weak codes',()=>{
 const x=normalizeRefundCommand913({action:'request_refund',order_id:order,
 amount_cents:1200,reason:'Customer requested return'});
 assert.equal(x.amount_cents,1200);
 assert.throws(()=>normalizeRefundCommand913({...x,provider_paid:true}),/Unsupported/);
 assert.throws(()=>normalizeRefundCommand913({...x,amount_cents:20000000}),/Refund/);
 assert.throws(()=>normalizeRefundCommand913({action:'handoff',order_id:order,
  pin:'123456',note:'Handed to verified customer',customer_present_attested:true}),/code/);
 const y=normalizeRefundCommand913({action:'handoff',order_id:order,
  pin:'ABCDEF012345ABCDEF012345',note:'Witnessed actual custody transfer',customer_present_attested:true});
 assert.equal(y.pin.length,24);
});
test('913: no cross-origin customer, staff, or handoff privilege',async()=>{
 const req=url=>new Request(url,{method:'POST',headers:{origin:'https://attacker.example',
 'content-type':'application/json'},body:'{}'});
 for(const [fn,url] of [[checkout,'https://rosiedazzlers.ca/api/client/retail_checkout_v913'],
  [admin,'https://rosiedazzlers.ca/api/admin/retail_finance_v913'],
  [receipt,'https://rosiedazzlers.ca/api/client/retail_receipt_v913']]){
  assert.equal((await fn({request:req(url),env:{}})).status,403);
 }
 const unsafe=await webhook({request:new Request('https://rosiedazzlers.ca/api/stripe/retail_webhook_v913',{
  method:'POST',headers:{'content-type':'application/json','stripe-signature':'t=123,v1=bad'},body:'{}'}),env:{}});
 assert.equal(unsafe.status,503);
});
test('913: signed handoff code hashes never leave SQL as plaintext',async()=>{
 const h=await sha256Retail913('ABCDEF012345ABCDEF012345');
 assert.match(h,/^[a-f0-9]{64}$/);assert.equal(h.includes('ABCDEF'),false);
 const sql=readFileSync(new URL('../supabase/migrations/20261119223000_build913_original_retail_finance_pos.sql',import.meta.url),'utf8');
 for(const t of ['finance','provider_events','invoices','refunds','handoffs','stock_movements'])
  assert.match(sql,new RegExp('rosie_retail_'+t+'_v913'));
 assert.match(sql,/security invoker/);
 assert.match(sql,/revoke all on function public/);
 assert.match(sql,/physical_handoff/);
 assert.match(sql,/stock_on_hand=stock_on_hand-qty/);
 assert.match(sql,/payment_state<>'paid'/);
});
test('913: owner and customer experiences label provider and real-life limitations',()=>{
 const customer=readFileSync(new URL('../retail-receipt-913.html',import.meta.url),'utf8');
 const staff=readFileSync(new URL('../admin-retail-913.html',import.meta.url),'utf8');
 assert.match(customer,/not a paid sale/i);
 assert.match(customer,/15 minutes/);
 assert.match(staff,/REAL|actual/i);
 assert.match(staff,/not yet certified/i);
 assert.match(staff,/finance/i);
});
