import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
  GATE_ARCHIVE_FIELDS764,EXECUTION_FIELDS764,STANDBY_FIELDS764,
  RECONCILIATION_FIELDS764,OWNER_POSTCHANGE_FIELDS764,
  canonicalArchive764,canonicalExecution764,canonicalStandby764,
  canonicalReconciliation764,canonicalOwnerPostchange764,
  receiptURL764,readReceipt764,verifyArchive764,verifyExecution764,
  verifyStandby764,verifyReconciliation764,verifyOwnerPostchange764,reconcilePostchange764
} from '../functions/api/_lib/economic-production-outcome-v764.js';
import {
  onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete
} from '../functions/api/admin/economic_postchange_reconciliation_v764.js';

globalThis.crypto??=webcrypto;
const b64=bytes=>Buffer.from(bytes).toString('base64');
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const prefixes=['OWNER_RECEIPT','SOURCE_WITNESS','HISTORY_CUSTODIAN','RETENTION_PROVIDER',
  'STORAGE_AUDITOR','DBA_REVIEW','SECURITY_REVIEW','ISOLATION_AUDITOR','ROLLBACK_WITNESS',
  'TRIAL_OPERATOR','TRIAL_RECONCILER','ROLLBACK_EXCEPTION','CHANGE_CONTROL','PRODUCTION_DBA_AUTH',
  'PRODUCTION_SECURITY_AUTH','PRODUCTION_OPERATOR_GATE','PRODUCTION_ROLLBACK_READY',
  'PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER'];
const keys=[],env={};
for(let i=0;i<prefixes.length;i++){
  keys.push(await crypto.subtle.generateKey('Ed25519',true,['sign','verify']));
  env[`ROSIE_ECONOMIC_${prefixes[i]}_PUBLIC_KEY_B64`]=b64(await crypto.subtle.exportKey('raw',keys[i].publicKey));
  env[`ROSIE_ECONOMIC_${prefixes[i]}_KEY_ID`]=`distinct-v764-signer-role-${i}`;
}
for(const [name,origin] of Object.entries({
  TRIAL_OPERATOR:'https://trial-operator.example',
  TRIAL_RECONCILE:'https://trial-reconcile.example',
  ROLLBACK_EXCEPTION:'https://rollback-review.example',
  CHANGE_CONTROL:'https://change-review.example',
  PRODUCTION_DBA_AUTH:'https://prod-dba.example',
  PRODUCTION_SECURITY_AUTH:'https://prod-security.example',
  PRODUCTION_OPERATOR_GATE:'https://prod-operator.example',
  PRODUCTION_ROLLBACK_READY:'https://prod-rollback.example',
  PRODUCTION_GATE_ARCHIVIST:'https://gate-archive.example',
  PRODUCTION_OUTCOME_RECONCILER:'https://prod-outcome.example'
}))env[`ROSIE_ECONOMIC_${name}_BASE_URL`]=origin;
const record={booking_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  source_record_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  change_ticket_id:'production-change-ticket-764',
  execution_request_id:'external-execution-request-764'};
