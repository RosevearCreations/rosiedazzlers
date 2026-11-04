import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {KEY_ROLES768,ORIGIN_ROLES768} from '../functions/api/_lib/economic-owner-acceptance-v768.js';
import {ROLES769} from '../functions/api/_lib/economic-handoff-retention-v769.js';
import {ROLES770} from '../functions/api/_lib/economic-owner-register-aging-v770.js';
import {ROLES771,OWNER_FIELDS771,ATTEST_FIELDS771,DISPUTE_FIELDS771,ESCALATION_FIELDS771,
  canonicalOwner771,canonicalAttest771,canonicalDispute771,canonicalEscalation771,
  verifyOwner771,verifyAttest771,verifyDispute771,verifyEscalation771,
  receiptURL771,readReceipt771,reconcile771}
  from '../functions/api/_lib/economic-final-attestation-v771.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_final_attestation_v771.js';

globalThis.crypto??=webcrypto;
const b64=b=>Buffer.from(b).toString('base64');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-04T22:15:00Z');
const env={},pairs=[];
const roles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771];
for(const [i,role] of roles.entries()){
  const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);pairs.push(pair);
  env[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`]=b64(await crypto.subtle.exportKey('raw',pair.publicKey));
  env[`ROSIE_ECONOMIC_${role}_KEY_ID`]=`original-independently-pinned-v771-${i}`;
}
const originRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771];
for(const [i,role] of originRoles.entries())
  env[`ROSIE_ECONOMIC_${role}_BASE_URL`]=`https://evidence-origin-v771-${i}.example`;
assert.equal(roles.length,36);assert.equal(originRoles.length,27);
assert.equal(OWNER_FIELDS771.length,17);assert.equal(ATTEST_FIELDS771.length,17);
assert.equal(DISPUTE_FIELDS771.length,17);assert.equal(ESCALATION_FIELDS771.length,19);
async function sign(payload,canonical,index){return {payload,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',pairs[index].privateKey,
    canonical(payload)))};}
const record={booking_id:'12345678-1234-1234-1234-123456789abc',
  source_record_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',
  change_ticket_id:'external-change-771',execution_request_id:'original-request-771'};
const scope={...record,trial_id:'original-trial-771',
  production_project_ref:'original-project-771'};
const history={report:{ok:true,
  owner_register_status:'READY_FOR_SEPARATE_ORIGINAL_OWNER_DECISION_REVIEW',
  packet_sha256:'a'.repeat(64)},
  history:{ctx:{record,prior:{ok:true,
    verified_scope:{trial_id:scope.trial_id,production_project_ref:scope.production_project_ref}},
    report:{owner_postclosure_decision:{signature_authenticated:true,
      receipt_sha256:'1'.repeat(64)}}},
    handoff:{handoff_manifest_sha256:'2'.repeat(64)}},
  register:{signature_authenticated:true,manual_review_claim:true,
    receipt_sha256:'3'.repeat(64)},
  ack:{signature_authenticated:true,acknowledged_claim:true,
    receipt_sha256:'4'.repeat(64)},
  aging:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'5'.repeat(64),signed_at:'2026-11-04T21:00:00Z',
    open_exception_count:0,critical_exception_count:0,retention_window_expired:false,
    exception_register_sha256:'6'.repeat(64)}};
const ownerPayload={schema:'rosie-original-owner-final-manual-decision-v771',...scope,
  original_owner_receipt_sha256:'1'.repeat(64),
  decision_register_receipt_sha256:history.register.receipt_sha256,
  handoff_ack_receipt_sha256:history.ack.receipt_sha256,
  retention_aging_receipt_sha256:history.aging.receipt_sha256,
  final_owner_decision:'REQUEST_FINAL_MANUAL_EXTERNAL_ACCEPTANCE_REVIEW',
  owner_decision_ticket_id:'original-owner-ticket-771',
  owner_id:'original-owner-review-771',issued_at:'2026-11-04T21:05:00Z',
  nonce:'c'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sign(ownerPayload,canonicalOwner771,0);
async function ownerCheck(envelope=signedOwner,params={}){
  return verifyOwner771({env,history,envelope,now,...params});
}
const owner=await ownerCheck();
assert.equal(owner.signature_authenticated,true);
assert.equal(owner.requests_manual_acceptance,true);
assert.equal(owner.actual_business_acceptance_recorded_by_app,false);
for(const delta of [
  {original_owner_receipt_sha256:'f'.repeat(64)},
  {decision_register_receipt_sha256:'f'.repeat(64)},
  {handoff_ack_receipt_sha256:'f'.repeat(64)},
  {retention_aging_receipt_sha256:'f'.repeat(64)},
  {final_owner_decision:'EXECUTE_PRODUCTION_CLOSURE_NOW'},
  {issued_at:'2026-11-04T20:50:00Z'},
  {nonce:'invalid'}
])assert.equal((await ownerCheck(await sign({...ownerPayload,...delta},
  canonicalOwner771,0))).status,'HOLD_FINAL_OWNER_SCOPE');
assert.equal((await ownerCheck(await sign(ownerPayload,canonicalOwner771,33))).status,
  'HOLD_FINAL_OWNER_SIGNATURE');
assert.throws(()=>canonicalOwner771({...ownerPayload,additional:'x'}),/Noncanonical/);
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_RETENTION_ESCALATION_WITNESS_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_FINAL_OWNER_SIGNER_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_HANDOFF_DISPUTE_WITNESS_BASE_URL:
    env.ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL}})).status,
  'HOLD_FINAL_OWNER_ORIGIN_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_FINAL_OWNER_DECISION_ATTESTOR_BASE_URL:
    'http://127.0.0.1'}})).status,'HOLD_FINAL_OWNER_ORIGIN_INDEPENDENCE');
