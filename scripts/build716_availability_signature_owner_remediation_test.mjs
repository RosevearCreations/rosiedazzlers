import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {plannedWindow716,availabilityDecision716,AVAILABILITY_BLOCK_LIMIT716} from
  '../assets/quote-followup-availability-v716.mjs';
import {signEvidenceReceipt716,signingReady716} from '../assets/quote-followup-signature-v716.mjs';
import {unresolvedOwnerFeedback716,remediationReceipt716} from '../assets/quote-owner-feedback-v716.mjs';
import {onRequestGet} from '../functions/api/admin/quote_followup_rebalance.js';

const staffId='4211709f-4ca2-4cbd-9f27-c8f4c6bf4d94',now=new Date();
const planned=new Date(now.getTime()+3*86400000).toISOString(),window=plannedWindow716(planned,now);
assert.ok(window);
assert.equal(plannedWindow716(new Date(now.getTime()-3600000).toISOString(),now),null);
assert.equal(plannedWindow716(new Date(now.getTime()+31*86400000).toISOString(),now),null);
assert.equal(plannedWindow716('incorrect',now),null);
const overlaps=type=>[{staff_user_id:staffId,start_at:new Date(Date.parse(planned)-300000).toISOString(),
  end_at:new Date(Date.parse(planned)+1800000).toISOString(),availability_type:type}];
for(const type of ['unavailable','vacation','sick','training']){
  const decision=availabilityDecision716(overlaps(type),staffId,window);
  assert.equal(decision.hard_hold,true,`${type} is a firm recorded absence hold`);
  assert.equal(decision.conflicting_absence_count,1);
  assert.equal(decision.shift_schedule_verified,false);
}
const light=availabilityDecision716(overlaps('light_duty'),staffId,window);
assert.equal(light.hard_hold,false);
assert.equal(light.requires_manager_override,true);
assert.equal(availabilityDecision716([],staffId,window).recorded_block_check_completed,true);
assert.equal(availabilityDecision716([],staffId,window,{truncated:true}).hard_hold,true);
assert.equal(AVAILABILITY_BLOCK_LIMIT716,50);

assert.equal(signingReady716({}),false);
const generated=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const privateJwk=await webcrypto.subtle.exportKey('jwk',generated.privateKey);
const env={ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(privateJwk),
  ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:'test-local-manager-export'};
const receipt={quote_id:'internal-id-only',build:716,metadata:{grants_consent:false}};
const signed=await signEvidenceReceipt716(receipt,env,webcrypto);
assert.equal(signed.signature_algorithm,'Ed25519');
assert.equal(signed.metadata.independently_custodied_or_witnessed,false);
assert.equal(signed.public_key_jwk.d,undefined,'private key must never leave the server');
const verifier=await webcrypto.subtle.importKey('jwk',signed.public_key_jwk,
  {name:'Ed25519'},false,['verify']);
const bytes=Buffer.from(signed.receipt_base64,'base64');
assert.deepEqual(JSON.parse(bytes.toString()),receipt);
assert.equal(await webcrypto.subtle.verify('Ed25519',verifier,
  Buffer.from(signed.signature_base64,'base64'),bytes),true);
assert.equal(await webcrypto.subtle.verify('Ed25519',verifier,
  Buffer.from(signed.signature_base64,'base64'),Buffer.from('tampered')),false);

const original={app:'Rosie Dazzlers',build:715,
  receipt_kind:'owner_self_attested_local_visual_review',
  feedback_disposition:'needs_changes',server_acceptance_recorded:false,
  generated_at:'2026-10-30T10:00:00Z',device_findings_note:'Mobile headings overlap cards.'};
assert.equal(unresolvedOwnerFeedback716({...original,feedback_disposition:'accepted'}),null);
assert.equal(unresolvedOwnerFeedback716({...original,server_acceptance_recorded:true}),null);
const checked=Object.fromEntries(['acceptDesktop714','acceptMobile714','acceptRoles714',
  'acceptEvidence714','acceptNoSend714'].map(k=>[k,true]));
const summary=unresolvedOwnerFeedback716(original),hash='b'.repeat(64);
assert.ok(summary);
assert.equal(remediationReceipt716(hash,summary,'Owner','too short',checked,new Date().toISOString()),null);
assert.equal(remediationReceipt716(hash,summary,'Owner','Issue genuinely retested and the layout is fixed.',
  {...checked,acceptMobile714:false},new Date().toISOString()),null);
const closure=remediationReceipt716(hash,summary,'Owner',
  'Issue genuinely retested and the layout is fixed.',checked,new Date().toISOString());
assert.equal(closure.original_unresolved_feedback_sha256,hash);
assert.equal(closure.server_acceptance_recorded,false);
assert.equal(closure.locally_self_attested_closure,true);
assert.equal(closure.closes_audit,false);

const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const apiEnv={SUPABASE_URL:'https://db.example.test',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
let blocks=overlaps('vacation'),sourceAvailable=true;
const originalFetch=globalThis.fetch;
globalThis.fetch=async input=>{
  const u=new URL(String(input));assert.equal(u.origin,apiEnv.SUPABASE_URL);
  if(u.pathname.endsWith('/staff_users'))return Response.json([{
    id:staffId,role_code:'detailer',is_active:true,can_manage_bookings:true}]);
  if(u.pathname.endsWith('/staff_availability_blocks'))return sourceAvailable?
    Response.json(blocks):new Response('unavailable',{status:503});
  throw Error(`Unexpected source: ${u.pathname}`);
};
try{
  const path=`?staff_user_id=${staffId}&planned_followup_at=${encodeURIComponent(planned)}`;
  let response=await onRequestGet({request:new Request(url+path),env:apiEnv});
  assert.equal(response.status,401,'Anonymous availability read is prohibited');
  response=await onRequestGet({request:new Request(url+path,
    {headers:{'x-admin-password':'test-only'}}),env:apiEnv});
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.availability.hard_hold,true);
  assert.equal(data.availability.conflicting_absence_count,1);
  blocks=overlaps('light_duty');
  response=await onRequestGet({request:new Request(url+path,
    {headers:{'x-admin-password':'test-only'}}),env:apiEnv});
  assert.equal((await response.json()).availability.requires_manager_override,true);
  sourceAvailable=false;
  response=await onRequestGet({request:new Request(url+path,
    {headers:{'x-admin-password':'test-only'}}),env:apiEnv});
  assert.equal(response.status,503,'Unavailable protected source must be a safe hold');
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=filename=>readFileSync(resolve(root,filename),'utf8');
const html=read('admin-followup-workload.html'),js=read('assets/admin-followup-workload-v713.js'),
  api=read('functions/api/admin/quote_followup_rebalance.js'),css=read('assets/admin-followup-workload-v716.css');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['plannedFollowup716','availabilityStatus716','resolutionExportMode716',
  'feedbackOriginal716','feedbackRemedy716','feedbackRetest716','feedbackClose716'])
  assert.match(html,new RegExp(`id="${id}"`));
assert.match(js,/refreshAvailability716\(/);
assert.match(js,/remediationReceipt716\(/);
assert.match(js,/receipt=\$\{encodeURIComponent\(mode\)\}/);
assert.match(api,/availabilityRead716\(env,target.id,body.planned_followup_at\)/);
assert.match(api,/signEvidenceReceipt716\(receipt,env\)/);
assert.match(css,/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build716_availability_signature_owner_remediation_test\.mjs/);
console.log('Build 716 PASS: actual staff absence blocks, source outages, optional Ed25519 verification and genuine linked local owner remediation');
