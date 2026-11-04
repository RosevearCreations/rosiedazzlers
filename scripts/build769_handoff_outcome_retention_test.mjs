import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {KEY_ROLES768,ORIGIN_ROLES768} from '../functions/api/_lib/economic-owner-acceptance-v768.js';
import {ROLES769,HANDOFF_FIELDS769,OUTCOME_FIELDS769,RETENTION_FIELDS769,
  canonicalHandoff769,canonicalOutcome769,canonicalRetention769,
  receiptURL769,readReceipt769,verifyHandoff769,verifyOutcome769,
  verifyRetention769,reconcile769}
  from '../functions/api/_lib/economic-handoff-retention-v769.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_handoff_retention_v769.js';

globalThis.crypto??=webcrypto;
const b64=buffer=>Buffer.from(buffer).toString('base64');
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const now=Date.parse('2026-11-04T21:20:00Z');
const record={booking_id:'12345678-1234-1234-1234-123456789abc',
  source_record_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',
  change_ticket_id:'production-change-769',execution_request_id:'external-request-769'};
const env={},pairs=[];
for(const [i,role] of [...KEY_ROLES768,...ROLES769].entries()){
  const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);pairs.push(pair);
  env[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`]=b64(await crypto.subtle.exportKey('raw',pair.publicKey));
  env[`ROSIE_ECONOMIC_${role}_KEY_ID`]=`original-unique-role-769-${i}`;
}
for(const [i,role] of [...ORIGIN_ROLES768,...ROLES769].entries())
  env[`ROSIE_ECONOMIC_${role}_BASE_URL`]=`https://issuer-${i}.example`;
assert.equal(KEY_ROLES768.length+ROLES769.length,30);
assert.equal(ORIGIN_ROLES768.length+ROLES769.length,21);
assert.equal(HANDOFF_FIELDS769.length,18);
assert.equal(OUTCOME_FIELDS769.length,18);
assert.equal(RETENTION_FIELDS769.length,20);
async function sign(payload,canonical,index){return {payload,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',pairs[index].privateKey,
    canonical(payload)))};}
const prior={ok:true,post_closure_review_status:'READY_FOR_SEPARATE_OWNER_FINAL_ACCEPTANCE_REVIEW',
  verified_scope:{trial_id:'trial-proven-769',production_project_ref:'production-project-769',
    audit_inspection_receipt_sha256:'a'.repeat(64)},
  independent_external_execution:{receipt_sha256:'b'.repeat(64)}};
const report={ok:true,owner_acceptance_status:'READY_FOR_SEPARATE_MANUAL_OWNER_ACCEPTANCE_HANDOFF',
  owner_postclosure_decision:{signature_authenticated:true,receipt_sha256:'c'.repeat(64),
    accepts_manual_review_only:true,requests_reopen:false},
  independent_original_source_custody:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'d'.repeat(64),reconciled_at:'2026-11-04T20:15:00Z'},
  independent_exception_reopening:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'e'.repeat(64)}};
const ctx={record,prior,report};
const common={...record,trial_id:prior.verified_scope.trial_id,
  production_project_ref:prior.verified_scope.production_project_ref,
  owner_decision_receipt_sha256:report.owner_postclosure_decision.receipt_sha256};
const handoffPayload={schema:'rosie-independent-owner-evidence-handoff-v769',...common,
  original_custody_receipt_sha256:report.independent_original_source_custody.receipt_sha256,
  exception_review_receipt_sha256:report.independent_exception_reopening.receipt_sha256,
  external_execution_receipt_sha256:prior.independent_external_execution.receipt_sha256,
  original_audit_receipt_sha256:prior.verified_scope.audit_inspection_receipt_sha256,
  handoff_manifest_sha256:'f'.repeat(64),handoff_destination_id:'independent-owner-archive-769',
  handoff_result:'EVIDENCE_DELIVERED_TO_INDEPENDENT_OWNER_CLAIM',
  handed_off_at:'2026-11-04T20:20:00Z',custodian_id:'independent-handoff-769',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_OWNER_HANDOFF_CUSTODIAN_KEY_ID};
const signedHandoff=await sign(handoffPayload,canonicalHandoff769,27);
async function handoffCheck(envelope=signedHandoff,params={}){
  return verifyHandoff769({env,ctx,readback:{status:'SIGNED_HANDOFF_READBACK',envelope},
    now,...params});
}
const handoff=await handoffCheck();
assert.equal(handoff.signature_authenticated,true);
assert.equal(handoff.clean_claim,true);
assert.equal(handoff.handoff_manifest_sha256,'f'.repeat(64));
assert.ok(receiptURL769(env,'handoff',ctx).includes('owner_decision_receipt_sha256='));
assert.equal((await readReceipt769(env,'handoff',ctx,null,null,
  async()=>new Response(JSON.stringify(signedHandoff)))).status,'SIGNED_HANDOFF_READBACK');
