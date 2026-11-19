import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {evaluateQuoteReadiness910,mediaRetentionReceipt910} from '../functions/api/_lib/quote-retention-readiness-v910.js';
import {hashStructuredQuoteTerms} from '../functions/api/_lib/quote-booking-terms.js';
import {onRequestGet,onRequestPost} from '../functions/api/client/quote_readiness_v910.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const when='2030-01-20T13:00:00.000Z';
const accepted={version:1,package_code:'basic_detail',vehicle_size:'small',
 addon_codes:['wax'],total_cents:15000,deposit_cents:5000,expires_at:when,currency:'CAD'};
async function quote(){
 const hash=await hashStructuredQuoteTerms(accepted);
 return {id:'d23e7d2d-c36f-4d3b-a752-100aaa9a7dc0',acceptance_status:'accepted',
  accepted_at:'2026-11-18T12:00:00Z',accepted_terms:accepted,
  accepted_terms_hash:hash,structured_terms_hash:hash};
}
const price={ok:true,package_code:'basic_detail',vehicle_size:'small',addon_codes:['wax'],
 total_cents:15000,deposit_cents:5000};
test('910: exact accepted terms + current catalog match cannot skip date/site/payment authority',async()=>{
 const x=await evaluateQuoteReadiness910(await quote(),price,null,Date.parse('2026-11-18T15:00:00Z'));
 assert.equal(x.state,'READY_FOR_SCHEDULE_RECHECK');assert.equal(x.current_price_checked,true);
 assert.equal(x.slot_checked,false);assert.equal(x.booking_created,false);assert.equal(x.payment_attempted,false);
 assert.equal(x.requires_staff_confirmation,true);
});
test('910: stale price, stale terms, expiration and duplicate booking hold safely',async()=>{
 const q=await quote();
 assert.equal((await evaluateQuoteReadiness910(q,{...price,total_cents:16000},null,Date.parse('2026-11-18T15:00:00Z'))).state,'HOLD_REQUOTE');
 assert.equal((await evaluateQuoteReadiness910({...q,accepted_terms_hash:'a'.repeat(64)},price,null,Date.parse('2026-11-18T15:00:00Z'))).state,'HOLD_SOURCE_MISMATCH');
 assert.equal((await evaluateQuoteReadiness910(q,price,null,Date.parse('2031-01-01T00:00:00Z'))).state,'HOLD_EXPIRED');
 assert.equal((await evaluateQuoteReadiness910(q,price,{id:'valid'},Date.parse('2026-11-18T15:00:00Z'))).state,'BOOKING_EXISTS');
 assert.equal((await evaluateQuoteReadiness910({...q,acceptance_status:'sent'},price,null,Date.parse('2026-11-18T15:00:00Z'))).state,'AWAITING_ACCEPTANCE');
});
test('910: media evidence receipt is source-only, excludes URLs and cannot assert deletion',async()=>{
 const rows=[{id:'a',status:'uploaded',verified_at:'2026-11-18T12:00:00Z',linked_at:'2026-11-18T12:01:00Z',
  content_type:'image/jpeg',privacy_status:'approved_private',reviewed_at:'2026-11-18T12:05:00Z',
  object_path:'private/hidden',media_url:'https://secret.invalid/x',upload_proof_hash:'a'.repeat(64)},
 {id:'b',status:'pending',content_type:'video/mp4',verified_at:null}];
 const x=await mediaRetentionReceipt910(rows,'quote','d23e7d2d-c36f-4d3b-a752-100aaa9a7dc0');
 assert.equal(x.verified_items,1);assert.equal(x.private_reviewed_items,1);
 assert.equal(x.retention_state,'HOLD_RETENTION_SOURCE_NOT_WITNESSED');
 assert.equal(x.storage_deletion_witnessed,false);assert.equal(x.retention_policy_confirmed,false);
 assert.equal(JSON.stringify(x).includes('private/hidden'),false);
 assert.match(x.source_revision_sha256,/^[a-f0-9]{64}$/);
});
test('910: no unauthenticated mutation or broad quote ID searches',async()=>{
 const env={SUPABASE_URL:'https://mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'unit-test'};
 const origin='https://rosiedazzlers.ca/api/client/quote_readiness_v910';
 const denied=await onRequestPost({request:new Request(origin,{method:'POST'}),env});
 assert.equal(denied.status,405);
 const invalid=await onRequestGet({request:new Request(origin+'?customer_email=private%40example.com'),env});
 assert.equal(invalid.status,400);
 const unconfigured=await onRequestGet({request:new Request(origin+'?quote_id=d23e7d2d-c36f-4d3b-a752-100aaa9a7dc0'),env:{}});
 assert.equal(unconfigured.status,503);
});
test('910: customer account route included; no storage object URLs or source token in response code',()=>{
 const page=readFileSync(new URL('../my-account/index.html',import.meta.url),'utf8');
 const asset=readFileSync(new URL('../assets/customer-quote-readiness-v910.mjs',import.meta.url),'utf8');
 const endpoint=readFileSync(new URL('../functions/api/client/quote_readiness_v910.js',import.meta.url),'utf8');
 assert.match(page,/customer-quote-readiness-v910/);
 assert.match(asset,/credentials:'same-origin'/);
 assert.match(asset,/No booking, charge or notification/);
 assert.doesNotMatch(endpoint,/object_path|media_url|stripe\.com|paypal\.com/);
});
