import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {KEY_ROLES768,ORIGIN_ROLES768} from '../functions/api/_lib/economic-owner-acceptance-v768.js';
import {ROLES769} from '../functions/api/_lib/economic-handoff-retention-v769.js';
import {ROLES770} from '../functions/api/_lib/economic-owner-register-aging-v770.js';
import {ROLES771} from '../functions/api/_lib/economic-final-attestation-v771.js';
import {ROLES772,OWNER_FIELDS772,RESOLUTION_FIELDS772,SIGNOFF_FIELDS772,SLA_FIELDS772,
  canonicalOwner772,canonicalResolution772,canonicalSignoff772,canonicalSLA772,
  verifyOwner772,verifyResolution772,verifySignoff772,verifySLA772,
  receiptURL772,readReceipt772,reconcile772}
  from '../functions/api/_lib/economic-resolution-sla-v772.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_resolution_sla_v772.js';

globalThis.crypto??=webcrypto;
const b64=b=>Buffer.from(b).toString('base64');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-04T22:15:00Z');
const env={},pairs=[];
const roles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772];
for(const [index,role] of roles.entries()){
  const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  pairs.push(pair);
  env[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`]=
    b64(await crypto.subtle.exportKey('raw',pair.publicKey));
  env[`ROSIE_ECONOMIC_${role}_KEY_ID`]=`distinct-original-evidence-v772-${index}`;
}
const originRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772];
for(const [index,role] of originRoles.entries())
  env[`ROSIE_ECONOMIC_${role}_BASE_URL`]=`https://independent-evidence-v772-${index}.example`;
assert.equal(roles.length,39);assert.equal(originRoles.length,30);
assert.equal(OWNER_FIELDS772.length,17);assert.equal(RESOLUTION_FIELDS772.length,17);
assert.equal(SIGNOFF_FIELDS772.length,17);assert.equal(SLA_FIELDS772.length,22);
const sig=async(payload,canonical,index)=>({payload,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',pairs[index].privateKey,
    canonical(payload)))});
const record={booking_id:'12345678-1234-1234-1234-123456789abc',
  source_record_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',
  change_ticket_id:'external-change-772',execution_request_id:'original-request-772'};
const scope={...record,trial_id:'original-trial-772',
  production_project_ref:'original-project-772'};
const history={report:{ok:true,
  final_owner_review_status:'READY_FOR_SEPARATE_MANUAL_FINAL_OWNER_BUSINESS_ACTION',
  packet_sha256:'a'.repeat(64)},
  history:{report:{ok:true},history:{ctx:{record,prior:{ok:true,
    verified_scope:{trial_id:scope.trial_id,
      production_project_ref:scope.production_project_ref}}},
    retention:{signature_authenticated:true,retention_policy_sha256:'b'.repeat(64)}},
    aging:{signature_authenticated:true,clean_claim:true,
      exception_register_sha256:'6'.repeat(64),
      source_alert_threshold_hours:72,oldest_open_exception_age_hours:0}},
  owner:{signature_authenticated:true,receipt_sha256:'1'.repeat(64)},
  attestation:{signature_authenticated:true,manual_decision_witnessed:true,
    receipt_sha256:'2'.repeat(64)},
  dispute:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'3'.repeat(64),dispute_register_sha256:'4'.repeat(64)},
  escalation:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'5'.repeat(64),
    current_escalation_register_sha256:'7'.repeat(64),
    unresolved_critical_count:0,signed_at:'2026-11-04T21:00:00Z'}};
