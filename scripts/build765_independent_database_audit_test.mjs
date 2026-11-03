import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {env,keys,record,now,sign,archive,execution,standby,reconciliation,
  owner,signedOwner as signedPostchangeOwner} from './build764_external_postchange_receipt_test.mjs';
import {DB_FIELDS765,AUDIT_FIELDS765,OWNER_FIELDS765,canonicalDB765,
  canonicalAudit765,canonicalOwner765,receiptURL765,readReceipt765,
  verifyDB765,verifyAudit765,verifyOwner765,reconcileClosure765}
  from '../functions/api/_lib/economic-database-closure-v765.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_database_closure_v765.js';

globalThis.crypto??=webcrypto;
const b64=bytes=>Buffer.from(bytes).toString('base64');
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
for(const [index,prefix,url] of [
  [19,'PRODUCTION_DB_STATE_INSPECTOR','https://prod-db-inspector.example'],
  [20,'IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR','https://immutable-audit-inspector.example']
]){
  keys.push(await crypto.subtle.generateKey('Ed25519',true,['sign','verify']));
  env[`ROSIE_ECONOMIC_${prefix}_PUBLIC_KEY_B64`]=b64(await crypto.subtle.exportKey('raw',keys[index].publicKey));
  env[`ROSIE_ECONOMIC_${prefix}_KEY_ID`]=`distinct-v765-signer-role-${index}`;
  env[`ROSIE_ECONOMIC_${prefix}_BASE_URL`]=url;
}
assert.equal(keys.length,21);
assert.equal(DB_FIELDS765.length,24);assert.equal(AUDIT_FIELDS765.length,23);
assert.equal(OWNER_FIELDS765.length,15);
const ctx={env,record,archive,execution,standby,reconciliation,owner};
const dbPayload={schema:'rosie-independent-production-db-state-v765',...record,
  trial_id:archive.trial_id,production_project_ref:archive.production_project_ref,
  gate_archive_receipt_sha256:archive.receipt_sha256,
  execution_receipt_sha256:execution.receipt_sha256,
  standby_receipt_sha256:standby.receipt_sha256,
  reconciliation_receipt_sha256:reconciliation.receipt_sha256,
  owner_postchange_receipt_sha256:owner.receipt_sha256,
  migration_artifact_sha256:archive.migration_artifact_sha256,
  migration_version:execution.migration_version,
  schema_after_sha256:execution.schema_after_sha256,
  observed_schema_sha256:execution.schema_after_sha256,
  migration_history_sha256:'1'.repeat(64),db_identity_sha256:'2'.repeat(64),
  read_only_inspection_transcript_sha256:'3'.repeat(64),
  observed_at:'2026-11-04T17:25:00Z',
  inspection_method:'EXTERNAL_DIRECT_READ_ONLY_PG_CATALOG_AND_MIGRATION_HISTORY',
  state_result:'MATCHED_DIRECT_READ_ONLY_INSPECTION',
  inspector_id:'independent-readonly-dba-inspector-765',
  key_id:env.ROSIE_ECONOMIC_PRODUCTION_DB_STATE_INSPECTOR_KEY_ID};
const signedDB=await sign(dbPayload,canonicalDB765,19);
const dbCheck=async(envelope=signedDB,extra={})=>verifyDB765({...ctx,
  readback:{status:'SIGNED_DB_READBACK',envelope},now,...extra});
const db=await dbCheck();
assert.equal(db.signature_authenticated,true);assert.equal(db.clean_claim,true);
assert.equal(db.production_db_state_verified_by_app,false);
assert.match(db.receipt_sha256,/^[a-f0-9]{64}$/);
const dbURL=receiptURL765(env,'db',record,archive,execution,standby,reconciliation,owner);
assert.ok(dbURL.startsWith('https://prod-db-inspector.example/v1/economic-production-db-state-v765'));
assert.ok(dbURL.includes('owner_postchange_receipt_sha256='));
assert.equal((await readReceipt765(env,'db',record,archive,execution,standby,reconciliation,
  owner,null,async()=>new Response(JSON.stringify(signedDB)))).status,'SIGNED_DB_READBACK');
