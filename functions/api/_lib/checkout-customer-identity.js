import { getCurrentCustomerSession, serviceHeaders } from "../client/_lib/customer-session.js";

const BOOKING_VEHICLE_SELECTOR_COOKIE = "rd_booking_vehicle_selector";

export async function resolveCheckoutCustomerIdentity({
  request,
  env,
  body,
  sessionResolver = getCurrentCustomerSession,
  vehicleLoader = loadOwnedCustomerVehicle
}) {
  const clientProfileId = cleanText(body?.customer_profile_id);
  if (clientProfileId) {
    return fail(400, "customer_profile_id is server-managed and cannot be supplied by checkout.", "client_profile_id_rejected");
  }

  const bodyVehicleId = cleanText(body?.customer_vehicle_id);
  const cookieVehicleId = readCookie(request, BOOKING_VEHICLE_SELECTOR_COOKIE);
  if (bodyVehicleId && cookieVehicleId && bodyVehicleId !== cookieVehicleId) {
    return fail(400, "Saved vehicle selection changed. Choose the garage vehicle again before checkout.", "saved_vehicle_selector_conflict");
  }
  const selectedVehicleId = bodyVehicleId || cookieVehicleId;

  const sessionState = await sessionResolver({ env, request });
  const profile = sessionState?.customer_profile || null;
  const profileId = cleanText(profile?.id);

  if (!profileId) {
    if (selectedVehicleId) {
      return fail(401, "Sign in again before booking with a saved garage vehicle.", "saved_vehicle_requires_session");
    }
    return {
      ok: true,
      customer_profile_id: null,
      customer_vehicle_id: null,
      source: "guest",
      authenticated: false
    };
  }

  if (!selectedVehicleId) {
    return {
      ok: true,
      customer_profile_id: profileId,
      customer_vehicle_id: null,
      source: "authenticated_profile",
      authenticated: true
    };
  }

  const ownedVehicle = await vehicleLoader({ env, customerProfileId: profileId, customerVehicleId: selectedVehicleId });
  if (!ownedVehicle || cleanText(ownedVehicle.id) !== selectedVehicleId || cleanText(ownedVehicle.customer_profile_id) !== profileId) {
    return fail(403, "The selected saved vehicle is not available for this customer account.", "saved_vehicle_ownership_failed");
  }

  return {
    ok: true,
    customer_profile_id: profileId,
    customer_vehicle_id: selectedVehicleId,
    customer_vehicle: ownedVehicle,
    source: "authenticated_saved_vehicle",
    authenticated: true
  };
}

export async function loadOwnedCustomerVehicle({ env, customerProfileId, customerVehicleId }) {
  const profileId = cleanText(customerProfileId);
  const vehicleId = cleanText(customerVehicleId);
  if (!profileId || !vehicleId) return null;

  const select = "id,customer_profile_id,vehicle_name,model_year,make,model,vehicle_size";
  const url = `${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=${select}` +
    `&id=eq.${encodeURIComponent(vehicleId)}` +
    `&customer_profile_id=eq.${encodeURIComponent(profileId)}` +
    `&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not verify saved vehicle ownership. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export function bookingVehicleSelectorCookieName() {
  return BOOKING_VEHICLE_SELECTOR_COOKIE;
}

function readCookie(request, name) {
  const cookieHeader = request?.headers?.get?.("cookie") || "";
  for (const part of String(cookieHeader).split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key !== name) continue;
    try { return cleanText(decodeURIComponent(value)); } catch { return cleanText(value); }
  }
  return "";
}

function fail(status, error, reason) {
  return {
    ok: false,
    status,
    error,
    reason,
    customer_profile_id: null,
    customer_vehicle_id: null,
    authenticated: false
  };
}

function cleanText(value) {
  return String(value || "").trim();
}
