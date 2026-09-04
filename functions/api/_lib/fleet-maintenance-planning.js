const WRITABLE_FIELDS = Object.freeze([
  "service_interval_days",
  "next_cleaning_due_at",
  "next_service_mileage_km"
]);

const BODY_META_FIELDS = new Set(["vehicle_id", "id", "staff_user_id", "staff_email", ...WRITABLE_FIELDS]);

export function normalizeFleetMaintenancePatch(input, currentVehicle = {}) {
  const body = input && typeof input === "object" ? input : {};
  const unknown = Object.keys(body).filter((key) => !BODY_META_FIELDS.has(key));
  if (unknown.length) {
    return { ok: false, error: `Unsupported fleet maintenance field: ${unknown[0]}.` };
  }
  if (Object.prototype.hasOwnProperty.call(body, "auto_schedule_opt_in")) {
    return { ok: false, error: "Automatic scheduling cannot be changed from the fleet maintenance workbench." };
  }

  const patch = {};
  if (Object.prototype.hasOwnProperty.call(body, "service_interval_days")) {
    const value = nullableWholeNumber(body.service_interval_days);
    if (value !== null && (!Number.isFinite(value) || value < 14 || value > 84)) {
      return { ok: false, error: "Service interval must be a whole number between 14 and 84 days." };
    }
    patch.service_interval_days = value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "next_cleaning_due_at")) {
    const value = nullableDate(body.next_cleaning_due_at);
    if (value === undefined) return { ok: false, error: "Next cleaning due date must use YYYY-MM-DD." };
    patch.next_cleaning_due_at = value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "next_service_mileage_km")) {
    const value = nullableWholeNumber(body.next_service_mileage_km);
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 2000000)) {
      return { ok: false, error: "Next service mileage must be a whole number between 0 and 2,000,000 km." };
    }
    const currentMileage = finiteNumber(currentVehicle?.mileage_km);
    if (value !== null && currentMileage !== null && value < currentMileage) {
      return { ok: false, error: "Next service mileage cannot be below the vehicle's current mileage." };
    }
    patch.next_service_mileage_km = value;
  }

  if (!Object.keys(patch).length) {
    return { ok: false, error: "No fleet maintenance planning fields were supplied." };
  }
  return { ok: true, patch };
}

export function fleetMaintenanceDueState(vehicle = {}, reminderCandidate = null, now = new Date()) {
  const today = utcDateKey(now);
  const dueDate = cleanDate(vehicle?.next_cleaning_due_at) || isoDateKey(reminderCandidate?.next_reminder_at);
  const currentMileage = finiteNumber(vehicle?.mileage_km);
  const targetMileage = finiteNumber(vehicle?.next_service_mileage_km);
  const dueByDate = Boolean(dueDate && dueDate <= today);
  const dueByMileage = currentMileage !== null && targetMileage !== null && currentMileage >= targetMileage;
  const hasPlan = Boolean(dueDate || targetMileage !== null || finiteNumber(vehicle?.service_interval_days) !== null);
  let reason = "not_planned";
  if (dueByDate && dueByMileage) reason = "date_and_mileage_due";
  else if (dueByDate) reason = "date_due";
  else if (dueByMileage) reason = "mileage_due";
  else if (dueDate) reason = "scheduled";
  else if (hasPlan) reason = "planned_without_due_date";
  else if (reminderCandidate?.due_reason) reason = String(reminderCandidate.due_reason);
  return {
    due: dueByDate || dueByMileage,
    due_by_date: dueByDate,
    due_by_mileage: dueByMileage,
    due_date: dueDate || null,
    current_mileage_km: currentMileage,
    next_service_mileage_km: targetMileage,
    planned: hasPlan,
    reason
  };
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

export function writableFleetMaintenanceFields() {
  return [...WRITABLE_FIELDS];
}

function nullableWholeNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || !Number.isInteger(number)) return Number.NaN;
  return number;
}

function nullableDate(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return undefined;
  const date = new Date(`${text}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) return undefined;
  return text;
}

function cleanDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function isoDateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function utcDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function finiteNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
