// Rosie 924 private original-source service identity, live receiver review and signed owner decisions.
// All service-role access stays on the server. Never restarts services, auto-certifies or sends customer data.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {verifyWindowsServiceIdentity924,checkLiveReceiverEvidence924,verifyOwnerFinalReview924,finalFieldReview924} from '../../../assets/build924-field-authority.mjs';
const E=encodeURIComponent,HEX40=/^[a-f0-9]{40}$/,HEX64=/^[a-f0-9]{64}$/;
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'}});
const DENY=()=>reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
const tables={apps:'rosie_sysop_app_attestations_v923',challenge:'rosie_sysop_identity_challenges_v924',identity:'rosie_sysop_identity_witness_v924',
 owners:'rosie_sysop_owner_final_reviews_v924',native:'rosie_sysop_native_api_witness_v921'};
const envJSON=(env,name)=>{try{const v=JSON.parse(env?.[name]||'null');return v&&typeof v==='object'&&!Array.isArray(v)?v:null}catch{return null}};
const validPin=x=>x&&HEX40.test(x.expectedCommit||'')&&HEX64.test(x.fingerprintSha256||'')&&typeof x.publicKeySpkiBase64==='string';
async function db(env,path,opt={}){
 const base=String(env?.SUPABASE_URL||'').replace(/\/+$/,'');
 if(!/^https:\/\/[A-Za-z0-9.-]+$/.test(base)||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('PRIVATE_ORIGINAL_DATABASE_UNAVAILABLE');
 const res=await fetch(base+'/rest/v1/'+path,{...opt,headers:{...serviceHeaders(env),'Content-Type':'application/json',...opt.headers},redirect:'error',cache:'no-store'});
 if(!res.ok)throw Error('ORIGINAL_PRIVATE_DATABASE_UNAVAILABLE_OR_CONFLICT');
 if(res.status===204)return null;
 const body=await res.text();if(body.length>70000)throw Error('ORIGINAL_PRIVATE_DATABASE_RESPONSE_LIMIT');
 return JSON.parse(body);
}
async function rows(env,table,filter=''){const r=await db(env,table+'?select=*'+(filter?'&'+filter:'')+'&limit=40');if(!Array.isArray(r)||r.length>=40)throw Error('ORIGINAL_QUERY_INCOMPLETE');return r}
const single=a=>Array.isArray(a)&&a.length===1?a[0]:null;
async function admin(request,env){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return {response:a.response};
 if(a.auth_mode!=='session'||!a.actor?.is_active||!UUID914.test(a.actor.id)||!(hasActionAccess(a.actor,'admin.settings.manage')||hasActionAccess(a.actor,'daip.manage')))
  return {response:reply({ok:false,error:'ORIGINAL_ADMIN_SESSION_REQUIRED'},403)};
 return {actor:a.actor};
}
function roster(env){
 const r=envJSON(env,'ROSEVEAR_ROSIE920_OWNER_PINS_JSON');if(!r||Object.keys(r).length!==2)return null;
 const pins=Object.entries(r);if(pins.some(([k,v])=>!UUID914.test(k)||!validPin(v)||v.staffId!==k)||new Set(pins.map(([,v])=>v.fingerprintSha256)).size!==2||
 new Set(pins.map(([,v])=>v.ownerRole)).size!==2)return null;return r;
}
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
function liveReceiver(env,natives){
 const pins=envJSON(env,'ROSEVEAR_ROSIE921_RECEIVER_API_PINS_JSON')||{};
 const manifests=envJSON(env,'ROSEVEAR_ROSIE924_RECEIVER_MANIFESTS_JSON')||{};
 const latest=['ai-data-platform','rosevear-comms-hub'].map(id=>natives.find(x=>x.receiver_id===id)).filter(Boolean);
 try{return checkLiveReceiverEvidence924({observations:latest,manifests,pins})}catch{return null}
}
async function evidence(env){
 const [apps,challenges,identities,owners,natives]=await Promise.all([
 rows(env,tables.apps,'order=created_at.desc'),rows(env,tables.challenge,'order=created_at.desc'),
 rows(env,tables.identity,'order=created_at.desc'),rows(env,tables.owners,'order=created_at.desc'),
 rows(env,tables.native,'order=created_at.desc')]);
 return {apps,challenges,identities,owners,natives};
}
function publicState(x,live){
 const identity=x.identities[0]||null;
 const ownerReviews=x.owners.filter(r=>r.identity_witness_id===identity?.id).map(r=>({ownerStaffId:r.owner_staff_id,identityWitnessId:identity?.inspection_id,decision:r.decision,ownerRole:r.owner_role}));
 const identityWitness=identity?{inspectionId:identity.inspection_id,allServiceIdentitiesObserved:
 Array.isArray(identity.service_states)&&identity.service_states.length===4&&identity.service_states.every(s=>s.state==='RUNNING'&&s.authenticode==='VALID')}:null;
 const gate=finalFieldReview924({identityWitness,liveReceivers:live,ownerReviews});
 return {fieldGate:gate,originalApps:x.apps.map(v=>({id:v.id,hostId:v.host_id,bootId:v.boot_id,createdAt:v.created_at})),
  identityWitnesses:x.identities.map(v=>({id:v.id,inspectionId:v.inspection_id,appAttestationId:v.app_attestation_id,createdAt:v.created_at,serviceStates:v.service_states,reviewState:v.review_state})),
  ownerReviews:x.owners.map(v=>({id:v.id,identityWitnessId:v.identity_witness_id,ownerRole:v.owner_role,decision:v.decision,createdAt:v.created_at,reviewState:v.review_state})),
  nativeReceiverWitnesses:x.natives.slice(0,8).map(v=>({id:v.id,receiverId:v.receiver_id,observedAtMs:Number(v.api_observed_at_ms)})),
  receiverCompatibilityLiveNow:!!live,originalFieldCertified:false,sevenSourceConnected:false};
}
async function caseDigest(x,identityId){
 const identity=x.identities.find(i=>i.id===identityId);if(!identity)return null;
 const natives=['ai-data-platform','rosevear-comms-hub'].map(id=>x.natives.find(n=>n.receiver_id===id));
 if(natives.some(v=>!v))return null;
 return await sha(['ROSIE924_FINAL_FIELD_REVIEW_V1',identity.id,identity.app_attestation_id,identity.signature_sha256,...natives.map(v=>v.id+':'+v.signature_sha256)].join('|'));
}
export async function onRequestGet({request,env}){
 const a=await admin(request,env);if(a.response)return a.response;
 try{const x=await evidence(env),live=liveReceiver(env,x.natives),v=publicState(x,live),
 identity=x.identities[0];return reply({ok:true,build:924,...v,
 currentCaseDigestSha256:live&&identity?await caseDigest(x,identity.id):null,
 migrationApplied:true,exactShaProductionVerified:false,physicalObservationVerified:false})}
 catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_924_PRIVATE_EVIDENCE_UNAVAILABLE'},503)}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))return reply({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({ok:false,error:'JSON_REQUIRED'},415);
 const a=await admin(request,env);if(a.response)return a.response;
 let body;try{const raw=await request.text();if(raw.length>9500)throw Error();body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error()}catch{return reply({ok:false,error:'ORIGINAL_JSON_SHAPE_REQUIRED'},400)}
 try{
  if(body.action==='issue_identity_challenge'){
   if(Object.keys(body).length!==2||!UUID914.test(body.appAttestationId||''))return reply({ok:false,error:'ORIGINAL_923_APP_ATTESTATION_REQUIRED'},400);
   const app=single(await rows(env,tables.apps,'id=eq.'+E(body.appAttestationId)));
   if(!app)return reply({ok:false,state:'HOLD',error:'ORIGINAL_SIGNED_APP_ATTESTATION_NOT_FOUND'},409);
   const inspector=envJSON(env,'ROSEVEAR_ROSIE924_INSPECTOR_PIN_JSON');
   const appPin=envJSON(env,'ROSEVEAR_ROSIE923_APP_SIGNER_PIN_JSON');
   if(!validPin(inspector)||inspector.hostId!==app.host_id||!validPin(appPin)||inspector.fingerprintSha256===appPin.fingerprintSha256)
    return reply({ok:false,state:'HOLD',error:'INDEPENDENT_ORIGINAL_INSPECTOR_NOT_ENROLLED'},409);
   const nonce=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
   const ch=single(await db(env,tables.challenge+'?select=*',{method:'POST',headers:{Prefer:'return=representation'},
    body:JSON.stringify({app_attestation_id:app.id,challenge_nonce:nonce,issued_by_staff_id:a.actor.id})}));
   if(!UUID914.test(ch?.id))throw Error('ORIGINAL_924_CHALLENGE_NOT_DURABLE');
   return reply({ok:true,challengeId:ch.id,appAttestationId:app.id,challengeNonce:nonce,hostId:app.host_id,bootId:app.boot_id,expiresAt:ch.expires_at,
    fieldCertified:false},201);
  }
  if(body.action==='admit_service_identity'){
   if(Object.keys(body).length!==3||!UUID914.test(body.challengeId||'')||!body.envelope)return reply({ok:false,error:'ORIGINAL_SIGNED_SERVICE_IDENTITY_REQUIRED'},400);
   const ch=single(await rows(env,tables.challenge,'id=eq.'+E(body.challengeId))),
    app=ch?single(await rows(env,tables.apps,'id=eq.'+E(ch.app_attestation_id))):null;
   if(!ch||!app||Date.parse(ch.expires_at)<=Date.now())return reply({ok:false,state:'HOLD',error:'ORIGINAL_924_CHALLENGE_EXPIRED_OR_SOURCE_MISSING'},409);
   const inspector=envJSON(env,'ROSEVEAR_ROSIE924_INSPECTOR_PIN_JSON'),appPin=envJSON(env,'ROSEVEAR_ROSIE923_APP_SIGNER_PIN_JSON');
   if(!validPin(inspector)||inspector.hostId!==app.host_id||!validPin(appPin))return reply({ok:false,state:'HOLD',error:'ORIGINAL_INDEPENDENT_SIGNER_PINS_MISSING'},409);
   let v;try{v=await verifyWindowsServiceIdentity924({envelope:body.envelope,pin:inspector,sourceAttestation:app,challenge:ch,appSignerFingerprint:appPin.fingerprintSha256})}
   catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_SERVICE_IDENTITY_SIGNATURE_OR_SCM_REJECTED'},409)}
   const stored=single(await db(env,tables.identity+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
    challenge_id:ch.id,app_attestation_id:app.id,inspection_id:v.inspectionId,host_id:v.hostId,boot_id:v.bootId,
    observed_at_ms:v.observedAtMs,inspector_commit:v.inspectorCommit,inspector_fingerprint_sha256:inspector.fingerprintSha256,
    signature_sha256:v.signatureSha256,service_states:v.services,recorded_by_staff_id:a.actor.id})}));
   if(!UUID914.test(stored?.id))throw Error('ORIGINAL_924_IDENTITY_NOT_DURABLE');
   return reply({ok:true,identityWitnessId:stored.id,state:'INDEPENDENT_SERVICE_IDENTITY_REVIEW_HOLD',
    allServiceIdentitiesObserved:v.allServiceIdentitiesObserved,fieldCertified:false},201);
  }
  if(body.action==='record_owner_final_review'){
   if(Object.keys(body).length!==2||!body.envelope||!UUID914.test(body.envelope?.payload?.identityWitnessId||''))
    return reply({ok:false,error:'ORIGINAL_SIGNED_OWNER_REVIEW_REQUIRED'},400);
   const r=roster(env),pin=r?.[a.actor.id];if(!pin)return reply({ok:false,state:'HOLD',error:'TWO_DISTINCT_OWNER_PIN_ROSTER_REQUIRED'},409);
   const x=await evidence(env),w=single(x.identities.filter(v=>v.id===body.envelope.payload.identityWitnessId)),
    live=liveReceiver(env,x.natives);
   if(!w)return reply({ok:false,state:'HOLD',error:'ORIGINAL_IDENTITY_WITNESS_REQUIRED'},409);
   const digest=await caseDigest(x,w.id);if(!digest||(!live&&body.envelope.payload.decision==='APPROVE_REVIEW'))
    return reply({ok:false,state:'HOLD',error:'TWO_FRESH_ORIGINAL_RECEIVER_WITNESSES_REQUIRED'},409);
   let v;try{v=await verifyOwnerFinalReview924({envelope:body.envelope,pin,actorId:a.actor.id,caseDigestSha256:digest})}
   catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_OWNER_SIGNED_REVIEW_REJECTED'},409)}
   const stored=single(await db(env,tables.owners+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
    identity_witness_id:w.id,owner_staff_id:v.ownerStaffId,owner_role:v.ownerRole,owner_signer_fingerprint_sha256:pin.fingerprintSha256,
    review_id:v.reviewId,case_digest_sha256:digest,decision:v.decision,observed_at_ms:v.observedAtMs,
    signature_sha256:v.signatureSha256})}));
   if(!UUID914.test(stored?.id))throw Error('ORIGINAL_OWNER_REVIEW_NOT_DURABLE');
   return reply({ok:true,reviewId:stored.id,state:'OWNER_SIGNED_REVIEW_NOT_FIELD_CERTIFICATION',fieldCertified:false},201);
  }
  return reply({ok:false,error:'ACTION_NOT_SUPPORTED'},400);
 }catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_924_PRIVATE_EVIDENCE_CONFLICT_OR_UNAVAILABLE'},409)}
}
export const onRequestPut=DENY,onRequestPatch=DENY,onRequestDelete=DENY,onRequestOptions=DENY;
