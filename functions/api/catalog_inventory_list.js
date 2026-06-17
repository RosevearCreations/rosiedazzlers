import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const itemType = (new URL(request.url).searchParams.get("item_type") || "").trim().toLowerCase();
    let path = `${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=*&order=updated_at.desc`;
    if (itemType && ["tool","consumable"].includes(itemType)) path += `&item_type=eq.${encodeURIComponent(itemType)}`;
    const res = await fetch(path, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: "application/json" } });
    if (!res.ok) return withCors(json({ error: await res.text() }, 500));
    const items = await res.json().catch(() => []);
    const arr = Array.isArray(items) ? items : [];
    return withCors(json({ ok: true, items: arr, low_stock: arr.filter((item) => String(item.reuse_policy || 'reorder') !== 'never_reuse' && Number(item.qty_on_hand || 0) <= Number(item.reorder_point || 0)) }));
  } catch (err) { return withCors(json({ error: String(err) }, 500)); }
}
export async function onRequestPost() { return withCors(methodNotAllowed()); }
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
