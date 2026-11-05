import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {buildCustodyExceptionDecisionRegister779}
  from '../functions/api/_lib/economic-custody-exception-register-v779.js';
globalThis.crypto??=webcrypto;
const now=Date.parse('2026-11-09T12:00:00Z');
const sha=x=>x.repeat(64);
const expiry={ok:true,build:777,read_only:true,closure_allowed:false,
  production_database_written_by_app:false,packet_sha256:sha('a'),
  original_signed_custody_receipt_sha256:sha('b'),
  original_retained_source_history_sha256:sha('c'),
  original_custody_renewal_register_sha256:sha('d'),
  custody_expiry_status:'CURRENT_WITNESS_READY_FOR_SEPARATE_OWNER_CUSTODIAN_REVIEW',
  custody_expires_at:'2026-11-18T12:00:00Z',
  renewal_review_due_at:'2026-11-15T12:00:00Z',remaining_hours:216,source_age_hours:1};
const follow={ok:true,build:778,read_only:true,predecessor_build:777,
  predecessor_status:expiry.custody_expiry_status,
  closure_allowed:false,production_database_written_by_app:false,
  custody_renewed_by_app:false,packet_sha256:sha('e'),
  original_source_digest:sha('c'),
  original_custody_receipt_sha256:sha('b'),
  original_custody_register_sha256:sha('d'),
  renewal_followup_status:'CURRENT_SOURCE_SEPARATE_OWNER_CUSTODIAN_DECISION_PENDING'};
const history={report:{ok:true},exception:{signature_authenticated:true,open_exception_count:0}};
const check=async(e={},f={},h=history)=>buildCustodyExceptionDecisionRegister779({
  expiryReport:{...expiry,...e},followupReport:{...follow,...f},history:h,now});
const ready=await check();
assert.equal(ready.custody_decision_register_status,
  'CURRENT_SOURCE_SEPARATE_OWNER_CUSTODIAN_DECISION_PENDING');
assert.equal(ready.decision_rows.length,3);
assert.deepEqual(ready.decision_rows.map(r=>r.issuer_role),
  ['original_owner','original_custodian','independent_exception_issuer']);
assert.equal(ready.decision_rows[0].status,'PENDING_SEPARATE_ORIGINAL_OWNER_DECISION');
assert.equal(ready.decision_rows[1].status,'CURRENT_FOR_SEPARATE_MANUAL_REVIEW');
assert.match(ready.packet_sha256,/^[a-f0-9]{64}$/);
for(const [status,expected] of [
  ['MANUAL_RENEWAL_REVIEW_DUE_WITHIN_72_HOURS','RENEWAL_REVIEW_DUE'],
  ['HOLD_ORIGINAL_CUSTODIAN_RENEWAL_EXPIRED','HOLD_INDEPENDENT_CUSTODIAN_EVIDENCE'],
  ['HOLD_SIGNED_SOURCE_OBSERVATION_STALE','HOLD_INDEPENDENT_CUSTODIAN_EVIDENCE'],
  ['HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT','HOLD_INDEPENDENT_CUSTODIAN_EVIDENCE']
]){
  const matchingExpiry={
    MANUAL_RENEWAL_REVIEW_DUE_WITHIN_72_HOURS:'RENEWAL_REVIEW_DUE_WITHIN_72_HOURS',
    HOLD_ORIGINAL_CUSTODIAN_RENEWAL_EXPIRED:'HOLD_ORIGINAL_CUSTODY_WITNESS_EXPIRED',
    HOLD_SIGNED_SOURCE_OBSERVATION_STALE:'HOLD_STALE_ORIGINAL_CUSTODY_SOURCE',
    HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT:'HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE'
  }[status];
  const report=await check({custody_expiry_status:matchingExpiry},
    {predecessor_status:matchingExpiry,renewal_followup_status:status});
  assert.equal(report.decision_rows[1].status,expected);
}
assert.equal((await check({}, {renewal_followup_status:'MANUAL_RENEWAL_REVIEW_DUE_WITHIN_72_HOURS'})).custody_decision_register_status,
  'HOLD_UNVERIFIED_CUSTODY_DECISION_SOURCE');
assert.equal((await check({}, {original_source_digest:sha('f')})).custody_decision_register_status,
  'HOLD_UNVERIFIED_CUSTODY_DECISION_SOURCE');
assert.equal((await check({}, {},{report:{ok:true},exception:{signature_authenticated:true,open_exception_count:1}})).custody_decision_register_status,
  'HOLD_ORIGINAL_AGING_EXCEPTION_REVIEW');
assert.equal((await check({}, {},{report:{ok:false},exception:{signature_authenticated:true,open_exception_count:0}})).custody_decision_register_status,
  'HOLD_UNVERIFIED_CUSTODY_DECISION_SOURCE');
for(const e of [{build:776},{read_only:false},{packet_sha256:'not-a-hash'},
  {closure_allowed:true},{production_database_written_by_app:true}])
  await assert.rejects(check(e),/matched current/i);
for(const f of [{build:777},{read_only:false},{predecessor_status:'OTHER'},
  {custody_renewed_by_app:true},{packet_sha256:'invalid'}])
  await assert.rejects(check({},f),/matched current/i);
for(const flag of ['original_owner_business_signoff_by_app',
  'custodian_renewal_executed_by_app','original_dispute_closed_by_app',
  'source_expiry_extended_by_app','source_retention_modified_by_app',
  'production_database_written_by_app','append_only_audit_written_by_app',
  'external_notification_sent_by_app','automatic_business_action','closure_allowed'])
  assert.equal(ready[flag],false,flag);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const stem of ['admin-economic-owner-followthrough-v776','admin-catalog'])
  assert.equal(read(stem+'.html'),read(stem+'/index.html'));
assert.match(read('admin-catalog.html'),/custody-decision-register779/);
assert.match(read('assets/economic-owner-followthrough-v776.js'),/economic_custody_exception_register_v779/);
assert.match(read('functions/api/admin/economic_custody_exception_register_v779.js'),
  /reviewOwnerFollowthrough776/);
assert.match(read('functions/api/admin/economic_custody_exception_register_v779.js'),
  /reconcileRetentionCustodyExpiry777/);
assert.match(read('functions/api/admin/economic_custody_exception_register_v779.js'),
  /reconcileRetentionRenewalFollowup778/);
if(existsSync(new URL('../functions/api/_lib/staff-auth.js',import.meta.url))){
  const api=await import('../functions/api/admin/economic_custody_exception_register_v779.js');
  const before=globalThis.fetch;let outbound=0;
  try{
    globalThis.fetch=async()=>{outbound++;throw Error('Unexpected outbound fetch');};
    for(const fn of [api.onRequestGet,api.onRequestPost]){
      const post=fn===api.onRequestPost;
      const request=new Request('https://rosiedazzlers.ca/api/admin/economic_custody_exception_register_v779',{
        method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
          'Content-Type':'application/json'},...(post?{body:'{}'}:{})});
      assert.ok((await fn({request,env:{}})).status>=400);
    }assert.equal(outbound,0);
  }finally{globalThis.fetch=before;}
  for(const fn of [api.onRequestPut,api.onRequestPatch,api.onRequestDelete])
    assert.equal((await fn()).status,405);
}
console.log('Build 779 custody register PASS: original source chain, three independent decision rows, digest conflict HOLD and no external writes.');
