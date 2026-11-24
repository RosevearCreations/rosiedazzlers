// Original-only private Build 925 case admission. No service actions or customer/finance writes.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {checkLiveReceiverEvidence924} from '../../../assets/build924-field-authority.mjs';
import {evaluate925,digest925,validatePins925} from '../../../assets/build925-field-reconciliation.mjs';
const CASE='rosie_sysop_field_cases_v925',REVIEW='rosie_sysop_field_reviews_v925',E=encodeURIComponent,H40=/^[a-f0-9]{40}$/;
const reply=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'}});
const deny=()=>reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
const need=(x)=>{if(!x)throw Error('HOLD')};
const json=(env,k)=>JSON.parse(env[k]||'null');
async function db(env,path,opt={}){
 const base=String(env.SUPABASE_URL||'').replace(/\/+$/,'');need(/^https:\/\/[A-Za-z0-9.-]+$/.test(base)&&env.SUPABASE_SERVICE_ROLE_KEY);
 const res=await fetch(base+'/rest/v1/'+path,{...opt,headers:{...serviceHeaders(env),'Content-Type':'application/json',...opt.headers},redirect:'error',cache:'no-store'});
 need(res.ok);const raw=await res.text();need(raw.length<150000);return raw?JSON.parse(raw):null;
}
async function one(env,t,id){need(UUID914.test(id||''));const v=await db(env,t+'?select=*&id=eq.'+E(id)+'&limit=2');need(Array.isArray(v)&&v.length===1);return v[0]}
async function insert(env,t,data){const v=await db(env,t+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(data)});need(Array.isArray(v)&&v.length===1&&UUID914.test(v[0].id));return v[0].id}
async function auth(request,env){const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});if(!a.ok)return a;if(a.auth_mode!=='session'||!a.actor?.is_active||!UUID914.test(a.actor.id)||!hasActionAccess(a.actor,'admin.settings.manage'))return {ok:false,response:reply({ok:false,error:'ORIGINAL_ADMIN_REQUIRED'},403)};return a}
async function settings(env){
 const pins=json(env,'ROSEVEAR_ROSIE925_ROLE_PINS_JSON'),app=json(env,'ROSEVEAR_ROSIE923_APP_SIGNER_PIN_JSON'),expected=json(env,'ROSEVEAR_ROSIE925_EXPECTED_WINDOWS_IDENTITIES_JSON'),oldOwners=json(env,'ROSEVEAR_ROSIE920_OWNER_PINS_JSON'),oldInspector=json(env,'ROSEVEAR_ROSIE924_INSPECTOR_PIN_JSON'),productionSha=env.ROSEVEAR_ROSIE925_EXPECTED_PRODUCTION_SHA;
 validatePins925(pins,app?.fingerprintSha256);need(expected&&H40.test(productionSha||'')&&oldInspector?.fingerprintSha256===pins.INSPECTOR.fingerprintSha256&&oldInspector.expectedCommit===pins.INSPECTOR.expectedCommit);
 for(const role of ['PRIMARY_OWNER','SECOND_OWNER']){const p=pins[role],old=oldOwners?.[p.staffId];need(old?.ownerRole===role&&old.fingerprintSha256===p.fingerprintSha256&&old.expectedCommit===p.expectedCommit)}
 return {pins,app,expected,productionSha,configDigest:await digest925({pins,appFingerprint:app.fingerprintSha256,expected,productionSha})};
}
async function originals(env,cfg,appId,ids){
 const a=await one(env,'rosie_sysop_app_attestations_v923',appId);
 need(a.host_id===cfg.app.hostId&&a.sampler_fingerprint_sha256===cfg.app.fingerprintSha256&&a.sampler_commit===cfg.app.expectedCommit&&Date.now()-Number(a.sampled_at_ms)<=300000&&Number(a.sampled_at_ms)<=Date.now()+2000);
 const names=['ai-data-platform','rosevear-comms-hub'];let rows;
 if(ids){rows=await Promise.all(ids.map(id=>one(env,'rosie_sysop_native_api_witness_v921',id)))}
 else{rows=await Promise.all(names.map(async n=>{const r=await db(env,'rosie_sysop_native_api_witness_v921?select=*&receiver_id=eq.'+E(n)+'&order=created_at.desc&limit=1');need(Array.isArray(r)&&r.length===1);return r[0]}))}
 need(rows.every((x,i)=>x.receiver_id===names[i]));
 checkLiveReceiverEvidence924({observations:rows,manifests:json(env,'ROSEVEAR_ROSIE924_RECEIVER_MANIFESTS_JSON'),pins:json(env,'ROSEVEAR_ROSIE921_RECEIVER_API_PINS_JSON')});
 return {a,ids:rows.map(x=>x.id)};
}
export async function onRequestGet({request,env}){
 const a=await auth(request,env);if(!a.ok)return a.response;
 try{const cfg=await settings(env);const recent=await db(env,REVIEW+'?select=id,case_id,closure_ready,created_at&order=created_at.desc&limit=20');
 return reply({ok:true,build:925,rolePinsConfigured:true,expectedProductionSha:cfg.productionSha,recentReviews:recent,fieldCertified:false,sevenSourceConnected:false})}
 catch{return reply({ok:false,build:925,state:'HOLD',error:'ORIGINAL_925_ENROLLMENT_OR_STORAGE_REQUIRED'},503)}
}
export async function onRequestPost({request,env}){
 if(request.headers.get('origin')!==new URL(request.url).origin||(request.headers.get('sec-fetch-site')&&!['same-origin','none'].includes(request.headers.get('sec-fetch-site'))))return reply({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({ok:false,error:'JSON_REQUIRED'},415);
 const a=await auth(request,env);if(!a.ok)return a.response;
 try{
 const raw=await request.text();need(raw.length<=30000);const b=JSON.parse(raw);need(b&&typeof b==='object'&&!Array.isArray(b));
 const cfg=await settings(env);need(['PRIMARY_OWNER','SECOND_OWNER'].some(r=>cfg.pins[r].staffId===a.actor.id));
 if(b.action==='issue_case'){
 need(Object.keys(b).length===2);const x=await originals(env,cfg,b.appAttestationId);
 const binding={caseId:crypto.randomUUID(),appAttestationId:x.a.id,hostId:x.a.host_id,bootId:x.a.boot_id,nonce:[...crypto.getRandomValues(new Uint8Array(32))].map(v=>v.toString(16).padStart(2,'0')).join(''),productionSha:cfg.productionSha,nativeReceiptIds:x.ids};
 const id=await insert(env,CASE,{id:binding.caseId,binding,config_digest:cfg.configDigest,issued_by:a.actor.id});need(id===binding.caseId);
 return reply({ok:true,binding,caseDigest:await digest925(binding),expiresInSeconds:300,fieldCertified:false},201)
 }
 if(b.action==='admit_review'){
 need(Object.keys(b).length===6&&UUID914.test(b.caseId||''));const c=await one(env,CASE,b.caseId);need(c.config_digest===cfg.configDigest&&Date.parse(c.expires_at)>Date.now());
 const binding=c.binding;need(binding.caseId===c.id);const x=await originals(env,cfg,binding.appAttestationId,binding.nativeReceiptIds);need(x.a.host_id===binding.hostId&&x.a.boot_id===binding.bootId);
 const v=await evaluate925({binding,pins:cfg.pins,appFingerprint:cfg.app.fingerprintSha256,expected:cfg.expected,inspector:b.inspector,physical:b.physical,owners:b.owners,production:b.production});
 const reviewId=await insert(env,REVIEW,{case_id:c.id,case_digest:v.caseDigest,review_digest:v.reviewDigest,closure_ready:v.closureReady,result:v,evidence:{inspector:b.inspector,physical:b.physical,owners:b.owners,production:b.production},recorded_by:a.actor.id});
 return reply({ok:true,reviewId,...v,state:v.closureReady?'OWNER_SIGNED_CLOSURE_EVIDENCE_RECORDED':'ORIGINAL_FIELD_HOLD'},201)
 }
 return reply({ok:false,error:'ACTION_NOT_SUPPORTED'},400)
 }catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_925_EVIDENCE_OR_CUSTODY_REJECTED'},409)}
}
export const onRequestPut=deny,onRequestPatch=deny,onRequestDelete=deny,onRequestOptions=deny;
