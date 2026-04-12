import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    if (!isUuid(booking_id)) return json({ error: "Valid booking_id is required." }, 400);

    const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId: booking_id, allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;

    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id&id=eq.${encodeURIComponent(booking_id)}&limit=1`, { headers: serviceHeaders(env) });
    if (!bookingRes.ok) return json({ error: `Could not verify booking. ${await bookingRes.text()}` }, 500);
    const bookingRows = await bookingRes.json().catch(() => []);
    if (!Array.isArray(bookingRows) || !bookingRows[0]) return json({ error: "Booking not found." }, 404);

    const entriesRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_time_entries?select=id,entry_type,event_time,note,created_by_name,source,created_at&booking_id=eq.${encodeURIComponent(booking_id)}&order=event_time.asc,created_at.asc`, { headers: serviceHeaders(env) });
    if (!entriesRes.ok) return json({ error: `Could not load time entries. ${await entriesRes.text()}` }, 500);
    const rows = await entriesRes.json().catch(() => []);
    return json({ ok: true, booking_id, summary: summarizeTimeEntries(Array.isArray(rows) ? rows : []), time_entries: Array.isArray(rows) ? rows : [] });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}

function summarizeTimeEntries(entries) {
  let arrived_at = null, started_at = null, completed_at = null, last_event_type = null, current_status = "idle";
  let activeWorkStartMs = null, activePauseStartMs = null, total_work_ms = 0, total_pause_ms = 0;
  for (const entry of entries) {
    const t = Date.parse(entry.event_time); if (Number.isNaN(t)) continue; last_event_type = entry.entry_type;
    if (entry.entry_type === "arrival" && !arrived_at) { arrived_at = entry.event_time; current_status = "arrived"; continue; }
    if (entry.entry_type === "work_start") { if (!started_at) started_at = entry.event_time; if (activePauseStartMs != null) { total_pause_ms += Math.max(0, t - activePauseStartMs); activePauseStartMs = null; } activeWorkStartMs = t; current_status = "working"; continue; }
    if (["break_start","rain_break_start","heat_break_start"].includes(entry.entry_type)) { if (activeWorkStartMs != null) { total_work_ms += Math.max(0, t - activeWorkStartMs); activeWorkStartMs = null; } activePauseStartMs = t; current_status = entry.entry_type === "break_start" ? "break" : (entry.entry_type === "rain_break_start" ? "rain_break" : "heat_break"); continue; }
    if (["break_stop","rain_break_stop","heat_break_stop"].includes(entry.entry_type)) { if (activePauseStartMs != null) { total_pause_ms += Math.max(0, t - activePauseStartMs); activePauseStartMs = null; } activeWorkStartMs = t; current_status = "working"; continue; }
    if (entry.entry_type === "work_stop") { if (activeWorkStartMs != null) { total_work_ms += Math.max(0, t - activeWorkStartMs); activeWorkStartMs = null; } current_status = "stopped"; continue; }
    if (entry.entry_type === "job_complete") { if (activeWorkStartMs != null) { total_work_ms += Math.max(0, t - activeWorkStartMs); activeWorkStartMs = null; } if (activePauseStartMs != null) { total_pause_ms += Math.max(0, t - activePauseStartMs); activePauseStartMs = null; } completed_at = entry.event_time; current_status = "completed"; }
  }
  const now = Date.now(); if (activeWorkStartMs != null) total_work_ms += Math.max(0, now - activeWorkStartMs); if (activePauseStartMs != null) total_pause_ms += Math.max(0, now - activePauseStartMs);
  return { arrived_at, started_at, completed_at, last_event_type, current_status, total_work_ms, total_pause_ms };
}
