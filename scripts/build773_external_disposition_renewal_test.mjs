import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {KEY_ROLES768,ORIGIN_ROLES768} from '../functions/api/_lib/economic-owner-acceptance-v768.js';
import {ROLES769} from '../functions/api/_lib/economic-handoff-retention-v769.js';
import {ROLES770} from '../functions/api/_lib/economic-owner-register-aging-v770.js';
import {ROLES771} from '../functions/api/_lib/economic-final-attestation-v771.js';
import {ROLES772} from '../functions/api/_lib/economic-resolution-sla-v772.js';
import {ROLES773,OWNER_FIELDS773,DISPOSITION_FIELDS773,RENEWAL_FIELDS773,
  REMEDIATION_FIELDS773,canonicalOwner773,canonicalDisposition773,
  canonicalRenewal773,canonicalRemediation773,verifyOwner773,
  verifyDisposition773,verifyRenewal773,verifyRemediation773,
  receiptURL773,readReceipt773,reconcile773}
  from '../functions/api/_lib/economic-disposition-renewal-v773.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/economic_disposition_renewal_v773.js';

globalThis.crypto??=webcrypto;
const b64=b=>Buffer.from(b).toString('base64');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-04T23:15:00Z');
const env={},pairs=[];
const roles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,...ROLES773];
for(const [index,role] of roles.entries()){
  const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  pairs.push(pair);
  env[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`]=
    b64(await crypto.subtle.exportKey('raw',pair.publicKey));
  env[`ROSIE_ECONOMIC_${role}_KEY_ID`]=`distinct-source-key-v773-${index}`;
}
const originRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,...ROLES773];
for(const [index,role] of originRoles.entries())
  env[`ROSIE_ECONOMIC_${role}_BASE_URL`]=`https://original-evidence-v773-${index}.example`;
assert.equal(roles.length,42);assert.equal(originRoles.length,33);
assert.equal(OWNER_FIELDS773.length,17);assert.equal(DISPOSITION_FIELDS773.length,16);
assert.equal(RENEWAL_FIELDS773.length,17);assert.equal(REMEDIATION_FIELDS773.length,21);
const sign=async(p,canonical,index)=>({payload:p,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',pairs[index].privateKey,
    canonical(p)))});
const record={booking_id:'12345678-1234-1234-1234-123456789abc',
  source_record_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',
  change_ticket_id:'original-external-ticket-773',
  execution_request_id:'original-execution-request-773'};
const scope={...record,trial_id:'original-trial-773',
  production_project_ref:'original-production-project-773'};
const history={report:{ok:true,
  final_owner_resolution_status:'READY_FOR_SEPARATE_MANUAL_ORIGINAL_OWNER_SIGNOFF_REVIEW',
  packet_sha256:'a'.repeat(64)},
  history:{report:{ok:true},history:{report:{ok:true},
    history:{ctx:{record,prior:{ok:true,verified_scope:{
      trial_id:scope.trial_id,production_project_ref:scope.production_project_ref}}}},
    aging:{source_alert_threshold_hours:72}}},
  owner:{signature_authenticated:true,receipt_sha256:'1'.repeat(64)},
  resolution:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'2'.repeat(64),current_resolution_register_sha256:'3'.repeat(64)},
  signoff:{signature_authenticated:true,continuity_witnessed:true,
    receipt_sha256:'4'.repeat(64),continuity_register_after_sha256:'5'.repeat(64)},
  sla:{signature_authenticated:true,within_sla_claim:true,
    receipt_sha256:'6'.repeat(64),sla_policy_sha256:'7'.repeat(64),
    critical_exceptions_remaining:0,elapsed_hours:0,signed_at:'2026-11-04T22:00:00Z'}};
