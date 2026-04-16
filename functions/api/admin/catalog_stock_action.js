import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";
import { insertCatalogMovement } from "../_lib/catalog-movements.js";
import { postJournalEntry, roundMoney } from "../_lib/accounting-gl.js";

const ACTIONS = {
  finished: { movement_type: "waste", sign: -1, label: "Finished / consumed", postsAccounting: true },
  defective: { movement_type: "waste", sign: -1, label: "Defective", postsAccounting: true },
  write_off: { movement_type: "waste", sign: -1, label: "Written off", postsAccounting: true },
  adjust_down: { movement_type: "adjustment", sign: -1, label: "Manual decrease", postsAccounting: false },
  adjust_up: { movement_type: "adjustment", sign: 1, label: "Manual increase", postsAccounting: false }
};

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }){
  try {
    const body = await request.json().catch(()=>null);
    const bookingId = String(body?.booking_id || '').trim();
    const access = await requireStaffAccess({ request, env, body: body || {}, capability:'manage_staff', bookingId: bookingId || null, allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    if (bookingId && !isUuid(bookingId)) return withCors(json({ error:'Invalid booking_id.' },400));
    const itemKey = String(body?.item_key || '').trim();
    const actionType = String(body?.action_type || '').trim();
    const qty = Number(body?.qty || 0);
    if (!itemKey || !ACTIONS[actionType]) return withCors(json({ error:'Item and action_type are required.' },400));
    if (!(qty > 0)) return withCors(json({ error:'qty must be greater than zero.' },400));

    const action = ACTIONS[actionType];
    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept:'application/json' };
    const itemRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=id,item_key,name,qty_on_hand,unit_label,cost_cents,item_type,reuse_policy&item_key=eq.${encodeURIComponent(itemKey)}&limit=1`, { headers });
    if (!itemRes.ok) return withCors(json({ error: await itemRes.text() },500));
    const item = (await itemRes.json().catch(()=>[]))?.[0] || null;
    if (!item) return withCors(json({ error:'Inventory item not found.' },404));

    const prevQty = Number(item.qty_on_hand || 0);
    const delta = action.sign * qty;
    const nextQty = Math.max(0, roundMoney(prevQty + delta));
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?id=eq.${encodeURIComponent(item.id)}`, { method:'PATCH', headers:{ ...headers, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify({ qty_on_hand: nextQty, updated_at:new Date().toISOString() }) });
    if (!patchRes.ok) return withCors(json({ error: await patchRes.text() },500));

    const baseNote = String(body?.note || '').trim();
    const note = `${action.label}${baseNote ? ` — ${baseNote}` : ''}`;
    const movement = await insertCatalogMovement(env, { item_id:item.id, item_key:item.item_key, booking_id:bookingId || null, movement_type:action.movement_type, qty_delta:delta, previous_qty:prevQty, new_qty:nextQty, unit_label:item.unit_label || null, note, actor_name: access.actor.full_name || access.actor.email || 'Staff', actor_staff_user_id: access.actor.id || null });

    let accounting = null;
    const costCents = Number(item.cost_cents || 0);
    if (action.postsAccounting && costCents > 0) {
      const totalCost = roundMoney((qty * costCents) / 100);
      if (totalCost > 0) {
        accounting = await postJournalEntry(env, {
          entry_date: new Date().toISOString().slice(0, 10),
          entry_type: 'inventory_writeoff',
          status: 'posted',
          reference_type: 'catalog_inventory_action',
          reference_id: item.item_key || item.id,
          memo: note,
          subtotal_cad: totalCost,
          tax_cad: 0,
          total_cad: totalCost,
          created_by_name: access.actor.full_name || access.actor.email || 'Staff',
          last_recorded_by_name: access.actor.full_name || access.actor.email || 'Staff'
        }, [
          { account_code: 'cost_of_goods_sold', direction: 'debit', amount_cad: totalCost, memo: note },
          { account_code: 'inventory_supplies', direction: 'credit', amount_cad: totalCost, memo: note }
        ]);
      }
    }

    return withCors(json({ ok:true, item:{ ...item, qty_on_hand: nextQty }, movement: movement.movement || null, accounting: accounting?.entry || null }));
  } catch (err) { return withCors(json({ error:String(err) },500)); }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
