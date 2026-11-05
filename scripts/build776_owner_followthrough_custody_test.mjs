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
import {ROLES775} from '../functions/api/_lib/economic-handoff-closure-retention-v775.js';
import {ROLES776,OWNER_FIELDS776,FOLLOWTHROUGH_FIELDS776,EXCEPTION_FIELDS776,
  CUSTODY_FIELDS776,canonicalOwner776,canonicalFollowthrough776,
  canonicalException776,canonicalCustody776,verifyOwner776,verifyFollowthrough776,
  verifyException776,verifyCustody776,receiptURL776,readReceipt776,reconcile776}
  from '../functions/api/_lib/economic-owner-followthrough-retention-v776.js';

globalThis.crypto??=webcrypto;
const b64=a=>Buffer.from(a).toString('base64');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-05T02:00:00Z');
const env={},pairs=[];
const keyRoles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,
  ...ROLES773,...ROLES774,...ROLES775,...ROLES776];
const originRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771,
  ...ROLES772,...ROLES773,...ROLES774,...ROLES775,...ROLES776];
assert.equal(keyRoles.length,51);assert.equal(originRoles.length,42);
assert.equal(new Set(keyRoles).size,51);assert.equal(new Set(originRoles).size,42);
assert.deepEqual([OWNER_FIELDS776.length,FOLLOWTHROUGH_FIELDS776.length,
  EXCEPTION_FIELDS776.length,CUSTODY_FIELDS776.length],[17,16,18,20]);
for(const [index,role] of keyRoles.entries()){
  const kp=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  pairs.push(kp);
  env[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`]=b64(await crypto.subtle.exportKey('raw',kp.publicKey));
  env[`ROSIE_ECONOMIC_${role}_KEY_ID`]=`distinct-source-owner-v776-${index}`;
}
for(const [index,role] of originRoles.entries())
  env[`ROSIE_ECONOMIC_${role}_BASE_URL`]=`https://original-source-owner-v776-${index}.example`;
const sign=async(p,canonical,index)=>({payload:p,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',pairs[index].privateKey,canonical(p)))});
const record={booking_id:'12345678-1234-1234-1234-123456789abc',
  source_record_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',
  change_ticket_id:'original-ticket-v776',execution_request_id:'original-request-v776'};
const scope={...record,trial_id:'original-trial-v776',production_project_ref:'project-v776'};
const b769={ctx:{record,prior:{ok:true,verified_scope:{
  trial_id:scope.trial_id,production_project_ref:scope.production_project_ref}}}};
const b770={history:b769},b771={history:b770},b772={history:b771},
  b773={history:b772},b774={history:b773};
const history={history:b774,
  report:{ok:true,handoff_closure_decision_status:
    'READY_FOR_SEPARATE_ORIGINAL_OWNER_HANDOFF_CLOSURE_DECISION',
    packet_sha256:'a'.repeat(64)},
  owner:{signature_authenticated:true,requests_review:true,receipt_sha256:'1'.repeat(64)},
  decision:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'2'.repeat(64),current_handoff_decision_register_sha256:'3'.repeat(64)},
  escalation:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'4'.repeat(64),observed_elapsed_hours:3},
  retention:{signature_authenticated:true,preserved_claim:true,
    receipt_sha256:'5'.repeat(64),retained_source_history_sha256:'6'.repeat(64),
    signed_at:'2026-11-05T00:40:00Z',
    witness_expires_at:'2026-11-20T00:00:00Z',critical_count:0}};
// Build 775 predecessor original aging threshold remains source-bound.
history.history.aging={source_alert_threshold_hours:72};
const ownerPayload={schema:'rosie-original-owner-closure-followthrough-review-v776',...scope,
  prior_owner_closure_review_sha256:history.owner.receipt_sha256,
  handoff_decision_receipt_sha256:history.decision.receipt_sha256,
  aging_escalation_receipt_sha256:history.escalation.receipt_sha256,
  retention_continuity_receipt_sha256:history.retention.receipt_sha256,
  manual_review_choice:'REQUEST_SEPARATE_OWNER_FOLLOWTHROUGH_REVIEW',
  review_ticket_id:'original-followthrough-ticket-v776',owner_id:'original-owner-v776',
  issued_at:'2026-11-05T01:00:00Z',nonce:'a'.repeat(32),
  key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sign(ownerPayload,canonicalOwner776,0);
const ownerCheck=(envelope=signedOwner,extra={})=>verifyOwner776({env,history,envelope,now,...extra});
const owner=await ownerCheck();
assert.equal(owner.signature_authenticated,true,JSON.stringify(owner));assert.equal(owner.requests_review,true);
assert.equal(owner.owner_business_decision_executed_by_app,false);
for(const change of [{prior_owner_closure_review_sha256:'f'.repeat(64)},
  {handoff_decision_receipt_sha256:'f'.repeat(64)},
  {aging_escalation_receipt_sha256:'f'.repeat(64)},
  {retention_continuity_receipt_sha256:'f'.repeat(64)},
  {manual_review_choice:'AUTO_COMPLETE_CLOSURE'},
  {issued_at:'2026-11-04T23:59:00Z'},{nonce:'bad'}])
  assert.equal((await ownerCheck(await sign({...ownerPayload,...change},canonicalOwner776,0))).status,
    'HOLD_OWNER_FOLLOWTHROUGH_SCOPE');
assert.equal((await ownerCheck(await sign(ownerPayload,canonicalOwner776,48))).status,
  'HOLD_OWNER_FOLLOWTHROUGH_SIGNATURE');
assert.throws(()=>canonicalOwner776({...ownerPayload,extra:'false'}),/Noncanonical/);
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_RETENTION_CUSTODY_RENEWAL_WITNESS_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_OWNER_FOLLOWTHROUGH_SIGNER_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_RETENTION_CUSTODY_RENEWAL_WITNESS_BASE_URL:
    env.ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL}})).status,
  'HOLD_OWNER_FOLLOWTHROUGH_ORIGIN_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{history:{...history,
  retention:{...history.retention,witness_expires_at:'2026-11-05T01:00:00Z'}}})).status,
  'HOLD_OWNER_FOLLOWTHROUGH_SCOPE');

