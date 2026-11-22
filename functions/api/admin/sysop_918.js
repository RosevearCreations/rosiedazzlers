// Rosie 918 source-only authenticated seven-app signed telemetry intake.
// Does not independently certify Master CONNECTED, operator reboot or business outcomes.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {APPS918,HEX64,verify918,project918} from '../../../assets/build918-signed-mesh-contract.mjs';
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'}});
const HEX40=/^[a-f0-9]{40}$/;
const table='rosie_sysop_challenges_v918',receipts='rosie_sysop_receipts_v918',hostWitness='rosie_sysop_host_witness_v918';
const encode=encodeURIComponent;
const oneResult=rows=>Array.isArray(rows)&&rows.length===1?rows[0]:null;
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function db(env,path,opt={}){
 const base=String(env?.SUPABASE_URL||'').replace(/\/+$/,'');
 if(!/^https:\/\/[A-Za-z0-9.-]+$/.test(base)||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('ORIGINAL_DATABASE_UNAVAILABLE');
 const res=await fetch(base+'/rest/v1/'+path,{...opt,headers:{...serviceHeaders(env),'Content-Type':'application/json',...opt.headers},redirect:'error',cache:'no-store'});
 if(!res.ok)throw Error('ORIGINAL_DATABASE_DENIED_OR_CONFLICT');
 if(res.status===204)return null;
 const raw=await res.text();if(raw.length>131072)throw Error('ORIGINAL_DATABASE_RESULT_UNBOUNDED');
 return JSON.parse(raw);
}
async function list(env,t,query){const r=await db(env,t+'?select=*'+(query?'&'+query:'')+'&limit=100');if(!Array.isArray(r)||r.length>100)throw Error('ORIGINAL_SOURCE_INCOMPLETE');return r;}
async function actor(request,env,write=false){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return {response:a.response};
 const allowed=hasActionAccess(a.actor,'admin.settings.manage')||hasActionAccess(a.actor,'daip.manage');
 if(a.auth_mode!=='session'||!allowed||!a.actor?.is_active||!UUID914.test(a.actor?.id))return {response:respond({ok:false,error:'ORIGINAL_ADMIN_SESSION_REQUIRED'},403)};
 return {staff:a.actor};
}
function pins(env){try{const data=JSON.parse(env?.ROSEVEAR_ROSIE918_SOURCE_PINS_JSON||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}catch{return {};}}
function validatedPin(env,id){
 const pin=pins(env)[id];return pin&&HEX40.test(pin.expectedCommit||'')&&HEX64.test(pin.fingerprintSha256||'')?pin:null;
}
export async function onRequestGet({request,env}){
 const a=await actor(request,env);if(a.response)return a.response;
 try{
  const [signed,host]=await Promise.all([list(env,receipts,'order=created_at.desc'),list(env,hostWitness,'order=created_at.desc')]);
  const status=project918(signed,host,Date.now());
  return respond({ok:true,...status,recentHostBootSourceReceipts:signed.filter(x=>x.app_id==='rosevear-ai-hub'&&x.event_kind==='HOST_BOOT_OBSERVED').slice(0,5).map(x=>({id:x.id,recordedAt:x.created_at})),
   sources:status.sources.map(x=>({...x,enrolled:!!validatedPin(env,x.appId)})),noProviderOrHostMutations:true});
 }catch{return respond({ok:false,state:'ORIGINAL_SOURCE_UNAVAILABLE_HOLD'},503);}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))return respond({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return respond({ok:false,error:'JSON_REQUIRED'},415);
 const a=await actor(request,env,true);if(a.response)return a.response;
 let body;try{const raw=await request.text();if(raw.length>4200)throw Error('LIMIT');body=JSON.parse(raw);
  if(!body||typeof body!=='object'||Array.isArray(body))throw Error('SHAPE');}
 catch{return respond({ok:false,error:'INVALID_OR_OVERSIZE_JSON'},400);}
 const exact=(names)=>Object.keys(body).length===names.length&&Object.keys(body).every(x=>names.includes(x));
 try{
  if(body.action==='issue_challenge'){
   if(!exact(['action','app_id'])||!APPS918.includes(body.app_id))return respond({ok:false,error:'ORIGINAL_APP_REQUIRED'},400);
   if(!validatedPin(env,body.app_id))return respond({ok:false,state:'HOLD',error:'ORIGINAL_INDEPENDENT_SOURCE_PIN_NOT_ENROLLED'},409);
   const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
   const challenge=hex(bytes),expiresAt=new Date(Date.now()+60000).toISOString();
   const result=await db(env,table+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({app_id:body.app_id,challenge,requested_by_staff_id:a.staff.id,expires_at:expiresAt})});
   const row=oneResult(result);if(!row||!UUID914.test(row.id))throw Error('DURABLE_CHALLENGE_UNAVAILABLE');
   return respond({ok:true,challengeId:row.id,appId:body.app_id,challenge,expiresAt,validForSeconds:60,privateKeyNeverRequested:true},201);
  }
  if(body.action==='admit_signed'){
   if(!exact(['action','challenge_id','envelope'])||!UUID914.test(body.challenge_id))return respond({ok:false,error:'CHALLENGE_SCOPE_REQUIRED'},400);
   const ch=oneResult(await list(env,table,'id=eq.'+encode(body.challenge_id)));
   if(!ch||ch.requested_by_staff_id!==a.staff.id||ch.consumed_at!==null||Date.parse(ch.expires_at)<=Date.now())
    return respond({ok:false,state:'HOLD',error:'ORIGINAL_CHALLENGE_EXPIRED_CONSUMED_OR_WRONG_ACTOR'},409);
   const pin=validatedPin(env,ch.app_id);
   if(!pin)return respond({ok:false,state:'HOLD',error:'SOURCE_PIN_NOT_ENROLLED'},409);
   let result;try{result=await verify918({envelope:body.envelope,pin,challenge:ch.challenge});}
   catch{return respond({ok:false,state:'HOLD',error:'SIGNED_SOURCE_VERIFICATION_REJECTED'},409);}
   if(result.appId!==ch.app_id)return respond({ok:false,state:'HOLD',error:'ORIGINAL_SOURCE_CHALLENGE_APP_MISMATCH'},409);
   const bytes=Uint8Array.from(body.envelope.signature.match(/.{2}/g).map(x=>parseInt(x,16)));
   const signatureSha256=hex(await crypto.subtle.digest('SHA-256',bytes));
   const receipt=await db(env,'rpc/rosie_sysop_admit_signed_v918',{method:'POST',body:JSON.stringify({
    p_challenge_id:ch.id,p_app_id:result.appId,p_event_id:result.eventId,p_nonce:result.nonce,
    p_source_commit:result.sourceCommit,p_source_state:result.state,p_event_kind:result.eventKind,
    p_source_signed_at_ms:result.issuedAtMs,p_observed_at_ms:result.observedAtMs,
    p_signature_sha256:signatureSha256,p_staff_id:a.staff.id})});
   if(!UUID914.test(receipt))throw Error('DURABLE_RECEIPT_UNAVAILABLE');
   return respond({ok:true,receiptId:receipt,appId:result.appId,state:'SIGNED_SOURCE_ONLY',
     sevenAppConnected:false,independentMasterAckVerified:false,originalHostRecoveryVerified:false,authorizesAction:false},201);
  }
  if(body.action==='host_witness'){
   if(!exact(['action','receipt_id','evidence_sha256'])||!UUID914.test(body.receipt_id)||!HEX64.test(body.evidence_sha256))
    return respond({ok:false,error:'ORIGINAL_HOST_WITNESS_SCOPE_REQUIRED'},400);
   const rec=oneResult(await list(env,receipts,'id=eq.'+encode(body.receipt_id)));
   if(!rec||rec.app_id!=='rosevear-ai-hub'||rec.event_kind!=='HOST_BOOT_OBSERVED'||rec.registered_by_staff_id===a.staff.id)
    return respond({ok:false,state:'HOLD',error:'DIFFERENT_STAFF_ORIGINAL_SIGNED_HOST_BOOT_REQUIRED'},409);
   const created=await db(env,hostWitness+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({receipt_id:rec.id,witnessed_by_staff_id:a.staff.id,evidence_sha256:body.evidence_sha256})});
   if(!UUID914.test(oneResult(created)?.id))throw Error('ORIGINAL_WITNESS_NOT_STORED');
   return respond({ok:true,state:'SECOND_STAFF_REPORTED_UNVERIFIED',independentHostBootWitnessVerified:false,
    originalHostRecoveryAccepted:false,authorizesRestart:false},201);
  }
  return respond({ok:false,error:'ACTION_NOT_SUPPORTED'},400);
 }catch{return respond({ok:false,state:'HOLD',error:'ORIGINAL_SOURCE_CONFLICT_OR_UNAVAILABLE'},409);}
}
const deny=()=>respond({ok:false,error:'METHOD_NOT_ALLOWED'},405);
export const onRequestPut=deny;export const onRequestPatch=deny;export const onRequestDelete=deny;export const onRequestOptions=deny;
