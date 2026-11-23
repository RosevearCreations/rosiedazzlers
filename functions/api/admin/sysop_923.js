// Rosie 923: private original-source one-time app challenge and immutable signed evidence.
// Deliberately no physical certification, remote commands, restart or CONNECTED state.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {verifyAppHealth922,finalFieldGate922} from '../../../assets/build922-original-application-authority-contract.mjs';
const E=encodeURIComponent,reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const DENY=()=>reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
const pin=(env)=>{try{return JSON.parse(env.ROSEVEAR_ROSIE923_APP_SIGNER_PIN_JSON||'null')}catch{return null}};
async function db(env,path,opt={}){
 const base=String(env?.SUPABASE_URL||'').replace(/\/+$/,'');
 if(!/^https:\/\/[A-Za-z0-9.-]+$/.test(base)||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('PRIVATE_ORIGINAL_DATABASE_UNAVAILABLE');
 const r=await fetch(base+'/rest/v1/'+path,{...opt,headers:{...serviceHeaders(env),'Content-Type':'application/json',...opt.headers},redirect:'error',cache:'no-store'});
 if(!r.ok)throw Error('ORIGINAL_DB_UNAVAILABLE_OR_CONFLICT');
 if(r.status===204)return null;
 const t=await r.text();if(t.length>40000)throw Error('ORIGINAL_PRIVATE_RESPONSE_TOO_LARGE');
 return JSON.parse(t);
}
async function rows(env,t,filter=''){const v=await db(env,t+'?select=*'+(filter?'&'+filter:'')+'&limit=40');if(!Array.isArray(v)||v.length>=40)throw Error('ORIGINAL_QUERY_LIMIT');return v}
async function authorized(request,env){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return {response:a.response};
 if(a.auth_mode!=='session'||!a.actor?.is_active||!UUID914.test(a.actor.id)||!(hasActionAccess(a.actor,'admin.settings.manage')||hasActionAccess(a.actor,'daip.manage')))return {response:reply({ok:false,error:'ORIGINAL_ADMIN_AUTHORITY_REQUIRED'},403)};
 return {actor:a.actor};
}
const single=a=>Array.isArray(a)&&a.length===1?a[0]:null;
export async function onRequestGet({request,env}){
 const a=await authorized(request,env);if(a.response)return a.response;
 try{
 const [samples,challenges,attestations]=await Promise.all([
 rows(env,'rosie_sysop_windows_health_v921','order=created_at.desc'),
 rows(env,'rosie_sysop_app_challenges_v923','order=created_at.desc'),
 rows(env,'rosie_sysop_app_attestations_v923','order=created_at.desc')]);
 return reply({ok:true,build:923,original921Samples:samples.map(s=>({sampleId:s.sample_id,hostId:s.host_id,bootId:s.boot_id,sampledAtMs:Number(s.sampled_at_ms)})),
 challenges:challenges.map(x=>({id:x.id,healthSampleId:x.health_sample_id,expiresAt:x.expires_at,consumed:attestations.some(a=>a.challenge_id===x.id)})),
 attestations:attestations.map(x=>({id:x.id,createdAt:x.created_at,hostId:x.host_id,serviceStates:x.service_states,reviewState:x.review_state})),
 fieldGate:finalFieldGate922(),originalWindowsAppAgentObserved:attestations.length>0,physicalRecoveryCertified:false,sevenSourceConnected:false})}
 catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_PRIVATE_EVIDENCE_UNAVAILABLE'},503)}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))return reply({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({ok:false,error:'JSON_REQUIRED'},415);
 const a=await authorized(request,env);if(a.response)return a.response;
 let body;try{const raw=await request.text();if(raw.length>6000)throw Error();body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error()}catch{return reply({ok:false,error:'ORIGINAL_JSON_SHAPE_REJECTED'},400)}
 try{
 if(body.action==='issue_app_challenge'){
  if(Object.keys(body).length!==2||!UUID914.test(body.healthSampleId||''))return reply({ok:false,error:'ORIGINAL_SAMPLE_ID_REQUIRED'},400);
  const sample=single(await rows(env,'rosie_sysop_windows_health_v921','sample_id=eq.'+E(body.healthSampleId)));
  if(!sample)return reply({ok:false,state:'HOLD',error:'ORIGINAL_921_SIGNED_SAMPLE_REQUIRED'},409);
  const challengeNonce=[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
  const challenge=single(await db(env,'rosie_sysop_app_challenges_v923?select=*',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({health_sample_id:sample.sample_id,challenge_nonce:challengeNonce,issued_by_staff_id:a.actor.id})}));
  if(!UUID914.test(challenge?.id))throw Error('CHALLENGE_NOT_DURABLE');
  return reply({ok:true,challengeId:challenge.id,challengeNonce,healthSampleId:sample.sample_id,expiresAt:challenge.expires_at,originalHostId:sample.host_id,originalBootId:sample.boot_id,originalSampledAtMs:Number(sample.sampled_at_ms),signedAgentMustRunOnOriginalWindows:true,fieldCertified:false},201);
 }
 if(body.action==='admit_app_attestation'){
  if(Object.keys(body).length!==3||!UUID914.test(body.challengeId||'')||!body.envelope)return reply({ok:false,error:'ORIGINAL_SIGNED_EVIDENCE_REQUIRED'},400);
  const challenge=single(await rows(env,'rosie_sysop_app_challenges_v923','id=eq.'+E(body.challengeId)));
  if(!challenge||Date.parse(challenge.expires_at)<=Date.now())return reply({ok:false,state:'HOLD',error:'ORIGINAL_CHALLENGE_EXPIRED_OR_UNKNOWN'},409);
  const sample=single(await rows(env,'rosie_sysop_windows_health_v921','sample_id=eq.'+E(challenge.health_sample_id)));
  if(!sample)return reply({ok:false,state:'HOLD',error:'ORIGINAL_921_SOURCE_MISSING'},409);
  const signer=pin(env);if(!signer||signer.hostId!==sample.host_id)return reply({ok:false,state:'HOLD',error:'ORIGINAL_WINDOWS_APP_SIGNER_NOT_ENROLLED'},409);
  let verified;try{verified=await verifyAppHealth922({envelope:body.envelope,pin:signer,original921Sample:sample,challengeNonce:challenge.challenge_nonce})}
  catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_APP_SIGNED_CHALLENGE_REJECTED'},409)}
  const saved=single(await db(env,'rosie_sysop_app_attestations_v923?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
    challenge_id:challenge.id,health_sample_id:sample.sample_id,attestation_id:verified.attestationId,host_id:sample.host_id,boot_id:sample.boot_id,
    sampled_at_ms:body.envelope.payload.sampledAtMs,sampler_commit:body.envelope.payload.samplerCommit,
    sampler_fingerprint_sha256:signer.fingerprintSha256,signature_sha256:verified.signatureSha256,
    service_states:verified.serviceStates,admitted_by_staff_id:a.actor.id})}));
  if(!UUID914.test(saved?.id))throw Error('ORIGINAL_ATTESTATION_NOT_DURABLE');
  return reply({ok:true,attestationRecordId:saved.id,state:'SIGNED_ORIGINAL_APPLICATION_OBSERVATION_REVIEW',fieldCertified:false,sevenSourceConnected:false},201);
 }
 return reply({ok:false,error:'ACTION_NOT_SUPPORTED'},400);
 }catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_PRIVATE_EVIDENCE_CONFLICT'},409)}
}
export const onRequestPut=DENY,onRequestDelete=DENY,onRequestPatch=DENY,onRequestOptions=DENY;
