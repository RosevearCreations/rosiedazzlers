import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadFeatureFlags } from "../_lib/app-settings.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_staff', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const flags = await loadFeatureFlags(env);
    if (flags.low_stock_alerts_enabled === false) return withCors(json({ error:'Low-stock alerts are disabled.' }, 403));

    const [itemsRes, alertsRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/catalog_items?select=id,catalog_type,title,category,brand,model,location_label,quantity_on_hand,reorder_level,supplier_url,last_reorder_requested_at,last_reorder_note,is_active&is_active=eq.true&order=catalog_type.asc,title.asc&limit=500`, { headers: serviceHeaders(env) }),
      fetch(`${env.SUPABASE_URL}/rest/v1/catalog_low_stock_alerts?select=id,catalog_item_id,status,quantity_snapshot,reorder_level_snapshot,created_at,last_notified_at,notes&status=in.(open,acknowledged)&order=created_at.desc&limit=200`, { headers: serviceHeaders(env) }).catch(() => null)
    ]);
    if (!itemsRes.ok) return withCors(json({ error:`Could not load low-stock items. ${await itemsRes.text()}` },500));
    const items = (await itemsRes.json().catch(() => []) || []).filter(item => Number(item.quantity_on_hand || 0) <= Number(item.reorder_level || 0));
    const alerts = alertsRes && alertsRes.ok ? await alertsRes.json().catch(() => []) : [];
    return withCors(json({ ok:true, items:Array.isArray(items)?items:[], alerts:Array.isArray(alerts)?alerts:[] }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' },500));
  }
}
export async function onRequestGet(context){ return onRequestPost(context); }
export async function onRequestPut(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
