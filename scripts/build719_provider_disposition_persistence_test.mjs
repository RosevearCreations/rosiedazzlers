import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {providerBindingDecision719,custodyDispositionDecision719,ownerPersistenceDecision719} from
  '../assets/quote-followup-disposition-v719.mjs';
import {verifyCustodyWitness718,evaluateOwnerDevices718,shiftConnectionTrial718} from
  '../assets/quote-followup-intake-v718.mjs';
import {signerCustodyAudit717} from '../assets/quote-followup-custody-v717.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

const staff='4211709f-4ca2-4cbd-9f27-c8f4c6bf4d94',
  reviewer='0c3f754c-b25e-4c60-9d55-5eeae784b319',
  signerStaff='c8d9241c-24c5-43c3-9c26-1cbd537931a6',now=new Date(),
  planned=new Date(now.getTime()+86400000).toISOString(),
  window={start_at:planned,end_at:new Date(Date.parse(planned)+3600000).toISOString()};
const configured={ROSIE_STAFF_SHIFT_ROSTER_URL:'https://roster.example.test/approved',
  ROSIE_STAFF_SHIFT_ROSTER_PINNED_ORIGIN:'https://roster.example.test',
  ROSIE_STAFF_SHIFT_ROSTER_ACCOUNT_REF:'rosie-production-tenant'};
const shift={source:'configured',provider_fetch_completed:true,shift_schedule_verified:true,
  source_revision:'live-revision-12',provider_source_account_ref:'rosie-production-tenant',
  provider_payload_sha256:'a'.repeat(64)};
const availability={hard_hold:false},trial=shiftConnectionTrial718(shift,availability,staff,window,true,now);
const good=await providerBindingDecision719(configured,shift,availability,trial,webcrypto,now);
assert.equal(good.live_source_bound,true);assert.equal(good.status,'LIVE_PINNED_ORIGIN_AND_ACCOUNT_MATCHED');
assert.match(good.pinned_origin_sha256,/^[a-f0-9]{64}$/);
assert.equal(good.independently_certified_provider,false);
assert.equal((await providerBindingDecision719({...configured,ROSIE_STAFF_SHIFT_ROSTER_PINNED_ORIGIN:'https://other.test'},shift,availability,trial)).live_source_bound,false);
assert.equal((await providerBindingDecision719({...configured,ROSIE_STAFF_SHIFT_ROSTER_ACCOUNT_REF:'wrong-tenant'},shift,availability,trial)).status,'PROVIDER_ACCOUNT_MISMATCH');
assert.equal((await providerBindingDecision719({...configured,ROSIE_STAFF_SHIFT_ROSTER_ACCOUNT_REF:undefined},shift,availability,trial)).status,'PROVIDER_ACCOUNT_PIN_NOT_CONFIGURED');
assert.equal((await providerBindingDecision719({...configured,ROSIE_STAFF_SHIFT_ROSTER_URL:undefined},shift,availability,trial)).status,'PROVIDER_NOT_CONFIGURED');
assert.equal((await providerBindingDecision719(configured,{...shift,shift_schedule_verified:false},availability,trial)).live_source_bound,false);
assert.equal((await providerBindingDecision719(configured,shift,{hard_hold:true},trial)).live_source_bound,false);
assert.equal((await providerBindingDecision719(configured,shift,{hard_hold:false,requires_manager_override:true},trial)).live_source_bound,false);

const serverKey=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const serverJwk=await webcrypto.subtle.exportKey('jwk',serverKey.privateKey);
const witnessKey=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const publicJwk=await webcrypto.subtle.exportKey('jwk',witnessKey.publicKey);
const env={...configured,ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(serverJwk),
  ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:'actual-test-key',
  ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID:signerStaff,
  ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK:JSON.stringify(publicJwk),
  ROSIE_EXPORT_CUSTODY_WITNESS_ID:'independent-test-witness',
  ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID:reviewer};
const audit=await signerCustodyAudit717(env,webcrypto);
assert.equal(audit.signing_available,true);
const signedPayload={type:'rosie_export_signer_custody_witness',scope:'internal_export_key_only',
  subject_signer_id:audit.signer_id,subject_public_key_sha256:audit.public_key_sha256,
  witness_id:env.ROSIE_EXPORT_CUSTODY_WITNESS_ID,witnessed_at:now.toISOString()};
