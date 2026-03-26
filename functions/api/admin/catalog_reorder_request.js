import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const item_key = String(body?.item_key || '').trim();
    if (!item_key) return withCors(json({ error: 'Missing item_key' }, 400));
    const itemRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=id,item_key,name,preferred_vendor,reorder_qty,cost_cents,amazon_url,reuse_policy&item_key=eq.${encodeURIComponent(item_key)}&limit=1`, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: 'application/json' } });
    if (!itemRes.ok) return withCors(json({ error: await itemRes.text() }, 500));
    const item = (await itemRes.json().catch(()=>[]))?.[0] || null;
    if (!item) return withCors(json({ error: 'Inventory item not found.' }, 404));
    if (String(item.reuse_policy || 'reorder') === 'never_reuse') return withCors(json({ error: 'This item is marked never reuse / no reorder.' }, 400));
    const po = { item_id: item.id, item_key: item.item_key, item_name: item.name, vendor_name: String(body?.vendor_name || item.preferred_vendor || '').trim() || null, qty_ordered: Number(body?.qty_ordered || item.reorder_qty || 1), unit_cost_cents: body?.unit_cost_cents == null ? item.cost_cents ?? null : Number(body.unit_cost_cents), status: String(body?.status || 'requested').trim(), reminder_at: body?.reminder_at || null, ordered_at: ['ordered','received'].includes(String(body?.status || '').trim()) ? new Date().toISOString() : null, purchase_url: String(body?.purchase_url || item.amazon_url || '').trim() || null, note: [String(body?.note || '').trim() || null, `Requested by ${access.actor.full_name || 'Staff'}`].filter(Boolean).join(' · ') };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_purchase_orders`, { method: 'POST', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify([po]) });
    if (!res.ok) return withCors(json({ error: await res.text() }, 500));
    return withCors(json({ ok: true, purchase_order: (await res.json().catch(()=>[]))?.[0] || null }));
  } catch (err) { return withCors(json({ error: String(err) }, 500)); }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