const ownerPayload={schema:'rosie-original-owner-disposition-renewal-review-v773',
  ...scope,original_owner_continuity_receipt_sha256:history.owner.receipt_sha256,
  external_resolution_receipt_sha256:history.resolution.receipt_sha256,
  signoff_continuity_receipt_sha256:history.signoff.receipt_sha256,
  retention_sla_receipt_sha256:history.sla.receipt_sha256,
  manual_review_choice:'REQUEST_SEPARATE_DISPOSITION_SIGNOFF_REVIEW',
  manual_review_ticket_id:'original-owner-ticket-773',
  owner_id:'original-owner-review-773',issued_at:'2026-11-04T22:05:00Z',
  nonce:'c'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sign(ownerPayload,canonicalOwner773,0);
const ownerCheck=(envelope=signedOwner,extra={})=>
  verifyOwner773({env,history,envelope,now,...extra});
const owner=await ownerCheck();
assert.equal(owner.signature_authenticated,true);
assert.equal(owner.requests_manual_signoff,true);
assert.equal(owner.actual_owner_business_signoff_by_app,false);
for(const delta of [
  {original_owner_continuity_receipt_sha256:'f'.repeat(64)},
  {external_resolution_receipt_sha256:'f'.repeat(64)},
  {signoff_continuity_receipt_sha256:'f'.repeat(64)},
  {retention_sla_receipt_sha256:'f'.repeat(64)},
  {manual_review_choice:'AUTO_CLOSE_ORIGINAL_DISPUTE'},
  {issued_at:'2026-11-04T21:00:00Z'},
  {nonce:'bad'}
])assert.equal((await ownerCheck(await sign({...ownerPayload,...delta},
  canonicalOwner773,0))).status,'HOLD_OWNER_RENEWAL_SCOPE');
assert.equal((await ownerCheck(await sign(ownerPayload,canonicalOwner773,39))).status,
  'HOLD_OWNER_RENEWAL_SIGNATURE');
assert.throws(()=>canonicalOwner773({...ownerPayload,bonus:'x'}),/Noncanonical/);
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_SLA_REMEDIATION_WITNESS_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_OWNER_RENEWAL_SIGNER_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_EXTERNAL_DISPOSITION_WITNESS_BASE_URL:
    env.ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL}})).status,
  'HOLD_OWNER_RENEWAL_ORIGIN_INDEPENDENCE');
const dispositionPayload={schema:'rosie-independent-external-disposition-v773',
  ...scope,owner_review_receipt_sha256:owner.receipt_sha256,
  external_resolution_receipt_sha256:history.resolution.receipt_sha256,
  original_resolution_register_sha256:history.resolution.current_resolution_register_sha256,
  current_disposition_register_sha256:'8'.repeat(64),
  disposition_case_id:'original-disposition-773',
  disposition_result:'NO_OPEN_EXTERNAL_DISPUTE_CLAIM',
  observed_at:'2026-11-04T22:10:00Z',
  witness_id:'independent-disposition-773',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_EXTERNAL_DISPOSITION_WITNESS_KEY_ID};
const signedDisposition=await sign(dispositionPayload,canonicalDisposition773,39);
const dispositionCheck=(envelope=signedDisposition,extra={})=>
  verifyDisposition773({env,history,owner,
    readback:{status:'SIGNED_DISPOSITION_READBACK',envelope},now,...extra});
const disposition=await dispositionCheck();
assert.equal(disposition.signature_authenticated,true);
assert.equal(disposition.clean_claim,true);
assert.equal(disposition.original_dispute_disposition_written_by_app,false);
assert.ok(receiptURL773(env,'disposition',history,owner)
  .includes('original_owner_review_receipt_sha256='));
assert.equal((await readReceipt773(env,'disposition',history,owner,null,null,
  async()=>new Response(JSON.stringify(signedDisposition)))).status,
  'SIGNED_DISPOSITION_READBACK');
for(const delta of [
  {external_resolution_receipt_sha256:'f'.repeat(64)},
  {original_resolution_register_sha256:'f'.repeat(64)},
  {disposition_result:'REAL_CASE_CLOSED_BY_APP'},
  {observed_at:'2026-11-04T22:00:00Z'}
])assert.equal((await dispositionCheck(await sign({...dispositionPayload,...delta},
  canonicalDisposition773,39))).status,'HOLD_DISPOSITION_SCOPE');
assert.equal((await dispositionCheck(await sign(dispositionPayload,
  canonicalDisposition773,40))).status,'HOLD_DISPOSITION_SIGNATURE');
const renewalPayload={schema:'rosie-independent-owner-signoff-renewal-v773',
  ...scope,owner_review_receipt_sha256:owner.receipt_sha256,
  disposition_receipt_sha256:disposition.receipt_sha256,
  original_signoff_receipt_sha256:history.signoff.receipt_sha256,
  original_continuity_register_sha256:history.signoff.continuity_register_after_sha256,
  current_renewal_register_sha256:'9'.repeat(64),
  renewal_result:'ORIGINAL_OWNER_RENEWAL_CURRENT_CLAIM',
  renewal_expires_at:'2026-11-20T00:00:00Z',
  witnessed_at:'2026-11-04T22:15:00Z',
  witness_id:'independent-renewal-773',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_OWNER_RENEWAL_WITNESS_KEY_ID};
const signedRenewal=await sign(renewalPayload,canonicalRenewal773,40);
const renewalCheck=(envelope=signedRenewal,extra={})=>
  verifyRenewal773({env,history,owner,disposition,
    readback:{status:'SIGNED_RENEWAL_READBACK',envelope},now,...extra});
