import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {OWNER_FIELDS768,CUSTODY_FIELDS768,REOPEN_FIELDS768,
  canonicalOwner768,canonicalCustody768,canonicalReopen768,
  verifyOwner768,verifyCustody768,verifyReopen768,receiptURL768,readReceipt768,reconcile768}
  from '../functions/api/_lib/economic-owner-acceptance-v768.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_owner_acceptance_v768.js';

globalThis.crypto??=webcrypto;
const b64=b=>Buffer.from(b).toString('base64');
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const now=Date.parse('2026-11-04T21:00:00Z');
const record={booking_id:'12345678-1234-1234-1234-123456789abc',
  source_record_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',
  change_ticket_id:'production-change-768',execution_request_id:'external-request-768'};
const keyRoles=[
  'OWNER_RECEIPT','SOURCE_WITNESS','HISTORY_CUSTODIAN','RETENTION_PROVIDER',
  'STORAGE_AUDITOR','DBA_REVIEW','SECURITY_REVIEW','ISOLATION_AUDITOR',
  'ROLLBACK_WITNESS','TRIAL_OPERATOR','TRIAL_RECONCILER','ROLLBACK_EXCEPTION',
  'CHANGE_CONTROL','PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH',
  'PRODUCTION_OPERATOR_GATE','PRODUCTION_ROLLBACK_READY',
  'PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR',
  'CLOSURE_DECISION_CUSTODIAN','FINAL_EXCEPTION_DISPOSITION_REVIEWER',
  'EXTERNAL_CLOSURE_OPERATOR_WITNESS','INDEPENDENT_POST_CLOSURE_INSPECTOR',
  'ORIGINAL_SOURCE_CUSTODY_RECONCILER','EXCEPTION_REOPEN_REVIEWER'
];
const sourceRoles=[
  'TRIAL_OPERATOR','TRIAL_RECONCILE','ROLLBACK_EXCEPTION','CHANGE_CONTROL',
  'PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH','PRODUCTION_OPERATOR_GATE',
  'PRODUCTION_ROLLBACK_READY','PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR',
  'CLOSURE_DECISION_CUSTODIAN','FINAL_EXCEPTION_DISPOSITION_REVIEWER',
  'EXTERNAL_CLOSURE_OPERATOR_WITNESS','INDEPENDENT_POST_CLOSURE_INSPECTOR',
  'ORIGINAL_SOURCE_CUSTODY_RECONCILER','EXCEPTION_REOPEN_REVIEWER'
];
const env={},keys=[];
for(const [i,role] of keyRoles.entries()){
  const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);keys.push(pair);
  env[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`]=b64(await crypto.subtle.exportKey('raw',pair.publicKey));
  env[`ROSIE_ECONOMIC_${role}_KEY_ID`]=`unique-test-role-768-${i}`;
}
for(const [i,role] of sourceRoles.entries())
  env[`ROSIE_ECONOMIC_${role}_BASE_URL`]=`https://independent-source-${i}.example`;
async function sign(payload,canonical,index){return {payload,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',keys[index].privateKey,canonical(payload)))};}
assert.equal(keyRoles.length,27);assert.equal(sourceRoles.length,18);
assert.equal(OWNER_FIELDS768.length,17);assert.equal(CUSTODY_FIELDS768.length,21);
assert.equal(REOPEN_FIELDS768.length,17);
const prior={ok:true,post_closure_review_status:'READY_FOR_SEPARATE_OWNER_FINAL_ACCEPTANCE_REVIEW',
  independent_external_execution:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'1'.repeat(64),result_record_sha256:'2'.repeat(64)},
  independent_post_closure_inspection:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'3'.repeat(64),inspected_at:'2026-11-04T20:10:00Z'},
  verified_scope:{trial_id:'trial-confirmed-768',production_project_ref:'prod-confirmed-768',
    db_inspection_receipt_sha256:'4'.repeat(64),audit_inspection_receipt_sha256:'5'.repeat(64)},
  packet_sha256:'6'.repeat(64)};
const ownerPayload={schema:'rosie-owner-postclosure-acceptance-decision-v768',...record,
  trial_id:prior.verified_scope.trial_id,
  production_project_ref:prior.verified_scope.production_project_ref,
  external_execution_receipt_sha256:prior.independent_external_execution.receipt_sha256,
  postclosure_inspection_receipt_sha256:prior.independent_post_closure_inspection.receipt_sha256,
  original_db_inspection_sha256:prior.verified_scope.db_inspection_receipt_sha256,
  original_audit_inspection_sha256:prior.verified_scope.audit_inspection_receipt_sha256,
  decision:'ACCEPT_FOR_SEPARATE_MANUAL_OWNER_REVIEW_ONLY',
  owner_decision_ticket_id:'owner-independent-decision-768',
  owner_id:'original-owner-768',issued_at:'2026-11-04T20:15:00Z',
  nonce:'c'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sign(ownerPayload,canonicalOwner768,0);
const ownerCheck=async(envelope=signedOwner,extra={})=>verifyOwner768({env,record,prior,
  envelope,now,...extra});
const owner=await ownerCheck();
assert.equal(owner.signature_authenticated,true);assert.equal(owner.accepts_manual_review_only,true);
assert.equal(owner.owner_acceptance_recorded_by_app,false);
for(const delta of [
  {production_project_ref:'wrong-project'},
  {postclosure_inspection_receipt_sha256:'f'.repeat(64)},
  {original_audit_inspection_sha256:'f'.repeat(64)},
  {decision:'EXECUTE_DATABASE_CLOSURE_NOW'},
  {owner_decision_ticket_id:'x'},
  {issued_at:'2026-11-04T19:55:00Z'},
  {nonce:'not-a-nonce'}
])assert.equal((await ownerCheck(await sign({...ownerPayload,...delta},canonicalOwner768,0))).status,
  'HOLD_OWNER_ACCEPTANCE_SCOPE');
assert.equal((await ownerCheck(await sign(ownerPayload,canonicalOwner768,1))).status,
  'HOLD_OWNER_ACCEPTANCE_SIGNATURE');
assert.throws(()=>canonicalOwner768({...ownerPayload,extra:'x'}),/Noncanonical/);
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_ORIGINAL_SOURCE_CUSTODY_RECONCILER_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_OWNER_ACCEPTANCE_KEY_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_EXCEPTION_REOPEN_REVIEWER_BASE_URL:
    env.ROSIE_ECONOMIC_ORIGINAL_SOURCE_CUSTODY_RECONCILER_BASE_URL}})).status,
  'HOLD_OWNER_ACCEPTANCE_ORIGIN_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_EXCEPTION_REOPEN_REVIEWER_BASE_URL:'http://127.0.0.1'}})).status,
  'HOLD_OWNER_ACCEPTANCE_ORIGIN_INDEPENDENCE');

