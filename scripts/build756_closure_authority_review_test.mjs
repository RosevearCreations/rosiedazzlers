import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceReadbackPath756,readAuthoritativeEconomicSource756,
  probeOwnerDecisionPersistence756,reconcileEconomicClosure756} from '../functions/api/_lib/economic-closure-review-v756.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete} from '../functions/api/admin/economic_closure_review_v756.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const booking='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const original='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const batch='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const env={SUPABASE_URL:'https://supabase.test',SUPABASE_SERVICE_ROLE_KEY:'test-only-private-key'};
const record={schema:'rosie-economic-source-record-v755',booking_id:booking,period:'2026-11',
  source_record_id:original,source_recorded_at:'2026-11-03T08:45:00Z',source_system:'accounting_records'};
const path=sourceReadbackPath756(record);
assert.ok(path.startsWith('accounting_records?'));
assert.match(path,/id=eq\./);
assert.ok(!path.includes('customer_email'));
let calls=[];
const response=(rows,status=200)=>new Response(JSON.stringify(rows),{status,headers:{'Content-Type':'application/json'}});
const fetchGood=async(url,opts)=>{
  calls.push({url,opts});
  assert.equal(opts.method,'GET');
  if(url.includes('accounting_records?'))return response([{id:original,booking_id:booking,
    created_at:'2026-11-03T08:00:00Z',updated_at:'2026-11-03T09:00:00Z',package_code:'basic_detail',vehicle_size:'mid',total_cad:269}]);
  throw Error('unexpected table');
};
const found=await readAuthoritativeEconomicSource756(env,record,fetchGood);
assert.equal(found.readback_status,'CURRENT_ROW_IDENTITY_MATCHED_HISTORY_UNVERIFIED');
assert.equal(found.source_row_identity_matched,true);
assert.equal(found.original_revision_custody_verified,false);
assert.equal(found.immutable_source_history_verified,false);
assert.match(found.current_source_row_hash_sha256,/^[0-9a-f]{64}$/);
assert.equal(calls.length,1);
assert.match(calls[0].url,/accounting_records/);
assert.ok(!JSON.stringify(calls).includes('customer_email'));

