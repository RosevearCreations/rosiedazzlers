// Rosie 875: opt-in original Resend-native signed callback, no user/staff claims.
// Disabled by default. A native signature is checked BEFORE any source lookup.
import {serviceHeaders,json} from './_lib/staff-auth.js';
import {verifyResendSvix,parseResendNativeDelivery,matchOriginalResendDispatch} from './_lib/roadside-native-resend-v875.js';
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:875,error,
 native_provider_verified:false,provider_delivery_confirmed:false},status,headers);
async function readRows(env,path){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,
  {headers:serviceHeaders(env),redirect:'error'});
 const rows=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(rows))throw Error('Original private provider evidence unavailable');
 return rows;
}
async function admit(env,body){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+
  '/rest/v1/rpc/rosie872_admit_provider_receipt',{
  method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},
  body:JSON.stringify(body)});
 const data=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(data))throw Error('Original signed provider receipt was not admitted');
 return data;
}
export async function onRequestPost({request,env}){
 if(env.ROSIE_ROADSIDE_NATIVE_PROVIDER!=='resend_svix'||
  !env.ROSIE_ROADSIDE_RESEND_WEBHOOK_SECRET||
  !/^https:\/\//.test(env.SUPABASE_URL||'')||
  !env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original native provider enrollment is not enabled',503);
 const raw=await request.text().catch(()=>'');
 const proof=await verifyResendSvix({secret:env.ROSIE_ROADSIDE_RESEND_WEBHOOK_SECRET,
  headers:request.headers,rawBody:raw});
 if(!proof.ok)return fail('Invalid or stale native provider signature',401);
 const mapped=parseResendNativeDelivery(raw);
 if(!mapped.ok)return fail(mapped.reason,422);
 try{
  // Restrict to exactly one previously accepted original dispatch, never
  // trust dispatch IDs or customer identity asserted by unsigned callers.
  const rows=await readRows(env,
   'rosie_roadside_dispatches_v872?select=id,draft_id,provider,provider_message_id,recipient_hash,state'+
   '&provider_message_id=eq.'+encodeURIComponent(mapped.provider_email_id)+'&limit=2');
  if(rows.length!==1)return fail('Native message identity is not unique to an original dispatch',409);
  const match=await matchOriginalResendDispatch(mapped,rows[0]);
  if(!match.ok)return fail(match.reason,409);
  const payload={p_receipt_id:crypto.randomUUID(),
   p_dispatch_id:match.dispatch_id,p_provider_event_id:proof.native_event_id,
   p_provider_message_id:mapped.provider_email_id,p_event_type:match.event_type};
  try{
   const result=await admit(env,payload);
   const state=result[0]?.outcome;
   if(result.length!==1||
    !['delivery_confirmed','delivery_failed','receipt_after_withdrawal'].includes(state))
    throw Error('Original receipt admission outcome is missing');
   return json({ok:true,build:875,native_provider_verified:true,
    receipt_recorded:true,state,provider_reported_delivery:state==='delivery_confirmed',
    customer_read_confirmed:false,booking_or_payment_changed:false},200,headers);
  }catch{
   // Signed retry: accept only the same original, stored provider event ID.
   const prior=await readRows(env,
    'rosie_roadside_provider_receipts_v872?select=dispatch_id,provider_message_id,event_type,effective_state'+
    '&provider_event_id=eq.'+encodeURIComponent(proof.native_event_id)+'&limit=2');
   if(prior.length===1&&prior[0].dispatch_id===match.dispatch_id&&
      prior[0].provider_message_id===mapped.provider_email_id&&
      prior[0].event_type===match.event_type)
    return json({ok:true,build:875,native_provider_verified:true,replayed:true,
     state:prior[0].effective_state,provider_reported_delivery:prior[0].effective_state==='delivery_confirmed',
     customer_read_confirmed:false,booking_or_payment_changed:false},200,headers);
   return fail('Original provider callback conflict; manual HOLD review required',409);
  }
 }catch{return fail('Original source-bound native provider readback unavailable',503);}
}
export const onRequestOptions=()=>fail('Signed provider POST required',405);
