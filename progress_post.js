import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, cleanText, isUuid } from "./_lib/staff-auth.js";
import { resolveBookingIdByToken } from "./_lib/social-dispatch.js";
import { normalizeAudience, normalizeLiveStage, audienceFields, schemaLooksLegacy } from "./_lib/job-live-feed.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    const token = String(body.token || "").trim();
    const note = cleanText(body.note);
    const audience = normalizeAudience(body.audience, body.visibility);
    const stage = normalizeLiveStage(body.stage);
    const customer_action_required = body.customer_action_required === true;
    const resolvedBookingId = isUuid(booking_id) ? booking_id : await resolveBookingIdByToken({ env, token });
    if (!resolvedBookingId) return withCors(json({ error: "Invalid booking_id or token." }, 400));
    if (!note) return withCors(json({ error: "Missing note." }, 400));

    const access = await requireStaffAccess({ request, env, body: { ...body, booking_id: resolvedBookingId }, capability: "work_booking", bookingId: resolvedBookingId, allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const actor = access.actor || {};
    const audiencePatch = audienceFields(audience, actor);
    const base = {
      booking_id: resolvedBookingId,
      created_by: actor.full_name || actor.email || cleanText(body.created_by) || "Staff",
      note,
      visibility: audiencePatch.visibility,
      staff_user_id: actor.id || null
    };
    const enhanced = {
      ...base,
      stage,
      source_channel: actor.role_code === "detailer" || actor.role_code === "senior_detailer" ? "detailer" : "admin",
      customer_action_required,
      ...audiencePatch
    };

    let usedLegacySchema = false;
    let insertRes = await insertRow(env, enhanced);
    if (!insertRes.ok) {
      const text = await insertRes.text();
      if (!schemaLooksLegacy(text)) return withCors(json({ error: `Could not save update. ${text}` }, 500));
      usedLegacySchema = true;
      insertRes = await insertRow(env, base);
      if (!insertRes.ok) return withCors(json({ error: `Could not save update. ${await insertRes.text()}` }, 500));
    }
    const rows = await insertRes.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify([{
        booking_id: resolvedBookingId,
        event_type: audience === "customer" ? "detailer_update_posted" : audience === "review" ? "progress_update_pending_review" : "internal_note_posted",
        actor_name: actor.full_name || actor.email || "Staff",
        event_note: audience === "customer" ? note.slice(0, 250) : `${stage} ${audience} update saved.`,
        payload: { visibility: audiencePatch.visibility, audience, stage, customer_action_required, update_id: row?.id || null, actor_id: actor.id || null }
      }])
    }).catch(() => null);

    return withCors(json({
      ok: true,
      message: audience === "review" ? "Update saved for admin review." : audience === "internal" ? "Private staff update saved." : "Customer update posted.",
      update: row,
      audience,
      stage,
      schema_fallback_used: usedLegacySchema
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

function insertRow(env, row) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/job_updates`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify([row])
  });
}

function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
