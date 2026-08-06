import { fetchVehicleModelsForMakeYear, cacheVehicleModels } from "../_lib/vehicle-catalog.js";
import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({
    request,
    env,
    capability: "manage_bookings",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return access.response;

  try {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year") || 0);
    const make = String(url.searchParams.get("make") || "").trim();

    if (!year || !make) {
      return withCors(json({ error: "year and make are required." }, 400));
    }

    const models = await fetchVehicleModelsForMakeYear({ make, year });
    await cacheVehicleModels({ env, rows: models, year });

    return withCors(json({ ok: true, year, make, models }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Could not load vehicle models." }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