const payloadBytes=new TextEncoder().encode(JSON.stringify(signedPayload));
const signature=await webcrypto.subtle.sign('Ed25519',witnessKey.privateKey,payloadBytes);
const envelope={signature_algorithm:'Ed25519',payload_base64:Buffer.from(payloadBytes).toString('base64'),
  signature_base64:Buffer.from(signature).toString('base64')};
const witness=await verifyCustodyWitness718(envelope,env,audit,webcrypto,now);
assert.equal(witness.ok,true);
const reviewInput={custody_decision:'accept_for_internal_export_only',
  independent_evidence_reference:'WITNESS-REVIEW-REAL-REF',
  review_note:'The separately received signed witness was checked against the configured public key.',
  acknowledge_not_proof_b:true};
const disposition=custodyDispositionDecision719(reviewInput,witness,{id:reviewer,role_code:'admin'},env,now);
assert.equal(disposition.ok,true);assert.equal(disposition.proof_b_authorized,false);
assert.equal(disposition.receipt_saved_on_server,false);
assert.equal(disposition.independent_human_identity_technically_verified,false);
assert.equal(custodyDispositionDecision719(reviewInput,witness,{id:signerStaff,role_code:'admin'},env).ok,false);
assert.equal(custodyDispositionDecision719(reviewInput,witness,{id:reviewer,role_code:'detailer'},env).ok,false);
assert.equal(custodyDispositionDecision719({...reviewInput,acknowledge_not_proof_b:false},witness,{id:reviewer,role_code:'admin'},env).ok,false);
assert.equal(custodyDispositionDecision719(reviewInput,witness,{id:reviewer,role_code:'admin'},
  {...env,ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID:reviewer}).ok,false);

const checked=Object.fromEntries(['acceptDesktop714','acceptMobile714','acceptRoles714',
  'acceptEvidence714','acceptNoSend714'].map(k=>[k,true]));
const original={app:'Rosie Dazzlers',build:716,receipt_kind:'owner_self_attested_local_visual_review',
  feedback_disposition:'needs_changes',server_acceptance_recorded:false,
  generated_at:new Date(now.getTime()-86400000).toISOString(),
  device_findings_note:'Text overlapping on an actual device.'};
const accept={app:'Rosie Dazzlers',build:716,receipt_kind:'owner_self_attested_local_visual_review',
  feedback_disposition:'accepted',server_acceptance_recorded:false,owner_name:'Owner',
  generated_at:now.toISOString(),device_findings_note:'Actual computer retest',checked};
const ownerBody={original_feedback_json:JSON.stringify(original),desktop_feedback_json:JSON.stringify(accept),
  mobile_feedback_json:JSON.stringify({...accept,device_findings_note:'Actual phone retest'}),
  remediation_note:'A real layout fix was checked on desktop and mobile devices.',
  explicit_owner_retest_confirmed:true};
const ownerReview=await evaluateOwnerDevices718(ownerBody,{id:reviewer,role_code:'admin'},webcrypto,now);
assert.ok(ownerReview);
const exportOnly=ownerPersistenceDecision719(ownerReview,{id:reviewer,role_code:'admin'},'download_only',true,now);
assert.equal(exportOnly.decision,'DOWNLOAD_ONLY_NO_SERVER_RETENTION');
assert.equal(exportOnly.raw_file_contents_persisted,false);
assert.equal(exportOnly.hashes_persisted,false);
assert.equal(exportOnly.server_owner_acceptance_recorded,false);
assert.equal(ownerPersistenceDecision719(ownerReview,{id:reviewer,role_code:'admin'},'request_protected_hash_ledger',true,now).decision,
  'PROTECTED_HASH_LEDGER_REQUEST_HELD');
assert.equal(ownerPersistenceDecision719(ownerReview,{id:reviewer,role_code:'admin'},'download_only',false,now),null);

const apiEnv={...env,SUPABASE_URL:'https://db.example.test',SUPABASE_SERVICE_ROLE_KEY:'service-private',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true',
  ROSIE_STAFF_SHIFT_ROSTER_BEARER:'real-secret-not-in-response'};
const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const ownerPost=data=>new Request(url,{method:'POST',headers:{'Content-Type':'application/json',
  Cookie:'rd_staff_session=real-test-staff-session'},body:JSON.stringify(data)});
