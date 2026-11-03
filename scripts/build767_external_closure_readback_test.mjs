import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {EXECUTION_FIELDS767,INSPECTION_FIELDS767,canonicalExecution767,
  canonicalInspection767,verifyExecution767,verifyInspection767,
  readReceipt767,receiptURL767,reconcile767}
  from '../functions/api/_lib/economic-external-closure-v767.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_external_closure_v767.js';

globalThis.crypto??=webcrypto;
const b64=bytes=>Buffer.from(bytes).toString('base64');
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const now=Date.parse('2026-11-04T21:00:00Z');
const record={booking_id:'12345678-1234-1234-1234-123456789abc',
  source_record_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',
  change_ticket_id:'production-change-767',execution_request_id:'external-request-767'};
const keyRoles=[
  'OWNER_RECEIPT','SOURCE_WITNESS','HISTORY_CUSTODIAN','RETENTION_PROVIDER',
  'STORAGE_AUDITOR','DBA_REVIEW','SECURITY_REVIEW','ISOLATION_AUDITOR',
  'ROLLBACK_WITNESS','TRIAL_OPERATOR','TRIAL_RECONCILER','ROLLBACK_EXCEPTION',
  'CHANGE_CONTROL','PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH',
  'PRODUCTION_OPERATOR_GATE','PRODUCTION_ROLLBACK_READY',
  'PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR',
  'CLOSURE_DECISION_CUSTODIAN','FINAL_EXCEPTION_DISPOSITION_REVIEWER',
  'EXTERNAL_CLOSURE_OPERATOR_WITNESS','INDEPENDENT_POST_CLOSURE_INSPECTOR'
];
const originRoles=[
  'TRIAL_OPERATOR','TRIAL_RECONCILE','ROLLBACK_EXCEPTION','CHANGE_CONTROL',
  'PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH','PRODUCTION_OPERATOR_GATE',
  'PRODUCTION_ROLLBACK_READY','PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR',
  'CLOSURE_DECISION_CUSTODIAN','FINAL_EXCEPTION_DISPOSITION_REVIEWER',
  'EXTERNAL_CLOSURE_OPERATOR_WITNESS','INDEPENDENT_POST_CLOSURE_INSPECTOR'
];
const env={},keys=[];
for(const [i,role] of keyRoles.entries()){
  const kp=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);keys.push(kp);
  env[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`]=b64(await crypto.subtle.exportKey('raw',kp.publicKey));
  env[`ROSIE_ECONOMIC_${role}_KEY_ID`]=`unique-test-role-767-${i}`;
}
for(const [i,role] of originRoles.entries())
  env[`ROSIE_ECONOMIC_${role}_BASE_URL`]=`https://independent-${i}.example`;
async function sign(payload,canonical,index){return {payload,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',keys[index].privateKey,canonical(payload)))};}
assert.equal(keyRoles.length,25);assert.equal(originRoles.length,16);
assert.equal(EXECUTION_FIELDS767.length,19);assert.equal(INSPECTION_FIELDS767.length,20);
const prior={ok:true,final_disposition_status:'READY_FOR_SEPARATE_CONTROLLED_EXTERNAL_CLOSURE_HANDOFF',
  owner_external_manual_authorization:{signature_authenticated:true,
    authorizes_external_manual_review_only:true,receipt_sha256:'1'.repeat(64)},
  independent_append_only_decision_custody:{signature_authenticated:true,
    clean_claim:true,receipt_sha256:'2'.repeat(64)},
  independent_final_exception_disposition:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'3'.repeat(64),reviewed_at:'2026-11-04T20:00:00Z'},
  verified_scope:{trial_id:'same-external-trial-767',production_project_ref:'prod-project-767',
    db_inspection_receipt_sha256:'4'.repeat(64),audit_inspection_receipt_sha256:'5'.repeat(64)},
  packet_sha256:'6'.repeat(64)};
const executionPayload={schema:'rosie-independent-external-closure-outcome-v767',...record,
  trial_id:prior.verified_scope.trial_id,
  production_project_ref:prior.verified_scope.production_project_ref,
  owner_authorization_receipt_sha256:prior.owner_external_manual_authorization.receipt_sha256,
  ledger_decision_receipt_sha256:prior.independent_append_only_decision_custody.receipt_sha256,
  final_disposition_receipt_sha256:prior.independent_final_exception_disposition.receipt_sha256,
  external_execution_ticket_id:'external-execution-ticket-767',
  change_manager_approval_sha256:'7'.repeat(64),operator_action_receipt_sha256:'8'.repeat(64),
  result_record_sha256:'9'.repeat(64),execution_result:'EXTERNAL_CLOSURE_COMPLETED_CLAIM',
  executed_at:'2026-11-04T20:10:00Z',external_operator_id:'operator-outside-app-767',
  witness_id:'independent-witness-767',
  key_id:env.ROSIE_ECONOMIC_EXTERNAL_CLOSURE_OPERATOR_WITNESS_KEY_ID};
const signedExecution=await sign(executionPayload,canonicalExecution767,23);
const checkExecution=async(signed=signedExecution,extra={})=>verifyExecution767({env,record,prior,
  readback:{status:'SIGNED_EXECUTION_READBACK',envelope:signed},now,...extra});
const execution=await checkExecution();
assert.equal(execution.signature_authenticated,true);assert.equal(execution.clean_claim,true);
assert.equal(execution.closure_executed_or_verified_by_app,false);
assert.ok(receiptURL767(env,'execution',record,prior).includes('final_disposition_receipt_sha256='));
assert.equal((await readReceipt767(env,'execution',record,prior,null,
  async()=>new Response(JSON.stringify(signedExecution)))).status,'SIGNED_EXECUTION_READBACK');
for(const delta of [
  {trial_id:'wrong-trial'},{production_project_ref:'other-project'},
  {final_disposition_receipt_sha256:'f'.repeat(64)},
  {change_manager_approval_sha256:'not-a-digest'},
  {execution_result:'AUTOMATIC_CLOSURE_NOW'},
  {executed_at:'2026-11-04T19:00:00Z'},
  {external_execution_ticket_id:'x'}
])assert.equal((await checkExecution(await sign({...executionPayload,...delta},
  canonicalExecution767,23))).status,'HOLD_EXECUTION_SCOPE');
assert.equal((await checkExecution(await sign(executionPayload,canonicalExecution767,24))).status,
  'HOLD_EXECUTION_SIGNATURE');
assert.throws(()=>canonicalExecution767({...executionPayload,untrusted:'extra'}),/Noncanonical/);
assert.equal((await checkExecution(signedExecution,{env:{...env,
  ROSIE_ECONOMIC_EXTERNAL_CLOSURE_OPERATOR_WITNESS_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_FINAL_EXCEPTION_DISPOSITION_REVIEWER_PUBLIC_KEY_B64}})).status,
  'HOLD_EXECUTION_SIGNER_INDEPENDENCE');
assert.equal((await checkExecution(signedExecution,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_POST_CLOSURE_INSPECTOR_BASE_URL:
    env.ROSIE_ECONOMIC_EXTERNAL_CLOSURE_OPERATOR_WITNESS_BASE_URL}})).status,
  'HOLD_EXECUTION_ORIGIN_INDEPENDENCE');
