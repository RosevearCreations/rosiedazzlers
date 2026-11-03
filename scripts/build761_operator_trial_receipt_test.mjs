import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OPERATOR_FIELDS761,OUTCOME_FIELDS761,canonicalOperator761,canonicalOutcome761,
  receiptURL761,readReceipt761,verifyOperator761,verifyOutcome761,reconcileExecution761}
  from '../functions/api/_lib/economic-trial-execution-v761.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_trial_execution_v761.js';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const b64=value=>Buffer.from(value).toString('base64');
const keyLabels=[
  ['ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64','ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID'],
  ['ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID'],
  ['ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64','ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID'],
  ['ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID'],
  ['ROSIE_ECONOMIC_STORAGE_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_STORAGE_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_DBA_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_DBA_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_SECURITY_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SECURITY_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_ISOLATION_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ISOLATION_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_ROLLBACK_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ROLLBACK_WITNESS_KEY_ID'],
  ['ROSIE_ECONOMIC_TRIAL_OPERATOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_TRIAL_OPERATOR_KEY_ID'],
  ['ROSIE_ECONOMIC_TRIAL_RECONCILER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_TRIAL_RECONCILER_KEY_ID']
];
const keys=await Promise.all(Array.from({length:11},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const env={ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL:'https://operator-trial.example',
  ROSIE_ECONOMIC_TRIAL_RECONCILE_BASE_URL:'https://independent-trial.example'};
for(const [i,[pub,id]] of keyLabels.entries()){
  env[pub]=b64(await crypto.subtle.exportKey('raw',keys[i].publicKey));env[id]=`independent-signer-761-${i}`;
}
const record={booking_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  source_record_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'};
const target={configured:true,nonprod_environment_id:'isolated-trial-761',
  nonprod_project_ref:'isolated-rosie',production_project_ref:'production-rosie'};
const owner={signature_authenticated:true,trial_id:'isolated-execution-761',
  receipt_sha256:'a'.repeat(64),issued_at:'2026-11-03T14:40:00Z',expires_at:'2026-11-03T16:00:00Z',
  migration_artifact_sha256:'1'.repeat(64),rollback_artifact_sha256:'2'.repeat(64),
  backup_snapshot_sha256:'3'.repeat(64)};
const handoff={trial_handoff_status:'SCOPED_NONPROD_OPERATOR_HANDOFF_READY',
  nonprod_target:target,owner_trial_handoff:owner,packet_sha256:'b'.repeat(64)};
const now=Date.parse('2026-11-03T15:00:00Z');
const sign=async(payload,canonical,key)=>({payload,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',keys[key].privateKey,canonical(payload)))});
const operatorPayload={schema:'rosie-nonprod-operator-execution-v761',...record,
  trial_id:owner.trial_id,nonprod_environment_id:target.nonprod_environment_id,
  nonprod_project_ref:target.nonprod_project_ref,handoff_receipt_sha256:owner.receipt_sha256,
  preflight_packet_sha256:handoff.packet_sha256,
  migration_artifact_sha256:owner.migration_artifact_sha256,
  rollback_artifact_sha256:owner.rollback_artifact_sha256,backup_snapshot_sha256:owner.backup_snapshot_sha256,
  execution_id:'isolated-execution-001',execution_result:'SUCCEEDED_NONPRODUCTION',
  executed_at:'2026-11-03T14:55:00Z',observed_at:'2026-11-03T14:57:00Z',
  record_scope:'SYNTHETIC_ONLY',production_writes:'0',customer_notifications:'0',
  operator_id:'trial-operator-001',key_id:env.ROSIE_ECONOMIC_TRIAL_OPERATOR_KEY_ID};
assert.equal(OPERATOR_FIELDS761.length,20);assert.equal(OUTCOME_FIELDS761.length,21);
const signedOperator=await sign(operatorPayload,canonicalOperator761,9);
const operatorCheck=async(overrides={})=>verifyOperator761({env,record,handoff,
  readback:{status:'SIGNED_OPERATOR_READBACK',envelope:signedOperator},now,...overrides});
const operator=await operatorCheck();
assert.equal(operator.signature_authenticated,true);
assert.equal(operator.status,'SIGNED_NONPROD_OPERATOR_SUCCESS_CLAIM');
assert.match(operator.receipt_sha256,/^[a-f0-9]{64}$/);
assert.equal(operator.external_execution_only,true);
for(const changes of [
  {nonprod_project_ref:'production-rosie'},{trial_id:'different-trial'},
  {handoff_receipt_sha256:'f'.repeat(64)},{preflight_packet_sha256:'f'.repeat(64)},
  {migration_artifact_sha256:'f'.repeat(64)},{rollback_artifact_sha256:'f'.repeat(64)},
  {backup_snapshot_sha256:'f'.repeat(64)},{production_writes:'1'},
  {customer_notifications:'1'},{record_scope:'CUSTOMER_DATA'},
  {executed_at:'2026-11-03T14:30:00Z'},{observed_at:'2026-11-02T12:00:00Z'}
]){
  const signed=await sign({...operatorPayload,...changes},canonicalOperator761,9);
  assert.equal((await operatorCheck({readback:{status:'SIGNED_OPERATOR_READBACK',envelope:signed}})).status,
    'HOLD_OPERATOR_EXECUTION_SCOPE');
}
assert.equal((await operatorCheck({readback:{status:'SIGNED_OPERATOR_READBACK',
  envelope:await sign(operatorPayload,canonicalOperator761,8)}})).status,'HOLD_OPERATOR_SIGNATURE_INVALID');
assert.equal((await operatorCheck({env:{...env,
  ROSIE_ECONOMIC_TRIAL_OPERATOR_PUBLIC_KEY_B64:env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_OPERATOR_KEY_INDEPENDENCE');
assert.equal((await operatorCheck({handoff:{...handoff,trial_handoff_status:'HOLD_NONPROD_TRIAL_HANDOFF'}})).status,
  'HOLD_OPERATOR_EXECUTION_SCOPE');
assert.throws(()=>canonicalOperator761({...operatorPayload,extra:'injected'}),/canonical/);

const operatorURL=receiptURL761(env,'operator',record,handoff);
assert.ok(operatorURL.startsWith('https://operator-trial.example/v1/economic-nonprod-trial-operator-receipt?'));
assert.ok(receiptURL761(env,'outcome',record,handoff).startsWith('https://independent-trial.example/'));
assert.equal(receiptURL761({...env,ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL:'http://bad.example'},'operator',record,handoff),null);
assert.equal(receiptURL761({...env,ROSIE_ECONOMIC_TRIAL_RECONCILE_BASE_URL:env.ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL},'operator',record,handoff),null);
assert.equal(receiptURL761(env,'operator',record,{...handoff,nonprod_target:{configured:false}}),null);
let calls=0;
assert.equal((await readReceipt761(env,'operator',record,handoff,async(url,options)=>{
  calls++;assert.equal(url,operatorURL);assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  return new Response(JSON.stringify(signedOperator),{status:200});
})).status,'SIGNED_OPERATOR_READBACK');
assert.equal(calls,1);
assert.equal((await readReceipt761({},'operator',record,handoff,()=>{throw Error('should not fetch');})).status,
  'HOLD_OPERATOR_PROVIDER_NOT_CONFIGURED');
assert.equal((await readReceipt761(env,'operator',record,handoff,async()=>new Response('unavailable',{status:503}))).status,
  'HOLD_OPERATOR_PROVIDER_UNAVAILABLE');

const outcomePayload={schema:'rosie-nonprod-trial-outcome-v761',...record,
  trial_id:owner.trial_id,nonprod_environment_id:target.nonprod_environment_id,
  nonprod_project_ref:target.nonprod_project_ref,execution_id:operator.execution_id,
  operator_receipt_sha256:operator.receipt_sha256,
  migration_artifact_sha256:owner.migration_artifact_sha256,
  rollback_artifact_sha256:owner.rollback_artifact_sha256,
  backup_snapshot_sha256:owner.backup_snapshot_sha256,
  post_migration_check:'PASSED_NONPRODUCTION',synthetic_scope_check:'SYNTHETIC_ONLY',
  production_write_check:'NONE_OBSERVED',customer_notification_check:'NONE_SENT',
  rollback_disposition:'NOT_REQUIRED_CLEAN',rollback_execution_receipt_sha256:'NONE',
  observed_at:'2026-11-03T14:58:00Z',expires_at:'2026-11-03T15:12:00Z',
  reconciler_id:'independent-witness-001',key_id:env.ROSIE_ECONOMIC_TRIAL_RECONCILER_KEY_ID};
const signedOutcome=await sign(outcomePayload,canonicalOutcome761,10);
const outcomeCheck=async(overrides={})=>verifyOutcome761({env,record,handoff,operator,
  readback:{status:'SIGNED_OUTCOME_READBACK',envelope:signedOutcome},now,...overrides});
const outcome=await outcomeCheck();
assert.equal(outcome.signature_authenticated,true);assert.equal(outcome.clean_claim,true);
assert.equal(outcome.status,'SIGNED_NONPROD_TRIAL_NO_EXCEPTION_CLAIM');
for(const changes of [
  {operator_receipt_sha256:'f'.repeat(64)},{execution_id:'another-execution'},
  {nonprod_project_ref:'production-rosie'},{backup_snapshot_sha256:'f'.repeat(64)},
  {rollback_disposition:'EXECUTED_NONPRODUCTION'},
  {observed_at:'2026-11-03T14:30:00Z'},{expires_at:'2026-11-03T14:59:00Z'}
]){
  const signed=await sign({...outcomePayload,...changes},canonicalOutcome761,10);
  assert.equal((await outcomeCheck({readback:{status:'SIGNED_OUTCOME_READBACK',envelope:signed}})).status,
    'HOLD_OUTCOME_SCOPE');
}
assert.equal((await outcomeCheck({readback:{status:'SIGNED_OUTCOME_READBACK',
  envelope:await sign(outcomePayload,canonicalOutcome761,9)}})).status,'HOLD_OUTCOME_SIGNATURE_INVALID');
assert.equal((await outcomeCheck({env:{...env,
  ROSIE_ECONOMIC_TRIAL_RECONCILER_KEY_ID:env.ROSIE_ECONOMIC_TRIAL_OPERATOR_KEY_ID}})).status,
  'HOLD_OUTCOME_KEY_INDEPENDENCE');
for(const changes of [
  {post_migration_check:'FAILED_NONPRODUCTION'},
  {synthetic_scope_check:'SCOPE_EXCEPTION'},{production_write_check:'PRODUCTION_WRITE_EXCEPTION'},
  {customer_notification_check:'CUSTOMER_NOTIFICATION_EXCEPTION'},
  {rollback_disposition:'EXECUTED_NONPRODUCTION',rollback_execution_receipt_sha256:'9'.repeat(64)},
  {rollback_disposition:'OPEN_EXCEPTION',rollback_execution_receipt_sha256:'9'.repeat(64)}
]){
  const signed=await sign({...outcomePayload,...changes},canonicalOutcome761,10);
  const check=await outcomeCheck({readback:{status:'SIGNED_OUTCOME_READBACK',envelope:signed}});
  assert.equal(check.signature_authenticated,true);assert.equal(check.clean_claim,false);
  const blocked=await reconcileExecution761({handoff,operator,outcome:check,reviewed_at:'2026-11-03T15:01:00Z'});
  assert.equal(blocked.trial_review_status,'HOLD_NONPROD_TRIAL_EVIDENCE');
  assert.ok(blocked.follow_ups.some(x=>x.code==='ROLLBACK_OR_TRIAL_EXCEPTION_OPEN'));
}
const reviewed=await reconcileExecution761({handoff,operator,outcome,reviewed_at:'2026-11-03T15:01:00Z'});
assert.equal(reviewed.trial_review_status,'NONPROD_TRIAL_EVIDENCE_RECONCILED_NO_EXCEPTION');
assert.deepEqual(reviewed.follow_ups.map(x=>x.code),['PRODUCTION_MIGRATION_AND_BUSINESS_CLOSURE_HOLD']);
assert.match(reviewed.packet_sha256,/^[a-f0-9]{64}$/);
assert.equal(reviewed.external_execution_claim_authenticated,true);
for(const flag of ['trial_executed_by_app','migration_executed_by_app','rollback_executed_by_app',
  'production_credentials_read','customer_notifications_sent_by_app',
  'owner_closure_audit_persisted','closure_allowed','automatic_business_write'])
  assert.equal(reviewed[flag],false,flag);
assert.equal((await reconcileExecution761({})).trial_review_status,'HOLD_NONPROD_TRIAL_EVIDENCE');
const failure=await operatorCheck({readback:{status:'SIGNED_OPERATOR_READBACK',
  envelope:await sign({...operatorPayload,execution_result:'FAILED_NONPRODUCTION'},canonicalOperator761,9)}});
assert.equal((await reconcileExecution761({handoff,operator:failure,outcome})).trial_review_status,
  'HOLD_NONPROD_TRIAL_EVIDENCE');

const originalFetch=globalThis.fetch;let unauthenticatedFetches=0;
globalThis.fetch=async()=>{unauthenticatedFetches++;throw Error('No external fetch before authentication');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const post=fn===onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_trial_execution_v761',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca','Content-Type':'application/json'},
      ...(post?{body:JSON.stringify({booking_id:record.booking_id,source_record:record})}:{})});
    const response=await fn({request,env});assert.ok(response.status>=400);
  }assert.equal(unauthenticatedFetches,0);
}finally{globalThis.fetch=originalFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-execution-v761','admin-economic-nonprod-v760','admin-catalog'])
  assert.equal(file(`${stem}.html`),file(`${stem}/index.html`),`route mirror: ${stem}`);
assert.match(file('admin-catalog.html'),/admin-economic-execution-v761\.html/);
assert.match(file('admin-economic-nonprod-v760.html'),/admin-economic-execution-v761\.html/);
assert.match(file('assets/economic-trial-execution-v761.js'),/credentials:'same-origin'/);
assert.match(file('docs/build761_operator_execution_receipt_reconciliation_rollback.md'),/read-only/);
console.log('Build 761 PASS: independently signed operator and trial reconciliation receipts, rollback exception HOLD, private read-only API, project/hash/freshness/key separation and closure safety.');
