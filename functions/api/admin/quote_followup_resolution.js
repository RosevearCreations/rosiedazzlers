import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {loadState708} from './quote_customer_handoff.js';
import {OUTCOME_EVENT709} from '../../../assets/quote-communication-outcome-v709.mjs';
import {resolutionReview710,RESOLUTION_EVENT710,RESOLUTION_REASONS710} from '../../../assets/quote-followup-resolution-v710.mjs';

const authorize=(request,env,body,bookingId)=>requireStaffAccess({request,env,body,
  capability:'manage_bookings',bookingId,allowLegacyAdminFallback:true});
const clean=value=>String(value??'').trim();
async function readHistory(env,bookingId){
  const select=encodeURIComponent('id,created_at,event_type,actor_name,payload');
  const types=`${OUTCOME_EVENT709},${RESOLUTION_EVENT710}`;
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?select=${select}&booking_id=eq.${bookingId}&event_type=in.(${types})&order=created_at.desc,id.desc&limit=100`,{
    headers:serviceHeaders(env)});
  if(!response.ok)throw new Error('Follow-up audit records unavailable.');
  const rows=await response.json().catch(()=>null);
  if(!Array.isArray(rows))throw new Error('Invalid follow-up audit history.');
  return rows;
}
async function currentReview(env,quoteId){
  const state=await loadState708(env,quoteId);
  if(!state)return null;
  const rows=isUuid(state.source.booking?.id)?await readHistory(env,state.source.booking.id):[];
  return {state,review:resolutionReview710(state,
    rows.filter(e=>e.event_type===OUTCOME_EVENT709),
    rows.filter(e=>e.event_type===RESOLUTION_EVENT710))};
}
function publicState(record){
  const {state,review}=record;
  return {ok:true,quote_id:state.source.quote.id,booking_id:state.source.booking?.id||null,
    marker:review.marker,latest_outcome_event_id:review.latest_outcome_event_id,
    latest_resolution_event_id:review.latest_resolution_event_id,
    closure_current:review.closure_current,requires_followup:review.requires_followup,
    can_close_no_contact:review.can_close_no_contact,
    can_close_opt_out:review.can_close_opt_out,
    can_close_reply:review.can_close_reply,can_reopen:review.can_reopen,
    current_consent_allowed:review.outcome.contact_permission_current,
    consent_alerts:review.alerts,consent_audit:review.consent_audit,
    latest_resolution:review.latest&&{id:review.latest.id,created_at:review.latest.created_at,
      action:review.latest.payload.action,reason:review.latest.payload.reason||null,
      actor_name:review.latest.actor_name,current:review.closure_current},
    history:review.history.slice(0,25).map(e=>({id:e.id,created_at:e.created_at,
      action:e.payload.action,reason:e.payload.reason||null,actor_name:e.actor_name,
      current:review.closure_current&&e.id===review.latest?.id})),
    audit_limit:100,prior_consent_is_inferred:false,provider_delivery_verified:false,
    sends_email:false,sends_sms:false,queues_notification:false,changes_booking:false};
}

export async function onRequestGet({request,env}){
  const quoteId=new URL(request.url).searchParams.get('quote_id')||'';
  if(!isUuid(quoteId))return json({ok:false,error:'Saved quote ID required.'},400);
  const access=await authorize(request,env,{});
  if(!access.ok)return access.response;
  try{
    const record=await currentReview(env,quoteId);
    return record?json(publicState(record)):json({ok:false,error:'Saved quote not found.'},404);
  }catch{return json({ok:false,error:'Current follow-up and consent audit unavailable. Closure blocked.'},503);}
}

export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>({}));
  const quoteId=clean(body.quote_id),bookingId=clean(body.booking_id),action=clean(body.action);
  const reason=clean(body.reason),note=clean(body.note);
  if(!isUuid(quoteId)||!isUuid(bookingId)||!['close','reopen'].includes(action)||
    (action==='close'&&!Object.hasOwn(RESOLUTION_REASONS710,reason))||
    (action==='reopen'&&reason)||body.acknowledge_staff_review!==true||
    !body.expected_marker||typeof body.expected_marker!=='object'||Array.isArray(body.expected_marker)||
    !Object.hasOwn(body,'expected_latest_outcome_event_id')||
    !Object.hasOwn(body,'expected_latest_resolution_event_id')||
    note.length<12||note.length>300||/[\r\n\x00-\x1f]/.test(note)||
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(note)||/(?:\+?\d[\d\s().-]{8,}\d)/.test(note))
    return json({ok:false,error:'Valid review, fresh audit markers and a 12–300 character non-contact-detail rationale required.'},400);
  const access=await authorize(request,env,body,bookingId);
  if(!access.ok)return access.response;
  try{
    const record=await currentReview(env,quoteId);
    if(!record||record.state.source.quote.booking_id!==bookingId||
      record.state.source.booking?.id!==bookingId)
      return json({ok:false,error:'Quote and booking no longer match.'},409);
    const review=record.review;
    if(!Object.keys(review.marker).every(key=>body.expected_marker[key]===review.marker[key])||
      clean(body.expected_latest_outcome_event_id)!==clean(review.latest_outcome_event_id)||
      clean(body.expected_latest_resolution_event_id)!==clean(review.latest_resolution_event_id))
      return json({ok:false,error:'Booking, permission or staff history changed. Refresh before deciding.'},409);
    if(action==='reopen'&&!review.can_reopen)
      return json({ok:false,error:'There is no current closed follow-up to reopen.'},409);
    if(action==='close'){
      if(review.closure_current)return json({...publicState(record),already_current:true});
      const allowed=reason==='no_contact_required'?review.can_close_no_contact:
        reason==='contact_not_permitted'?review.can_close_opt_out:review.can_close_reply;
      if(!allowed)return json({ok:false,error:'Closure reason is inconsistent with current consent or observed customer outcome.'},409);
    }
    const event={booking_id:bookingId,event_type:RESOLUTION_EVENT710,
      actor_name:clean(access.actor?.full_name||access.actor?.email||'Authorized staff').slice(0,120),
      event_note:'Staff-only follow-up review. No customer contact or delivery verification occurred.',
      payload:{quote_id:quoteId,booking_id:bookingId,action,
        reason:action==='close'?reason:null,note,marker:review.marker,
        outcome_event_id:review.latest_outcome_event_id,
        staff_review_only:true,provider_delivery_verified:false,
        customer_notified_by_this_action:false,build:710}};
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{
      method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},
      body:JSON.stringify([event])});
    if(!response.ok)return json({ok:false,error:'Follow-up review was not saved. No message sent.'},502);
    const rows=await response.json().catch(()=>null);
    if(!Array.isArray(rows)||!rows[0]?.id)
      return json({ok:false,error:'Closure readback failed. Check history before retrying.'},502);
    const refreshed=await currentReview(env,quoteId);
    if(!refreshed)return json({ok:false,error:'Review saved but source changed. Refresh history.'},409);
    return json({...publicState(refreshed),recorded:true,recorded_event_id:rows[0].id});
  }catch{return json({ok:false,error:'Current consent or staff follow-up source unavailable. Nothing sent.'},503);}
}
