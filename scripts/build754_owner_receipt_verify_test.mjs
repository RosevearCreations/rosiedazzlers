import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OWNER_FIELDS754,SOURCE_FIELDS754,canonicalEconomicReceipt754,sha256Receipt754,verifyOwnerEconomicProof754} from '../functions/api/_lib/owner-receipt-verification-v754.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete} from '../functions/api/admin/economic_receipt_verify_v754.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const base64=buf=>Buffer.from(buf).toString('base64');
const [ownerKeys,sourceKeys]=await Promise.all(Array.from({length:2},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const ownerPublic=base64(await crypto.subtle.exportKey('raw',ownerKeys.publicKey));
const sourcePublic=base64(await crypto.subtle.exportKey('raw',sourceKeys.publicKey));
const env={ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64:ownerPublic,
  ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64:sourcePublic,
  ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID:'owner-key-fixture-754',
  ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID:'source-key-fixture-754'};
const bookingId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',oldHash='a'.repeat(64),newHash='b'.repeat(64),now=Date.parse('2026-11-03T10:00:00Z');
const live={ok:true,build:753,source_build:752,period:{year:2026,month:11},snapshot_sha256:newHash,
  rows:[{booking_id:bookingId,decision_gate:'owner_review_candidate'}],exceptions:[]};
const sourcePayload={schema:'rosie-source-correction-attestation-v754',booking_id:bookingId,period:'2026-11',
  baseline_snapshot_sha256:oldHash,retest_snapshot_sha256:newHash,source_correction_reference:'ledger-correction-754-456',
  source_record_sha256:'c'.repeat(64),issuer_id:'source-witness-754',issuer_role:'finance_reviewer',
  issued_at:'2026-11-03T09:00:00Z',expires_at:'2026-11-04T09:00:00Z',nonce:'d'.repeat(32),key_id:env.ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID};
const sourceTranscript=canonicalEconomicReceipt754(sourcePayload,'source');
const ownerPayload={schema:'rosie-owner-economic-receipt-v754',booking_id:bookingId,period:'2026-11',
  baseline_snapshot_sha256:oldHash,retest_snapshot_sha256:newHash,
  source_attestation_sha256:await sha256Receipt754(sourceTranscript),source_correction_reference:sourcePayload.source_correction_reference,
  owner_id:'owner-person-754',owner_role:'owner',decision:'approve_for_manual_closure_review',
  issued_at:'2026-11-03T09:10:00Z',expires_at:'2026-11-04T09:10:00Z',nonce:'e'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const sign=async(payload,kind,key)=>({payload,signature_b64:base64(await crypto.subtle.sign('Ed25519',key,canonicalEconomicReceipt754(payload,kind)))});
const owner_receipt=await sign(ownerPayload,'owner',ownerKeys.privateKey),source_attestation=await sign(sourcePayload,'source',sourceKeys.privateKey);
const check=async(changes={})=>verifyOwnerEconomicProof754({owner_receipt,source_attestation,live,env,now,...changes});
const success=await check();
assert.equal(success.closure_gate,'ELIGIBLE_FOR_MANUAL_CLOSURE_REVIEW');
assert.equal(success.owner_receipt_authenticated,true);
assert.equal(success.source_attestation_authenticated,true);
for(const forbidden of ['source_correction_record_verified','closure_recorded','closure_allowed','automatic_business_write'])assert.equal(success[forbidden],false,forbidden);
assert.equal((await check({env:{}})).closure_gate,'HOLD_KEYS_NOT_CONFIGURED');
assert.equal((await check({env:{...env,ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64:ownerPublic}})).closure_gate,'HOLD_KEYS_NOT_INDEPENDENT');
assert.equal((await check({env:{...env,ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID}})).closure_gate,'HOLD_KEYS_NOT_INDEPENDENT');
assert.equal((await check({owner_receipt:{...owner_receipt,signature_b64:source_attestation.signature_b64}})).closure_gate,'HOLD_SIGNATURE_INVALID');
assert.equal((await check({owner_receipt:{...owner_receipt,payload:{...ownerPayload,owner_role:'manager'}}})).closure_gate,'HOLD_RECEIPT_SCOPE');
assert.equal((await check({owner_receipt:{...owner_receipt,payload:{...ownerPayload,source_attestation_sha256:'f'.repeat(64)}}})).closure_gate,'HOLD_ATTESTATION_BINDING');
assert.equal((await check({owner_receipt:{...owner_receipt,payload:{...ownerPayload,extra:'nope'}}})).closure_gate,'HOLD_RECEIPT_FORMAT');
assert.equal((await check({live:{...live,snapshot_sha256:'f'.repeat(64)}})).closure_gate,'HOLD_LIVE_SOURCE_DRIFT');
assert.equal((await check({live:{...live,exceptions:[{booking_id:bookingId,code:'unreconciled_cost'}]}})).closure_gate,'HOLD_SOURCE_EXCEPTIONS');
assert.equal((await check({live:{...live,rows:[]}})).closure_gate,'HOLD_SOURCE_EXCEPTIONS');
assert.equal((await check({now:Date.parse('2026-11-06T09:00:00Z')})).closure_gate,'HOLD_RECEIPT_SCOPE');
const holdOwner=await sign({...ownerPayload,decision:'retain_hold'},'owner',ownerKeys.privateKey);
assert.equal((await check({owner_receipt:holdOwner})).closure_gate,'HOLD_OWNER_DECISION');
assert.deepEqual(OWNER_FIELDS754.slice(0,3),['schema','booking_id','period']);
assert.deepEqual(SOURCE_FIELDS754.slice(0,3),['schema','booking_id','period']);

// No anonymous or bridge-only access to protected source data, regardless of the supplied signed JSON.
let calls=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{calls++;throw Error('Anonymous private source access');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const req=new Request('https://rosiedazzlers.ca/api/admin/economic_receipt_verify_v754',{
      method:fn===onRequestPost?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca','Content-Type':'application/json'},
      ...(fn===onRequestPost?{body:JSON.stringify({period:'2026-11',booking_id:bookingId,owner_receipt,source_attestation})}:{})});
    const result=await fn({request:req,env:{SUPABASE_URL:'https://invalid.example',SUPABASE_SERVICE_ROLE_KEY:'test-only',...env}});
    assert.ok(result.status>=400);
  }
  assert.equal(calls,0);
}finally{globalThis.fetch=originalFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await fn()).status,405);
assert.equal(read('admin-economic-verify-v754.html'),read('admin-economic-verify-v754/index.html'),'Build 754 pretty route parity');
assert.equal(read('admin-economic-retest-v753.html'),read('admin-economic-retest-v753/index.html'),'Build 753 route parity');
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'),'Catalog route parity');
assert.match(read('admin-catalog.html'),/admin-economic-verify-v754\.html/);
assert.match(read('admin-economic-retest-v753.html'),/admin-economic-verify-v754\.html/);
assert.match(read('assets/economic-verify-v754.js'),/credentials:'same-origin'/);
assert.match(read('functions/api/admin/economic_receipt_verify_v754.js'),/sourceRead753/);
assert.doesNotMatch(read('functions/api/admin/economic_receipt_verify_v754.js'),/fetch\(.*\{method:'(?:POST|PATCH|PUT|DELETE)'/s);
console.log('Build 754 PASS: real independent Ed25519 signatures, owner/source binding, current source HOLD, no business closure, private auth, and route parity.');
