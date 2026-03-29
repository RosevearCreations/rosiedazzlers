import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    if (!isUuid(booking_id)) {
      return json({ error: "Valid booking_id is required." }, 400);
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: booking_id,
      allowLegacyAdminFallback: false
    });
    if (!access.ok) return access.response;

    const bookingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?select=id&id=eq.${encodeURIComponent(booking_id)}&limit=1`,
      { headers: serviceHeaders(env) }
    );
    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return json({ error: `Could not verify booking. ${text}` }, 500);
    }

    const bookingRows = await bookingRes.json().catch(() => []);
    if (!Array.isArray(bookingRows) || !bookingRows[0]) {
      return json({ error: "Booking not found." }, 404);
    }

    const entriesRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/job_time_entries` +
        `?select=id,booking_id,staff_user_id,created_at,updated_at,entry_type,event_time,note,created_by_name,source` +
        `&booking_id=eq.${encodeURIComponent(booking_id)}` +
        `&order=event_time.asc,created_at.asc`,
      { headers: serviceHeaders(env) }
    );

    if (!entriesRes.ok) {
      const text = await entriesRes.text();
      return json({ error: `Could not load time entries. ${text}` }, 500);
    }

    const entries = await entriesRes.json().catch(() => []);

    return json({
      ok: true,
      booking_id,
      actor: {
        id: access.actor?.id || null,
        full_name: access.actor?.full_name || null,
        email: access.actor?.email || null,
        role_code: access.actor?.role_code || null
      },
      time_entries: Array.isArray(entries) ? entries : []
    });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}