for(const delta of [
  {production_project_ref:'wrong-project'},
  {execution_receipt_sha256:'f'.repeat(64)},
  {migration_version:'wrong-migration-version'},
  {observed_schema_sha256:'e'.repeat(64)},
  {inspection_method:'WEBSITE_QUERY'},
  {observed_at:'2026-11-01T14:00:00Z'},
  {migration_history_sha256:'NONE'},
  {state_result:'CLOSED'}
]){
  const signed=await sign({...dbPayload,...delta},canonicalDB765,19);
  assert.equal((await dbCheck(signed)).status,'HOLD_DB_SCOPE');
}
assert.equal((await dbCheck(await sign(dbPayload,canonicalDB765,20))).status,'HOLD_DB_SIGNATURE');
assert.throws(()=>canonicalDB765({...dbPayload,extra:'unexpected'}),/Noncanonical/);
assert.equal((await dbCheck(signedDB,{env:{...env,
  ROSIE_ECONOMIC_PRODUCTION_DB_STATE_INSPECTOR_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_PRODUCTION_OUTCOME_RECONCILER_PUBLIC_KEY_B64}})).status,
  'HOLD_DB_SIGNER_INDEPENDENCE');
assert.equal((await dbCheck(signedDB,{env:{...env,
  ROSIE_ECONOMIC_PRODUCTION_DB_STATE_INSPECTOR_BASE_URL:
    env.ROSIE_ECONOMIC_PRODUCTION_OUTCOME_RECONCILER_BASE_URL}})).status,
  'HOLD_DB_ORIGIN_INDEPENDENCE');
assert.equal((await dbCheck(signedDB,{env:{...env,
  ROSIE_ECONOMIC_PRODUCTION_DB_STATE_INSPECTOR_BASE_URL:'https://127.0.0.1'}})).status,
  'HOLD_DB_ORIGIN_INDEPENDENCE');
assert.equal((await dbCheck(signedDB,{execution:{...execution,clean_claim:false}})).status,
  'HOLD_DB_SCOPE');

const auditPayload={schema:'rosie-independent-immutable-audit-enforcement-v765',...record,
  trial_id:archive.trial_id,production_project_ref:archive.production_project_ref,
  db_inspection_receipt_sha256:db.receipt_sha256,
  reconciliation_receipt_sha256:reconciliation.receipt_sha256,
  prior_storage_audit_sha256:reconciliation.storage_audit_sha256,
  owner_postchange_receipt_sha256:owner.receipt_sha256,
  audit_table_definition_sha256:'4'.repeat(64),
  append_only_insert_probe_sha256:'5'.repeat(64),
  update_denial_probe_sha256:'6'.repeat(64),delete_denial_probe_sha256:'7'.repeat(64),
  privilege_review_sha256:'8'.repeat(64),rls_review_sha256:'9'.repeat(64),
  retention_policy_sha256:'a'.repeat(64),independent_log_chain_sha256:'b'.repeat(64),
  observed_at:'2026-11-04T17:35:00Z',
  enforcement_result:'ALL_APPEND_ONLY_CONTROLS_OBSERVED_EXTERNAL',
  auditor_id:'independent-storage-audit-witness-765',
  key_id:env.ROSIE_ECONOMIC_IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR_KEY_ID};
const signedAudit=await sign(auditPayload,canonicalAudit765,20);
const auditCheck=async(envelope=signedAudit,extra={})=>verifyAudit765({...ctx,db,
  readback:{status:'SIGNED_AUDIT_READBACK',envelope},now,...extra});
const audit=await auditCheck();
assert.equal(audit.signature_authenticated,true);assert.equal(audit.clean_claim,true);
assert.equal(audit.immutable_storage_proven_by_app,false);
assert.ok(receiptURL765(env,'audit',record,archive,execution,standby,reconciliation,owner,db)
  .includes('db_inspection_receipt_sha256='));
