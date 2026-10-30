import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {loadState708} from './quote_customer_handoff.js';
import {OUTCOME_EVENT709} from '../../../assets/quote-communication-outcome-v709.mjs';
import {RESOLUTION_EVENT710} from '../../../assets/quote-followup-resolution-v710.mjs';
import {FOLLOWUP_EVENT711,agingQueue711,followupReview711} from '../../../assets/quote-followup-aging-v711.mjs';

const clean=v=>String(v??'').trim();
const authorize=(request,env,body,bookingId)=>requireStaffAccess({request,env,body,
  capability:'manage_bookings',bookingId,allowLegacyAdminFallback:true});
async function rows(env,path){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if(!response.ok)throw Error('Current follow-up queue source unavailable.');
  const data=await response.json().catch(()=>null);
  if(!Array.isArray(data))throw Error('Invalid follow-up source.');
  return data;
}
const select=encodeURIComponent('id,created_at,event_type,actor_name,payload');
async function detail(env,id){
  const state=await loadState708(env,id);
  if(!state)return null;
  const bookingId=state.source.booking?.id;
  const types=`${OUTCOME_EVENT709},${RESOLUTION_EVENT710},${FOLLOWUP_EVENT711}`;
  const events=isUuid(bookingId)?await rows(env,
    `booking_events?select=${select}&booking_id=eq.${bookingId}&event_type=in.(${types})&order=created_at.desc,id.desc&limit=150`):[];
  return {state,review:followupReview711(state,events)};
}
function publicDetail({state,review}){
  const r=review.resolution;
  return {ok:true,quote_id:state.source.quote.id,booking_id:state.source.booking?.id||null,
    marker:r.marker,latest_outcome_event_id:r.latest_outcome_event_id,
    latest_resolution_event_id:r.latest_resolution_event_id,
    latest_assignment_event_id:review.assignment?.id||null,
    assigned_staff_user_id:review.assigned?.payload.assigned_staff_user_id||null,
    assigned_staff_name:review.assigned?.payload.assigned_staff_name||null,
    assignment_current:review.assignment_current,
    recheck_current:review.recheck_current,needs_consent_recheck:review.needs_consent_recheck,
    can_assign:review.can_assign,can_unassign:review.can_unassign,can_recheck:review.can_recheck,
    current_consent_allowed:review.current_consent_allowed,closure_current:r.closure_current,
    consent_alerts:r.alerts,
    latest_consent_recheck:review.latest_check&&{id:review.latest_check.id,
      created_at:review.latest_check.created_at,actor_name:review.latest_check.actor_name,
      consent_allowed_at_review:review.latest_check.payload.consent_allowed_at_review},
    history:review.history.slice(0,20).map(e=>({id:e.id,created_at:e.created_at,
      action:e.payload.action,actor_name:e.actor_name,
      assigned_staff_name:e.payload.assigned_staff_name||null})),
    sends_email:false,sends_sms:false,changes_booking:false,provider_delivery_verified:false};
}
export async function onRequestGet({request,env}){
  const id=new URL(request.url).searchParams.get('quote_id')||'';
  if(id&&!isUuid(id))return json({ok:false,error:'Valid quote ID required.'},400);
  const access=await authorize(request,env,{});
  if(!access.ok)return access.response;
  try{
    if(id){const record=await detail(env,id);
      return record?json(publicDetail(record)):json({ok:false,error:'Saved quote not found.'},404);}
    // Oldest actionable due dates first; closed rows must not crowd out overdue work.
    const quotes=await rows(env,`quote_pipeline_items?select=${encodeURIComponent('id,booking_id,quote_number,status,next_follow_up_at,created_at,updated_at')}&status=not.in.(declined,expired)&order=next_follow_up_at.asc.nullslast,updated_at.asc&limit=150`);
    const assignments=await rows(env,`booking_events?select=${select}&event_type=eq.${FOLLOWUP_EVENT711}&order=created_at.desc,id.desc&limit=500`);
    const queue=agingQueue711(quotes,assignments);
    return json({ok:true,...queue,quote_limit:150,event_limit:500,
      historical_records_may_be_truncated:quotes.length===150||assignments.length===500,
      live_consent_verified:false,requires_selected_live_recheck:true});
  }catch{return json({ok:false,error:'Follow-up queue unavailable; no consent status or assignment can be assumed.'},503);}
}
export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>({}));
  const quoteId=clean(body.quote_id),bookingId=clean(body.booking_id),action=clean(body.action);
  if(!isUuid(quoteId)||!isUuid(bookingId)||!['assign','unassign','recheck_consent'].includes(action)||
    body.acknowledge_staff_action!==true||!body.expected_marker||
    typeof body.expected_marker!=='object'||Array.isArray(body.expected_marker)||
    !Object.hasOwn(body,'expected_latest_assignment_event_id')||
    !Object.hasOwn(body,'expected_latest_resolution_event_id')||
    !Object.hasOwn(body,'expected_latest_outcome_event_id')||
    (action==='assign'&&!isUuid(body.assigned_staff_user_id)))
    return json({ok:false,error:'Valid saved quote, booking, action and fresh staff review markers required.'},400);
  const access=await authorize(request,env,body,bookingId);
  if(!access.ok)return access.response;
  try{
    const record=await detail(env,quoteId);
    if(!record||record.state.source.quote.booking_id!==bookingId||record.state.source.booking?.id!==bookingId)
      return json({ok:false,error:'Quote and booking no longer match.'},409);
    const r=record.review,marker=r.resolution.marker;
    if(!Object.keys(marker).every(k=>body.expected_marker[k]===marker[k])||
      clean(body.expected_latest_assignment_event_id)!==clean(r.assignment?.id)||
      clean(body.expected_latest_resolution_event_id)!==clean(r.resolution.latest_resolution_event_id)||
      clean(body.expected_latest_outcome_event_id)!==clean(r.resolution.latest_outcome_event_id))
      return json({ok:false,error:'Live quote, booking, consent or staff assignment changed; refresh.'},409);
    if(!r.can_assign)return json({ok:false,error:'Closed or unlinked cases cannot receive follow-up assignments.'},409);
    let target=null;
    if(action==='assign'){
      const people=await rows(env,`staff_users?select=${encodeURIComponent('id,full_name,role_code,is_active,can_manage_bookings')}&id=eq.${body.assigned_staff_user_id}&is_active=eq.true&limit=1`);
      target=people[0];
      if(!target||!['admin','senior_detailer','detailer'].includes(target.role_code)||
        (target.role_code!=='admin'&&target.can_manage_bookings!==true))
        return json({ok:false,error:'Select an active staff member authorized for booking follow-up.'},409);
      if(r.assignment_current&&r.assigned?.payload.assigned_staff_user_id===target.id)
        return json({...publicDetail(record),already_current:true});
    }else if(action==='unassign'){
      if(!r.can_unassign)return json({...publicDetail(record),already_current:true});
    }else{
      if(!r.can_recheck)return json({ok:false,error:'Assign a current authorized staff owner before recording consent recheck.'},409);
      if(r.recheck_current)return json({...publicDetail(record),already_current:true});
    }
    const event={booking_id:bookingId,event_type:FOLLOWUP_EVENT711,
      actor_name:clean(access.actor?.full_name||access.actor?.email||'Authorized staff').slice(0,120),
      event_note:'Staff-only assignment/consent check. No customer contacted or provider delivery verified.',
      payload:{quote_id:quoteId,booking_id:bookingId,action,marker,
        assigned_staff_user_id:action==='assign'?target.id:null,
        assigned_staff_name:action==='assign'?clean(target.full_name).slice(0,120):null,
        assignment_event_id:action==='recheck_consent'?r.assignment?.id:null,
        outcome_event_id:r.resolution.latest_outcome_event_id,
        resolution_event_id:r.resolution.latest_resolution_event_id,
        consent_allowed_at_review:action==='recheck_consent'?r.current_consent_allowed:null,
        live_profile_reviewed:action==='recheck_consent',staff_only:true,
        customer_notified_by_this_action:false,provider_delivery_verified:false,build:711}};
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{
      method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},
      body:JSON.stringify([event])});
    if(!response.ok)return json({ok:false,error:'Staff event was not saved. No message sent.'},502);
    const inserted=await response.json().catch(()=>null);
    if(!Array.isArray(inserted)||!inserted[0]?.id)
      return json({ok:false,error:'Assignment readback failed. Review history before retrying.'},502);
    const refreshed=await detail(env,quoteId);
    if(!refreshed)return json({ok:false,error:'Staff event saved; source changed. Refresh manually.'},409);
    return json({...publicDetail(refreshed),recorded:true,recorded_event_id:inserted[0].id});
  }catch{return json({ok:false,error:'Current follow-up source unavailable. No message sent.'},503);}
}