const custodyPayload={schema:'rosie-original-source-custody-reconciliation-v768',...record,
  trial_id:prior.verified_scope.trial_id,
  production_project_ref:prior.verified_scope.production_project_ref,
  owner_decision_receipt_sha256:owner.receipt_sha256,
  external_execution_receipt_sha256:prior.independent_external_execution.receipt_sha256,
  postclosure_inspection_receipt_sha256:prior.independent_post_closure_inspection.receipt_sha256,
  operator_result_record_sha256:prior.independent_external_execution.result_record_sha256,
  original_inspector_receipt_sha256:prior.independent_post_closure_inspection.receipt_sha256,
  original_database_receipt_sha256:prior.verified_scope.db_inspection_receipt_sha256,
  original_audit_receipt_sha256:prior.verified_scope.audit_inspection_receipt_sha256,
  custody_previous_sha256:'7'.repeat(64),custody_current_sha256:'8'.repeat(64),
  retention_policy_sha256:'9'.repeat(64),
  custody_result:'ORIGINAL_SOURCES_INDEPENDENTLY_RECONCILED_CLAIM',
  reconciled_at:'2026-11-04T20:25:00Z',custodian_id:'outside-source-custodian-768',
  key_id:env.ROSIE_ECONOMIC_ORIGINAL_SOURCE_CUSTODY_RECONCILER_KEY_ID};
const signedCustody=await sign(custodyPayload,canonicalCustody768,25);
const custodyCheck=async(envelope=signedCustody,extra={})=>verifyCustody768({env,record,
  prior,owner,readback:{status:'SIGNED_CUSTODY_READBACK',envelope},now,...extra});
