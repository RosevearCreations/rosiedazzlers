import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {reconcileRetentionRenewalFollowup778} from '../functions/api/_lib/economic-retention-renewal-followup-v778.js';
globalThis.crypto??=webcrypto;

const now=Date.parse('2026-11-07T12:00:00Z');
const sha=x=>x.repeat(64);
const base={ok:true,build:777,read_only:true,closure_allowed:false,
  production_database_written_by_app:false,
  packet_sha256:sha('d'),original_signed_custody_receipt_sha256:sha('a'),
  original_retained_source_history_sha256:sha('b'),
  original_custody_renewal_register_sha256:sha('c'),
  custody_expires_at:'2026-11-10T12:00:00Z',
  renewal_review_due_at:'2026-11-07T12:00:00Z',
  remaining_hours:72,source_age_hours:1,
  custody_expiry_status:'CURRENT_WITNESS_READY_FOR_SEPARATE_OWNER_CUSTODIAN_REVIEW'};
const check=async changes=>reconcileRetentionRenewalFollowup778({expiryReport:{...base,...changes},now});
const current=await check();
assert.equal(current.renewal_followup_status,
  'CURRENT_SOURCE_SEPARATE_OWNER_CUSTODIAN_DECISION_PENDING');
assert.equal(current.original_source_digest,sha('b'));
assert.match(current.packet_sha256,/^[a-f0-9]{64}$/);
assert.equal(current.follow_ups.length,2);
for(const [predecessor,expected] of [
  ['RENEWAL_REVIEW_DUE_WITHIN_72_HOURS','MANUAL_RENEWAL_REVIEW_DUE_WITHIN_72_HOURS'],
  ['HOLD_ORIGINAL_CUSTODY_WITNESS_EXPIRED','HOLD_ORIGINAL_CUSTODIAN_RENEWAL_EXPIRED'],
  ['HOLD_STALE_ORIGINAL_CUSTODY_SOURCE','HOLD_SIGNED_SOURCE_OBSERVATION_STALE'],
  ['HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE','HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT']
]){
  const report=await check({custody_expiry_status:predecessor});
  assert.equal(report.renewal_followup_status,expected);
  assert.equal(report.original_owner_action_required,true);
  assert.equal(report.original_custodian_action_required,true);
}
for(const changes of [
  {original_signed_custody_receipt_sha256:'bad'},
  {original_retained_source_history_sha256:null},
  {original_custody_renewal_register_sha256:'bad'},
  {custody_expiry_status:'AUTO_RENEWED'}
])assert.equal((await check(changes)).renewal_followup_status,
  'HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT');
for(const changes of [
  {ok:false},{build:776},{read_only:false},{closure_allowed:true},
  {production_database_written_by_app:true}
])await assert.rejects(check(changes),/fresh read-only/i);
for(const flag of ['closure_allowed','owner_business_signoff_by_app',
  'custody_renewed_by_app','custody_expiry_extended_by_app','retention_modified_by_app',
  'production_database_written_by_app','audit_written_by_app',
  'notification_sent_by_app','automatic_business_action'])
  assert.equal(current[flag],false,flag);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const stem of ['admin-economic-owner-followthrough-v776','admin-catalog'])
  assert.equal(read(stem+'.html'),read(stem+'/index.html'));
assert.match(read('admin-catalog.html'),/custody-renewal-followup778/);
assert.match(read('assets/economic-owner-followthrough-v776.js'),
  /economic_retention_renewal_followup_v778/);
assert.match(read('assets/economic-owner-followthrough-v776.js'),/credentials:'same-origin'/);
assert.match(read('functions/api/admin/economic_retention_renewal_followup_v778.js'),
  /reviewOwnerFollowthrough776/);
assert.match(read('functions/api/admin/economic_retention_renewal_followup_v778.js'),
  /reconcileRetentionCustodyExpiry777/);
if(existsSync(new URL('../functions/api/_lib/staff-auth.js',import.meta.url))){
  const api=await import('../functions/api/admin/economic_retention_renewal_followup_v778.js');
  const prior=globalThis.fetch;let outbound=0;
  try{
    globalThis.fetch=async()=>{outbound++;throw Error('Outbound fetch forbidden in denial test');};
    for(const fn of [api.onRequestGet,api.onRequestPost]){
      const post=fn===api.onRequestPost;
      const request=new Request('https://rosiedazzlers.ca/api/admin/economic_retention_renewal_followup_v778',{
        method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
          'Content-Type':'application/json'},...(post?{body:'{}'}:{})});
      assert.ok((await fn({request,env:{}})).status>=400);
    }
    assert.equal(outbound,0);
  }finally{globalThis.fetch=prior;}
  for(const fn of [api.onRequestPut,api.onRequestPatch,api.onRequestDelete])
    assert.equal((await fn()).status,405);
}
console.log('Build 778 renewal PASS: verified predecessor, independent exception follow-up, HOLD on conflict, original issuer boundaries and zero writes.');
