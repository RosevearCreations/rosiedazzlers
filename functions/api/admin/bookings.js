import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";
import { attachCrewAssignments, loadCrewAssignmentsMap } from "../_lib/crew-assignments.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const bookingId = String(body.booking_id || "").trim();
    const status = body.status == null ? null : String(body.status).trim();
    const jobStatus = body.job_status == null ? null : String(body.job_status).trim();

    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;

    if (!bookingId) {
      const listResult = await loadBookingsWithOptionalIntakeFields(env);
      if (!listResult.ok) return json({ error: listResult.error }, 500);
      const bookings = listResult.bookings;
      const safeBookings = Array.isArray(bookings) ? bookings : [];
      const crewResult = await loadCrewAssignmentsMap(env, safeBookings.map((row) => row?.id));
      return json({
        ok: true,
        actor: { id: access.actor?.id || null, full_name: access.actor?.full_name || null },
        bookings: attachCrewAssignments(safeBookings, crewResult.map),
        crew_warning: crewResult.warning || null
      });
    }

    if (!isUuid(bookingId)) return json({ error: "Valid booking_id is required." }, 400);
    const patch = {};
    if (status !== null) patch.status = status;
    if (jobStatus !== null) patch.job_status = jobStatus || null;
    if (!Object.keys(patch).length) return json({ error: "Nothing to update." }, 400);
    if (patch.status === "completed" || patch.job_status === "completed") patch.completed_at = new Date().toISOString();
    patch.updated_at = new Date().toISOString();

    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, { method: "PATCH", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(patch) });
    if (!patchRes.ok) return json({ error: `Could not update booking. ${await patchRes.text()}` }, 500);
    const rows = await patchRes.json().catch(() => []);
    const booking = Array.isArray(rows) ? rows[0] || null : null;
    if (!booking) return json({ error: "Booking not found." }, 404);
    const crewResult = await loadCrewAssignmentsMap(env, [booking.id]);
    const bookingWithCrew = attachCrewAssignments([booking], crewResult.map)[0] || booking;

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method: "POST", headers: serviceHeaders(env), body: JSON.stringify([{ booking_id: bookingId, event_type: "booking_status_updated", actor_name: access.actor?.full_name || access.actor?.email || "Staff", event_note: `Status=${patch.status || booking.status || ""}; Job=${patch.job_status || booking.job_status || ""}`.trim(), payload: patch }]) }).catch(() => null);

    return json({ ok: true, booking: bookingWithCrew, crew_warning: crewResult.warning || null });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}


const BASE_BOOKING_LIST_SELECT = [
  "id",
  "status",
  "job_status",
  "customer_name",
  "customer_email",
  "service_date",
  "start_slot",
  "duration_slots",
  "service_area",
  "service_area_county",
  "service_area_municipality",
  "service_area_zone",
  "package_code",
  "vehicle_size",
  "vehicle_year",
  "vehicle_make",
  "vehicle_model",
  "price_total_cents",
  "assigned_to",
  "assigned_staff_user_id",
  "assigned_staff_email",
  "assigned_staff_name",
  "progress_enabled",
  "progress_token",
  "created_at",
  "notes",
  "trusted_service_latitude",
  "trusted_service_longitude",
  "trusted_service_coordinate_source",
  "trusted_service_coordinate_status",
  "trusted_service_coordinate_label",
  "trusted_service_geofence_radius_m",
  "arrival_device_latitude",
  "arrival_device_longitude",
  "arrival_geofence_status",
  "arrival_distance_m",
  "arrival_geofence_checked_at"
];

const OPTIONAL_BOOKING_INTAKE_SELECT = [
  "condition_flags",
  "condition_recommendation",
  "photo_estimate_requested",
  "photo_estimate_links",
  "media_consent_preference",
  "media_consent_reviewed_at",
  "photo_estimate_status",
  "condition_review_status",
  "media_privacy_status",
  "plate_privacy_reviewed",
  "face_privacy_reviewed",
  "address_privacy_reviewed",
  "blur_crop_needed",
  "blur_crop_complete",
  "intake_review_note",
  "intake_reviewed_at",
  "intake_reviewed_by",
  "vehicle_size_review_status",
  "vehicle_size_original",
  "vehicle_size_catalog_expected",
  "vehicle_size_review_reason",
  "vehicle_size_reviewed_size",
  "vehicle_size_reviewed_price_cents",
  "vehicle_size_reviewed_at",
  "vehicle_size_reviewed_by",
  "vehicle_size_review_expires_at",
  "vehicle_size_customer_response",
  "vehicle_size_customer_responded_at"
];

async function loadBookingsWithOptionalIntakeFields(env) {
  const baseUrl = `${env.SUPABASE_URL}/rest/v1/bookings`;
  const extendedSelect = BASE_BOOKING_LIST_SELECT.concat(OPTIONAL_BOOKING_INTAKE_SELECT).join(",");
  const baseSelect = BASE_BOOKING_LIST_SELECT.join(",");
  const order = "service_date.asc,created_at.desc";

  let res = await fetch(`${baseUrl}?select=${encodeURIComponent(extendedSelect)}&order=${encodeURIComponent(order)}`, { headers: serviceHeaders(env) });
  let text = await res.text();

  if (!res.ok && looksLikeMissingOptionalIntakeColumn(text)) {
    res = await fetch(`${baseUrl}?select=${encodeURIComponent(baseSelect)}&order=${encodeURIComponent(order)}`, { headers: serviceHeaders(env) });
    text = await res.text();
  }

  if (!res.ok) return { ok: false, error: `Could not load bookings. ${text}` };

  let rows = [];
  try { rows = text ? JSON.parse(text) : []; } catch {}
  return { ok: true, bookings: Array.isArray(rows) ? rows : [] };
}

function looksLikeMissingOptionalIntakeColumn(raw) {
  const text = String(raw || "").toLowerCase();
  return OPTIONAL_BOOKING_INTAKE_SELECT.some((field) =>
    text.includes(field.toLowerCase()) &&
    (text.includes("column") || text.includes("schema cache") || text.includes("could not find") || text.includes("42703"))
  );
}
