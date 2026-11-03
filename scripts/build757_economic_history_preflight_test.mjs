import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonicalHistoryRevision757,canonicalCustodianManifest757,readSourceHistory757,
  verifyHistoryPreflight757,reconcileHistoryAuthorization757,HISTORY_FIELDS757} from '../functions/api/_lib/economic-history-preflight-v757.js';
import {canonicalSourceRecord755} from '../functions/api/_lib/economic-source-intake-v755.js';
import {sha256Receipt754} from '../functions/api/_lib/owner-receipt-verification-v754.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete} from '../functions/api/admin/economic_history_preflight_v757.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const b64=data=>Buffer.from(data).toString('base64');
const sha=async text=>sha256Receipt754(new TextEncoder().encode(text));
const [custodian,owner,witness]=await Promise.all([1,2,3].map(()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const env={SUPABASE_URL:'https://supabase.test',SUPABASE_SERVICE_ROLE_KEY:'private-test-only',
  ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64:b64(await crypto.subtle.exportKey('raw',custodian.publicKey)),
  ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID:'independent-history-757',
  ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64:b64(await crypto.subtle.exportKey('raw',owner.publicKey)),
  ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID:'owner-reviewer-757',
  ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64:b64(await crypto.subtle.exportKey('raw',witness.publicKey)),
  ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID:'witness-reviewer-757'};
const booking='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',source='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const record={schema:'rosie-economic-source-record-v755',booking_id:booking,period:'2026-11',
  source_correction_reference:'source-correction-757',source_system:'accounting_records',
  source_record_id:source,source_revision_id:'revision-757-b',source_recorded_at:'2026-11-03T09:00:00Z',
  source_actor_id:'operator-757',correction_kind:'accounting_reconciliation',
  baseline_snapshot_sha256:'a'.repeat(64),retest_snapshot_sha256:'b'.repeat(64),
  original_provenance_reference:'record-history-757'};
const recordHash=await sha256Receipt754(canonicalSourceRecord755(record));
const base={booking_id:booking,source_system:record.source_system,source_record_id:source,
  source_actor_id:'operator-757',source_correction_reference:record.source_correction_reference,
  source_record_sha256:recordHash};
const first={...base,source_revision_id:'revision-757-a',source_recorded_at:'2026-11-03T08:00:00Z',
  revision_number:1,prev_revision_sha256:'0'.repeat(64)};
const firstHash=await sha(canonicalHistoryRevision757(first));
const second={...base,source_revision_id:record.source_revision_id,source_recorded_at:record.source_recorded_at,
  revision_number:2,prev_revision_sha256:firstHash};
const head=await sha(canonicalHistoryRevision757(second));
const rows=[first,second],now=Date.parse('2026-11-03T10:00:00Z');
const payload={schema:'rosie-economic-history-custodian-v757',booking_id:booking,source_system:record.source_system,
  source_record_id:source,source_revision_id:record.source_revision_id,source_record_sha256:recordHash,
  history_head_sha256:head,revision_count:'2',issued_at:'2026-11-03T09:20:00Z',
  expires_at:'2026-11-04T09:20:00Z',custodian_id:'external-custodian-757',key_id:env.ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID};
const sign=async(p,key=custodian.privateKey)=>({payload:p,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',key,canonicalCustodianManifest757(p)))});
const manifest=await sign(payload);
const good=await verifyHistoryPreflight757({record,manifest,history:{status:'HISTORY_ROWS_READ',rows},env,now});
assert.equal(good.history_status,'HISTORY_CHAIN_AND_INDEPENDENT_HEAD_MATCHED_RETENTION_UNVERIFIED');
assert.equal(good.history_chain_integrity_verified,true);
assert.equal(good.independent_history_head_signature_verified,true);
assert.equal(good.history_head_sha256,head);
for(const field of ['source_record_custody_verified','immutable_source_history_verified','immutable_retention_policy_verified'])
  assert.equal(good[field],false,field);
const review=async(changes={})=>verifyHistoryPreflight757({record,manifest,history:{status:'HISTORY_ROWS_READ',rows},env,now,...changes});
assert.equal((await review({history:{status:'HISTORY_ROWS_READ',rows:[first,{...second,source_actor_id:'tamper-757'}]}})).history_status,'HOLD_HISTORY_CHAIN_CONFLICT');
assert.equal((await review({history:{status:'HISTORY_ROWS_READ',rows:[second,first]}})).history_status,'HOLD_HISTORY_CHAIN_CONFLICT');
assert.equal((await review({history:{status:'HISTORY_ROWS_READ',rows:[first,{...second,revision_number:3}]}})).history_status,'HOLD_HISTORY_CHAIN_CONFLICT');
assert.equal((await review({manifest:await sign({...payload,history_head_sha256:'f'.repeat(64)})})).history_status,'HOLD_HISTORY_CHAIN_CONFLICT');
assert.equal((await review({manifest:await sign({...payload,expires_at:'2026-11-03T09:30:00Z'})})).history_status,'HOLD_HISTORY_MANIFEST_SCOPE');
assert.equal((await review({manifest:await sign({...payload,booking_id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'})})).history_status,'HOLD_HISTORY_MANIFEST_SCOPE');
assert.equal((await review({manifest:await sign(payload,owner.privateKey)})).history_status,'HOLD_CUSTODIAN_SIGNATURE_INVALID');
assert.equal((await review({env:{...env,ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64:env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).history_status,'HOLD_INDEPENDENT_CUSTODIAN_KEY');
assert.equal((await review({history:{status:'HOLD_SOURCE_HISTORY_UNAVAILABLE',rows:[]}})).history_status,'HOLD_SOURCE_HISTORY_UNAVAILABLE');
assert.throws(()=>canonicalCustodianManifest757({...payload,extra:'bad'}),/canonical/);
assert.equal(HISTORY_FIELDS757.length,10);
let requests=[];
const sourceRead=await readSourceHistory757(env,record,async(url,opts)=>{
  requests.push({url,method:opts.method,headers:opts.headers});
  return new Response(JSON.stringify(rows),{status:200});
});
assert.equal(sourceRead.status,'HISTORY_ROWS_READ');
assert.equal(requests.length,1);
assert.match(requests[0].url,/economic_source_revision_history/);
assert.match(requests[0].url,/limit=65/);
assert.equal(requests[0].method,'GET');
assert.ok(!requests[0].url.includes('customer_email'));
assert.equal((await readSourceHistory757(env,{...record,source_system:'managed_pricing_catalog'},async()=>{throw Error('must not fetch');})).status,'HOLD_UNSUPPORTED_HISTORY_SCOPE');
assert.equal((await readSourceHistory757(env,record,async()=>new Response('[]',{status:200}))).status,'HOLD_SOURCE_HISTORY_MISSING_OR_OVERSIZED');
assert.equal((await readSourceHistory757(env,record,async()=>new Response('[]',{status:404}))).status,'HOLD_SOURCE_HISTORY_UNAVAILABLE');
const prior={closure_review_status:'HOLD_CLOSURE_AUTHORIZATION',source_readback:{source_row_identity_matched:true}};
const audit={probe_status:'AUDIT_TABLE_VISIBLE_WRITE_POLICY_UNVERIFIED'};
const preflight=await reconcileHistoryAuthorization757({prior_review:prior,history_verification:good,audit_readiness:audit,reviewed_at:'2026-11-03T11:00:00Z'});
assert.deepEqual(preflight.follow_ups.map(x=>x.code),['IMMUTABLE_RETENTION_NOT_PROVEN','APPEND_ONLY_OWNER_AUDIT_NOT_AUTHORIZED','EXPLICIT_OWNER_CLOSURE_NOT_RECORDED']);
assert.match(preflight.preflight_sha256,/^[a-f0-9]{64}$/);
for(const field of ['source_record_custody_verified','owner_audit_persistence_authorized','owner_closure_audit_persisted',
  'closure_authorized','closure_recorded','closure_allowed','automatic_business_write'])assert.equal(preflight[field],false,field);

let anonymousReads=0;const nativeFetch=globalThis.fetch;
globalThis.fetch=async()=>{anonymousReads++;throw Error('Unauthorized read');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const post=fn===onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_history_preflight_v757',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca','Content-Type':'application/json'},
      ...(post?{body:JSON.stringify({period:'2026-11',booking_id:booking,source_record:record,history_manifest:manifest})}:{})});
    const r=await fn({request,env});assert.ok(r.status>=400);
  }
  assert.equal(anonymousReads,0);
}finally{globalThis.fetch=nativeFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-history-v757','admin-economic-closure-v756','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`${stem} mirror`);
assert.match(read('admin-catalog.html'),/admin-economic-history-v757\.html/);
assert.match(read('admin-economic-closure-v756.html'),/admin-economic-history-v757\.html/);
assert.match(read('assets/economic-history-v757.js'),/credentials:'same-origin'/);
assert.doesNotMatch(read('functions/api/admin/economic_history_preflight_v757.js'),/fetch\([^\n]*method:'(?:POST|PUT|PATCH|DELETE)'/);
assert.match(read('docs/build757_immutable_history_append_only_audit_preflight.md'),/DESIGN ONLY/);
console.log('Build 757 PASS: independent history head, bounded source chain, anti-tamper, retention and persistence HOLD, private read-only preflight, mirrors and links.');
