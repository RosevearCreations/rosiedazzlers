// Rosie 897 — original signed-session staff CRM planning API.
// No provider send, customer preference changes, or cross-app calls.
import {staffAccess811} from './worksite_issue_review_v811.js';
import {sameOrigin811} from '../client/worksite_issues_v811.js';
import {serviceHeaders,isUuid} from '../_lib/staff-auth.js';
import {PREFERENCE_FIELDS743} from '../../../assets/notification-consent-preview-v743.mjs';
import {TEMPLATES897,CHANNELS897,normalizePlan897,consentMatrix897,auditRecord897,plannedTask897,sourceActivity897} from '../../../assets/build897-crm-consent-handoff.mjs';
const TABLE='customer_communication_handoff_audit';
const answer=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
const denied=()=>answer({ok:false,error:'Unsupported method.'},405);
export const onRequestOptions=denied;
export const onRequestPut=denied;
export const onRequestPatch=denied;
export const onRequestDelete=denied;
async function staff(request,env){
 const access=await staffAccess811(request,env);
 if(!access.ok)return access;
 if(!['admin','operations_manager'].includes(String(access.actor?.role_code||'').toLowerCase()))
  return {ok:false,response:answer({ok:false,error:'Operations supervisor permission required.'},403)};
 return access;
}
async function read(env,path){
 if(!/^https:\/\//.test(String(env?.SUPABASE_URL||'')))throw Error('Private source missing');
 const res=await fetch(env.SUPABASE_URL+'/rest/v1/'+path,{headers:serviceHeaders(env),redirect:'error'});
 if(!res.ok)throw Error('Private source read failed');
 const data=await res.json();
 if(!Array.isArray(data)||data.length>40)throw Error('Invalid source window');
 return data;
}
async function current(env,id){
 const [profiles,preferences]=await Promise.all([
  read(env,'customer_profiles?select=id,email,phone,sms_phone,notification_opt_in,notification_channel,is_active,archived_at&id=eq.'+encodeURIComponent(id)+'&limit=1'),
  read(env,'customer_communication_preference_versions?select=id,recorded_at,'+PREFERENCE_FIELDS743.join(',')+'&customer_profile_id=eq.'+encodeURIComponent(id)+'&order=recorded_at.desc,id.desc&limit=1')
 ]);
 const profile=profiles[0];
 if(!profile||profile.id!==id||profile.is_active!==true||profile.archived_at)return null;
 return {profile,preference:preferences[0]||null};
}
export async function onRequestGet({request,env}){
 const access=await staff(request,env);if(!access.ok)return access.response;
 const id=new URL(request.url).searchParams.get('customer_profile_id')||'';
 if(!isUuid(id))return answer({ok:false,error:'Exact customer profile ID required.'},400);
 try{
  const source=await current(env,id);
  if(!source)return answer({ok:false,error:'Active customer profile not found.'},404);
  const [tasks,notifications,issues]=await Promise.all([
   read(env,TABLE+'?select=id,note_summary,channel,purpose,outcome,recorded_at&customer_profile_id=eq.'+id+'&order=recorded_at.desc&limit=30'),
   read(env,'notification_events?select=id,event_type,channel,status,created_at,sent_at,processed_at,attempt_count&customer_profile_id=eq.'+id+'&order=created_at.desc&limit=20'),
   read(env,'customer_worksite_issues_v811?select=id,category,status,submitted_at,booking_id&customer_profile_id=eq.'+id+'&order=submitted_at.desc&limit=15')
  ]);
  return answer({ok:true,build:897,customer_profile_id:id,templates:TEMPLATES897,channels:CHANNELS897,
   consent:consentMatrix897(source.profile,source.preference),
   preference_recorded_at:source.preference?.recorded_at||null,
   task_history:tasks.map(plannedTask897).filter(Boolean),
   notification_history:notifications.map(sourceActivity897),
   inbound_support:issues.map(row=>({id:row.id,booking_id:row.booking_id,category:row.category,
    status:row.status,submitted_at:row.submitted_at})),
   authority:{original_staff_session:true,send_enabled:false,master_connected:false,
    operator_handoff_status:'HOLD_UNENROLLED',protocol:'1.1_backwards_1.0',
    provider_delivery_verified:false,consent_not_a_send_grant:true,
    sends:0,master_calls:0,automatic_retries:0}});
 }catch{return answer({ok:false,error:'Current CRM and consent sources unavailable. All plans held.'},503)}
}
export async function onRequestPost({request,env}){
 if(!sameOrigin811(request))return answer({ok:false,error:'Same-origin signed-in staff interface required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return answer({ok:false,error:'JSON required.'},415);
 const access=await staff(request,env);if(!access.ok)return access.response;
 const raw=await request.text().catch(()=>'');
 if(raw.length>1400)return answer({ok:false,error:'Plan too large.'},413);
 let input;try{input=JSON.parse(raw)}catch{return answer({ok:false,error:'Invalid JSON.'},400)}
 const plan=normalizePlan897(input);
 if(!plan.ok)return answer({ok:false,error:plan.error},400);
 try{
  const source=await current(env,plan.customer_profile_id);
  if(!source)return answer({ok:false,error:'Active customer profile not found.'},404);
  const matrix=consentMatrix897(source.profile,source.preference);
  const record=auditRecord897(plan,matrix[plan.template.id+':'+plan.channel],access.actor?.full_name||access.actor?.email);
  const query=TABLE+'?select=id,client_request_id,note_summary,channel,purpose,outcome,recorded_at&customer_profile_id=eq.'+
   plan.customer_profile_id+'&client_request_id=eq.'+plan.client_request_id+'&limit=1';
  const prior=await read(env,query);
  if(prior.length){
   const same=prior[0].note_summary===record.note_summary&&prior[0].channel===record.channel&&prior[0].purpose===record.purpose;
   return same?answer({ok:true,duplicate:true,task:plannedTask897(prior[0]),messages_sent:0}):answer({ok:false,error:'Request key already used. Refresh.'},409);
  }
  const res=await fetch(env.SUPABASE_URL+'/rest/v1/'+TABLE+'?select=id,note_summary,channel,purpose,outcome,recorded_at',{
   method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([record])});
  if(res.status===409)return answer({ok:false,error:'Concurrent task detected. Refresh before retry.'},409);
  if(!res.ok)return answer({ok:false,error:'Could not save internal task. No message sent.'},503);
  const saved=await res.json().catch(()=>[]);
  if(!Array.isArray(saved)||!saved[0])return answer({ok:false,error:'Task readback unavailable. Refresh before retry.'},503);
  return answer({ok:true,task:plannedTask897(saved[0]),messages_sent:0,provider_calls:0,
   comms_handoff:'HOLD_UNENROLLED',current_consent_not_send_authorization:true},201);
 }catch{return answer({ok:false,error:'CRM source unavailable. No message sent.'},503)}
}
