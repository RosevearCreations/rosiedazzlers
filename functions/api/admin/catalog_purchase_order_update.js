import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const id = String(body?.id || '').trim();
    if (!isUuid(id)) return withCors(json({ error: 'Invalid id.' }, 400));
    const status = String(body?.status || '').trim();
    if (!['draft','requested','ordered','received','cancelled'].includes(status)) return withCors(json({ error: 'Invalid status.' }, 400));
    const baseHeaders = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: 'application/json' };
    const currentRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_purchase_orders?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: baseHeaders });
    if (!currentRes.ok) return withCors(json({ error: await currentRes.text() }, 500));
    const current = (await currentRes.json().catch(()=>[]))?.[0] || null;
    if (!current) return withCors(json({ error: 'Purchase order not found.' }, 404));
    const patch = { status, updated_at: new Date().toISOString(), note: String(body?.note || '').trim() || current.note || null };
    if (status === 'ordered' && !current.ordered_at) patch.ordered_at = new Date().toISOString();
    if (status === 'received' && !current.received_at) patch.received_at = new Date().toISOString();
    if (status === 'cancelled') patch.reminder_at = null;
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_purchase_orders?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { ...baseHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(patch) });
    if (!res.ok) return withCors(json({ error: await res.text() }, 500));
    const updated = (await res.json().catch(()=>[]))?.[0] || null;
    let inventory_updated = false;
    if (status === 'received' && current.item_key) {
      const itemRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=id,qty_on_hand&item_key=eq.${encodeURIComponent(current.item_key)}&limit=1`, { headers: baseHeaders });
      const item = itemRes.ok ? ((await itemRes.json().catch(()=>[]))?.[0] || null) : null;
      if (item) {
        const nextQty = Number(item.qty_on_hand || 0) + Number(updated?.qty_ordered ?? current.qty_ordered ?? 0);
        await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?id=eq.${encodeURIComponent(item.id)}`, { method: 'PATCH', headers: { ...baseHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ qty_on_hand: nextQty, updated_at: new Date().toISOString() }) });
        await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_low_stock_alerts?item_id=eq.${encodeURIComponent(item.id)}&is_resolved=eq.false`, { method: 'PATCH', headers: { ...baseHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by_name: access.actor.full_name || access.actor.email || 'Staff', resolution_notes: 'Resolved automatically when purchase order was received.' }) });
        inventory_updated = true;
      }
    }
    return withCors(json({ ok: true, purchase_order: updated, updated_by: access.actor.full_name || 'Staff', inventory_updated }));
  } catch (err) { return withCors(json({ error: String(err) }, 500)); }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
