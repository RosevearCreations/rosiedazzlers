import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {KEY_ROLES768,ORIGIN_ROLES768} from '../functions/api/_lib/economic-owner-acceptance-v768.js';
import {ROLES769} from '../functions/api/_lib/economic-handoff-retention-v769.js';
import {ROLES770} from '../functions/api/_lib/economic-owner-register-aging-v770.js';
import {ROLES771} from '../functions/api/_lib/economic-final-attestation-v771.js';
import {ROLES772} from '../functions/api/_lib/economic-resolution-sla-v772.js';
import {ROLES773} from '../functions/api/_lib/economic-disposition-renewal-v773.js';
import {ROLES774,OWNER_FIELDS774,HANDOFF_FIELDS774,AGING_FIELDS774,
  CLOSURE_FIELDS774,canonicalOwner774,canonicalHandoff774,canonicalAging774,
  canonicalClosure774,verifyOwner774,verifyHandoff774,verifyAging774,
  verifyClosure774,receiptURL774,readReceipt774,reconcile774}
  from '../functions/api/_lib/economic-owner-handoff-aging-v774.js';

globalThis.crypto??=webcrypto;
const b64=b=>Buffer.from(b).toString('base64');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-05T00:30:00Z');
const env={},pairs=[];
const roles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,...ROLES773,...ROLES774];
const origins=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,...ROLES773,...ROLES774];
for(const [index,role] of roles.entries()){
  const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);pairs.push(pair);
  env[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`]=
    b64(await crypto.subtle.exportKey('raw',pair.publicKey));
  env[`ROSIE_ECONOMIC_${role}_KEY_ID`]=`distinct-proof-v774-${index}`;
}
for(const [index,role] of origins.entries())
  env[`ROSIE_ECONOMIC_${role}_BASE_URL`]=`https://original-evidence-v774-${index}.example`;
assert.equal(roles.length,45);assert.equal(origins.length,36);
assert.equal(new Set(roles).size,45);assert.equal(new Set(origins).size,36);
assert.equal(OWNER_FIELDS774.length,17);assert.equal(HANDOFF_FIELDS774.length,16);
assert.equal(AGING_FIELDS774.length,19);assert.equal(CLOSURE_FIELDS774.length,20);
const sign=async(p,canonical,index)=>({payload:p,
  signature_b64:b64(await crypto.subtle.sign('Ed25519',pairs[index].privateKey,canonical(p)))});
const record={booking_id:'12345678-1234-1234-1234-123456789abc',
  source_record_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',
  change_ticket_id:'original-ticket-v774',execution_request_id:'original-execution-v774'};
const scope={...record,trial_id:'original-trial-v774',production_project_ref:'original-project-v774'};
const history={report:{ok:true,
  external_disposition_signoff_status:'READY_FOR_SEPARATE_ORIGINAL_OWNER_MANUAL_DISPOSITION_REVIEW',
  packet_sha256:'a'.repeat(64)},
  history:{report:{ok:true},history:{report:{ok:true},history:{report:{ok:true},
    aging:{source_alert_threshold_hours:72},
    history:{ctx:{record,prior:{ok:true,verified_scope:{
      trial_id:scope.trial_id,production_project_ref:scope.production_project_ref}}}}}},
    sla:{receipt_sha256:'7'.repeat(64),sla_policy_sha256:'8'.repeat(64),
      signed_at:'2026-11-04T22:00:00Z',elapsed_hours:0}},
  owner:{signature_authenticated:true,receipt_sha256:'1'.repeat(64)},
  disposition:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'2'.repeat(64),current_disposition_register_sha256:'3'.repeat(64)},
  renewal:{signature_authenticated:true,renewal_current_claim:true,
    receipt_sha256:'4'.repeat(64),current_renewal_register_sha256:'5'.repeat(64)},
  remediation:{signature_authenticated:true,clean_claim:true,
    receipt_sha256:'6'.repeat(64),current_remediation_register_sha256:'9'.repeat(64),
    critical_count:0,signed_at:'2026-11-04T23:15:00Z'}};
