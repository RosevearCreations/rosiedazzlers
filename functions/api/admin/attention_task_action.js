import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";
import { queueNotificationEvent } from "../_lib/notification-hooks.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ ok:false, error:"Supabase service configuration is missing." }, 500));

    const action = clean(body.action).toLowerCase();
    if (!['assign_to_me','snooze_tomorrow','snooze_week','resolve','reopen','create_manual','set_due_date','clear_due_date'].includes(action)) {
      return withCors(json({ ok:false, error:"Unsupported attention-task action." }, 400));
    }
    const sourceType = clean(body.source_type || 'generated').slice(0,80);
    const sourceKey = clean(body.source_key).slice(0,220);
    if (!sourceKey) return withCors(json({ ok:false, error:"A source key is required so this task can be safely tracked." }, 400));
    const bookingId = clean(body.booking_id);
    if (bookingId && !isUuid(bookingId)) return withCors(json({ ok:false, error:"Invalid booking id." }, 400));
    const title = clean(body.title || 'Owner action').slice(0,180);
    const detail = clean(body.detail).slice(0,1000) || null;
    const urgency = ['urgent','high','normal','low'].includes(clean(body.urgency)) ? clean(body.urgency) : 'normal';
    const note = clean(body.note).slice(0,1000) || null;
    const dueAt = hasOwn(body, 'due_at') ? parseIsoDate(body.due_at) : undefined;
    const headers = serviceHeaders(env);
    const existing = await latestTask(env, sourceType, sourceKey);
    const targetUrl = safeInternalTarget(body.target_url || existing?.target_url || '/admin-today.html');
    const now = new Date();
    const actorName = access.actor?.full_name || access.actor?.email || 'Staff';
    const actorId = access.actor?.id || null;
    const patch = {
      source_type: sourceType,
      source_key: sourceKey,
      booking_id: bookingId || existing?.booking_id || null,
      title: title || existing?.title || 'Owner action',
      detail: detail ?? existing?.detail ?? null,
      urgency,
      updated_at: now.toISOString(),
      last_action_by_staff_user_id: actorId,
      last_action_by_staff_name: actorName,
      last_action_at: now.toISOString(),
      target_url: targetUrl,
      due_at: dueAt === undefined ? (existing?.due_at || null) : dueAt
    };

    if (action === 'assign_to_me') {
      Object.assign(patch, { status:'open', assigned_to_staff_user_id:actorId, assigned_to_staff_name:actorName, snoozed_until:null, suppress_source_until:null, resolution_note:null, resolved_at:null });
    } else if (action === 'snooze_tomorrow' || action === 'snooze_week') {
      const days = action === 'snooze_week' ? 7 : 1;
      const until = new Date(now.getTime() + days * 86400000).toISOString();
      Object.assign(patch, { status:'snoozed', snoozed_until:until, suppress_source_until:until, resolution_note:note, resolved_at:null });
    } else if (action === 'resolve') {
      const suppress = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      Object.assign(patch, { status:'resolved', resolved_at:now.toISOString(), resolved_by_staff_user_id:actorId, resolved_by_staff_name:actorName, resolution_note:note || 'Resolved from Today Needs Attention.', suppress_source_until:suppress, snoozed_until:null });
    } else if (action === 'reopen') {
      Object.assign(patch, { status:'open', snoozed_until:null, suppress_source_until:null, resolved_at:null, resolution_note:null });
    } else if (action === 'set_due_date') {
      if (!patch.due_at) return withCors(json({ ok:false, error:'Choose a valid due date/time.' }, 400));
      Object.assign(patch, { status:'open', snoozed_until:null, suppress_source_until:null });
    } else if (action === 'clear_due_date') {
      Object.assign(patch, { due_at:null, escalation_at:null, escalation_status:'none' });
    } else {
      Object.assign(patch, { status:'open', snoozed_until:null, suppress_source_until:null, escalation_status: patch.due_at ? 'pending' : (existing?.escalation_status || 'none') });
    }

    let saved;
    if (existing?.id) {
      saved = await patchTask(env, existing.id, patch);
    } else {
      saved = await createTask(env, { ...patch, created_at:now.toISOString(), created_by_staff_user_id:actorId, created_by_staff_name:actorName });
    }
    await queueTaskNotification(env, patch, action, actorName).catch(() => null);
    await audit(env, {
      booking_id:patch.booking_id,
      event_type:`attention_task_${action}`,
      entity_type:'owner_attention_task',
      entity_id:saved?.id || null,
      actor_name:actorName,
      detail:`${action}: ${patch.title}`.slice(0,500),
      payload:{ source_type:sourceType, source_key:sourceKey, status:patch.status, note }
    });
    return withCors(json({ ok:true, task:saved || { ...patch, id:existing?.id || null }, action }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || 'Could not update the owner attention task.', migration:'sql/2026-06-22_build213_owner_action_customer_trust.sql' }, 500));
  }
}

async function latestTask(env, sourceType, sourceKey){
  const url = `${env.SUPABASE_URL}/rest/v1/owner_attention_tasks?select=*&source_type=eq.${encodeURIComponent(sourceType)}&source_key=eq.${encodeURIComponent(sourceKey)}&order=updated_at.desc,created_at.desc&limit=1`;
  const res = await fetch(url, { headers:serviceHeaders(env) });
  if (!res.ok) { const text=await res.text(); throw new Error(text.includes('owner_attention_tasks') ? 'Run the Build 213 migration before using owner task controls.' : `Could not load task. ${text}`); }
  return (await res.json().catch(()=>[]))?.[0] || null;
}
async function patchTask(env,id,patch){
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/owner_attention_tasks?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(patch)});
  if(!res.ok)throw new Error(`Could not save task. ${await res.text()}`);
  return (await res.json().catch(()=>[]))?.[0]||null;
}
async function createTask(env,row){
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/owner_attention_tasks`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([row])});
  if(!res.ok)throw new Error(`Could not create task. ${await res.text()}`);
  return (await res.json().catch(()=>[]))?.[0]||null;
}
async function audit(env,row){
  await fetch(`${env.SUPABASE_URL}/rest/v1/live_interaction_audit_events`,{method:'POST',headers:serviceHeaders(env),body:JSON.stringify([{...row,created_at:new Date().toISOString()}])}).catch(()=>null);
}
function hasOwn(obj,key){return Object.prototype.hasOwnProperty.call(obj||{},key);}
function parseIsoDate(value){ if(value==null||String(value).trim()==='') return null; const date=new Date(value); if(Number.isNaN(date.getTime())) throw new Error('Due date is invalid.'); return date.toISOString(); }
function safeInternalTarget(value){ const target=String(value||'').trim(); return /^\/[A-Za-z0-9_?=&.#%\/-]*$/.test(target) ? target.slice(0,500) : '/admin-today.html'; }
async function queueTaskNotification(env, task, action, actorName){ const notify=['assign_to_me','resolve','reopen','set_due_date','create_manual'].includes(action); if(!notify) return; await queueNotificationEvent({ env, event_type:`owner_task_${action}`, channel:'internal', booking_id:task.booking_id||null, payload:{ title:task.title, urgency:task.urgency, due_at:task.due_at||null, action, actor_name:actorName, target_url:task.target_url||'/admin-today.html' } }); }
function clean(v){return String(v==null?'':v).trim();}
function corsHeaders(){return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store' };}
function withCors(response){const h=new Headers(response.headers||{});for(const[k,v]of Object.entries(corsHeaders()))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
