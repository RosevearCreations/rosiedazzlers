// Build 910: authenticated, read-only customer quote-to-booking readiness.
// Never makes a booking, a hold, a charge, a deletion, a message or a public media URL.
import {getCurrentCustomerSession,serviceHeaders} from '../_lib/customer-session.js';
import {UUID908,ownsBooking908} from '../_lib/customer-account-review-v908.js';
import {resolveCurrentQuotePrice} from '../_lib/quote-booking-authority.js';
import {evaluateQuoteReadiness910,mediaRetentionReceipt910} from '../_lib/quote-retention-readiness-v910.js';
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'Referrer-Policy':'no-referrer','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const denied=()=>response({ok:false,error:'Method not allowed'},405);
export const onRequestPost=denied,onRequestPut=denied,onRequestDelete=denied,onRequestOptions=denied;
async function sourceRows(env,path){
 const res=await fetch(String(env.SUPABASE_URL).replace(/\/+$/,'')+'/rest/v1/'+path,{
  headers:serviceHeaders(env),cache:'no-store'});
 if(!res.ok)throw Error('Original source readback unavailable');
 const rows=await res.json();if(!Array.isArray(rows))throw Error('Original source did not return rows');
 return rows;
}
export async function onRequestGet({request,env}){
 try{
  if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)
   return response({ok:false,error:'Original source not enrolled'},503);
  const url=new URL(request.url);
  if([...url.searchParams.keys()].join(',')!=='quote_id'||!UUID908.test(url.searchParams.get('quote_id')||''))
   return response({ok:false,error:'A single original quote ID is required'},400);
  const session=await getCurrentCustomerSession({request,env}),p=session?.customer_profile;
  if(!p?.is_active||!UUID908.test(String(p.id||''))||!p.email_verified_at)
   return response({ok:false,error:'A verified customer session is required'},401);
  const email=String(p.email||'').trim().toLowerCase(),quoteId=url.searchParams.get('quote_id');
  if(!email||email.length>254)return response({ok:false,error:'Verified account source unavailable'},401);
  const fields='id,title,customer_email,sent_at,status,acceptance_status,accepted_at,accepted_terms,accepted_terms_hash,structured_terms_hash,booking_id,lead_id';
  const [q]=await sourceRows(env,'quote_proposal_drafts?select='+fields+'&id=eq.'+quoteId+
   '&customer_email=eq.'+encodeURIComponent(email)+'&sent_at=not.is.null&limit=1');
  if(!q||q.id!==quoteId||String(q.customer_email||'').trim().toLowerCase()!==email)
   return response({ok:false,error:'Quote unavailable in this verified account'},404);
  const bookingFields='id,customer_profile_id,customer_email,source_quote_proposal_draft_id,status';
  const originalBookings=await sourceRows(env,'bookings?select='+bookingFields+
   '&source_quote_proposal_draft_id=eq.'+quoteId+'&limit=15');
  const existing=originalBookings.find(x=>ownsBooking908(x,p.id,email,true))||null;
  let currentPrice=null;
  if(!existing&&q.acceptance_status==='accepted'&&q.accepted_terms){
   const t=q.accepted_terms;
   currentPrice=await resolveCurrentQuotePrice(env,{
    package_code:t.package_code,vehicle_size:t.vehicle_size,addon_codes:t.addon_codes});
  }
  const readiness=await evaluateQuoteReadiness910(q,currentPrice,existing);
  const lead=UUID908.test(String(q.lead_id||''))?q.lead_id:null;
  const mediaFields='id,status,verified_at,linked_at,content_type,privacy_status,reviewed_at,upload_proof_hash';
  const media=lead?await sourceRows(env,'photo_estimate_uploads?select='+mediaFields+
   '&lead_id=eq.'+lead+'&status=eq.uploaded&verified_at=not.is.null&limit=150'):[];
  const retention=await mediaRetentionReceipt910(media,'quote',quoteId);
  return response({ok:true,quote_id:quoteId,readiness,retention,
   journey:{smart_booking_route:'/book-smart',manual_booking_route:'/book-custom',
    customer_account_route:'/my-account',desktop_verified:false,tablet_verified:false,mobile_verified:false,
    verification_state:'HOLD_ORIGINAL_DEVICE_ACCEPTANCE'},
   controls:{no_automatic_booking:true,no_automatic_deposit:true,no_automatic_message:true,
    no_public_media:true,no_retention_deletion:true,requires_current_booking_authority:true}});
 }catch{
  return response({ok:false,error:'Original source readiness is unavailable; no booking or retention action was performed'},503);
 }
}
