import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectedProvider892,providerReady892} from '../functions/api/_lib/checkout-provider-v892.js';

const checkout=readFileSync(new URL('../functions/api/checkout.js',import.meta.url),'utf8');
const editable=readFileSync(new URL('../functions/api/_lib/editable-settings.js',import.meta.url),'utf8');

// Pure preflight tests operate on production-imported helpers; never call
// Stripe, PayPal or Supabase. Real sandbox booking and webhook acceptance
// remains separate and must not be represented as a test fixture success.
test('unknown provider is rejected before any booking/customer side effects',()=>{
 for(const value of ['unknown','crypto','stripe-and-paypal','',42,NaN,[],{}])
  assert.equal(selectedProvider892(value).ok,false,String(value));
 for(const name of ['stripe','Stripe',' PAYPAL ','paypal'])
  assert.equal(selectedProvider892(name).ok,true);
 assert.deepEqual(selectedProvider892(null),{ok:true,provider:'stripe'});
 assert.ok(checkout.indexOf('selectedProvider892(body.payment_provider)') <
   checkout.indexOf('const required = ['),'provider must be rejected before validation and DB calls');
});
test('missing Stripe/PayPal credentials reject a positive deposit before booking insert',()=>{
 for(const provider of ['stripe','paypal']){
   const bad=providerReady892({env:{},provider,payableDepositCents:2500});
   assert.equal(bad.ok,false);
   assert.match(bad.reason,/unavailable/);
 }
 assert.equal(providerReady892({env:{STRIPE_SECRET_KEY:'synthetic-test-only'},
   provider:'stripe',payableDepositCents:2500}).ok,true);
 assert.equal(providerReady892({env:{PAYPAL_CLIENT_ID:'synthetic-test-only',
   PAYPAL_CLIENT_SECRET:'synthetic-test-only'},provider:'paypal',payableDepositCents:2500}).ok,true);
 assert.equal(providerReady892({env:{},provider:'stripe',payableDepositCents:0}).ok,true,
   'Gift-only remains separate and must not create a provider dependency');
 for(const value of [-1,0.25,NaN,Infinity])
   assert.equal(providerReady892({provider:'stripe',payableDepositCents:value}).ok,false);
 const guard=checkout.indexOf('providerReady892({env,provider:selectedPayment892.provider,payableDepositCents})');
 const insert=checkout.indexOf('await insertBookingWithOptionalFields(supa, bookingPayload)');
 assert.ok(guard>=0,'production handler must call same tested provider guard');
 assert.ok(insert>guard,'provider guard must run before booking insertion');
});
test('Cloudflare Pages esbuild-compatible JSON imports are retained',()=>{
 assert.doesNotMatch(editable,/\bwith\s*\{\s*type\s*:\s*["']json["']\s*\}/,
   'Pages bundler fails to parse import attributes in editable-settings');
 assert.match(editable,/import businessProfile from ["'][^"']+business_profile\.json["'];/);
 assert.match(editable,/import editableSettingValidationSchemas from ["'][^"']+editable_setting_validation_schemas\.json["'];/);
});
