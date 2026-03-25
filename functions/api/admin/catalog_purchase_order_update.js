import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const id = String(body?.id || '').trim();
    if (!isUuid(id)) return withCors(json({ error: 'Invalid id.' }, 400));
    const status = String(body?.status || '').trim();
    if (!['draft','requested','ordered','received','cancelled'].includes(status)) return withCors(json({ error: 'Invalid status.' }, 400));
    const patch = { status, updated_at: new Date().toISOString(), note: String(body?.note || '').trim() || null };
    if (status === 'ordered' && !body?.ordered_at) patch.ordered_at = new Date().toISOString();
    if (status === 'received' && !body?.received_at) patch.received_at = new Date().toISOString();
    if (status === 'cancelled') patch.reminder_at = null;
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_purchase_orders?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(patch) });
    if (!res.ok) return withCors(json({ error: await res.text() }, 500));
    return withCors(json({ ok: true, purchase_order: (await res.json().catch(()=>[]))?.[0] || null, updated_by: access.actor.full_name || 'Staff' }));
  } catch (err) { return withCors(json({ error: String(err) }, 500)); }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