const attestPayload={schema:'rosie-independent-final-owner-decision-attestation-v771',...scope,
  final_owner_decision_receipt_sha256:owner.receipt_sha256,
  decision_register_receipt_sha256:history.register.receipt_sha256,
  handoff_ack_receipt_sha256:history.ack.receipt_sha256,
  retention_aging_receipt_sha256:history.aging.receipt_sha256,
  decision_register_before_sha256:'7'.repeat(64),
  decision_register_after_sha256:'8'.repeat(64),
  attestation_result:'ORIGINAL_OWNER_MANUAL_DECISION_WITNESSED_CLAIM',
  attested_at:'2026-11-04T21:10:00Z',
  attestor_id:'independent-original-attestor-771',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_FINAL_OWNER_DECISION_ATTESTOR_KEY_ID};
const signedAttest=await sign(attestPayload,canonicalAttest771,33);
async function attestCheck(envelope=signedAttest,params={}){
  return verifyAttest771({env,history,owner,
    readback:{status:'SIGNED_ATTEST_READBACK',envelope},now,...params});
}
const attestation=await attestCheck();
assert.equal(attestation.signature_authenticated,true);
assert.equal(attestation.manual_decision_witnessed,true);
assert.ok(receiptURL771(env,'attest',history,owner)
  .includes('owner_final_decision_receipt_sha256='));
assert.equal((await readReceipt771(env,'attest',history,owner,null,null,
  async()=>new Response(JSON.stringify(signedAttest)))).status,'SIGNED_ATTEST_READBACK');
for(const delta of [
  {decision_register_receipt_sha256:'f'.repeat(64)},
  {decision_register_after_sha256:'7'.repeat(64)},
  {attestation_result:'OWNER_BUSINESS_ACCEPTANCE_EXECUTED'},
  {attested_at:'2026-11-04T20:50:00Z'}
])assert.equal((await attestCheck(await sign({...attestPayload,...delta},
  canonicalAttest771,33))).status,'HOLD_ATTEST_SCOPE');
assert.equal((await attestCheck(await sign(attestPayload,canonicalAttest771,34))).status,
  'HOLD_ATTEST_SIGNATURE');
const disputePayload={schema:'rosie-independent-handoff-dispute-resolution-v771',...scope,
  final_owner_decision_receipt_sha256:owner.receipt_sha256,
  attestation_receipt_sha256:attestation.receipt_sha256,
  handoff_ack_receipt_sha256:history.ack.receipt_sha256,
  original_handoff_manifest_sha256:history.history.handoff.handoff_manifest_sha256,
  dispute_register_sha256:'9'.repeat(64),dispute_case_id:'dispute-case-771',
  dispute_result:'NO_UNRESOLVED_HANDOFF_DISPUTE_CLAIM',
  reviewed_at:'2026-11-04T21:15:00Z',
  witness_id:'independent-handoff-dispute-771',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_HANDOFF_DISPUTE_WITNESS_KEY_ID};
const signedDispute=await sign(disputePayload,canonicalDispute771,34);
async function disputeCheck(envelope=signedDispute,params={}){
  return verifyDispute771({env,history,owner,attestation,
    readback:{status:'SIGNED_DISPUTE_READBACK',envelope},now,...params});
}
const dispute=await disputeCheck();
assert.equal(dispute.signature_authenticated,true);assert.equal(dispute.clean_claim,true);
assert.ok(receiptURL771(env,'dispute',history,owner,attestation)
  .includes('attestation_receipt_sha256='));
