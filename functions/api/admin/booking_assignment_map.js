import { requireStaffAccess, serviceHeaders, json, cleanText, cleanEmail, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;

    const bookingIds = Array.isArray(body.booking_ids)
      ? body.booking_ids.map((value) => cleanText(value)).filter((value) => isUuid(value))
      : [];

    if (!bookingIds.length) {
      return json({ ok: true, assignments_by_booking: {}, warning: null });
    }

    const mapResult = await loadCrewAssignmentsMap(env, bookingIds);
    return json({ ok: true, assignments_by_booking: mapResult.map, warning: mapResult.warning || null });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}

export const onRequestGet = methodNotAllowed;

async function loadCrewAssignmentsMap(env, bookingIds) {
  const headers = serviceHeaders(env);
  const url = `${env.SUPABASE_URL}/rest/v1/booking_staff_assignments?select=booking_id,staff_user_id,staff_email,staff_name,assignment_role,sort_order,notes,created_at&booking_id=in.(${bookingIds.map((id) => encodeURIComponent(id)).join(",")})&order=booking_id.asc,sort_order.asc,created_at.asc`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (text.includes("booking_staff_assignments") || res.status === 404) {
      return { map: {}, warning: "Crew-assignment table is not available yet. Run the latest SQL migration before testing multi-detailer assignment." };
    }
    return { map: {}, warning: `Could not load crew assignments. ${text}` };
  }

  const rows = await res.json().catch(() => []);
  const map = Object.create(null);
  for (const row of Array.isArray(rows) ? rows : []) {
    const bookingId = cleanText(row.booking_id);
    if (!bookingId) continue;
    if (!map[bookingId]) map[bookingId] = [];
    map[bookingId].push({
      staff_user_id: cleanText(row.staff_user_id) || null,
      staff_email: cleanEmail(row.staff_email) || null,
      staff_name: cleanText(row.staff_name) || null,
      assignment_role: cleanText(row.assignment_role) === "lead" ? "lead" : "crew",
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
      notes: cleanText(row.notes) || null
    });
  }

  return { map, warning: null };
}
