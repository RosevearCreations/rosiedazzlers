import { requireStaffAccess, json, serviceHeaders, cleanText, methodNotAllowed } from "../_lib/staff-auth.js";

const BOOKING_SELECT = [
  "id","customer_profile_id","customer_vehicle_id","customer_name","customer_email","service_date","package_code","vehicle_size",
  "vehicle_year","vehicle_make","vehicle_model","vehicle_plate","job_status","status","completed_at","detailing_completed_at"
].join(",");
const VEHICLE_SELECT = "id,customer_profile_id,vehicle_name,model_year,make,model,vehicle_size,mileage_km,is_primary";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const url = new URL(request.url);
    const limit = clampInt(url.searchParams.get("limit"), 1, 200, 100);
    const mode = cleanText(url.searchParams.get("mode") || "unresolved").toLowerCase();
    const bookings = await fetchBookings(env, limit, mode);
    const profileIds = Array.from(new Set(bookings.map((row) => cleanText(row.customer_profile_id)).filter(Boolean)));
    const vehicles = await fetchVehicles(env, profileIds);
    const vehiclesByProfile = new Map();
    for (const vehicle of vehicles) {
      const key = cleanText(vehicle.customer_profile_id);
      const list = vehiclesByProfile.get(key) || [];
      list.push(vehicle);
      vehiclesByProfile.set(key, list);
    }
    const rows = bookings.map((booking) => ({
      ...booking,
      vehicle_candidates: booking.customer_profile_id ? (vehiclesByProfile.get(String(booking.customer_profile_id)) || []) : [],
      linkable: !!booking.customer_profile_id,
      requires_profile_resolution: !booking.customer_profile_id
    }));
    return withCors(json({
      ok: true,
      bookings: rows,
      metrics: {
        returned: rows.length,
        unresolved: rows.filter((row) => !row.customer_vehicle_id).length,
        linked: rows.filter((row) => !!row.customer_vehicle_id).length,
        requires_profile_resolution: rows.filter((row) => !row.customer_profile_id).length
      },
      authority: {
        staff_confirmed_linkage_only: true,
        automatic_historical_backfill: false,
        changes_booking_status: false,
        changes_payment: false,
        changes_schedule: false
      }
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not load booking vehicle identity." }, 500));
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const bookingId = requireUuid(body.booking_id, "booking_id");
    const unlink = body.unlink === true || body.customer_vehicle_id === null || body.customer_vehicle_id === "";
    const booking = await fetchOne(env, "bookings", BOOKING_SELECT, bookingId);
    if (!booking) return withCors(json({ ok: false, error: "Booking not found." }, 404));

    if (unlink) {
      const updated = await patchBookingVehicle(env, bookingId, null);
      return withCors(json({ ok: true, booking: updated, linked: false, automatic_backfill: false, changes_booking_status: false, changes_payment: false, changes_schedule: false }));
    }

    const vehicleId = requireUuid(body.customer_vehicle_id, "customer_vehicle_id");
    if (!booking.customer_profile_id) {
      return withCors(json({ ok: false, error: "Resolve the booking customer profile before linking a saved vehicle." }, 409));
    }
    const vehicle = await fetchOne(env, "customer_vehicles", VEHICLE_SELECT, vehicleId);
    if (!vehicle) return withCors(json({ ok: false, error: "Saved vehicle not found." }, 404));
    if (String(vehicle.customer_profile_id) !== String(booking.customer_profile_id)) {
      return withCors(json({ ok: false, error: "Saved vehicle does not belong to the booking customer profile." }, 409));
    }

    const updated = await patchBookingVehicle(env, bookingId, vehicleId);
    return withCors(json({
      ok: true,
      booking: updated,
      linked: true,
      customer_vehicle_id: vehicleId,
      staff_confirmed: true,
      automatic_backfill: false,
      changes_booking_status: false,
      changes_payment: false,
      changes_schedule: false
    }));
  } catch (err) {
    const status = err?.status || 500;
    return withCors(json({ ok: false, error: err?.message || "Could not update booking vehicle identity." }, status));
  }
}

export async function onRequestPost() { return withCors(methodNotAllowed()); }
export async function onRequestPut() { return withCors(methodNotAllowed()); }
export async function onRequestDelete() { return withCors(methodNotAllowed()); }

async function fetchBookings(env, limit, mode) {
  const params = new URLSearchParams({ select: BOOKING_SELECT, order: "service_date.desc", limit: String(limit) });
  if (mode !== "all") params.set("customer_vehicle_id", "is.null");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?${params.toString()}`, { headers: serviceHeaders(env) });
  const data = await parseResponse(res, "Could not load bookings.");
  return Array.isArray(data) ? data : [];
}

async function fetchVehicles(env, profileIds) {
  if (!profileIds.length) return [];
  const params = new URLSearchParams({ select: VEHICLE_SELECT, order: "is_primary.desc,display_order.asc" });
  params.set("customer_profile_id", `in.(${profileIds.join(",")})`);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?${params.toString()}`, { headers: serviceHeaders(env) });
  const data = await parseResponse(res, "Could not load saved vehicles.");
  return Array.isArray(data) ? data : [];
}

async function fetchOne(env, table, select, id) {
  const params = new URLSearchParams({ select, id: `eq.${id}`, limit: "1" });
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, { headers: serviceHeaders(env) });
  const data = await parseResponse(res, `Could not load ${table}.`);
  return Array.isArray(data) ? data[0] || null : null;
}

async function patchBookingVehicle(env, bookingId, vehicleId) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify({ customer_vehicle_id: vehicleId })
  });
  const data = await parseResponse(res, "Could not save booking vehicle identity.");
  return Array.isArray(data) ? data[0] || null : data;
}

async function parseResponse(res, fallback) {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) throw new Error(data?.message || data?.error || text.slice(0, 240) || fallback);
  return data;
}

function requireUuid(value, field) {
  const text = cleanText(value);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    const err = new Error(`${field} must be a valid UUID.`); err.status = 400; throw err;
  }
  return text;
}

function clampInt(value, min, max, fallback) {
  const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;
}

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,PATCH,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" };
}
function withCors(response) {
  const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
