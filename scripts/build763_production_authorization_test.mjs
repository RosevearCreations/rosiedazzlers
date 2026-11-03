import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
  APPROVAL_FIELDS763,OWNER_PRODUCTION_FIELDS763,OPERATOR_GATE_FIELDS763,ROLLBACK_READY_FIELDS763,
  canonicalApproval763,canonicalOwnerProduction763,canonicalOperatorGate763,canonicalRollbackReady763,
  authorizationURL763,readAuthorization763,verifyApproval763,verifyOwnerProduction763,
  verifyOperatorGate763,verifyRollbackReady763,reconcileAuthorization763
} from '../functions/api/_lib/economic-production-authorization-v763.js';
import {
  onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete
} from '../functions/api/admin/economic_production_authorization_v763.js';

globalThis.crypto??=webcrypto;
const b64=bytes=>Buffer.from(bytes).toString('base64');
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const prefixes=['OWNER_RECEIPT','SOURCE_WITNESS','HISTORY_CUSTODIAN','RETENTION_PROVIDER',
  'STORAGE_AUDITOR','DBA_REVIEW','SECURITY_REVIEW','ISOLATION_AUDITOR','ROLLBACK_WITNESS',
  'TRIAL_OPERATOR','TRIAL_RECONCILER','ROLLBACK_EXCEPTION','CHANGE_CONTROL','PRODUCTION_DBA_AUTH',
  'PRODUCTION_SECURITY_AUTH','PRODUCTION_OPERATOR_GATE','PRODUCTION_ROLLBACK_READY'];