const renewal=await renewalCheck();
assert.equal(renewal.signature_authenticated,true);
assert.equal(renewal.renewal_current_claim,true);
assert.equal(renewal.original_owner_signoff_renewed_by_app,false);
assert.ok(receiptURL773(env,'renewal',history,owner,disposition)
  .includes('disposition_receipt_sha256='));
for(const delta of [
  {disposition_receipt_sha256:'f'.repeat(64)},
  {original_signoff_receipt_sha256:'f'.repeat(64)},
  {original_continuity_register_sha256:'f'.repeat(64)},
  {renewal_expires_at:'2027-02-20T00:00:00Z'},
  {renewal_result:'ORIGINAL_RENEWAL_EXECUTED'},
  {witnessed_at:'2026-11-04T22:00:00Z'}
])assert.equal((await renewalCheck(await sign({...renewalPayload,...delta},
  canonicalRenewal773,40))).status,'HOLD_RENEWAL_SCOPE');
assert.equal((await renewalCheck(await sign(renewalPayload,canonicalRenewal773,41))).status,
  'HOLD_RENEWAL_SIGNATURE');
const remediationPayload={schema:'rosie-independent-retention-sla-remediation-v773',
  ...scope,owner_review_receipt_sha256:owner.receipt_sha256,
  disposition_receipt_sha256:disposition.receipt_sha256,
  renewal_receipt_sha256:renewal.receipt_sha256,
  original_sla_receipt_sha256:history.sla.receipt_sha256,
  original_sla_policy_sha256:history.sla.sla_policy_sha256,
  current_remediation_register_sha256:'a'.repeat(64),
  remediation_case_id:'original-remediation-773',
  elapsed_hours:'0',target_hours:'72',critical_exceptions_remaining:'0',
  remediation_result:'NO_OPEN_RETENTION_REMEDIATION_CLAIM',
  inspected_at:'2026-11-04T22:20:00Z',
  witness_id:'independent-remediation-773',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_SLA_REMEDIATION_WITNESS_KEY_ID};
const signedRemediation=await sign(remediationPayload,canonicalRemediation773,41);
const remediationCheck=(envelope=signedRemediation,extra={})=>
  verifyRemediation773({env,history,owner,disposition,renewal,
    readback:{status:'SIGNED_REMEDIATION_READBACK',envelope},now,...extra});
const remediation=await remediationCheck();
assert.equal(remediation.signature_authenticated,true);
assert.equal(remediation.clean_claim,true);
assert.equal(remediation.retention_sla_modified_by_app,false);
assert.ok(receiptURL773(env,'remediation',history,owner,disposition,renewal)
  .includes('renewal_receipt_sha256='));
for(const delta of [
  {renewal_receipt_sha256:'f'.repeat(64)},
  {original_sla_receipt_sha256:'f'.repeat(64)},
  {original_sla_policy_sha256:'f'.repeat(64)},
  {target_hours:'720'},
  {elapsed_hours:'80'},
  {critical_exceptions_remaining:'1'},
  {remediation_result:'DELETE_ORIGINAL_EXCEPTION'},
  {inspected_at:'2026-11-04T22:00:00Z'}
])assert.equal((await remediationCheck(await sign({...remediationPayload,...delta},
  canonicalRemediation773,41))).status,'HOLD_REMEDIATION_SCOPE');
assert.equal((await remediationCheck(await sign(remediationPayload,
  canonicalRemediation773,40))).status,'HOLD_REMEDIATION_SIGNATURE');
const ready=await reconcile773({history,owner,disposition,renewal,remediation});
assert.equal(ready.external_disposition_signoff_status,
  'READY_FOR_SEPARATE_ORIGINAL_OWNER_MANUAL_DISPOSITION_REVIEW');
assert.deepEqual(ready.follow_ups.map(f=>f.code),
  ['SEPARATE_ORIGINAL_OWNER_AND_OPERATOR_BUSINESS_ACTION']);
for(const flag of ['original_owner_business_signoff_by_app',
  'external_case_mutated_by_app','retention_exception_cleared_by_app',
  'production_database_written_by_app','source_archive_modified_by_app',
  'append_only_audit_written_by_app','notification_sent_by_app',
  'automatic_business_action','closure_allowed'])assert.equal(ready[flag],false);
// An explicit original owner renewal request and an expired independent receipt
// must remain HOLD, even when prior evidence is fully signed.
const renewalOwner=await ownerCheck(await sign({...ownerPayload,
  manual_review_choice:'REQUEST_ORIGINAL_OWNER_SIGNOFF_RENEWAL'},canonicalOwner773,0));
