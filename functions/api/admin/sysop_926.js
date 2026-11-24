// Private, original-only role enrollment and historical runtime certification. No service actions.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {checkLiveReceiverEvidence924} from '../../../assets/build924-field-authority.mjs';
import {digest925} from '../../../assets/build925-field-reconciliation.mjs';
import {H40,H64,UUID,verify926,validateRoster926,priorReview926,evaluate926} from '../../../assets/build926-runtime-certification.mjs';
const CH='rosie_sysop_enrollment_challenges_v926',EN='rosie_sysop_witness_enrollment_v926',CA='rosie_sysop_runtime_cases_v926',CE='rosie_sysop_operational_certifications_v926';
const E=encodeURIComponent,need=(x,m='ORIGINAL_EVIDENCE_HOLD')=>{if(!x)throw Error(m)};
const json=(env,k)=>JSON.parse(env[k]||'null');
const reply=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'}});
const deny=()=>reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
async function db(env,path,opt={}){const base=String(env.SUPABASE_URL||'').replace(/\/+$/,'');need(/^https:\/\/[A-Za-z0-9.-]+$/.test(base)&&env.SUPABASE_SERVICE_ROLE_KEY);
 const r=await fetch(base+'/rest/v1/'+path,{...opt,headers:{...serviceHeaders(env),'Content-Type':'application/json',...opt.headers},redirect:'error',cache:'no-store'});need(r.ok);const s=await r.text();need(s.length<=150000);return s?JSON.parse(s):null}