const keys=[],env={};
for(let i=0;i<prefixes.length;i++){
  keys.push(await crypto.subtle.generateKey('Ed25519',true,['sign','verify']));
  env[`ROSIE_ECONOMIC_${prefixes[i]}_PUBLIC_KEY_B64`]=b64(await crypto.subtle.exportKey('raw',keys[i].publicKey));
  env[`ROSIE_ECONOMIC_${prefixes[i]}_KEY_ID`]=`independent-v763-key-role-${i}`;
}
for(const [name,origin] of Object.entries({
  TRIAL_OPERATOR:'https://trial-operator.example',
  TRIAL_RECONCILE:'https://trial-witness.example',
  ROLLBACK_EXCEPTION:'https://rollback-review.example',
  CHANGE_CONTROL:'https://change-review.example',
  PRODUCTION_DBA_AUTH:'https://production-dba.example',
  PRODUCTION_SECURITY_AUTH:'https://production-security.example',
  PRODUCTION_OPERATOR_GATE:'https://migration-operator.example',
  PRODUCTION_ROLLBACK_READY:'https://rollback-witness.example'
}))env[`ROSIE_ECONOMIC_${name}_BASE_URL`]=origin;
const record={booking_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  source_record_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'};
const trial={trial_id:'isolated-trial-763',build761_packet_sha256:'1'.repeat(64),
  operator_receipt_sha256:'2'.repeat(64),outcome_receipt_sha256:'3'.repeat(64),
  migration_artifact_sha256:'4'.repeat(64),rollback_artifact_sha256:'5'.repeat(64),
  backup_snapshot_sha256:'6'.repeat(64)};
const target={configured:true,production_project_ref:'production-rosie',
  nonprod_project_ref:'isolated-rosie',nonprod_environment_id:'isolated-run-763'};
const change={signature_authenticated:true,receipt_sha256:'7'.repeat(64),
  change_ticket_id:'production-change-763',window_start:'2026-11-04T16:00:00Z',
  window_end:'2026-11-04T18:00:00Z',observed_at:'2026-11-03T15:49:00Z'};
const prior={change_control_status:'READY_FOR_SEPARATE_PRODUCTION_CHANGE_AUTHORIZATION',
  packet_sha256:'8'.repeat(64),nonprod_target:target,trial_evidence_binding:trial,
  rollback_disposition_review:{clean_claim:true},owner_trial_signoff:{clean_acceptance:true},
  change_control_review:change};
const now=Date.parse('2026-11-03T16:00:00Z');
const sign=async(payload,canonical,role)=>({payload,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',keys[role].privateKey,canonical(payload)))});
assert.equal(prefixes.length,17);
assert.equal(APPROVAL_FIELDS763.length,18);
assert.equal(OWNER_PRODUCTION_FIELDS763.length,22);
assert.equal(OPERATOR_GATE_FIELDS763.length,23);
assert.equal(ROLLBACK_READY_FIELDS763.length,19);
const approvalBase={
  ...record,trial_id:trial.trial_id,change_ticket_id:change.change_ticket_id,
  production_project_ref:target.production_project_ref,nonprod_project_ref:target.nonprod_project_ref,
  build762_packet_sha256:prior.packet_sha256,
  change_control_receipt_sha256:change.receipt_sha256,
  migration_artifact_sha256:trial.migration_artifact_sha256,
  rollback_artifact_sha256:trial.rollback_artifact_sha256,
  backup_snapshot_sha256:trial.backup_snapshot_sha256,
  scope_check:'EXACT_PROJECT_AND_ARTIFACTS_CONFIRMED',
  authorization_decision:'APPROVE_EXACT_MANUAL_WINDOW_ONLY',
  observed_at:'2026-11-03T15:50:00Z',expires_at:'2026-11-03T16:13:00Z',
  reviewer_id:'independent-production-reviewer-763'
};
const dbaPayload={schema:'rosie-production-dba-authorization-v763',...approvalBase,
  key_id:env.ROSIE_ECONOMIC_PRODUCTION_DBA_AUTH_KEY_ID};
const securityPayload={schema:'rosie-production-security-authorization-v763',...approvalBase,
  observed_at:'2026-11-03T15:51:00Z',key_id:env.ROSIE_ECONOMIC_PRODUCTION_SECURITY_AUTH_KEY_ID};
const dbaEnvelope=await sign(dbaPayload,canonicalApproval763,13);
const securityEnvelope=await sign(securityPayload,canonicalApproval763,14);
const approvalCheck=async(role,envelope,delta={})=>verifyApproval763({env,role,record,prior,
  readback:{status:`SIGNED_${role.toUpperCase()}_READBACK`,envelope},now,...delta});
const dba=await approvalCheck('dba',dbaEnvelope),security=await approvalCheck('security',securityEnvelope);
assert.equal(dba.approved,true);assert.equal(security.approved,true);
assert.match(dba.receipt_sha256,/^[a-f0-9]{64}$/);
for(const delta of [
  {production_project_ref:'isolated-rosie'}, {build762_packet_sha256:'f'.repeat(64)},
  {rollback_artifact_sha256:'f'.repeat(64)}, {change_ticket_id:'another-ticket-763'},
  {observed_at:'2026-11-03T15:00:00Z'}, {authorization_decision:'UNRESTRICTED_EXECUTION'},
  {observed_at:'2026-11-03T15:48:00Z'},
  {scope_check:'UNKNOWN'}
]){
  const envelope=await sign({...dbaPayload,...delta},canonicalApproval763,13);
  assert.equal((await approvalCheck('dba',envelope)).status,'HOLD_APPROVAL_SCOPE');
}
assert.equal((await approvalCheck('dba',await sign(dbaPayload,canonicalApproval763,14))).status,
  'HOLD_APPROVAL_SIGNATURE');
assert.equal((await approvalCheck('dba',dbaEnvelope,{env:{...env,
  ROSIE_ECONOMIC_PRODUCTION_DBA_AUTH_PUBLIC_KEY_B64:env.ROSIE_ECONOMIC_CHANGE_CONTROL_PUBLIC_KEY_B64}})).status,
  'HOLD_APPROVAL_KEY_INDEPENDENCE');
const heldDbaPayload={...dbaPayload,scope_check:'EXCEPTION_REQUIRES_REVIEW',
  authorization_decision:'HOLD_CHANGE_WINDOW'};
const heldDba=await approvalCheck('dba',await sign(heldDbaPayload,canonicalApproval763,13));
assert.equal(heldDba.signature_authenticated,true);assert.equal(heldDba.approved,false);
assert.throws(()=>canonicalApproval763({...dbaPayload,unexpected:'yes'}),/Noncanonical/);
assert.ok(authorizationURL763(env,'dba',record,prior).startsWith('https://production-dba.example/'));
assert.equal(authorizationURL763({...env,
  ROSIE_ECONOMIC_PRODUCTION_DBA_AUTH_BASE_URL:env.ROSIE_ECONOMIC_CHANGE_CONTROL_BASE_URL},
  'dba',record,prior),null);
assert.equal(authorizationURL763({...env,ROSIE_ECONOMIC_PRODUCTION_SECURITY_AUTH_BASE_URL:'http://bad.example'},
  'security',record,prior),null);
assert.equal(authorizationURL763({...env,ROSIE_ECONOMIC_PRODUCTION_DBA_AUTH_BASE_URL:'https://127.0.0.1'},
  'dba',record,prior),null);
assert.equal(authorizationURL763(env,'operator',record,prior,{dba,security},null),null);
assert.equal(authorizationURL763(env,'rollback',record,prior,{dba,security},
  {clean_authorization:true,receipt_sha256:'a'.repeat(64)},null),null);
let providerCalls=0;
assert.equal((await readAuthorization763(env,'dba',record,prior,{},null,null,async(url,options)=>{
  providerCalls++;assert.ok(url.includes('change_ticket_id=production-change-763'));
  assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  return new Response(JSON.stringify(dbaEnvelope),{status:200});
})).status,'SIGNED_DBA_READBACK');
assert.equal(providerCalls,1);
assert.equal((await readAuthorization763(env,'dba',record,prior,{},null,null,
  async()=>new Response('unavailable',{status:503}))).status,'HOLD_DBA_PROVIDER_UNAVAILABLE');
assert.equal((await readAuthorization763({},'dba',record,prior)).status,
  'HOLD_DBA_INDEPENDENT_PROVIDER_NOT_CONFIGURED');

const ownerPayload={schema:'rosie-owner-production-decision-v763',...record,
  trial_id:trial.trial_id,change_ticket_id:change.change_ticket_id,
  production_project_ref:target.production_project_ref,nonprod_project_ref:target.nonprod_project_ref,
  build762_packet_sha256:prior.packet_sha256,change_control_receipt_sha256:change.receipt_sha256,
  dba_authorization_sha256:dba.receipt_sha256,security_authorization_sha256:security.receipt_sha256,
  migration_artifact_sha256:trial.migration_artifact_sha256,
  rollback_artifact_sha256:trial.rollback_artifact_sha256,
  backup_snapshot_sha256:trial.backup_snapshot_sha256,
  window_start:change.window_start,window_end:change.window_end,
  decision:'AUTHORIZE_OFFLINE_OPERATOR_GATE_REVIEW',owner_id:'rosie-owner-763',
  issued_at:'2026-11-03T15:52:00Z',expires_at:'2026-11-03T16:13:00Z',
  nonce:'a'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const ownerEnvelope=await sign(ownerPayload,canonicalOwnerProduction763,0);
const ownerCheck=async(envelope=ownerEnvelope,extra={})=>verifyOwnerProduction763({env,record,prior,
  dba,security,envelope,now,...extra});
const owner=await ownerCheck();
assert.equal(owner.clean_authorization,true);assert.equal(owner.production_execution_authorized_by_app,false);
for(const delta of [{security_authorization_sha256:'f'.repeat(64)},
  {production_project_ref:'isolated-rosie'},{window_start:'2026-11-03T17:00:00Z'},
  {decision:'EXECUTE_SQL_NOW'},{issued_at:'2026-11-03T15:49:00Z'},{nonce:'bad'}]){
  assert.equal((await ownerCheck(await sign({...ownerPayload,...delta},
    canonicalOwnerProduction763,0))).status,'HOLD_PRODUCTION_OWNER_SCOPE');
}
assert.equal((await ownerCheck(await sign(ownerPayload,canonicalOwnerProduction763,1))).status,
  'HOLD_PRODUCTION_OWNER_SIGNATURE');
const ownerHoldEnvelope=await sign({...ownerPayload,dba_authorization_sha256:heldDba.receipt_sha256,
  decision:'HOLD_PRODUCTION_CHANGE'},canonicalOwnerProduction763,0);
const ownerHold=await ownerCheck(ownerHoldEnvelope,{dba:heldDba});
assert.equal(ownerHold.signature_authenticated,true);assert.equal(ownerHold.clean_authorization,false);

const operatorPayload={schema:'rosie-production-operator-gate-v763',...record,
  trial_id:trial.trial_id,change_ticket_id:change.change_ticket_id,
  production_project_ref:target.production_project_ref,
  owner_authorization_sha256:owner.receipt_sha256,dba_authorization_sha256:dba.receipt_sha256,
  security_authorization_sha256:security.receipt_sha256,
  migration_artifact_sha256:trial.migration_artifact_sha256,
  rollback_artifact_sha256:trial.rollback_artifact_sha256,
  backup_snapshot_sha256:trial.backup_snapshot_sha256,
  runbook_sha256:'b'.repeat(64),execution_request_id:'external-execution-request-763',
  window_start:change.window_start,window_end:change.window_end,
  credential_scope:'PRODUCTION_CREDENTIALS_NOT_ACCESSED_BY_APP',
  operator_ack:'AVAILABLE_NO_MIGRATION_EXECUTED',
  two_person_control:'SEPARATE_WITNESS_REQUIRED',
  observed_at:'2026-11-03T15:53:00Z',expires_at:'2026-11-03T16:13:00Z',
  operator_id:'external-prod-operator-763',
  key_id:env.ROSIE_ECONOMIC_PRODUCTION_OPERATOR_GATE_KEY_ID};
const operatorEnvelope=await sign(operatorPayload,canonicalOperatorGate763,15);
const opCheck=async(envelope=operatorEnvelope,extra={})=>verifyOperatorGate763({env,record,prior,
  dba,security,owner,readback:{status:'SIGNED_OPERATOR_READBACK',envelope},now,...extra});
const operator=await opCheck();
assert.equal(operator.ready_claim,true);assert.equal(operator.production_migration_executed,false);
assert.ok(authorizationURL763(env,'operator',record,prior,{dba,security},owner)
  .includes('owner_authorization_sha256='));
for(const delta of [{owner_authorization_sha256:'f'.repeat(64)},
  {operator_ack:'MIGRATION_EXECUTED'}, {credential_scope:'PRODUCTION_KEYS_SENT_TO_APP'},
  {two_person_control:'BYPASS'}, {migration_artifact_sha256:'f'.repeat(64)},
  {window_end:'2026-11-04T20:00:00Z'}]){
  assert.equal((await opCheck(await sign({...operatorPayload,...delta},canonicalOperatorGate763,15))).status,
    'HOLD_OPERATOR_GATE_SCOPE');
}
assert.equal((await opCheck(await sign(operatorPayload,canonicalOperatorGate763,14))).status,
  'HOLD_OPERATOR_GATE_SIGNATURE');

const rollbackPayload={schema:'rosie-production-rollback-witness-ready-v763',...record,
  trial_id:trial.trial_id,change_ticket_id:change.change_ticket_id,
  production_project_ref:target.production_project_ref,
  owner_authorization_sha256:owner.receipt_sha256,
  operator_gate_sha256:operator.receipt_sha256,
  rollback_artifact_sha256:trial.rollback_artifact_sha256,
  backup_snapshot_sha256:trial.backup_snapshot_sha256,
  runbook_sha256:operator.runbook_sha256,incident_runbook_sha256:'c'.repeat(64),
  escalation_id:'incident-esc-763',availability:'ON_CALL_READY_NO_ROLLBACK_EXECUTED',
  protocol:'MANUAL_TWO_PERSON_APPROVAL_REQUIRED',
  observed_at:'2026-11-03T15:54:00Z',expires_at:'2026-11-03T16:13:00Z',
  witness_id:'external-rollback-witness-763',
  key_id:env.ROSIE_ECONOMIC_PRODUCTION_ROLLBACK_READY_KEY_ID};
const rollbackEnvelope=await sign(rollbackPayload,canonicalRollbackReady763,16);
const witnessCheck=async(envelope=rollbackEnvelope,extra={})=>verifyRollbackReady763({env,record,
  prior,owner,operator,readback:{status:'SIGNED_ROLLBACK_READBACK',envelope},now,...extra});
const rollback=await witnessCheck();
assert.equal(rollback.ready_claim,true);assert.equal(rollback.rollback_executed_by_app,false);
assert.ok(authorizationURL763(env,'rollback',record,prior,{dba,security},owner,operator)
  .includes('operator_gate_sha256='));
for(const delta of [{operator_gate_sha256:'f'.repeat(64)}, {availability:'ROLLBACK_EXECUTED'},
  {protocol:'SINGLE_OPERATOR'}, {runbook_sha256:'f'.repeat(64)},
  {observed_at:'2026-11-03T15:52:00Z'}]){
  assert.equal((await witnessCheck(await sign({...rollbackPayload,...delta},
    canonicalRollbackReady763,16))).status,'HOLD_ROLLBACK_WITNESS_SCOPE');
}
assert.equal((await witnessCheck(await sign(rollbackPayload,canonicalRollbackReady763,15))).status,
  'HOLD_ROLLBACK_WITNESS_SIGNATURE');

const ready=await reconcileAuthorization763({prior,dba,security,owner,operator,rollback,
  reviewed_at:'2026-11-03T16:01:00Z'});
assert.equal(ready.authorization_status,'READY_FOR_EXTERNAL_MANUAL_CHANGE_MANAGER_RECHECK');
assert.equal(ready.manual_authorization_claims_authenticated,true);
assert.deepEqual(ready.follow_ups.map(x=>x.code),[
  'MANUAL_CHANGE_WINDOW_EXECUTION_REMAINS_EXTERNAL','PRODUCTION_OUTCOME_AND_BUSINESS_CLOSURE_HOLD']);
assert.match(ready.packet_sha256,/^[a-f0-9]{64}$/);
for(const field of ['production_execution_authorized','production_execution_authorized_by_app',
  'production_migration_executed','rollback_executed_by_app','production_credentials_read',
  'customer_notifications_sent_by_app','owner_closure_audit_persisted',
  'closure_allowed','automatic_business_write'])assert.equal(ready[field],false,field);
const blocked=await reconcileAuthorization763({prior,dba:heldDba,security,owner:ownerHold,
  reviewed_at:'2026-11-03T16:01:00Z'});
assert.equal(blocked.authorization_status,'HOLD_PRODUCTION_OPERATOR_AUTHORIZATION_GATE');
assert.ok(blocked.follow_ups.some(x=>x.code==='DBA_AUTHORIZATION_HOLD'));
assert.equal((await reconcileAuthorization763({})).manual_authorization_claims_authenticated,false);
const oldFetch=globalThis.fetch;let anonymousCalls=0;
globalThis.fetch=async()=>{anonymousCalls++;throw Error('Unexpected unauthenticated provider request');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const post=fn===onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_production_authorization_v763',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
        'Content-Type':'application/json'},
      ...(post?{body:JSON.stringify({source_record:record})}:{})});
    const result=await fn({request,env});assert.ok(result.status>=400);
  }
  assert.equal(anonymousCalls,0);
}finally{globalThis.fetch=oldFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-authorization-v763','admin-economic-change-v762','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`route mirror ${stem}`);
assert.match(read('admin-catalog.html'),/admin-economic-authorization-v763\.html/);
assert.match(read('admin-economic-change-v762.html'),/admin-economic-authorization-v763\.html/);
assert.match(read('assets/economic-production-authorization-v763.js'),/credentials:'same-origin'/);
assert.match(read('docs/build763_production_authorization_operator_rollback_gate.md'),/read-only/i);
console.log('Build 763 PASS: 17 unique signers, independent DBA/security/owner/operator/rollback scope, external origins, signed HOLDs, private gate and no production SQL or closure.');