assert.equal(receiptURL771(env,'dispute',history,owner,{signature_authenticated:false}),null);
for(const delta of [
  {final_owner_decision_receipt_sha256:'f'.repeat(64)},
  {attestation_receipt_sha256:'f'.repeat(64)},
  {original_handoff_manifest_sha256:'f'.repeat(64)},
  {dispute_result:'EXTERNAL_HANDOFF_DISPUTE_REFERRED_CLAIM'},
  {reviewed_at:'2026-11-04T21:00:00Z'}
])assert.equal((await disputeCheck(await sign({...disputePayload,...delta},
  canonicalDispute771,34))).status,'HOLD_DISPUTE_SCOPE');
assert.equal((await disputeCheck(await sign(disputePayload,canonicalDispute771,35))).status,
  'HOLD_DISPUTE_SIGNATURE');
const escalationPayload={schema:'rosie-independent-retention-exception-escalation-v771',...scope,
  final_owner_decision_receipt_sha256:owner.receipt_sha256,
  attestation_receipt_sha256:attestation.receipt_sha256,
  dispute_review_receipt_sha256:dispute.receipt_sha256,
  retention_aging_receipt_sha256:history.aging.receipt_sha256,
  original_exception_register_sha256:history.aging.exception_register_sha256,
  current_escalation_register_sha256:'a'.repeat(64),
  escalation_case_id:'escalation-case-771',unresolved_critical_count:'0',
  escalation_result:'NO_RETENTION_ESCALATION_REQUIRED_CLAIM',
  escalated_at:'2026-11-04T21:20:00Z',
  witness_id:'independent-retention-escalation-771',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_RETENTION_ESCALATION_WITNESS_KEY_ID};
const signedEscalation=await sign(escalationPayload,canonicalEscalation771,35);
async function escalationCheck(envelope=signedEscalation,params={}){
  return verifyEscalation771({env,history,owner,attestation,dispute,
    readback:{status:'SIGNED_ESCALATION_READBACK',envelope},now,...params});
}
const escalation=await escalationCheck();
assert.equal(escalation.signature_authenticated,true);
assert.equal(escalation.clean_claim,true);
assert.equal(escalation.actual_retention_record_updated_by_app,false);
assert.ok(receiptURL771(env,'escalation',history,owner,attestation,dispute)
  .includes('dispute_review_receipt_sha256='));
for(const delta of [
  {dispute_review_receipt_sha256:'f'.repeat(64)},
  {original_exception_register_sha256:'f'.repeat(64)},
  {unresolved_critical_count:'1'},
  {escalation_result:'EXTERNAL_RETENTION_ESCALATION_OPEN_CLAIM'},
  {escalated_at:'2026-11-04T21:00:00Z'}
])assert.equal((await escalationCheck(await sign({...escalationPayload,...delta},
  canonicalEscalation771,35))).status,'HOLD_ESCALATION_SCOPE');
assert.equal((await escalationCheck(await sign(escalationPayload,canonicalEscalation771,34))).status,
  'HOLD_ESCALATION_SIGNATURE');
const ready=await reconcile771({history,owner,attestation,dispute,escalation});
assert.equal(ready.final_owner_review_status,
  'READY_FOR_SEPARATE_MANUAL_FINAL_OWNER_BUSINESS_ACTION');
assert.deepEqual(ready.follow_ups.map(f=>f.code),
  ['MANUAL_EXTERNAL_OWNER_BUSINESS_ACTION_REQUIRED']);
for(const field of ['original_business_acceptance_recorded_by_app','external_case_reopened_by_app',
  'append_only_storage_written_by_app','original_source_storage_verified_by_app',
  'production_db_connected_by_app','closure_allowed','automatic_business_write',
  'customer_notifications_sent_by_app'])assert.equal(ready[field],false);
// An owner handoff dispute is independently recorded, not automatically cleared.
const disputedOwner=await ownerCheck(await sign({...ownerPayload,
  final_owner_decision:'REQUEST_HANDOFF_DISPUTE_RESOLUTION_REVIEW'},
  canonicalOwner771,0));
const disputeAttestation=await attestCheck(await sign({...attestPayload,
  final_owner_decision_receipt_sha256:disputedOwner.receipt_sha256,
  attestation_result:'OWNER_FINAL_DECISION_CONFLICT_HOLD'},
  canonicalAttest771,33),{owner:disputedOwner});
