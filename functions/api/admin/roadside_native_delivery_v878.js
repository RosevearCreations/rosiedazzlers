// Rosie 878: original provider-native signed delivery evidence, owner-only GET.
// Requires both separate, live provider account and email readbacks.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {onRequestGet as readEnrollment} from './roadside_provider_enrollment_v877.js';
import {onRequestGet as readNativeField} from './roadside_native_field_v876.js';
import {assessNativeEventDelivery878} from '../_lib/roadside-native-delivery-v878.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:878,error,delivery_corroborated:false},status,h);
export async function onRequestGet({request,env}){
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original private provider ledger unavailable',503);
 const access=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!access.ok)return access.response;
 if(access.auth_mode!=='session'||access.actor?.is_admin!==true)
  return fail('Signed-in owner/Admin session required',403);
 const draftId=new URL(request.url).searchParams.get('draft_id')||'';
 if(!isUuid(draftId))return fail('Exact original roadside draft required');
 try{
  const [e,n]=await Promise.all([
   readEnrollment({request,env}),readNativeField({request,env})]);
  if(!e.ok||!n.ok)return fail('Independent original vendor authorities unavailable',503);
  const [enrollment,nativeField]=await Promise.all([e.json(),n.json()]);
  if(enrollment?.ok!==true||nativeField?.ok!==true)
   return fail('Original vendor source verification incomplete',503);
  const id=nativeField.original_dispatch_id;
  if(!isUuid(id))return json({ok:true,build:878,
   state:'NATIVE_EVENT_HOLD',delivery_corroborated:false,
   reason:'No exact original native dispatch to corroborate with live provider',
   webhook_registration_readback:enrollment.enrollment_verified===true},200,h);
  const base=env.SUPABASE_URL.replace(/\/+$/,'');
  const resp=await fetch(base+'/rest/v1/rosie_roadside_dispatches_v872?select=id,draft_id,provider_message_id'+
   '&id=eq.'+encodeURIComponent(id)+'&draft_id=eq.'+encodeURIComponent(draftId)+'&limit=2',
   {headers:serviceHeaders(env),redirect:'error'});
  const dispatch=await resp.json().catch(()=>null);
  if(!resp.ok||!Array.isArray(dispatch)||dispatch.length!==1)
   return fail('Original dispatch and draft identity do not match',409);
  const r=await fetch(base+'/rest/v1/rosie_roadside_provider_receipts_v872?select=id,dispatch_id,'+
   'provider_event_id,provider_message_id,event_type,effective_state,signature_verified,received_at'+
   '&dispatch_id=eq.'+encodeURIComponent(id)+'&order=received_at.desc&limit=100',
   {headers:serviceHeaders(env),redirect:'error'});
  const receipts=await r.json().catch(()=>null);
  if(!r.ok||!Array.isArray(receipts))return fail('Original signed event evidence unavailable',503);
  if(receipts.some(x=>x.provider_message_id!==dispatch[0].provider_message_id))
   return fail('Provider event message identity differs from original dispatch',409);
  const result=await assessNativeEventDelivery878({nativeField,enrollment,receipts,dispatchId:id});
  return json({ok:true,build:878,...result,
   original_dispatch_record_verified:true,
   original_owner_draft_scope_verified:true,
   provider_webhook_id:enrollment.enrollment_verified?enrollment.webhook_id:null,
   original_evidence_missing_is_hold:!result.delivery_corroborated,
   payment_or_booking_mutated:false},200,h);
 }catch{return fail('Original vendor-native source readback unavailable; HOLD',503);}
}
export const onRequestOptions=()=>fail('Signed-in owner GET required',405);
