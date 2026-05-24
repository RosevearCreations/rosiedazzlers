import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, cleanText, isUuid } from "../_lib/staff-auth.js";
import { resolveBookingIdByToken } from "../_lib/social-dispatch.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    const booking_id = String(body.booking_id || "").trim();
    const kind = String(body.kind || "photo").trim().toLowerCase();
    const caption = cleanText(body.caption);
    const media_url = String(body.media_url || "").trim();
    const visibility = String(body.visibility || "customer").trim().toLowerCase();

    if (!media_url) return withCors(json({ error: "Missing media_url." }, 400));
    if (!["photo", "video"].includes(kind)) return withCors(json({ error: "Invalid kind. Use photo or video." }, 400));
    if (!["customer", "internal"].includes(visibility)) return withCors(json({ error: "Invalid visibility." }, 400));
    try { new URL(media_url); } catch { return withCors(json({ error: "media_url must be a valid absolute URL." }, 400)); }

    const resolvedBookingId = isUuid(booking_id) ? booking_id : await resolveBookingIdByToken({ env, token });
    if (!resolvedBookingId) return withCors(json({ error: "Missing or invalid booking_id/token." }, 400));

    const access = await requireStaffAccess({ request, env, body: { ...body, booking_id: resolvedBookingId }, capability: "work_booking", bookingId: resolvedBookingId, allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const actor = access.actor || {};

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_media`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify([{ booking_id: resolvedBookingId, created_by: actor.full_name || actor.email || cleanText(body.created_by) || "Staff", kind, caption: caption || null, media_url, visibility, staff_user_id: actor.id || null }])
    });
    if (!insertRes.ok) return withCors(json({ error: `Could not save media. ${await insertRes.text()}` }, 500));
    const rows = await insertRes.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify([{ booking_id: resolvedBookingId, event_type: visibility === "internal" ? "internal_media_posted" : "media_posted", actor_name: actor.full_name || actor.email || "Staff", event_note: `${kind}${caption ? `: ${caption}` : ""}`.slice(0, 250), payload: { kind, visibility, media_url, staff_user_id: actor.id || null } }])
    }).catch(() => null);

    return withCors(json({ ok: true, message: "Media attached.", actor: { id: actor.id || null, full_name: actor.full_name || null }, media: row || null }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
