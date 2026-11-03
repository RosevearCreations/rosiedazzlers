import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {env,keys,record,now,sign,archive,execution,standby,reconciliation,owner,
  signedArchive,signedExecution,signedStandby,signedReconciliation}
  from './build764_external_postchange_receipt_test.mjs';
import {db,audit,closureOwner,signedDB,signedAudit,signedOwner as signedReadinessOwner,
  signedPostchangeOwner} from './build765_independent_database_audit_test.mjs';
import {reconcileClosure765} from '../functions/api/_lib/economic-database-closure-v765.js';
import {reviewSignedClosureReadiness765} from '../functions/api/admin/economic_database_closure_v765.js';
import {OWNER_AUTH_FIELDS766,LEDGER_FIELDS766,DISPOSITION_FIELDS766,canonicalOwner766,
  canonicalLedger766,canonicalDisposition766,verifyOwnerAuthorization766,
  verifyLedger766,verifyDisposition766,receiptURL766,readReceipt766,reconcileFinal766}
  from '../functions/api/_lib/economic-final-disposition-v766.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_final_disposition_v766.js';

globalThis.crypto??=webcrypto;
const b64=bytes=>Buffer.from(bytes).toString('base64');
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
for(const [index,prefix,origin] of [
  [21,'CLOSURE_DECISION_CUSTODIAN','https://final-decision-custodian.example'],
  [22,'FINAL_EXCEPTION_DISPOSITION_REVIEWER','https://final-disposition-review.example']
]){
  keys.push(await crypto.subtle.generateKey('Ed25519',true,['sign','verify']));
  env[`ROSIE_ECONOMIC_${prefix}_PUBLIC_KEY_B64`]=b64(await crypto.subtle.exportKey('raw',keys[index].publicKey));
  env[`ROSIE_ECONOMIC_${prefix}_KEY_ID`]=`distinct-v766-signer-role-${index}`;
  env[`ROSIE_ECONOMIC_${prefix}_BASE_URL`]=origin;
}
assert.equal(keys.length,23);
assert.equal(OWNER_AUTH_FIELDS766.length,17);
assert.equal(LEDGER_FIELDS766.length,21);
assert.equal(DISPOSITION_FIELDS766.length,19);
const prior={archive,execution,standby,reconciliation,postchangeOwner:owner,
  db,audit,owner:closureOwner,summary:await reconcileClosure765({
    archive,execution,standby,reconciliation,postchangeOwner:owner,db,audit,
    owner:closureOwner})};
assert.equal(prior.summary.closure_readiness_status,
  'READY_FOR_SEPARATE_OWNER_CLOSURE_AUTHORIZATION');
