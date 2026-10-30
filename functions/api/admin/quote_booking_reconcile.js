import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {reconcileQuoteBooking707,CONFIRMATION_EVENT707} from '../../../assets/quote-reconciliation-v707.mjs';

const QUOTE_SELECT='id,quote_number,customer_name,status,accepted_amount_cents,booking_id,updated_at';
const BOOKING_SELECT='id,customer_name,status,job_status,service_date,start_slot,package_code,vehicle_size,updated_at';
const EVENT_SELECT='id,created_at,event_type,actor_name,event_note,payload';

async function readRows(env,path){
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if(!res.ok)throw new Error('Could not read the live quote, booking or staff history.');
  const rows=await res.json().catch(()=>null);
  if(!Array.isArray(rows))throw new Error('Invalid quote/booking history response.');
  return rows;
}

async function sourceState(env,quoteId){
  const quotes=await readRows(env,`quote_pipeline_items?select=${encodeURIComponent(QUOTE_SELECT)}&id=eq.${quoteId}&limit=1`);
  const quote=quotes[0]||null;
  if(!quote)return {missing:true};
  const bookingId=isUuid(quote.booking_id)?quote.booking_id:null;
  if(!bookingId)return {quote,booking:null,others:[],events:[]};
  const [bookings,others,events]=await Promise.all([
    readRows(env,`bookings?select=${encodeURIComponent(BOOKING_SELECT)}&id=eq.${bookingId}&limit=1`),
    readRows(env,`quote_pipeline_items?select=id&booking_id=eq.${bookingId}&id=neq.${quoteId}&limit=10`),
    readRows(env,`booking_events?select=${encodeURIComponent(EVENT_SELECT)}&booking_id=eq.${bookingId}&event_type=eq.${CONFIRMATION_EVENT707}&order=created_at.desc,id.desc&limit=50`)
  ]);
  return {quote,booking:bookings[0]||null,others,events};
}

const responseBody=(source,reconcile)=>({ok:true,quote_id:source.quote?.id,
  booking_id:source.quote?.booking_id||null,booking:source.booking&&{
    id:source.booking.id,status:source.booking.status,job_status:source.booking.job_status,
    service_date:source.booking.service_date,start_slot:source.booking.start_slot},
  matched:reconcile.matched,ready_to_record:reconcile.ready_to_record,
  notification_ready:reconcile.notification_ready,staff_confirmation_current:reconcile.current,
  issues:reconcile.issues,history:reconcile.history.map(event=>({
    id:event.id,created_at:event.created_at,actor_name:event.actor_name,
    current:event.id===reconcile.latest?.id&&reconcile.current
  })),
  sends_message:false,creates_booking:false,charges_customer:false});

export async function onRequestGet({request,env}){
  const quoteId=new URL(request.url).searchParams.get('quote_id')||'';
  if(!isUuid(quoteId))return json({ok:false,error:'Valid saved quote ID required.'},400);
  const access=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const source=await sourceState(env,quoteId);
    if(source.missing)return json({ok:false,error:'Quote was not found.'},404);
    return json(responseBody(source,reconcileQuoteBooking707(source.quote,source.booking,source.others,source.events)));
  }catch{return json({ok:false,error:'Reconciliation source temporarily unavailable. No readiness approved.'},503);}
}

export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>({}));
  const quoteId=String(body.quote_id||'').trim();
  const bookingId=String(body.booking_id||'').trim();
  if(!isUuid(quoteId)||!isUuid(bookingId)||body.confirm_actual_review!==true)
    return json({ok:false,error:'Saved quote, booking and explicit staff review acknowledgement required.'},400);
  const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',bookingId,allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const source=await sourceState(env,quoteId);
    if(source.missing||source.quote.booking_id!==bookingId)
      return json({ok:false,error:'Quote has no matching saved booking link.'},409);
    const review=reconcileQuoteBooking707(source.quote,source.booking,source.others,source.events);
    if(!review.ready_to_record)return json({ok:false,error:'Reconciliation failed. No staff confirmation recorded.',issues:review.issues},409);
    if(review.current)return json({...responseBody(source,review),already_current:true});
    const record={booking_id:bookingId,event_type:CONFIRMATION_EVENT707,
      actor_name:String(access.actor?.full_name||access.actor?.email||'Authorized staff').slice(0,120),
      event_note:'Staff reviewed existing confirmed booking against its accepted quote; no customer notification sent.',
      payload:{quote_id:quoteId,booking_id:bookingId,snapshot:review.snapshot,build:707,customer_notified:false}};
    const write=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{
      method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([record])});
    if(!write.ok)return json({ok:false,error:'Staff confirmation history could not be saved. No notification was sent.'},502);
    const saved=await write.json().catch(()=>[]);
    if(!Array.isArray(saved)||!saved[0]?.id)return json({ok:false,error:'Confirmation event readback failed; reconcile again before using a draft.'},502);
    // Read back live data; do not assert notification readiness from the write alone.
    const refreshed=await sourceState(env,quoteId);
    const refreshedReview=reconcileQuoteBooking707(refreshed.quote,refreshed.booking,refreshed.others,refreshed.events);
    return json({...responseBody(refreshed,refreshedReview),recorded:true,
      recorded_event_id:saved[0].id});
  }catch{return json({ok:false,error:'Could not complete live staff reconciliation. No notification was sent.'},503);}
}
