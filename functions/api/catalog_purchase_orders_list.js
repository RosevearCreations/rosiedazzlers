import { requireStaffAccess, json } from "../_lib/staff-auth.js";
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const url = new URL(request.url);
    const status = String(url.searchParams.get('status') || '').trim();
    let path = `${env.SUPABASE_URL}/rest/v1/catalog_purchase_orders?select=*&order=updated_at.desc.nullslast,created_at.desc`;
    if (status) path += `&status=eq.${encodeURIComponent(status)}`;
    const res = await fetch(path, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: 'application/json' } });
    if (!res.ok) return withCors(json({ error: await res.text() }, 500));
    const rows = await res.json().catch(()=>[]);
    const orders = Array.isArray(rows) ? rows : [];
    const now = Date.now();
    const due = orders.filter((row) => row.reminder_at && Date.parse(row.reminder_at) <= now && !['received','cancelled'].includes(String(row.status || '')));
    const overdue = due.filter((row) => !row.reminder_sent_at || Date.parse(row.reminder_sent_at) < Date.parse(row.reminder_at));
    return withCors(json({ ok: true, orders, reminder_due: due, reminder_overdue: overdue }));
  } catch (err) { return withCors(json({ error: String(err) }, 500)); }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