for(const delta of [
  {db_inspection_receipt_sha256:'e'.repeat(64)},
  {prior_storage_audit_sha256:'e'.repeat(64)},
  {update_denial_probe_sha256:'NONE'},
  {production_project_ref:'other-production'},
  {enforcement_result:'IMMUTABLE_VERIFIED_BY_SITE'},
  {observed_at:'2026-11-04T17:20:00Z'}
]){
  const signed=await sign({...auditPayload,...delta},canonicalAudit765,20);
  assert.equal((await auditCheck(signed)).status,'HOLD_AUDIT_SCOPE');
}
assert.equal((await auditCheck(await sign(auditPayload,canonicalAudit765,19))).status,
  'HOLD_AUDIT_SIGNATURE');
assert.equal((await auditCheck(signedAudit,{env:{...env,
  ROSIE_ECONOMIC_IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR_KEY_ID:
    env.ROSIE_ECONOMIC_PRODUCTION_DB_STATE_INSPECTOR_KEY_ID}})).status,
  'HOLD_AUDIT_SIGNER_INDEPENDENCE');
assert.equal((await auditCheck(signedAudit,{env:{...env,
  ROSIE_ECONOMIC_IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR_BASE_URL:
    env.ROSIE_ECONOMIC_PRODUCTION_DB_STATE_INSPECTOR_BASE_URL}})).status,
  'HOLD_AUDIT_ORIGIN_INDEPENDENCE');
assert.equal(receiptURL765(env,'audit',record,archive,execution,standby,reconciliation,
  owner,{signature_authenticated:false}),null);

