// Rosie 877: owner-only independent refund escalation SLA readback.
// No original case creation, no customer contact and no financial mutation.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {refundReadback} from './roadside_audit_v871.js';
import {assessRoadsideRefundDrift} from '../_lib/roadside-refund-drift-v875.js';
import {classifyRoadsideRefundEscalation} from '../_lib/roadside-escalation-policy-v876.js';
import {auditOriginalEscalationSla} from '../_lib/roadside-sla-audit-v877.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:877,error,financial_clearance:false},status,h);
async function rows(env,path){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,
  {headers:serviceHeaders(env),redirect:'error'});
 const v=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(v))throw Error('Original private refund source unavailable');
 return v;
}
export async function onRequestGet({request,env}){
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original private source unavailable',503);
 const auth=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)
  return fail('Signed-in owner/Admin required',403);
 const draftId=new URL(request.url).searchParams.get('draft_id')||'';
 if(!isUuid(draftId))return fail('Exact original roadside draft required');
 try{
  const drafts=await rows(env,'rosie_detailing_intake_v868?select=id,linked_booking_id'+
   '&id=eq.'+encodeURIComponent(draftId)+'&limit=2');
  if(drafts.length!==1)return fail('Original roadside draft unavailable',404);
  const bookingId=drafts[0].linked_booking_id;
  if(!isUuid(bookingId))return fail('Original canonical booking required',409);
  const [checks,cases]=await Promise.all([
   rows(env,'rosie_roadside_net_deposit_checks_v871?select=id,booking_id,provider,source,state,'+
    'gross_cents,refunded_cents,net_cents,net_verified,checked_at&draft_id=eq.'+
    encodeURIComponent(draftId)+'&booking_id=eq.'+encodeURIComponent(bookingId)+
    '&order=checked_at.desc,id.desc&limit=1'),
   rows(env,'rosie_roadside_refund_cases_v872?select=id,draft_id,booking_id,state,opened_at,owner_reviewed_at'+
    '&draft_id=eq.'+encodeURIComponent(draftId)+
    '&booking_id=eq.'+encodeURIComponent(bookingId)+'&order=opened_at.asc&limit=100')
  ]);
  const now=Date.now();
  const snapshot=checks[0]||null;
  const live=await refundReadback(env,bookingId);
  const drift=assessRoadsideRefundDrift({snapshot,live,bookingId,nowMs:now});
  const policy=classifyRoadsideRefundEscalation(drift,{nowMs:now,
   lastCheckAt:snapshot?.checked_at});
  const audit=auditOriginalEscalationSla({policy,cases,nowMs:now});
  return json({ok:true,build:877,policy:{severity:policy.severity,action:policy.action},
   ...audit,latest_original_source_check_id:snapshot?.id||null,
   checked_at:new Date(now).toISOString(),
   original_case_count:cases.filter(x=>['open','reviewed_hold'].includes(x.state)).length,
   live_provider_source_checked:true,financial_clearance:false,
   original_owner_followup_not_auto_approved:true,
   no_case_or_refund_mutation:true},200,h);
 }catch{return fail('Original provider or case SLA source unavailable; manual HOLD remains',503);}
}
export const onRequestOptions=()=>fail('Owner GET required',405);
