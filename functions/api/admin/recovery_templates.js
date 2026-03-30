import { requireStaffAccess, json } from "../_lib/staff-auth.js";
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/recovery_message_templates?select=*&order=channel.asc,template_key.asc`, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: 'application/json' } });
    if (!res.ok) return withCors(json({ error: await res.text() }, 500));
    return withCors(json({ ok: true, templates: await res.json().catch(()=>[]) }));
  } catch (err) { return withCors(json({ error: String(err) }, 500)); }
}
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const payload = { template_key: String(body?.template_key || '').trim(), channel: String(body?.channel || '').trim().toLowerCase(), provider: String(body?.provider || 'manual').trim(), is_active: body?.is_active !== false, subject_template: String(body?.subject_template || '').trim() || null, body_template: String(body?.body_template || '').trim(), variables: Array.isArray(body?.variables) ? body.variables : [], rules: body?.rules && typeof body.rules === 'object' ? body.rules : {}, notes: String(body?.notes || '').trim() || null, updated_at: new Date().toISOString() };
    if (!payload.template_key || !['email','sms'].includes(payload.channel) || !payload.body_template) return withCors(json({ error: 'Missing required fields.' }, 400));
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/recovery_message_templates?on_conflict=template_key`, { method: 'POST', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([payload]) });
    if (!res.ok) return withCors(json({ error: await res.text() }, 500));
    return withCors(json({ ok: true, template: (await res.json().catch(()=>[]))?.[0] || null, updated_by: access.actor.full_name || 'Staff' }));
  } catch (err) { return withCors(json({ error: String(err) }, 500)); }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