let providerRequests=0,remoteBearer='';const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,opts={})=>{
  const uri=new URL(String(input));
  if(uri.pathname.endsWith('/staff_auth_sessions'))return Response.json([{
    id:'real-session-replacement',staff_user_id:reviewer,revoked_at:null,
    expires_at:new Date(Date.now()+86400000).toISOString(),
    staff_user:{id:reviewer,role_code:'admin',is_active:true,can_manage_bookings:true}}]);
  if(uri.pathname.endsWith('/staff_users'))return Response.json([{id:staff,role_code:'detailer',is_active:true,can_manage_bookings:true}]);
  if(uri.pathname.endsWith('/staff_availability_blocks'))return Response.json([]);
  if(uri.hostname==='roster.example.test'){
    providerRequests++;remoteBearer=opts.headers?.Authorization;
    return Response.json({complete:true,source_revision:'live-revision-12',source_account_ref:'rosie-production-tenant',
      generated_at:now.toISOString(),shifts:[{id:'approved-actual-roster-row',staff_user_id:staff,
        start_at:new Date(Date.parse(planned)-3600000).toISOString(),
        end_at:new Date(Date.parse(planned)+3600000).toISOString(),
        status:'approved',approved_by:'actual-provider-reviewer'}]});
  }
  throw Error('Unexpected test source: '+uri.pathname);
};
try{
  const auth={'x-admin-password':'test-only'};
  const bindingUrl=url+`?audit=provider_binding&staff_user_id=${staff}&planned_followup_at=${encodeURIComponent(planned)}`;
  assert.equal((await onRequestGet({request:new Request(bindingUrl),env:apiEnv})).status,401);
  let res=await onRequestGet({request:new Request(bindingUrl,{headers:auth}),env:apiEnv});
  assert.equal(res.status,200);const binding=await res.json();
  assert.equal(binding.provider_binding.live_source_bound,true);
  assert.equal(remoteBearer,'Bearer real-secret-not-in-response');
  assert.ok(providerRequests>0);
  assert.doesNotMatch(JSON.stringify(binding),/real-secret-not-in-response|rosie-production-tenant/);
  assert.equal((await onRequestPost({request:new Request(url,{method:'POST',
    headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({action:'review_export_custody_disposition',
      witness_envelope:envelope,...reviewInput})}),env:apiEnv})).status,403);
  res=await onRequestPost({request:ownerPost({action:'review_export_custody_disposition',
    witness_envelope:envelope,...reviewInput}),env:apiEnv});
  assert.equal(res.status,200);const signedDisposition=await res.json();
  assert.equal(signedDisposition.receipt.status,'INTERNAL_EXPORT_REVIEW_ACCEPTED');
  assert.equal(signedDisposition.signed_receipt.signature_algorithm,'Ed25519');
  res=await onRequestPost({request:ownerPost({action:'decide_owner_device_retention',
    ...ownerBody,retention_choice:'download_only',acknowledge_data_minimization:true}),env:apiEnv});
  assert.equal(res.status,200);const ownerDecision=await res.json();
  assert.equal(ownerDecision.receipt.decision,'DOWNLOAD_ONLY_NO_SERVER_RETENTION');
  assert.equal(ownerDecision.receipt.hashes_persisted,false);
  assert.equal(ownerDecision.signature_status,'INTERNAL_SIGNER_ONLY');
  res=await onRequestPost({request:ownerPost({action:'decide_owner_device_retention',
    ...ownerBody,retention_choice:'request_protected_hash_ledger',acknowledge_data_minimization:true}),env:apiEnv});
  assert.equal((await res.json()).receipt.decision,'PROTECTED_HASH_LEDGER_REQUEST_HELD');
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=name=>readFileSync(resolve(root,name),'utf8');
const html=read('admin-followup-workload.html'),js=read('assets/admin-followup-workload-v713.js');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['shiftBinding719','shiftBindingStatus719','custodyDisposition719','custodyReference719',
  'custodyNote719','custodyScopeAck719','custodyReview719','ownerRetentionChoice719',
  'ownerMinimizationAck719','ownerRetention719','ownerRetentionStatus719'])
  assert.match(html,new RegExp(`id="${id}"`));
for(const functionName of ['verifyProviderBinding719','reviewCustodyDisposition719','decideOwnerRetention719'])
  assert.match(js,new RegExp(functionName));
assert.match(read('assets/admin-followup-workload-v719.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build719_provider_disposition_persistence_test\.mjs/);
console.log('Build 719 PASS: pinned live provider account/origin, distinct session reviewer disposition, signed internal receipt and no unapproved owner evidence retention');
