import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {KEY_ROLES768,ORIGIN_ROLES768} from '../functions/api/_lib/economic-owner-acceptance-v768.js';
import {ROLES769} from '../functions/api/_lib/economic-handoff-retention-v769.js';
import {ROLES770} from '../functions/api/_lib/economic-owner-register-aging-v770.js';
import {ROLES771} from '../functions/api/_lib/economic-final-attestation-v771.js';
import {ROLES772} from '../functions/api/_lib/economic-resolution-sla-v772.js';
import {ROLES773} from '../functions/api/_lib/economic-disposition-renewal-v773.js';
import {ROLES774} from '../functions/api/_lib/economic-owner-handoff-aging-v774.js';
import {ROLES775,OWNER_FIELDS775,DECISION_FIELDS775,ESCALATION_FIELDS775,
  RETENTION_FIELDS775,canonicalOwner775,canonicalDecision775,canonicalEscalation775,
  canonicalRetention775,verifyOwner775,verifyDecision775,verifyEscalation775,
  verifyRetention775,receiptURL775,readReceipt775,reconcile775}
  from '../functions/api/_lib/economic-handoff-closure-retention-v775.js';

globalThis.crypto??=webcrypto;
const b64=x=>Buffer.from(x).toString('base64');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-05T01:30:00Z');
const env={},pairs=[];
const keyRoles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,
  ...ROLES773,...ROLES774,...ROLES775];
const originRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,
  ...ROLES773,...ROLES774,...ROLES775];
assert.equal(keyRoles.length,48);assert.equal(originRoles.length,39);
assert.equal(new Set(keyRoles).size,48);assert.equal(new Set(originRoles).size,39);
assert.deepEqual([OWNER_FIELDS775.length,DECISION_FIELDS775.length,
  ESCALATION_FIELDS775.length,RETENTION_FIELDS775.length],[17,16,19,21]);
for(const [index,role] of keyRoles.entries()){
  const kp=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  pairs.push(kp);
  env[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`]=
    b64(await crypto.subtle.exportKey('raw',kp.publicKey));
  env[`ROSIE_ECONOMIC_${role}_KEY_ID`]=`distinct-original-source-v775-${index}`;
}
for(const [index,role] of originRoles.entries())
  env[`ROSIE_ECONOMIC_${role}_BASE_URL`]=`https://original-witness-v775-${index}.example`;
const sign=async(p,canonical,index)=>({payload:p,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',pairs[index].privateKey,canonical(p)))});
const record={booking_id:'12345678-1234-1234-1234-123456789abc',
  source_record_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',
  change_ticket_id:'original-ticket-v775',execution_request_id:'original-request-v775'};
const scope={...record,trial_id:'original-trial-v775',
  production_project_ref:'original-project-v775'};
const b769={ctx:{record,prior:{ok:true,verified_scope:{
  trial_id:scope.trial_id,production_project_ref:scope.production_project_ref}}}};
const b770={history:b769};
const b771={history:b770};
const b772={history:b771,sla:{signed_at:'2026-11-04T22:00:00Z',
  sla_policy_sha256:'8'.repeat(64)}};
const b773={history:b772};
const history={history:b773,report:{ok:true,
  owner_renewal_handoff_status:'READY_FOR_SEPARATE_ORIGINAL_OWNER_RENEWAL_HANDOFF',
  packet_sha256:'a'.repeat(64)},
  owner:{signature_authenticated:true,receipt_sha256:'1'.repeat(64)},
  handoff:{signature_authenticated:true,acknowledged_claim:true,
    receipt_sha256:'2'.repeat(64),current_handoff_register_sha256:'3'.repeat(64)},
  aging:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'4'.repeat(64),current_aging_register_sha256:'5'.repeat(64),
    observed_age_hours:3,observed_open_disputes:0,source_alert_threshold_hours:72},
  closure:{signature_authenticated:true,ready_claim:true,
    receipt_sha256:'6'.repeat(64),current_retention_witness_register_sha256:'7'.repeat(64),
    critical_retention_exceptions:0,signed_at:'2026-11-05T00:20:00Z'}};
const ownerPayload={schema:'rosie-original-owner-handoff-closure-review-v775',...scope,
  original_owner_handoff_receipt_sha256:history.owner.receipt_sha256,
  handoff_acknowledgment_receipt_sha256:history.handoff.receipt_sha256,
  dispute_aging_receipt_sha256:history.aging.receipt_sha256,
  retention_closure_witness_receipt_sha256:history.closure.receipt_sha256,
  manual_review_choice:'REQUEST_SEPARATE_HANDOFF_CLOSURE_REVIEW',
  review_ticket_id:'original-owner-review-v775',owner_id:'original-owner-v775',
  issued_at:'2026-11-05T00:25:00Z',nonce:'c'.repeat(32),
  key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sign(ownerPayload,canonicalOwner775,0);
const ownerCheck=(envelope=signedOwner,extra={})=>
  verifyOwner775({env,history,envelope,now,...extra});
const owner=await ownerCheck();
assert.equal(owner.signature_authenticated,true);
assert.equal(owner.requests_review,true);
assert.equal(owner.original_owner_business_action_executed_by_app,false);
for(const change of [
  {original_owner_handoff_receipt_sha256:'f'.repeat(64)},
  {handoff_acknowledgment_receipt_sha256:'f'.repeat(64)},
  {dispute_aging_receipt_sha256:'f'.repeat(64)},
  {retention_closure_witness_receipt_sha256:'f'.repeat(64)},
  {manual_review_choice:'AUTO_CLOSE_RETENTION'},
  {issued_at:'2026-11-05T00:10:00Z'},{nonce:'bad'}
])assert.equal((await ownerCheck(await sign({...ownerPayload,...change},canonicalOwner775,0))).status,
  'HOLD_OWNER_CLOSURE_REVIEW_SCOPE');
assert.equal((await ownerCheck(await sign(ownerPayload,canonicalOwner775,45))).status,
  'HOLD_OWNER_CLOSURE_SIGNATURE');
assert.throws(()=>canonicalOwner775({...ownerPayload,bonus:'x'}),/Noncanonical/);
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_DISPUTE_AGING_ESCALATION_WITNESS_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_OWNER_CLOSURE_SIGNER_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_DISPUTE_AGING_ESCALATION_WITNESS_BASE_URL:
    env.ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL}})).status,
  'HOLD_OWNER_CLOSURE_ORIGIN_INDEPENDENCE');

