import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {loadState708} from './quote_customer_handoff.js';
import {OUTCOME_EVENT709} from '../../../assets/quote-communication-outcome-v709.mjs';
import {RESOLUTION_EVENT710} from '../../../assets/quote-followup-resolution-v710.mjs';
import {FOLLOWUP_EVENT711} from '../../../assets/quote-followup-aging-v711.mjs';
import {ESCALATION_EVENT712,escalationReview712} from '../../../assets/quote-followup-escalation-v712.mjs';
import {EXCEPTION_REVIEW_EVENT713,EXCEPTION_CODES713,workloadTriage713,
  liveExceptions713,reviewedException713} from '../../../assets/quote-followup-workload-v713.mjs';

const clean=value=>String(value??'').trim();
const manager=actor=>['admin','senior_detailer'].includes(clean(actor?.role_code));
const authorize=(request,env,body,bookingId)=>requireStaffAccess({request,env,body,
  capability:'manage_bookings',bookingId,allowLegacyAdminFallback:true});
const select=encodeURIComponent('id,created_at,event_type,actor_name,payload');
async function rows(env,path){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if(!response.ok)throw Error('Follow-up source unavailable.');
  const data=await response.json().catch(()=>null);
  if(!Array.isArray(data))throw Error('Invalid follow-up source readback.');
  return data;
}
async function selectedDetail(env,id){
  const state=await loadState708(env,id);
  if(!state)return null;
  const bookingId=state.source.booking?.id;
  const types=[OUTCOME_EVENT709,RESOLUTION_EVENT710,FOLLOWUP_EVENT711,ESCALATION_EVENT712,EXCEPTION_REVIEW_EVENT713].join(',');
  const [events,quoteDates]=await Promise.all([
    isUuid(bookingId)?rows(env,`booking_events?select=${select}&booking_id=eq.${bookingId}&event_type=in.(${types})&order=created_at.desc,id.desc&limit=250`):[],
    rows(env,`quote_pipeline_items?select=id,next_follow_up_at&id=eq.${id}&limit=1`)
  ]);
  const review=escalationReview712(state,events,quoteDates[0]?.next_follow_up_at||null);
  const reviewEvents=events.filter(e=>e.event_type===EXCEPTION_REVIEW_EVENT713&&
    e.payload?.quote_id===id&&e.payload?.booking_id===bookingId);
  return {state,review,reviewEvents,eventLimitReached:events.length===250};
}
function publicDetail(record,actor){
  const {state,review,reviewEvents}=record;
  const f=review.followup;
  const exceptions=liveExceptions713(review);
  const reviewedCodes=exceptions.filter(code=>reviewedException713(reviewEvents,code,review));
  return {ok:true,quote_id:state.source.quote.id,booking_id:state.source.booking?.id||null,
    quote_number:state.source.quote.quote_number||'Saved quote',
    manager_review_allowed:manager(actor),
    marker:f.resolution.marker,
    latest_outcome_event_id:f.resolution.latest_outcome_event_id,
    latest_resolution_event_id:f.resolution.latest_resolution_event_id,
    latest_assignment_event_id:f.assignment?.id||null,
    latest_consent_recheck_event_id:f.latest_check?.id||null,
    latest_escalation_event_id:review.latest?.id||null,
    latest_exception_review_event_id:reviewEvents[0]?.id||null,
    assigned_staff_name:f.assigned?.payload.assigned_staff_name||null,
    overdue:review.overdue,overdue_days:review.overdue_days,
    live_exceptions:exceptions,reviewed_codes:reviewedCodes,
    audit_closed:review.audit_closed,consent_allowed:review.consent_allowed,
    event_history_may_be_truncated:record.eventLimitReached,
    history:reviewEvents.slice(0,20).map(e=>({id:e.id,created_at:e.created_at,
      actor_name:e.actor_name,exception_code:e.payload.exception_code,note:e.payload.note})),
    staff_only:true,live_consent_verified:true,customer_contacted:false,
    sends_email:false,sends_sms:false,grants_consent:false,closes_audit:false};
}
export async function onRequestGet({request,env}){
  const id=new URL(request.url).searchParams.get('quote_id')||'';
  if(id&&!isUuid(id))return json({ok:false,error:'Valid quote ID required.'},400);
  const access=await authorize(request,env,{});
  if(!access.ok)return access.response;
  if(!manager(access.actor))return json({ok:false,error:'Management role required to view staff workload distribution.'},403);
  try{
    if(id){const record=await selectedDetail(env,id);
      return record?json(publicDetail(record,access.actor)):
        json({ok:false,error:'Saved quote not found.'},404);}
    const quotes=await rows(env,`quote_pipeline_items?select=${encodeURIComponent('id,booking_id,quote_number,status,next_follow_up_at,created_at,updated_at')}&status=not.in.(declined,expired)&order=next_follow_up_at.asc.nullslast,updated_at.asc&limit=150`);
    const types=[FOLLOWUP_EVENT711,ESCALATION_EVENT712,EXCEPTION_REVIEW_EVENT713].join(',');
    const events=await rows(env,`booking_events?select=${select}&event_type=in.(${types})&order=created_at.desc,id.desc&limit=800`);
    const report=workloadTriage713(quotes,events);
    return json({ok:true,...report,event_limit:800,
      historical_records_may_be_truncated:quotes.length===150||events.length===800,
      queue_only:true,requires_selected_live_review:true,
      review_actions_available:manager(access.actor),
      staff_only:true,sends_email:false,sends_sms:false});
  }catch{return json({ok:false,error:'Workload source unavailable. No audit, owner or consent may be assumed current.'},503);}
}
export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>({}));
  const quoteId=clean(body.quote_id),bookingId=clean(body.booking_id),code=clean(body.exception_code),note=clean(body.note);
  if(!isUuid(quoteId)||!isUuid(bookingId)||body.action!=='review_exception'||
    !EXCEPTION_CODES713.includes(code)||body.acknowledge_real_exception_review!==true||
    note.length<12||note.length>300||!body.expected_marker||
    typeof body.expected_marker!=='object'||Array.isArray(body.expected_marker)||
    !['expected_latest_outcome_event_id','expected_latest_resolution_event_id',
      'expected_latest_assignment_event_id','expected_latest_consent_recheck_event_id',
      'expected_latest_escalation_event_id','expected_latest_exception_review_event_id']
      .every(key=>Object.hasOwn(body,key)))
    return json({ok:false,error:'A saved quote, booking, selected exception, actual note and fresh source markers are required.'},400);
  if(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(note)||/\+?\d[\d().\-\s]{7,}\d/.test(note))
    return json({ok:false,error:'Remove customer contact details from the internal review note.'},400);
  const access=await authorize(request,env,body,bookingId);
  if(!access.ok)return access.response;
  if(!manager(access.actor))return json({ok:false,error:'Only admin or senior detailer may review workload exceptions.'},403);
  try{
    const record=await selectedDetail(env,quoteId);
    if(!record||record.state.source.quote.booking_id!==bookingId||record.state.source.booking?.id!==bookingId)
      return json({ok:false,error:'Quote and booking no longer match.'},409);
    if(record.eventLimitReached)return json({ok:false,error:'Event history is truncated. Independent review is required before writing.'},409);
    const f=record.review.followup,marker=f.resolution.marker;
    if(!Object.keys(marker).every(key=>body.expected_marker[key]===marker[key])||
      clean(body.expected_latest_outcome_event_id)!==clean(f.resolution.latest_outcome_event_id)||
      clean(body.expected_latest_resolution_event_id)!==clean(f.resolution.latest_resolution_event_id)||
      clean(body.expected_latest_assignment_event_id)!==clean(f.assignment?.id)||
      clean(body.expected_latest_consent_recheck_event_id)!==clean(f.latest_check?.id)||
      clean(body.expected_latest_escalation_event_id)!==clean(record.review.latest?.id)||
      clean(body.expected_latest_exception_review_event_id)!==clean(record.reviewEvents[0]?.id))
      return json({ok:false,error:'Quote, booking, consent, assignment or exception history changed. Refresh first.'},409);
    if(!liveExceptions713(record.review).includes(code))
      return json({ok:false,error:'This exception no longer exists in the current live review.'},409);
    if(reviewedException713(record.reviewEvents,code,record.review))
      return json({...publicDetail(record,access.actor),already_current:true});
    const event={booking_id:bookingId,event_type:EXCEPTION_REVIEW_EVENT713,
      actor_name:clean(access.actor?.full_name||access.actor?.email||'Authorized manager').slice(0,120),
      event_note:'Internal manager exception assessment only. No customer contact or audit closure.',
      payload:{quote_id:quoteId,booking_id:bookingId,action:'review_exception',exception_code:code,
        note,marker,assignment_event_id:f.assignment?.id||null,
        consent_recheck_event_id:f.latest_check?.id||null,
        escalation_event_id:record.review.latest?.id||null,
        outcome_event_id:f.resolution.latest_outcome_event_id,
        resolution_event_id:f.resolution.latest_resolution_event_id,
        previous_exception_review_event_id:record.reviewEvents[0]?.id||null,
        consent_allowed_at_review:record.review.consent_allowed,staff_only:true,
        customer_contacted:false,grants_consent:false,closes_audit:false,build:713}};
    const saved=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{method:'POST',
      headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([event])});
    if(!saved.ok)return json({ok:false,error:'Exception assessment not saved. No message sent.'},502);
    const inserted=await saved.json().catch(()=>null);
    if(!Array.isArray(inserted)||!inserted[0]?.id)
      return json({ok:false,error:'Review readback failed; inspect history before retrying.'},502);
    const refreshed=await selectedDetail(env,quoteId);
    return refreshed?json({...publicDetail(refreshed,access.actor),recorded:true,
      recorded_event_id:inserted[0].id}):
      json({ok:false,error:'Assessment saved but source changed. Refresh manually.'},409);
  }catch{return json({ok:false,error:'Current management exception review unavailable. No message sent.'},503);}
}
