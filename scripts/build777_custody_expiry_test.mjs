import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {reconcileRetentionCustodyExpiry777}
  from '../functions/api/_lib/economic-retention-custody-expiry-v777.js';

globalThis.crypto??=webcrypto;
const now=Date.parse('2026-11-06T12:00:00Z');
const iso=ms=>new Date(ms).toISOString().replace('.000Z','Z');
const makeHistory=(overrides={})=>{
  const retained='a'.repeat(64);
  const history={
    report:{ok:true,
      owner_followthrough_status:
        'READY_FOR_SEPARATE_ORIGINAL_OWNER_CUSTODIAN_FOLLOWTHROUGH_DECISION',
      packet_sha256:'b'.repeat(64)},
    owner:{signature_authenticated:true,requests_review:true},
    followthrough:{signature_authenticated:true,current_claim:true},
    exception:{signature_authenticated:true,clear_claim:true,open_exception_count:0},
    custody:{signature_authenticated:true,renewed_claim:true,critical_count:0,
      receipt_sha256:'c'.repeat(64),
      current_custody_renewal_register_sha256:'d'.repeat(64),
      retained_source_history_sha256:retained,
      signed_at:iso(now-3600000),custody_expires_at:iso(now+120*3600000)},
    history:{retention:{retained_source_history_sha256:retained}}
  };
  return {...history,...overrides};
};
const current=await reconcileRetentionCustodyExpiry777({history:makeHistory(),now});
assert.equal(current.custody_expiry_status,
  'CURRENT_WITNESS_READY_FOR_SEPARATE_OWNER_CUSTODIAN_REVIEW');
assert.equal(current.remaining_hours,120);
assert.equal(current.renewal_alert_threshold_hours,72);
assert.equal(current.source_age_hours,1);
assert.equal(current.follow_ups.length,1);
assert.match(current.follow_ups[0].code,/SEPARATE_ORIGINAL_OWNER/);
assert.match(current.packet_sha256,/^[a-f0-9]{64}$/);
const due=await reconcileRetentionCustodyExpiry777({history:makeHistory({
  custody:{...makeHistory().custody,custody_expires_at:iso(now+72*3600000)}}),now});
assert.equal(due.custody_expiry_status,'RENEWAL_REVIEW_DUE_WITHIN_72_HOURS');
assert.ok(due.follow_ups.some(x=>x.code==='ORIGINAL_CUSTODY_RENEWAL_DUE'));
const expired=await reconcileRetentionCustodyExpiry777({history:makeHistory({
  custody:{...makeHistory().custody,signed_at:iso(now-48*3600000),
    custody_expires_at:iso(now-3600000)}}),now});
assert.equal(expired.custody_expiry_status,'HOLD_ORIGINAL_CUSTODY_WITNESS_EXPIRED');
assert.ok(expired.follow_ups.some(x=>x.code==='ORIGINAL_CUSTODY_WITNESS_EXPIRED'));
const stale=await reconcileRetentionCustodyExpiry777({history:makeHistory({
  custody:{...makeHistory().custody,signed_at:iso(now-8*86400000),
    custody_expires_at:iso(now+10*86400000)}}),now});
assert.equal(stale.custody_expiry_status,'HOLD_STALE_ORIGINAL_CUSTODY_SOURCE');
const divergent=await reconcileRetentionCustodyExpiry777({history:makeHistory({
  custody:{...makeHistory().custody,retained_source_history_sha256:'f'.repeat(64)}}),now});
assert.equal(divergent.custody_expiry_status,'HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE');
for(const changes of [
  {report:{...makeHistory().report,owner_followthrough_status:'HOLD'}},
  {owner:{signature_authenticated:true,requests_review:false}},
  {exception:{signature_authenticated:true,clear_claim:true,open_exception_count:1}},
  {custody:{...makeHistory().custody,critical_count:1}},
  {custody:{...makeHistory().custody,custody_expires_at:iso(now+31*86400000)}},
  {custody:{...makeHistory().custody,current_custody_renewal_register_sha256:'bad'}}
]){
  const r=await reconcileRetentionCustodyExpiry777({history:makeHistory(changes),now});
  assert.equal(r.custody_expiry_status,'HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE');
  assert.equal(r.original_signed_custody_receipt_sha256,null);
}
for(const flag of ['owner_business_signoff_by_app','external_dispute_closed_by_app',
  'custody_expiry_extended_by_app','source_retention_modified_by_app',
  'production_database_written_by_app','source_archive_modified_by_app',
  'append_only_audit_written_by_app','notification_sent_by_app',
  'automatic_business_action','closure_allowed'])assert.equal(current[flag],false);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const stem of ['admin-economic-owner-followthrough-v776','admin-catalog'])
  assert.equal(read(stem+'.html'),read(stem+'/index.html'));
assert.match(read('admin-catalog.html'),/custody-expiry777/);
assert.match(read('admin-economic-owner-followthrough-v776.html'),/id="expiry777"/);
assert.match(read('assets/economic-owner-followthrough-v776.js'),
  /economic_retention_custody_expiry_v777/);
assert.match(read('assets/economic-owner-followthrough-v776.js'),/credentials:'same-origin'/);
assert.match(read('functions/api/admin/economic_retention_custody_expiry_v777.js'),
  /reviewOwnerFollowthrough776/);
if(existsSync(new URL('../functions/api/_lib/staff-auth.js',import.meta.url))){
  const api=await import('../functions/api/admin/economic_retention_custody_expiry_v777.js');
  const before=globalThis.fetch;let outbound=0;
  try{
    globalThis.fetch=async()=>{outbound++;throw Error('Unexpected outbound fetch');};
    for(const fn of [api.onRequestGet,api.onRequestPost]){
      const post=fn===api.onRequestPost;
      const request=new Request('https://rosiedazzlers.ca/api/admin/economic_retention_custody_expiry_v777',{
        method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
          'Content-Type':'application/json'},...(post?{body:'{}'}:{})});
      assert.ok((await fn({request,env:{}})).status>=400);
    }assert.equal(outbound,0);
  }finally{globalThis.fetch=before;}
  for(const fn of [api.onRequestPut,api.onRequestPatch,api.onRequestDelete])
    assert.equal((await fn()).status,405);
}
console.log('Build 777 custody expiry PASS: signed-source freshness, 72h review, expiration, digest conflict HOLD and zero business writes.');