const custody=await custodyCheck();
assert.equal(custody.signature_authenticated,true);assert.equal(custody.clean_claim,true);
assert.equal(custody.original_storage_verified_by_app,false);
assert.ok(receiptURL768(env,'custody',record,prior,owner).includes('owner_decision_receipt_sha256='));
assert.equal((await readReceipt768(env,'custody',record,prior,owner,null,
  async()=>new Response(JSON.stringify(signedCustody)))).status,'SIGNED_CUSTODY_READBACK');
for(const delta of [
  {owner_decision_receipt_sha256:'f'.repeat(64)},
  {operator_result_record_sha256:'f'.repeat(64)},
  {original_inspector_receipt_sha256:'f'.repeat(64)},
  {original_database_receipt_sha256:'f'.repeat(64)},
  {original_audit_receipt_sha256:'f'.repeat(64)},
  {custody_previous_sha256:'not-a-hash'},
  {custody_result:'SITE_IMMUTABILITY_PROVEN'},
  {reconciled_at:'2026-11-04T20:00:00Z'}
])assert.equal((await custodyCheck(await sign({...custodyPayload,...delta},
  canonicalCustody768,25))).status,'HOLD_CUSTODY_SCOPE');
assert.equal((await custodyCheck(await sign(custodyPayload,canonicalCustody768,26))).status,
  'HOLD_CUSTODY_SIGNATURE');

const reopenPayload={schema:'rosie-independent-exception-reopening-v768',...record,
  trial_id:prior.verified_scope.trial_id,
  production_project_ref:prior.verified_scope.production_project_ref,
  owner_decision_receipt_sha256:owner.receipt_sha256,
  original_custody_receipt_sha256:custody.receipt_sha256,
  current_exception_register_sha256:'a'.repeat(64),
  current_incident_register_sha256:'b'.repeat(64),
  reopen_case_id:'external-case-register-768',unresolved_critical_count:'0',
  reopen_result:'NO_NEW_EXCEPTION_CLAIM',reviewed_at:'2026-11-04T20:35:00Z',
  reviewer_id:'independent-reopen-reviewer-768',
  key_id:env.ROSIE_ECONOMIC_EXCEPTION_REOPEN_REVIEWER_KEY_ID};
const signedReopen=await sign(reopenPayload,canonicalReopen768,26);
const reopenCheck=async(envelope=signedReopen,extra={})=>verifyReopen768({env,record,
  prior,owner,custody,readback:{status:'SIGNED_REOPEN_READBACK',envelope},now,...extra});
const reopen=await reopenCheck();
assert.equal(reopen.signature_authenticated,true);assert.equal(reopen.clean_claim,true);
assert.equal(reopen.actual_exception_mutation_by_app,false);
assert.ok(receiptURL768(env,'reopen',record,prior,owner,custody)
  .includes('original_custody_receipt_sha256='));
assert.equal(receiptURL768(env,'reopen',record,prior,owner,{signature_authenticated:false}),null);
assert.equal((await readReceipt768(env,'reopen',record,prior,owner,custody,
  async()=>new Response(JSON.stringify(signedReopen)))).status,'SIGNED_REOPEN_READBACK');
for(const delta of [
  {owner_decision_receipt_sha256:'f'.repeat(64)},
  {original_custody_receipt_sha256:'f'.repeat(64)},
  {unresolved_critical_count:'1'},
  {reopen_result:'EXTERNAL_REOPEN_REQUEST_RECORDED_CLAIM'},
  {reviewed_at:'2026-11-04T20:10:00Z'}
])assert.equal((await reopenCheck(await sign({...reopenPayload,...delta},
  canonicalReopen768,26))).status,'HOLD_REOPEN_SCOPE');
assert.equal((await reopenCheck(await sign(reopenPayload,canonicalReopen768,25))).status,
  'HOLD_REOPEN_SIGNATURE');
