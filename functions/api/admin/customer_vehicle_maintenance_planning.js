import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";
import { loadMembershipPlanSettings, buildMembershipReminderCandidates } from "../_lib/membership-reminders.js";
import { normalizeFleetMaintenancePatch, fleetMaintenanceDueState, isUuid, writableFleetMaintenanceFields } from "../_lib/fleet-maintenance-planning.js";

const VEHICLE_SELECT = [
  "id", "customer_profile_id", "created_at", "updated_at", "is_primary", "vehicle_name",
  "model_year", "make", "model", "color", "mileage_km", "vehicle_size", "body_style", "vehicle_category",
  "next_cleaning_due_at", "service_interval_days", "next_service_mileage_km", "auto_schedule_opt_in",
  "last_package_code", "last_addons", "notification_opt_in"
].join(",");

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({
      request,
      env,
      capability: "view_clients",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);
    return withCors(await buildFleetPlanningResponse({ request, env }));
  } catch (err) {
    console.error("Could not load fleet maintenance planning.", err);
    return withCors(json({ error: "Could not load fleet maintenance planning." }, 500));
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_clients",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const vehicleId = String(body.vehicle_id || body.id || "").trim();
    if (!isUuid(vehicleId)) return withCors(json({ error: "A valid saved vehicle id is required." }, 400));

    const current = await fetchVehicleById(env, vehicleId);
    if (!current) return withCors(json({ error: "Saved vehicle not found." }, 404));

    const normalized = normalizeFleetMaintenancePatch(body, current);
    if (!normalized.ok) return withCors(json({ error: normalized.error }, 400));

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?id=eq.${encodeURIComponent(vehicleId)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(normalized.patch)
    });
    const rows = await res.json().catch(() => []);
    const saved = Array.isArray(rows) ? rows[0] || null : null;
    if (!res.ok || !saved) {
      console.error("Fleet maintenance vehicle update failed.", { status: res.status, vehicle_id: vehicleId });
      return withCors(json({ error: "Could not save fleet maintenance planning." }, 500));
    }

    return withCors(json({
      ok: true,
      vehicle: shapeVehicle(saved, null, null),
      writable_fields: writableFleetMaintenanceFields(),
      automatic_scheduling: false,
      appointment_creation: false,
      recurring_billing: false
    }));
  } catch (err) {
    console.error("Could not update fleet maintenance planning.", err);
    return withCors(json({ error: "Could not update fleet maintenance planning." }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}
export async function onRequestPut() { return withCors(methodNotAllowed(["GET", "POST", "OPTIONS"])); }
export async function onRequestPatch() { return withCors(methodNotAllowed(["GET", "POST", "OPTIONS"])); }
export async function onRequestDelete() { return withCors(methodNotAllowed(["GET", "POST", "OPTIONS"])); }

async function buildFleetPlanningResponse({ request, env }) {
  const [vehicles, settings] = await Promise.all([
    fetchVehicles(env),
    loadMembershipPlanSettings(env)
  ]);
  const profileIds = Array.from(new Set(vehicles.map((row) => String(row.customer_profile_id || "").trim()).filter(Boolean)));
  const [profiles, candidates] = await Promise.all([
    fetchProfiles(env, profileIds),
    buildMembershipReminderCandidates(env, settings, {
      origin: String(env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, ""),
      limit: 500
    })
  ]);
  const candidateByVehicle = new Map(
    candidates.filter((row) => row?.customer_vehicle_id).map((row) => [String(row.customer_vehicle_id), row])
  );

  const plannedVehicles = vehicles.map((vehicle) => {
    const profile = profiles.get(String(vehicle.customer_profile_id || "")) || null;
    const candidate = candidateByVehicle.get(String(vehicle.id)) || null;
    return shapeVehicle(vehicle, profile, candidate);
  });
  plannedVehicles.sort((a, b) => {
    if (a.due !== b.due) return a.due ? -1 : 1;
    if (a.planned !== b.planned) return a.planned ? -1 : 1;
    return `${a.customer_name || ""} ${a.vehicle_label || ""}`.localeCompare(`${b.customer_name || ""} ${b.vehicle_label || ""}`);
  });

  const unresolved = candidates
    .filter((row) => !row?.customer_vehicle_id || row?.vehicle_identity_reliable === false)
    .map((row) => ({
      candidate_key: row.candidate_key || null,
      customer_profile_id: row.customer_profile_id || null,
      customer_name: row.full_name || "Customer",
      vehicle_label: row.vehicle_label || "Vehicle identity needs review",
      last_service_at: row.last_service_at || null,
      booking_count: Number(row.booking_count || 0),
      due: false,
      due_reason: "vehicle_identity_required"
    }));

  return json({
    ok: true,
    vehicles: plannedVehicles,
    unresolved_vehicle_histories: unresolved,
    metrics: {
      saved_vehicle_count: plannedVehicles.length,
      planned_vehicle_count: plannedVehicles.filter((row) => row.planned).length,
      due_vehicle_count: plannedVehicles.filter((row) => row.due).length,
      interval_planned_count: plannedVehicles.filter((row) => row.service_interval_days !== null).length,
      due_date_planned_count: plannedVehicles.filter((row) => row.next_cleaning_due_at).length,
      mileage_planned_count: plannedVehicles.filter((row) => row.next_service_mileage_km !== null).length,
      unresolved_history_count: unresolved.length,
      auto_schedule_enabled_count: plannedVehicles.filter((row) => row.auto_schedule_opt_in === true).length
    },
    readiness: {
      staff_planning_enabled: true,
      automatic_scheduling: false,
      appointment_creation: false,
      recurring_billing: false,
      customer_contact_write: false
    },
    writable_fields: writableFleetMaintenanceFields()
  });
}

async function fetchVehicles(env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=${VEHICLE_SELECT}&order=updated_at.desc,created_at.desc&limit=500`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`customer_vehicle_read_failed_${res.status}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function fetchVehicleById(env, vehicleId) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=${VEHICLE_SELECT}&id=eq.${encodeURIComponent(vehicleId)}&limit=1`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function fetchProfiles(env, ids) {
  if (!ids.length) return new Map();
  const filter = ids.map((id) => encodeURIComponent(id)).join(",");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,full_name,email,phone,postal_code&id=in.(${filter})`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) return new Map();
  const rows = await res.json().catch(() => []);
  return new Map((Array.isArray(rows) ? rows : []).map((row) => [String(row.id), row]));
}

function shapeVehicle(vehicle, profile, candidate) {
  const due = fleetMaintenanceDueState(vehicle, candidate);
  return {
    id: vehicle?.id || null,
    customer_profile_id: vehicle?.customer_profile_id || null,
    customer_name: profile?.full_name || candidate?.full_name || "Customer",
    customer_email: profile?.email || candidate?.email || null,
    postal_code: profile?.postal_code || candidate?.postal_code || null,
    vehicle_label: vehicleLabel(vehicle),
    vehicle_name: vehicle?.vehicle_name || null,
    model_year: vehicle?.model_year ?? null,
    make: vehicle?.make || null,
    model: vehicle?.model || null,
    color: vehicle?.color || null,
    vehicle_size: vehicle?.vehicle_size || null,
    body_style: vehicle?.body_style || null,
    vehicle_category: vehicle?.vehicle_category || null,
    is_primary: vehicle?.is_primary === true,
    mileage_km: numberOrNull(vehicle?.mileage_km),
    service_interval_days: numberOrNull(vehicle?.service_interval_days),
    next_cleaning_due_at: vehicle?.next_cleaning_due_at || null,
    next_service_mileage_km: numberOrNull(vehicle?.next_service_mileage_km),
    auto_schedule_opt_in: vehicle?.auto_schedule_opt_in === true,
    last_package_code: vehicle?.last_package_code || candidate?.latest_package_code || null,
    booking_count: Number(candidate?.booking_count || 0),
    last_service_at: candidate?.last_service_at || null,
    complete_detail_eligible: candidate?.eligible_for_maintenance === true,
    cycle_days: candidate?.cycle_days ?? numberOrNull(vehicle?.service_interval_days),
    cycle_source: candidate?.cycle_source || (vehicle?.service_interval_days ? "staff_vehicle_override" : "not_set"),
    reminder_due: candidate?.due === true,
    reminder_due_reason: candidate?.due_reason || (candidate ? "not_due" : "no_completed_history"),
    vehicle_identity_reliable: candidate ? candidate?.vehicle_identity_reliable !== false : true,
    planned: due.planned,
    due: due.due,
    due_by_date: due.due_by_date,
    due_by_mileage: due.due_by_mileage,
    due_reason: due.reason,
    updated_at: vehicle?.updated_at || null
  };
}

function vehicleLabel(vehicle) {
  const named = String(vehicle?.vehicle_name || "").trim();
  if (named) return named;
  const parts = [vehicle?.model_year, vehicle?.make, vehicle?.model].map((value) => String(value || "").trim()).filter(Boolean);
  return parts.join(" ") || "Saved vehicle";
}

function numberOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