const referred=await disputeCheck(await sign({...disputePayload,
  final_owner_decision_receipt_sha256:disputedOwner.receipt_sha256,
  attestation_receipt_sha256:disputeAttestation.receipt_sha256,
  dispute_result:'EXTERNAL_HANDOFF_DISPUTE_REFERRED_CLAIM'},
  canonicalDispute771,34),{owner:disputedOwner,attestation:disputeAttestation});
assert.equal(referred.external_dispute_claim,true);
const disputeHold=await reconcile771({history,owner:disputedOwner,
  attestation:disputeAttestation,dispute:referred});
assert.equal(disputeHold.final_owner_review_status,'HOLD_FINAL_OWNER_DISPUTE_OR_RETENTION_ESCALATION');
assert.ok(disputeHold.follow_ups.some(f=>f.code==='ORIGINAL_OWNER_HANDOFF_DISPUTE_REQUESTED'));
assert.equal((await ownerCheck(signedOwner,{history:{...history,
  report:{...history.report,owner_register_status:'HOLD'}}})).status,
  'HOLD_FINAL_OWNER_SCOPE');
// A signed retention escalation can be tracked, but remains HOLD and cannot
// rewrite source custody or clear critical exceptions.
const retentionOwner=await ownerCheck(await sign({...ownerPayload,
  final_owner_decision:'REQUEST_RETENTION_EXCEPTION_ESCALATION_HOLD'},
  canonicalOwner771,0));
const retentionAttest=await attestCheck(await sign({...attestPayload,
  final_owner_decision_receipt_sha256:retentionOwner.receipt_sha256,
  attestation_result:'OWNER_FINAL_DECISION_CONFLICT_HOLD'},
  canonicalAttest771,33),{owner:retentionOwner});
const retentionDispute=await disputeCheck(await sign({...disputePayload,
  final_owner_decision_receipt_sha256:retentionOwner.receipt_sha256,
  attestation_receipt_sha256:retentionAttest.receipt_sha256,
  dispute_result:'HANDOFF_DISPUTE_EVIDENCE_CONFLICT_HOLD'},
  canonicalDispute771,34),{owner:retentionOwner,attestation:retentionAttest});
const retentionEscalation=await escalationCheck(await sign({...escalationPayload,
  final_owner_decision_receipt_sha256:retentionOwner.receipt_sha256,
  attestation_receipt_sha256:retentionAttest.receipt_sha256,
  dispute_review_receipt_sha256:retentionDispute.receipt_sha256,
  unresolved_critical_count:'2',
  escalation_result:'EXTERNAL_RETENTION_ESCALATION_OPEN_CLAIM'},
  canonicalEscalation771,35),{owner:retentionOwner,attestation:retentionAttest,
    dispute:retentionDispute});
assert.equal(retentionEscalation.escalation_open_claim,true);
const held=await reconcile771({history,owner:retentionOwner,
  attestation:retentionAttest,dispute:retentionDispute,escalation:retentionEscalation});
assert.equal(held.final_owner_review_status,'HOLD_FINAL_OWNER_DISPUTE_OR_RETENTION_ESCALATION');
assert.ok(held.follow_ups.some(f=>f.code==='CRITICAL_RETENTION_ESCALATION_UNRESOLVED'));
// The API must authenticate first and remain a read-only review surface.
let outbound=0;const beforeFetch=globalThis.fetch;
globalThis.fetch=async()=>{outbound++;throw Error('No unauthenticated source fetch');};
try{for(const fn of [onRequestGet,onRequestPost]){
  const post=fn===onRequestPost;
  const request=new Request('https://rosiedazzlers.ca/api/admin/economic_final_attestation_v771',{
    method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
      'Content-Type':'application/json'},...(post?{body:JSON.stringify(record)}:{})});
  assert.ok((await fn({request,env})).status>=400);
}assert.equal(outbound,0);}finally{globalThis.fetch=beforeFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-final-owner-v771','admin-economic-register-v770','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`));
assert.match(read('admin-catalog.html'),/admin-economic-final-owner-v771\.html/);
assert.match(read('admin-economic-register-v770.html'),/admin-economic-final-owner-v771\.html/);
assert.match(read('assets/economic-final-attestation-v771.js'),/credentials:'same-origin'/);
assert.match(read('docs/build771_final_owner_dispute_escalation.md'),/read-only/i);
console.log('Build 771 PASS: 36 signing identities, 27 pinned HTTPS issuers, original-owner manual attestation, external handoff dispute, critical retention escalation and no business writes.');
