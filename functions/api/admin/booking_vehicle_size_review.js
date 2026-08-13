import { requireStaffAccess, serviceHeaders, json, isUuid, cleanText } from "../_lib/staff-auth.js";
import { dispatchNotificationThroughProvider } from "./_lib/provider-dispatch.js";

const SIZES=["small","mid","oversize"];
export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>({}));
  const access=await requireStaffAccess({request,env,body,capability:"manage_bookings",allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  const bookingId=cleanText(body.booking_id);
  if(!isUuid(bookingId))return json({ok:false,error:"Valid booking_id is required."},400);
  try{
    const booking=await loadBooking(env,bookingId);if(!booking)return json({ok:false,error:"Booking not found."},404);
    const action=cleanText(body.action||"verify");const now=new Date().toISOString();
    if(action==="verify"){
      const size=SIZES.includes(cleanText(body.reviewed_size))?cleanText(body.reviewed_size):cleanText(booking.vehicle_size);
      if(!SIZES.includes(size))return json({ok:false,error:"Choose a valid reviewed vehicle size."},400);
      const patch={vehicle_size:size,vehicle_size_reviewed_size:size,vehicle_size_review_status:"verified",vehicle_size_customer_response:"staff_verified",vehicle_size_reviewed_at:now,vehicle_size_customer_responded_at:now,vehicle_size_review_reason:cleanText(body.review_note).slice(0,500)||booking.vehicle_size_review_reason||null,vehicle_size_review_token_hash:null,vehicle_size_review_expires_at:null,updated_at:now};
      if(access.actor?.id&&isUuid(access.actor.id))patch.vehicle_size_reviewed_by=access.actor.id;
      const row=await patchBooking(env,bookingId,patch);await addEvent(env,bookingId,access,"vehicle_size_verified",`Vehicle size verified as ${size}.`,patch);return json({ok:true,row,message:"Vehicle size verified. No customer response is required."});
    }
    if(action!=="send_review")return json({ok:false,error:"Unknown vehicle-size review action."},400);
    const reviewedSize=cleanText(body.reviewed_size);if(!SIZES.includes(reviewedSize))return json({ok:false,error:"Choose small, mid, or oversize before sending a review."},400);
    const revised=Number(body.reviewed_price_cents);if(!Number.isFinite(revised)||revised<0)return json({ok:false,error:"Enter the revised booking total before sending the review."},400);
    const email=cleanEmail(booking.customer_email);if(!email)return json({ok:false,error:"The booking does not have a valid customer email."},400);
    const rawToken=makeToken();const tokenHash=await sha256Hex(rawToken);const expires=new Date(Date.now()+7*86400000).toISOString();const origin=new URL(request.url).origin;
    const url=`${origin}/vehicle-size-review?booking_id=${encodeURIComponent(bookingId)}&token=${encodeURIComponent(rawToken)}`;
    const oldSize=booking.vehicle_size_original||booking.vehicle_size||"selected size";const oldTotal=Number(booking.price_total_cents||0);const changed=reviewedSize!==booking.vehicle_size||revised!==oldTotal;
    if(!changed)return json({ok:false,error:"The reviewed size and total match the current booking. Use Verify as booked instead of sending a correction."},400);
    const note=cleanText(body.review_note).slice(0,500)||"Staff review found that the vehicle should be priced in a different size category.";
    const event={event_type:"vehicle_size_review",channel:"email",recipient_email:email,subject:"Please review your Rosie Dazzlers vehicle size and price",body_text:`Hi ${booking.customer_name||"there"},\n\nWe reviewed your upcoming detailing booking and the vehicle size needs confirmation.\n\nBooked size: ${oldSize}\nReviewed size: ${reviewedSize}\nOriginal booking total: ${money(oldTotal)}\nReviewed booking total: ${money(revised)}\n\n${note}\n\nPlease confirm the reviewed size/price or cancel the booking using this secure link:\n${url}\n\nThis link expires in 7 days. A cancellation does not automatically promise a refund; any paid deposit follows the booking/cancellation policy and office review.\n\nRosie Dazzlers Mobile Auto Detailing`,payload:{booking_id:bookingId,review_url:url,reviewed_size:reviewedSize,reviewed_price_cents:revised}};
    const dispatch=await dispatchNotificationThroughProvider(env,event,{});
    const patch={vehicle_size_reviewed_size:reviewedSize,vehicle_size_reviewed_price_cents:Math.round(revised),vehicle_size_review_status:"awaiting_customer",vehicle_size_reviewed_at:now,vehicle_size_review_reason:note,vehicle_size_review_token_hash:tokenHash,vehicle_size_review_expires_at:expires,vehicle_size_customer_response:null,vehicle_size_customer_responded_at:null,updated_at:now};if(access.actor?.id&&isUuid(access.actor.id))patch.vehicle_size_reviewed_by=access.actor.id;
    const row=await patchBooking(env,bookingId,patch);await addEvent(env,bookingId,access,"vehicle_size_customer_review_requested",`Review requested: ${oldSize} → ${reviewedSize}; revised total ${money(revised)}.`,{...patch,email_sent:dispatch.ok});
    return json({ok:true,row,email_sent:dispatch.ok,review_url:url,provider:dispatch.ok?dispatch.provider:null,warning:dispatch.ok?null:(dispatch.error||"Email provider is not configured; copy the review URL manually.")});
  }catch(err){return json({ok:false,error:err?.message||"Could not process vehicle-size review."},500)}
}
export async function onRequestOptions(){return new Response("",{status:204,headers:{"Cache-Control":"no-store"}})}
async function loadBooking(env,id){const fields="id,customer_name,customer_email,vehicle_size,vehicle_size_original,price_total_cents,vehicle_size_review_status,vehicle_size_review_reason";const r=await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=${encodeURIComponent(fields)}&id=eq.${encodeURIComponent(id)}&limit=1`,{headers:serviceHeaders(env)});const t=await r.text();if(!r.ok)throw new Error(t);const d=safe(t,[]);return Array.isArray(d)?d[0]||null:null}
async function patchBooking(env,id,patch){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{...serviceHeaders(env),Prefer:"return=representation"},body:JSON.stringify(patch)});const t=await r.text();if(!r.ok)throw new Error(t);const d=safe(t,[]);return Array.isArray(d)?d[0]||null:d}
async function addEvent(env,id,access,type,note,payload){await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{method:"POST",headers:{...serviceHeaders(env),Prefer:"return=minimal"},body:JSON.stringify([{booking_id:id,event_type:type,event_note:note,actor_name:access.actor?.full_name||access.actor?.email||"Staff",payload}])}).catch(()=>null)}
function makeToken(){const b=new Uint8Array(32);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("")}
async function sha256Hex(v){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(v||"")));return Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,"0")).join("")}
function cleanEmail(v){const x=cleanText(v).toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)?x:null}function money(c){return new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format((Number(c)||0)/100)}function safe(t,f){try{return JSON.parse(t)}catch{return f}}