const ownerPayload={schema:'rosie-original-owner-renewal-handoff-v774',...scope,
  original_owner_review_receipt_sha256:history.owner.receipt_sha256,
  external_disposition_receipt_sha256:history.disposition.receipt_sha256,
  signoff_renewal_receipt_sha256:history.renewal.receipt_sha256,
  retention_remediation_receipt_sha256:history.remediation.receipt_sha256,
  handoff_choice:'REQUEST_SEPARATE_RENEWAL_HANDOFF',
  handoff_ticket_id:'original-owner-handoff-v774',owner_id:'original-owner-v774',
  issued_at:'2026-11-04T23:20:00Z',nonce:'c'.repeat(32),
  key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signedOwner=await sign(ownerPayload,canonicalOwner774,0);
const ownerCheck=(envelope=signedOwner,extra={})=>
  verifyOwner774({env,history,envelope,now,...extra});
const owner=await ownerCheck();
assert.equal(owner.signature_authenticated,true);assert.equal(owner.requests_handoff,true);
assert.equal(owner.actual_owner_renewal_executed_by_app,false);
for(const change of [
  {original_owner_review_receipt_sha256:'f'.repeat(64)},
  {external_disposition_receipt_sha256:'f'.repeat(64)},
  {signoff_renewal_receipt_sha256:'f'.repeat(64)},
  {retention_remediation_receipt_sha256:'f'.repeat(64)},
  {handoff_choice:'EXECUTE_REAL_OWNER_SIGNOFF'},
  {issued_at:'2026-11-04T23:00:00Z'},{nonce:'bad'}
])assert.equal((await ownerCheck(await sign({...ownerPayload,...change},canonicalOwner774,0))).status,
  'HOLD_OWNER_HANDOFF_SCOPE');
assert.equal((await ownerCheck(await sign(ownerPayload,canonicalOwner774,42))).status,
  'HOLD_OWNER_HANDOFF_SIGNATURE');
assert.throws(()=>canonicalOwner774({...ownerPayload,extra:'unexpected'}),/Noncanonical/);
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_DISPUTE_AGING_WITNESS_PUBLIC_KEY_B64:
    env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,'HOLD_OWNER_HANDOFF_KEY_INDEPENDENCE');
assert.equal((await ownerCheck(signedOwner,{env:{...env,
  ROSIE_ECONOMIC_INDEPENDENT_DISPUTE_AGING_WITNESS_BASE_URL:
    env.ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL}})).status,'HOLD_OWNER_HANDOFF_ORIGIN_INDEPENDENCE');
const handoffPayload={schema:'rosie-independent-renewal-handoff-witness-v774',...scope,
  owner_handoff_receipt_sha256:owner.receipt_sha256,
  prior_signoff_renewal_receipt_sha256:history.renewal.receipt_sha256,
  prior_renewal_register_sha256:history.renewal.current_renewal_register_sha256,
  current_handoff_register_sha256:'a'.repeat(64),handoff_case_id:'handoff-case-v774',
  handoff_result:'OWNER_RENEWAL_HANDOFF_ACKNOWLEDGED_CLAIM',
  observed_at:'2026-11-04T23:25:00Z',witness_id:'external-handoff-v774',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_RENEWAL_HANDOFF_WITNESS_KEY_ID};
const signedHandoff=await sign(handoffPayload,canonicalHandoff774,42);
const handoffCheck=(envelope=signedHandoff,extra={})=>verifyHandoff774({env,history,owner,
  readback:{status:'SIGNED_HANDOFF_READBACK',envelope},now,...extra});
const handoff=await handoffCheck();assert.equal(handoff.signature_authenticated,true);
assert.equal(handoff.acknowledged_claim,true);assert.equal(handoff.owner_handoff_executed_by_app,false);
assert.ok(receiptURL774(env,'handoff',history,owner).includes('owner_handoff_receipt_sha256='));
assert.equal((await readReceipt774(env,'handoff',history,owner,null,null,
  async()=>new Response(JSON.stringify(signedHandoff)))).status,'SIGNED_HANDOFF_READBACK');
