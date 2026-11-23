// Rosie 920: authentic original Rosie Admin reviews independent receiver-ledger and manual host owner reports.
// No remote receiver endpoint, machine reboot, authentication bypass, CONNECTED or physical certification.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {verifyLedgerReadback920,verifyOwnerWitness920,project920,ROLES920} from '../../../assets/build920-field-ceremony-contract.mjs';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'}});
const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/,enc=encodeURIComponent;
const q={acks:'rosie_sysop_receiver_acks_v919',ledger:'rosie_sysop_receiver_readbacks_v920',hosts:'rosie_sysop_host_recovery_v919',preflight:'rosie_sysop_preflight_v920',owners:'rosie_sysop_owner_reports_v920'};
async function db(env,path,opt={}){
 const base=String(env?.SUPABASE_URL||'').replace(/\/+$/,'');
 if(!/^https:\/\/[A-Za-z0-9.-]+$/.test(base)||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('ORIGINAL_DATABASE_UNAVAILABLE');
 const r=await fetch(base+'/rest/v1/'+path,{...opt,headers:{...serviceHeaders(env),'Content-Type':'application/json',...opt.headers},cache:'no-store',redirect:'error'});
 if(!r.ok)throw Error('ORIGINAL_DATABASE_DENIED_OR_CONFLICT');
 if(r.status===204)return null;
 const data=await r.text();if(data.length>110000)throw Error('ORIGINAL_DATABASE_RESULT_UNBOUNDED');
 return JSON.parse(data);
}
async function rows(env,table,filter=''){
 const r=await db(env,table+'?select=*'+(filter?'&'+filter:'')+'&limit=100');
 if(!Array.isArray(r)||r.length>=100)throw Error('ORIGINAL_QUERY_INCOMPLETE');return r;
}
const one=r=>Array.isArray(r)&&r.length===1?r[0]:null;
async function staff(request,env){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return {response:a.response};
 if(a.auth_mode!=='session'||!a.actor?.is_active||!UUID914.test(a.actor.id)||!(hasActionAccess(a.actor,'admin.settings.manage')||hasActionAccess(a.actor,'daip.manage')))
  return {response:reply({ok:false,error:'ORIGINAL_OWNER_ADMIN_SESSION_REQUIRED'},403)};
 return {actor:a.actor};
}
function envPins(env,name){try{const j=JSON.parse(env?.[name]||'{}');return j&&typeof j==='object'&&!Array.isArray(j)?j:{};}catch{return {}}}
function validPin(x){return x&&H40.test(x.expectedCommit||'')&&H64.test(x.fingerprintSha256||'')&&typeof x.publicKeySpkiBase64==='string'?x:null}
function ownerRoster(env){
 const p=envPins(env,'ROSEVEAR_ROSIE920_OWNER_PINS_JSON');
 const entries=Object.entries(p).filter(([id,v])=>UUID914.test(id)&&validPin(v)&&v.staffId===id&&ROLES920.includes(v.ownerRole));
 const roles=new Set(entries.map(([,v])=>v.ownerRole)),keys=new Set(entries.map(([,v])=>v.fingerprintSha256));
 if(entries.length!==2||roles.size!==2||keys.size!==2||Object.keys(p).length!==2)return null;
 return Object.fromEntries(entries);
}
async function readState(env,actorId){
 const [acks,ledger,hosts,preflights,owners]=await Promise.all([
  rows(env,q.acks,'order=created_at.desc'),rows(env,q.ledger,'order=created_at.desc'),rows(env,q.hosts,'order=created_at.desc'),
  rows(env,q.preflight,'order=created_at.desc'),rows(env,q.owners,'order=created_at.desc')
 ]);
 const model=project920({ackReviews:acks,ledgerReviews:ledger,hostReviews:hosts,ceremonies:preflights,ownerReviews:owners});
 const roster=ownerRoster(env),ledgerPins=envPins(env,'ROSEVEAR_ROSIE920_RECEIVER_LEDGER_PINS_JSON');
 return {...model,ownerPinRosterComplete:!!roster,ownerSessionPinEnrolled:!!roster?.[actorId],
  receiverLedgerPinsEnrolled:{'ai-data-platform':!!validPin(ledgerPins['ai-data-platform']),'rosevear-comms-hub':!!validPin(ledgerPins['rosevear-comms-hub'])},
  ceremonies:preflights.slice(0,12).map(c=>({id:c.id,hostId:c.host_id,preflightNonce:c.preflight_nonce,openedAt:c.created_at,expiresAt:c.expires_at,ownerReports:owners.filter(x=>x.ceremony_id===c.id).map(x=>x.owner_role)})),
  recentHostReviews:hosts.slice(0,12).map(h=>({id:h.id,hostId:h.host_id,hostWitnessCommit:h.host_witness_commit,bootId:h.boot_id,bootTimeMs:Number(h.boot_time_ms),
    windowsEventDigestSha256:h.windows_event_sha256,serviceReadbackDigestSha256:h.service_readback_sha256,createdAt:h.created_at})),
  noRebootOrReceiverMutation:true};
}
export async function onRequestGet({request,env}){
 const a=await staff(request,env);if(a.response)return a.response;
 try{return reply({ok:true,...await readState(env,a.actor.id)})}
 catch{return reply({ok:false,state:'ORIGINAL_EVIDENCE_STORE_UNAVAILABLE_HOLD'},503)}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))return reply({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({ok:false,error:'JSON_REQUIRED'},415);
 const a=await staff(request,env);if(a.response)return a.response;
 let body;try{const s=await request.text();if(s.length>6000)throw Error('SIZE');body=JSON.parse(s);if(!body||typeof body!=='object'||Array.isArray(body))throw Error('SHAPE')}catch{return reply({ok:false,error:'INVALID_OR_OVERSIZE_JSON'},400)}
 const shape=keys=>Object.keys(body).length===keys.length&&keys.every(k=>Object.hasOwn(body,k));
 try{
  if(body.action==='open_preflight'){
   if(!shape(['action','hostId']))return reply({ok:false,error:'PREFLIGHT_SCOPE_REQUIRED'},400);
   const original=validPin(envPins(env,'ROSEVEAR_ROSIE919_HOST_WITNESS_PIN_JSON')),roster=ownerRoster(env);
   if(!original||original.hostId!==body.hostId||!roster?.[a.actor.id])return reply({ok:false,state:'HOLD',error:'ORIGINAL_HOST_AND_TWO_OWNER_PINS_REQUIRED'},409);
   const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
   const preflightNonce=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
   const recorded=one(await db(env,q.preflight+'?select=*',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
     host_id:body.hostId,preflight_nonce:preflightNonce,opened_by_staff_id:a.actor.id,expires_at:new Date(Date.now()+45*60000).toISOString()})}));
   if(!UUID914.test(recorded?.id))throw Error('DURABLE_PREFLIGHT_FAILED');
   return reply({ok:true,ceremonyId:recorded.id,hostId:recorded.host_id,preflightNonce,openedAt:recorded.created_at,expiresAt:recorded.expires_at,
     state:'SUPERVISED_PREFLIGHT_OPEN_NO_REBOOT_PERFORMED',authorizesRestart:false,physicalRecoveryCertified:false},201);
  }
  if(body.action==='review_receiver_ledger'){
   if(!shape(['action','envelope'])||!UUID914.test(body.envelope?.payload?.ackReviewId||''))return reply({ok:false,error:'ORIGINAL_RECEIVER_ACK_REFERENCE_REQUIRED'},400);
   const p=body.envelope.payload;
   const ack=one(await rows(env,q.acks,'id=eq.'+enc(p.ackReviewId)));
   if(!ack)return reply({ok:false,state:'HOLD',error:'ORIGINAL_ACK_REVIEW_NOT_FOUND'},409);
   const pin=validPin(envPins(env,'ROSEVEAR_ROSIE920_RECEIVER_LEDGER_PINS_JSON')[ack.receiver_id]);
   const ackPin=validPin(envPins(env,'ROSEVEAR_ROSIE919_RECEIVER_PINS_JSON')[ack.receiver_id]);
   if(!pin||!ackPin)return reply({ok:false,state:'HOLD',error:'ORIGINAL_INDEPENDENT_RECEIVER_PINS_REQUIRED'},409);
   let v;try{v=await verifyLedgerReadback920({envelope:body.envelope,pin,ack,ackSignerPin:ackPin})}
   catch{return reply({ok:false,state:'HOLD',error:'INDEPENDENT_RECEIVER_LEDGER_CORRELATION_REJECTED'},409)}
   const stored=one(await db(env,q.ledger+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
    ack_review_id:v.ackReviewId,source_receipt_id:v.sourceReceiptId,receiver_id:v.receiverId,ledger_entry_id:v.ledgerEntryId,
    ledger_entry_sha256:v.ledgerEntrySha256,ledger_head_sha256:v.ledgerHeadSha256,ledger_observed_at_ms:v.ledgerObservedAtMs,
    signature_sha256:v.signatureSha256,ledger_signer_fingerprint_sha256:pin.fingerprintSha256,reviewed_by_staff_id:a.actor.id})}));
   if(!UUID914.test(stored?.id))throw Error('DURABLE_LEDGER_REVIEW_UNAVAILABLE');
   return reply({ok:true,reviewId:stored.id,state:v.reviewState,independentTransportVerified:false,receiverConnected:false},201);
  }
  if(body.action==='record_owner_witness'){
   if(!shape(['action','envelope'])||!UUID914.test(body.envelope?.payload?.ceremonyId||'')||!UUID914.test(body.envelope?.payload?.hostReviewId||''))
    return reply({ok:false,error:'ORIGINAL_OWNER_CEREMONY_REFERENCE_REQUIRED'},400);
   const p=body.envelope.payload,ceremony=one(await rows(env,q.preflight,'id=eq.'+enc(p.ceremonyId))),
     host=one(await rows(env,q.hosts,'id=eq.'+enc(p.hostReviewId)));
   if(!ceremony||!host)return reply({ok:false,state:'HOLD',error:'ORIGINAL_PREFLIGHT_OR_SIGNED_HOST_REVIEW_NOT_FOUND'},409);
   const roster=ownerRoster(env),pin=roster?.[a.actor.id],other=roster?Object.values(roster).find(v=>v.staffId!==a.actor.id):null;
   const hostPin=validPin(envPins(env,'ROSEVEAR_ROSIE919_HOST_WITNESS_PIN_JSON'));
   if(!pin||!other||!hostPin)return reply({ok:false,state:'HOLD',error:'TWO_DISTINCT_ORIGINAL_OWNER_PINS_REQUIRED'},409);
   let v;try{v=await verifyOwnerWitness920({envelope:body.envelope,pin,ceremony,host,hostSignerPin:hostPin,otherOwnerPin:other,actorId:a.actor.id})}
   catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_TWO_OWNER_CEREMONY_SIGNATURE_OR_BOOT_ORDER_REJECTED'},409)}
   const stored=one(await db(env,q.owners+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
    ceremony_id:v.ceremonyId,host_review_id:v.hostReviewId,owner_staff_id:v.ownerStaffId,owner_role:v.ownerRole,
    owner_signer_commit:v.ownerSignerCommit,owner_pin_fingerprint_sha256:pin.fingerprintSha256,
    signature_sha256:v.signatureSha256,observed_at_ms:v.observedAtMs})}));
   if(!UUID914.test(stored?.id))throw Error('DURABLE_OWNER_REPORT_UNAVAILABLE');
   return reply({ok:true,reportId:stored.id,state:v.reviewState,physicalRecoveryCertified:false,authorizesRestart:false},201);
  }
  return reply({ok:false,error:'ACTION_NOT_SUPPORTED'},400);
 }catch{return reply({ok:false,state:'HOLD',error:'ORIGINAL_EVIDENCE_CONFLICT_OR_UNAVAILABLE'},409)}
}
const deny=()=>reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
export const onRequestPut=deny,onRequestPatch=deny,onRequestDelete=deny,onRequestOptions=deny;
