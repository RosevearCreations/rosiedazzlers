import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditPlanHash758} from '../functions/api/_lib/economic-retention-review-v758.js';
import {nonprodProjectIdentity760,auditorURL760,readAuditor760,verifyIsolation760,verifyRollback760,
  verifyOwnerTrial760,reconcileNonprodTrial760,canonicalIsolation760,canonicalRollback760,
  canonicalTrialAuth760,ISOLATION_FIELDS760,ROLLBACK_FIELDS760,TRIAL_AUTH_FIELDS760
} from '../functions/api/_lib/economic-nonprod-trial-v760.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete} from '../functions/api/admin/economic_nonprod_trial_v760.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const encode=data=>Buffer.from(data).toString('base64');
const keys=await Promise.all(Array.from({length:9},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const keyLabels=[
  ['ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64','ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID'],
  ['ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID'],
  ['ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64','ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID'],
  ['ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID'],
  ['ROSIE_ECONOMIC_STORAGE_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_STORAGE_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_DBA_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_DBA_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_SECURITY_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SECURITY_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_ISOLATION_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ISOLATION_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_ROLLBACK_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ROLLBACK_WITNESS_KEY_ID']
];
const env={SUPABASE_URL:'https://prod-rosie.supabase.co',
  ROSIE_ECONOMIC_NONPROD_SUPABASE_URL:'https://trial-rosie.supabase.co',
  ROSIE_ECONOMIC_NONPROD_ENVIRONMENT_ID:'isolated-rosie-trial-760',
  ROSIE_ECONOMIC_ISOLATION_AUDIT_BASE_URL:'https://independent-isolation.example',
  ROSIE_ECONOMIC_ROLLBACK_VERIFY_BASE_URL:'https://independent-rollback.example'};
for(const [index,[name,idName]] of keyLabels.entries()){
  env[name]=encode(await crypto.subtle.exportKey('raw',keys[index].publicKey));
  env[idName]=`independent-signer-${index}-760`;
}
const record={booking_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',source_record_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'};
const head='a'.repeat(64),retention='b'.repeat(64),enforcement='c'.repeat(64),dba='d'.repeat(64),security='e'.repeat(64);
const artifacts={migration_artifact_sha256:'1'.repeat(64),rollback_artifact_sha256:'2'.repeat(64),backup_snapshot_sha256:'3'.repeat(64)};
const now=Date.parse('2026-11-03T14:00:00Z');
const identity=nonprodProjectIdentity760(env);
assert.equal(identity.configured,true);assert.equal(identity.production_project_ref,'prod-rosie');
assert.equal(identity.nonprod_project_ref,'trial-rosie');
for(const invalid of [
  {...env,ROSIE_ECONOMIC_NONPROD_SUPABASE_URL:env.SUPABASE_URL},
  {...env,ROSIE_ECONOMIC_NONPROD_SUPABASE_URL:'https://trial-rosie.example'},
  {...env,ROSIE_ECONOMIC_NONPROD_SUPABASE_URL:'http://trial-rosie.supabase.co'},
  {...env,ROSIE_ECONOMIC_NONPROD_SUPABASE_URL:'https://trial-rosie.supabase.co/a'},
  {...env,ROSIE_ECONOMIC_NONPROD_ENVIRONMENT_ID:''}
])assert.equal(nonprodProjectIdentity760(invalid).configured,false);
const sign=async(payload,canonical,index)=>({payload,
  signature_b64:encode(await crypto.subtle.sign('Ed25519',keys[index].privateKey,canonical(payload)))});
const isolationPayload={schema:'rosie-nonprod-isolation-audit-v760',booking_id:record.booking_id,
  source_record_id:record.source_record_id,history_head_sha256:head,
  nonprod_environment_id:identity.nonprod_environment_id,
  production_project_ref:identity.production_project_ref,nonprod_project_ref:identity.nonprod_project_ref,
  production_write_probe:'DENIED',credential_separation:'CONFIRMED',
  outbound_customer_events:'DISABLED',synthetic_data_only:'CONFIRMED',migration_grants_restricted:'CONFIRMED',
  observed_at:'2026-11-03T13:57:00Z',expires_at:'2026-11-03T14:18:00Z',
  auditor_id:'isolation-auditor-760',key_id:env.ROSIE_ECONOMIC_ISOLATION_AUDITOR_KEY_ID};
const signedIsolation=await sign(isolationPayload,canonicalIsolation760,7);
const isolate=async(changes={})=>verifyIsolation760({env,record,head,identity,
  readback:{status:'SIGNED_ISOLATION_AUDITOR_READBACK',envelope:signedIsolation},now,...changes});
const isolation=await isolate();
assert.equal(isolation.signature_authenticated,true);
assert.equal(isolation.isolation_directly_reproduced,false);
assert.match(isolation.receipt_sha256,/^[a-f0-9]{64}$/);
assert.equal(ISOLATION_FIELDS760.length,16);
for(const delta of [{production_write_probe:'GRANTED'},{outbound_customer_events:'ENABLED'},
  {nonprod_project_ref:'prod-rosie'},{synthetic_data_only:'UNKNOWN'},
  {observed_at:'2026-11-03T10:00:00Z'}]){
  const signed=await sign({...isolationPayload,...delta},canonicalIsolation760,7);
  assert.equal((await isolate({readback:{status:'SIGNED_ISOLATION_AUDITOR_READBACK',envelope:signed}})).status,
    'HOLD_ISOLATION_SCOPE');
}
assert.equal((await isolate({readback:{status:'SIGNED_ISOLATION_AUDITOR_READBACK',
  envelope:await sign(isolationPayload,canonicalIsolation760,0)}})).status,'HOLD_ISOLATION_SIGNATURE_INVALID');
assert.equal((await isolate({env:{...env,ROSIE_ECONOMIC_ISOLATION_AUDITOR_PUBLIC_KEY_B64:env.ROSIE_ECONOMIC_STORAGE_AUDITOR_PUBLIC_KEY_B64}})).status,
  'HOLD_ISOLATION_KEY_INDEPENDENCE');
assert.throws(()=>canonicalIsolation760({...isolationPayload,extra:'not-allowed'}),/canonical/);

const isolationUrl=auditorURL760(env,'isolation',record,head,identity);
assert.ok(isolationUrl.startsWith('https://independent-isolation.example/v1/economic-nonprod-isolation-review?'));
const rollbackUrl=auditorURL760(env,'rollback',record,head,identity,artifacts);
assert.ok(rollbackUrl.startsWith('https://independent-rollback.example/v1/economic-nonprod-rollback-review?'));
assert.equal(auditorURL760({...env,ROSIE_ECONOMIC_ISOLATION_AUDIT_BASE_URL:'http://bad.example'},
  'isolation',record,head,identity),null);
assert.equal(auditorURL760(env,'rollback',record,head,identity,{...artifacts,backup_snapshot_sha256:'bad'}),null);
let count=0;
const readback=await readAuditor760(env,'isolation',record,head,identity,null,async(url,options)=>{
  count++;assert.equal(url,isolationUrl);assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  return new Response(JSON.stringify(signedIsolation),{status:200});
});
assert.equal(readback.status,'SIGNED_ISOLATION_AUDITOR_READBACK');assert.equal(count,1);
assert.equal((await readAuditor760({},'isolation',record,head,identity,null,()=>{throw Error('Should not fetch');})).status,
  'HOLD_INDEPENDENT_ISOLATION_PROVIDER_NOT_CONFIGURED');
assert.equal((await readAuditor760(env,'isolation',record,head,identity,null,
  async()=>new Response('unavailable',{status:404}))).status,'HOLD_INDEPENDENT_ISOLATION_PROVIDER_UNAVAILABLE');
const rollbackPayload={schema:'rosie-nonprod-rollback-witness-v760',booking_id:record.booking_id,
  source_record_id:record.source_record_id,history_head_sha256:head,
  nonprod_environment_id:identity.nonprod_environment_id,nonprod_project_ref:identity.nonprod_project_ref,
  ...artifacts,restore_snapshot_sha256:artifacts.backup_snapshot_sha256,
  restore_result:'PASSED_NONPRODUCTION',rollback_validation:'PASSED_NONPRODUCTION',
  restore_rto_seconds:'840',observed_at:'2026-11-03T13:58:00Z',
  expires_at:'2026-11-03T14:18:00Z',witness_id:'independent-rollback-witness-760',
  key_id:env.ROSIE_ECONOMIC_ROLLBACK_WITNESS_KEY_ID};
const signedRollback=await sign(rollbackPayload,canonicalRollback760,8);
const rollbackCheck=async(changes={})=>verifyRollback760({env,record,head,identity,artifacts,
  readback:{status:'SIGNED_ROLLBACK_AUDITOR_READBACK',envelope:signedRollback},now,...changes});
const rollback=await rollbackCheck();
assert.equal(rollback.signature_authenticated,true);assert.equal(rollback.rollback_directly_reproduced,false);
assert.equal(rollback.restore_rto_seconds,840);
assert.equal(ROLLBACK_FIELDS760.length,17);
for(const delta of [
  {rollback_validation:'FAIL'},{restore_snapshot_sha256:'f'.repeat(64)},
  {restore_rto_seconds:'999999'},{backup_snapshot_sha256:'f'.repeat(64)},
  {nonprod_environment_id:'wrong-environment'}
]){
  const signed=await sign({...rollbackPayload,...delta},canonicalRollback760,8);
  assert.equal((await rollbackCheck({readback:{status:'SIGNED_ROLLBACK_AUDITOR_READBACK',envelope:signed}})).status,
    'HOLD_ROLLBACK_SCOPE');
}
assert.equal((await rollbackCheck({readback:{status:'SIGNED_ROLLBACK_AUDITOR_READBACK',
  envelope:await sign(rollbackPayload,canonicalRollback760,7)}})).status,'HOLD_ROLLBACK_SIGNATURE_INVALID');
assert.equal((await rollbackCheck({env:{...env,ROSIE_ECONOMIC_ROLLBACK_WITNESS_KEY_ID:env.ROSIE_ECONOMIC_DBA_REVIEW_KEY_ID}})).status,
  'HOLD_ROLLBACK_KEY_INDEPENDENCE');

const prior={independent_review_chain_authenticated:true,history_head_sha256:head,
  trial_readiness_status:'READY_FOR_SEPARATE_NONPROD_TRIAL_AUTHORIZATION',
  retention_review:{retention_receipt_sha256:retention},
  storage_audit:{enforcement_receipt_sha256:enforcement},
  dba_review:{receipt_sha256:dba,issued_at:'2026-11-03T13:40:00Z'},
  security_review:{receipt_sha256:security,issued_at:'2026-11-03T13:50:00Z'}};
const ownerPayload={schema:'rosie-owner-nonprod-trial-handoff-v760',
  booking_id:record.booking_id,source_record_id:record.source_record_id,history_head_sha256:head,
  retention_receipt_sha256:retention,enforcement_receipt_sha256:enforcement,
  dba_receipt_sha256:dba,security_receipt_sha256:security,
  isolation_receipt_sha256:isolation.receipt_sha256,rollback_receipt_sha256:rollback.receipt_sha256,
  audit_plan_sha256:await auditPlanHash758(),nonprod_environment_id:identity.nonprod_environment_id,
  nonprod_project_ref:identity.nonprod_project_ref,...artifacts,trial_id:'trial-760-rosie',
  decision:'authorize_nonproduction_operator_handoff_only',owner_id:'owner-reviewer-760',
  issued_at:'2026-11-03T13:59:00Z',expires_at:'2026-11-04T13:59:00Z',
  nonce:'a'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sign(ownerPayload,canonicalTrialAuth760,0);
const ownerCheck=async(changes={})=>verifyOwnerTrial760({env,record,prior,identity,isolation,rollback,
  envelope:signedOwner,now,...changes});
const owner=await ownerCheck();
assert.equal(owner.status,'SIGNED_OWNER_NONPROD_OPERATOR_HANDOFF_ONLY');
assert.equal(owner.signature_authenticated,true);assert.equal(owner.trial_execution_authorized,false);
assert.equal(TRIAL_AUTH_FIELDS760.length,23);
for(const delta of [{security_receipt_sha256:'f'.repeat(64)},{rollback_artifact_sha256:'f'.repeat(64)},
  {decision:'authorize_production_migration'},{nonprod_project_ref:'prod-rosie'},
  {issued_at:'2026-11-03T13:45:00Z'}]){
  const signed=await sign({...ownerPayload,...delta},canonicalTrialAuth760,0);
  assert.equal((await ownerCheck({envelope:signed})).status,'HOLD_OWNER_TRIAL_AUTH_SCOPE');
}
assert.equal((await ownerCheck({envelope:await sign(ownerPayload,canonicalTrialAuth760,6)})).status,
  'HOLD_OWNER_TRIAL_SIGNATURE_INVALID');
assert.equal((await ownerCheck({prior:{...prior,independent_review_chain_authenticated:false}})).status,'HOLD_OWNER_TRIAL_AUTH_SCOPE');
const result=await reconcileNonprodTrial760({prior,identity,isolation,rollback,owner,
  reviewed_at:'2026-11-03T14:01:00Z'});
assert.equal(result.trial_handoff_status,'SCOPED_NONPROD_OPERATOR_HANDOFF_READY');
assert.deepEqual(result.follow_ups.map(x=>x.code),['SEPARATE_OPERATOR_EXECUTION_GATE','PRODUCTION_CLOSURE_UNVERIFIED']);
assert.match(result.packet_sha256,/^[a-f0-9]{64}$/);
for(const f of ['trial_execution_authorized','trial_executed','migration_authorized','migration_executed',
  'rollback_executed_by_app','production_credentials_read','owner_closure_audit_persisted','closure_allowed','automatic_business_write'])
  assert.equal(result[f],false,f);
assert.equal((await reconcileNonprodTrial760({})).trial_handoff_status,'HOLD_NONPROD_TRIAL_HANDOFF');
const originalFetch=globalThis.fetch;let unauthorizedFetches=0;
globalThis.fetch=async()=>{unauthorizedFetches++;throw Error('No anonymous external fetch permitted');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const post=fn===onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_nonprod_trial_v760',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca','Content-Type':'application/json'},
      ...(post?{body:JSON.stringify({period:'2026-11',booking_id:record.booking_id,source_record:record,
        history_manifest:{},owner_migration_review:{},dba_review:{},security_review:{},
        owner_trial_handoff:signedOwner})}:{})});
    const response=await fn({request,env});assert.ok(response.status>=400);
  }
  assert.equal(unauthorizedFetches,0);
}finally{globalThis.fetch=originalFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-nonprod-v760','admin-economic-enforcement-v759','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`route mirror: ${stem}`);
assert.match(read('admin-catalog.html'),/admin-economic-nonprod-v760\.html/);
assert.match(read('admin-economic-enforcement-v759.html'),/admin-economic-nonprod-v760\.html/);
assert.match(read('assets/economic-nonprod-v760.js'),/credentials:'same-origin'/);
assert.match(read('docs/build760_nonprod_migration_authorization_isolation_rollback.md'),/read-only/i);
console.log('Build 760 PASS: distinct Supabase identity, independently signed isolation/restore, owner scoped script-hash handoff, failed/replayed-key holds, private API, no execution or closure.');