const ownerPayload={schema:'rosie-original-owner-final-signoff-continuity-v772',
  ...scope,final_owner_decision_receipt_sha256:history.owner.receipt_sha256,
  final_decision_attestation_receipt_sha256:history.attestation.receipt_sha256,
  handoff_dispute_receipt_sha256:history.dispute.receipt_sha256,
  retention_escalation_receipt_sha256:history.escalation.receipt_sha256,
  continuity_decision:'REQUEST_SEPARATE_FINAL_OWNER_SIGNOFF_REVIEW',
  owner_continuity_ticket_id:'original-continuity-ticket-772',
  owner_id:'original-owner-review-772',issued_at:'2026-11-04T21:05:00Z',
  nonce:'c'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sig(ownerPayload,canonicalOwner772,0);
const ownerCheck=(envelope=signedOwner,extra={})=>
  verifyOwner772({env,history,envelope,now,...extra});
const owner=await ownerCheck();
assert.equal(owner.signature_authenticated,true);
assert.equal(owner.requests_final_manual_review,true);
assert.equal(owner.business_signoff_executed_by_app,false);
for(const delta of [
  {final_owner_decision_receipt_sha256:'f'.repeat(64)},
  {final_decision_attestation_receipt_sha256:'f'.repeat(64)},
  {handoff_dispute_receipt_sha256:'f'.repeat(64)},
  {retention_escalation_receipt_sha256:'f'.repeat(64)},
  {continuity_decision:'APPROVE_PRODUCTION_CLOSURE_NOW'},
  {issued_at:'2026-11-04T20:50:00Z'},
  {nonce:'bad'}
])assert.equal((await ownerCheck(await sig({...ownerPayload,...delta},
  canonicalOwner772,0))).status,'HOLD_OWNER_CONTINUITY_SCOPE');
assert.equal((await ownerCheck(await sig(ownerPayload,canonicalOwner772,36))).status,
  'HOLD_OWNER_CONTINUITY_SIGNATURE');
assert.throws(()=>canonicalOwner772({...ownerPayload,bonus:'bad'}),/Noncanonical/);
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_RETENTION_SLA_WITNESS_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_OWNER_CONTINUITY_SIGNER_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_EXTERNAL_RESOLUTION_WITNESS_BASE_URL:
    env.ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL}})).status,
  'HOLD_OWNER_CONTINUITY_ORIGIN_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_OWNER_SIGNOFF_CONTINUITY_WITNESS_BASE_URL:
    'http://127.0.0.1'}})).status,'HOLD_OWNER_CONTINUITY_ORIGIN_INDEPENDENCE');
const resolutionPayload={schema:'rosie-independent-external-resolution-receipt-v772',
  ...scope,owner_continuity_receipt_sha256:owner.receipt_sha256,
  handoff_dispute_receipt_sha256:history.dispute.receipt_sha256,
  retention_escalation_receipt_sha256:history.escalation.receipt_sha256,
  original_dispute_register_sha256:history.dispute.dispute_register_sha256,
  current_resolution_register_sha256:'8'.repeat(64),
  resolution_case_id:'original-external-dispute-772',
  resolution_result:'INDEPENDENT_HANDOFF_RESOLUTION_VERIFIED_CLAIM',
  resolved_at:'2026-11-04T21:10:00Z',
  witness_id:'independent-resolution-witness-772',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_EXTERNAL_RESOLUTION_WITNESS_KEY_ID};
const signedResolution=await sig(resolutionPayload,canonicalResolution772,36);
const resolutionCheck=(envelope=signedResolution,extra={})=>
  verifyResolution772({env,history,owner,
    readback:{status:'SIGNED_RESOLUTION_READBACK',envelope},now,...extra});
const resolution=await resolutionCheck();
assert.equal(resolution.signature_authenticated,true);
assert.equal(resolution.clean_claim,true);
assert.equal(resolution.external_dispute_closed_by_app,false);
assert.ok(receiptURL772(env,'resolution',history,owner)
  .includes('owner_continuity_receipt_sha256='));
assert.equal((await readReceipt772(env,'resolution',history,owner,null,null,
  async()=>new Response(JSON.stringify(signedResolution)))).status,
  'SIGNED_RESOLUTION_READBACK');
for(const delta of [
  {handoff_dispute_receipt_sha256:'f'.repeat(64)},
  {original_dispute_register_sha256:'f'.repeat(64)},
  {resolution_result:'ORIGINAL_CASE_AUTO_CLOSED'},
  {resolved_at:'2026-11-04T21:00:00Z'}
])assert.equal((await resolutionCheck(await sig({...resolutionPayload,...delta},
  canonicalResolution772,36))).status,'HOLD_RESOLUTION_SCOPE');
assert.equal((await resolutionCheck(await sig(resolutionPayload,
  canonicalResolution772,37))).status,'HOLD_RESOLUTION_SIGNATURE');
const signoffPayload={schema:'rosie-independent-owner-signoff-continuity-v772',
  ...scope,owner_continuity_receipt_sha256:owner.receipt_sha256,
  resolution_receipt_sha256:resolution.receipt_sha256,
  original_final_decision_receipt_sha256:history.owner.receipt_sha256,
  original_attestation_receipt_sha256:history.attestation.receipt_sha256,
  continuity_register_before_sha256:'9'.repeat(64),
  continuity_register_after_sha256:'a'.repeat(64),
  continuity_result:'ORIGINAL_OWNER_SIGNOFF_CONTINUITY_WITNESSED_CLAIM',
  witnessed_at:'2026-11-04T21:15:00Z',
  witness_id:'independent-signoff-witness-772',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_OWNER_SIGNOFF_CONTINUITY_WITNESS_KEY_ID};