for(const change of [{prior_signoff_renewal_receipt_sha256:'f'.repeat(64)},
  {prior_renewal_register_sha256:'f'.repeat(64)},
  {handoff_result:'AUTO_RENEWED_OWNER_SIGNOFF'},
  {observed_at:'2026-11-04T23:10:00Z'}])
  assert.equal((await handoffCheck(await sign({...handoffPayload,...change},canonicalHandoff774,42))).status,
    'HOLD_HANDOFF_SCOPE');
assert.equal((await handoffCheck(await sign(handoffPayload,canonicalHandoff774,43))).status,
  'HOLD_HANDOFF_SIGNATURE');
const agingPayload={schema:'rosie-independent-dispute-disposition-aging-v774',...scope,
  owner_handoff_receipt_sha256:owner.receipt_sha256,
  handoff_receipt_sha256:handoff.receipt_sha256,
  prior_disposition_receipt_sha256:history.disposition.receipt_sha256,
  prior_disposition_register_sha256:history.disposition.current_disposition_register_sha256,
  current_aging_register_sha256:'b'.repeat(64),age_hours:'2',
  source_alert_threshold_hours:'72',open_disputes:'0',
  aging_result:'NO_OPEN_DISPUTE_AGING_CLAIM',observed_at:'2026-11-04T23:30:00Z',
  witness_id:'external-aging-v774',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_DISPUTE_AGING_WITNESS_KEY_ID};
const signedAging=await sign(agingPayload,canonicalAging774,43);
const agingCheck=(envelope=signedAging,extra={})=>verifyAging774({env,history,owner,handoff,
  readback:{status:'SIGNED_AGING_READBACK',envelope},now,...extra});
const aging=await agingCheck();assert.equal(aging.signature_authenticated,true);
assert.equal(aging.clean_claim,true);assert.equal(aging.original_dispute_closed_by_app,false);
for(const change of [
  {handoff_receipt_sha256:'f'.repeat(64)},
  {prior_disposition_register_sha256:'f'.repeat(64)},
  {source_alert_threshold_hours:'999'},
  {age_hours:'80'},{open_disputes:'1'},
  {observed_at:'2026-11-04T23:15:00Z'}
])assert.equal((await agingCheck(await sign({...agingPayload,...change},canonicalAging774,43))).status,
  'HOLD_AGING_SCOPE');
assert.equal((await agingCheck(await sign(agingPayload,canonicalAging774,44))).status,
  'HOLD_AGING_SIGNATURE');
const closurePayload={schema:'rosie-independent-retention-closure-witness-v774',...scope,
  owner_handoff_receipt_sha256:owner.receipt_sha256,
  handoff_receipt_sha256:handoff.receipt_sha256,
  aging_receipt_sha256:aging.receipt_sha256,
  prior_retention_remediation_receipt_sha256:history.remediation.receipt_sha256,
  prior_remediation_register_sha256:history.remediation.current_remediation_register_sha256,
  original_sla_policy_sha256:history.history.sla.sla_policy_sha256,
  current_retention_witness_register_sha256:'d'.repeat(64),
  critical_retention_exceptions:'0',
  closure_witness_result:'RETENTION_CLOSURE_WITNESS_READY_CLAIM',
  readiness_expires_at:'2026-11-20T00:00:00Z',
  observed_at:'2026-11-04T23:35:00Z',witness_id:'external-closure-v774',
  key_id:env.ROSIE_ECONOMIC_INDEPENDENT_RETENTION_CLOSURE_READINESS_WITNESS_KEY_ID};
const signedClosure=await sign(closurePayload,canonicalClosure774,44);
const closureCheck=(envelope=signedClosure,extra={})=>verifyClosure774({env,history,owner,
  handoff,aging,readback:{status:'SIGNED_CLOSURE_READBACK',envelope},now,...extra});
const closure=await closureCheck();assert.equal(closure.signature_authenticated,true);
assert.equal(closure.ready_claim,true);assert.equal(closure.source_retention_closed_by_app,false);
for(const change of [
  {aging_receipt_sha256:'f'.repeat(64)},
  {prior_remediation_register_sha256:'f'.repeat(64)},
  {original_sla_policy_sha256:'f'.repeat(64)},
  {critical_retention_exceptions:'1'},
  {readiness_expires_at:'2027-02-20T00:00:00Z'},
  {closure_witness_result:'ARCHIVE_DELETED'},
  {observed_at:'2026-11-04T23:20:00Z'}
])assert.equal((await closureCheck(await sign({...closurePayload,...change},canonicalClosure774,44))).status,
  'HOLD_CLOSURE_SCOPE');
