import { requireStaffAccess, json } from "../_lib/staff-auth.js";
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const templateKey = String(body?.template_key || '').trim();
    const channel = String(body?.channel || '').trim().toLowerCase();
    const variables = body?.variables && typeof body.variables === 'object' ? body.variables : {};
    if (!templateKey) return withCors(json({ error: 'Missing template_key' }, 400));
    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: 'application/json' };
    const tplRes = await fetch(`${env.SUPABASE_URL}/rest/v1/recovery_message_templates?select=*&template_key=eq.${encodeURIComponent(templateKey)}&limit=1`, { headers });
    if (!tplRes.ok) return withCors(json({ error: await tplRes.text() }, 500));
    const template = (await tplRes.json().catch(()=>[]))?.[0] || null;
    if (!template) return withCors(json({ error: 'Template not found.' }, 404));
    if (channel && template.channel !== channel) return withCors(json({ error: 'Channel does not match template.' }, 400));
    const rulesRes = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value&key=eq.recovery_provider_rules&limit=1`, { headers });
    let providerRules = {}; if (rulesRes.ok) providerRules = ((await rulesRes.json().catch(()=>[]))?.[0] || {}).value || {};
    const render = (input) => String(input || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => variables[key] == null ? '' : String(variables[key]));
    const channelRules = providerRules[template.channel] || {};
    return withCors(json({ ok: true, preview: { channel: template.channel, provider: template.provider, subject: render(template.subject_template || ''), body: render(template.body_template || ''), variables, rules: template.rules || {}, provider_rules: channelRules, allowed_providers: Array.isArray(channelRules.allowed_providers) ? channelRules.allowed_providers : [template.provider], previewed_by: access.actor.full_name || 'Staff' } }));
  } catch (err) { return withCors(json({ error: String(err) }, 500)); }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