const signedSignoff=await sig(signoffPayload,canonicalSignoff772,37);
const signoffCheck=(envelope=signedSignoff,extra={})=>
  verifySignoff772({env,history,owner,resolution,
    readback:{status:'SIGNED_SIGNOFF_READBACK',envelope},now,...extra});
const signoff=await signoffCheck();
assert.equal(signoff.signature_authenticated,true);
assert.equal(signoff.continuity_witnessed,true);
assert.equal(signoff.original_owner_final_signoff_executed_by_app,false);
assert.ok(receiptURL772(env,'signoff',history,owner,resolution)
  .includes('resolution_receipt_sha256='));
for(const delta of [
  {resolution_receipt_sha256:'f'.repeat(64)},
  {original_attestation_receipt_sha256:'f'.repeat(64)},
  {continuity_register_after_sha256:'9'.repeat(64)},
  {continuity_result:'ORIGINAL_BUSINESS_SIGNOFF_EXECUTED'},
  {witnessed_at:'2026-11-04T21:00:00Z'}
])assert.equal((await signoffCheck(await sig({...signoffPayload,...delta},
  canonicalSignoff772,37))).status,'HOLD_SIGNOFF_SCOPE');
assert.equal((await signoffCheck(await sig(signoffPayload,canonicalSignoff772,38))).status,
  'HOLD_SIGNOFF_SIGNATURE');
const slaPayload={schema:'rosie-independent-retention-escalation-sla-v772',
  ...scope,owner_continuity_receipt_sha256:owner.receipt_sha256,
  resolution_receipt_sha256:resolution.receipt_sha256,
  signoff_continuity_receipt_sha256:signoff.receipt_sha256,
  retention_escalation_receipt_sha256:history.escalation.receipt_sha256,
  original_exception_register_sha256:history.history.aging.exception_register_sha256,
  current_escalation_register_sha256:history.escalation.current_escalation_register_sha256,
  sla_policy_sha256:'b'.repeat(64),sla_case_id:'original-sla-case-772',
  elapsed_hours:'0',target_hours:'72',critical_exceptions_remaining:'0',
  sla_result:'WITHIN_ORIGINAL_RETENTION_SLA_CLAIM',
  inspected_at:'2026-11-04T21:20:00Z',
  witness_id:'independent-retention-sla-witness-772',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_RETENTION_SLA_WITNESS_KEY_ID};
const signedSLA=await sig(slaPayload,canonicalSLA772,38);
const slaCheck=(envelope=signedSLA,extra={})=>
  verifySLA772({env,history,owner,resolution,signoff,
    readback:{status:'SIGNED_SLA_READBACK',envelope},now,...extra});
const sla=await slaCheck();
assert.equal(sla.signature_authenticated,true);
assert.equal(sla.within_sla_claim,true);
assert.equal(sla.retention_record_mutated_by_app,false);
assert.ok(receiptURL772(env,'sla',history,owner,resolution,signoff)
  .includes('signoff_continuity_receipt_sha256='));
for(const delta of [
  {signoff_continuity_receipt_sha256:'f'.repeat(64)},
  {original_exception_register_sha256:'f'.repeat(64)},
  {current_escalation_register_sha256:'f'.repeat(64)},
  {sla_policy_sha256:'f'.repeat(64)},
  {target_hours:'7200'},
  {elapsed_hours:'80'},
  {critical_exceptions_remaining:'1'},
  {sla_result:'ORIGINAL_SOURCE_DELETED'},
  {inspected_at:'2026-11-04T21:00:00Z'}
])assert.equal((await slaCheck(await sig({...slaPayload,...delta},
  canonicalSLA772,38))).status,'HOLD_SLA_SCOPE');
assert.equal((await slaCheck(await sig(slaPayload,canonicalSLA772,37))).status,
  'HOLD_SLA_SIGNATURE');
const ready=await reconcile772({history,owner,resolution,signoff,sla});
assert.equal(ready.final_owner_resolution_status,
  'READY_FOR_SEPARATE_MANUAL_ORIGINAL_OWNER_SIGNOFF_REVIEW');
assert.deepEqual(ready.follow_ups.map(f=>f.code),
  ['SEPARATE_ORIGINAL_OWNER_BUSINESS_SIGNOFF_REQUIRED']);
for(const flag of ['original_business_signoff_recorded_by_app',
  'original_dispute_closed_by_app','retention_exception_cleared_by_app',
  'production_database_modified_by_app','source_archive_modified_by_app',
  'audit_log_appended_by_app','customer_notifications_sent_by_app',
  'automatic_owner_business_action','closure_allowed'])assert.equal(ready[flag],false);
