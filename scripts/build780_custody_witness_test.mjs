import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {reconcileCustodyDecisionWitness780} from '../functions/api/_lib/economic-custody-decision-witness-v780.js';
globalThis.crypto??=webcrypto;
const hash=c=>c.repeat(64);
const expiry={ok:true,build:777,read_only:true,closure_allowed:false,
  custody_expiry_status:'CURRENT_WITNESS_READY_FOR_SEPARATE_OWNER_CUSTODIAN_REVIEW',
  packet_sha256:hash('a'),original_signed_custody_receipt_sha256:hash('b'),
  original_retained_source_history_sha256:hash('c'),
  original_custody_renewal_register_sha256:hash('d')};
const follow={ok:true,build:778,read_only:true,closure_allowed:false,
  custody_renewed_by_app:false,predecessor_status:expiry.custody_expiry_status,
  packet_sha256:hash('e'),original_source_digest:hash('c'),
  original_custody_receipt_sha256:hash('b'),original_custody_register_sha256:hash('d')};
const rows=[
  ['ORIGINAL_OWNER_CUSTODY_DECISION','original_owner','PENDING_SEPARATE_ORIGINAL_OWNER_DECISION'],
  ['INDEPENDENT_CUSTODIAN_RENEWAL','original_custodian','CURRENT_FOR_SEPARATE_MANUAL_REVIEW'],
  ['SIGNED_SOURCE_EXCEPTION_DISPOSITION','independent_exception_issuer','NO_OPEN_EXCEPTION_CLAIM_FOR_MANUAL_REVIEW']
].map(([decision_key,issuer_role,status])=>({decision_key,issuer_role,status}));
const register={ok:true,build:779,read_only:true,closure_allowed:false,
  production_database_written_by_app:false,packet_sha256:hash('f'),
  original_retained_source_history_sha256:hash('c'),
  original_custody_receipt_sha256:hash('b'),
  original_custody_register_sha256:hash('d'),original_open_exception_count:0,
  custody_decision_register_status:'CURRENT_SOURCE_SEPARATE_OWNER_CUSTODIAN_DECISION_PENDING',
  decision_rows:rows};
const history={report:{ok:true},exception:{signature_authenticated:true,open_exception_count:0}};
const check=(r={},e={},f={},h=history)=>reconcileCustodyDecisionWitness780({
  register:{...register,...r},expiryReport:{...expiry,...e},followupReport:{...follow,...f},
  history:h,now:Date.parse('2026-11-09T12:00:00Z')});
const ready=await check();
assert.equal(ready.witness_reconciliation_status,'SOURCE_CHAIN_MATCHED_EXTERNAL_WITNESSES_STILL_REQUIRED');
assert.equal(ready.original_source_chain_reconciled,true);
assert.equal(ready.witness_rows.length,3);
assert.deepEqual(ready.witness_rows.map(x=>x.role),rows.map(x=>x.issuer_role));
assert.match(ready.packet_sha256,/^[a-f0-9]{64}$/);
for(const flag of ['independent_original_owner_signature_verified',
  'independent_custodian_renewal_signature_verified',
  'independent_exception_disposition_signature_verified',
  'closure_allowed','original_owner_business_signoff_by_app',
  'custodian_renewal_executed_by_app','original_dispute_closed_by_app',
  'source_expiry_extended_by_app','source_retention_modified_by_app',
  'production_database_written_by_app','append_only_audit_written_by_app',
  'external_notification_sent_by_app','automatic_business_action'])
  assert.equal(ready[flag],false,flag);
for(const [r,e,f,h] of [
  [{original_retained_source_history_sha256:hash('1')},{},{},history],
  [{custody_decision_register_status:'HOLD_ORIGINAL_AGING_EXCEPTION_REVIEW'},{},{},history],
  [{original_open_exception_count:1},{},{},history],
  [{},{},{original_custody_register_sha256:hash('1')},history],
  [{},{},{},{report:{ok:true},exception:{signature_authenticated:true,open_exception_count:2}}]
]){
  const x=await check(r,e,f,h);
  assert.equal(x.witness_reconciliation_status,'HOLD_INDEPENDENT_WITNESS_SOURCE_OR_EXCEPTION_CONFLICT');
  assert.equal(x.independent_original_owner_signature_verified,false);
}
for(const r of [{build:778},{read_only:false},{packet_sha256:'bad'},
  {decision_rows:rows.slice(0,2)},{decision_rows:[rows[1],rows[0],rows[2]]},
  {decision_rows:[{...rows[0],status:'APPROVED'},...rows.slice(1)]}])
  await assert.rejects(check(r),/fresh matched/i);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const stem of ['admin-economic-owner-followthrough-v776','admin-catalog'])
  assert.equal(read(stem+'.html'),read(stem+'/index.html'));
assert.match(read('admin-catalog.html'),/custody-witness-reconciliation780/);
assert.match(read('assets/economic-owner-followthrough-v776.js'),/economic_custody_decision_witness_v780/);
const api=await import('../functions/api/admin/economic_custody_decision_witness_v780.js');
const oldFetch=globalThis.fetch;let outbound=0;
try{
  globalThis.fetch=async()=>{outbound++;throw Error('Unexpected outbound request');};
  for(const fn of [api.onRequestGet,api.onRequestPost]){
    const post=fn===api.onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_custody_decision_witness_v780',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
        'Content-Type':'application/json'},...(post?{body:'{}'}:{})});
    assert.ok((await fn({request,env:{}})).status>=400);
  }
  assert.equal(outbound,0);
}finally{globalThis.fetch=oldFetch;}
for(const fn of [api.onRequestPut,api.onRequestPatch,api.onRequestDelete])
  assert.equal((await fn()).status,405);
console.log('Build 780 custody witness PASS: matched original-source chain, three independent signatures still required, mismatch HOLD and zero external writes.');
