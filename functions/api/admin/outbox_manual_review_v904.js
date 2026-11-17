// Rosie 904: independent original supervisor review; LIVE versioned consent recheck;
// records internal manual readiness only — there is deliberately no sender/provider call.
import {requireStaffAccess,serviceHeaders,isUuid} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {sameOrigin811} from '../client/worksite_issues_v811.js';
import {validId900} from '../../../assets/build900-workforce-safety.mjs';
import {project902} from '../../../assets/build902-jobday-exceptions.mjs';
import {project903} from '../../../assets/build903-exception-routing.mjs';
import {normalize904,project904,revalidate904,CHANNELS904,MANUAL_WINDOW_MS904} from '../../../assets/build904-manual-review.mjs';
import {load901Events,privateRows901} from '../_lib/jobday-safety-v901.js';

const TABLE='rosie_manual_outbox_reviews_v904';
const FIELDS='id,booking_id,exception_id,draft_id,related_receipt_id,event_kind,decision,channel,purpose,customer_profile_id,preference_id,profile_updated_at,staff_user_id,note,recorded_at';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
const deny=()=>reply({ok:false,error:'No outbound delivery, customer contact or arbitrary mutation is available.'},405);
export const onRequestOptions=deny;export const onRequestPut=deny;export const onRequestPatch=deny;export const onRequestDelete=deny;
async function staff(request,env){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return a;
 const role=String(a.actor?.role_code||'').toLowerCase();
 if(a.auth_mode!=='session'||!isUuid(a.actor?.id)||!['admin','operations_manager'].includes(role)||
  !hasActionAccess(a.actor,'operations.assignment.manage')||!hasActionAccess(a.actor,'detailer.job.view'))
  return {ok:false,response:reply({ok:false,error:'Original signed Rosie supervisor session required.'},403)};
 return a;
}
async function rawBooking(env,id){
 if(!validId900(id))throw Error('Invalid original booking');
 const r=await privateRows901(env,'bookings?select=id,service_date,customer_profile_id,status,job_status&id=eq.'+id+'&limit=2',2);
 return r[0]||null;
}
async function liveConsent(env,booking){
 if(!booking||!validId900(booking.customer_profile_id))return {profile:null,preference:null};
 const id=booking.customer_profile_id;
 const [p,v]=await Promise.all([
  privateRows901(env,'customer_profiles?select=id,is_active,archived_at,updated_at,email,phone,sms_phone,notification_opt_in,notification_channel&id=eq.'+id+'&limit=2',2),
  privateRows901(env,'customer_communication_preference_versions?select=id,customer_profile_id,recorded_at,service_email,service_sms,service_phone,marketing_email,marketing_sms,marketing_phone&customer_profile_id=eq.'+id+'&order=recorded_at.desc,id.desc&limit=3',3)
 ]);
 return {profile:p[0]||null,preference:v[0]||null};
}
async function source(env,booking){
 const id=booking.id;
 const [events901,receipts902,receipts903,receipts904,consent]=await Promise.all([
  load901Events(env,id),
  privateRows901(env,'rosie_jobday_exception_receipts_v902?select=id,booking_id,exception_id,event_kind,offer_id,recipient_staff_user_id,priority,decision,note,staff_user_id,recorded_at&booking_id=eq.'+id+'&order=recorded_at.desc&limit=210',210),
  privateRows901(env,'rosie_exception_routing_outbox_v903?select=id,booking_id,exception_id,event_kind,handoff_ack_id,related_receipt_id,recipient_staff_user_id,decision,template_key,staff_user_id,note,recorded_at&booking_id=eq.'+id+'&order=recorded_at.desc&limit=190',190),
  privateRows901(env,TABLE+'?select='+FIELDS+'&booking_id=eq.'+id+'&order=recorded_at.desc&limit=170',170),
  liveConsent(env,booking)
 ]);
 return {events901,receipts902,receipts903,receipts904,consent,
  report902:project902({booking_id:id,events901,receipts902})};
}
function state(d,booking,exception_id){
 const issue=d.report902.exceptions.find(x=>x.id===exception_id);
 if(!issue)return null;
 const report903=project903({booking_id:booking.id,exception:issue,receipts903:d.receipts903.filter(x=>x.exception_id===exception_id)});
 const receipts=d.receipts904.filter(x=>x.exception_id===exception_id);
 const report904=project904({booking,report903,receipts904:receipts,profile:d.consent.profile,preference:d.consent.preference});
 return {issue,report903,report904,receipts};
}
function privacyState(d,booking){
 return Object.fromEntries(CHANNELS904.map(channel=>{
  const x=revalidate904({booking,...d.consent,channel});
  return [channel,{allowed:x.allowed,reason:x.reason,preference_version:x.preference_id||null,recorded_at:x.preference_recorded_at||null}];
 }));
}
export async function onRequestGet({request,env}){
 const a=await staff(request,env);if(!a.ok)return a.response;
 const url=new URL(request.url),booking_id=url.searchParams.get('booking_id'),exception_id=url.searchParams.get('exception_id');
 try{
  if(!booking_id){
   const rows=await privateRows901(env,TABLE+'?select=id,booking_id,exception_id,event_kind,draft_id,recorded_at&event_kind=eq.submit&order=recorded_at.desc&limit=120',120);
   return reply({ok:true,queue:rows.map(x=>({submission_id:x.id,booking_id:x.booking_id,exception_id:x.exception_id,
    draft_id:x.draft_id,submitted_at:x.recorded_at,status:'SOURCE_REVALIDATION_REQUIRED'})),
    queue_is_preview_only:true,no_consent_or_authority_inferred:true,delivery_enabled:false});
  }
  const booking=await rawBooking(env,booking_id);
  if(!booking)return reply({ok:false,error:'Original booking unavailable.'},404);
  const d=await source(env,booking);
  if(exception_id&&!validId900(exception_id))return reply({ok:false,error:'Original exception UUID required.'},400);
  const issues=d.report902.exceptions.map(x=>({id:x.id,subject:x.subject,open:x.open,sla_state:x.sla_state}));
  const selected=exception_id||issues[0]?.id;
  const s=selected?state(d,booking,selected):null;
  if(selected&&!s)return reply({ok:false,error:'Exception outside original work order.'},404);
  return reply({ok:true,booking:{id:booking.id,service_date:booking.service_date},
   exceptions:issues,report903:s?.report903||null,report904:s?.report904||null,
   history:s?s.receipts.map(x=>({id:x.id,event_kind:x.event_kind,decision:x.decision,
    channel:x.channel,staff_user_id:x.staff_user_id,note:x.note,recorded_at:x.recorded_at})):[],
   consent_channels:privacyState(d,booking),
   role:{supervisor:true,actor_id:a.actor.id},source_revision:env.CF_PAGES_COMMIT_SHA||null,
   authority:{send_enabled:false,customer_contact_executed:false,manual_receipts_only:true}});
 }catch{return reply({ok:false,error:'Original consent or custody evidence unavailable. Manual authority HOLD; no message sent.'},503);}
}
export async function onRequestPost({request,env}){
 if(!sameOrigin811(request))return reply({ok:false,error:'Same-origin original staff session required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return reply({ok:false,error:'JSON required.'},415);
 const a=await staff(request,env);if(!a.ok)return a.response;
 const raw=await request.text().catch(()=>'');
 if(raw.length>1400)return reply({ok:false,error:'Signed review request too large.'},413);
 let input;try{input=JSON.parse(raw)}catch{return reply({ok:false,error:'Malformed JSON.'},400)}
 const p=normalize904(input);if(!p.ok)return reply({ok:false,error:p.error},400);
 try{
  const booking=await rawBooking(env,p.booking_id);
  if(!booking)return reply({ok:false,error:'Original booking not found.'},404);
  const existing=await privateRows901(env,TABLE+'?select=*&client_request_id=eq.'+p.client_request_id+'&limit=2',2);
  if(existing.length){
   const x=existing[0];
   const expected=p.action==='submit'?{draft_id:p.draft_id,channel:p.channel}:
    p.action==='review'?{related_receipt_id:p.submission_id,decision:p.decision}:
    {related_receipt_id:p.action==='authorize'?p.review_id:p.authority_id};
   const same=x.event_kind===p.action&&x.booking_id===p.booking_id&&
    x.exception_id===p.exception_id&&x.note===p.note&&x.staff_user_id===a.actor.id&&
    Object.entries(expected).every(([key,val])=>x[key]===val);
   return same?reply({ok:true,source_recorded:true,duplicate:true,receipt_id:x.id,sent_count:0}):
    reply({ok:false,error:'Request key belongs to another signed source event.'},409);
  }
  const d=await source(env,booking),s=state(d,booking,p.exception_id);
  if(!s)return reply({ok:false,error:'Exact original exception is not within booking.'},404);
  const {report903,report904}=s,rows=s.receipts;
  const submission=rows.find(x=>x.id===report904.submission_id&&x.event_kind==='submit');
  const reviewed=rows.find(x=>x.id===report904.review_id&&x.event_kind==='review');
  const authority=rows.find(x=>x.id===report904.authority_id&&x.event_kind==='authorize');
  // Every mutation reads latest live profile and versioned preference from the original linked booking.
  const via=p.action==='submit'?p.channel:submission?.channel;
  const consent=revalidate904({booking,...d.consent,channel:via});
  // Revocation must remain possible even after consent withdrawal, profile archive or deletion:
  // use the signed original authority snapshot only for the *revocation* receipt.
  const custody=p.action==='revoke'&&authority?{
   customer_profile_id:authority.customer_profile_id,preference_id:authority.preference_id,
   profile_updated_at:authority.profile_updated_at}:consent;
  if(!validId900(custody.customer_profile_id)||!validId900(custody.preference_id)||!custody.profile_updated_at)
   return reply({ok:false,error:'Versioned original customer preference unavailable. Consent HOLD.'},409);
  const snapshotMatch=!submission||(submission.customer_profile_id===consent.customer_profile_id&&
   submission.preference_id===consent.preference_id&&submission.profile_updated_at===consent.profile_updated_at);
  let payload={client_request_id:p.client_request_id,booking_id:p.booking_id,exception_id:p.exception_id,
   staff_user_id:a.actor.id,note:p.note,event_kind:p.action,channel:via,purpose:'service',
   draft_id:p.action==='submit'?p.draft_id:submission?.draft_id,
   customer_profile_id:custody.customer_profile_id,preference_id:custody.preference_id,
   profile_updated_at:custody.profile_updated_at,
   internal_only:true,provider_send_enabled:false,automatic_send_enabled:false,
   customer_contact_executed:false,delivery_claimed:false,physical_safety_certified:false};
  if(p.action==='submit'){
   if(!report903.owner_current||report903.owner_staff_user_id!==a.actor.id||
    report903.outbox?.id!==p.draft_id||report904.submission_id)
    return reply({ok:false,error:'Only current verified original 903 owner can submit the active UNSENT draft.'},403);
   if(!consent.allowed)return reply({ok:false,error:'Fresh explicit original channel consent missing: '+consent.reason},409);
  }else if(p.action==='review'){
   if(!submission||submission.id!==p.submission_id||report904.review_id||
    submission.staff_user_id===a.actor.id||!report903.owner_current||
    report903.owner_staff_user_id!==submission.staff_user_id||report903.outbox?.id!==submission.draft_id)
    return reply({ok:false,error:'Independent review requires an active original submission and distinct supervisor.'},403);
   if(p.decision==='approved'&&(!consent.allowed||!snapshotMatch))
    return reply({ok:false,error:'Latest source consent changed; approval HOLD. Submit a newly checked draft.'},409);
   payload={...payload,related_receipt_id:submission.id,decision:p.decision};
  }else if(p.action==='authorize'){
   if(!submission||!reviewed||reviewed.id!==p.review_id||reviewed.decision!=='approved'||
    report904.authority_id||reviewed.staff_user_id===a.actor.id||
    submission.staff_user_id!==a.actor.id||report904.state!=='REVIEWED_PENDING_OWNER_AUTHORITY'||
    !report904.review_fresh||!report904.source_current||!snapshotMatch||!consent.allowed)
    return reply({ok:false,error:'Manual readiness HOLD: independent current review, original owner and fresh consent required.'},409);
   payload={...payload,related_receipt_id:reviewed.id};
  }else if(p.action==='revoke'){
   if(!authority||authority.id!==p.authority_id||
    ![submission?.staff_user_id,reviewed?.staff_user_id].includes(a.actor.id)||
    rows.some(x=>x.event_kind==='revoke'&&x.related_receipt_id===authority.id))
    return reply({ok:false,error:'Only original owner/reviewer may revoke a not-yet-revoked manual receipt.'},403);
   payload={...payload,related_receipt_id:authority.id};
  }
  if(!validId900(payload.draft_id))return reply({ok:false,error:'Original active draft linkage unavailable.'},409);
  const res=await fetch(env.SUPABASE_URL+'/rest/v1/'+TABLE+'?select=id',{
   method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},
   body:JSON.stringify([payload])});
  if(res.status===409)return reply({ok:false,error:'Concurrent source review conflict; refresh and inspect.'},409);
  if(!res.ok)return reply({ok:false,error:'Original manual-review receipt could not be recorded. No delivery authorized.'},503);
  const saved=await res.json().catch(()=>null);
  if(!Array.isArray(saved)||!isUuid(saved[0]?.id))
   return reply({ok:false,error:'Original receipt readback missing. Review before retry.'},503);
  return reply({ok:true,source_recorded:true,receipt_id:saved[0].id,
   action:p.action,consent_version_bound:true,manual_readiness_only:true,
   authority_window_minutes:MANUAL_WINDOW_MS904/60000,send_enabled:false,sent_count:0,
   provider_calls:0,customer_contact_executed:false,master_deliveries:0},201);
 }catch{return reply({ok:false,error:'Original live consent and custody unavailable. Manual authority HOLD; no delivery.'},503);}
}
