import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { dispatchNotificationThroughProvider } from "../_lib/provider-dispatch.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_staff", allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const channel = normalizeChannel(body.channel || "email");
    const recipient = String(body.test_recipient || body.recipient || "").trim();
    const configured = channel === "sms" ? !!(env.NOTIFICATIONS_SMS_WEBHOOK_URL || env.RECOVERY_SMS_WEBHOOK_URL) : !!(env.NOTIFICATIONS_EMAIL_WEBHOOK_URL || env.RECOVERY_EMAIL_WEBHOOK_URL);
    if (!configured) return withCors(json({ ok:false, configured:false, channel, error:`${channel.toUpperCase()} provider webhook is not configured.` }, 409));
    if (body.configuration_only === true || !recipient) return withCors(json({ ok:true, configured:true, channel, message:"Provider webhook is configured. Add a test recipient to send a provider test." }));
    const event = {
      id: crypto.randomUUID(),
      event_type:"production_provider_test",
      channel,
      recipient_email: channel === "email" ? recipient : null,
      recipient_phone: channel === "sms" ? recipient : null,
      subject:"Rosie Dazzlers provider test",
      body_text:"This is a Rosie Dazzlers production-readiness test notification.",
      body_html:"<p>This is a Rosie Dazzlers production-readiness test notification.</p>",
      payload:{ source:"admin-production", sent_by:access.actor?.email || access.actor?.full_name || "staff", generated_at:new Date().toISOString() }
    };
    const result = await dispatchNotificationThroughProvider(env, event, { preview:true, previewRecipient:recipient });
    await logProviderTest(env, { channel, recipient, ok:result.ok, error:result.error || null, provider_response:result.provider_response || result.provider || null, staff_user_id:access.actor?.id || null }).catch(() => null);
    return withCors(json({ ok:result.ok, configured:true, channel, provider:result.provider || null, result }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || "Could not test notification provider." }, 500));
  }
}
async function logProviderTest(env, row){ if(!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)return; await fetch(`${env.SUPABASE_URL}/rest/v1/notification_provider_test_logs`, { method:"POST", headers:{ apikey:env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type":"application/json", Prefer:"return=minimal" }, body:JSON.stringify([{ ...row, created_at:new Date().toISOString() }]) }); }
function normalizeChannel(v){ const c=String(v||"email").toLowerCase(); return c === "sms" ? "sms" : "email"; }
function corsHeaders(){ return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"POST,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id", "Cache-Control":"no-store" }; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders()))h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