const referredDisposition=await dispositionCheck(await sign({...dispositionPayload,
  owner_review_receipt_sha256:renewalOwner.receipt_sha256,
  disposition_result:'EXTERNAL_DISPUTE_REFERRED_CLAIM'},canonicalDisposition773,39),
  {owner:renewalOwner});
const expiredRenewal=await renewalCheck(await sign({...renewalPayload,
  owner_review_receipt_sha256:renewalOwner.receipt_sha256,
  disposition_receipt_sha256:referredDisposition.receipt_sha256,
  renewal_result:'ORIGINAL_OWNER_RENEWAL_EXPIRED_HOLD',
  renewal_expires_at:'2026-11-04T22:16:00Z'},canonicalRenewal773,40),
  {owner:renewalOwner,disposition:referredDisposition});
assert.equal(expiredRenewal.signature_authenticated,true);
assert.equal(expiredRenewal.renewal_current_claim,false);
const renewalHold=await reconcile773({history,owner:renewalOwner,
  disposition:referredDisposition,renewal:expiredRenewal});
assert.equal(renewalHold.external_disposition_signoff_status,
  'HOLD_DISPOSITION_RENEWAL_OR_RETENTION_REMEDIATION');
assert.ok(renewalHold.follow_ups.some(f=>f.code==='OWNER_RENEWAL_EXPIRED_OR_DISPUTED'));
const slaOwner=await ownerCheck(await sign({...ownerPayload,
  manual_review_choice:'REQUEST_RETENTION_SLA_REMEDIATION_HOLD'},canonicalOwner773,0));
const heldDisposition=await dispositionCheck(await sign({...dispositionPayload,
  owner_review_receipt_sha256:slaOwner.receipt_sha256,
  disposition_result:'EXTERNAL_DISPOSITION_SOURCE_CONFLICT_HOLD'},
  canonicalDisposition773,39),{owner:slaOwner});
const heldRenewal=await renewalCheck(await sign({...renewalPayload,
  owner_review_receipt_sha256:slaOwner.receipt_sha256,
  disposition_receipt_sha256:heldDisposition.receipt_sha256,
  renewal_result:'OWNER_RENEWAL_EVIDENCE_CONFLICT_HOLD'},canonicalRenewal773,40),
  {owner:slaOwner,disposition:heldDisposition});
const breached=await remediationCheck(await sign({...remediationPayload,
  owner_review_receipt_sha256:slaOwner.receipt_sha256,
  disposition_receipt_sha256:heldDisposition.receipt_sha256,
  renewal_receipt_sha256:heldRenewal.receipt_sha256,
  elapsed_hours:'80',critical_exceptions_remaining:'2',
  remediation_result:'RETENTION_SLA_BREACH_REMEDIATION_REFERRED_CLAIM'},
  canonicalRemediation773,41),{owner:slaOwner,disposition:heldDisposition,
    renewal:heldRenewal});
assert.equal(breached.remediation_referred_claim,true);
const slaHold=await reconcile773({history,owner:slaOwner,
  disposition:heldDisposition,renewal:heldRenewal,remediation:breached});
assert.ok(slaHold.follow_ups.some(f=>f.code==='CRITICAL_RETENTION_REMEDIATION_OPEN'));
assert.equal((await ownerCheck(signedOwner,{history:{...history,
  report:{...history.report,final_owner_resolution_status:'HOLD'}}})).status,
  'HOLD_OWNER_RENEWAL_SCOPE');
// An unauthenticated request never initiates an external source fetch.
let outbound=0;const before=globalThis.fetch;
globalThis.fetch=async()=>{outbound++;throw Error('Unauthenticated source access');};
try{for(const fn of [onRequestGet,onRequestPost]){
  const post=fn===onRequestPost;
  const request=new Request('https://rosiedazzlers.ca/api/admin/economic_disposition_renewal_v773',{
    method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
      'Content-Type':'application/json'},...(post?{body:JSON.stringify(record)}:{})});
  assert.ok((await fn({request,env})).status>=400);
}assert.equal(outbound,0);}finally{globalThis.fetch=before;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])
  assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-disposition-renewal-v773',
  'admin-economic-resolution-sla-v772','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`));
assert.match(read('admin-catalog.html'),/admin-economic-disposition-renewal-v773\.html/);
assert.match(read('admin-economic-resolution-sla-v772.html'),
  /admin-economic-disposition-renewal-v773\.html/);
assert.match(read('assets/economic-disposition-renewal-v773.js'),/credentials:'same-origin'/);
assert.match(read('docs/build773_external_disposition_renewal_sla_remediation.md'),/read-only/i);
console.log('Build 773 PASS: 42 signer identities, 33 HTTPS origins, disposition, owner renewal expiry, SLA remediation and no business writes.');