const decisionPayload={schema:'rosie-independent-handoff-closure-decision-v775',...scope,
  owner_review_receipt_sha256:owner.receipt_sha256,
  prior_handoff_acknowledgment_receipt_sha256:history.handoff.receipt_sha256,
  prior_handoff_register_sha256:history.handoff.current_handoff_register_sha256,
  current_handoff_decision_register_sha256:'9'.repeat(64),
  decision_case_id:'original-decision-case-v775',
  handoff_decision_result:'HANDOFF_CLOSURE_DECISION_REGISTER_CLEAR_CLAIM',
  observed_at:'2026-11-05T00:30:00Z',witness_id:'independent-decision-v775',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_HANDOFF_CLOSURE_DECISION_WITNESS_KEY_ID};
const signedDecision=await sign(decisionPayload,canonicalDecision775,45);
const decisionCheck=(envelope=signedDecision,extra={})=>verifyDecision775({env,history,owner,
  readback:{status:'SIGNED_DECISION_READBACK',envelope},now,...extra});
const decision=await decisionCheck();
assert.equal(decision.signature_authenticated,true);assert.equal(decision.clean_claim,true);
assert.equal(decision.actual_handoff_or_closure_written_by_app,false);
assert.ok(receiptURL775(env,'decision',history,owner).includes('owner_review_receipt_sha256='));
assert.equal((await readReceipt775(env,'decision',history,owner,null,null,
  async()=>new Response(JSON.stringify(signedDecision)))).status,'SIGNED_DECISION_READBACK');
for(const change of [{prior_handoff_acknowledgment_receipt_sha256:'f'.repeat(64)},
  {prior_handoff_register_sha256:'f'.repeat(64)},
  {handoff_decision_result:'AUTO_CLOSED_SOURCE'},
  {observed_at:'2026-11-05T00:15:00Z'}])
  assert.equal((await decisionCheck(await sign({...decisionPayload,...change},canonicalDecision775,45))).status,
    'HOLD_DECISION_SCOPE');