const followPayload={schema:'rosie-independent-owner-closure-followthrough-v776',...scope,
  owner_review_receipt_sha256:owner.receipt_sha256,
  prior_decision_receipt_sha256:history.decision.receipt_sha256,
  prior_decision_register_sha256:history.decision.current_handoff_decision_register_sha256,
  current_followthrough_register_sha256:'7'.repeat(64),
  decision_case_id:'original-closure-decision-v776',
  followthrough_result:'FOLLOWTHROUGH_REGISTER_CURRENT_CLAIM',
  observed_at:'2026-11-05T01:10:00Z',witness_id:'followthrough-witness-v776',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_OWNER_CLOSURE_FOLLOWTHROUGH_WITNESS_KEY_ID};
const signedFollow=await sign(followPayload,canonicalFollowthrough776,48);
const followCheck=(envelope=signedFollow,extra={})=>
  verifyFollowthrough776({env,history,owner,
    readback:{status:'SIGNED_FOLLOWTHROUGH_READBACK',envelope},now,...extra});
const followthrough=await followCheck();
assert.equal(followthrough.signature_authenticated,true);
assert.equal(followthrough.current_claim,true);
assert.equal(followthrough.owner_action_executed_by_app,false);
assert.ok(receiptURL776(env,'followthrough',history,owner).includes('owner_review_receipt_sha256='));
assert.equal((await readReceipt776(env,'followthrough',history,owner,null,null,
  async()=>new Response(JSON.stringify(signedFollow)))).status,'SIGNED_FOLLOWTHROUGH_READBACK');
for(const change of [{prior_decision_receipt_sha256:'f'.repeat(64)},
  {prior_decision_register_sha256:'f'.repeat(64)},
  {followthrough_result:'AUTO_CLOSED'},
  {observed_at:'2026-11-05T00:55:00Z'}])
  assert.equal((await followCheck(await sign({...followPayload,...change},canonicalFollowthrough776,48))).status,
    'HOLD_FOLLOWTHROUGH_SCOPE');
