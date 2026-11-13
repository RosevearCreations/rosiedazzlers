// Rosie 876: privileged original native signature + live provider field readback.
// Never sends/resends a customer email; never asserts customer read/open.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {verifyOriginalResendField} from '../_lib/roadside-native-field-v876.js';
const headers={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:876,error,
 original_native_signature_proven:false,provider_delivered:false},status,headers);
async function getRows(env,path){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,
  {redirect:'error',headers:serviceHeaders(env)});
 const value=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(value))throw Error('Original private provider ledger unavailable');
 return value;
}
export const onRequestOptions=()=>fail('Owner GET only',405);
export async function onRequestGet({request,env}){
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original provider storage authority not configured',503);
 const access=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!access.ok)return access.response;
 if(access.auth_mode!=='session'||access.actor?.is_admin!==true)
  return fail('Authenticated owner/Admin session required',403);
 const draftId=new URL(request.url).searchParams.get('draft_id')||'';
 if(!isUuid(draftId))return fail('Exact original roadside draft required');
 try{
  const drafts=await getRows(env,'rosie_detailing_intake_v868?select=id,contact_permission,quote_share_withdrawn_at'+
   '&id=eq.'+encodeURIComponent(draftId)+'&limit=2');
  if(drafts.length!==1)return fail('Original roadside draft unavailable',404);
  const dispatches=await getRows(env,'rosie_roadside_dispatches_v872?select=id,draft_id,share_id,provider,'+
   'provider_message_id,recipient_hash,provider_accepted_at,receipt_at,state'+
   '&draft_id=eq.'+encodeURIComponent(draftId)+'&order=created_at.desc&limit=25');
  const dispatch=dispatches.find(x=>x.state==='delivery_confirmed'&&x.receipt_at);
  if(!dispatch)return json({ok:true,build:876,state:'NATIVE_PROVIDER_HOLD',
   reason:'No originally confirmed provider delivery to read back',original_native_signature_proven:false,
   provider_delivered:false,customer_read_proven:false,provider_api_queried:false},200,headers);
  const [shares,receipts]=await Promise.all([
   getRows(env,'rosie_roadside_quote_shares_v870?select=id,revoked_at,expires_at'+
    '&id=eq.'+encodeURIComponent(dispatch.share_id)+'&limit=2'),
   getRows(env,'rosie_roadside_provider_receipts_v872?select=id,dispatch_id,provider_event_id,'+
    'provider_message_id,event_type,effective_state,signature_verified,received_at'+
    '&dispatch_id=eq.'+encodeURIComponent(dispatch.id)+'&order=received_at.desc&limit=100')
  ]);
  const consent={...drafts[0],share_revoked_at:shares[0]?.revoked_at??'missing',
   share_expires_at:shares[0]?.expires_at??null};
  if(env.ROSIE_ROADSIDE_NATIVE_PROVIDER!=='resend_svix'||!env.RESEND_API_KEY||
     !env.ROSIE_ROADSIDE_RESEND_WEBHOOK_SECRET){
   const result=await verifyOriginalResendField({dispatch,receipts,email:null,consent});
   return json({ok:true,build:876,...result,provider_api_queried:false,
    reason:'Original Resend native provider account/signing authority not enrolled'},200,headers);
  }
  if(!/^[A-Za-z0-9._:-]{8,160}$/.test(dispatch.provider_message_id||''))
   return fail('Original provider reference malformed',409);
  const r=await fetch('https://api.resend.com/emails/'+encodeURIComponent(dispatch.provider_message_id),{
   redirect:'error',headers:{Authorization:'Bearer '+env.RESEND_API_KEY}});
  const email=r.ok?await r.json().catch(()=>null):null;
  if(!r.ok||!email)return json({ok:true,build:876,state:'NATIVE_PROVIDER_HOLD',
   reason:'Original provider live email lookup unavailable',provider_api_queried:true,
   original_native_signature_proven:false,provider_delivered:false,
   customer_read_proven:false},200,headers);
  const result=await verifyOriginalResendField({dispatch,receipts,email,consent});
  return json({ok:true,build:876,...result,provider_api_queried:true,
   signed_native_events:receipts.filter(x=>typeof x.provider_event_id==='string'&&
    x.provider_event_id.startsWith('native-resend:')).length,
   original_customer_read_not_attested:true,no_booking_or_payment_mutation:true},200,headers);
 }catch{return fail('Original signed native provider readback is unavailable',503);}
}
