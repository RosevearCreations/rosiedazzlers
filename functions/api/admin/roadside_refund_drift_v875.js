// Rosie 875: owner-only read-only live refund completeness drift alerts.
// No ledger writes, booking updates, automatic refunds or outbound messages.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {refundReadback} from './roadside_audit_v871.js';
import {assessRoadsideRefundDrift} from '../_lib/roadside-refund-drift-v875.js';
const headers={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:875,error,
 release_approved:false,booking_or_payment_mutated:false},status,headers);
async function rows(env,entity,query){
 const result=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+entity+query,{
  redirect:'error',headers:serviceHeaders(env)});
 const data=await result.json().catch(()=>null);
 if(!result.ok||!Array.isArray(data))throw Error('Original source evidence unavailable');
 return data;
}
export const onRequestOptions=()=>fail('Owner GET required',405);
export async function onRequestGet({request,env}){
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original private storage not configured',503);
 const access=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!access.ok)return access.response;
 if(access.auth_mode!=='session'||access.actor?.is_admin!==true)
  return fail('Signed-in owner/Admin required',403);
 const id=new URL(request.url).searchParams.get('draft_id')||'';
 if(!isUuid(id))return fail('Exact roadside draft ID required');
 try{
  const drafts=await rows(env,'rosie_detailing_intake_v868',
   '?select=id,linked_booking_id&id=eq.'+encodeURIComponent(id)+'&limit=2');
  if(drafts.length!==1)return fail('Original roadside draft unavailable',404);
  const bookingId=drafts[0].linked_booking_id;
  if(!isUuid(bookingId))return fail('Original canonical linked booking required',409);
  const checks=await rows(env,'rosie_roadside_net_deposit_checks_v871',
   '?select=id,draft_id,booking_id,provider,source,state,gross_cents,refunded_cents,net_cents,net_verified,checked_at'+
   '&draft_id=eq.'+encodeURIComponent(id)+
   '&booking_id=eq.'+encodeURIComponent(bookingId)+'&order=checked_at.desc,id.desc&limit=1');
  // Server checks the actual current Stripe/PayPal source. Never trust a browser
  // value or infer completeness from local refund records alone.
  const live=await refundReadback(env,bookingId);
  const drift=assessRoadsideRefundDrift({snapshot:checks[0]||null,live,bookingId});
  return json({ok:true,build:875,draft_id:id,booking_linked:true,
   latest_check_id:checks[0]?.id||null,latest_check_at:checks[0]?.checked_at||null,
   ...drift,owner_attention_required:drift.alert,
   external_notification_sent:false,owner_pilot_automatically_closed:false},200,headers);
 }catch{
  return fail('Fresh original provider readback unavailable; manual HOLD remains',503);
 }
}
