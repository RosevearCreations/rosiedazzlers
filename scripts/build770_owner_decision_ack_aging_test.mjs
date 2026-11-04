import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {KEY_ROLES768,ORIGIN_ROLES768} from '../functions/api/_lib/economic-owner-acceptance-v768.js';
import {ROLES769} from '../functions/api/_lib/economic-handoff-retention-v769.js';
import {ROLES770,REGISTER_FIELDS770,ACK_FIELDS770,AGING_FIELDS770,
  canonicalRegister770,canonicalAck770,canonicalAging770,
  receiptURL770,readReceipt770,verifyRegister770,verifyAck770,
  verifyAging770,reconcile770}
  from '../functions/api/_lib/economic-owner-register-aging-v770.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_owner_register_v770.js';

globalThis.crypto??=webcrypto;
const base64=b=>Buffer.from(b).toString('base64');
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const now=Date.parse('2026-11-04T21:30:00Z');
const env={},keys=[];
for(const [i,role] of [...KEY_ROLES768,...ROLES769,...ROLES770].entries()){
  const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);keys.push(pair);
  env[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`]=base64(await crypto.subtle.exportKey('raw',pair.publicKey));
  env[`ROSIE_ECONOMIC_${role}_KEY_ID`]=`unique-issuer-role-v770-${i}`;
}
for(const [i,role] of [...ORIGIN_ROLES768,...ROLES769,...ROLES770].entries())
  env[`ROSIE_ECONOMIC_${role}_BASE_URL`]=`https://source-v770-${i}.example`;
assert.equal(keys.length,33);
assert.equal(ORIGIN_ROLES768.length+ROLES769.length+ROLES770.length,24);
assert.equal(REGISTER_FIELDS770.length,19);
assert.equal(ACK_FIELDS770.length,17);
assert.equal(AGING_FIELDS770.length,23);
async function sign(payload,fn,roleIndex){return {payload,
  signature_b64:base64(await crypto.subtle.sign('Ed25519',keys[roleIndex].privateKey,fn(payload)))};}
const record={booking_id:'12345678-1234-1234-1234-123456789abc',
  source_record_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',
  change_ticket_id:'external-change-770',execution_request_id:'external-request-770'};
const scope={...record,trial_id:'verified-trial-770',
  production_project_ref:'production-project-770',
  owner_decision_receipt_sha256:'1'.repeat(64)};
const history={ctx:{record,prior:{ok:true,
  post_closure_review_status:'READY_FOR_SEPARATE_OWNER_FINAL_ACCEPTANCE_REVIEW',
  verified_scope:{trial_id:scope.trial_id,production_project_ref:scope.production_project_ref}},
  report:{owner_postclosure_decision:{signature_authenticated:true,
    receipt_sha256:scope.owner_decision_receipt_sha256,accepts_manual_review_only:true,
    requests_reopen:false}}},
  report:{ok:true,handoff_retention_status:'READY_FOR_SEPARATE_MANUAL_OWNER_HANDOFF_AND_RETENTION_REVIEW'},
  handoff:{signature_authenticated:true,receipt_sha256:'2'.repeat(64),
    clean_claim:true,handoff_manifest_sha256:'3'.repeat(64)},
  outcome:{signature_authenticated:true,receipt_sha256:'4'.repeat(64),
    no_reopen_claim:true,external_reopen_claim:false},
  retention:{signature_authenticated:true,receipt_sha256:'5'.repeat(64),
    clean_claim:true,retained_source_manifest_sha256:'6'.repeat(64),
    retention_policy_sha256:'7'.repeat(64),retained_through:'2028-11-04T21:00:00Z',
    signed_at:'2026-11-04T20:30:00Z'}};
const registerPayload={schema:'rosie-independent-owner-decision-register-v770',...scope,
  handoff_receipt_sha256:history.handoff.receipt_sha256,
  external_reopen_outcome_receipt_sha256:history.outcome.receipt_sha256,
  retention_receipt_sha256:history.retention.receipt_sha256,
  previous_decision_register_sha256:'8'.repeat(64),
  current_decision_register_sha256:'9'.repeat(64),
  decision_case_id:'owner-decision-case-770',decision_record_id:'decision-record-770',
  register_decision:'OWNER_MANUAL_ACCEPTANCE_REVIEW_REGISTERED_CLAIM',
  decision_entered_at:'2026-11-04T20:35:00Z',
  witness_id:'independent-owner-register-770',
  key_id:env.ROSIE_ECONOMIC_ORIGINAL_OWNER_DECISION_REGISTER_WITNESS_KEY_ID};
const signedRegister=await sign(registerPayload,canonicalRegister770,30);
async function registerCheck(envelope=signedRegister,params={}){
  return verifyRegister770({env,history,readback:{status:'SIGNED_REGISTER_READBACK',envelope},
    now,...params});
}
const register=await registerCheck();
assert.equal(register.signature_authenticated,true);
assert.equal(register.manual_review_claim,true);
assert.ok(receiptURL770(env,'register',history).includes('owner_decision_receipt_sha256='));
assert.equal((await readReceipt770(env,'register',history,null,null,
  async()=>new Response(JSON.stringify(signedRegister)))).status,'SIGNED_REGISTER_READBACK');
for(const delta of [
  {owner_decision_receipt_sha256:'f'.repeat(64)},
  {handoff_receipt_sha256:'f'.repeat(64)},
  {retention_receipt_sha256:'f'.repeat(64)},
  {current_decision_register_sha256:'8'.repeat(64)},
  {register_decision:'APPROVE_DATABASE_CLOSURE_NOW'},
  {decision_entered_at:'2026-11-04T20:00:00Z'}
])assert.equal((await registerCheck(await sign({...registerPayload,...delta},
  canonicalRegister770,30))).status,'HOLD_REGISTER_SCOPE');
assert.equal((await registerCheck(await sign(registerPayload,canonicalRegister770,31))).status,
  'HOLD_REGISTER_SIGNATURE');
assert.throws(()=>canonicalRegister770({...registerPayload,unexpected:'x'}),/Noncanonical/);
assert.equal((await registerCheck(signedRegister,{env:{...env,
  ROSIE_ECONOMIC_RETENTION_EXCEPTION_AGING_WITNESS_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_REGISTER_KEY_INDEPENDENCE');
assert.equal((await registerCheck(signedRegister,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_HANDOFF_ACKNOWLEDGMENT_WITNESS_BASE_URL:
    env.ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL}})).status,
  'HOLD_REGISTER_ORIGIN_INDEPENDENCE');
assert.equal((await registerCheck(signedRegister,{env:{...env,
  ROSIE_ECONOMIC_RETENTION_EXCEPTION_AGING_WITNESS_BASE_URL:'http://127.0.0.1'}})).status,
  'HOLD_REGISTER_ORIGIN_INDEPENDENCE');
const ackPayload={schema:'rosie-independent-owner-handoff-acknowledgment-v770',...scope,
  decision_register_receipt_sha256:register.receipt_sha256,
  handoff_receipt_sha256:history.handoff.receipt_sha256,
  handoff_manifest_sha256:history.handoff.handoff_manifest_sha256,
  acknowledged_manifest_sha256:history.handoff.handoff_manifest_sha256,
  recipient_reference_id:'independent-recipient-770',
  ack_result:'OWNER_EVIDENCE_RECEIPT_ACKNOWLEDGED_CLAIM',
  acknowledged_at:'2026-11-04T20:40:00Z',
  witness_id:'independent-handoff-ack-770',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_HANDOFF_ACKNOWLEDGMENT_WITNESS_KEY_ID};
const signedAck=await sign(ackPayload,canonicalAck770,31);
async function ackCheck(envelope=signedAck,params={}){
  return verifyAck770({env,history,register,readback:{status:'SIGNED_ACK_READBACK',envelope},
    now,...params});
}
const ack=await ackCheck();
assert.equal(ack.signature_authenticated,true);
assert.equal(ack.acknowledged_claim,true);
assert.ok(receiptURL770(env,'ack',history,register).includes('decision_register_receipt_sha256='));
assert.equal(receiptURL770(env,'ack',history,{signature_authenticated:false}),null);
for(const delta of [
  {owner_decision_receipt_sha256:'f'.repeat(64)},
  {decision_register_receipt_sha256:'f'.repeat(64)},
  {handoff_manifest_sha256:'f'.repeat(64)},
  {acknowledged_manifest_sha256:'f'.repeat(64)},
  {ack_result:'SITE_APPROVED_OWNER_ACCEPTANCE'},
  {acknowledged_at:'2026-11-04T20:30:00Z'}
])assert.equal((await ackCheck(await sign({...ackPayload,...delta},
  canonicalAck770,31))).status,'HOLD_ACK_SCOPE');
assert.equal((await ackCheck(await sign(ackPayload,canonicalAck770,32))).status,
  'HOLD_ACK_SIGNATURE');
const agingPayload={schema:'rosie-retention-exception-aging-v770',...scope,
  decision_register_receipt_sha256:register.receipt_sha256,
  handoff_ack_receipt_sha256:ack.receipt_sha256,
  postclosure_retention_receipt_sha256:history.retention.receipt_sha256,
  current_source_manifest_sha256:history.retention.retained_source_manifest_sha256,
  retention_policy_sha256:history.retention.retention_policy_sha256,
  retained_through:history.retention.retained_through,
  exception_register_sha256:'a'.repeat(64),
  open_exception_count:'0',critical_exception_count:'0',
  oldest_exception_at:'2026-11-04T20:45:00Z',alert_after_hours:'24',
  retention_result:'NO_OPEN_RETENTION_EXCEPTION_CLAIM',
  snapshot_at:'2026-11-04T20:45:00Z',
  witness_id:'independent-aging-witness-770',
  key_id:env.ROSIE_ECONOMIC_RETENTION_EXCEPTION_AGING_WITNESS_KEY_ID};
const signedAging=await sign(agingPayload,canonicalAging770,32);
async function agingCheck(envelope=signedAging,params={}){
  return verifyAging770({env,history,register,ack,
    readback:{status:'SIGNED_AGING_READBACK',envelope},now,...params});
}
const aging=await agingCheck();
assert.equal(aging.signature_authenticated,true);
assert.equal(aging.clean_claim,true);
assert.equal(aging.oldest_open_exception_age_hours,0);
assert.equal(aging.retention_window_expired,false);
assert.ok(receiptURL770(env,'aging',history,register,ack)
  .includes('handoff_ack_receipt_sha256='));
for(const delta of [
  {postclosure_retention_receipt_sha256:'f'.repeat(64)},
  {current_source_manifest_sha256:'f'.repeat(64)},
  {retention_policy_sha256:'f'.repeat(64)},
  {critical_exception_count:'1'},
  {open_exception_count:'1'},
  {retention_result:'RETENTION_DELETE_NOW'},
  {alert_after_hours:'5000'},
  {snapshot_at:'2026-11-04T20:20:00Z'}
])assert.equal((await agingCheck(await sign({...agingPayload,...delta},
  canonicalAging770,32))).status,'HOLD_AGING_SCOPE');
assert.equal((await agingCheck(await sign(agingPayload,canonicalAging770,31))).status,
  'HOLD_AGING_SIGNATURE');
const ready=await reconcile770({history,register,ack,aging});
assert.equal(ready.owner_register_status,'READY_FOR_SEPARATE_ORIGINAL_OWNER_DECISION_REVIEW');
assert.deepEqual(ready.follow_ups.map(f=>f.code),
  ['SEPARATE_ORIGINAL_OWNER_BUSINESS_ACCEPTANCE_REQUIRED']);
for(const field of ['original_business_acceptance_recorded_by_app',
  'external_case_reopened_by_app','append_only_storage_written_by_app',
  'original_source_storage_verified_by_app','production_db_connected_by_app',
  'closure_allowed','automatic_business_write','customer_notifications_sent_by_app'])
  assert.equal(ready[field],false);
// Aged and critical source exceptions remain HOLD even when original signatures verify.
const agedPayload={...agingPayload,open_exception_count:'3',critical_exception_count:'1',
  oldest_exception_at:'2026-10-28T18:45:00Z',
  retention_result:'OPEN_RETENTION_EXCEPTIONS_CLAIM'};
const aged=await agingCheck(await sign(agedPayload,canonicalAging770,32));
assert.equal(aged.signature_authenticated,true);
assert.equal(aged.aged_exception_claim,true);
assert.ok(aged.oldest_open_exception_age_hours>=144);
const held=await reconcile770({history,register,ack,aging:aged});
assert.equal(held.owner_register_status,'HOLD_OWNER_REGISTER_HANDOFF_ACK_OR_RETENTION_AGING');
assert.ok(held.follow_ups.some(f=>f.code==='CRITICAL_RETENTION_EXCEPTION_OPEN'));
assert.ok(held.follow_ups.some(f=>f.code==='RETENTION_EXCEPTION_AGING_THRESHOLD_REACHED'));
assert.equal((await reconcile770({history,register,ack,aging:{...aging,
  retention_window_expired:true}})).owner_register_status,
  'HOLD_OWNER_REGISTER_HANDOFF_ACK_OR_RETENTION_AGING');
// A signed external reopen case must be tracked, never silently accepted.
const reopenHistory={...history,ctx:{...history.ctx,report:{
  owner_postclosure_decision:{...history.ctx.report.owner_postclosure_decision,
    requests_reopen:true,accepts_manual_review_only:false}}},
  report:{...history.report,handoff_retention_status:'HOLD_ORIGINAL_HANDOFF_REOPEN_OUTCOME_OR_RETENTION'},
  outcome:{...history.outcome,external_reopen_claim:true,no_reopen_claim:false}};
const reopened=await registerCheck(await sign({...registerPayload,
  register_decision:'OWNER_EXTERNAL_REOPEN_FOLLOWUP_REGISTERED_CLAIM'},
  canonicalRegister770,30),{history:reopenHistory});
assert.equal(reopened.reopen_followup_claim,true);
const reopening=await reconcile770({history:reopenHistory,register:reopened,ack,aging});
assert.equal(reopening.owner_register_status,'HOLD_OWNER_REGISTER_HANDOFF_ACK_OR_RETENTION_AGING');
assert.ok(reopening.follow_ups.some(f=>f.code==='EXTERNAL_REOPEN_FOLLOWUP_REQUIRES_OWNER_CONFIRMATION'));
assert.equal((await registerCheck(signedRegister,{history:reopenHistory})).status,
  'HOLD_REGISTER_SCOPE');
let outgoing=0;const priorFetch=globalThis.fetch;
globalThis.fetch=async()=>{outgoing++;throw Error('Unauthorized source fetch');};
try{for(const fn of [onRequestGet,onRequestPost]){
  const post=fn===onRequestPost;
  const request=new Request('https://rosiedazzlers.ca/api/admin/economic_owner_register_v770',{
    method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
      'Content-Type':'application/json'},...(post?{body:JSON.stringify(record)}:{})});
  assert.ok((await fn({request,env})).status>=400);
}assert.equal(outgoing,0);}finally{globalThis.fetch=priorFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-register-v770','admin-economic-handoff-v769','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`));
assert.match(read('admin-catalog.html'),/admin-economic-register-v770\.html/);
assert.match(read('admin-economic-handoff-v769.html'),/admin-economic-register-v770\.html/);
assert.match(read('assets/economic-owner-register-v770.js'),/credentials:'same-origin'/);
assert.match(read('docs/build770_owner_decision_ack_retention_aging.md'),/read-only/i);
console.log('Build 770 PASS: 33 independent signers, 24 original HTTPS origins, signed owner register, handoff acknowledgment, exception aging and no business writes.');