const resolutionOwner=await ownerCheck(await sig({...ownerPayload,
  continuity_decision:'REQUEST_EXTERNAL_HANDOFF_RESOLUTION_REVIEW'},canonicalOwner772,0));
const openResolution=await resolutionCheck(await sig({...resolutionPayload,
  owner_continuity_receipt_sha256:resolutionOwner.receipt_sha256,
  resolution_result:'EXTERNAL_HANDOFF_RESOLUTION_OPEN_CLAIM'},
  canonicalResolution772,36),{owner:resolutionOwner});
assert.equal(openResolution.dispute_still_open_claim,true);
const resolutionHold=await reconcile772({history,owner:resolutionOwner,resolution:openResolution});
assert.equal(resolutionHold.final_owner_resolution_status,
  'HOLD_EXTERNAL_RESOLUTION_SIGNOFF_OR_RETENTION_SLA');
assert.ok(resolutionHold.follow_ups.some(f=>f.code==='OWNER_EXTERNAL_HANDOFF_RESOLUTION_REQUESTED'));
const slaOwner=await ownerCheck(await sig({...ownerPayload,
  continuity_decision:'REQUEST_RETENTION_SLA_ESCALATION_HOLD'},canonicalOwner772,0));
const openSLAResolution=await resolutionCheck(await sig({...resolutionPayload,
  owner_continuity_receipt_sha256:slaOwner.receipt_sha256,
  resolution_result:'EXTERNAL_RESOLUTION_SOURCE_CONFLICT_HOLD'},canonicalResolution772,36),
  {owner:slaOwner});
const heldSignoff=await signoffCheck(await sig({...signoffPayload,
  owner_continuity_receipt_sha256:slaOwner.receipt_sha256,
  resolution_receipt_sha256:openSLAResolution.receipt_sha256,
  continuity_result:'FINAL_SIGNOFF_MISSING_HOLD'},canonicalSignoff772,37),
  {owner:slaOwner,resolution:openSLAResolution});
const breachedSLA=await slaCheck(await sig({...slaPayload,
  owner_continuity_receipt_sha256:slaOwner.receipt_sha256,
  resolution_receipt_sha256:openSLAResolution.receipt_sha256,
  signoff_continuity_receipt_sha256:heldSignoff.receipt_sha256,
  elapsed_hours:'80',critical_exceptions_remaining:'3',
  sla_result:'RETENTION_SLA_BREACH_ESCALATED_CLAIM'},canonicalSLA772,38),
  {owner:slaOwner,resolution:openSLAResolution,signoff:heldSignoff});
assert.equal(breachedSLA.sla_breach_claim,true);
const held=await reconcile772({history,owner:slaOwner,resolution:openSLAResolution,
  signoff:heldSignoff,sla:breachedSLA});
assert.equal(held.final_owner_resolution_status,
  'HOLD_EXTERNAL_RESOLUTION_SIGNOFF_OR_RETENTION_SLA');
assert.ok(held.follow_ups.some(f=>f.code==='CRITICAL_RETENTION_ESCALATION_OPEN'));
assert.equal((await ownerCheck(signedOwner,{history:{...history,
  report:{...history.report,final_owner_review_status:'HOLD'}}})).status,
  'HOLD_OWNER_CONTINUITY_SCOPE');
// Authenticate before external source access. Non-POST methods never mutate.
let outbound=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{outbound++;throw Error('Unauthenticated source access');};
try{for(const fn of [onRequestGet,onRequestPost]){
  const post=fn===onRequestPost;
  const request=new Request('https://rosiedazzlers.ca/api/admin/economic_resolution_sla_v772',{
    method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
      'Content-Type':'application/json'},...(post?{body:JSON.stringify(record)}:{})});
  assert.ok((await fn({request,env})).status>=400);
}assert.equal(outbound,0);}finally{globalThis.fetch=originalFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-resolution-sla-v772','admin-economic-final-owner-v771',
  'admin-catalog'])assert.equal(read(`${stem}.html`),read(`${stem}/index.html`));
assert.match(read('admin-catalog.html'),/admin-economic-resolution-sla-v772\.html/);
assert.match(read('admin-economic-final-owner-v771.html'),
  /admin-economic-resolution-sla-v772\.html/);
assert.match(read('assets/economic-resolution-sla-v772.js'),/credentials:'same-origin'/);
assert.match(read('docs/build772_external_resolution_signoff_sla.md'),/read-only/i);
console.log('Build 772 PASS: 39 distinct signers, 30 HTTPS issuers, external resolution, owner continuity, source-derived SLA and no production writes.');
