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
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;

    const normalizedCrew = await normalizeCrewAssignments(env, body.crew_assignments, {
      assigned_to,
      assigned_staff_user_id,
      assigned_staff_email,
      assigned_staff_name
    });

    const leadAssignment = normalizedCrew.find((row) => row.assignment_role === "lead") || null;
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify({
        assigned_to: leadAssignment?.assigned_to || null,
        assigned_staff_user_id: leadAssignment?.assigned_staff_user_id || null,
        assigned_staff_email: leadAssignment?.assigned_staff_email || null,
        assigned_staff_name: leadAssignment?.assigned_staff_name || null,
        updated_at: new Date().toISOString()
      })
    });
    if (!patchRes.ok) return json({ error: `Could not update assigned staff. ${await patchRes.text()}` }, 500);
    const rows = await patchRes.json().catch(() => []);
    const booking = Array.isArray(rows) ? rows[0] || null : null;
    if (!booking) return json({ error: "Booking not found." }, 404);

    const crewSync = await syncCrewAssignments(env, booking_id, normalizedCrew, access.actor);

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify([{
        booking_id,
        event_type: leadAssignment ? "assignment_updated" : "assignment_cleared",
        actor_name: access.actor?.full_name || access.actor?.email || "Staff",
        event_note: leadAssignment ? `Lead: ${leadAssignment.assigned_to || leadAssignment.assigned_staff_name || 'Assigned'}${normalizedCrew.length > 1 ? ` · Crew: ${normalizedCrew.length}` : ''}` : "Assignment cleared",
        payload: {
          assigned_staff_user_id: leadAssignment?.assigned_staff_user_id || null,
          assigned_staff_email: leadAssignment?.assigned_staff_email || null,
          assigned_staff_name: leadAssignment?.assigned_staff_name || null,
          crew_assignments: normalizedCrew.map(toCrewResponseRow),
          crew_persisted: crewSync.persisted,
          crew_warning: crewSync.warning || null
        }
      }])
    }).catch(() => null);

    return json({
      ok: true,
      message: leadAssignment ? (normalizedCrew.length > 1 ? "Booking crew assigned." : "Booking assigned.") : "Booking assignment cleared.",
      warning: crewSync.warning || null,
      booking: {
        id: booking.id,
        assigned_to: booking.assigned_to || null,
        assigned_staff_user_id: booking.assigned_staff_user_id || null,
        assigned_staff_email: booking.assigned_staff_email || null,
        assigned_staff_name: booking.assigned_staff_name || null,
        crew_assignments: normalizedCrew.map(toCrewResponseRow),
        crew_persisted: crewSync.persisted
      }
    });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}

async function normalizeCrewAssignments(env, incomingCrew, fallbackAssignment) {
  const rawCrew = Array.isArray(incomingCrew) ? incomingCrew : [];
  const items = rawCrew.length
    ? rawCrew
    : [fallbackAssignment];

  const normalized = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] || {};
    const resolved = await resolveAssignmentActor(env, {
      assigned_to: cleanText(item.assigned_to),
      assigned_staff_user_id: cleanText(item.assigned_staff_user_id),
      assigned_staff_email: cleanEmail(item.assigned_staff_email),
      assigned_staff_name: cleanText(item.assigned_staff_name)
    });
    if (!resolved.assigned_to && !resolved.assigned_staff_user_id && !resolved.assigned_staff_email && !resolved.assigned_staff_name) continue;
    normalized.push({
      ...resolved,
      assignment_role: item.assignment_role === "lead" || item.is_lead === true ? "lead" : "crew",
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
      notes: cleanText(item.notes) || null
    });
  }

  const deduped = [];
  const seen = new Set();
  for (const row of normalized) {
    const key = [row.assigned_staff_user_id || "", row.assigned_staff_email || "", row.assigned_staff_name || row.assigned_to || ""].join("|").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  if (!deduped.length) return [];

  let leadIndex = deduped.findIndex((row) => row.assignment_role === "lead");
  if (leadIndex < 0) leadIndex = 0;

  return deduped
    .map((row, index) => ({
      ...row,
      assignment_role: index === leadIndex ? "lead" : "crew"
    }))
    .sort((a, b) => {
      if (a.assignment_role !== b.assignment_role) return a.assignment_role === "lead" ? -1 : 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
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
      assigned_staff_name: row.full_name || row.email || null
    };
  }

  return {
    assigned_to: byName || byEmail || null,
    assigned_staff_user_id: byId || null,
    assigned_staff_email: byEmail || null,
    assigned_staff_name: byName || null
  };
}

async function syncCrewAssignments(env, bookingId, crewAssignments, actor) {
  const headers = serviceHeaders(env);
  const deleteRes = await fetch(`${env.SUPABASE_URL}/rest/v1/booking_staff_assignments?booking_id=eq.${encodeURIComponent(bookingId)}`, {
    method: "DELETE",
    headers
  });

  if (!deleteRes.ok) {
    const text = await deleteRes.text().catch(() => "");
    if (text.includes("booking_staff_assignments") || deleteRes.status === 404) {
      return { persisted: false, warning: "Crew-assignment table is not available yet. Run the latest SQL migration before testing multi-detailer crews." };
    }
    return { persisted: false, warning: `Could not clear previous crew assignments. ${text}` };
  }

  if (!crewAssignments.length) return { persisted: true, warning: null };

  const payload = crewAssignments.map((row, index) => ({
    booking_id: bookingId,
    staff_user_id: row.assigned_staff_user_id || null,
    staff_email: row.assigned_staff_email || null,
    staff_name: row.assigned_staff_name || row.assigned_to || null,
    assignment_role: row.assignment_role === "lead" ? "lead" : "crew",
    sort_order: index,
    assigned_by_staff_user_id: actor?.id || null,
    assigned_by_name: actor?.full_name || actor?.email || "Staff",
    notes: row.notes || null,
    updated_at: new Date().toISOString()
  }));

  const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/booking_staff_assignments`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!insertRes.ok) {
    const text = await insertRes.text().catch(() => "");
    if (text.includes("booking_staff_assignments") || insertRes.status === 404) {
      return { persisted: false, warning: "Crew-assignment table is not available yet. Run the latest SQL migration before testing multi-detailer crews." };
    }
    return { persisted: false, warning: `Lead assignment saved, but the crew list could not be stored. ${text}` };
  }

  return { persisted: true, warning: null };
}

function toCrewResponseRow(row) {
  return {
    assigned_to: row.assigned_to || row.assigned_staff_name || row.assigned_staff_email || null,
    assigned_staff_user_id: row.assigned_staff_user_id || null,
    assigned_staff_email: row.assigned_staff_email || null,
    assigned_staff_name: row.assigned_staff_name || null,
    assignment_role: row.assignment_role === "lead" ? "lead" : "crew",
    notes: row.notes || null
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
