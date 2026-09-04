import { serviceHeaders } from "./staff-auth.js";

const EXTERIOR_WASH_PACKAGE_CODES = new Set([
  "premium_wash",
  "complete_detail",
  "exterior_detail"
]);

const FORBIDDEN_PLANNING_FIELDS = Object.freeze([
  "service_interval_days",
  "next_cleaning_due_at",
  "next_service_mileage_km",
  "auto_schedule_opt_in"
]);

export function buildCompletedVehicleHistoryPatch({ booking, vehicle, now = new Date() }) {
  const row = booking && typeof booking === "object" ? booking : {};
  const savedVehicle = vehicle && typeof vehicle === "object" ? vehicle : {};

  if (String(row.job_status || "").trim().toLowerCase() !== "completed") {
    return skipped("booking_not_completed");
  }

  const profileId = cleanText(row.customer_profile_id);
  const vehicleId = cleanText(row.customer_vehicle_id);
  if (!profileId || !vehicleId) {
    return skipped("durable_vehicle_identity_required");
  }

  if (cleanText(savedVehicle.id) !== vehicleId || cleanText(savedVehicle.customer_profile_id) !== profileId) {
    return skipped("vehicle_ownership_mismatch");
  }

  const serviceDate = normalizeDate(row.service_date);
  if (!serviceDate) return skipped("service_date_required");

  const packageCode = cleanText(row.package_code);
  if (!packageCode) return skipped("package_code_required");

  const patch = {
    last_package_code: packageCode,
    last_addons: normalizeAddons(row.addons),
    updated_at: validIso(now)
  };

  if (EXTERIOR_WASH_PACKAGE_CODES.has(packageCode)) {
    patch.last_wash_at = serviceDate;
  }

  const bookingMileage = nonNegativeWholeNumber(row.vehicle_mileage_km);
  const currentMileage = nonNegativeWholeNumber(savedVehicle.mileage_km);
  if (bookingMileage !== null && (currentMileage === null || bookingMileage >= currentMileage)) {
    patch.mileage_km = bookingMileage;
  }

  return {
    ok: true,
    skipped: false,
    reason: "completed_vehicle_history_ready",
    patch,
    customer_profile_id: profileId,
    customer_vehicle_id: vehicleId
  };
}

export async function syncCompletedBookingVehicleHistory({ env, booking, fetchImpl = fetch, now = new Date() }) {
  const row = booking && typeof booking === "object" ? booking : {};
  if (String(row.job_status || "").trim().toLowerCase() !== "completed") {
    return skipped("booking_not_completed");
  }

  const profileId = cleanText(row.customer_profile_id);
  const vehicleId = cleanText(row.customer_vehicle_id);
  if (!profileId || !vehicleId) {
    return skipped("durable_vehicle_identity_required");
  }

  const select = "id,customer_profile_id,mileage_km,last_wash_at,last_package_code,last_addons,service_interval_days,next_cleaning_due_at,next_service_mileage_km,auto_schedule_opt_in";
  const query = `${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=${select}` +
    `&id=eq.${encodeURIComponent(vehicleId)}` +
    `&customer_profile_id=eq.${encodeURIComponent(profileId)}` +
    `&limit=1`;
  const getRes = await fetchImpl(query, { headers: serviceHeaders(env) });
  if (!getRes.ok) {
    return failed("vehicle_lookup_failed", `Could not verify completed-booking vehicle ownership. ${await getRes.text()}`);
  }

  const rows = await getRes.json().catch(() => []);
  const savedVehicle = Array.isArray(rows) ? rows[0] || null : null;
  if (!savedVehicle) return skipped("vehicle_not_owned_by_profile");

  const prepared = buildCompletedVehicleHistoryPatch({ booking: row, vehicle: savedVehicle, now });
  if (!prepared.ok) return prepared;

  for (const field of FORBIDDEN_PLANNING_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(prepared.patch, field)) {
      return failed("planning_field_write_blocked", `Completed-service sync cannot write ${field}.`);
    }
  }

  const patchUrl = `${env.SUPABASE_URL}/rest/v1/customer_vehicles` +
    `?id=eq.${encodeURIComponent(vehicleId)}` +
    `&customer_profile_id=eq.${encodeURIComponent(profileId)}`;
  const patchRes = await fetchImpl(patchUrl, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(prepared.patch)
  });
  if (!patchRes.ok) {
    return failed("vehicle_history_patch_failed", `Could not synchronize completed-service vehicle history. ${await patchRes.text()}`);
  }

  const updatedRows = await patchRes.json().catch(() => []);
  const updated = Array.isArray(updatedRows) ? updatedRows[0] || null : null;
  if (!updated || cleanText(updated.id) !== vehicleId || cleanText(updated.customer_profile_id) !== profileId) {
    return failed("vehicle_history_patch_not_confirmed", "Completed-service vehicle history update was not confirmed for the owned vehicle.");
  }

  return {
    ok: true,
    skipped: false,
    reason: "completed_vehicle_history_synced",
    customer_profile_id: profileId,
    customer_vehicle_id: vehicleId,
    updated_fields: Object.keys(prepared.patch).sort()
  };
}

export function completedVehicleHistoryExteriorPackages() {
  return [...EXTERIOR_WASH_PACKAGE_CODES];
}

export function completedVehicleHistoryForbiddenPlanningFields() {
  return [...FORBIDDEN_PLANNING_FIELDS];
}

function normalizeAddons(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).map((item) => {
    if (typeof item === "string") return { code: cleanText(item) };
    if (!item || typeof item !== "object") return null;
    const code = cleanText(item.code);
    const label = cleanText(item.label || item.name);
    const cents = finiteIntegerOrNull(item.cents);
    const quoteRequired = item.quote_required === true;
    if (!code && !label) return null;
    return {
      ...(code ? { code } : {}),
      ...(label ? { label } : {}),
      ...(cents !== null ? { cents } : {}),
      quote_required: quoteRequired
    };
  }).filter(Boolean);
}

function normalizeDate(value) {
  const text = cleanText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const parsed = new Date(`${text}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) return null;
  return text;
}

function nonNegativeWholeNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 2000000 ? number : null;
}

function finiteIntegerOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function validIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function skipped(reason) {
  return { ok: true, skipped: true, reason };
}

function failed(reason, error) {
  return { ok: false, skipped: false, reason, error };
}

function cleanText(value) {
  return String(value || "").trim();
}
