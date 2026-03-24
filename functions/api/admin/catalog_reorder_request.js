import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_staff', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);

    const catalog_item_id = String(body.catalog_item_id || '').trim();
    const action = String(body.action || 'request').trim().toLowerCase();
    const notes = String(body.notes || '').trim() || null;
    if (!catalog_item_id || !isUuid(catalog_item_id)) return withCors(json({ error:'Valid catalog_item_id is required.' },400));

    if (action === 'resolve') {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_low_stock_alerts?catalog_item_id=eq.${encodeURIComponent(catalog_item_id)}&status=in.(open,acknowledged)`, {
        method:'PATCH',
        headers:{ ...serviceHeaders(env), Prefer:'return=representation' },
        body: JSON.stringify({ status:'resolved', resolved_at:new Date().toISOString(), resolved_by_name: access.actor?.full_name || access.actor?.email || 'Staff', resolution_notes: notes })
      });
      if (!res.ok) return withCors(json({ error:`Could not resolve alert. ${await res.text()}` },500));
      const rows = await res.json().catch(() => []);
      return withCors(json({ ok:true, alerts: rows }));
    }

    const itemRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_items?select=id,title,quantity_on_hand,reorder_level,last_reorder_requested_at,last_reorder_note&id=eq.${encodeURIComponent(catalog_item_id)}&limit=1`, { headers: serviceHeaders(env) });
    if (!itemRes.ok) return withCors(json({ error:`Could not load catalog item. ${await itemRes.text()}` },500));
    const itemRows = await itemRes.json().catch(() => []);
    const item = Array.isArray(itemRows) ? itemRows[0] || null : null;
    if (!item) return withCors(json({ error:'Catalog item not found.' },404));

    const alertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_low_stock_alerts`, {
      method:'POST',
      headers:{ ...serviceHeaders(env), Prefer:'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify([{
        catalog_item_id,
        status: action === 'acknowledge' ? 'acknowledged' : 'open',
        quantity_snapshot: Number(item.quantity_on_hand || 0),
        reorder_level_snapshot: Number(item.reorder_level || 0),
        last_notified_at: new Date().toISOString(),
        notes
      }])
    });
    if (!alertRes.ok) return withCors(json({ error:`Could not create reorder alert. ${await alertRes.text()}` },500));
    const alerts = await alertRes.json().catch(() => []);

    await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_items?id=eq.${encodeURIComponent(catalog_item_id)}`, {
      method:'PATCH',
      headers:{ ...serviceHeaders(env), Prefer:'return=minimal' },
      body: JSON.stringify({ last_reorder_requested_at:new Date().toISOString(), last_reorder_note: notes })
    }).catch(() => null);

    return withCors(json({ ok:true, item, alerts }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' },500));
  }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