async function one(env,t,id){need(UUID.test(id||''));const a=await db(env,t+'?select=*&id=eq.'+E(id)+'&limit=2');need(Array.isArray(a)&&a.length===1);return a[0]}
async function add(env,t,data){const a=await db(env,t+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(data)});need(Array.isArray(a)&&a.length===1&&UUID.test(a[0].id));return a[0].id}
async function auth(request,env){const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});if(!a.ok)return a;if(a.auth_mode!=='session'||!a.actor?.is_active||!UUID.test(a.actor.id))return {ok:false,response:reply({ok:false,error:'ORIGINAL_STAFF_SESSION_REQUIRED'},403)};return a}
async function settings(env){
 const roles=json(env,'ROSEVEAR_ROSIE925_ROLE_PINS_JSON'),app=json(env,'ROSEVEAR_ROSIE923_APP_SIGNER_PIN_JSON'),runtime=json(env,'ROSEVEAR_ROSIE926_RUNTIME_PIN_JSON'),authority=json(env,'ROSEVEAR_ROSIE926_CERTIFICATION_PIN_JSON'),expected=json(env,'ROSEVEAR_ROSIE926_EXPECTED_RUNTIME_JSON'),oldExpected=json(env,'ROSEVEAR_ROSIE925_EXPECTED_WINDOWS_IDENTITIES_JSON'),productionSha=env.ROSEVEAR_ROSIE925_EXPECTED_PRODUCTION_SHA;
 validateRoster926(roles,app?.fingerprintSha256,runtime,authority);need(expected&&oldExpected&&H40.test(productionSha||''),'ORIGINAL_RUNTIME_CONFIGURATION_REQUIRED');
 const priorConfig=await digest925({pins:roles,appFingerprint:app.fingerprintSha256,expected:oldExpected,productionSha});
 const configDigest=await digest925({priorConfig,runtime,authority,expected});
 return {roles,app,runtime,authority,expected,productionSha,priorConfig,configDigest}
}
const nonce=()=>[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
const owner=(a,c)=>hasActionAccess(a.actor,'admin.settings.manage')&&['PRIMARY_OWNER','SECOND_OWNER'].some(r=>c.roles[r].staffId===a.actor.id);
const fresh=(s,ms=300000)=>Number.isFinite(s)&&s<=Date.now()+2000&&Date.now()-s<=ms;
async function source(env,c,reviewId){
 const review=await one(env,'rosie_sysop_field_reviews_v925',reviewId),old=await one(env,'rosie_sysop_field_cases_v925',review.case_id);
 need(old.config_digest===c.priorConfig&&fresh(Date.parse(review.created_at)),'PRIOR_REVIEW_STALE_OR_DRIFTED');
 const b=priorReview926(review,old,c.productionSha);
 need(await digest925(b)===review.case_digest,'PRIOR_CASE_DIGEST_MISMATCH');
 const a=await one(env,'rosie_sysop_app_attestations_v923',b.appAttestationId);
 need(a.host_id===b.hostId&&a.boot_id===b.bootId&&a.sampler_commit===c.app.expectedCommit&&a.sampler_fingerprint_sha256===c.app.fingerprintSha256&&fresh(Number(a.sampled_at_ms)),'ORIGINAL_APP_SAMPLE_STALE');
 const natives=await Promise.all(b.nativeReceiptIds.map(id=>one(env,'rosie_sysop_native_api_witness_v921',id)));
 checkLiveReceiverEvidence924({observations:natives,manifests:json(env,'ROSEVEAR_ROSIE924_RECEIVER_MANIFESTS_JSON'),pins:json(env,'ROSEVEAR_ROSIE921_RECEIVER_API_PINS_JSON')});
 return {review,b}
}
export async function onRequestGet({request,env}){
 const a=await auth(request,env);if(!a.ok)return a.response;
 const admin=hasActionAccess(a.actor,'admin.settings.manage');let cfg=null;
 try{cfg=await settings(env)}catch{}
 const role=cfg?Object.entries({...cfg.roles,RUNTIME_INSPECTOR:cfg.runtime,CERTIFICATION_AUTHORITY:cfg.authority}).find(([,p])=>p.staffId===a.actor.id)?.[0]||null:null;
 if(!admin&&!role)return reply({ok:false,error:'ORIGINAL_ROLE_REQUIRED'},403);
 try{
 const enrollments=admin?await db(env,EN+'?select=id,staff_id,created_at&order=created_at.desc&limit=20'):[];
 const recent=admin?await db(env,CE+'?select=id,case_id,certified,result,created_at&order=created_at.desc&limit=20'):[];
 return reply({ok:true,build:926,actorRole:role,roleRosterConfigured:!!cfg,enrollments,recentCertifications:recent,continuousHealthCertified:false,sevenSourceConnected:false})
 }catch{return reply({ok:false,state:'HOLD',error:'PRIVATE_STORAGE_UNAVAILABLE'},503)}
}
export async function onRequestPost({request,env}){
 if(request.headers.get('origin')!==new URL(request.url).origin||(request.headers.get('sec-fetch-site')&&!['same-origin','none'].includes(request.headers.get('sec-fetch-site'))))return reply({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({ok:false,error:'JSON_REQUIRED'},415);
 const a=await auth(request,env);if(!a.ok)return a.response;
 try{
 const raw=await request.text();need(raw.length<=30000);const x=JSON.parse(raw);need(x&&typeof x==='object'&&!Array.isArray(x));const c=await settings(env),w=c.roles.PHYSICAL_WITNESS;
 if(x.action==='issue_enrollment'){
 need(Object.keys(x).length===1&&owner(a,c),'ENROLLED_OWNER_REQUIRED');
 const binding={challengeId:crypto.randomUUID(),nonce:nonce(),staffId:w.staffId,fingerprint:w.fingerprintSha256,configDigest:c.configDigest};
 await add(env,CH,{id:binding.challengeId,binding,config_digest:c.configDigest,issued_by:a.actor.id});
 return reply({ok:true,binding,bindingDigest:await digest925(binding),expiresInSeconds:300},201)
 }
 if(x.action==='admit_enrollment'){
 need(Object.keys(x).length===3&&a.actor.id===w.staffId,'WITNESS_OWN_SESSION_REQUIRED');
 const ch=await one(env,CH,x.challengeId);need(ch.config_digest===c.configDigest&&Date.parse(ch.expires_at)>Date.now(),'ENROLLMENT_EXPIRED_OR_DRIFTED');
 const d=await verify926({envelope:x.envelope,pin:w,role:'PHYSICAL_WITNESS',bindingDigest:await digest925(ch.binding)});
 need(d?.decision==='ENROLL'&&Object.keys(d).length===1,'EXPLICIT_WITNESS_ENROLLMENT_REQUIRED');
 const enrollmentDigest=await digest925(x.envelope),id=await add(env,EN,{challenge_id:ch.id,staff_id:w.staffId,fingerprint:w.fingerprintSha256,enrollment_digest:enrollmentDigest,config_digest:c.configDigest,envelope:x.envelope});
 return reply({ok:true,enrollmentId:id,state:'KEY_POSSESSION_VERIFIED_NOT_PHYSICAL_PRESENCE'},201)
 }
 if(x.action==='issue_runtime_case'){
 need(Object.keys(x).length===3&&owner(a,c),'ENROLLED_OWNER_REQUIRED');
 const en=await one(env,EN,x.enrollmentId);need(en.config_digest===c.configDigest&&en.staff_id===w.staffId&&en.fingerprint===w.fingerprintSha256,'WITNESS_ENROLLMENT_REQUIRED');
 const {review,b}=await source(env,c,x.reviewId);
 need(review.evidence?.physical?.payload?.staffId===w.staffId,'PRIOR_PHYSICAL_WITNESS_MISMATCH');
 const binding={caseId:crypto.randomUUID(),reviewId:review.id,reviewDigest:review.review_digest,nonce:nonce(),productionSha:c.productionSha,enrollmentDigest:en.enrollment_digest,hostId:b.hostId,bootId:b.bootId};
 await add(env,CA,{id:binding.caseId,review_id:review.id,enrollment_id:en.id,binding,config_digest:c.configDigest,issued_by:a.actor.id});
 return reply({ok:true,binding,bindingDigest:await digest925(binding),expiresInSeconds:300},201)
 }
 if(x.action==='certify'){
 need(Object.keys(x).length===4&&a.actor.id===c.authority.staffId,'INDEPENDENT_CERTIFIER_OWN_SESSION_REQUIRED');
 const ca=await one(env,CA,x.caseId);need(ca.config_digest===c.configDigest&&Date.parse(ca.expires_at)>Date.now(),'RUNTIME_CASE_EXPIRED_OR_DRIFTED');
 const {review,b}=await source(env,c,ca.review_id),en=await one(env,EN,ca.enrollment_id);
 need(en.config_digest===c.configDigest&&en.staff_id===w.staffId&&en.fingerprint===w.fingerprintSha256&&ca.binding.enrollmentDigest===en.enrollment_digest&&ca.binding.reviewDigest===review.review_digest&&ca.binding.hostId===b.hostId&&ca.binding.bootId===b.bootId,'ORIGINAL_CHAIN_MISMATCH');
 const v=await evaluate926({binding:ca.binding,expected:c.expected,runtimePin:c.runtime,authorityPin:c.authority,runtime:x.runtime,approval:x.approval});
 const id=await add(env,CE,{case_id:ca.id,binding_digest:v.bindingDigest,runtime_digest:v.runtimeDigest,approval_digest:v.approvalDigest,certified:v.certified,result:v,evidence:{runtime:x.runtime,approval:x.approval},recorded_by:a.actor.id});
 return reply({ok:true,certificationId:id,...v,state:v.certified?'HISTORICAL_RUNTIME_OBSERVATION_CERTIFIED':'ORIGINAL_RUNTIME_HOLD'},201)
 }
 return reply({ok:false,error:'ACTION_NOT_SUPPORTED'},400);
 }catch(e){const m=String(e?.message||'');return reply({ok:false,state:'HOLD',error:/^[A-Z0-9_]{4,100}$/.test(m)?m:'ORIGINAL_926_EVIDENCE_REJECTED'},409)}
}
export const onRequestPut=deny,onRequestPatch=deny,onRequestDelete=deny,onRequestOptions=deny;