for(const delta of [
  {owner_decision_receipt_sha256:'0'.repeat(64)},
  {original_custody_receipt_sha256:'0'.repeat(64)},
  {exception_review_receipt_sha256:'0'.repeat(64)},
  {original_audit_receipt_sha256:'0'.repeat(64)},
  {handoff_result:'OWNER_BUSINESS_ACCEPTANCE_EXECUTED'},
  {handed_off_at:'2026-11-04T19:00:00Z'}
])assert.equal((await handoffCheck(await sign({...handoffPayload,...delta},
  canonicalHandoff769,27))).status,'HOLD_HANDOFF_SCOPE');
assert.equal((await handoffCheck(await sign(handoffPayload,canonicalHandoff769,28))).status,
  'HOLD_HANDOFF_SIGNATURE');
assert.throws(()=>canonicalHandoff769({...handoffPayload,other:'unexpected'}),/Noncanonical/);
assert.equal((await handoffCheck(signedHandoff,{env:{...env,
  ROSIE_ECONOMIC_POSTCLOSURE_RETENTION_WITNESS_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_HANDOFF_SIGNER_INDEPENDENCE');
assert.equal((await handoffCheck(signedHandoff,{env:{...env,
  ROSIE_ECONOMIC_EXTERNAL_REOPEN_OUTCOME_WITNESS_BASE_URL:
    env.ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL}})).status,
  'HOLD_HANDOFF_ORIGIN_INDEPENDENCE');
assert.equal((await handoffCheck(signedHandoff,{env:{...env,
  ROSIE_ECONOMIC_POSTCLOSURE_RETENTION_WITNESS_BASE_URL:'http://127.0.0.1'}})).status,
  'HOLD_HANDOFF_ORIGIN_INDEPENDENCE');
const outcomePayload={schema:'rosie-external-reopen-outcome-readback-v769',...common,
  exception_review_receipt_sha256:report.independent_exception_reopening.receipt_sha256,
  handoff_receipt_sha256:handoff.receipt_sha256,
  previous_case_register_sha256:'1'.repeat(64),current_case_register_sha256:'1'.repeat(64),
  reopen_action_id:'case-769-no-action',unresolved_critical_count:'0',
  reopen_outcome:'NO_REOPEN_ACTION_CLAIM',
  observed_at:'2026-11-04T20:25:00Z',witness_id:'independent-outcome-witness-769',
  key_id:env.ROSIE_ECONOMIC_EXTERNAL_REOPEN_OUTCOME_WITNESS_KEY_ID};
const signedOutcome=await sign(outcomePayload,canonicalOutcome769,28);
async function outcomeCheck(envelope=signedOutcome,params={}){
  return verifyOutcome769({env,ctx,handoff,
    readback:{status:'SIGNED_OUTCOME_READBACK',envelope},now,...params});
}
const outcome=await outcomeCheck();
assert.equal(outcome.signature_authenticated,true);assert.equal(outcome.no_reopen_claim,true);
assert.ok(receiptURL769(env,'outcome',ctx,handoff).includes('handoff_receipt_sha256='));
assert.equal(receiptURL769(env,'outcome',ctx,{signature_authenticated:false}),null);
for(const delta of [
  {handoff_receipt_sha256:'0'.repeat(64)},
  {current_case_register_sha256:'2'.repeat(64)},
  {unresolved_critical_count:'1'},
  {reopen_outcome:'EXTERNAL_CASE_REOPENED_CLAIM'},
  {observed_at:'2026-11-04T20:10:00Z'}
])assert.equal((await outcomeCheck(await sign({...outcomePayload,...delta},
  canonicalOutcome769,28))).status,'HOLD_OUTCOME_SCOPE');
assert.equal((await outcomeCheck(await sign(outcomePayload,canonicalOutcome769,27))).status,
  'HOLD_OUTCOME_SIGNATURE');
const retentionPayload={schema:'rosie-postclosure-retention-continuity-v769',...common,
  original_custody_receipt_sha256:report.independent_original_source_custody.receipt_sha256,
  handoff_receipt_sha256:handoff.receipt_sha256,reopen_outcome_receipt_sha256:outcome.receipt_sha256,
  handoff_manifest_sha256:handoff.handoff_manifest_sha256,
  original_source_manifest_sha256:'2'.repeat(64),
  retained_source_manifest_sha256:'2'.repeat(64),
  retention_policy_sha256:'3'.repeat(64),retained_through:'2028-11-04T21:00:00Z',
  retention_result:'ORIGINAL_SOURCE_RETENTION_CONTINUITY_CLAIM',
  observed_at:'2026-11-04T20:30:00Z',witness_id:'independent-retention-witness-769',
  key_id:env.ROSIE_ECONOMIC_POSTCLOSURE_RETENTION_WITNESS_KEY_ID};
const signedRetention=await sign(retentionPayload,canonicalRetention769,29);
async function retentionCheck(envelope=signedRetention,params={}){
  return verifyRetention769({env,ctx,handoff,outcome,
    readback:{status:'SIGNED_RETENTION_READBACK',envelope},now,...params});
}
const retention=await retentionCheck();
assert.equal(retention.signature_authenticated,true);assert.equal(retention.clean_claim,true);
assert.ok(receiptURL769(env,'retention',ctx,handoff,outcome)
  .includes('reopen_outcome_receipt_sha256='));
for(const delta of [
  {handoff_manifest_sha256:'4'.repeat(64)},
  {reopen_outcome_receipt_sha256:'4'.repeat(64)},
  {retained_source_manifest_sha256:'5'.repeat(64)},
  {retained_through:'2026-11-04T19:00:00Z'},
  {retention_result:'IMMUTABLE_DATABASE_UPDATED'},
  {observed_at:'2026-11-04T20:00:00Z'}
])assert.equal((await retentionCheck(await sign({...retentionPayload,...delta},
  canonicalRetention769,29))).status,'HOLD_RETENTION_SCOPE');
assert.equal((await retentionCheck(await sign(retentionPayload,canonicalRetention769,28))).status,
  'HOLD_RETENTION_SIGNATURE');
const success=await reconcile769({ctx,handoff,outcome,retention});
assert.equal(success.handoff_retention_status,
  'READY_FOR_SEPARATE_MANUAL_OWNER_HANDOFF_AND_RETENTION_REVIEW');
assert.deepEqual(success.follow_ups.map(f=>f.code),
  ['MANUAL_ORIGINAL_OWNER_BUSINESS_DECISION_OUTSTANDING']);
for(const field of ['owner_acceptance_recorded_by_app','external_case_reopened_by_app',
  'original_source_storage_verified_by_app','production_db_connected_by_app',
  'closure_allowed','automatic_business_write','customer_notifications_sent_by_app'])
  assert.equal(success[field],false);
assert.equal((await reconcile769({ctx,handoff,outcome,retention:{...retention,
  clean_claim:false}})).handoff_retention_status,'HOLD_ORIGINAL_HANDOFF_REOPEN_OUTCOME_OR_RETENTION');
// The signed owner reopen request permits an independent external outcome
// claim but NEVER marks an original owner business review ready.
const reopenCtx={...ctx,report:{...report,
  owner_postclosure_decision:{...report.owner_postclosure_decision,
    accepts_manual_review_only:false,requests_reopen:true},
  independent_exception_reopening:{...report.independent_exception_reopening,
    clean_claim:false,reopen_claim:true}}};
const externalReopen=await sign({...outcomePayload,
  previous_case_register_sha256:'1'.repeat(64),
  current_case_register_sha256:'2'.repeat(64),
  reopen_outcome:'EXTERNAL_CASE_REOPENED_CLAIM',unresolved_critical_count:'1'},
  canonicalOutcome769,28);
const reopened=await outcomeCheck(externalReopen,{ctx:reopenCtx});
assert.equal(reopened.external_reopen_claim,true);
const held=await reconcile769({ctx:reopenCtx,handoff,outcome:reopened,retention});
assert.equal(held.handoff_retention_status,'HOLD_ORIGINAL_HANDOFF_REOPEN_OUTCOME_OR_RETENTION');
assert.ok(held.follow_ups.some(f=>f.code==='REOPEN_OUTCOME_MANUAL_CONFIRMATION_REQUIRED'));
assert.equal((await outcomeCheck(signedOutcome,{ctx:reopenCtx})).status,'HOLD_OUTCOME_SCOPE');
// Never make unauthenticated API requests trigger provider fetches.
let outbound=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{outbound++;throw Error('Provider fetch without owner session');};
try{for(const fn of [onRequestGet,onRequestPost]){
  const post=fn===onRequestPost;
  const req=new Request('https://rosiedazzlers.ca/api/admin/economic_handoff_retention_v769',{
    method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
      'Content-Type':'application/json'},...(post?{body:JSON.stringify(record)}:{})});
  assert.ok((await fn({request:req,env})).status>=400);
}assert.equal(outbound,0);}finally{globalThis.fetch=originalFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-handoff-v769','admin-economic-owner-v768','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`));
assert.match(read('admin-catalog.html'),/admin-economic-handoff-v769\.html/);
assert.match(read('admin-economic-owner-v768.html'),/admin-economic-handoff-v769\.html/);
assert.match(read('assets/economic-handoff-retention-v769.js'),/credentials:'same-origin'/);
assert.match(read('docs/build769_original_owner_handoff_reopen_retention.md'),/read-only/i);
console.log('Build 769 PASS: 30 independent Ed25519 signers, 21 pinned HTTPS sources, exact-source handoff, reopen-outcome HOLD and retention continuity.');
