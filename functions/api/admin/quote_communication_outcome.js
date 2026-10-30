import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {loadState708} from './quote_customer_handoff.js';
import {outcomeReview709,OUTCOME_EVENT709,OUTCOME_STATUSES709,CONTACT_ATTEMPT_STATUSES709} from '../../../assets/quote-communication-outcome-v709.mjs';

const readOutcomes=async(env,bookingId)=>{
  const select=encodeURIComponent('id,created_at,event_type,actor_name,payload');
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?select=${select}&booking_id=eq.${bookingId}&event_type=eq.${OUTCOME_EVENT709}&order=created_at.desc,id.desc&limit=50`,{
    headers:serviceHeaders(env)});
  if(!response.ok)throw new Error('Manual communication audit history could not be read.');
  const rows=await response.json().catch(()=>null);
  if(!Array.isArray(rows))throw new Error('Invalid staff communication history.');
  return rows;
};
async function getReview(env,quoteId){
  const state=await loadState708(env,quoteId);
  if(!state)return null;
  const events=isUuid(state.source.booking?.id)?await readOutcomes(env,state.source.booking.id):[];
  return {state,review:outcomeReview709(state,events)};
}
function publicState(record){
  const {state,review}=record;
  return {ok:true,quote_id:state.source.quote.id,booking_id:state.source.booking?.id||null,
    quote_updated_at:state.source.quote?.updated_at||null,marker:review.marker,
    consent_alerts:review.consent_alerts,requires_followup:review.requires_followup,
    can_record_followup:review.can_record_followup,
    can_record_contact_outcome:review.can_record_contact_outcome,
    contact_permission_current:review.contact_permission_current,
    handoff_event_id:review.handoff_event_id,
    latest_current:review.latest_current,
    latest_outcome:review.latest&&{id:review.latest.id,created_at:review.latest.created_at,
      status:review.latest.payload.status,actor_name:review.latest.actor_name},
    history:review.history.map(e=>({id:e.id,created_at:e.created_at,
      status:e.payload.status,actor_name:e.actor_name,
      current:review.latest_current&&e.id===review.latest?.id})),
    provider_delivery_verified:false,staff_report_is_delivery_proof:false,
    sends_email:false,sends_sms:false,queues_notification:false};
}
const authorize=(request,env,body,bookingId)=>requireStaffAccess({request,env,body,
  capability:'manage_bookings',bookingId,allowLegacyAdminFallback:true});

export async function onRequestGet({request,env}){
  const id=new URL(request.url).searchParams.get('quote_id')||'';
  if(!isUuid(id))return json({ok:false,error:'Saved quote ID required.'},400);
  const access=await authorize(request,env,{});
  if(!access.ok)return access.response;
  try{
    const record=await getReview(env,id);
    return record?json(publicState(record)):json({ok:false,error:'Saved quote not found.'},404);
  }catch{return json({ok:false,error:'Current communication and consent source unavailable. All actions blocked.'},503);}
}
export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>({}));
  const quoteId=String(body.quote_id||''),bookingId=String(body.booking_id||'');
  const status=String(body.status||'');
  if(!isUuid(quoteId)||!isUuid(bookingId)||!Object.hasOwn(OUTCOME_STATUSES709,status)||
    body.acknowledge_staff_report!==true||!body.expected_marker||
    typeof body.expected_marker!=='object'||Array.isArray(body.expected_marker))
    return json({ok:false,error:'Saved quote, booking, selected outcome, fresh source marker and staff acknowledgement required.'},400);
  const access=await authorize(request,env,body,bookingId);
  if(!access.ok)return access.response;
  try{
    const record=await getReview(env,quoteId);
    if(!record||record.state.source.quote.booking_id!==bookingId||record.state.source.booking?.id!==bookingId)
      return json({ok:false,error:'Quote and booking no longer match.'},409);
    const review=record.review;
    if(!Object.keys(review.marker).every(key=>body.expected_marker[key]===review.marker[key]))
      return json({ok:false,error:'Live quote, booking or consent changed. Refresh the review.'},409);
    if(!review.can_record_followup)return json({ok:false,error:'Linked booking cannot be audited safely.'},409);
    const reportsContact=CONTACT_ATTEMPT_STATUSES709.includes(status);
    if(reportsContact && (!review.can_record_contact_outcome ||
      body.expected_handoff_event_id!==review.handoff_event_id))
      return json({ok:false,error:'Current consent and staff handoff must be verified before reporting a contact attempt.'},409);
    if(review.latest_current && review.latest?.payload?.status===status)
      return json({...publicState(record),already_current:true});
    const event={booking_id:bookingId,event_type:OUTCOME_EVENT709,
      actor_name:String(access.actor?.full_name||access.actor?.email||'Authorized staff').slice(0,120),
      event_note:`Staff-only communication outcome: ${OUTCOME_STATUSES709[status]}. No provider delivery evidence recorded.`,
      payload:{quote_id:quoteId,booking_id:bookingId,status,marker:review.marker,
        handoff_event_id:reportsContact?review.handoff_event_id:null,
        staff_report_unverified:true,provider_delivery_verified:false,
        customer_notified_by_this_action:false,build:709}};
    const saved=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{
      method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},
      body:JSON.stringify([event])});
    if(!saved.ok)return json({ok:false,error:'Staff communication record was not saved; no message sent.'},502);
    const rows=await saved.json().catch(()=>[]);
    if(!Array.isArray(rows)||!rows[0]?.id)
      return json({ok:false,error:'Outcome readback failed. Check history before retrying.'},502);
    const refreshed=await getReview(env,quoteId);
    if(!refreshed)return json({ok:false,error:'Source changed after record. Refresh manually.'},409);
    return json({...publicState(refreshed),recorded:true,recorded_event_id:rows[0].id});
  }catch{return json({ok:false,error:'Could not complete live consent and staff audit review. No message sent.'},503);}
}
