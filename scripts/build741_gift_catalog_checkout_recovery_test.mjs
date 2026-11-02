import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestGet as getCatalog } from '../functions/api/gifts/catalog.js';
import { onRequestPost as startCheckout } from '../functions/api/gifts/checkout.js';
import { onRequestPost as lookupReceipt } from '../functions/api/gifts/receipt.js';
import { readGiftCheckoutDraft, prepareGiftCheckoutIntent, clearGiftCheckoutDraft } from '../assets/gift-draft-recovery-v741.js';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const env = { SUPABASE_URL:'https://db.example.test', SUPABASE_SERVICE_ROLE_KEY:'service-mock',
  STRIPE_SECRET_KEY:'test-only', SITE_ORIGIN:'https://rosiedazzlers.ca' };
const originalFetch = globalThis.fetch;
const catalog = [
  { sku:'GIFT-100',type:'value',name:'$100 Gift',currency:'CAD',face_value_cents:10000,sale_price_cents:10000,is_active:true },
  { sku:'SVC-complete_detail-small',type:'service',name:'Complete Detail — Small Vehicle',currency:'CAD',face_value_cents:31900,sale_price_cents:31900,package_code:'complete_detail',vehicle_size:'small',is_active:true },
  { sku:'SERVICE-complete_detail-small',type:'service',name:'Wrong legacy SKU',currency:'CAD',face_value_cents:31900,sale_price_cents:31900,package_code:'complete_detail',vehicle_size:'small',is_active:true },
  { sku:'GIFT-999',type:'value',name:'Inactive gift',currency:'CAD',face_value_cents:99900,sale_price_cents:99900,is_active:false }
];
const stripeCalls = [];
const requestId = 'fa8e41ba-7b82-4ab2-9dc6-92453ac7274a';
const payload = { items:[{sku:'SVC-complete_detail-small',qty:1}],purchaser_email:'buyer@example.test',
  recipient_email:'recipient@example.test',recipient_name:'Friend',checkout_request_id:requestId };
const post = (path, body) => new Request(`https://rosiedazzlers.ca${path}`, {
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
});

globalThis.fetch = async (input, options={}) => {
  const url = new URL(input);
  if (url.hostname === 'db.example.test' && url.pathname.endsWith('/gift_products')) {
    const rows = url.searchParams.has('sku') ? catalog.filter(p => ['GIFT-100','SVC-complete_detail-small','SERVICE-complete_detail-small','GIFT-999'].includes(p.sku)) : catalog;
    return Response.json(rows);
  }
  if (url.hostname === 'api.stripe.com') {
    assert.equal(options.method, 'POST');
    stripeCalls.push({ key:options.headers['Idempotency-Key'],form:new URLSearchParams(options.body) });
    return Response.json({id:'cs_test_build741',url:'https://checkout.stripe.com/c/pay/mock741'});
  }
  if (url.hostname === 'db.example.test' && url.pathname.endsWith('/gift_certificates')) {
    return Response.json([{id:'gift741',code:'RD-741TEST',sku:'GIFT-100',status:'active',type:'value',
      currency:'CAD',face_value_cents:10000,remaining_cents:7500,expires_at:'2027-11-01T00:00:00Z'}]);
  }
  if (url.hostname === 'db.example.test' && url.pathname.endsWith('/gift_certificate_redemptions')) {
    return Response.json([{gift_certificate_id:'gift741',amount_cents:2500}]);
  }
  throw Error(`Unexpected request ${url.pathname}`);
};

