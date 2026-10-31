import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {shiftConnectionTrial718,verifyCustodyWitness718,evaluateOwnerDevices718} from
  '../assets/quote-followup-intake-v718.mjs';
import {signerCustodyAudit717} from '../assets/quote-followup-custody-v717.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

const staffId='4211709f-4ca2-4cbd-9f27-c8f4c6bf4d94',ownerId='0c3f754c-b25e-4c60-9d55-5eeae784b319',
  now=new Date(),planned=new Date(now.getTime()+86400000).toISOString(),
  window={start_at:planned,end_at:new Date(Date.parse(planned)+3600000).toISOString()};
const none=shiftConnectionTrial718({source:'not_configured',shift_schedule_verified:false},
  {hard_hold:false},staffId,window,false,now);
assert.equal(none.verdict,'NOT_CONFIGURED');assert.equal(none.provider_get_attempted,false);
assert.equal(none.booking_mutated,false);

const serverKey=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const serverJwk=await webcrypto.subtle.exportKey('jwk',serverKey.privateKey);
const witnessKey=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const publicWitnessJwk=await webcrypto.subtle.exportKey('jwk',witnessKey.publicKey);
const env={ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(serverJwk),
  ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:'actual-test-export-key',
  ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK:JSON.stringify(publicWitnessJwk),
  ROSIE_EXPORT_CUSTODY_WITNESS_ID:'independent-test-witness'};
const audit=await signerCustodyAudit717(env,webcrypto);
assert.equal(audit.signing_available,true);
const payload={type:'rosie_export_signer_custody_witness',scope:'internal_export_key_only',
  subject_signer_id:audit.signer_id,subject_public_key_sha256:audit.public_key_sha256,
  witness_id:env.ROSIE_EXPORT_CUSTODY_WITNESS_ID,witnessed_at:now.toISOString()};
const envelope=async value=>{
  const message=new TextEncoder().encode(JSON.stringify(value));
  const sig=await webcrypto.subtle.sign('Ed25519',witnessKey.privateKey,message);
  return {signature_algorithm:'Ed25519',payload_base64:Buffer.from(message).toString('base64'),
    signature_base64:Buffer.from(sig).toString('base64')};
};
const signed=await envelope(payload);
const verified=await verifyCustodyWitness718(signed,env,audit,webcrypto,now);
assert.equal(verified.ok,true);
assert.equal(verified.signature_verified_against_pinned_key,true);
assert.equal(verified.independent_person_verified,false);
assert.equal(verified.proof_b_authorized,false);
assert.equal((await verifyCustodyWitness718(signed,{...env,ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK:undefined},audit,webcrypto,now)).ok,false);
assert.equal((await verifyCustodyWitness718(await envelope({...payload,scope:'cross_app_proof_b'}),env,audit,webcrypto,now)).ok,false);
assert.equal((await verifyCustodyWitness718(await envelope({...payload,subject_public_key_sha256:'e'.repeat(64)}),env,audit,webcrypto,now)).ok,false);
assert.equal((await verifyCustodyWitness718({...signed,signature_base64:Buffer.alloc(64).toString('base64')},env,audit,webcrypto,now)).ok,false);
const sameKey={...env,ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK:JSON.stringify({kty:'OKP',crv:'Ed25519',x:serverJwk.x})};
assert.equal((await verifyCustodyWitness718(signed,sameKey,audit,webcrypto,now)).ok,false);

const checked=Object.fromEntries(['acceptDesktop714','acceptMobile714','acceptRoles714',
  'acceptEvidence714','acceptNoSend714'].map(x=>[x,true]));
const original={app:'Rosie Dazzlers',build:716,receipt_kind:'owner_self_attested_local_visual_review',
  feedback_disposition:'needs_changes',server_acceptance_recorded:false,
  generated_at:new Date(now.getTime()-86400000).toISOString(),
  device_findings_note:'Text overlaps on the real phone.'};
const accept={app:'Rosie Dazzlers',build:716,receipt_kind:'owner_self_attested_local_visual_review',
  feedback_disposition:'accepted',server_acceptance_recorded:false,owner_name:'Owner',
  generated_at:now.toISOString(),device_findings_note:'Real desktop browser retested',checked};
const body={original_feedback_json:JSON.stringify(original),desktop_feedback_json:JSON.stringify(accept),
  mobile_feedback_json:JSON.stringify({...accept,device_findings_note:'Real mobile browser retested'}),
  remediation_note:'Layout was corrected and visually retested on desktop and mobile.',
  explicit_owner_retest_confirmed:true};
const accepted=await evaluateOwnerDevices718(body,{id:ownerId,role_code:'admin'},webcrypto,now);
assert.ok(accepted);assert.equal(accepted.server_receipt_structure_checked,true);
assert.equal(accepted.server_acceptance_persisted,false);
assert.equal(accepted.device_origin_independently_verified,false);
assert.equal(await evaluateOwnerDevices718({...body,explicit_owner_retest_confirmed:false},
  {id:ownerId,role_code:'admin'},webcrypto,now),null);
assert.equal(await evaluateOwnerDevices718({...body,mobile_feedback_json:body.desktop_feedback_json},
  {id:ownerId,role_code:'admin'},webcrypto,now),null);
