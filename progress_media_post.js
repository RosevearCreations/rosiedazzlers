import { requireStaffAccess, serviceHeaders, json, cleanText, isUuid } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    const booking_id = String(body.booking_id || "").trim();
    const kind = String(body.kind || "photo").trim();
    const caption = cleanText(body.caption);
    const media_url = String(body.media_url || "").trim();
    const visibility = String(body.visibility || "customer").trim();

    if (!media_url) return json({ error: "Missing media_url." }, 400);
    if (!["photo", "video"].includes(kind)) return json({ error: "Invalid kind. Use photo or video." }, 400);
    if (!["customer", "internal"].includes(visibility)) return json({ error: "Invalid visibility." }, 400);
    try { new URL(media_url); } catch { return json({ error: "media_url must be a valid absolute URL." }, 400); }

    let resolvedBookingId = isUuid(booking_id) ? booking_id : "";
    if (!resolvedBookingId && !token) return json({ error: "Missing booking_id or token." }, 400);

    if (!resolvedBookingId) {
      const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,progress_enabled,progress_token&progress_token=eq.${encodeURIComponent(token)}&limit=1`, { headers: serviceHeaders(env) });
      if (!bookingRes.ok) return json({ error: `Could not load booking. ${await bookingRes.text()}` }, 500);
      const bookings = await bookingRes.json().catch(() => []);
      const booking = Array.isArray(bookings) ? bookings[0] || null : null;
      if (!booking) return json({ error: "Booking not found for token." }, 404);
      if (booking.progress_enabled === false) return json({ error: "Progress is not enabled for this booking." }, 403);
      resolvedBookingId = booking.id;
    }

    const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId: resolvedBookingId, allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;
    const actor = access.actor || {};

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_media`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify([{ booking_id: resolvedBookingId, created_by: actor.full_name || actor.email || cleanText(body.created_by) || "Staff", kind, caption: caption || null, media_url, visibility, staff_user_id: actor.id || null }])
    });
    if (!insertRes.ok) return json({ error: `Could not save media. ${await insertRes.text()}` }, 500);
    const rows = await insertRes.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify([{ booking_id: resolvedBookingId, event_type: visibility === "internal" ? "internal_media_posted" : "media_posted", actor_name: actor.full_name || actor.email || "Staff", event_note: `${kind}${caption ? `: ${caption}` : ""}`.slice(0, 250), payload: { kind, visibility, media_url, staff_user_id: actor.id || null } }])
    }).catch(() => null);

    return json({ ok: true, message: "Media attached.", actor: { id: actor.id || null, full_name: actor.full_name || null }, media: row || null });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}
