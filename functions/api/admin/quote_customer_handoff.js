import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {sourceState} from './quote_booking_reconcile.js';
import {reconcileQuoteBooking707} from '../../../assets/quote-reconciliation-v707.mjs';
import {handoffReview708,HANDOFF_EVENT708,CHANGE_FOLLOWUP_EVENT708} from '../../../assets/quote-customer-handoff-v708.mjs';

async function readRows(env,path){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if(!response.ok)throw new Error('Could not read current customer permission or staff handoff history.');
  const rows=await response.json().catch(()=>null);
  if(!Array.isArray(rows))throw new Error('Invalid customer permission source response.');
  return rows;
}
async function loadState(env,quoteId){
  const source=await sourceState(env,quoteId);
  if(source.missing) return null;
  const reconcile=reconcileQuoteBooking707(source.quote,source.booking,source.others,source.events);
  const profileId=source.booking?.customer_profile_id;
  let profile=null;
  if(isUuid(profileId)) {
    const profiles=await readRows(env,`customer_profiles?select=${encodeURIComponent('id,email,phone,sms_phone,notification_opt_in,notification_channel,is_active,archived_at,updated_at')}&id=eq.${profileId}&limit=1`);
    profile=profiles[0]||null;
  }
  const bookingId=source.booking?.id;
  const events=isUuid(bookingId)?await readRows(env,
    `booking_events?select=${encodeURIComponent('id,created_at,event_type,actor_name,payload')}&booking_id=eq.${bookingId}&event_type=in.(${HANDOFF_EVENT708},${CHANGE_FOLLOWUP_EVENT708})&order=created_at.desc,id.desc&limit=50`):[];
  const review=handoffReview708(source,reconcile,profile,events);
  return {source,reconcile,review};
}
function publicState(state){
  const {source,review}=state;
  return {ok:true,quote_id:source.quote?.id,booking_id:source.booking?.id||null,
    quote_updated_at:source.quote?.updated_at||null,booking_updated_at:source.booking?.updated_at||null,
    channel:review.consent.channel,consent_allowed:review.consent.allowed,
    consent_source:review.consent.source,explicit_opt_in:review.consent.explicit_opt_in,
    inferred_consent:false,ready_to_prepare:review.ready_to_prepare,
    ready_to_copy:review.ready_to_copy,handoff_current:review.handoff_current,
    change_followup_needed:review.change_followup_needed,
    change_followup_recorded:review.change_followup_recorded,issues:review.issues,
    handoff_history:review.handoffs.map(e=>({id:e.id,created_at:e.created_at,actor_name:e.actor_name})),
    followup_history:review.followups.map(e=>({id:e.id,created_at:e.created_at,actor_name:e.actor_name})),
    sends_email:false,sends_sms:false,queues_notification:false,creates_booking:false};
}
function authorization(request,env,body,bookingId){
  return requireStaffAccess({request,env,body,capability:'manage_bookings',bookingId,allowLegacyAdminFallback:true});
}
export async function onRequestGet({request,env}){
  const quoteId=new URL(request.url).searchParams.get('quote_id')||'';
  if(!isUuid(quoteId))return json({ok:false,error:'Valid saved quote ID required.'},400);
  const access=await authorization(request,env,{});
  if(!access.ok)return access.response;
  try{
    const state=await loadState(env,quoteId);
    return state?json(publicState(state)):json({ok:false,error:'Saved quote not found.'},404);
  }catch{return json({ok:false,error:'Live customer permission review unavailable. Handoff blocked.'},503);}
}

export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>({}));
  const quoteId=String(body.quote_id||'').trim();
  const bookingId=String(body.booking_id||'').trim();
  const action=String(body.action||'');
  if(!isUuid(quoteId)||!isUuid(bookingId)||body.acknowledge_actual_staff_action!==true ||
     !['prepare_handoff','log_change_followup'].includes(action))
    return json({ok:false,error:'Valid saved quote, booking, action and actual staff acknowledgement required.'},400);
  const access=await authorization(request,env,body,bookingId);
  if(!access.ok)return access.response;
  try{
    const state=await loadState(env,quoteId);
    if(!state||state.source.quote?.booking_id!==bookingId || state.source.booking?.id!==bookingId)
      return json({ok:false,error:'Saved quote and live linked booking do not match.'},409);
    const review=state.review;
    if(action==='prepare_handoff'&&!review.ready_to_prepare)
      return json({ok:false,error:'Live staff confirmation or customer consent is missing. Handoff blocked.',issues:review.issues},409);
    if(action==='log_change_followup'&&!review.change_followup_needed&&!review.change_followup_recorded)
      return json({ok:false,error:'No changed booking requires this follow-up record.'},409);
    const current=action==='prepare_handoff'?review.handoff_current:review.change_followup_recorded;
    if(current)return json({...publicState(state),already_current:true});
    const event_type=action==='prepare_handoff'?HANDOFF_EVENT708:CHANGE_FOLLOWUP_EVENT708;
    const payload=action==='prepare_handoff' ?
      {quote_id:quoteId,booking_id:bookingId,marker:review.marker,customer_notified:false,build:708} :
      {quote_id:quoteId,booking_id:bookingId,marker:review.followupMarker,
        requires_new_staff_confirmation:true,customer_notified:false,build:708};
    const event={booking_id:bookingId,event_type,
      actor_name:String(access.actor?.full_name||access.actor?.email||'Authorized staff').slice(0,120),
      event_note:action==='prepare_handoff'?'Staff prepared a manual confirmation handoff. No customer contact occurred.':
        'Staff logged quote/booking change follow-up for private review. No customer contact occurred.',payload};
    const savedRes=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{
      method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([event])});
    if(!savedRes.ok)return json({ok:false,error:'Staff handoff history could not be saved. No message sent.'},502);
    const saved=await savedRes.json().catch(()=>[]);
    if(!Array.isArray(saved)||!saved[0]?.id)
      return json({ok:false,error:'Staff event readback failed. Recheck before using a draft.'},502);
    const refreshed=await loadState(env,quoteId);
    return json({...publicState(refreshed),recorded:true,recorded_event_id:saved[0].id});
  }catch{return json({ok:false,error:'Could not complete current staff handoff review. No message sent.'},503);}
}