assert.equal(await evaluateOwnerDevices718(body,{id:ownerId,role_code:'detailer'},webcrypto,now),null);

const apiEnv={...env,SUPABASE_URL:'https://db.example.test',SUPABASE_SERVICE_ROLE_KEY:'private-key',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true',
  ROSIE_STAFF_SHIFT_ROSTER_URL:'https://roster.example.test/approved',
  ROSIE_STAFF_SHIFT_ROSTER_BEARER:'secret-for-trial'};
const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance',
  auth={'x-admin-password':'test-only'},input=uri=>new Request(uri,{headers:auth});
const sourcePayload={complete:true,source_revision:'real-feed-revision-11',
  generated_at:now.toISOString(),shifts:[{id:'real-approved-row',staff_user_id:staffId,
    start_at:new Date(Date.parse(planned)-3600000).toISOString(),
    end_at:new Date(Date.parse(planned)+3600000).toISOString(),
    approved_by:'real-roster-approver',status:'approved'}]};
let calls=0,lastAuthorization='';const originalFetch=globalThis.fetch;
globalThis.fetch=async (input,opts={})=>{
  const u=new URL(String(input));calls++;
  if(u.pathname.endsWith('/staff_auth_sessions'))return Response.json([{
    id:'auth-session-for-test',staff_user_id:ownerId,
    expires_at:new Date(Date.now()+86400000).toISOString(),revoked_at:null,
    staff_user:{id:ownerId,role_code:'admin',is_active:true,can_manage_bookings:true}}]);
  if(u.pathname.endsWith('/staff_users'))return Response.json([{id:staffId,role_code:'detailer',is_active:true,can_manage_bookings:true}]);
  if(u.pathname.endsWith('/staff_availability_blocks'))return Response.json([]);
  if(u.hostname==='roster.example.test'){
    lastAuthorization=opts.headers?.Authorization;
    return Response.json(sourcePayload);
  }
  throw Error('No other source should be touched: '+u.pathname);
};
try{
  const q=`?trial=shift&staff_user_id=${staffId}&planned_followup_at=${encodeURIComponent(planned)}`;
  assert.equal((await onRequestGet({request:new Request(url+q),env:apiEnv})).status,401);
  let response=await onRequestGet({request:input(url+q),env:apiEnv});
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.trial.verdict,'SOURCE_REPORTED_APPROVED_SHIFT');
  assert.equal(result.trial.provider_get_attempted,true);
  assert.match(result.trial.provider_payload_sha256,/^[a-f0-9]{64}$/);
  assert.equal(lastAuthorization,'Bearer secret-for-trial');
  assert.doesNotMatch(JSON.stringify(result),/secret-for-trial/);
  const noSource={...apiEnv,ROSIE_STAFF_SHIFT_ROSTER_URL:undefined};
  response=await onRequestGet({request:input(url+q),env:noSource});
  assert.equal((await response.json()).trial.verdict,'NOT_CONFIGURED');

  const post=contents=>new Request(url,{method:'POST',headers:{...auth,'Content-Type':'application/json'},
    body:JSON.stringify(contents)});
  const ownerPost=contents=>new Request(url,{method:'POST',
    headers:{'Content-Type':'application/json','Cookie':'rd_staff_session=valid-test-owner-session'},
    body:JSON.stringify(contents)});
  assert.equal((await onRequestPost({request:new Request(url,{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify_export_custody_witness',witness_envelope:signed})}),env:apiEnv})).status,401);
  assert.equal((await onRequestPost({request:post({action:'review_owner_devices',...body}),env:apiEnv})).status,403);
  response=await onRequestPost({request:ownerPost({action:'verify_export_custody_witness',witness_envelope:signed}),env:apiEnv});
  const witnessResponse=await response.json();
  assert.equal(response.status,200,JSON.stringify(witnessResponse));assert.equal(witnessResponse.receipt.signature_verified_against_pinned_key,true);
  response=await onRequestPost({request:ownerPost({action:'review_owner_devices',...body}),env:apiEnv});
  const ownerResponse=await response.json();
  assert.equal(response.status,200,JSON.stringify(ownerResponse));assert.equal(ownerResponse.receipt.server_acceptance_persisted,false);
  assert.ok(calls>0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=f=>readFileSync(resolve(root,f),'utf8');
const html=read('admin-followup-workload.html'),js=read('assets/admin-followup-workload-v713.js'),
  api=read('functions/api/admin/quote_followup_rebalance.js');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const element of ['shiftTrial718','shiftTrialExport718','witnessFile718','witnessVerify718',
  'serverOwnerAck718','serverOwnerReview718'])assert.match(html,new RegExp(`id="${element}"`));
assert.match(js,/trialShiftProvider718/);
assert.match(js,/serverOwnerReview718/);
assert.match(api,/verifyCustodyWitness718/);
assert.match(read('assets/admin-followup-workload-v718.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build718_provider_witness_owner_trial_test\.mjs/);
console.log('Build 718 PASS: real GET trial, conservative source outage, independently pinned witness signature checks, authenticated owner cross-device intake and no fabricated closure');