assert.equal((await checkExecution(signedExecution,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_POST_CLOSURE_INSPECTOR_BASE_URL:'http://127.0.0.1'}})).status,
  'HOLD_EXECUTION_ORIGIN_INDEPENDENCE');
const inspectionPayload={schema:'rosie-independent-postclosure-state-readback-v767',...record,
  trial_id:prior.verified_scope.trial_id,
  production_project_ref:prior.verified_scope.production_project_ref,
  external_execution_receipt_sha256:execution.receipt_sha256,
  db_inspection_receipt_sha256:prior.verified_scope.db_inspection_receipt_sha256,
  immutable_audit_inspection_receipt_sha256:prior.verified_scope.audit_inspection_receipt_sha256,
  result_record_sha256:execution.result_record_sha256,
  postchange_record_sha256:'a'.repeat(64),ledger_continuity_sha256:'b'.repeat(64),
  exception_register_sha256:'c'.repeat(64),critical_exception_count:'0',
  record_state:'CLOSED_CLAIM',inspection_result:'POST_CLOSURE_STATE_MATCH_CLAIM',
  inspected_at:'2026-11-04T20:20:00Z',independent_inspector_id:'inspector-outside-app-767',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_POST_CLOSURE_INSPECTOR_KEY_ID};
const signedInspection=await sign(inspectionPayload,canonicalInspection767,24);
const checkInspection=async(signed=signedInspection,extra={})=>verifyInspection767({env,record,prior,
  execution,readback:{status:'SIGNED_INSPECTION_READBACK',envelope:signed},now,...extra});
