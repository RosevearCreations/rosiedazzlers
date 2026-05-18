import { requireStaffAccess, serviceHeaders, json, cleanText, isUuid } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    const entry_type = String(body.entry_type || "").trim();
    const note = cleanText(body.note);
    const source = cleanSource(body.source);
    const event_time = cleanEventTime(body.event_time);

    if (!isUuid(booking_id)) return json({ error: "Valid booking_id is required." }, 400);
    if (!isValidEntryType(entry_type)) return json({ error: "Invalid entry_type." }, 400);

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: booking_id,
      allowLegacyAdminFallback: false
    });
    if (!access.ok) return access.response;

    const actor = access.actor || {};
    const bookingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?select=id&id=eq.${encodeURIComponent(booking_id)}&limit=1`,
      { headers: serviceHeaders(env) }
    );
    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return json({ error: `Could not verify booking. ${text}` }, 500);
    }
    const bookingRows = await bookingRes.json().catch(() => []);
    if (!Array.isArray(bookingRows) || !bookingRows[0]) return json({ error: "Booking not found." }, 404);

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_time_entries`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify([{ booking_id, staff_user_id: actor.id || null, entry_type, event_time, note, created_by_name: actor.full_name || actor.email || null, source }])
    });
    if (!insertRes.ok) {
      const text = await insertRes.text();
      return json({ error: `Could not save time entry. ${text}` }, 500);
    }

    const rows = await insertRes.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;
    return json({ ok: true, message: "Time entry saved.", auth_mode: access.auth_mode, time_entry: row });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}

function isValidEntryType(value) {
  return ["arrival","work_start","work_stop","break_start","break_stop","rain_break_start","rain_break_stop","heat_break_start","heat_break_stop","job_complete"].includes(value);
}
function cleanSource(value) {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return "jobsite";
  return ["jobsite", "admin", "system"].includes(s) ? s : "jobsite";
}
function cleanEventTime(value) {
  const s = String(value ?? "").trim();
  if (!s) return new Date().toISOString();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