const ownerPayload={schema:'rosie-owner-independent-closure-authorization-v766',...record,
  trial_id:archive.trial_id,production_project_ref:archive.production_project_ref,
  owner_postchange_receipt_sha256:owner.receipt_sha256,
  db_inspection_receipt_sha256:db.receipt_sha256,
  audit_inspection_receipt_sha256:audit.receipt_sha256,
  owner_readiness_receipt_sha256:closureOwner.receipt_sha256,
  decision:'AUTHORIZE_EXTERNAL_MANUAL_CLOSURE_REVIEW_ONLY',
  authorization_ticket_id:'new-explicit-closure-ticket-766',
  owner_id:'original-owner-explicit-766',issued_at:'2026-11-04T17:43:00Z',
  nonce:'d'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedAuthorization=await sign(ownerPayload,canonicalOwner766,0);
const ownerCheck=async(envelope=signedAuthorization,extra={})=>
  verifyOwnerAuthorization766({env,record,prior,envelope,now,...extra});
const ownerAuth=await ownerCheck();
assert.equal(ownerAuth.signature_authenticated,true);
assert.equal(ownerAuth.authorizes_external_manual_review_only,true);
assert.equal(ownerAuth.closure_executed_by_app,false);
assert.match(ownerAuth.receipt_sha256,/^[a-f0-9]{64}$/);
for(const delta of [
  {production_project_ref:'other-production'},
  {owner_readiness_receipt_sha256:'e'.repeat(64)},
  {audit_inspection_receipt_sha256:'e'.repeat(64)},
  {authorization_ticket_id:'x'},
  {decision:'EXECUTE_CLOSURE_NOW'},
  {issued_at:'2026-11-04T17:25:00Z'},
  {nonce:'not-a-valid-nonce'},
  {change_ticket_id:'unrelated-ticket'}
]){
  const signed=await sign({...ownerPayload,...delta},canonicalOwner766,0);
  assert.equal((await ownerCheck(signed)).status,'HOLD_OWNER_AUTH_SCOPE');
}
assert.equal((await ownerCheck(await sign(ownerPayload,canonicalOwner766,1))).status,
  'HOLD_OWNER_AUTH_SIGNATURE');
assert.throws(()=>canonicalOwner766({...ownerPayload,unexpected:'bad'}),/Noncanonical/);
assert.equal((await ownerCheck(signedAuthorization,{prior:{...prior,
  summary:{...prior.summary,closure_readiness_status:'HOLD'}}})).status,
  'HOLD_OWNER_AUTH_SCOPE');
assert.equal((await ownerCheck(signedAuthorization,{env:{...env,
  ROSIE_ECONOMIC_CLOSURE_DECISION_CUSTODIAN_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_OWNER_AUTH_SIGNER_INDEPENDENCE');
assert.equal((await ownerCheck(signedAuthorization,{env:{...env,
  ROSIE_ECONOMIC_FINAL_EXCEPTION_DISPOSITION_REVIEWER_BASE_URL:
    env.ROSIE_ECONOMIC_CLOSURE_DECISION_CUSTODIAN_BASE_URL}})).status,
  'HOLD_OWNER_AUTH_ORIGIN_INDEPENDENCE');
assert.equal((await ownerCheck(signedAuthorization,{env:{...env,
  ROSIE_ECONOMIC_FINAL_EXCEPTION_DISPOSITION_REVIEWER_BASE_URL:'http://127.0.0.1'}})).status,
  'HOLD_OWNER_AUTH_ORIGIN_INDEPENDENCE');

const ledgerPayload={schema:'rosie-external-append-only-closure-decision-v766',...record,
  trial_id:archive.trial_id,production_project_ref:archive.production_project_ref,
  owner_authorization_receipt_sha256:ownerAuth.receipt_sha256,
  owner_readiness_receipt_sha256:closureOwner.receipt_sha256,
  audit_inspection_receipt_sha256:audit.receipt_sha256,
  independent_log_chain_sha256:audit.independent_log_chain_sha256,
  ledger_entry_id:'external-owner-decision-766',ledger_previous_sha256:'1'.repeat(64),
  ledger_entry_sha256:'2'.repeat(64),storage_enforcement_proof_sha256:'3'.repeat(64),
  retention_policy_sha256:audit.retention_policy_sha256,
  stored_decision:ownerAuth.decision,custody_result:'APPEND_ONLY_DECISION_RECORDED_EXTERNAL',
  recorded_at:'2026-11-04T17:49:00Z',custodian_id:'outside-app-record-custodian-766',
  key_id:env.ROSIE_ECONOMIC_CLOSURE_DECISION_CUSTODIAN_KEY_ID};
const signedLedger=await sign(ledgerPayload,canonicalLedger766,21);
const ledgerCheck=async(envelope=signedLedger,extra={})=>verifyLedger766({env,record,
  prior,owner:ownerAuth,readback:{status:'SIGNED_LEDGER_READBACK',envelope},now,...extra});
const ledger=await ledgerCheck();
assert.equal(ledger.signature_authenticated,true);assert.equal(ledger.clean_claim,true);
assert.equal(ledger.immutable_storage_proven_by_app,false);
const ledgerURL=receiptURL766(env,'ledger',record,prior,ownerAuth);
assert.ok(ledgerURL.startsWith('https://final-decision-custodian.example/v1/economic-closure-ledger-decision-v766'));
assert.ok(ledgerURL.includes('owner_authorization_receipt_sha256='));
assert.equal((await readReceipt766(env,'ledger',record,prior,ownerAuth,null,
  async()=>new Response(JSON.stringify(signedLedger)))).status,'SIGNED_LEDGER_READBACK');
for(const delta of [
  {owner_authorization_receipt_sha256:'e'.repeat(64)},
  {stored_decision:'AUTHORIZE_CLOSURE_NOW'},
  {independent_log_chain_sha256:'f'.repeat(64)},
  {retention_policy_sha256:'f'.repeat(64)},
  {ledger_previous_sha256:'NONE'},
  {recorded_at:'2026-11-04T17:20:00Z'},
  {custody_result:'LEDGER_IMMUTABLE_PROVEN_BY_SITE'}
]){
  const signed=await sign({...ledgerPayload,...delta},canonicalLedger766,21);
  assert.equal((await ledgerCheck(signed)).status,'HOLD_LEDGER_SCOPE');
}
assert.equal((await ledgerCheck(await sign(ledgerPayload,canonicalLedger766,22))).status,
  'HOLD_LEDGER_SIGNATURE');
assert.equal((await ledgerCheck(signedLedger,{env:{...env,
  ROSIE_ECONOMIC_CLOSURE_DECISION_CUSTODIAN_KEY_ID:
    env.ROSIE_ECONOMIC_PRODUCTION_DB_STATE_INSPECTOR_KEY_ID}})).status,
  'HOLD_LEDGER_SIGNER_INDEPENDENCE');

const dispositionPayload={schema:'rosie-independent-final-exception-disposition-v766',...record,
  trial_id:archive.trial_id,production_project_ref:archive.production_project_ref,
  owner_authorization_receipt_sha256:ownerAuth.receipt_sha256,
  ledger_decision_receipt_sha256:ledger.receipt_sha256,
  db_inspection_receipt_sha256:db.receipt_sha256,
  audit_inspection_receipt_sha256:audit.receipt_sha256,
  incident_register_sha256:'4'.repeat(64),exception_register_sha256:'5'.repeat(64),
  unresolved_critical_count:'0',exception_state:'NO_OPEN_EXCEPTION_CLAIM',
  disposition:'AUTHORIZED_FOR_SEPARATE_MANUAL_CLOSURE_HANDOFF',
  reviewed_at:'2026-11-04T18:00:00Z',reviewer_id:'independent-incident-reviewer-766',
  key_id:env.ROSIE_ECONOMIC_FINAL_EXCEPTION_DISPOSITION_REVIEWER_KEY_ID};
const signedDisposition=await sign(dispositionPayload,canonicalDisposition766,22);
const dispositionCheck=async(envelope=signedDisposition,extra={})=>
  verifyDisposition766({env,record,prior,owner:ownerAuth,ledger,
    readback:{status:'SIGNED_DISPOSITION_READBACK',envelope},now,...extra});
const disposition=await dispositionCheck();
assert.equal(disposition.signature_authenticated,true);assert.equal(disposition.clean_claim,true);
assert.ok(receiptURL766(env,'disposition',record,prior,ownerAuth,ledger)
  .includes('ledger_decision_receipt_sha256='));
for(const delta of [
  {ledger_decision_receipt_sha256:'f'.repeat(64)},
  {db_inspection_receipt_sha256:'f'.repeat(64)},
  {unresolved_critical_count:'1'},
  {exception_state:'EXCEPTIONS_OPEN_HOLD'},
  {disposition:'CLOSE_CASE_NOW'},
  {reviewed_at:'2026-11-04T17:40:00Z'}
]){
  const signed=await sign({...dispositionPayload,...delta},canonicalDisposition766,22);
  assert.equal((await dispositionCheck(signed)).status,'HOLD_DISPOSITION_SCOPE');
}
assert.equal((await dispositionCheck(await sign(dispositionPayload,canonicalDisposition766,21))).status,
  'HOLD_DISPOSITION_SIGNATURE');
assert.equal(receiptURL766(env,'disposition',record,prior,ownerAuth,
  {signature_authenticated:false}),null);
const ready=await reconcileFinal766({prior,owner:ownerAuth,ledger,disposition});
assert.equal(ready.final_disposition_status,
  'READY_FOR_SEPARATE_CONTROLLED_EXTERNAL_CLOSURE_HANDOFF');
assert.deepEqual(ready.follow_ups.map(x=>x.code),['EXTERNAL_MANUAL_CLOSURE_AND_PROOF_REQUIRED']);
for(const key of ['external_closure_executed_or_verified_by_app',
  'immutable_ledger_verified_by_app','production_db_connected_by_app',
  'owner_closure_audit_persisted_by_app','customer_notifications_sent_by_app',
  'closure_allowed','automatic_business_write'])assert.equal(ready[key],false,key);
assert.match(ready.packet_sha256,/^[a-f0-9]{64}$/);
const missing=await reconcileFinal766({prior});
assert.equal(missing.final_disposition_status,'HOLD_FINAL_OWNER_AUTHORIZATION_CUSTODY_OR_DISPOSITION');
assert.ok(missing.follow_ups.some(x=>x.code==='APPEND_ONLY_DECISION_RECEIPT_UNVERIFIED'));

// A valid owner HOLD must remain HOLD even if separately retained in the ledger.
const signedOwnerHold=await sign({...ownerPayload,decision:'HOLD_FINAL_CLOSURE_EXCEPTION'},canonicalOwner766,0);
const ownerHold=await ownerCheck(signedOwnerHold);
assert.equal(ownerHold.signature_authenticated,true);
assert.equal(ownerHold.authorizes_external_manual_review_only,false);
const ownerHoldLedgerPayload={...ledgerPayload,
  owner_authorization_receipt_sha256:ownerHold.receipt_sha256,
  stored_decision:ownerHold.decision};
const ownerHoldLedger=await ledgerCheck(await sign(ownerHoldLedgerPayload,canonicalLedger766,21),
  {owner:ownerHold});
assert.equal(ownerHoldLedger.signature_authenticated,true);
const heldReviewPayload={...dispositionPayload,
  owner_authorization_receipt_sha256:ownerHold.receipt_sha256,
  ledger_decision_receipt_sha256:ownerHoldLedger.receipt_sha256,
  unresolved_critical_count:'1',exception_state:'EXCEPTIONS_OPEN_HOLD',
  disposition:'FINAL_EXCEPTION_HOLD'};
const heldReview=await dispositionCheck(await sign(heldReviewPayload,canonicalDisposition766,22),
  {owner:ownerHold,ledger:ownerHoldLedger});
assert.equal(heldReview.signature_authenticated,true);assert.equal(heldReview.clean_claim,false);
const held=await reconcileFinal766({prior,owner:ownerHold,ledger:ownerHoldLedger,
  disposition:heldReview});
assert.equal(held.final_disposition_status,'HOLD_FINAL_OWNER_AUTHORIZATION_CUSTODY_OR_DISPOSITION');
assert.ok(held.follow_ups.some(x=>x.code==='OWNER_FINAL_HOLD'));
const storageHold=await ledgerCheck(await sign({...ledgerPayload,
  custody_result:'STORAGE_EXCEPTION_HOLD'},canonicalLedger766,21));
assert.equal(storageHold.signature_authenticated,true);assert.equal(storageHold.clean_claim,false);
assert.equal((await dispositionCheck(signedDisposition,{ledger:storageHold})).status,
  'HOLD_DISPOSITION_SCOPE');

// Exercise the full Build 764/765 chain from the fixed external source origins.
const lookup={
  '/v1/economic-execution-gate-archive-v764':signedArchive,
  '/v1/economic-production-execution-receipt-v764':signedExecution,
  '/v1/economic-production-rollback-standby-v764':signedStandby,
  '/v1/economic-postchange-outcome-reconciliation-v764':signedReconciliation,
  '/v1/economic-production-db-state-v765':signedDB,
  '/v1/economic-immutable-audit-enforcement-v765':signedAudit
};
const oldFetch=globalThis.fetch;let sourceCalls=0;
globalThis.fetch=async url=>{
  const item=lookup[new URL(url).pathname];sourceCalls++;
  if(!item)throw Error(`Unexpected provider source ${url}`);
  return new Response(JSON.stringify(item),{status:200});
};
try{
  const fresh=await reviewSignedClosureReadiness765({env,record,
    owner_postchange_decision:signedPostchangeOwner,
    owner_closure_readiness_decision:signedReadinessOwner,now});
  assert.equal(fresh.summary.closure_readiness_status,
    'READY_FOR_SEPARATE_OWNER_CLOSURE_AUTHORIZATION');
  assert.equal(fresh.db.receipt_sha256,db.receipt_sha256);
  assert.equal(sourceCalls,6);
}finally{globalThis.fetch=oldFetch;}

// The API must not access external sources without an authenticated owner session.
let unauthorizedCalls=0;globalThis.fetch=async()=>{unauthorizedCalls++;throw Error('Unauthenticated provider request');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const post=fn===onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_final_disposition_v766',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
        'Content-Type':'application/json'},
      ...(post?{body:JSON.stringify({...record,
        owner_postchange_decision:signedPostchangeOwner,
        owner_closure_readiness_decision:signedReadinessOwner,
        owner_explicit_closure_authorization:signedAuthorization})}:{})});
    const response=await fn({request,env});assert.ok(response.status>=400);
  }
  assert.equal(unauthorizedCalls,0);
}finally{globalThis.fetch=oldFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-final-v766','admin-economic-database-v765','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`route mirror ${stem}`);
assert.match(read('admin-catalog.html'),/admin-economic-final-v766\.html/);
assert.match(read('admin-economic-database-v765.html'),/admin-economic-final-v766\.html/);
assert.match(read('assets/economic-final-disposition-v766.js'),/credentials:'same-origin'/);
assert.match(read('docs/build766_owner_append_only_final_exception_gate.md'),/read-only/i);
console.log('Build 766 PASS: 23 unique signer roles, 14 fixed origins, signed owner HOLD, append-only custody and zero-critical exception gate, full prior-chain readback, no closure.');
