import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";
import { attachCrewAssignments, loadCrewAssignmentsMap } from "../_lib/crew-assignments.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const access = await requireStaffAccess({ request, env, capability: "work_booking", allowLegacyAdminFallback: false });
  if (!access.ok) return access.response;
  const actor = access.actor;
  const params = new URL(request.url).searchParams;
  const jobStatus = String(params.get("job_status") || "").trim();
  const scope = String(params.get("scope") || "").trim().toLowerCase();
  const mobile745 = scope === "mobile_v745";
  // Build 745 mobile snapshots require a real signed-in staff session. Bridge
  // headers and name-only assignment matching are not sufficient authority.
  if (mobile745 && access.auth_mode !== 'session') return json({ ok:false, error:'Sign in with your staff account to load the mobile job board.' },401);
  const workspace = scope === "workspace" || mobile745;
  let url = `${env.SUPABASE_URL}/rest/v1/bookings?select=id,updated_at,service_date,start_slot,status,job_status,current_workflow_stage,detailer_response_status,detailer_response_reason,customer_name,customer_email,package_code,vehicle_size,city,service_area,service_area_municipality,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,progress_token,progress_enabled,notes,trusted_service_latitude,trusted_service_longitude,trusted_service_coordinate_source,trusted_service_coordinate_status,trusted_service_coordinate_label,trusted_service_geofence_radius_m,arrival_device_latitude,arrival_device_longitude,arrival_geofence_status,arrival_distance_m,arrival_geofence_checked_at,progress_last_staff_viewed_at,progress_last_customer_message_at,completed_summary_status&order=service_date.asc,start_slot.asc`;
  if (workspace) {
    url += `&service_date=gte.${workspaceStartDate()}&limit=80`;
  } else {
    url += `&limit=250`;
  }
  if (!(actor.is_admin || actor.can_manage_bookings)) {
    const ors = [];
    const crewBookingIds = await loadCrewBookingIds(env, actor, { canonicalOnly: mobile745 });
    if (actor.id) ors.push(`assigned_staff_user_id.eq.${encodeURIComponent(actor.id)}`);
    if (actor.email) ors.push(`assigned_staff_email.eq.${encodeURIComponent(actor.email)}`);
    if (!mobile745 && actor.full_name) {
      const like = encodeURIComponent(`*${actor.full_name}*`);
      ors.push(`assigned_staff_name.ilike.${like}`);
      ors.push(`assigned_to.ilike.${like}`);
    }
    if (crewBookingIds.length) ors.push(`id.in.(${crewBookingIds.map((id) => encodeURIComponent(id)).join(",")})`);
    if (!ors.length) return json({ ok: true, actor:mobile745?mobileActor745(actor):actor, jobs: [], workspace: mobile745 ? mobileMetadata745(0) : workspace ? workspaceMetadata(0) : null });
    url += `&or=(${ors.join(",")})`;
  }
  if (jobStatus) url += `&job_status=eq.${encodeURIComponent(jobStatus)}`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) return json({ error: `Could not load assigned jobs. ${await res.text()}` }, 500);
  const rows = await res.json().catch(() => []);
  const safeRows = Array.isArray(rows) ? rows : [];
  if (mobile745) {
    return json({ok:true,actor:mobileActor745(actor),jobs:safeRows.map(mobileJob745),
      workspace:mobileMetadata745(safeRows.length),crew_warning:null});
  }
  if (workspace) {
    // Build 264: the mobile workspace is intentionally bounded and does not fan out
    // into crew-summary/unread-feed lookups until a job is explicitly opened.
    return json({ ok: true, actor, jobs: safeRows, crew_warning: null, workspace: workspaceMetadata(safeRows.length) });
  }
  const crewResult = await loadCrewAssignmentsMap(env, safeRows.map((row) => row?.id));
  const unreadMap = await loadUnreadCustomerCounts(env, safeRows);
  const jobs = attachCrewAssignments(safeRows, crewResult.map).map((row)=>({ ...row, unread_customer_count: unreadMap.get(row.id) || 0 }));
  return json({ ok: true, actor, jobs, crew_warning: crewResult.warning || null });
}

export const onRequestPost = methodNotAllowed;

async function loadCrewBookingIds(env, actor, { canonicalOnly = false } = {}) {
  const orParts = [];
  if (actor.id) orParts.push(`staff_user_id.eq.${encodeURIComponent(actor.id)}`);
  if (actor.email) orParts.push(`staff_email.eq.${encodeURIComponent(String(actor.email).trim().toLowerCase())}`);
  if (!canonicalOnly && actor.full_name) orParts.push(`staff_name.ilike.${encodeURIComponent(`*${actor.full_name}*`)}`);
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


async function loadUnreadCustomerCounts(env, bookings) {
  const out = new Map();
  const ids = (Array.isArray(bookings)?bookings:[]).map((r)=>r?.id).filter(Boolean);
  if (!ids.length) return out;
  const inList = ids.map((id)=>encodeURIComponent(id)).join(',');
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/job_updates?select=booking_id,created_at,source_channel&booking_id=in.(${inList})&source_channel=eq.customer&order=created_at.desc&limit=1000`, { headers: serviceHeaders(env) }).catch(()=>null);
  if (!res || !res.ok) return out;
  const rows = await res.json().catch(()=>[]);
  const viewed = new Map((Array.isArray(bookings)?bookings:[]).map((r)=>[r.id, r.progress_last_staff_viewed_at ? new Date(r.progress_last_staff_viewed_at).getTime() : 0]));
  for (const row of Array.isArray(rows)?rows:[]) {
    if (new Date(row.created_at||0).getTime() > (viewed.get(row.booking_id)||0)) out.set(row.booking_id,(out.get(row.booking_id)||0)+1);
  }
  return out;
}

function workspaceStartDate() {
  // Keep a two-day overlap so an unusually long/overnight active job is not hidden.
  return new Date(Date.now() - (2 * 86400000)).toISOString().slice(0, 10);
}

function workspaceMetadata(count) {
  return {
    build: 264,
    scope: "workspace",
    bounded: true,
    row_limit: 80,
    rows: Number(count || 0),
    automatic_refresh: false,
    live_job_monitoring: false,
    extra_feed_queries_deferred_until_job_open: true
  };
}

function mobileActor745(actor) {
  return {id:actor.id,role_code:actor.role_code,full_name:actor.full_name,is_active:actor.is_active};
}
function mobileJob745(row) {
  // Do not return customer email, assignment identities, trusted coordinates or
  // device location. Job notes are authorized staff instructions and remain in memory.
  const fields=['id','updated_at','service_date','start_slot','status','job_status','current_workflow_stage',
    'detailer_response_status','customer_name','package_code','vehicle_size','city','service_area',
    'service_area_municipality','progress_token','progress_enabled','notes','completed_summary_status'];
  return Object.fromEntries(fields.map(field=>[field,row[field]??null]));
}
function mobileMetadata745(count) {
  return {...workspaceMetadata(count),build:745,session_verified:true,canonical_assignment_only:true,
    name_matching:false,automatic_replay:false,offline_snapshot_persisted:false,
    route_order:'service_date_then_start_slot',customer_contact_details_exposed:false};
}
