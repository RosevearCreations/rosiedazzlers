
import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestPost(context){
  const {request, env}=context;
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request, env, body, capability:"manage_staff", allowLegacyAdminFallback:true});
    if(!access.ok) return withCors(access.response);

    const customer_email=String(body.customer_email||"").trim().toLowerCase();
    const session_id=String(body.session_id||"").trim() || null;
    if(!customer_email) return withCors(json({error:"customer_email is required."},400));

    const payload=[{
      event_type:"abandoned_checkout_recovery",
      channel:"email",
      recipient_email:customer_email,
      subject:"Complete your Rosie Dazzlers booking",
      body_text:"We noticed you started a booking but did not complete checkout. Come back to finish your order when you're ready.",
      payload:{session_id, recovery_url: env.PUBLIC_SITE_URL ? `${env.PUBLIC_SITE_URL}/book` : "/book"},
      status:"queued",
      attempt_count:0,
      max_attempts:5,
      next_attempt_at:new Date().toISOString()
    }];

    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`,{
      method:"POST",
      headers:{...serviceHeaders(env), Prefer:"return=representation"},
      body:JSON.stringify(payload)
    });
    if(!res.ok) return withCors(json({error:`Could not queue recovery. ${await res.text()}`},500));
    const rows=await res.json().catch(()=>[]);
    return withCors(json({ok:true, queued:Array.isArray(rows)?rows.length:1, events:rows||[]}));
  }catch(err){return withCors(json({error:err?.message||"Unexpected server error."},500));}
}
export async function onRequestGet(){return withCors(methodNotAllowed());}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
