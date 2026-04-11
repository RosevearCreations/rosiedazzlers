import { requireStaffAccess, json, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadCrewAssignmentsMap } from "../_lib/crew-assignments.js";

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
