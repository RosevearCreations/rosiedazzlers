import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";
import { attachCrewAssignments, loadCrewAssignmentsMap } from "../_lib/crew-assignments.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    if (!isUuid(booking_id)) return json({ error: "Valid booking_id is required." }, 400);
    const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId: booking_id, allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;

    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,status,job_status,customer_name,customer_email,service_date,start_slot,package_code,vehicle_size,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,progress_enabled,progress_token&id=eq.${encodeURIComponent(booking_id)}&limit=1`, { headers: serviceHeaders(env) });
    if (!bookingRes.ok) return json({ error: `Could not load booking. ${await bookingRes.text()}` }, 500);
    const bookingRows = await bookingRes.json().catch(() => []);
    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    if (!booking) return json({ error: "Booking not found." }, 404);

    const intakeRes = await fetch(`${env.SUPABASE_URL}/rest/v1/jobsite_intake?select=*&booking_id=eq.${encodeURIComponent(booking_id)}&limit=1`, { headers: serviceHeaders(env) });
    if (!intakeRes.ok) return json({ error: `Could not load intake. ${await intakeRes.text()}` }, 500);
    const intakeRows = await intakeRes.json().catch(() => []);
    const intake = Array.isArray(intakeRows) ? intakeRows[0] || null : null;
    const crewResult = await loadCrewAssignmentsMap(env, [booking.id]);
    const bookingWithCrew = attachCrewAssignments([booking], crewResult.map)[0] || booking;
    return json({ ok: true, actor: { id: access.actor?.id || null, full_name: access.actor?.full_name || null, email: access.actor?.email || null }, booking: bookingWithCrew, intake, crew_warning: crewResult.warning || null });
  } catch (err) { return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500); }
}