assert.equal((await followCheck(await sign(followPayload,canonicalFollowthrough776,49))).status,
  'HOLD_FOLLOWTHROUGH_SIGNATURE');

const exceptionPayload={schema:'rosie-independent-aging-exception-disposition-v776',...scope,
  owner_review_receipt_sha256:owner.receipt_sha256,
  followthrough_receipt_sha256:followthrough.receipt_sha256,
  prior_aging_escalation_receipt_sha256:history.escalation.receipt_sha256,
  observed_elapsed_hours:'3',source_alert_threshold_hours:'72',open_exception_count:'0',
  current_exception_register_sha256:'8'.repeat(64),
  aging_exception_result:'NO_OPEN_AGING_EXCEPTION_CLAIM',
  observed_at:'2026-11-05T01:20:00Z',witness_id:'exception-witness-v776',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_AGING_EXCEPTION_DISPOSITION_WITNESS_KEY_ID};
const signedException=await sign(exceptionPayload,canonicalException776,49);
const exceptionCheck=(envelope=signedException,extra={})=>
  verifyException776({env,history,owner,followthrough,
    readback:{status:'SIGNED_EXCEPTION_READBACK',envelope},now,...extra});
const exception=await exceptionCheck();
assert.equal(exception.signature_authenticated,true);assert.equal(exception.clear_claim,true);
assert.equal(exception.original_escalation_or_case_closed_by_app,false);
for(const change of [{followthrough_receipt_sha256:'f'.repeat(64)},
  {prior_aging_escalation_receipt_sha256:'f'.repeat(64)},
  {source_alert_threshold_hours:'73'},{observed_elapsed_hours:'2'},
  {open_exception_count:'1'},{aging_exception_result:'AUTO_RESOLVED'}])
  assert.equal((await exceptionCheck(await sign({...exceptionPayload,...change},canonicalException776,49))).status,
    'HOLD_EXCEPTION_SCOPE');
assert.equal((await exceptionCheck(await sign(exceptionPayload,canonicalException776,50))).status,
  'HOLD_EXCEPTION_SIGNATURE');
const escalated=await exceptionCheck(await sign({...exceptionPayload,
  open_exception_count:'1',observed_elapsed_hours:'80',
  aging_exception_result:'AGING_EXCEPTION_ESCALATION_OPEN_CLAIM'},
  canonicalException776,49));
assert.equal(escalated.signature_authenticated,true);
assert.equal(escalated.clear_claim,false);

const custodyPayload={schema:'rosie-independent-retention-custody-renewal-v776',...scope,
  owner_review_receipt_sha256:owner.receipt_sha256,
  followthrough_receipt_sha256:followthrough.receipt_sha256,
  exception_disposition_receipt_sha256:exception.receipt_sha256,
  prior_retention_continuity_receipt_sha256:history.retention.receipt_sha256,
  prior_retained_source_history_sha256:history.retention.retained_source_history_sha256,
  retained_source_history_sha256:history.retention.retained_source_history_sha256,
  current_custody_renewal_register_sha256:'9'.repeat(64),critical_exceptions:'0',
  custody_expires_at:'2026-11-25T01:00:00Z',
  custody_renewal_result:'RETENTION_CUSTODY_RENEWAL_CURRENT_CLAIM',
  observed_at:'2026-11-05T01:30:00Z',witness_id:'custody-witness-v776',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_RETENTION_CUSTODY_RENEWAL_WITNESS_KEY_ID};
const signedCustody=await sign(custodyPayload,canonicalCustody776,50);
const custodyCheck=(envelope=signedCustody,extra={})=>
  verifyCustody776({env,history,owner,followthrough,exception,
    readback:{status:'SIGNED_CUSTODY_READBACK',envelope},now,...extra});