assert.equal((await closureCheck(await sign(closurePayload,canonicalClosure774,43))).status,
  'HOLD_CLOSURE_SIGNATURE');
const ready=await reconcile774({history,owner,handoff,aging,closure});
assert.equal(ready.owner_renewal_handoff_status,
  'READY_FOR_SEPARATE_ORIGINAL_OWNER_RENEWAL_HANDOFF');
assert.deepEqual(ready.follow_ups.map(x=>x.code),['EXTERNAL_OWNER_CUSTODIAN_ACTION_STILL_REQUIRED']);
for(const flag of ['original_owner_business_signoff_by_app','external_handoff_executed_by_app',
  'original_dispute_closed_by_app','retention_closed_by_app','production_database_written_by_app',
  'source_archive_modified_by_app','append_only_audit_written_by_app','notification_sent_by_app',
  'automatic_business_action','closure_allowed'])assert.equal(ready[flag],false);
const holdOwner=await ownerCheck(await sign({...ownerPayload,
  handoff_choice:'HOLD_EXTERNAL_DISPUTE_AGING'},canonicalOwner774,0));
assert.equal((await reconcile774({history,owner:holdOwner,handoff,aging,closure})).owner_renewal_handoff_status,
  'HOLD_OWNER_RENEWAL_DISPUTE_AGING_OR_RETENTION_CLOSURE');
const disputed=await agingCheck(await sign({...agingPayload,aging_result:'DISPUTE_AGING_ESCALATION_CLAIM',
  open_disputes:'1'},canonicalAging774,43));
assert.equal(disputed.signature_authenticated,true);assert.equal(disputed.clean_claim,false);
assert.equal((await reconcile774({history,owner,handoff,aging:disputed,closure:null})).owner_renewal_handoff_status,
  'HOLD_OWNER_RENEWAL_DISPUTE_AGING_OR_RETENTION_CLOSURE');
for(const stem of ['admin-economic-owner-handoff-aging-v774','admin-economic-disposition-renewal-v773',
  'admin-catalog'])assert.equal(read(`${stem}.html`),read(`${stem}/index.html`));
assert.match(read('admin-catalog.html'),/admin-economic-owner-handoff-aging-v774\.html/);
assert.match(read('admin-economic-disposition-renewal-v773.html'),/admin-economic-owner-handoff-aging-v774\.html/);
assert.match(read('assets/economic-owner-handoff-aging-v774.js'),/credentials:'same-origin'/);
assert.match(read('docs/build774_owner_renewal_handoff_dispute_aging_retention_closure.md'),/read-only/i);
assert.match(read('functions/api/admin/economic_owner_handoff_aging_v774.js'),/reviewDispositionRenewal773/);
// CI has the full repository staff auth implementation; this trimmed local
// verification fixture intentionally excludes it.
if(existsSync(new URL('../functions/api/_lib/staff-auth.js',import.meta.url))){
  const api=await import('../functions/api/admin/economic_owner_handoff_aging_v774.js');
  const before=globalThis.fetch;let outbound=0;
  try{globalThis.fetch=async()=>{outbound++;throw Error('Unexpected outbound access');};
    for(const fn of [api.onRequestGet,api.onRequestPost]){
      const post=fn===api.onRequestPost;
      const request=new Request('https://rosiedazzlers.ca/api/admin/economic_owner_handoff_aging_v774',{
        method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca',
          'Content-Type':'application/json'},...(post?{body:JSON.stringify(record)}:{})});
      assert.ok((await fn({request,env})).status>=400);
    }assert.equal(outbound,0);
  }finally{globalThis.fetch=before;}
  for(const fn of [api.onRequestPut,api.onRequestPatch,api.onRequestDelete])
    assert.equal((await fn()).status,405);
}
console.log('Build 774 PASS: 45 signers, 36 pinned HTTPS origins, owner handoff, independent dispute aging, retention closure expiry and no business writes.');
