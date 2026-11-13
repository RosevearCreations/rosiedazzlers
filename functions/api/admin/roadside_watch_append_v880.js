// Rosie 880: original-owner explicit append after fresh live Build 879/878 source recheck.
// The browser cannot submit a fabricated signed-event chain or historical timestamp.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {onRequestGet as watchOriginal} from './roadside_stability_watch_v879.js';
import {eligibleWatch880} from '../_lib/roadside-history-v880.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=409)=>json({ok:false,build:880,state:'WATCH_HOLD',error,
 persisted:false,no_financial_mutation:true},status,h);
export async function onRequestPost({request,env}){
 if(request.headers.get('Origin')!==new URL(request.url).origin||
  !/application\/json/i.test(request.headers.get('Content-Type')||''))
  return fail('Exact same-origin owner POST required',403);
 const auth=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)return fail('Original Admin required',403);
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original private storage unavailable',503);
 const raw=await request.text().catch(()=>'');
 if(raw.length<10||raw.length>500)return fail('Original draft request outside size bounds',413);
 let input;try{input=JSON.parse(raw)}catch{return fail('Original draft JSON required',400);}
 const id=input?.draft_id;
 if(!isUuid(id)||Object.keys(input).some(k=>k!=='draft_id'))
  return fail('Only the original draft ID is accepted',400);
 const actor=String(auth.actor?.email||auth.actor?.id||'').trim();
 if(actor.length<3||actor.length>140)return fail('Original owner identity unavailable',403);
 try{
  const url=new URL(request.url);url.searchParams.set('draft_id',id);
  const verified=await watchOriginal({request:new Request(url.toString(),{
   headers:request.headers,method:'GET'}),env});
  const live=verified.ok?await verified.json().catch(()=>null):null;
  const claim=eligibleWatch880(live);
  if(!claim.verified)return fail(claim.reason,409);
  const rpc=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+
   '/rest/v1/rpc/rosie880_append_native_watch',{method:'POST',redirect:'error',
    headers:{...serviceHeaders(env),Prefer:'return=representation'},
    body:JSON.stringify({p_id:crypto.randomUUID(),p_draft_id:id,p_actor:actor,
     p_delivery_state:claim.delivery_state,p_source_chain_sha256:claim.source_chain_sha256,
     p_latest_signed_event_at:claim.latest_signed_event_at,p_sla_state:claim.owner_sla_state,
     p_source_check_id:claim.source_check_id})});
  const val=await rpc.json().catch(()=>null);
  if(!rpc.ok||!Array.isArray(val)||val.length!==1||
    val[0].outcome!=='ORIGINAL_NATIVE_WATCH_APPENDED'||
    !/^[a-f0-9]{64}$/.test(val[0].record_sha256||''))
   return fail('Original immutable watch was not committed',503);
  return json({ok:true,build:880,state:val[0].outcome,persisted:true,
   record_id:val[0].record_id,record_sha256:val[0].record_sha256,
   recorded_at:val[0].recorded_at,
   no_customer_message_or_payment_mutation:true,original_provider_open_not_inferred:true},201,h);
 }catch{return fail('Original signed native history append unavailable; HOLD',503);}
}
export const onRequestOptions=()=>fail('Owner POST required',405);
