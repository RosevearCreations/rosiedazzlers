
import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";
import { insertCatalogMovement } from "../_lib/catalog-movements.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }){
  try {
    const body = await request.json().catch(()=>null);
    const bookingId = String(body?.booking_id || '').trim();
    const access = await requireStaffAccess({ request, env, body: body || {}, capability:'work_booking', bookingId, allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    if (!isUuid(bookingId)) return withCors(json({ error:'Invalid booking_id.' },400));
    const itemKey = String(body?.item_key || '').trim();
    const qtyUsed = Number(body?.qty_used || 0);
    if (!itemKey || !(qtyUsed > 0)) return withCors(json({ error:'Item and qty_used are required.' },400));
    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept:'application/json' };
    const itemRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=id,item_key,name,qty_on_hand,unit_label&item_key=eq.${encodeURIComponent(itemKey)}&limit=1`, { headers });
    if (!itemRes.ok) return withCors(json({ error: await itemRes.text() },500));
    const item = (await itemRes.json().catch(()=>[]))?.[0] || null;
    if (!item) return withCors(json({ error:'Inventory item not found.' },404));
    const prevQty = Number(item.qty_on_hand || 0);
    const nextQty = Math.max(0, prevQty - qtyUsed);
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?id=eq.${encodeURIComponent(item.id)}`, { method:'PATCH', headers:{ ...headers, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify({ qty_on_hand: nextQty, updated_at:new Date().toISOString() }) });
    if (!patchRes.ok) return withCors(json({ error: await patchRes.text() },500));
    const movement = await insertCatalogMovement(env, { item_id:item.id, item_key:item.item_key, booking_id:bookingId, movement_type:'job_use', qty_delta:-qtyUsed, previous_qty:prevQty, new_qty:nextQty, unit_label:item.unit_label || null, note:String(body?.note || '').trim() || null, actor_name: access.actor.full_name || access.actor.email || 'Staff', actor_staff_user_id: access.actor.id || null });
    return withCors(json({ ok:true, item:{ ...item, qty_on_hand: nextQty }, movement: movement.movement || null }));
  } catch (err) { return withCors(json({ error:String(err) },500)); }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
