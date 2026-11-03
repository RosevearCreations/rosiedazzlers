import { requireStaffAccess, json, isUuid } from '../_lib/staff-auth.js';
import { serviceHeaders, callInventoryPostingRpc, markInventoryPostingAccounting, safeText } from '../_lib/inventory-posting.js';
import { postInventoryUsageCOGS } from '../_lib/accounting-gl.js';
import { buildUsagePreview750, usagePreviewChanged750, signUsagePreview750, verifyUsagePreview750, buildConsumableCostTrace750 } from '../_lib/consumable-job-cost-v750.js';
import { calculateInventoryUsage } from '../_lib/inventory-usage-units.js';

const error = (code, message, status = 409) => json({ok:false,build:750,code,error:message},status);
const sameOrigin = (request) => request.headers.get('origin') === new URL(request.url).origin;
const keySecret = (env) => env.STAFF_SESSION_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;
const headers = (env) => serviceHeaders(env);

async function readRows(env, table, params, max = 150) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${params.toString()}`,{headers:headers(env)});
  if (!res.ok) throw Error(`Inventory evidence unavailable (${table}, ${res.status}).`);
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length >= max) throw Error(`Inventory evidence incomplete (${table}); narrow the booking or ask Operations to review.`);
  return rows;
}

async function getItem(env, itemKey) {
  if (!itemKey || itemKey.length > 180) throw Error('Choose a valid consumable item.');
  const p = new URLSearchParams({select:'item_key,name,item_type,is_active,qty_on_hand,cost_cents,stock_unit,usage_unit,usage_units_per_stock_unit,unit_label',item_key:`eq.${itemKey}`,limit:'2'});
  const rows = await readRows(env,'catalog_inventory_items',p,2);
  if (rows.length !== 1 || rows[0].is_active !== true) throw Error('Consumable is missing or inactive.');
  return rows[0];
}

async function getBatchByKey(env, actionKey) {
  const rows=await readRows(env,'catalog_inventory_posting_batches',new URLSearchParams({select:'*',idempotency_key:`eq.${actionKey}`,limit:'2'}),2);
  return rows[0] || null;
}

async function getBatchRows(env, ids) {
  if (!ids.length) return [];
  const list=ids.map((id)=>String(id)).filter(isUuid);
  if (list.length !== ids.length) throw Error('Invalid posting batch reference.');
  return readRows(env,'catalog_inventory_posting_rows',new URLSearchParams({select:'id,batch_id,item_key,item_name,quantity,unit_label,unit_cost_cents,previous_qty,new_qty,movement_id,status',batch_id:`in.(${list.join(',')})`,limit:'150'}));
}

async function getHistory(env, bookingId) {
  const batches=await readRows(env,'catalog_inventory_posting_batches',new URLSearchParams({select:'id,created_at,status,source_kind,source_reference_id,booking_id,idempotency_key,reason,actor_staff_email,accounting_status,accounting_note,reversed_at,reversal_reason',source_kind:'eq.booking',source_reference_id:`eq.${bookingId}`,order:'created_at.desc',limit:'100'}),100);
  const rows=await getBatchRows(env,batches.map((batch)=>batch.id));
  return buildConsumableCostTrace750(batches,rows);
}

export async function onRequestPost({request,env}) {
  try {
    const body=await request.json().catch(()=>({})),action=String(body.action||''),bookingId=String(body.booking_id||'').trim();
    if (!['preview','commit','history'].includes(action)) return error('invalid_action','Choose preview, commit or history.',400);
    if (!isUuid(bookingId)) return error('invalid_booking','Enter a valid booking UUID.',400);
    const access=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
    if (!access.ok) return access.response;
    if (access.auth_mode!=='session' || !sameOrigin(request)) return error('session_required','A signed-in same-origin inventory manager is required.',403);
    const actorId=String(access.actor?.id||'');
    if (action==='history') return json({ok:true,build:750,booking_id:bookingId,trace:await getHistory(env,bookingId),read_only:true});
    const itemKey=String(body.item_key||'').trim();
    if (action==='preview') {
      const item=await getItem(env,itemKey),usageQuantity=Number(body.qty_used);
      // The posting RPC is a dry run: validates real booking, live stock and fractional units with no deduction.
      const converted=calculateInventoryUsage(item,usageQuantity);
      const result=await callInventoryPostingRpc(env,{p_source_kind:'booking',p_source_reference_id:bookingId,
        p_lines:[{item_key:itemKey,quantity:converted.stockQuantity,reservation_id:null}],
        p_actor_email:access.actor.email,p_reason:'Build 750 consumable usage preview only',
        p_idempotency_key:`b750:${crypto.randomUUID()}`,p_dry_run:true});
      if (!result.ok) return error('preview_failed',result.error||'Inventory preview could not be verified.');
      const preview=buildUsagePreview750(item,usageQuantity,result.data?.lines?.[0]);
      const operation_id=crypto.randomUUID(),issued_at=Date.now();
      const receipt=await signUsagePreview750({...preview,build:750,actor_id:actorId,booking_id:bookingId,
        operation_id,issued_at,note:safeText(body.note,700)},keySecret(env));
      return json({ok:true,build:750,preview,receipt,issued_at,expires_at:issued_at+600000,
        operation_id,stock_changed:false,requires_explicit_confirmation:true});
    }
    const receipt=await verifyUsagePreview750(body.receipt,keySecret(env),{actorId,bookingId});
    if (receipt.item_key!==itemKey || String(body.operation_id||'')!==receipt.operation_id) return error('preview_mismatch','Preview does not match this action; nothing was deducted.');
    const actionKey=`b750:${receipt.operation_id}`;
    const previouslyPosted=await getBatchByKey(env,actionKey);
    if (!previouslyPosted) {
      const item=await getItem(env,itemKey);
      if (usagePreviewChanged750(receipt,item)) return error('stock_or_cost_changed','Stock, price, item or conversion changed after preview. Preview again; nothing was deducted.');
    }
    const result=previouslyPosted?{ok:true,data:{batch:previouslyPosted,idempotent_replay:true}}:await callInventoryPostingRpc(env,{
      p_source_kind:'booking',p_source_reference_id:bookingId,
      p_lines:[{item_key:receipt.item_key,quantity:receipt.stockQuantity,reservation_id:null}],
      p_actor_email:access.actor.email,
      p_reason:safeText(`Build 750 job consumable: ${receipt.usageQuantity} ${receipt.usageUnit} = ${receipt.stockQuantity} ${receipt.stockUnit}; ${receipt.note || 'Recorded on job'}`,1200),
      p_idempotency_key:actionKey,p_dry_run:false
    });
    if (!result.ok) return error('commit_unconfirmed',`${result.error || 'Inventory posting failed.'} Inspect booking cost history before retrying.`,409);
    const batch=result.data?.batch;
    if (!batch?.id || batch.source_kind!=='booking' || batch.source_reference_id!==bookingId) return error('posting_conflict','Transaction key references another booking. Stop and contact Operations.');
    const lines=await getBatchRows(env,[batch.id]);
    if (lines.length!==1 || lines[0].item_key!==receipt.item_key || Number(lines[0].quantity)!==receipt.stockQuantity) return error('posting_conflict','Transaction key was already used for a different stock movement. Review history before further action.');
    // The RPC is authoritative at commit time. If another stock/cost edit raced after
    // preflight, flag the *recorded* difference rather than pretending the preview won.
    const posting_drift_review=Number(lines[0].previous_qty)!==receipt.stock_before ||
      (lines[0].unit_cost_cents==null?null:Number(lines[0].unit_cost_cents))!==receipt.unit_cost_cents;
    let accounting_status=batch.accounting_status || 'pending';
    if (!result.data?.idempotent_replay) {
      try {
        const row=lines[0];
        const posted=await postInventoryUsageCOGS(env,{bookingId,
          item:{item_key:row.item_key,name:row.item_name,cost_cents:row.unit_cost_cents,unit_label:row.unit_label},
          qtyUsed:Number(row.quantity),actorName:access.actor.full_name||access.actor.email||'Staff',
          note:`Build 750 batch ${batch.id}: ${receipt.usageQuantity} ${receipt.usageUnit} used on job.`});
        accounting_status='posted';
        await markInventoryPostingAccounting(env,batch.id,'posted',`Journal ${posted?.entry?.id||'recorded'}; source batch ${batch.id}`);
      } catch (err) {
        accounting_status='failed';
        await markInventoryPostingAccounting(env,batch.id,'failed',safeText(err?.message||err,700));
      }
    }
    const recorded=buildConsumableCostTrace750([{...batch,accounting_status}],[...lines]);
    return json({ok:true,build:750,booking_id:bookingId,batch_id:batch.id,
      idempotent_replay:result.data?.idempotent_replay===true,posting_status:batch.status,
      accounting_status,trace:recorded,inventory_debited:true,posting_drift_review,
      accounting_review_required:accounting_status!=='posted'||posting_drift_review});
  } catch (err) {return error('inventory_unavailable',safeText(err?.message||err,700)||'Inventory service unavailable.',503);}
}