const ownerPayload={schema:'rosie-owner-closure-readiness-v765',...record,
  trial_id:archive.trial_id,production_project_ref:archive.production_project_ref,
  owner_postchange_receipt_sha256:owner.receipt_sha256,
  db_inspection_receipt_sha256:db.receipt_sha256,
  audit_inspection_receipt_sha256:audit.receipt_sha256,
  decision:'ACKNOWLEDGE_FOR_SEPARATE_OWNER_CLOSURE_AUTHORIZATION',
  owner_id:'rosie-owner-closure-readiness-765',issued_at:'2026-11-04T17:40:00Z',
  nonce:'c'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sign(ownerPayload,canonicalOwner765,0);
const ownerCheck=async(envelope=signedOwner,extra={})=>verifyOwner765({env,record,archive,
  owner,db,audit,envelope,now,...extra});
const closureOwner=await ownerCheck();
assert.equal(closureOwner.signature_authenticated,true);
assert.equal(closureOwner.clean_acknowledgement,true);
assert.equal(closureOwner.closure_allowed,false);
for(const delta of [{owner_postchange_receipt_sha256:'e'.repeat(64)},
  {audit_inspection_receipt_sha256:'f'.repeat(64)},
  {decision:'AUTHORIZE_CLOSURE_NOW'},
  {issued_at:'2026-11-04T17:30:00Z'},{nonce:'bad'}]){
  const signed=await sign({...ownerPayload,...delta},canonicalOwner765,0);
  assert.equal((await ownerCheck(signed)).status,'HOLD_OWNER_CLOSURE_SCOPE');
}
assert.equal((await ownerCheck(await sign(ownerPayload,canonicalOwner765,1))).status,
  'HOLD_OWNER_CLOSURE_SIGNATURE');
const ready=await reconcileClosure765({archive,execution,standby,reconciliation,
  postchangeOwner:owner,db,audit,owner:closureOwner});
assert.equal(ready.closure_readiness_status,'READY_FOR_SEPARATE_OWNER_CLOSURE_AUTHORIZATION');
assert.deepEqual(ready.follow_ups.map(x=>x.code),['SEPARATE_BUSINESS_CLOSURE_CHANGE_CONTROL']);
for(const field of ['direct_production_database_connection','production_db_state_verified_by_app',
  'immutable_enforcement_proven_by_app','production_sql_executed_by_app',
  'owner_closure_audit_persisted','customer_notifications_sent_by_app','closure_allowed',
  'automatic_business_write'])assert.equal(ready[field],false,field);
assert.match(ready.packet_sha256,/^[a-f0-9]{64}$/);
const missing=await reconcileClosure765({archive,execution,standby,reconciliation,
  postchangeOwner:owner});
assert.equal(missing.closure_readiness_status,'HOLD_INDEPENDENT_DATABASE_AUDIT_OR_OWNER_EVIDENCE');
assert.ok(missing.follow_ups.some(x=>x.code==='DIRECT_DATABASE_INSPECTION_UNVERIFIED'));

const mismatchPayload={...dbPayload,observed_schema_sha256:'d'.repeat(64),
  state_result:'MISMATCH_EXCEPTION_HELD'};
const mismatchDB=await dbCheck(await sign(mismatchPayload,canonicalDB765,19));
assert.equal(mismatchDB.signature_authenticated,true);assert.equal(mismatchDB.clean_claim,false);
const mismatchedAuditPayload={...auditPayload,db_inspection_receipt_sha256:mismatchDB.receipt_sha256,
  enforcement_result:'ENFORCEMENT_EXCEPTION_HELD'};
const mismatchAudit=await auditCheck(await sign(mismatchedAuditPayload,canonicalAudit765,20),
  {db:mismatchDB});
assert.equal(mismatchAudit.signature_authenticated,true);assert.equal(mismatchAudit.clean_claim,false);
const ownerHoldPayload={...ownerPayload,db_inspection_receipt_sha256:mismatchDB.receipt_sha256,
  audit_inspection_receipt_sha256:mismatchAudit.receipt_sha256,decision:'HOLD_CLOSURE_EXCEPTION'};
const ownerHold=await ownerCheck(await sign(ownerHoldPayload,canonicalOwner765,0),
  {db:mismatchDB,audit:mismatchAudit});
assert.equal(ownerHold.signature_authenticated,true);assert.equal(ownerHold.clean_acknowledgement,false);
const held=await reconcileClosure765({archive,execution,standby,reconciliation,
  postchangeOwner:owner,db:mismatchDB,audit:mismatchAudit,owner:ownerHold});
assert.equal(held.closure_readiness_status,'HOLD_INDEPENDENT_DATABASE_AUDIT_OR_OWNER_EVIDENCE');
assert.ok(held.follow_ups.some(x=>x.code==='IMMUTABLE_ENFORCEMENT_EXCEPTION'));

// Owner-session checks must prevent even one external network request without a session.
const oldFetch=globalThis.fetch;let calls=0;
globalThis.fetch=async()=>{calls++;throw Error('Unauthenticated external fetch');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const post=fn===onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_database_closure_v765',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
        'Content-Type':'application/json'},
      ...(post?{body:JSON.stringify({...record,owner_postchange_decision:signedPostchangeOwner,
        owner_closure_readiness_decision:signedOwner})}:{})});
    const response=await fn({request,env});assert.ok(response.status>=400);
  }
  assert.equal(calls,0);
}finally{globalThis.fetch=oldFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-database-v765','admin-economic-postchange-v764','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`mirror ${stem}`);
assert.match(read('admin-catalog.html'),/admin-economic-database-v765\.html/);
assert.match(read('admin-economic-postchange-v764.html'),/admin-economic-database-v765\.html/);
assert.match(read('assets/economic-database-closure-v765.js'),/credentials:'same-origin'/);
assert.match(read('docs/build765_independent_database_immutable_enforcement_owner_closure.md'),/read-only/i);
console.log('Build 765 PASS: 21 independent signer roles, 12 fixed source origins, exact DB and audit hashes, owner HOLD, no database mutation or closure.');
export {db,audit,closureOwner,signedDB,signedAudit,signedOwner,signedPostchangeOwner};
