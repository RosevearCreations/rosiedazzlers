// Rosie 879: owner-only bounded live original delivery and refund acknowledgment readback.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {onRequestGet as delivery} from './roadside_native_delivery_v878.js';
import {onRequestGet as ack} from './roadside_sla_ack_v878.js';
import {reviewDelivery879,reviewRenewal879} from '../_lib/roadside-watch-rotation-v879.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export async function onRequestGet({request,env}){
 const access=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!access.ok)return access.response;
 if(access.auth_mode!=='session'||access.actor?.is_admin!==true)
  return json({ok:false,build:879,state:'HOLD',error:'Original signed-in Admin required'},403,h);
 const draftId=new URL(request.url).searchParams.get('draft_id')||'';
 if(!isUuid(draftId))return json({ok:false,build:879,state:'HOLD',error:'Exact original draft required'},400,h);
 try{
  const [d,a]=await Promise.all([delivery({request,env}),ack({request,env})]);
  const native=d.ok?await d.json().catch(()=>null):null;
  const cases=a.ok?await a.json().catch(()=>null):null;
  const observedAt=new Date().toISOString();
  const watch=reviewDelivery879(native);
  const renewal=reviewRenewal879(cases);
  return json({ok:true,build:879,observed_at:observedAt,draft_id:draftId,
   delivery_watch:watch,owner_sla_renewal:renewal,
   historical_watch_persistence:false,
   original_native_receipts_not_fabricated:true,
   current_source_acknowledgment_not_auto_renewed:true,
   no_payment_customer_message_or_case_mutation:true},200,h);
 }catch{return json({ok:false,build:879,state:'HOLD',
  error:'Original source stability or SLA custody unavailable'},503,h);}
}
export const onRequestOptions=()=>json({ok:false,build:879,error:'Signed-in owner GET required'},405,h);
