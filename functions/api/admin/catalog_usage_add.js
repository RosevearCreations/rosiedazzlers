import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";
import { postInventoryUsageCOGS } from "../_lib/accounting-gl.js";
import { callInventoryPostingRpc, markInventoryPostingAccounting, safeText } from "../_lib/inventory-posting.js";
import { calculateInventoryUsage } from "../_lib/inventory-usage-units.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }){
  try {
    const body = await request.json().catch(()=>null);
    const bookingId = safeText(body?.booking_id,80);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability:'work_booking', bookingId, allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    if (!isUuid(bookingId)) return withCors(json({ error:'Invalid booking_id.' },400));
    const itemKey = safeText(body?.item_key,180);
    const qtyUsed = Number(body?.qty_used || 0);
    const note = safeText(body?.note,1200) || `Inventory used on booking ${bookingId}`;
    if (!itemKey || !(qtyUsed > 0)) return withCors(json({ error:'Item and qty_used are required.' },400));
    const itemRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=item_key,name,stock_unit,usage_unit,usage_units_per_stock_unit,unit_label,cost_cents,qty_on_hand,is_active&item_key=eq.${encodeURIComponent(itemKey)}&limit=1`, {
      headers:{ apikey:env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept:'application/json' }
    });
    if (!itemRes.ok) return withCors(json({error:'Could not verify inventory stock and usage units.',detail:safeText(await itemRes.text(),400)},503));
    const itemRows=await itemRes.json().catch(()=>[]),item=Array.isArray(itemRows)?itemRows[0]:null;
    if (!item || item.is_active===false) return withCors(json({error:'Selected inventory item was not found or is archived.'},404));
    let usage;
    // Final stock availability is checked under the posting RPC's row lock.
    // Pre-rejecting here would break a retry after a successful first debit.
    try { usage=calculateInventoryUsage(item,qtyUsed,{checkStock:false}); }
    catch(err){ return withCors(json({error:String(err.message||err)},400)); }
    const postingReason=`${note} | Job use: ${usage.usageQuantity} ${usage.usageUnit} = ${usage.stockQuantity} ${usage.stockUnit} (${usage.conversion} ${usage.usageUnit}/${usage.stockUnit}); estimated CAD ${usage.estimatedCostCad == null ? 'unknown' : usage.estimatedCostCad.toFixed(2)}`;
    const idempotencyKey = safeText(body?.client_action_id || body?.idempotency_key,180) || crypto.randomUUID();
    const result = await callInventoryPostingRpc(env, {
      p_source_kind:'booking',p_source_reference_id:bookingId,
      p_lines:[{item_key:itemKey,quantity:usage.stockQuantity,reservation_id:null}],
      p_actor_email:safeText(access.actor?.email,240)||null,p_reason:safeText(postingReason,1200),
      p_idempotency_key:idempotencyKey,p_dry_run:false
    });
    if (!result.ok) {
      if (result.migrationRequired) return withCors(json({ error:'Build 240 inventory posting migration is required before usage can be recorded.', migration_required:true, migration:'sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql', detail:result.error },409));
      return withCors(json({ error:result.error||'Could not record inventory usage.' },409));
    }
    const out=result.data||{};
    let accounting=null;
    if(!out.idempotent_replay && out.batch?.id){
      const line=Array.isArray(out.lines)?out.lines[0]:null;
      try{
        const posted=await postInventoryUsageCOGS(env,{bookingId,item:{item_key:line?.item_key||itemKey,name:line?.item_name||itemKey,cost_cents:line?.unit_cost_cents??item.cost_cents??null,unit_label:line?.unit_label||usage.stockUnit},qtyUsed:usage.stockQuantity,actorName:access.actor?.full_name||access.actor?.email||'Staff',note:postingReason});
        accounting=posted?.entry||null;
        await markInventoryPostingAccounting(env,out.batch.id,'posted',accounting?.id?`Journal entry ${accounting.id}`:'COGS entry posted.');
      }catch(err){
        await markInventoryPostingAccounting(env,out.batch.id,'failed',safeText(err?.message||err,800));
      }
    }
    return withCors(json({ok:true,idempotency_key:idempotencyKey,batch:out.batch||null,lines:out.lines||[],item:out.lines?.[0]||null,movement:null,usage,accounting,idempotent_replay:out.idempotent_replay===true}));
  } catch (err) { return withCors(json({ error:safeText(err?.message||err,800) },500)); }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
