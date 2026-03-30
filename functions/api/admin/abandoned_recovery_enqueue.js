import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";
import { loadRecoverySettings } from "../_lib/app-settings.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestPost(context){
  const {request, env}=context;
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request, env, body, capability:"manage_staff", allowLegacyAdminFallback:false});
    if(!access.ok) return withCors(access.response);

    const customer_email=String(body.customer_email||"").trim().toLowerCase();
    const recipient_phone=String(body.recipient_phone||"").trim();
    const session_id=String(body.session_id||"").trim() || null;
    const page_events=Number(body.page_events||0);

    const recovery = await loadRecoverySettings(env);
    const rules = recovery.recovery_rules || {};
    const templates = recovery.recovery_templates || {};
    const providerRules = recovery.recovery_provider_rules || {};
    if (rules.abandoned_recovery_enabled === false) return withCors(json({error:"Abandoned recovery is disabled by settings."},403));

    let channel = String(body.channel || rules.default_recovery_channel || 'email').trim().toLowerCase();
    if (!['email','sms'].includes(channel)) channel = 'email';
    if (providerRules?.[channel]?.enabled === false) return withCors(json({ error: `${channel.toUpperCase()} recovery is disabled by provider rules.` }, 403));
    if (channel === 'email' && rules.require_email !== false && !customer_email) return withCors(json({error:"customer_email is required for email recovery."},400));
    if (channel === 'sms' && !recipient_phone) return withCors(json({error:"recipient_phone is required for SMS recovery."},400));
    if (page_events && Number.isFinite(page_events) && page_events < Number(rules.minimum_page_events || 0)) return withCors(json({error:"Session does not meet recovery rules."},400));
    const cooldownHours = Number(rules.cooldown_hours || 24);

    const payload=[{
      event_type:"abandoned_checkout_recovery",
      channel,
      recipient_email:channel==='email'?customer_email:null,
      recipient_phone:channel==='sms'?recipient_phone:null,
      subject:templates.abandoned_checkout_subject || "Complete your Rosie Dazzlers booking",
      body_text:templates.abandoned_checkout_body_text || "We noticed you started a booking but did not complete checkout. Come back to finish your order when you're ready.",
      body_html:templates.abandoned_checkout_body_html || null,
      payload:{session_id, recovery_url: env.PUBLIC_SITE_URL ? `${env.PUBLIC_SITE_URL}/book` : "/book", page_events},
      status:"queued",
      attempt_count:0,
      max_attempts:5,
      next_attempt_at:new Date(Date.now() + cooldownHours * 60 * 60 * 1000).toISOString()
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