const custody=await custodyCheck();
assert.equal(custody.signature_authenticated,true);assert.equal(custody.renewed_claim,true);
assert.equal(custody.source_retention_modified_by_app,false);
for(const change of [{exception_disposition_receipt_sha256:'f'.repeat(64)},
  {prior_retained_source_history_sha256:'f'.repeat(64)},
  {retained_source_history_sha256:'f'.repeat(64)},
  {critical_exceptions:'1'},{custody_expires_at:'2027-03-01T00:00:00Z'},
  {custody_renewal_result:'DELETE_SOURCE'}, {observed_at:'2026-11-05T01:15:00Z'}])
  assert.equal((await custodyCheck(await sign({...custodyPayload,...change},canonicalCustody776,50))).status,
    'HOLD_CUSTODY_SCOPE');
assert.equal((await custodyCheck(await sign(custodyPayload,canonicalCustody776,49))).status,
  'HOLD_CUSTODY_SIGNATURE');
const ready=await reconcile776({history,owner,followthrough,exception,custody});
assert.equal(ready.owner_followthrough_status,
  'READY_FOR_SEPARATE_ORIGINAL_OWNER_CUSTODIAN_FOLLOWTHROUGH_DECISION');
assert.deepEqual(ready.follow_ups.map(f=>f.code),
  ['SEPARATE_ORIGINAL_OWNER_CUSTODIAN_ACTION_REQUIRED']);
for(const flag of ['original_owner_business_signoff_by_app','external_dispute_closed_by_app',
  'original_custody_enforced_by_app','source_retention_modified_by_app',
  'production_database_written_by_app','source_archive_modified_by_app',
  'append_only_audit_written_by_app','notification_sent_by_app',
  'automatic_business_action','closure_allowed'])assert.equal(ready[flag],false);
const held=await ownerCheck(await sign({...ownerPayload,
  manual_review_choice:'HOLD_RETENTION_CUSTODY'},canonicalOwner776,0));
assert.equal((await reconcile776({history,owner:held,followthrough,exception,custody})).owner_followthrough_status,
  'HOLD_OWNER_FOLLOWTHROUGH_AGING_OR_RETENTION_CUSTODY');
assert.equal((await reconcile776({history,owner,followthrough,exception:escalated,custody:null})).owner_followthrough_status,
  'HOLD_OWNER_FOLLOWTHROUGH_AGING_OR_RETENTION_CUSTODY');
for(const stem of ['admin-economic-owner-followthrough-v776',
  'admin-economic-handoff-closure-v775','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`));
assert.match(read('admin-catalog.html'),/admin-economic-owner-followthrough-v776\.html/);
assert.match(read('admin-economic-handoff-closure-v775.html'),
  /admin-economic-owner-followthrough-v776\.html/);
assert.match(read('assets/economic-owner-followthrough-v776.js'),/credentials:'same-origin'/);
assert.match(read('docs/build776_owner_followthrough_aging_custody_ci_consolidation.md'),/read-only/i);
assert.match(read('functions/api/admin/economic_owner_followthrough_v776.js'),/reviewHandoffClosure775/);
if(existsSync(new URL('../functions/api/_lib/staff-auth.js',import.meta.url))){
  const api=await import('../functions/api/admin/economic_owner_followthrough_v776.js');
  const before=globalThis.fetch;let outbound=0;
  try{globalThis.fetch=async()=>{outbound++;throw Error('Unexpected outbound call');};
    for(const fn of [api.onRequestGet,api.onRequestPost]){
      const post=fn===api.onRequestPost;
      const request=new Request('https://rosiedazzlers.ca/api/admin/economic_owner_followthrough_v776',{
        method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
          'Content-Type':'application/json'},...(post?{body:JSON.stringify(record)}:{})});
      assert.ok((await fn({request,env})).status>=400);
    }assert.equal(outbound,0);
  }finally{globalThis.fetch=before;}
  for(const fn of [api.onRequestPut,api.onRequestPatch,api.onRequestDelete])
    assert.equal((await fn()).status,405);
}
console.log('Build 776 PASS: 51 original signer identities, 42 distinct HTTPS issuers, owner follow-through, aging exceptions, custody renewal, HOLD and no business writes.');
