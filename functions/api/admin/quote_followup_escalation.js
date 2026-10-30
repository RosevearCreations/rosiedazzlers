import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {loadState708} from './quote_customer_handoff.js';
import {OUTCOME_EVENT709} from '../../../assets/quote-communication-outcome-v709.mjs';
import {RESOLUTION_EVENT710} from '../../../assets/quote-followup-resolution-v710.mjs';
import {FOLLOWUP_EVENT711} from '../../../assets/quote-followup-aging-v711.mjs';
import {ESCALATION_EVENT712,escalationReview712} from '../../../assets/quote-followup-escalation-v712.mjs';

const clean=value=>String(value??'').trim();
const manager=actor=>['admin','senior_detailer'].includes(clean(actor?.role_code));
const authorize=(request,env,body,bookingId)=>requireStaffAccess({request,env,body,
  capability:'manage_bookings',bookingId,allowLegacyAdminFallback:true});
async function rows(env,path){
  const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if(!r.ok)throw Error('Protected follow-up source unavailable.');
  const data=await r.json().catch(()=>null);
  if(!Array.isArray(data))throw Error('Invalid follow-up source readback.');
  return data;
}
async function detail(env,id){
  const state=await loadState708(env,id);
  if(!state)return null;
  const bookingId=state.source.booking?.id;
  const [events,quoteDates]=await Promise.all([
    isUuid(bookingId)?rows(env,`booking_events?select=${encodeURIComponent('id,created_at,event_type,actor_name,payload')}&booking_id=eq.${bookingId}&event_type=in.(${OUTCOME_EVENT709},${RESOLUTION_EVENT710},${FOLLOWUP_EVENT711},${ESCALATION_EVENT712})&order=created_at.desc,id.desc&limit=200`):[],
    rows(env,`quote_pipeline_items?select=id,next_follow_up_at&id=eq.${id}&limit=1`)
  ]);
  return {state,review:escalationReview712(state,events,quoteDates[0]?.next_follow_up_at||null)};
}
function publicDetail({state,review}){
  const f=review.followup;
  return {ok:true,quote_id:state.source.quote.id,booking_id:state.source.booking?.id||null,
    marker:f.resolution.marker,latest_outcome_event_id:f.resolution.latest_outcome_event_id,
    latest_resolution_event_id:f.resolution.latest_resolution_event_id,
    latest_assignment_event_id:f.assignment?.id||null,
    latest_consent_recheck_event_id:f.latest_check?.id||null,
    latest_escalation_event_id:review.latest?.id||null,
    due_at:review.due_at,overdue:review.overdue,overdue_days:review.overdue_days,
    assignment_current:f.assignment_current,recheck_current:f.recheck_current,
    assigned_staff_name:f.assigned?.payload.assigned_staff_name||null,
    escalation_active:review.escalation_active,owner_review_current:review.owner_review_current,
    audit_closed:review.audit_closed,latest_event_current:review.latest_event_current,
    can_escalate:review.can_escalate,can_review_owner:review.can_review_owner,
    can_close_audit:review.can_close_audit,can_reopen_audit:review.can_reopen_audit,
    consent_allowed:review.consent_allowed,needs_live_consent_recheck:review.needs_live_consent_recheck,
    history:review.history.slice(0,20).map(e=>({id:e.id,created_at:e.created_at,
      actor_name:e.actor_name,action:e.payload.action,note:e.payload.note})),
    staff_only:true,customer_contacted:false,sends_email:false,sends_sms:false,
    grants_consent:false,changes_booking:false};
}
export async function onRequestGet({request,env}){
  const id=new URL(request.url).searchParams.get('quote_id')||'';
  if(!isUuid(id))return json({ok:false,error:'Valid saved quote ID required.'},400);
  const access=await authorize(request,env,{});
  if(!access.ok)return access.response;
  try{const record=await detail(env,id);
    return record?json({...publicDetail(record),manager_review_allowed:manager(access.actor)}):
      json({ok:false,error:'Saved quote not found.'},404);
  }catch{return json({ok:false,error:'Live escalation audit unavailable; no closure can be assumed.'},503);}
}
export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>({}));
  const quoteId=clean(body.quote_id),bookingId=clean(body.booking_id),action=clean(body.action),note=clean(body.note);
  if(!isUuid(quoteId)||!isUuid(bookingId)||!['escalate','review_owner','close_audit','reopen_audit'].includes(action)||
    body.acknowledge_internal_review!==true||note.length<12||note.length>300||
    !body.expected_marker||typeof body.expected_marker!=='object'||Array.isArray(body.expected_marker)||
    !['expected_latest_outcome_event_id','expected_latest_resolution_event_id','expected_latest_assignment_event_id',
      'expected_latest_consent_recheck_event_id','expected_latest_escalation_event_id'].every(key=>Object.hasOwn(body,key)))
    return json({ok:false,error:'Saved quote, booking, note, action and fresh audit readback are required.'},400);
  if(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(note)||/\+?\d[\d().\-\s]{7,}\d/.test(note))
    return json({ok:false,error:'Remove customer contact details from the internal staff note.'},400);
  const access=await authorize(request,env,body,bookingId);
  if(!access.ok)return access.response;
  if(action!=='escalate'&&!manager(access.actor))
    return json({ok:false,error:'Only an admin or senior detailer may review ownership or close/reopen audits.'},403);
  try{
    const record=await detail(env,quoteId);
    if(!record||record.state.source.quote.booking_id!==bookingId||record.state.source.booking?.id!==bookingId)
      return json({ok:false,error:'The saved quote and booking no longer match.'},409);
    const r=record.review,f=r.followup,marker=f.resolution.marker;
    if(!Object.keys(marker).every(k=>body.expected_marker[k]===marker[k])||
      clean(body.expected_latest_outcome_event_id)!==clean(f.resolution.latest_outcome_event_id)||
      clean(body.expected_latest_resolution_event_id)!==clean(f.resolution.latest_resolution_event_id)||
      clean(body.expected_latest_assignment_event_id)!==clean(f.assignment?.id)||
      clean(body.expected_latest_consent_recheck_event_id)!==clean(f.latest_check?.id)||
      clean(body.expected_latest_escalation_event_id)!==clean(r.latest?.id))
      return json({ok:false,error:'Live source, consent or escalation history changed; refresh first.'},409);
    const allowed=action==='escalate'?r.can_escalate:action==='review_owner'?r.can_review_owner:
      action==='close_audit'?r.can_close_audit:r.can_reopen_audit;
    if(!allowed)return json({ok:false,error:'This escalation action is not eligible under the live assignment, consent and audit rules.'},409);
    const event={booking_id:bookingId,event_type:ESCALATION_EVENT712,
      actor_name:clean(access.actor?.full_name||access.actor?.email||'Authorized staff').slice(0,120),
      event_note:'Internal staff escalation/consent audit only. No message sent.',
      payload:{quote_id:quoteId,booking_id:bookingId,action,note,marker,
        assignment_event_id:f.assignment?.id||null,consent_recheck_event_id:f.latest_check?.id||null,
        outcome_event_id:f.resolution.latest_outcome_event_id,
        resolution_event_id:f.resolution.latest_resolution_event_id,
        previous_escalation_event_id:r.latest?.id||null,
        consent_allowed_at_review:r.consent_allowed,staff_only:true,
        customer_contacted:false,grants_consent:false,build:712}};
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{method:'POST',
      headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([event])});
    if(!res.ok)return json({ok:false,error:'Audit event save failed. No message sent.'},502);
    const saved=await res.json().catch(()=>null);
    if(!Array.isArray(saved)||!saved[0]?.id)
      return json({ok:false,error:'Audit readback failed. Inspect history before trying again.'},502);
    const refreshed=await detail(env,quoteId);
    return refreshed?json({...publicDetail(refreshed),recorded:true,recorded_event_id:saved[0].id}):
      json({ok:false,error:'Audit saved but source changed. Refresh manually.'},409);
  }catch{return json({ok:false,error:'Live escalation review unavailable. No message sent.'},503);}
}
