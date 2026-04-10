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

    const resolvedAssignment = await resolveAssignmentActor(env, { assigned_to, assigned_staff_user_id, assigned_staff_email, assigned_staff_name });

    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify({
        assigned_to: resolvedAssignment.assigned_to,
        assigned_staff_user_id: resolvedAssignment.assigned_staff_user_id,
        assigned_staff_email: resolvedAssignment.assigned_staff_email,
        assigned_staff_name: resolvedAssignment.assigned_staff_name,
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
      body: JSON.stringify([{ booking_id, event_type: resolvedAssignment.assigned_to || resolvedAssignment.assigned_staff_name ? "assignment_updated" : "assignment_cleared", actor_name: access.actor?.full_name || access.actor?.email || "Staff", event_note: resolvedAssignment.assigned_to || resolvedAssignment.assigned_staff_name || "Assignment cleared", payload: { assigned_staff_user_id: resolvedAssignment.assigned_staff_user_id, assigned_staff_email: resolvedAssignment.assigned_staff_email, assigned_staff_name: resolvedAssignment.assigned_staff_name } }])
    }).catch(() => null);

    return json({ ok: true, message: resolvedAssignment.assigned_to || resolvedAssignment.assigned_staff_name ? "Booking assigned." : "Booking assignment cleared.", booking: { id: booking.id, assigned_to: booking.assigned_to || null, assigned_staff_user_id: booking.assigned_staff_user_id || null, assigned_staff_email: booking.assigned_staff_email || null, assigned_staff_name: booking.assigned_staff_name || null } });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}


async function resolveAssignmentActor(env, assignment) {
  const empty = { assigned_to: null, assigned_staff_user_id: null, assigned_staff_email: null, assigned_staff_name: null };
  const byId = cleanText(assignment.assigned_staff_user_id);
  const byEmail = cleanEmail(assignment.assigned_staff_email);
  const byName = cleanText(assignment.assigned_staff_name || assignment.assigned_to);

  if (!byId && !byEmail && !byName) return empty;

  const row = byId
    ? await loadStaffById(env, byId)
    : (byEmail ? await loadStaffByEmail(env, byEmail) : (byName ? await loadStaffByName(env, byName) : null));

  if (row) {
    return {
      assigned_to: row.full_name || row.email || byName || null,
      assigned_staff_user_id: row.id || null,
      assigned_staff_email: row.email || null,
      assigned_staff_name: row.full_name || null
    };
  }

  return {
    assigned_to: byName || byEmail || null,
    assigned_staff_user_id: byId || null,
    assigned_staff_email: byEmail || null,
    assigned_staff_name: byName || null
  };
}

async function loadStaffById(env, id) {
  if (!isUuid(id)) return null;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users?select=id,full_name,email,is_active&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return row && row.is_active !== false ? row : null;
}

async function loadStaffByEmail(env, email) {
  if (!email) return null;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users?select=id,full_name,email,is_active&email=eq.${encodeURIComponent(email)}&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return row && row.is_active !== false ? row : null;
}

async function loadStaffByName(env, name) {
  if (!name) return null;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users?select=id,full_name,email,is_active&full_name=ilike.${encodeURIComponent(name)}&is_active=eq.true&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}
