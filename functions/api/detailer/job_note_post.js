import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { normalizeAudience, normalizeLiveStage, audienceFields, schemaLooksLegacy } from "../_lib/job-live-feed.js";
import { queueCustomerLiveAlert, queueStaffLiveAlert, requireLiveCommunicationOpen } from "../_lib/live-interaction-alerts.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const bookingId = String(body.booking_id || '').trim();
    const note = String(body.note || '').trim();
    const audience = normalizeAudience(body.audience, body.visibility);
    const stage = normalizeLiveStage(body.stage);
    const customerActionRequired = body.customer_action_required === true;
    const recommendationTitle = String(body.recommendation_title || '').trim().slice(0, 180);
    const recommendationAmountCents = body.recommendation_amount_cents != null ? Math.max(0, Math.round(Number(body.recommendation_amount_cents) || 0)) : normalizeCents(body.recommendation_amount ?? 0);

    if (!bookingId) return json({ error: 'Missing booking_id.' }, 400);
    if (!note) return json({ error: 'Missing note.' }, 400);
    if (stage === 'recommendation' && recommendationAmountCents > 0 && !customerActionRequired) return json({ error:'Price recommendations must request a customer decision.' }, 400);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Server configuration is incomplete.' }, 500);

    const access = await requireStaffAccess({ request, env, body, capability: 'work_booking', bookingId, allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;
    const actionAccess = requireActionAccess(access.actor, 'detailer.message.send');
    if (!actionAccess.ok) return actionAccess.response;
    const communication = await requireLiveCommunicationOpen(env, bookingId);
    if (!communication.ok) return json({ error:'Live job messaging is closed because this job is no longer active.', communication_state:communication.state.state },409);
    const actor = access.actor || {};
    const audiencePatch = audienceFields(audience, actor);
    const base = {
      booking_id: bookingId,
      created_by: actor.full_name || actor.email || 'Staff',
      note: note.slice(0, 4000),
      visibility: audiencePatch.visibility,
      staff_user_id: actor.id || null
    };
    const enhanced = {
      ...base,
      stage,
      source_channel: 'detailer',
      customer_action_required: customerActionRequired,
      recommendation_title: stage === 'recommendation' ? (recommendationTitle || note.slice(0, 120)) : null,
      recommendation_amount_cents: stage === 'recommendation' && recommendationAmountCents > 0 ? recommendationAmountCents : null,
      recommendation_status: stage === 'recommendation' ? (customerActionRequired ? 'awaiting_customer' : 'informational') : null,
      ...audiencePatch
    };

    let usedLegacySchema = false;
    let insertRes = await insertUpdate(env, enhanced);
    if (!insertRes.ok) {
      const text = await insertRes.text();
      if (!schemaLooksLegacy(text)) return json({ error: `Could not save note. ${text}` }, 500);
      usedLegacySchema = true;
      insertRes = await insertUpdate(env, base);
      if (!insertRes.ok) return json({ error: `Could not save note. ${await insertRes.text()}` }, 500);
    }
    const row = (await insertRes.json().catch(() => []))?.[0] || null;

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: 'POST',
      headers: serviceHeaders(env),
      body: JSON.stringify([{
        booking_id: bookingId,
        event_type: audience === 'customer' ? 'detailer_update_posted' : audience === 'review' ? 'progress_update_pending_review' : 'internal_note_posted',
        event_note: audience === 'customer' ? note.slice(0, 250) : `${stage} ${audience} note saved.`,
        actor_name: actor.full_name || actor.email || 'Staff',
        payload: { audience, stage, customer_action_required: customerActionRequired, actor_id: actor.id || null, update_id: row?.id || null, recommendation_amount_cents:recommendationAmountCents || null }
      }])
    }).catch(() => null);
    await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
      method:'PATCH', headers:{...serviceHeaders(env), Prefer:'return=minimal'}, body:JSON.stringify({ progress_last_staff_update_at:new Date().toISOString() })
    }).catch(()=>null);

    let notification = null;
    if (audience === 'customer') {
      const alertMessage = stage === 'recommendation'
        ? `A new recommendation${recommendationAmountCents ? ` (${formatMoney(recommendationAmountCents)})` : ''} is ready for your review.`
        : 'A new live detailing update is available.';
      notification = await queueCustomerLiveAlert({ env, bookingId, eventType:stage === 'recommendation' ? 'job_recommendation_posted' : 'job_progress_update_posted', message:alertMessage, payload:{ update_id:row?.id || null, stage, customer_action_required:customerActionRequired } }).catch(()=>null);
    } else {
      notification = await queueStaffLiveAlert({ env, bookingId, eventType:audience === 'review' ? 'job_progress_update_needs_review' : 'job_private_note_posted', message:audience === 'review' ? 'A live job update is waiting for admin review.' : 'A private staff note was added to a live job.', payload:{ update_id:row?.id || null, stage } }).catch(()=>null);
    }

    return json({ ok: true, update: row, audience, stage, recommendation_amount_cents:recommendationAmountCents || null, notification, schema_fallback_used: usedLegacySchema });
  } catch (err) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    return json({ error: err?.message || 'Unexpected server error.' }, status);
  }
}

function insertUpdate(env, row) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/job_updates`, { method:'POST', headers:{...serviceHeaders(env), Prefer:'return=representation'}, body:JSON.stringify([row]) });
}
function normalizeCents(value){const n=Number(value||0);if(!Number.isFinite(n)||n<=0)return 0;return Math.round(n>9999?n:n*100);}
function formatMoney(cents){return new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(cents||0)/100);}
