// Rosie 919: original-session-only signed receiver and independent host witness custody.
// No outbound receiver calls, no reboot and no automatic CONNECTED transition.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {APPS918,HEX64} from '../../../assets/build918-signed-mesh-contract.mjs';
import {verifyReceiver919,verifyHostWitness919,project919} from '../../../assets/build919-ack-recovery-contract.mjs';
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'}});
const H40=/^[a-f0-9]{40}$/, encode=encodeURIComponent;
async function db(env,path,opt={}){
 const base=String(env?.SUPABASE_URL||'').replace(/\/+$/,'');
 if(!/^https:\/\/[A-Za-z0-9.-]+$/.test(base)||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('ORIGINAL_DATABASE_UNAVAILABLE');
 const response=await fetch(base+'/rest/v1/'+path,{...opt,headers:{...serviceHeaders(env),'Content-Type':'application/json',...opt.headers},redirect:'error',cache:'no-store'});
 if(!response.ok)throw Error('ORIGINAL_DATABASE_DENIED_OR_CONFLICT');
 if(response.status===204)return null;
 const data=await response.text();if(data.length>100000)throw Error('ORIGINAL_DATABASE_UNBOUNDED');
 return JSON.parse(data);
}
async function rows(env,table,filter=''){const r=await db(env,table+'?select=*'+(filter?'&'+filter:'')+'&limit=100');if(!Array.isArray(r)||r.length>=100)throw Error('ORIGINAL_QUERY_INCOMPLETE');return r;}
const one=r=>Array.isArray(r)&&r.length===1?r[0]:null;
async function actor(request,env){
 const auth=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!auth.ok)return {response:auth.response};
 const staff=auth.actor;
 if(auth.auth_mode!=='session'||!staff?.is_active||!UUID914.test(staff.id)||!(hasActionAccess(staff,'admin.settings.manage')||hasActionAccess(staff,'daip.manage')))
  return {response:respond({ok:false,error:'ORIGINAL_ADMIN_SESSION_REQUIRED'},403)};
 return {staff};
}
function pins(env,name){try{const x=JSON.parse(env?.[name]||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}catch{return {};}}
function validPin(x){return x&&H40.test(x.expectedCommit||'')&&HEX64.test(x.fingerprintSha256||'')&&typeof x.publicKeySpkiBase64==='string'?x:null;}
async function readState(env){
 const [sources,acks,hosts]=await Promise.all([
  rows(env,'rosie_sysop_receipts_v918','order=created_at.desc'),
  rows(env,'rosie_sysop_receiver_acks_v919','order=created_at.desc'),
  rows(env,'rosie_sysop_host_recovery_v919','order=created_at.desc')
 ]);
 const view=project919(sources,acks,hosts),sourcePins=pins(env,'ROSEVEAR_ROSIE918_SOURCE_PINS_JSON'),
  receiverPins=pins(env,'ROSEVEAR_ROSIE919_RECEIVER_PINS_JSON'),hostPin=validPin(pins(env,'ROSEVEAR_ROSIE919_HOST_WITNESS_PIN_JSON'));
 return {...view,sources:view.sourceCoverage.map(r=>({...r,enrolled:!!validPin(sourcePins[r.appId])})),
  receiverPinsEnrolled:{'ai-data-platform':!!validPin(receiverPins['ai-data-platform']),'rosevear-comms-hub':!!validPin(receiverPins['rosevear-comms-hub'])},
  originalHostIndependentPinEnrolled:!!hostPin};
}
export async function onRequestGet({request,env}){
 const a=await actor(request,env);if(a.response)return a.response;
 try{return respond({ok:true,...await readState(env)})}catch{return respond({ok:false,state:'ORIGINAL_SOURCE_OR_RECEIVER_DATABASE_HOLD'},503)}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))return respond({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return respond({ok:false,error:'JSON_REQUIRED'},415);
 const a=await actor(request,env);if(a.response)return a.response;
 let body;try{const raw=await request.text();if(raw.length>5100)throw Error('OVERSIZE');body=JSON.parse(raw);
  if(!body||Object.keys(body).length!==2||!['action','envelope'].every(k=>Object.hasOwn(body,k)))throw Error('SHAPE');
 }catch{return respond({ok:false,error:'INVALID_OR_OVERSIZE_JSON'},400)}
 try{
  const p=body.envelope?.payload;
  if(!p||!UUID914.test(p.sourceReceiptId||'')||!APPS918.includes(p.sourceAppId||'')&&body.action==='admit_receiver_ack')
   return respond({ok:false,error:'ORIGINAL_RECEIPT_REFERENCE_REQUIRED'},400);
  const source=one(await rows(env,'rosie_sysop_receipts_v918','id=eq.'+encode(p.sourceReceiptId)));
  if(!source)return respond({ok:false,state:'HOLD',error:'ORIGINAL_SOURCE_RECEIPT_NOT_FOUND'},409);
  if(body.action==='admit_receiver_ack'){
   const pin=validPin(pins(env,'ROSEVEAR_ROSIE919_RECEIVER_PINS_JSON')[p.receiverId]);
   if(!pin)return respond({ok:false,state:'HOLD',error:'INDEPENDENT_RECEIVER_PIN_NOT_ENROLLED'},409);
   let v;try{v=await verifyReceiver919({envelope:body.envelope,pin,source})}
   catch{return respond({ok:false,state:'HOLD',error:'RECEIVER_SIGNATURE_CORRELATION_OR_FRESHNESS_REJECTED'},409)}
   const saved=one(await db(env,'rosie_sysop_receiver_acks_v919?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
    source_receipt_id:v.sourceReceiptId,source_app_id:v.sourceAppId,receiver_id:v.receiverId,receiver_commit:v.receiverCommit,
    receiver_receipt_id:v.receiverReceiptId,delivery_id:v.deliveryId,delivery_nonce:v.deliveryNonce,
    receiver_received_at_ms:v.receivedAtMs,signature_sha256:v.signatureSha256,reviewed_by_staff_id:a.staff.id})}));
   if(!UUID914.test(saved?.id))throw Error('DURABLE_ACK_UNAVAILABLE');
   return respond({ok:true,reviewId:saved.id,state:v.state,independentTransportWitnessVerified:false,connected:false},201);
  }
  if(body.action==='admit_host_witness'){
   const w=one(await rows(env,'rosie_sysop_host_witness_v918','receipt_id=eq.'+encode(source.id)));
   const pin=validPin(pins(env,'ROSEVEAR_ROSIE919_HOST_WITNESS_PIN_JSON'));
   const sourcePin=validPin(pins(env,'ROSEVEAR_ROSIE918_SOURCE_PINS_JSON')['rosevear-ai-hub']);
   if(!pin||!sourcePin)return respond({ok:false,state:'HOLD',error:'INDEPENDENT_HOST_AND_SOURCE_PINS_REQUIRED'},409);
   let v;try{v=await verifyHostWitness919({envelope:body.envelope,pin,source,staffWitness:w,sourcePin,actorId:a.staff.id})}
   catch{return respond({ok:false,state:'HOLD',error:'HOST_SIGNED_WITNESS_CORRELATION_OR_FRESHNESS_REJECTED'},409)}
   const saved=one(await db(env,'rosie_sysop_host_recovery_v919?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
    source_receipt_id:v.sourceReceiptId,original_staff_witness_id:v.originalStaffWitnessId,host_id:v.hostId,boot_id:v.bootId,
    boot_time_ms:v.bootTimeMs,windows_event_sha256:v.windowsEventDigestSha256,service_readback_sha256:v.serviceReadbackDigestSha256,
    signature_sha256:v.signatureSha256,reviewed_by_staff_id:a.staff.id})}));
   if(!UUID914.test(saved?.id))throw Error('DURABLE_HOST_WITNESS_UNAVAILABLE');
   return respond({ok:true,reviewId:saved.id,state:v.state,physicalRecoveryVerified:false,authorizesRestart:false},201);
  }
  return respond({ok:false,error:'ACTION_NOT_SUPPORTED'},400);
 }catch{return respond({ok:false,state:'HOLD',error:'ORIGINAL_RECEIPT_CONFLICT_OR_DATABASE_UNAVAILABLE'},409)}
}
const deny=()=>respond({ok:false,error:'METHOD_NOT_ALLOWED'},405);
export const onRequestPut=deny,onRequestPatch=deny,onRequestDelete=deny,onRequestOptions=deny;
