import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";
import { insertCatalogMovement } from "../_lib/catalog-movements.js";
import { isPurchaseOrderReceiptReplay, roundInventoryQuantity } from "../_lib/catalog-integrity.js";
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
    if (isPurchaseOrderReceiptReplay(current, status)) return withCors(json({ ok:true, purchase_order:current, updated_by:access.actor.full_name || 'Staff', inventory_updated:false, idempotent_replay:true }));

    const patch = { status, updated_at: new Date().toISOString(), note: String(body?.note || '').trim() || current.note || null, reminder_at: body?.reminder_at ? String(body.reminder_at).trim() : current.reminder_at || null };
    if (status === 'ordered' && !current.ordered_at) patch.ordered_at = new Date().toISOString();
    if (status === 'ordered' && !patch.reminder_at) patch.reminder_at = new Date(Date.now() + 3*24*60*60*1000).toISOString();
    if (status === 'received' && !current.received_at) patch.received_at = new Date().toISOString();
    if (status === 'cancelled') { patch.reminder_at = null; patch.reminder_sent_at = null; patch.reminder_last_channel = null; }

    if (status !== 'received') {
      const res = await patchPurchaseOrder(env, id, patch, baseHeaders);
      if (!res.ok) return withCors(json({ error: res.error }, 500));
      return withCors(json({ ok:true, purchase_order:res.row, updated_by:access.actor.full_name || 'Staff', inventory_updated:false, idempotent_replay:false }));
    }

    if (!current.item_key) return withCors(json({ error:'Purchase order has no inventory item key; receipt was not applied.', integrity_validation:true },409));
    const receiveQty = roundInventoryQuantity(current.qty_ordered);
    if (!Number.isFinite(receiveQty) || !(receiveQty > 0)) return withCors(json({ error:'Purchase order quantity is invalid; receipt was not applied.', integrity_validation:true },409));
    const itemRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=id,item_key,name,qty_on_hand,unit_label&item_key=eq.${encodeURIComponent(current.item_key)}&limit=1`, { headers: baseHeaders });
    if (!itemRes.ok) return withCors(json({ error:await itemRes.text() },500));
    const item = (await itemRes.json().catch(()=>[]))?.[0] || null;
    if (!item) return withCors(json({ error:'Inventory item for this purchase order was not found; receipt was not applied.', integrity_validation:true },409));
    const previousQty = roundInventoryQuantity(item.qty_on_hand);
    const nextQty = roundInventoryQuantity(previousQty + receiveQty);
    if (!Number.isFinite(previousQty) || previousQty < 0 || !Number.isFinite(nextQty)) return withCors(json({ error:'Inventory quantity is invalid; receipt was not applied.', integrity_validation:true },409));

    const stockRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?id=eq.${encodeURIComponent(item.id)}`, { method:'PATCH', headers:{ ...baseHeaders, 'Content-Type':'application/json', Prefer:'return=representation' }, body:JSON.stringify({ qty_on_hand:nextQty, updated_at:new Date().toISOString() }) });
    if (!stockRes.ok) return withCors(json({ error:await stockRes.text() },500));
    const movementResult = await insertCatalogMovement(env, { item_id:item.id, item_key:item.item_key, movement_type:'receive', qty_delta:receiveQty, previous_qty:previousQty, new_qty:nextQty, unit_label:item.unit_label || null, note:`Purchase order ${id} received`, actor_name:access.actor.full_name || access.actor.email || 'Staff', actor_staff_user_id:access.actor.id || null, source_kind:'manual', source_reference_id:id });
    if (!movementResult.ok) {
      await rollbackInventoryQuantity(env, item.id, previousQty, baseHeaders);
      return withCors(json({ error:'Receipt movement could not be recorded; stock rollback was attempted and the order was left unreceived.', detail:movementResult.error || null, integrity_validation:true },500));
    }

    const orderRes = await patchPurchaseOrder(env, id, patch, baseHeaders);
    if (!orderRes.ok) {
      const cleanup = await removeMovement(env, movementResult.movement?.id, baseHeaders);
      await rollbackInventoryQuantity(env, item.id, previousQty, baseHeaders);
      return withCors(json({ error:'Purchase-order receipt could not be finalized; movement/stock cleanup was attempted.', detail:orderRes.error, cleanup_required:cleanup.ok !== true },500));
    }

    await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_low_stock_alerts?item_id=eq.${encodeURIComponent(item.id)}&is_resolved=eq.false`, { method:'PATCH', headers:{ ...baseHeaders, 'Content-Type':'application/json' }, body:JSON.stringify({ is_resolved:true, resolved_at:new Date().toISOString(), resolved_by_name:access.actor.full_name || access.actor.email || 'Staff', resolution_notes:'Resolved automatically when purchase order was received.' }) }).catch(()=>null);
    return withCors(json({ ok:true, purchase_order:orderRes.row, updated_by:access.actor.full_name || 'Staff', inventory_updated:true, movement:movementResult.movement || null, idempotent_replay:false }));
  } catch (err) { return withCors(json({ error: String(err) }, 500)); }
}

async function patchPurchaseOrder(env,id,patch,baseHeaders){
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_purchase_orders?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{...baseHeaders,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(patch)});
  if(!res.ok)return {ok:false,error:await res.text()};
  return {ok:true,row:(await res.json().catch(()=>[]))?.[0]||null};
}
async function rollbackInventoryQuantity(env,itemId,qty,baseHeaders){
  return fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?id=eq.${encodeURIComponent(itemId)}`,{method:'PATCH',headers:{...baseHeaders,'Content-Type':'application/json'},body:JSON.stringify({qty_on_hand:qty,updated_at:new Date().toISOString()})}).then((res)=>({ok:res.ok})).catch(()=>({ok:false}));
}
async function removeMovement(env,movementId,baseHeaders){
  if(!movementId)return {ok:false};
  return fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_movements?id=eq.${encodeURIComponent(movementId)}`,{method:'DELETE',headers:{...baseHeaders,Prefer:'return=minimal'}}).then((res)=>({ok:res.ok})).catch(()=>({ok:false}));
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