const ready=await reconcile768({prior,owner,custody,reopen});
assert.equal(ready.owner_acceptance_status,'READY_FOR_SEPARATE_MANUAL_OWNER_ACCEPTANCE_HANDOFF');
assert.deepEqual(ready.follow_ups.map(x=>x.code),['SEPARATE_ORIGINAL_OWNER_BUSINESS_ACCEPTANCE_REQUIRED']);
for(const key of ['owner_acceptance_recorded_by_app','external_case_reopened_by_app',
  'actual_business_closure_verified_by_app','production_db_connected_by_app',
  'immutable_storage_verified_by_app','automatic_business_write','closure_allowed',
  'customer_notifications_sent_by_app'])assert.equal(ready[key],false,key);

// A signed reopen request cannot silently be turned into a clean close.
const requestedOwner=await ownerCheck(await sign({...ownerPayload,
  decision:'REOPEN_EXCEPTION_FOR_EXTERNAL_REVIEW'},canonicalOwner768,0));
assert.equal(requestedOwner.requests_reopen,true);
const requestedCustody=await custodyCheck(await sign({...custodyPayload,
  owner_decision_receipt_sha256:requestedOwner.receipt_sha256},canonicalCustody768,25),
  {owner:requestedOwner});
const requestedReopen=await reopenCheck(await sign({...reopenPayload,
  owner_decision_receipt_sha256:requestedOwner.receipt_sha256,
  original_custody_receipt_sha256:requestedCustody.receipt_sha256,
  unresolved_critical_count:'1',reopen_result:'EXTERNAL_REOPEN_REQUEST_RECORDED_CLAIM'},
  canonicalReopen768,26),{owner:requestedOwner,custody:requestedCustody});
assert.equal(requestedReopen.signature_authenticated,true);
assert.equal(requestedReopen.reopen_claim,true);
const heldReopen=await reconcile768({prior,owner:requestedOwner,custody:requestedCustody,
  reopen:requestedReopen});
assert.equal(heldReopen.owner_acceptance_status,'HOLD_ORIGINAL_CUSTODY_OWNER_DECISION_OR_REOPEN_EXCEPTION');
assert.ok(heldReopen.follow_ups.some(x=>x.code==='OWNER_SIGNED_EXCEPTION_REOPEN_REQUEST'));
assert.ok(heldReopen.follow_ups.some(x=>x.code==='EXTERNAL_REOPEN_REQUEST_CLAIM_PENDING_CONFIRMATION'));
const signedHold=await sign({...ownerPayload,decision:'HOLD_OWNER_POSTCLOSURE_ACCEPTANCE'},
  canonicalOwner768,0);
const heldOwner=await ownerCheck(signedHold);
assert.equal(heldOwner.signature_authenticated,true);assert.equal(heldOwner.accepts_manual_review_only,false);
const holdResult=await reconcile768({prior,owner:heldOwner});
assert.equal(holdResult.owner_acceptance_status,'HOLD_ORIGINAL_CUSTODY_OWNER_DECISION_OR_REOPEN_EXCEPTION');
assert.equal((await ownerCheck(signedOwner,{prior:{...prior,
  post_closure_review_status:'HOLD'}})).status,'HOLD_OWNER_ACCEPTANCE_SCOPE');

let outbound=0;const oldFetch=globalThis.fetch;
globalThis.fetch=async()=>{outbound++;throw Error('No unauthorized outbound');};
try{for(const fn of [onRequestGet,onRequestPost]){
  const post=fn===onRequestPost;
  const request=new Request('https://rosiedazzlers.ca/api/admin/economic_owner_acceptance_v768',{
    method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
      'Content-Type':'application/json'},...(post?{body:JSON.stringify(record)}:{})});
  assert.ok((await fn({request,env})).status>=400);
}assert.equal(outbound,0);}finally{globalThis.fetch=oldFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-owner-v768','admin-economic-external-v767','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`route mirror ${stem}`);
assert.match(read('admin-catalog.html'),/admin-economic-owner-v768\.html/);
assert.match(read('admin-economic-external-v767.html'),/admin-economic-owner-v768\.html/);
assert.match(read('assets/economic-owner-acceptance-v768.js'),/credentials:'same-origin'/);
assert.match(read('docs/build768_owner_source_custody_exception_reopening.md'),/read-only/i);
console.log('Build 768 PASS: 27 unique signer roles, 18 fixed origins, original-source custody, signed owner HOLD/reopen and no business mutations.');
