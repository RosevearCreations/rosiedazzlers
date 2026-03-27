import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_staff', allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=*&order=updated_at.desc&limit=500`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept:'application/json' }
    });
    if (!res.ok) return withCors(json({ error:`Could not load inventory alerts. ${await res.text()}` },500));
    const items = (await res.json().catch(() => []) || []).filter((item) =>
      String(item.reuse_policy || 'reorder') !== 'never_reuse' &&
      Number(item.qty_on_hand || 0) <= Number(item.reorder_point || 0)
    );
    return withCors(json({ ok:true, items:Array.isArray(items)?items:[], alerts:[] }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' },500));
  }
}
export async function onRequestGet(context){ return onRequestPost(context); }
export async function onRequestPut(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
