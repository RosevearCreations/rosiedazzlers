import { requireStaffAccess, serviceHeaders, json, isUuid } from '../_lib/staff-auth.js';
import { bookingMatch706 } from '../../../assets/quote-booking-v706.mjs';

// Read-only staff verification of an existing booking against a saved accepted quote.
// This never creates or links a booking, sends a message, or processes payment.
const QUOTE_FIELDS = 'id,customer_name,status,accepted_amount_cents,booking_id';
const BOOKING_FIELDS = 'id,customer_name,status,job_status,service_date,start_slot,package_code,vehicle_size';

export async function onRequestGet({request,env}) {
  const url=new URL(request.url);
  const quoteId=String(url.searchParams.get('quote_id')||'').trim();
  const bookingId=String(url.searchParams.get('booking_id')||'').trim();
  if(!isUuid(quoteId)||!isUuid(bookingId))return json({ok:false,error:'Valid quote and booking IDs are required.'},400);

  const access=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',bookingId,allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try {
    const headers=serviceHeaders(env);
    const [quoteRes,bookingRes,otherLinkRes]=await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/quote_pipeline_items?select=${encodeURIComponent(QUOTE_FIELDS)}&id=eq.${encodeURIComponent(quoteId)}&limit=1`,{headers}),
      fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=${encodeURIComponent(BOOKING_FIELDS)}&id=eq.${encodeURIComponent(bookingId)}&limit=1`,{headers}),
      fetch(`${env.SUPABASE_URL}/rest/v1/quote_pipeline_items?select=id&booking_id=eq.${encodeURIComponent(bookingId)}&id=neq.${encodeURIComponent(quoteId)}&limit=1`,{headers})
    ]);
    if(!quoteRes.ok||!bookingRes.ok||!otherLinkRes.ok)
      return json({ok:false,error:'Booking verification could not read source records. No link was approved.'},502);
    const [quotes,bookings,otherLinks]=await Promise.all([
      quoteRes.json().catch(()=>null),bookingRes.json().catch(()=>null),otherLinkRes.json().catch(()=>null)
    ]);
    if(!Array.isArray(quotes)||!Array.isArray(bookings)||!Array.isArray(otherLinks))
      return json({ok:false,error:'Invalid booking verification source response.'},502);
    const quote=quotes[0],booking=bookings[0];
    if(!quote||!booking)return json({ok:false,error:'Saved quote or existing booking not found.'},404);
    if(otherLinks.length)return json({ok:false,error:'This booking is already linked to a different quote. Staff review required.'},409);
    if(quote.booking_id&&quote.booking_id!==bookingId)
      return json({ok:false,error:'The saved quote already links to a different booking. Resolve that link first.'},409);
    const match=bookingMatch706(quote,booking);
    if(!match.verified)return json({ok:false,error:match.reason},409);
    return json({ok:true,verified:true,booking,quote_id:quoteId,reason:match.reason,
      creates_booking:false,sends_confirmation:false,charges_customer:false,links_quote:false});
  }catch{return json({ok:false,error:'Booking verification temporarily unavailable. No changes made.'},503);}
}

export async function onRequestPost(){return json({ok:false,error:'Verification is read-only; use GET.'},405);}
