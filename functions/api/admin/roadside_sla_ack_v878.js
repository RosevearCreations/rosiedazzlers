// Rosie 878: original signed-in Admin records immutable refund SLA acknowledgement.
// Service-only Supabase RPC verifies original open case + latest source check.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {onRequestGet as readSla} from './roadside_sla_audit_v877.js';
import {assessOwnerSlaAcknowledgement878} from '../_lib/roadside-owner-ack-v878.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:878,error,ack_persisted:false,
 refund_or_case_modified:false},status,h);
async function rows(env,path){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,
  {headers:serviceHeaders(env),redirect:'error'});
 const v=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(v))throw Error('Original private SLA custody unavailable');
 return v;
}
async function source({request,env,draftId}){
 const url=new URL(request.url);
 url.searchParams.set('draft_id',draftId);
 const response=await readSla({request:new Request(url.toString(),{
  method:'GET',headers:request.headers}),env});
 if(!response.ok)throw Error('Original refund source and SLA review unavailable');
 const audit=await response.json();
 if(audit?.ok!==true)throw Error('Current original SLA audit is not verified');
 const draft=await rows(env,'rosie_detailing_intake_v868?select=id,linked_booking_id'+
  '&id=eq.'+encodeURIComponent(draftId)+'&limit=2');
 if(draft.length!==1||!isUuid(draft[0].linked_booking_id))
  throw Error('Original draft has no canonical linked booking');
 const bookingId=draft[0].linked_booking_id;
 const cases=await rows(env,'rosie_roadside_refund_cases_v872?select=id,draft_id,booking_id,state,opened_at'+
  '&draft_id=eq.'+encodeURIComponent(draftId)+'&booking_id=eq.'+
  encodeURIComponent(bookingId)+'&state=in.(open,reviewed_hold)&order=opened_at.asc&limit=100');
 if(cases.length>=100)throw Error('Original unresolved case history exceeds bounded audit');
 return {audit,cases,bookingId};
}
async function authorize(request,env,body={}){
 const auth=await requireStaffAccess({request,env,body,capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return {response:auth.response};
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)
  return {response:fail('Signed-in owner/Admin session required',403)};
 return {actor:auth.actor};
}
export async function onRequestGet({request,env}){
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original Supabase authority unavailable',503);
 const access=await authorize(request,env);
 if(access.response)return access.response;
 const id=new URL(request.url).searchParams.get('draft_id')||'';
 if(!isUuid(id))return fail('Exact original roadside draft required');
 try{
  const {audit,cases}=await source({request,env,draftId:id});
  const acks=await rows(env,'rosie_roadside_sla_acks_v878?select=id,case_id,source_check_id,'+
   'severity,owner_actor,original_case_opened_at,acknowledged_at&draft_id=eq.'+
   encodeURIComponent(id)+'&order=acknowledged_at.desc&limit=100');
  if(acks.length>=100)throw Error('Original owner acknowledgement history exceeds readback bound');
  const severity=audit?.policy?.severity;
  const sourceCheckId=audit.latest_original_source_check_id;
  const casesReviewed=cases.map(c=>({case_id:c.id,original_case_opened_at:c.opened_at,
   ...assessOwnerSlaAcknowledgement878({originalCase:c,acks,sourceCheckId,severity})}));
  const required=casesReviewed.filter(x=>x.state==='OWNER_ACK_REQUIRED').length;
  const acknowledged=casesReviewed.filter(x=>x.state==='OWNER_ACKNOWLEDGED').length;
  return json({ok:true,build:878,draft_id:id,original_sla_state:audit.state,
   source_check_id:sourceCheckId,severity,cases:casesReviewed,
   owner_acknowledgement_required:required>0,
   all_current_owner_cases_acknowledged:cases.length>0&&acknowledged===cases.length,
   original_cases_missing:cases.length===0,
   no_owner_ack_claim_without_original_case:true,
   refund_case_or_payment_changed:false},200,h);
 }catch{return fail('Original SLA source or owner acknowledgement history unavailable',503);}
}
export async function onRequestPost({request,env}){
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original private authority unavailable',503);
 // Session cookies are not enough to protect a state-changing request against
 // cross-origin browser requests; original same-origin Origin is mandatory.
 const origin=request.headers.get('Origin')||'';
 if(!/^https:\/\//.test(origin)||origin!==new URL(request.url).origin||
  !/application\/json/i.test(request.headers.get('Content-Type')||''))
  return fail('Exact same-origin owner JSON request required',403);
 const raw=await request.text().catch(()=>'');
 if(raw.length<20||raw.length>1400)return fail('Owner acknowledgement outside size bounds',413);
 let body;try{body=JSON.parse(raw)}catch{return fail('Owner acknowledgement JSON required');}
 const id=body?.draft_id,caseId=body?.case_id,sourceId=body?.source_check_id;
 const note=typeof body?.owner_note==='string'?body.owner_note.trim():'';
 if(!isUuid(id)||!isUuid(caseId)||!isUuid(sourceId)||note.length<12||note.length>500)
  return fail('Exact original case, source check and owner explanation required');
 const access=await authorize(request,env,{});
 if(access.response)return access.response;
 const actor=String(access.actor?.email||access.actor?.id||'').trim();
 if(actor.length<3||actor.length>140)return fail('Original signed-in owner identity unavailable',403);
 try{
  const {audit,cases,bookingId}=await source({request,env,draftId:id});
  if(!['SLA_BREACHED','SLA_WITHIN_POLICY'].includes(audit.state)||
   !['CRITICAL','HIGH','REVIEW'].includes(audit.policy?.severity)||
   audit.latest_original_source_check_id!==sourceId||
   !cases.some(c=>c.id===caseId))
   return fail('Current original open-case SLA/financial evidence must be reviewed before acknowledgement',409);
  const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+
   '/rest/v1/rpc/rosie878_ack_owner_sla',{
    method:'POST',redirect:'error',
    headers:{...serviceHeaders(env),Prefer:'return=representation'},
    body:JSON.stringify({p_id:crypto.randomUUID(),p_case_id:caseId,p_draft_id:id,
      p_booking_id:bookingId,p_source_check_id:sourceId,p_severity:audit.policy.severity,
      p_actor:actor,p_note:note})});
  const result=await r.json().catch(()=>null);
  if(!r.ok||!Array.isArray(result)||result.length!==1||
   result[0].outcome!=='ORIGINAL_OWNER_SLA_ACK_PERSISTED'||
   !isUuid(result[0].ack_id))
   return fail('Original owner SLA acknowledgement was not committed',409);
  return json({ok:true,build:878,state:'OWNER_SLA_ACK_PERSISTED',
   acknowledged_at:result[0].ack_at,ack_id:result[0].ack_id,
   source_check_id:sourceId,severity:audit.policy.severity,
   original_case_opened_at:cases.find(c=>c.id===caseId).opened_at,
   original_sla_state:audit.state,
   sla_deadline_not_reset:true,refund_case_or_payment_changed:false,
   no_owner_closure_inferred:true},201,h);
 }catch{return fail('Original owner SLA source or immutable acknowledgment unavailable',503);}
}
export const onRequestOptions=()=>fail('Owner session required',405);
