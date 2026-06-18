import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";
import { queueCustomerLiveAlert } from "../_lib/live-interaction-alerts.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const bookingId = String(body.booking_id || "").trim();
    if (!isUuid(bookingId)) return withCors(json({ ok:false, error:"Valid booking_id is required." }, 400));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", bookingId, allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const headers = serviceHeaders(env);
    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_profile_id,customer_email,customer_name,job_status,status,detailing_completed_at&id=eq.${encodeURIComponent(bookingId)}&limit=1`,{headers});
    if(!bookingRes.ok)return withCors(json({ok:false,error:`Could not load booking. ${await bookingRes.text()}`},500));
    const booking=(await bookingRes.json().catch(()=>[]))?.[0]||null;
    if(!booking)return withCors(json({ok:false,error:"Booking not found."},404));

    const [incidents,payments,balances,summary] = await Promise.all([
      load(env,`incident_reports?select=id,status,decision_status,title&booking_id=eq.${encodeURIComponent(bookingId)}`),
      load(env,`quote_deposit_payment_requests?select=id,payment_status,paid_at&or=(booking_id.eq.${encodeURIComponent(bookingId)},confirmed_booking_id.eq.${encodeURIComponent(bookingId)})`),
      load(env,`final_balance_payment_requests?select=id,status,paid_at&booking_id=eq.${encodeURIComponent(bookingId)}`),
      load(env,`completed_job_summaries?select=id,status,customer_visible&booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`)
    ]);
    const blockers=[];
    if(!["completed","awaiting_payment","paid","closed"].includes(String(booking.job_status||booking.status||"").toLowerCase()))blockers.push("Job is not completed yet.");
    const unresolved=(incidents||[]).filter((r)=>!["resolved","closed","customer_visible"].includes(String(r.status||"").toLowerCase())&&!["resolved","no_fault","customer_resolved"].includes(String(r.decision_status||"").toLowerCase()));
    if(unresolved.length)blockers.push(`${unresolved.length} incident report(s) remain unresolved.`);
    const paid=(balances||[]).some((r)=>r.paid_at||/paid/i.test(String(r.status||"")))||(payments||[]).some((r)=>r.paid_at||/paid/i.test(String(r.payment_status||"")));
    if(!paid)blockers.push("Final payment is not recorded as paid.");
    if(!(summary||[])[0]?.customer_visible)blockers.push("Customer-visible completed-job summary is not ready.");

    const now=new Date().toISOString();
    const status=blockers.length?"blocked":"queued";
    const row={booking_id:bookingId,customer_id:booking.customer_profile_id||null,trigger_event:"completed_booking",status,channel:String(body.channel||"email"),send_after:blockers.length?null:(body.send_after||new Date(Date.now()+2*60*60*1000).toISOString()),review_url:String(body.review_url||env.GOOGLE_REVIEW_URL||""),reusable_as_public_proof:false,updated_at:now,created_at:now};
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/review_request_queue`,{method:"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify([row])});
    if(!res.ok)return withCors(json({ok:false,error:`Could not save review request. ${await res.text()}`},500));
    const saved=(await res.json().catch(()=>[]))?.[0]||row;
    await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`,{method:"PATCH",headers,body:JSON.stringify({review_request_blocked_reason:blockers.join(" ")||null})}).catch(()=>null);
    if(!blockers.length)await queueCustomerLiveAlert({env,bookingId,eventType:"review_request_queued",message:"Thank you for choosing Rosie Dazzlers. A review invitation will be sent after your completed service.",payload:{review_request_id:saved.id||null}}).catch(()=>null);
    return withCors(json({ok:true,status,blocked:blockers.length>0,blockers,request:saved}));
  }catch(err){return withCors(json({ok:false,error:err?.message||"Could not queue review request."},500));}
}
async function load(env,path){try{const res=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});return res.ok?await res.json().catch(()=>[]):[];}catch{return[];}}
export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
function corsHeaders(){return{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){const h=new Headers(response.headers||{});for(const[k,v]of Object.entries(corsHeaders()))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