assert.equal((await decisionCheck(await sign(decisionPayload,canonicalDecision775,46))).status,
  'HOLD_DECISION_SIGNATURE');

const escalationPayload={schema:'rosie-independent-dispute-aging-escalation-v775',...scope,
  owner_review_receipt_sha256:owner.receipt_sha256,
  decision_register_receipt_sha256:decision.receipt_sha256,
  prior_dispute_aging_receipt_sha256:history.aging.receipt_sha256,
  prior_dispute_aging_register_sha256:history.aging.current_aging_register_sha256,
  current_aging_escalation_register_sha256:'a'.repeat(64),
  elapsed_hours:'3',source_alert_threshold_hours:'72',open_disputes:'0',
  aging_escalation_result:'NO_OPEN_AGING_ESCALATION_CLAIM',
  observed_at:'2026-11-05T00:35:00Z',witness_id:'independent-escalation-v775',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_DISPUTE_AGING_ESCALATION_WITNESS_KEY_ID};
const signedEscalation=await sign(escalationPayload,canonicalEscalation775,46);
const escalationCheck=(envelope=signedEscalation,extra={})=>
  verifyEscalation775({env,history,owner,decision,
    readback:{status:'SIGNED_ESCALATION_READBACK',envelope},now,...extra});
const escalation=await escalationCheck();
assert.equal(escalation.signature_authenticated,true);assert.equal(escalation.clean_claim,true);
assert.equal(escalation.source_dispute_escalation_executed_by_app,false);
for(const change of [{decision_register_receipt_sha256:'f'.repeat(64)},
  {prior_dispute_aging_register_sha256:'f'.repeat(64)},
  {source_alert_threshold_hours:'73'},{elapsed_hours:'2'},
  {open_disputes:'1'},{observed_at:'2026-11-05T00:25:00Z'}])
  assert.equal((await escalationCheck(await sign({...escalationPayload,...change},canonicalEscalation775,46))).status,
    'HOLD_ESCALATION_SCOPE');
assert.equal((await escalationCheck(await sign(escalationPayload,canonicalEscalation775,47))).status,
  'HOLD_ESCALATION_SIGNATURE');

const retentionPayload={schema:'rosie-independent-retention-continuity-v775',...scope,
  owner_review_receipt_sha256:owner.receipt_sha256,
  decision_register_receipt_sha256:decision.receipt_sha256,
  aging_escalation_receipt_sha256:escalation.receipt_sha256,
  prior_closure_witness_receipt_sha256:history.closure.receipt_sha256,
  prior_retention_witness_register_sha256:
    history.closure.current_retention_witness_register_sha256,
  original_retention_policy_sha256:history.history.history.sla.sla_policy_sha256,
  retained_source_history_sha256:'b'.repeat(64),
  current_retention_continuity_register_sha256:'d'.repeat(64),
  critical_exceptions:'0',
  retention_continuity_result:'SOURCE_RETENTION_CONTINUITY_PRESERVED_CLAIM',
  witness_expires_at:'2026-11-20T00:00:00Z',
  observed_at:'2026-11-05T00:40:00Z',witness_id:'independent-retention-v775',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_SOURCE_RETENTION_CONTINUITY_WITNESS_KEY_ID};
const signedRetention=await sign(retentionPayload,canonicalRetention775,47);
const retentionCheck=(envelope=signedRetention,extra={})=>verifyRetention775({env,history,
  owner,decision,escalation,readback:{status:'SIGNED_RETENTION_READBACK',envelope},now,...extra});
const retention=await retentionCheck();
assert.equal(retention.signature_authenticated,true);assert.equal(retention.preserved_claim,true);
assert.equal(retention.original_source_archival_or_deletion_by_app,false);
for(const change of [{aging_escalation_receipt_sha256:'f'.repeat(64)},
  {prior_retention_witness_register_sha256:'f'.repeat(64)},
  {original_retention_policy_sha256:'f'.repeat(64)},
  {critical_exceptions:'1'},{witness_expires_at:'2027-03-01T00:00:00Z'},
  {retention_continuity_result:'DELETE_SOURCE_HISTORY'},
  {observed_at:'2026-11-05T00:25:00Z'}])
  assert.equal((await retentionCheck(await sign({...retentionPayload,...change},canonicalRetention775,47))).status,
    'HOLD_RETENTION_SCOPE');
