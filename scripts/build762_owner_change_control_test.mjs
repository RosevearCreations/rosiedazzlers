import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROLLBACK_DISPOSITION_FIELDS762,OWNER_SIGNOFF_FIELDS762,CHANGE_CONTROL_FIELDS762,
  canonicalRollbackDisposition762,canonicalOwnerSignoff762,canonicalChangeControl762,
  reviewURL762,readReview762,verifyRollbackDisposition762,verifyOwnerSignoff762,
  verifyChangeControl762,reconcileChangeControl762}
  from '../functions/api/_lib/economic-change-control-v762.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_change_control_v762.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const b64=value=>Buffer.from(value).toString('base64');
const names=[
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
  ['ROSIE_ECONOMIC_TRIAL_RECONCILER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_TRIAL_RECONCILER_KEY_ID'],
  ['ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_KEY_ID'],
  ['ROSIE_ECONOMIC_CHANGE_CONTROL_PUBLIC_KEY_B64','ROSIE_ECONOMIC_CHANGE_CONTROL_KEY_ID']
];
const keys=await Promise.all(Array.from({length:13},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const env={ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL:'https://operator.example',
  ROSIE_ECONOMIC_TRIAL_RECONCILE_BASE_URL:'https://witness.example',
  ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_BASE_URL:'https://rollback-review.example',
  ROSIE_ECONOMIC_CHANGE_CONTROL_BASE_URL:'https://change-board.example'};
for(const [i,[keyName,idName]] of names.entries()){
  env[keyName]=b64(await crypto.subtle.exportKey('raw',keys[i].publicKey));
  env[idName]=`independent-v762-role-${i}`;
}
const record={booking_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  source_record_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'};
const target={configured:true,status:'DISTINCT_SUPABASE_PROJECT_REFS_CONFIGURED',
  nonprod_environment_id:'isolated-rosie-762',nonprod_project_ref:'nonproduction-rosie',
  production_project_ref:'production-rosie'};
const operator={signature_authenticated:true,receipt_sha256:'a'.repeat(64),
  handoff_receipt_sha256:'b'.repeat(64),trial_id:'isolated-trial-762',execution_id:'trial-exec-762',
  executed_at:'2026-11-03T14:40:00Z',execution_result:'SUCCEEDED_NONPRODUCTION',
  migration_artifact_sha256:'1'.repeat(64),rollback_artifact_sha256:'2'.repeat(64),
  backup_snapshot_sha256:'3'.repeat(64)};
const outcome={signature_authenticated:true,receipt_sha256:'c'.repeat(64),clean_claim:true,
  rollback_disposition:'NOT_REQUIRED_CLEAN',rollback_execution_receipt_sha256:'NONE',
  observed_at:'2026-11-03T14:48:00Z'};
const prior={trial_review_status:'NONPROD_TRIAL_EVIDENCE_RECONCILED_NO_EXCEPTION',
  external_execution_claim_authenticated:true,external_reconciliation_claim_authenticated:true,
  nonprod_target:target,operator_receipt:operator,independent_trial_witness:outcome,
  packet_sha256:'d'.repeat(64)};
const now=Date.parse('2026-11-03T15:00:00Z');
const sign=async(p,canonical,role)=>({payload:p,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',keys[role].privateKey,canonical(p)))});
assert.equal(ROLLBACK_DISPOSITION_FIELDS762.length,15);
assert.equal(OWNER_SIGNOFF_FIELDS762.length,19);
assert.equal(CHANGE_CONTROL_FIELDS762.length,22);
const rollbackPayload={schema:'rosie-independent-rollback-disposition-v762',...record,
  trial_id:operator.trial_id,nonprod_environment_id:target.nonprod_environment_id,
  nonprod_project_ref:target.nonprod_project_ref,
  operator_receipt_sha256:operator.receipt_sha256,outcome_receipt_sha256:outcome.receipt_sha256,
  rollback_disposition:'NOT_REQUIRED_CLEAN',rollback_execution_receipt_sha256:'NONE',
  decision:'NO_EXCEPTION_CONFIRMED',observed_at:'2026-11-03T14:50:00Z',
  expires_at:'2026-11-03T15:12:00Z',reviewer_id:'independent-rollback-reviewer-762',
  key_id:env.ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_KEY_ID};
const signedRollback=await sign(rollbackPayload,canonicalRollbackDisposition762,11);
const rollbackCheck=async(changes={})=>verifyRollbackDisposition762({env,record,prior,
  readback:{status:'SIGNED_ROLLBACK_READBACK',envelope:signedRollback},now,...changes});
const rollback=await rollbackCheck();
assert.equal(rollback.signature_authenticated,true);assert.equal(rollback.clean_claim,true);
assert.equal(rollback.status,'SIGNED_NO_ROLLBACK_EXCEPTION_CLAIM');
assert.match(rollback.receipt_sha256,/^[a-f0-9]{64}$/);
for(const delta of [{nonprod_project_ref:'production-rosie'},{outcome_receipt_sha256:'f'.repeat(64)},
  {decision:'EXCEPTION_HELD_FOR_MANUAL_REVIEW'},{rollback_disposition:'EXECUTED_NONPRODUCTION'},
  {rollback_execution_receipt_sha256:'f'.repeat(64)},{observed_at:'2026-11-03T14:20:00Z'},
  {expires_at:'2026-11-03T14:59:00Z'}]){
  const signed=await sign({...rollbackPayload,...delta},canonicalRollbackDisposition762,11);
  assert.equal((await rollbackCheck({readback:{status:'SIGNED_ROLLBACK_READBACK',envelope:signed}})).status,
    'HOLD_ROLLBACK_DISPOSITION_SCOPE');
}
assert.equal((await rollbackCheck({readback:{status:'SIGNED_ROLLBACK_READBACK',
  envelope:await sign(rollbackPayload,canonicalRollbackDisposition762,10)}})).status,
  'HOLD_ROLLBACK_REVIEW_SIGNATURE_INVALID');
assert.equal((await rollbackCheck({env:{...env,
  ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_PUBLIC_KEY_B64:env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_ROLLBACK_REVIEW_KEY_INDEPENDENCE');
assert.throws(()=>canonicalRollbackDisposition762({...rollbackPayload,unrecognized:'field'}),/Noncanonical/);

const rollbackURL=reviewURL762(env,'rollback',record,prior);
assert.ok(rollbackURL.startsWith('https://rollback-review.example/v1/economic-nonprod-rollback-disposition-v762?'));
assert.equal(reviewURL762({...env,ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_BASE_URL:env.ROSIE_ECONOMIC_CHANGE_CONTROL_BASE_URL},
  'rollback',record,prior),null);
assert.equal(reviewURL762({...env,ROSIE_ECONOMIC_CHANGE_CONTROL_BASE_URL:'http://bad.example'},
  'rollback',record,prior),null);
assert.equal(reviewURL762(env,'rollback',record,{...prior,nonprod_target:{configured:false}}),null);
let calls=0;
assert.equal((await readReview762(env,'rollback',record,prior,null,null,async(url,options)=>{
  calls++;assert.equal(url,rollbackURL);assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  return new Response(JSON.stringify(signedRollback),{status:200});
})).status,'SIGNED_ROLLBACK_READBACK');
assert.equal(calls,1);
assert.equal((await readReview762({},'rollback',record,prior)).status,'HOLD_ROLLBACK_PROVIDER_NOT_CONFIGURED');
assert.equal((await readReview762(env,'rollback',record,prior,null,null,
  async()=>new Response('missing',{status:404}))).status,'HOLD_ROLLBACK_PROVIDER_UNAVAILABLE');

const ownerPayload={schema:'rosie-owner-nonprod-trial-signoff-v762',...record,
  trial_id:operator.trial_id,nonprod_environment_id:target.nonprod_environment_id,
  nonprod_project_ref:target.nonprod_project_ref,build761_packet_sha256:prior.packet_sha256,
  operator_receipt_sha256:operator.receipt_sha256,outcome_receipt_sha256:outcome.receipt_sha256,
  rollback_review_receipt_sha256:rollback.receipt_sha256,
  migration_artifact_sha256:operator.migration_artifact_sha256,
  rollback_artifact_sha256:operator.rollback_artifact_sha256,
  backup_snapshot_sha256:operator.backup_snapshot_sha256,
  decision:'accept_nonprod_trial_for_change_review',owner_id:'owner-trial-reviewer-762',
  issued_at:'2026-11-03T14:55:00Z',expires_at:'2026-11-04T14:55:00Z',
  nonce:'a'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sign(ownerPayload,canonicalOwnerSignoff762,0);
const ownerCheck=async(changes={})=>verifyOwnerSignoff762({env,record,prior,rollback,envelope:signedOwner,now,...changes});
const owner=await ownerCheck();
assert.equal(owner.signature_authenticated,true);assert.equal(owner.clean_acceptance,true);
assert.equal(owner.status,'SIGNED_OWNER_NONPROD_TRIAL_ACCEPTANCE_FOR_REVIEW');
assert.equal(owner.production_execution_authorized,false);
for(const delta of [{build761_packet_sha256:'f'.repeat(64)},
  {rollback_review_receipt_sha256:'f'.repeat(64)},
  {migration_artifact_sha256:'f'.repeat(64)},
  {decision:'authorize_production_sql'},
  {decision:'hold_nonprod_trial_exception'},
  {issued_at:'2026-11-03T14:49:00Z'},
  {issued_at:'2026-11-03T15:04:00Z',expires_at:'2026-11-03T15:02:00Z'},
  {nonce:'invalid'}]){
  const signed=await sign({...ownerPayload,...delta},canonicalOwnerSignoff762,0);
  assert.equal((await ownerCheck({envelope:signed})).status,'HOLD_OWNER_SIGNOFF_SCOPE');
}
assert.equal((await ownerCheck({envelope:await sign(ownerPayload,canonicalOwnerSignoff762,1)})).status,
  'HOLD_OWNER_SIGNOFF_SIGNATURE_INVALID');
assert.equal((await ownerCheck({env:{...env,
  ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID:env.ROSIE_ECONOMIC_CHANGE_CONTROL_KEY_ID}})).status,
  'HOLD_OWNER_SIGNOFF_KEY_INDEPENDENCE');

const changePayload={schema:'rosie-production-change-control-preflight-v762',...record,
  trial_id:operator.trial_id,production_project_ref:target.production_project_ref,
  nonprod_project_ref:target.nonprod_project_ref,owner_signoff_sha256:owner.receipt_sha256,
  rollback_review_receipt_sha256:rollback.receipt_sha256,
  migration_artifact_sha256:operator.migration_artifact_sha256,
  rollback_artifact_sha256:operator.rollback_artifact_sha256,
  backup_snapshot_sha256:operator.backup_snapshot_sha256,
  change_ticket_id:'production-change-ticket-762',
  window_start:'2026-11-04T16:00:00Z',window_end:'2026-11-04T18:00:00Z',
  rollback_plan_check:'DESIGN_REVIEWED_ONLY',dba_review_status:'DESIGN_REVIEWED_ONLY',
  security_review_status:'DESIGN_REVIEWED_ONLY',production_execution_authorization:'NOT_GRANTED',
  observed_at:'2026-11-03T14:58:00Z',expires_at:'2026-11-03T15:12:00Z',
  reviewer_id:'independent-change-board-762',key_id:env.ROSIE_ECONOMIC_CHANGE_CONTROL_KEY_ID};
const signedChange=await sign(changePayload,canonicalChangeControl762,12);
const changeCheck=async(changes={})=>verifyChangeControl762({env,record,prior,rollback,owner,
  readback:{status:'SIGNED_CHANGE_READBACK',envelope:signedChange},now,...changes});
const change=await changeCheck();
assert.equal(change.signature_authenticated,true);assert.equal(change.design_review_only,true);
assert.equal(change.production_execution_authorized,false);
assert.equal(change.status,'SIGNED_PRODUCTION_CHANGE_CONTROL_DESIGN_PREFLIGHT');
assert.ok(reviewURL762(env,'change',record,prior,rollback,owner).startsWith('https://change-board.example/'));
for(const delta of [{production_project_ref:target.nonprod_project_ref},
  {nonprod_project_ref:target.production_project_ref},
  {owner_signoff_sha256:'f'.repeat(64)},
  {rollback_review_receipt_sha256:'f'.repeat(64)},
  {migration_artifact_sha256:'f'.repeat(64)},
  {production_execution_authorization:'GRANTED'},
  {dba_review_status:'APPROVED_EXECUTION'},
  {window_start:'2026-11-03T14:00:00Z'},
  {window_end:'2026-11-05T18:00:00Z'},
  {observed_at:'2026-11-02T14:00:00Z'}]){
  const signed=await sign({...changePayload,...delta},canonicalChangeControl762,12);
  assert.equal((await changeCheck({readback:{status:'SIGNED_CHANGE_READBACK',envelope:signed}})).status,
    'HOLD_CHANGE_CONTROL_SCOPE');
}
assert.equal((await changeCheck({readback:{status:'SIGNED_CHANGE_READBACK',
  envelope:await sign(changePayload,canonicalChangeControl762,11)}})).status,
  'HOLD_CHANGE_CONTROL_SIGNATURE_INVALID');
assert.equal((await changeCheck({env:{...env,
  ROSIE_ECONOMIC_CHANGE_CONTROL_PUBLIC_KEY_B64:env.ROSIE_ECONOMIC_TRIAL_OPERATOR_PUBLIC_KEY_B64}})).status,
  'HOLD_CHANGE_CONTROL_KEY_INDEPENDENCE');
const reconciled=await reconcileChangeControl762({prior,rollback,owner,change,reviewed_at:'2026-11-03T15:01:00Z'});
assert.equal(reconciled.change_control_status,'READY_FOR_SEPARATE_PRODUCTION_CHANGE_AUTHORIZATION');
assert.deepEqual(reconciled.follow_ups.map(x=>x.code),[
  'SEPARATE_PRODUCTION_MIGRATION_AUTHORIZATION','BUSINESS_EXCEPTION_CLOSURE_HOLD']);
assert.match(reconciled.packet_sha256,/^[a-f0-9]{64}$/);
for(const key of ['production_execution_authorized','production_migration_executed',
  'rollback_executed_by_app','production_credentials_read','customer_notifications_sent_by_app',
  'owner_closure_audit_persisted','closure_allowed','automatic_business_write'])
  assert.equal(reconciled[key],false,key);
assert.equal((await reconcileChangeControl762({})).change_control_status,'HOLD_PRODUCTION_CHANGE_CONTROL_PREFLIGHT');

// A real rollback or failed trial can be independently signed and owner-held, but never promoted.
const exceptionOutcome={...outcome,clean_claim:false,receipt_sha256:'e'.repeat(64),
  rollback_disposition:'EXECUTED_NONPRODUCTION',rollback_execution_receipt_sha256:'f'.repeat(64)};
const priorException={...prior,independent_trial_witness:exceptionOutcome,
  trial_review_status:'HOLD_NONPROD_TRIAL_EVIDENCE',packet_sha256:'9'.repeat(64)};
const signedException=await sign({...rollbackPayload,outcome_receipt_sha256:exceptionOutcome.receipt_sha256,
  rollback_disposition:'EXECUTED_NONPRODUCTION',
  rollback_execution_receipt_sha256:exceptionOutcome.rollback_execution_receipt_sha256,
  decision:'EXCEPTION_HELD_FOR_MANUAL_REVIEW'},canonicalRollbackDisposition762,11);
const reviewedException=await verifyRollbackDisposition762({env,record,prior:priorException,
  readback:{status:'SIGNED_ROLLBACK_READBACK',envelope:signedException},now});
assert.equal(reviewedException.signature_authenticated,true);assert.equal(reviewedException.clean_claim,false);
const signedOwnerHold=await sign({...ownerPayload,build761_packet_sha256:priorException.packet_sha256,
  outcome_receipt_sha256:exceptionOutcome.receipt_sha256,
  rollback_review_receipt_sha256:reviewedException.receipt_sha256,
  decision:'hold_nonprod_trial_exception'},canonicalOwnerSignoff762,0);
const ownerHold=await verifyOwnerSignoff762({env,record,prior:priorException,rollback:reviewedException,
  envelope:signedOwnerHold,now});
assert.equal(ownerHold.signature_authenticated,true);assert.equal(ownerHold.clean_acceptance,false);
const blocked=await reconcileChangeControl762({prior:priorException,rollback:reviewedException,
  owner:ownerHold,reviewed_at:'2026-11-03T15:01:00Z'});
assert.equal(blocked.change_control_status,'HOLD_PRODUCTION_CHANGE_CONTROL_PREFLIGHT');
assert.ok(blocked.follow_ups.some(x=>x.code==='NONPROD_ROLLBACK_EXCEPTION_HELD'));
assert.equal((await verifyChangeControl762({env,record,prior:priorException,rollback:reviewedException,
  owner:ownerHold,readback:{status:'SIGNED_CHANGE_READBACK',envelope:signedChange},now})).status,
  'HOLD_CHANGE_CONTROL_SCOPE');

const oldFetch=globalThis.fetch;let unauthorizedFetches=0;
globalThis.fetch=async()=>{unauthorizedFetches++;throw Error('No unauthenticated provider calls');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const post=fn===onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_change_control_v762',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca','Content-Type':'application/json'},
      ...(post?{body:JSON.stringify({booking_id:record.booking_id,source_record:record})}:{})});
    const result=await fn({request,env});assert.ok(result.status>=400);
  }assert.equal(unauthorizedFetches,0);
}finally{globalThis.fetch=oldFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-change-v762','admin-economic-execution-v761','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`route mirror ${stem}`);
assert.match(read('admin-catalog.html'),/admin-economic-change-v762\.html/);
assert.match(read('admin-economic-execution-v761.html'),/admin-economic-change-v762\.html/);
assert.match(read('assets/economic-change-control-v762.js'),/credentials:'same-origin'/);
assert.match(read('docs/build762_owner_trial_signoff_rollback_change_control.md'),/read-only/i);
console.log('Build 762 PASS: 13 independent signers, rollback/owner/change review, exact project and artifact bindings, exceptions HOLD, private API, no production execution or closure.');
