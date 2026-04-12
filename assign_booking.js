import { requireStaffAccess, serviceHeaders, json, cleanText, cleanEmail, isUuid } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    const assigned_to = cleanText(body.assigned_to);
    const assigned_staff_user_id = cleanText(body.assigned_staff_user_id);
    const assigned_staff_email = cleanEmail(body.assigned_staff_email);
    const assigned_staff_name = cleanText(body.assigned_staff_name) || assigned_to;

    if (!isUuid(booking_id)) return json({ error: "Valid booking_id is required." }, 400);
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;

    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify({
        assigned_to: assigned_to || assigned_staff_name || null,
        assigned_staff_user_id: assigned_staff_user_id || null,
        assigned_staff_email: assigned_staff_email || null,
        assigned_staff_name: assigned_staff_name || null,
        updated_at: new Date().toISOString()
      })
    });
    if (!patchRes.ok) return json({ error: `Could not update assigned staff. ${await patchRes.text()}` }, 500);
    const rows = await patchRes.json().catch(() => []);
    const booking = Array.isArray(rows) ? rows[0] || null : null;
    if (!booking) return json({ error: "Booking not found." }, 404);

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify([{ booking_id, event_type: assigned_to || assigned_staff_name ? "assignment_updated" : "assignment_cleared", actor_name: access.actor?.full_name || access.actor?.email || "Staff", event_note: assigned_to || assigned_staff_name || "Assignment cleared", payload: { assigned_staff_user_id: assigned_staff_user_id || null, assigned_staff_email: assigned_staff_email || null, assigned_staff_name: assigned_staff_name || null } }])
    }).catch(() => null);

    return json({ ok: true, message: assigned_to || assigned_staff_name ? "Booking assigned." : "Booking assignment cleared.", booking: { id: booking.id, assigned_to: booking.assigned_to || null, assigned_staff_user_id: booking.assigned_staff_user_id || null, assigned_staff_email: booking.assigned_staff_email || null, assigned_staff_name: booking.assigned_staff_name || null } });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}
