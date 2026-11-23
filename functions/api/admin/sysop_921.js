// Rosie 921 original-source authority: read-only native receiver HTTPS GET, original Windows signed sample custody.
// Requires original Rosie Admin session; no public remote fetch URL or key, no reboot, no CONNECTED promotion.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {verifyNativeReceiver921,verifyWindowsHealth921,reconcile921} from '../../../assets/build921-live-authority-contract.mjs';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'}});
const HEX40=/^[a-f0-9]{40}$/,HEX64=/^[a-f0-9]{64}$/,E=encodeURIComponent;
const tables={source:'rosie_sysop_receipts_v918',ack:'rosie_sysop_receiver_acks_v919',ledger:'rosie_sysop_receiver_readbacks_v920',native:'rosie_sysop_native_api_witness_v921',
 host:'rosie_sysop_host_recovery_v919',ceremony:'rosie_sysop_preflight_v920',owners:'rosie_sysop_owner_reports_v920',health:'rosie_sysop_windows_health_v921'};
async function db(env,path,opt={}){
 const base=String(env?.SUPABASE_URL||'').replace(/\/+$/,'');
 if(!/^https:\/\/[A-Za-z0-9.-]+$/.test(base)||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('PRIVATE_ORIGINAL_DATABASE_UNAVAILABLE');
 const r=await fetch(base+'/rest/v1/'+path,{...opt,headers:{...serviceHeaders(env),'Content-Type':'application/json',...opt.headers},redirect:'error',cache:'no-store'});
 if(!r.ok)throw Error('PRIVATE_ORIGINAL_DATABASE_CONFLICT');
 if(r.status===204)return null;
 const s=await r.text();if(s.length>150000)throw Error('PRIVATE_ORIGINAL_QUERY_OVERFLOW');
 return JSON.parse(s);
}
async function rows(env,t,filter=''){
 const r=await db(env,t+'?select=*'+(filter?'&'+filter:'')+'&limit=100');
 if(!Array.isArray(r)||r.length>=100)throw Error('PRIVATE_ORIGINAL_QUERY_LIMIT');
 return r;
}
const one=r=>Array.isArray(r)&&r.length===1?r[0]:null;
async function auth(request,env){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return {response:a.response};
 if(a.auth_mode!=='session'||!a.actor?.is_active||!UUID914.test(a.actor.id)||!(hasActionAccess(a.actor,'admin.settings.manage')||hasActionAccess(a.actor,'daip.manage')))
  return {response:reply({ok:false,error:'ORIGINAL_ADMIN_SESSION_AND_AUTHORITY_REQUIRED'},403)};
 return {actor:a.actor};
}
const pins=(env,key)=>{try{const o=JSON.parse(env?.[key]||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch{return {}}};
const validPin=o=>o&&HEX40.test(o.expectedCommit||'')&&HEX64.test(o.fingerprintSha256||'')&&typeof o.publicKeySpkiBase64==='string'?o:null;
function ownerPins(env){
 const o=pins(env,'ROSEVEAR_ROSIE920_OWNER_PINS_JSON'),arr=Object.entries(o);
 if(arr.length!==2||arr.some(([staff,p])=>!UUID914.test(staff)||p.staffId!==staff||!validPin(p))||new Set(arr.map(([,p])=>p.fingerprintSha256)).size!==2)return null;
 return arr.map(([,p])=>p);
}
const rand=()=>{const b=new Uint8Array(32);crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,'0')).join('')};
function receiverSettings(env,id){
 const raw=pins(env,'ROSEVEAR_ROSIE921_RECEIVER_READONLY_ORIGINS_JSON')[id];
 const pin=validPin(pins(env,'ROSEVEAR_ROSIE921_RECEIVER_API_PINS_JSON')[id]);
 const ledgerPin=validPin(pins(env,'ROSEVEAR_ROSIE920_RECEIVER_LEDGER_PINS_JSON')[id]);
 const token=id==='ai-data-platform'?env?.ROSEVEAR_ROSIE921_AIDP_READ_TOKEN:env?.ROSEVEAR_ROSIE921_COMMS_READ_TOKEN;
 if(!raw||!pin||!ledgerPin||!token||typeof token!=='string'||token.length<20||token.length>2048||
    typeof raw.origin!=='string'||!HEX40.test(raw.expectedCommit||'')||raw.expectedCommit!==pin.expectedCommit||
    pin.fingerprintSha256===ledgerPin.fingerprintSha256)throw Error('ORIGINAL_NATIVE_RECEIVER_READ_ONLY_ENROLLMENT_REQUIRED');
 let u;try{u=new URL(raw.origin)}catch{throw Error('ORIGINAL_NATIVE_RECEIVER_ORIGIN_INVALID')}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.pathname!=='/'||u.search||u.hash||!u.hostname.includes('.')||
    !/^[a-z0-9.-]+$/i.test(u.hostname)||!raw.origin.startsWith('https://')||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||u.hostname==='localhost'||u.hostname.endsWith('.local')||u.hostname.endsWith('.internal')||
    u.hostname.endsWith('.localhost')||u.hostname.endsWith('.test')||u.hostname.endsWith('.example')||u.hostname.endsWith('.invalid'))
    throw Error('ORIGINAL_NATIVE_RECEIVER_UNSAFE_ORIGIN');
 return {origin:u.origin,pin,ledgerPin,token};
}
async function nativeGet(env,receiverId,ledger,expectedCommit){
 const config=receiverSettings(env,receiverId);
 if(config.pin.expectedCommit!==expectedCommit)throw Error('ORIGINAL_RECEIVER_DEPLOYED_REVISION_MISMATCH');
 const challengeNonce=rand();
 // Fixed provider-native path; user controls neither the scheme, origin nor pathname.
 const url=config.origin+'/v1/rosevear/sysop/ledger-readback?ledgerEntryId='+E(ledger.ledger_entry_id)+'&challengeNonce='+challengeNonce;
 const response=await fetch(url,{method:'GET',headers:{Authorization:'Bearer '+config.token,Accept:'application/json','Cache-Control':'no-store'},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000)});
 if(!response.ok||response.status!==200||!(response.headers.get('content-type')||'').startsWith('application/json'))throw Error('ORIGINAL_NATIVE_RECEIVER_READ_FAILED');
 const raw=await response.text();if(raw.length>8000)throw Error('ORIGINAL_NATIVE_RECEIVER_RESPONSE_UNBOUNDED');
 let envelope;try{envelope=JSON.parse(raw)}catch{throw Error('ORIGINAL_NATIVE_RECEIVER_JSON_INVALID')}
 const v=await verifyNativeReceiver921({envelope,pin:config.pin,ledger,ledgerSignerPin:config.ledgerPin,challengeNonce});
 return v;
}
async function readState(env){
 const [sources,acks,ledger,native,hosts,preflights,owners,health]=await Promise.all([
  rows(env,tables.source,'order=created_at.desc'),rows(env,tables.ack,'order=created_at.desc'),
  rows(env,tables.ledger,'order=created_at.desc'),rows(env,tables.native,'order=created_at.desc'),
  rows(env,tables.host,'order=created_at.desc'),rows(env,tables.ceremony,'order=created_at.desc'),
  rows(env,tables.owners,'order=created_at.desc'),rows(env,tables.health,'order=created_at.desc')
 ]);
 const projection=reconcile921({sources,ackReviews:acks,ledgerReviews:ledger,nativeReviews:native,hostReviews:hosts,preflights,ownerReports:owners,healthSamples:health});
 const hs=validPin(pins(env,'ROSEVEAR_ROSIE921_WINDOWS_HEALTH_PIN_JSON'));
 const recs=['ai-data-platform','rosevear-comms-hub'];
 return {...projection,originalHostHealthSamplerPinEnrolled:!!hs,originalTwoOwnerRosterEnrolled:!!ownerPins(env),
  receiverStatus:recs.map(id=>({...projection.receiverStatus.find(x=>x.receiverId===id),originalReadOnlyApiEnrolled:(()=>{try{return !!receiverSettings(env,id)}catch{return false}})()})),
  lastNativeReadbacks:native.slice(0,8).map(x=>({receiverId:x.receiver_id,ledgerReviewId:x.ledger_review_id,readAt:x.created_at,readOnly:true})),
  lastHostHealthSamples:health.slice(0,10).map(x=>({hostId:x.host_id,bootId:x.boot_id,sampleSeq:x.sample_seq,sampledAtMs:Number(x.sampled_at_ms),
   hubApiPort:x.hub_api_port,caddyPort:x.caddy_port,mqttPort:x.mqtt_port,ollamaPort:x.ollama_port,originalHardwarePhysicallyCertified:false})),
  originalLedgerReviewIds:ledger.slice(0,15).map(x=>({ledgerReviewId:x.id,receiverId:x.receiver_id})),
  originalHostReviewIds:hosts.slice(0,15).map(x=>({hostReviewId:x.id,hostId:x.host_id})),
  noLiveSourceSimulations:true};
}
export async function onRequestGet({request,env}){
 const a=await auth(request,env);if(a.response)return a.response;
 try{return reply({ok:true,...await readState(env)})}catch{return reply({ok:false,state:'ORIGINAL_EVIDENCE_UNAVAILABLE_HOLD'},503)}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))return reply({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({ok:false,error:'JSON_REQUIRED'},415);
 const a=await auth(request,env);if(a.response)return a.response;
 let body;try{const raw=await request.text();if(raw.length>5500)throw Error('OVERSIZE');body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error('SHAPE')}
 catch{return reply({ok:false,error:'INVALID_OR_OVERSIZE_JSON'},400)}
 const exactBody=keys=>Object.keys(body).length===keys.length&&keys.every(k=>Object.hasOwn(body,k));
 try{
  if(body.action==='read_original_receiver_api'){
   if(!exactBody(['action','ledgerReviewId'])||!UUID914.test(body.ledgerReviewId||''))return reply({ok:false,error:'ORIGINAL_LEDGER_REVIEW_UUID_REQUIRED'},400);
   const ledger=one(await rows(env,tables.ledger,'id=eq.'+E(body.ledgerReviewId)));
   if(!ledger)return reply({ok:false,state:'HOLD',error:'ORIGINAL_SIGNED_LEDGER_REVIEW_NOT_FOUND'},409);
   const ack=one(await rows(env,tables.ack,'id=eq.'+E(ledger.ack_review_id)));
   if(!ack||ack.receiver_id!==ledger.receiver_id)return reply({ok:false,state:'HOLD',error:'ORIGINAL_ACK_RECEIVER_MATCH_REQUIRED'},409);
   let v;try{v=await nativeGet(env,ledger.receiver_id,ledger,ack.receiver_commit)}
   catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_NATIVE_RECEIVER_LIVE_AUTHORITY_UNAVAILABLE_OR_MISMATCH'},409)}
   const saved=one(await db(env,tables.native+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
    ledger_review_id:v.ledgerReviewId,receiver_id:v.receiverId,ledger_entry_id:v.ledgerEntryId,challenge_nonce:v.challengeNonce,
    api_observed_at_ms:v.apiObservedAtMs,api_signer_commit:v.apiSignerCommit,api_signer_fingerprint_sha256:v.apiSignerFingerprintSha256,
    signature_sha256:v.signatureSha256,reviewed_by_staff_id:a.actor.id})}));
   if(!UUID914.test(saved?.id))throw Error('ORIGINAL_NATIVE_READBACK_NOT_DURABLE');
   return reply({ok:true,witnessId:saved.id,state:v.reviewState,nativeApiAuthenticated:true,sevenSourceConnected:false,physicalRecoveryCertified:false},201);
  }
  if(body.action==='admit_windows_health_sample'){
   if(!exactBody(['action','envelope'])||!UUID914.test(body.envelope?.payload?.hostReviewId||'')||!UUID914.test(body.envelope?.payload?.ceremonyId||''))
    return reply({ok:false,error:'ORIGINAL_HOST_SIGNED_ENVELOPE_REQUIRED'},400);
   const p=body.envelope.payload,host=one(await rows(env,tables.host,'id=eq.'+E(p.hostReviewId))),
    ceremony=one(await rows(env,tables.ceremony,'id=eq.'+E(p.ceremonyId)));
   if(!host||!ceremony)return reply({ok:false,state:'HOLD',error:'ORIGINAL_WINDOWS_BOOT_AND_PREFLIGHT_MISSING'},409);
   const pin=validPin(pins(env,'ROSEVEAR_ROSIE921_WINDOWS_HEALTH_PIN_JSON')),
    hostSignerPin=validPin(pins(env,'ROSEVEAR_ROSIE919_HOST_WITNESS_PIN_JSON')),
    owners=ownerPins(env);
   if(!pin||!hostSignerPin||!owners)return reply({ok:false,state:'HOLD',error:'ORIGINAL_WINDOWS_AND_TWO_OWNER_IDENTITY_PINS_REQUIRED'},409);
   const list=await db(env,tables.health+'?select=*&host_review_id=eq.'+E(host.id)+'&order=sample_seq.desc&limit=1');
   if(!Array.isArray(list)||list.length>1)throw Error('ORIGINAL_WINDOWS_PREVIOUS_SAMPLE_UNAVAILABLE');
   let v;try{v=await verifyWindowsHealth921({envelope:body.envelope,pin,host,ceremony,previous:list[0]||null,hostSignerPin,ownerSignerPins:owners})}
   catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_WINDOWS_SIGNED_SAMPLE_FRESHNESS_SEQUENCE_OR_AUTHORITY_REJECTED'},409)}
   const saved=one(await db(env,tables.health+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
    host_review_id:v.hostReviewId,ceremony_id:v.ceremonyId,host_id:v.hostId,boot_id:v.bootId,sample_id:v.sampleId,sample_seq:v.sampleSeq,
    sampled_at_ms:v.sampledAtMs,os_uptime_sec:v.osUptimeSec,sampler_commit:v.samplerCommit,sampler_fingerprint_sha256:v.samplerFingerprintSha256,
    hub_api_port:v.hubApiPort,caddy_port:v.caddyPort,mqtt_port:v.mqttPort,ollama_port:v.ollamaPort,
    signature_sha256:v.signatureSha256,recorded_by_staff_id:a.actor.id})}));
   if(!UUID914.test(saved?.id))throw Error('ORIGINAL_WINDOWS_SAMPLE_NOT_DURABLE');
   return reply({ok:true,sampleReviewId:saved.id,state:v.evidenceState,portReachabilityOnly:true,physicalRecoveryCertified:false},201);
  }
  return reply({ok:false,error:'ACTION_NOT_SUPPORTED'},400);
 }catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_PRIVATE_EVIDENCE_CONFLICT_OR_AUTHORITY_UNAVAILABLE'},409)}
}
const deny=()=>reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
export const onRequestPut=deny,onRequestPatch=deny,onRequestDelete=deny,onRequestOptions=deny;
