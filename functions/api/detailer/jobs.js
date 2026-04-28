import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";
import { attachCrewAssignments, loadCrewAssignmentsMap } from "../_lib/crew-assignments.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const access = await requireStaffAccess({ request, env, capability: "work_booking", allowLegacyAdminFallback: false });
  if (!access.ok) return access.response;
  const actor = access.actor;
  const params = new URL(request.url).searchParams;
  const jobStatus = String(params.get("job_status") || "").trim();
  let url = `${env.SUPABASE_URL}/rest/v1/bookings?select=id,service_date,start_slot,status,job_status,current_workflow_stage,detailer_response_status,detailer_response_reason,customer_name,customer_email,package_code,vehicle_size,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,progress_token,progress_enabled,notes,trusted_service_latitude,trusted_service_longitude,trusted_service_coordinate_source,trusted_service_coordinate_status,trusted_service_coordinate_label,trusted_service_geofence_radius_m,arrival_device_latitude,arrival_device_longitude,arrival_geofence_status,arrival_distance_m,arrival_geofence_checked_at&order=service_date.asc,start_slot.asc`;
  if (!(actor.is_admin || actor.can_manage_bookings)) {
    const ors = [];
    const crewBookingIds = await loadCrewBookingIds(env, actor);
    if (actor.id) ors.push(`assigned_staff_user_id.eq.${encodeURIComponent(actor.id)}`);
    if (actor.email) ors.push(`assigned_staff_email.eq.${encodeURIComponent(actor.email)}`);
    if (actor.full_name) {
      const like = encodeURIComponent(`*${actor.full_name}*`);
      ors.push(`assigned_staff_name.ilike.${like}`);
      ors.push(`assigned_to.ilike.${like}`);
    }
    if (crewBookingIds.length) ors.push(`id.in.(${crewBookingIds.map((id) => encodeURIComponent(id)).join(",")})`);
    if (ors.length) url += `&or=(${ors.join(",")})`;
  }
  if (jobStatus) url += `&job_status=eq.${encodeURIComponent(jobStatus)}`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) return json({ error: `Could not load assigned jobs. ${await res.text()}` }, 500);
  const rows = await res.json().catch(() => []);
  const safeRows = Array.isArray(rows) ? rows : [];
  const crewResult = await loadCrewAssignmentsMap(env, safeRows.map((row) => row?.id));
  return json({ ok: true, actor, jobs: attachCrewAssignments(safeRows, crewResult.map), crew_warning: crewResult.warning || null });
}

export const onRequestPost = methodNotAllowed;

async function loadCrewBookingIds(env, actor) {
  const orParts = [];
  if (actor.id) orParts.push(`staff_user_id.eq.${encodeURIComponent(actor.id)}`);
  if (actor.email) orParts.push(`staff_email.eq.${encodeURIComponent(String(actor.email).trim().toLowerCase())}`);
  if (actor.full_name) orParts.push(`staff_name.ilike.${encodeURIComponent(`*${actor.full_name}*`)}`);
  if (!orParts.length) return [];

  const url = `${env.SUPABASE_URL}/rest/v1/booking_staff_assignments?select=booking_id&or=(${orParts.join(",")})&limit=200`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  const ids = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row && typeof row.booking_id === "string" && row.booking_id) ids.add(row.booking_id);
  }
  return Array.from(ids);
}