assert.equal((await retentionCheck(await sign(retentionPayload,canonicalRetention775,46))).status,
  'HOLD_RETENTION_SIGNATURE');
const ready=await reconcile775({history,owner,decision,escalation,retention});
assert.equal(ready.handoff_closure_decision_status,
  'READY_FOR_SEPARATE_ORIGINAL_OWNER_HANDOFF_CLOSURE_DECISION');
assert.deepEqual(ready.follow_ups.map(f=>f.code),
  ['SEPARATE_ORIGINAL_OWNER_AND_CUSTODIAN_ACTION_REQUIRED']);
for(const flag of ['original_owner_business_signoff_by_app','external_handoff_executed_by_app',
  'original_dispute_closed_by_app','source_retention_modified_by_app',
  'production_database_written_by_app','source_archive_modified_by_app',
  'append_only_audit_written_by_app','notification_sent_by_app',
  'automatic_business_action','closure_allowed'])assert.equal(ready[flag],false);
const heldOwner=await ownerCheck(await sign({...ownerPayload,
  manual_review_choice:'HOLD_SOURCE_RETENTION'},canonicalOwner775,0));
assert.equal((await reconcile775({history,owner:heldOwner,decision,escalation,retention})).handoff_closure_decision_status,
  'HOLD_HANDOFF_DECISION_AGING_OR_RETENTION_CONTINUITY');
const pending=await decisionCheck(await sign({...decisionPayload,
  handoff_decision_result:'HANDOFF_CLOSURE_DECISION_PENDING_CLAIM'},canonicalDecision775,45));
assert.equal((await reconcile775({history,owner,decision:pending,escalation,retention})).handoff_closure_decision_status,
  'HOLD_HANDOFF_DECISION_AGING_OR_RETENTION_CONTINUITY');
const escalated=await escalationCheck(await sign({...escalationPayload,
  elapsed_hours:'80',open_disputes:'1',
  aging_escalation_result:'DISPUTE_AGING_ESCALATED_CLAIM'},canonicalEscalation775,46));
assert.equal(escalated.signature_authenticated,true);assert.equal(escalated.clean_claim,false);
assert.equal((await reconcile775({history,owner,decision,escalation:escalated,retention:null})).handoff_closure_decision_status,
  'HOLD_HANDOFF_DECISION_AGING_OR_RETENTION_CONTINUITY');
for(const stem of ['admin-economic-handoff-closure-v775','admin-economic-owner-handoff-aging-v774',
  'admin-catalog'])assert.equal(read(`${stem}.html`),read(`${stem}/index.html`));
assert.match(read('admin-catalog.html'),/admin-economic-handoff-closure-v775\.html/);
assert.match(read('admin-economic-owner-handoff-aging-v774.html'),
  /admin-economic-handoff-closure-v775\.html/);
assert.match(read('assets/economic-handoff-closure-v775.js'),/credentials:'same-origin'/);
assert.match(read('docs/build775_handoff_decision_aging_escalation_source_retention.md'),/read-only/i);
assert.match(read('functions/api/admin/economic_handoff_closure_v775.js'),/reviewHandoffAging774/);
if(existsSync(new URL('../functions/api/_lib/staff-auth.js',import.meta.url))){
  const api=await import('../functions/api/admin/economic_handoff_closure_v775.js');
  const before=globalThis.fetch;let outbound=0;
  try{globalThis.fetch=async()=>{outbound++;throw Error('Unexpected outbound call');};
    for(const fn of [api.onRequestGet,api.onRequestPost]){
      const post=fn===api.onRequestPost;
      const request=new Request('https://rosiedazzlers.ca/api/admin/economic_handoff_closure_v775',{
        method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
          'Content-Type':'application/json'},...(post?{body:JSON.stringify(record)}:{})});
      assert.ok((await fn({request,env})).status>=400);
    }assert.equal(outbound,0);
  }finally{globalThis.fetch=before;}
  for(const fn of [api.onRequestPut,api.onRequestPatch,api.onRequestDelete])
    assert.equal((await fn()).status,405);
}
console.log('Build 775 PASS: 48 signer identities, 39 pinned HTTPS issuers, decision register, escalation, retention continuity, owner HOLD and no business writes.');