const other=await readAuthoritativeEconomicSource756(env,record,async()=>response([{id:original,booking_id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'}]));
assert.equal(other.readback_status,'HOLD_BOOKING_BINDING_MISMATCH');
assert.equal((await readAuthoritativeEconomicSource756(env,record,async()=>response([]))).readback_status,'HOLD_AUTHORITY_READBACK_UNAVAILABLE');
assert.equal((await readAuthoritativeEconomicSource756(env,record,async()=>response([{id:original},{id:original}]))).readback_status,'HOLD_AUTHORITY_READBACK_UNAVAILABLE');
assert.equal((await readAuthoritativeEconomicSource756(env,record,async()=>response([],404))).readback_status,'HOLD_AUTHORITY_READBACK_UNAVAILABLE');
assert.equal((await readAuthoritativeEconomicSource756(env,record,async()=>{throw Error('network');})).readback_status,'HOLD_AUTHORITY_READBACK_UNAVAILABLE');
assert.equal((await readAuthoritativeEconomicSource756(env,{...record,source_system:'managed_pricing_catalog'},async()=>{throw Error('should not fetch');})).readback_status,'HOLD_SOURCE_SELECTOR_UNSUPPORTED');
assert.equal((await readAuthoritativeEconomicSource756(env,{...record,source_record_id:'not-a-uuid'},async()=>{throw Error('should not fetch');})).readback_status,'HOLD_SOURCE_SELECTOR_UNSUPPORTED');
assert.equal((await readAuthoritativeEconomicSource756(env,record,async()=>response([{id:original,booking_id:booking,updated_at:'2026-11-03T07:00:00Z'}]))).readback_status,'HOLD_REVISION_TIME_CONFLICT');

const posting={...record,source_system:'catalog_inventory_posting_rows'};
const goodPosting=await readAuthoritativeEconomicSource756(env,posting,async url=>{
  if(url.includes('catalog_inventory_posting_rows?'))return response([{id:original,batch_id:batch,created_at:'2026-11-03T09:00:00Z'}]);
  if(url.includes('catalog_inventory_posting_batches?'))return response([{id:batch,source_kind:'booking',source_reference_id:booking,status:'posted'}]);
  throw Error('other');
});
assert.equal(goodPosting.source_row_identity_matched,true);
assert.equal(goodPosting.original_revision_custody_verified,false);
const wrongBatch=await readAuthoritativeEconomicSource756(env,posting,async url=>{
  if(url.includes('catalog_inventory_posting_rows?'))return response([{id:original,batch_id:batch}]);
  return response([{id:batch,source_kind:'creative_project',source_reference_id:booking}]);
});
assert.equal(wrongBatch.readback_status,'HOLD_POSTING_BATCH_SCOPE');

const probe404=await probeOwnerDecisionPersistence756(env,async(url,opts)=>{
  assert.match(url,/economic_owner_closure_decision_audit/);assert.equal(opts.method,'GET');return response([],404);
});
assert.equal(probe404.probe_status,'HOLD_AUDIT_TABLE_UNAVAILABLE');
assert.equal(probe404.owner_decision_persistence_ready,false);
const probe200=await probeOwnerDecisionPersistence756(env,async(url,opts)=>{
  assert.match(url,/limit=0/);assert.equal(opts.method,'GET');return response([]);
});
assert.equal(probe200.probe_status,'AUDIT_TABLE_VISIBLE_WRITE_POLICY_UNVERIFIED');
assert.equal(probe200.audit_table_visible,true);
assert.equal(probe200.owner_decision_persistence_ready,false);
assert.equal(probe200.append_only_policy_verified,false);
const prior_review={evidence_status:'MATCHED_SOURCE_DOCUMENT_MANUAL_CLOSURE_HOLD'};
const closure=await reconcileEconomicClosure756({prior_review,readback:found,persistence:probe200,reviewed_at:'2026-11-03T10:00:00Z'});
assert.equal(closure.closure_review_status,'HOLD_CLOSURE_AUTHORIZATION');
assert.equal(closure.source_readback.source_row_identity_matched,true);
assert.equal(closure.blocking_count,3);
assert.deepEqual(closure.follow_ups.map(x=>x.code),['IMMUTABLE_SOURCE_HISTORY_REQUIRED','OWNER_PERSISTENCE_NOT_AUTHORIZED','EXPLICIT_OWNER_CLOSURE_AUTHORIZATION']);
assert.match(closure.review_packet_sha256,/^[0-9a-f]{64}$/);
for(const field of ['source_record_custody_verified','owner_decision_persistence_ready','owner_closure_audit_persisted',
  'closure_authorized','closure_recorded','closure_allowed','automatic_business_write'])assert.equal(closure[field],false,field);
const blocked=await reconcileEconomicClosure756({prior_review:{evidence_status:'HOLD_RECEIPT_OR_SOURCE_RECHECK'},readback:other,persistence:probe404});
assert.ok(blocked.blocking_count>=5);
assert.equal(blocked.closure_allowed,false);

let externalReads=0;const nativeFetch=globalThis.fetch;
globalThis.fetch=async()=>{externalReads++;throw Error('anonymous must not read');};
try{
  for(const method of [onRequestGet,onRequestPost]){
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_closure_review_v756',{
      method:method===onRequestPost?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca','Content-Type':'application/json'},
      ...(method===onRequestPost?{body:JSON.stringify({period:'2026-11',booking_id:booking,source_record:record,owner_receipt:{payload:{}},source_attestation:{payload:{}}})}:{})});
    const result=await method({request,env});assert.ok(result.status>=400);
  }
  assert.equal(externalReads,0);
}finally{globalThis.fetch=nativeFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-closure-v756','admin-economic-intake-v755','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`${stem} route mirror`);
assert.match(read('admin-catalog.html'),/admin-economic-closure-v756\.html/);
assert.match(read('admin-economic-intake-v755.html'),/admin-economic-closure-v756\.html/);
assert.match(read('assets/economic-closure-v756.js'),/credentials:'same-origin'/);
assert.doesNotMatch(read('functions/api/admin/economic_closure_review_v756.js'),/fetch\(.*\{method:'(?:POST|PUT|PATCH|DELETE)'/s);
console.log('Build 756 PASS: allowlisted authoritative booking-bound GET, posting batch provenance, no immutable-history overclaim, owner audit persistence probe HOLD, no closure writes, auth and route parity.');