const now=Date.parse('2026-11-04T19:00:00Z');
const sign=async(payload,canonical,role)=>({payload,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',keys[role].privateKey,canonical(payload)))});
assert.equal(prefixes.length,19);
assert.equal(GATE_ARCHIVE_FIELDS764.length,27);
assert.equal(EXECUTION_FIELDS764.length,23);
assert.equal(STANDBY_FIELDS764.length,19);
assert.equal(RECONCILIATION_FIELDS764.length,18);
assert.equal(OWNER_POSTCHANGE_FIELDS764.length,16);

const archivePayload={schema:'rosie-independent-execution-gate-archive-v764',...record,
  trial_id:'nonprod-trial-764',production_project_ref:'production-rosie',
  nonprod_project_ref:'isolated-rosie',
  build763_packet_sha256:'1'.repeat(64),owner_production_sha256:'2'.repeat(64),
  dba_authorization_sha256:'3'.repeat(64),security_authorization_sha256:'4'.repeat(64),
  operator_gate_sha256:'5'.repeat(64),rollback_ready_sha256:'6'.repeat(64),
  migration_artifact_sha256:'7'.repeat(64),rollback_artifact_sha256:'8'.repeat(64),
  backup_snapshot_sha256:'9'.repeat(64),
  window_start:'2026-11-04T16:00:00Z',window_end:'2026-11-04T18:00:00Z',
  gate_status:'READY_FOR_EXTERNAL_MANUAL_CHANGE_MANAGER_RECHECK',
  preflight_reviewed_at:'2026-11-04T15:43:00Z',recorded_at:'2026-11-04T15:45:00Z',
  ledger_entry_id:'external-append-log-764',ledger_previous_sha256:'a'.repeat(64),
  ledger_claim:'EXTERNAL_APPEND_ONLY_ATTESTATION_ONLY',
  change_manager_id:'external-change-manager-764',
  key_id:env.ROSIE_ECONOMIC_PRODUCTION_GATE_ARCHIVIST_KEY_ID};
const signedArchive=await sign(archivePayload,canonicalArchive764,17);
const archiveCheck=async(envelope=signedArchive,extra={})=>verifyArchive764({env,record,
  readback:{status:'SIGNED_ARCHIVE_READBACK',envelope},now,...extra});
const archive=await archiveCheck();
assert.equal(archive.signature_authenticated,true);
assert.equal(archive.status,'SIGNED_HISTORICAL_BUILD763_GATE_ATTESTATION_CLAIM');
assert.match(archive.receipt_sha256,/^[a-f0-9]{64}$/);
for(const delta of [
  {production_project_ref:'isolated-rosie'},
  {owner_production_sha256:'NONE'}, {gate_status:'EXECUTE_NOW'},
  {preflight_reviewed_at:'2026-11-04T14:00:00Z'},
  {recorded_at:'2026-11-04T16:01:00Z'},
  {window_end:'2026-11-04T23:00:00Z'},
  {change_ticket_id:'different-ticket-764'}, {ledger_claim:'IMMUTABLE_PROVEN_BY_SITE'}
]){
  const signed=await sign({...archivePayload,...delta},canonicalArchive764,17);
  assert.equal((await archiveCheck(signed)).status,'HOLD_ARCHIVE_SCOPE');
}
assert.equal((await archiveCheck(await sign(archivePayload,canonicalArchive764,18))).status,
  'HOLD_ARCHIVE_SIGNATURE');
// A different syntactically valid hash may be independently signed; its factual
// relationship to the original Build 763 source still needs a separate ledger audit.
const alternativeArchive=await archiveCheck(await sign({...archivePayload,
  build763_packet_sha256:'b'.repeat(64)},canonicalArchive764,17));
assert.equal(alternativeArchive.signature_authenticated,true);
assert.notEqual(alternativeArchive.receipt_sha256,archive.receipt_sha256);
assert.equal((await archiveCheck(signedArchive,{env:{...env,
  ROSIE_ECONOMIC_PRODUCTION_GATE_ARCHIVIST_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_PRODUCTION_OPERATOR_GATE_PUBLIC_KEY_B64}})).status,
  'HOLD_ARCHIVE_KEY_INDEPENDENCE');
assert.throws(()=>canonicalArchive764({...archivePayload,extra:'bad'}),/Noncanonical/);
assert.ok(receiptURL764(env,'archive',record).startsWith('https://gate-archive.example/v1/'));
assert.equal(receiptURL764({...env,ROSIE_ECONOMIC_PRODUCTION_GATE_ARCHIVIST_BASE_URL:
  env.ROSIE_ECONOMIC_CHANGE_CONTROL_BASE_URL},'archive',record),null);
assert.equal(receiptURL764({...env,ROSIE_ECONOMIC_PRODUCTION_OUTCOME_RECONCILER_BASE_URL:
  'https://127.0.0.1'},'archive',record),null);
assert.equal(receiptURL764(env,'execution',record,null),null);
let calls=0;
assert.equal((await readReceipt764(env,'archive',record,null,null,null,async(url,options)=>{
  calls++;assert.ok(url.includes('change_ticket_id=production-change-ticket-764'));
  assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  return new Response(JSON.stringify(signedArchive),{status:200});
})).status,'SIGNED_ARCHIVE_READBACK');
assert.equal(calls,1);
assert.equal((await readReceipt764(env,'archive',record,null,null,null,
  async()=>new Response('unavailable',{status:503}))).status,'HOLD_ARCHIVE_PROVIDER_UNAVAILABLE');
assert.equal((await readReceipt764({},'archive',record)).status,'HOLD_ARCHIVE_PROVIDER_NOT_CONFIGURED');

const executionPayload={schema:'rosie-external-production-execution-v764',...record,
  trial_id:archive.trial_id,production_project_ref:archive.production_project_ref,
  gate_archive_receipt_sha256:archive.receipt_sha256,
  build763_packet_sha256:archive.build763_packet_sha256,
  operator_gate_sha256:archive.operator_gate_sha256,
  migration_artifact_sha256:archive.migration_artifact_sha256,
  backup_snapshot_sha256:archive.backup_snapshot_sha256,
  migration_execution_id:'external-sql-execution-764',migration_version:'migration-version-764',
  transaction_receipt_sha256:'b'.repeat(64),schema_before_sha256:'c'.repeat(64),
  schema_after_sha256:'d'.repeat(64),
  started_at:'2026-11-04T16:15:00Z',finished_at:'2026-11-04T16:45:00Z',
  execution_result:'SUCCEEDED_EXTERNAL_CLAIM',
  credential_handling:'OUTSIDE_APP_EXTERNAL_OPERATOR_ONLY',
  operator_id:'external-production-operator-764',
  key_id:env.ROSIE_ECONOMIC_PRODUCTION_OPERATOR_GATE_KEY_ID};
const signedExecution=await sign(executionPayload,canonicalExecution764,15);
const executionCheck=async(envelope=signedExecution,extra={})=>verifyExecution764({env,record,archive,
  readback:{status:'SIGNED_EXECUTION_READBACK',envelope},now,...extra});
const execution=await executionCheck();
assert.equal(execution.signature_authenticated,true);assert.equal(execution.clean_claim,true);
assert.equal(execution.production_db_state_verified_by_app,false);
assert.ok(receiptURL764(env,'execution',record,archive).includes('gate_archive_receipt_sha256='));
for(const delta of [{production_project_ref:'isolated-rosie'},{operator_gate_sha256:'f'.repeat(64)},
  {migration_artifact_sha256:'f'.repeat(64)}, {credential_handling:'KEYS_SENT_TO_SITE'},
  {started_at:'2026-11-04T15:00:00Z'}, {finished_at:'2026-11-04T19:00:00Z'},
  {schema_after_sha256:executionPayload.schema_before_sha256},
  {execution_result:'APPROVED_UNRESTRICTED_WRITES'}]){
  const signed=await sign({...executionPayload,...delta},canonicalExecution764,15);
  assert.equal((await executionCheck(signed)).status,'HOLD_EXECUTION_SCOPE');
}
assert.equal((await executionCheck(await sign(executionPayload,canonicalExecution764,16))).status,
  'HOLD_EXECUTION_SIGNATURE');

const standbyPayload={schema:'rosie-independent-production-rollback-standby-v764',...record,
  trial_id:archive.trial_id,production_project_ref:archive.production_project_ref,
  gate_archive_receipt_sha256:archive.receipt_sha256,
  execution_receipt_sha256:execution.receipt_sha256,
  rollback_ready_sha256:archive.rollback_ready_sha256,
  rollback_artifact_sha256:archive.rollback_artifact_sha256,
  backup_snapshot_sha256:archive.backup_snapshot_sha256,
  standby_start:'2026-11-04T16:00:00Z',standby_end:'2026-11-04T17:00:00Z',
  standby_outcome:'STANDBY_COMPLETED_NO_ROLLBACK',
  rollback_execution_receipt_sha256:'NONE',incident_id:'NONE',
  witness_id:'independent-rollback-witness-764',
  key_id:env.ROSIE_ECONOMIC_PRODUCTION_ROLLBACK_READY_KEY_ID};
const signedStandby=await sign(standbyPayload,canonicalStandby764,16);
const standbyCheck=async(envelope=signedStandby,extra={})=>verifyStandby764({env,record,
  archive,execution,readback:{status:'SIGNED_STANDBY_READBACK',envelope},...extra});
const standby=await standbyCheck();
assert.equal(standby.signature_authenticated,true);assert.equal(standby.clean_claim,true);
assert.ok(receiptURL764(env,'standby',record,archive,execution).includes('execution_receipt_sha256='));
for(const delta of [{execution_receipt_sha256:'f'.repeat(64)},
  {standby_start:'2026-11-04T16:30:00Z'},
  {standby_end:'2026-11-04T16:40:00Z'},
  {standby_outcome:'ROLLBACK_EXECUTED'},
  {rollback_execution_receipt_sha256:'f'.repeat(64)}, {incident_id:'hidden-incident-764'}]){
  const signed=await sign({...standbyPayload,...delta},canonicalStandby764,16);
  assert.equal((await standbyCheck(signed)).status,'HOLD_STANDBY_SCOPE');
}
assert.equal((await standbyCheck(await sign(standbyPayload,canonicalStandby764,15))).status,
  'HOLD_STANDBY_SIGNATURE');

const reconciliationPayload={schema:'rosie-independent-postchange-reconciliation-v764',...record,
  trial_id:archive.trial_id,production_project_ref:archive.production_project_ref,
  gate_archive_receipt_sha256:archive.receipt_sha256,
  execution_receipt_sha256:execution.receipt_sha256,
  standby_receipt_sha256:standby.receipt_sha256,
  schema_before_sha256:execution.schema_before_sha256,
  schema_after_sha256:execution.schema_after_sha256,
  independent_change_log_sha256:'e'.repeat(64),storage_audit_sha256:'f'.repeat(64),
  outcome:'CONSISTENT_EXTERNAL_CLAIMS_PENDING_DB_AUDIT',
  reviewed_at:'2026-11-04T17:10:00Z',reviewer_id:'independent-postchange-auditor-764',
  key_id:env.ROSIE_ECONOMIC_PRODUCTION_OUTCOME_RECONCILER_KEY_ID};
const signedReconciliation=await sign(reconciliationPayload,canonicalReconciliation764,18);
const reconCheck=async(envelope=signedReconciliation,extra={})=>verifyReconciliation764({
  env,record,archive,execution,standby,readback:{status:'SIGNED_RECONCILIATION_READBACK',envelope},
  now,...extra});
const reconciliation=await reconCheck();
assert.equal(reconciliation.signature_authenticated,true);assert.equal(reconciliation.clean_claim,true);
for(const delta of [{standby_receipt_sha256:'a'.repeat(64)},
  {schema_after_sha256:'a'.repeat(64)},
  {storage_audit_sha256:'NONE'},
  {outcome:'CLOSED'},
  {reviewed_at:'2026-11-04T16:50:00Z'}]){
  const signed=await sign({...reconciliationPayload,...delta},canonicalReconciliation764,18);
  assert.equal((await reconCheck(signed)).status,'HOLD_RECONCILIATION_SCOPE');
}
assert.equal((await reconCheck(await sign(reconciliationPayload,canonicalReconciliation764,17))).status,
  'HOLD_RECONCILIATION_SIGNATURE');

const ownerPayload={schema:'rosie-owner-postchange-evidence-review-v764',...record,
  trial_id:archive.trial_id,production_project_ref:archive.production_project_ref,
  gate_archive_receipt_sha256:archive.receipt_sha256,
  execution_receipt_sha256:execution.receipt_sha256,
  standby_receipt_sha256:standby.receipt_sha256,
  reconciliation_receipt_sha256:reconciliation.receipt_sha256,
  decision:'ACKNOWLEDGE_EXTERNAL_CLAIMS_FOR_SEPARATE_DB_AUDIT',
  owner_id:'rosie-owner-postchange-764',issued_at:'2026-11-04T17:15:00Z',
  nonce:'a'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sign(ownerPayload,canonicalOwnerPostchange764,0);
const ownerCheck=async(envelope=signedOwner,extra={})=>verifyOwnerPostchange764({
  env,record,archive,execution,standby,reconciliation,envelope,now,...extra});
const owner=await ownerCheck();
assert.equal(owner.signature_authenticated,true);assert.equal(owner.clean_acknowledgement,true);
assert.equal(owner.closure_allowed,false);
for(const delta of [{execution_receipt_sha256:'f'.repeat(64)},
  {decision:'AUTHORIZE_CLOSURE'},{issued_at:'2026-11-04T17:00:00Z'},
  {nonce:'bad'}, {production_project_ref:'isolated-rosie'}]){
  const signed=await sign({...ownerPayload,...delta},canonicalOwnerPostchange764,0);
  assert.equal((await ownerCheck(signed)).status,'HOLD_OWNER_POSTCHANGE_SCOPE');
}
assert.equal((await ownerCheck(await sign(ownerPayload,canonicalOwnerPostchange764,1))).status,
  'HOLD_OWNER_POSTCHANGE_SIGNATURE');

const ready=await reconcilePostchange764({archive,execution,standby,reconciliation,owner,
  reviewed_at:'2026-11-04T19:00:00Z'});
assert.equal(ready.postchange_status,'READY_FOR_SEPARATE_DATABASE_AUDIT_AND_OWNER_CLOSURE_REVIEW');
assert.equal(ready.external_execution_claim_authenticated,true);
assert.deepEqual(ready.follow_ups.map(x=>x.code),[
  'SEPARATE_PRODUCTION_DATABASE_OBSERVATION','IMMUTABLE_OWNER_AUDIT_AND_BUSINESS_CLOSURE_HOLD']);
for(const field of ['production_db_state_independently_verified_by_app',
  'production_execution_authorized_by_app','production_migration_executed_by_app',
  'rollback_executed_by_app','production_credentials_read','customer_notifications_sent_by_app',
  'owner_closure_audit_persisted','closure_allowed','automatic_business_write'])
  assert.equal(ready[field],false,field);
assert.match(ready.packet_sha256,/^[a-f0-9]{64}$/);

// A failed external migration is still an authentic signed claim, but witness, reconciler
// and owner must all carry an exception HOLD. No closure or re-execution follows.
const failedExecutionPayload={...executionPayload,execution_result:'FAILED_EXTERNAL_EXCEPTION_HELD',
  schema_after_sha256:executionPayload.schema_before_sha256};
const failedExecution=await executionCheck(await sign(failedExecutionPayload,canonicalExecution764,15));
assert.equal(failedExecution.signature_authenticated,true);assert.equal(failedExecution.clean_claim,false);
const incidentStandbyPayload={...standbyPayload,execution_receipt_sha256:failedExecution.receipt_sha256,
  standby_outcome:'INCIDENT_OPEN_ROLLBACK_REVIEW',
  rollback_execution_receipt_sha256:'f'.repeat(64),incident_id:'rollback-incident-764'};
const failedStandby=await standbyCheck(await sign(incidentStandbyPayload,canonicalStandby764,16),
  {execution:failedExecution});
assert.equal(failedStandby.signature_authenticated,true);assert.equal(failedStandby.clean_claim,false);
const heldReconPayload={...reconciliationPayload,
  execution_receipt_sha256:failedExecution.receipt_sha256,
  standby_receipt_sha256:failedStandby.receipt_sha256,
  schema_after_sha256:failedExecution.schema_after_sha256,
  outcome:'EXCEPTION_HELD_EXTERNAL_OUTCOME'};
const heldRecon=await reconCheck(await sign(heldReconPayload,canonicalReconciliation764,18),
  {execution:failedExecution,standby:failedStandby});
assert.equal(heldRecon.signature_authenticated,true);assert.equal(heldRecon.clean_claim,false);
const heldOwnerPayload={...ownerPayload,execution_receipt_sha256:failedExecution.receipt_sha256,
  standby_receipt_sha256:failedStandby.receipt_sha256,
  reconciliation_receipt_sha256:heldRecon.receipt_sha256,
  decision:'HOLD_POSTCHANGE_EXCEPTION'};
const ownerHold=await ownerCheck(await sign(heldOwnerPayload,canonicalOwnerPostchange764,0),
  {execution:failedExecution,standby:failedStandby,reconciliation:heldRecon});
assert.equal(ownerHold.signature_authenticated,true);assert.equal(ownerHold.clean_acknowledgement,false);
const held=await reconcilePostchange764({archive,execution:failedExecution,
  standby:failedStandby,reconciliation:heldRecon,owner:ownerHold});
assert.equal(held.postchange_status,'HOLD_POSTCHANGE_EXTERNAL_EVIDENCE_RECONCILIATION');
assert.ok(held.follow_ups.some(x=>x.code==='ROLLBACK_INCIDENT_OPEN'));

const oldFetch=globalThis.fetch;let unauthorizedFetches=0;
globalThis.fetch=async()=>{unauthorizedFetches++;throw Error('Unexpected unauthenticated fetch');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const post=fn===onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_postchange_reconciliation_v764',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
        'Content-Type':'application/json'},
      ...(post?{body:JSON.stringify({...record,owner_postchange_decision:signedOwner})}:{})});
    const response=await fn({request,env});assert.ok(response.status>=400);
  }
  assert.equal(unauthorizedFetches,0);
}finally{globalThis.fetch=oldFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-postchange-v764','admin-economic-authorization-v763','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`route mirror ${stem}`);
assert.match(read('admin-catalog.html'),/admin-economic-postchange-v764\.html/);
assert.match(read('admin-economic-authorization-v763.html'),/admin-economic-postchange-v764\.html/);
assert.match(read('assets/economic-production-outcome-v764.js'),/credentials:'same-origin'/);
assert.match(read('docs/build764_external_execution_standby_postchange_review.md'),/read-only/i);
console.log('Build 764 PASS: historical 19-signer gate, external execution and rollback standby outcomes, owner HOLD, exact hashes/time, private API, no database action or closure.');