const inspection=await checkInspection();
assert.equal(inspection.signature_authenticated,true);assert.equal(inspection.clean_claim,true);
assert.equal(inspection.database_connected_by_app,false);
assert.ok(receiptURL767(env,'inspection',record,prior,execution)
  .includes('external_execution_receipt_sha256='));
assert.equal(receiptURL767(env,'inspection',record,prior,{signature_authenticated:false}),null);
assert.equal((await readReceipt767(env,'inspection',record,prior,execution,
  async()=>new Response(JSON.stringify(signedInspection)))).status,'SIGNED_INSPECTION_READBACK');
for(const delta of [
  {external_execution_receipt_sha256:'f'.repeat(64)},
  {db_inspection_receipt_sha256:'f'.repeat(64)},
  {result_record_sha256:'f'.repeat(64)},
  {critical_exception_count:'1'},
  {record_state:'UNCHANGED_OR_UNKNOWN'},
  {inspection_result:'CLOSE_CASE'},
  {inspected_at:'2026-11-04T20:01:00Z'}
])assert.equal((await checkInspection(await sign({...inspectionPayload,...delta},
  canonicalInspection767,24))).status,'HOLD_INSPECTION_SCOPE');
assert.equal((await checkInspection(await sign(inspectionPayload,canonicalInspection767,23))).status,
  'HOLD_INSPECTION_SIGNATURE');
const ready=await reconcile767({prior,execution,inspection});
assert.equal(ready.post_closure_review_status,'READY_FOR_SEPARATE_OWNER_FINAL_ACCEPTANCE_REVIEW');
assert.deepEqual(ready.follow_ups.map(x=>x.code),['OWNER_FINAL_ACCEPTANCE_AND_SOURCE_AUDIT_REQUIRED']);
for(const key of ['external_closure_executed_or_verified_by_app','production_db_connected_by_app',
  'immutable_ledger_verified_by_app','owner_acceptance_recorded_by_app','automatic_business_write',
  'closure_allowed','customer_notifications_sent_by_app'])assert.equal(ready[key],false,key);
assert.match(ready.packet_sha256,/^[a-f0-9]{64}$/);
const held=await reconcile767({prior:{...prior,final_disposition_status:'HOLD'},execution,inspection});
assert.equal(held.post_closure_review_status,'HOLD_EXTERNAL_CLOSURE_OUTCOME_OR_STATE_READBACK');
assert.ok(held.follow_ups.some(x=>x.code==='BUILD766_INDEPENDENT_HANDOFF_NOT_READY'));
const signedExecutionHold=await sign({...executionPayload,
  execution_result:'EXTERNAL_CLOSURE_EXCEPTION_HOLD'},canonicalExecution767,23);
const failedExecution=await checkExecution(signedExecutionHold);
assert.equal(failedExecution.signature_authenticated,true);assert.equal(failedExecution.clean_claim,false);
const mismatch=await checkInspection(signedInspection,{execution:failedExecution});
assert.equal(mismatch.status,'HOLD_INSPECTION_SCOPE');
const heldOutcome=await reconcile767({prior,execution:failedExecution});
assert.equal(heldOutcome.post_closure_review_status,'HOLD_EXTERNAL_CLOSURE_OUTCOME_OR_STATE_READBACK');

// Unauthenticated API calls must not reach any historical or new evidence source.
let sourceCalls=0;const oldFetch=globalThis.fetch;
globalThis.fetch=async()=>{sourceCalls++;throw Error('Unauthorized provider call');};
try{for(const fn of [onRequestGet,onRequestPost]){
  const isPost=fn===onRequestPost;
  const request=new Request('https://rosiedazzlers.ca/api/admin/economic_external_closure_v767',{
    method:isPost?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
      'Content-Type':'application/json'},...(isPost?{body:JSON.stringify(record)}:{})});
  assert.ok((await fn({request,env})).status>=400);
}assert.equal(sourceCalls,0);}finally{globalThis.fetch=oldFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-external-v767','admin-economic-final-v766','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`route mirror ${stem}`);
assert.match(read('admin-catalog.html'),/admin-economic-external-v767\.html/);
assert.match(read('admin-economic-final-v766.html'),/admin-economic-external-v767\.html/);
assert.match(read('assets/economic-external-closure-v767.js'),/credentials:'same-origin'/);
assert.match(read('docs/build767_external_closure_state_readback.md'),/read-only/i);
console.log('Build 767 PASS: 25 distinct signing roles, 16 external origins, operator/state proof gating, HOLD and no production mutations.');