try {
  const list = await getCatalog({env});
  assert.equal(list.status,200);
  const options = (await list.json()).products;
  assert.deepEqual(options.map(p=>p.sku),['GIFT-100','SVC-complete_detail-small']);
  assert.equal(options[1].sale_price_cents,31900,'Live Complete Detail small is present');
  assert.ok(!JSON.stringify(options).includes('service-mock'),'Catalog must never return privileged key');

  const first = await startCheckout({request:post('/api/gifts/checkout',payload),env});
  assert.equal(first.status,200);
  assert.equal((await first.json()).checkout_url,'https://checkout.stripe.com/c/pay/mock741');
  const retry = await startCheckout({request:post('/api/gifts/checkout',payload),env});
  assert.equal(retry.status,200);
  assert.equal(stripeCalls.length,2);
  assert.equal(stripeCalls[0].key,stripeCalls[1].key,'Same request intent uses same provider key');
  assert.deepEqual([...stripeCalls[0].form],[...stripeCalls[1].form], 'Provider payload stays exactly the same on retry');
  assert.equal(stripeCalls[0].form.get('metadata[cart]'),'SVC-complete_detail-small:1:');
  assert.equal(stripeCalls[0].form.has('metadata[vehicle_year]'),false,'Gift recipient selects actual vehicle on booking');
  assert.match(stripeCalls[0].form.get('integration_identifier'),/^rosie-gift-[a-z]{8}$/);

  const badSku = await startCheckout({request:post('/api/gifts/checkout',{...payload,items:[{sku:'SERVICE-complete_detail-small',qty:1}]}),env});
  assert.equal(badSku.status,400,'Legacy service SKU cannot checkout');
  const invalidKey = await startCheckout({request:post('/api/gifts/checkout',{...payload,checkout_request_id:'not-uuid'}),env});
  assert.equal(invalidKey.status,400);
  assert.equal(stripeCalls.length,2,'Rejected requests must not touch payment provider');

  const storeValues = new Map();
  const storage = { getItem:key=>storeValues.get(key)||null, setItem:(key,val)=>storeValues.set(key,val), removeItem:key=>storeValues.delete(key) };
  const draft = {items:[{sku:'GIFT-100',qty:1}],purchaser_email:'buy@example.test'};
  let uuidCount = 0;
  const uuid = () => {uuidCount++;return requestId;};
  assert.equal(prepareGiftCheckoutIntent(storage,'dollar',draft,uuid,1000).checkout_request_id,requestId);
  assert.equal(prepareGiftCheckoutIntent(storage,'dollar',draft,uuid,1100).checkout_request_id,requestId);
  assert.equal(uuidCount,1,'Identical retry reuses intent');
  assert.equal(readGiftCheckoutDraft(storage,1100+3600001),null,'Stale drafts are not revived');
  clearGiftCheckoutDraft(storage);
  assert.equal(readGiftCheckoutDraft(storage),null);

  const receipt = await lookupReceipt({request:post('/api/gifts/receipt',{session_id:'cs_test_741',email:'buyer@example.test'}),env});
  assert.equal(receipt.status,200);
  const gift = (await receipt.json()).gifts[0];
  assert.equal(gift.balance_evidence,'reconciled');
  assert.equal(gift.used,'$25.00');
  assert.equal(gift.remaining,'$75.00');
  assert.equal(gift.delivery_state,'staff_or_provider_verification_required');

  const ui = source('gifts.html');
  assert.match(ui,/liveGiftProducts/);
  assert.match(ui,/selectedServiceProduct/);
  assert.match(ui,/clearGiftCheckoutDraft/);
  assert.match(ui,/beginGiftCheckout\('service'/);
  assert.match(source('functions/api/checkout.js'),/redeem_gift_certificate_booking_v741/);
  assert.doesNotMatch(source('functions/api/checkout.js'),/rest\/v1\/gift_certificate_redemptions.*method:\s*"POST"/);
  const migration = source('supabase/migrations/20261102012000_build741_atomic_gift_redemption.sql');
  for (const token of ['for update','security invoker','gift_certificate_redemptions_booking_once_v741',
    'grant execute','v_gift.face_value_cents - v_gift.remaining_cents <> v_ledger']) assert.ok(migration.includes(token));
  console.log('Build 741 live catalog, small Complete Detail, service SKU, checkout idempotency, draft retry, ledger and hold: PASS');
} finally { globalThis.fetch = originalFetch; }
