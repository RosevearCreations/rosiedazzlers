// functions/api/_lib/staff-auth.js
//
// Bridge auth for Rosie Dazzlers.
//
// Purpose:
// - keep current ADMIN_PASSWORD flow working
// - add real staff role/capability checks using staff_users
// - support assignment-aware detailer access for field endpoints
//
// Current transition model:
// 1) request still needs valid x-admin-password (shared shell protection)
// 2) request should also send x-staff-email (or body.staff_email)
// 3) this helper resolves the acting staff user and enforces capability
//
// Later, when real login/session exists, only this helper should need major change.

export async function requireStaffAccess({
  request,
  env,
  capability,
  body = null,
  bookingId = null,
  allowLegacyAdminFallback = true
}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return deny(500, "Server configuration is incomplete.");
  }

  const suppliedPassword = String(request.headers.get("x-admin-password") || "").trim();
  const expectedPassword = String(env.ADMIN_PASSWORD || "").trim();

  if (!expectedPassword || !timingSafeEqual(suppliedPassword, expectedPassword)) {
    return deny(401, "Unauthorized.");
  }

  const requestBody = body && typeof body === "object" ? body : {};
  const staffEmail =
    String(
      request.headers.get("x-staff-email") ||
      requestBody.staff_email ||
      requestBody.staffEmail ||
      ""
    ).trim().toLowerCase();

  const staffId =
    String(
      request.headers.get("x-staff-user-id") ||
      requestBody.staff_user_id ||
      requestBody.staffUserId ||
      ""
    ).trim();

  const headers = serviceHeaders(env);

  let actor = null;

  if (staffId || staffEmail) {
    actor = await loadStaffUser({ env, headers, staffId, staffEmail });

    if (!actor) {
      return deny(403, "Staff user not found or inactive.");
    }
  } else if (allowLegacyAdminFallback) {
    actor = buildLegacyAdminActor();
  } else {
    return deny(403, "Missing staff identity.");
  }

  if (!hasCapability(actor, capability)) {
    return deny(403, `Permission denied for capability: ${capability}`);
  }

  let booking = null;

  if (bookingId) {
    booking = await loadBookingScope({ env, headers, bookingId });
    if (!booking) {
      return deny(404, "Booking not found.");
    }

    if (!canAccessBooking(actor, booking, capability)) {
      return deny(403, "You do not have access to this booking.");
    }
  }

  return {
    ok: true,
    actor,
    booking,
    headers
  };
}

export function serviceHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export function methodNotAllowed() {
  return json({ error: "Method not allowed." }, 405);
}

export function deny(status, error) {
  return {
    ok: false,
    response: json({ error }, status)
  };
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

export function cleanText(value) {
  const s = String(value ?? "").trim();
  return s || null;
}

export function toBoolean(value) {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

export function nullableBoolean(value) {
  if (value === null || value === undefined || value === "") return null;
  return toBoolean(value);
}

export function toNullableInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

export function cleanStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

export async function insertOverrideLog({
  env,
  booking_id = null,
  source_table,
  source_row_id = null,
  overridden_by_staff_user_id = null,
  previous_staff_user_id = null,
  override_reason = null,
  change_summary = null
}) {
  if (!source_table) return { ok: false, skipped: true };

  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_override_log`, {
      method: "POST",
      headers: {
        ...serviceHeaders(env),
        Prefer: "return=minimal"
      },
      body: JSON.stringify([
        {
          booking_id: booking_id || null,
          source_table,
          source_row_id: source_row_id || null,
          overridden_by_staff_user_id: overridden_by_staff_user_id || null,
          previous_staff_user_id: previous_staff_user_id || null,
          override_reason: cleanText(override_reason),
          change_summary: cleanText(change_summary)
        }
      ])
    });

    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/* ---------------- internal helpers ---------------- */

async function loadStaffUser({ env, headers, staffId, staffEmail }) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
    `?select=id,full_name,email,role_code,is_active,` +
    `can_override_lower_entries,can_manage_bookings,can_manage_blocks,` +
    `can_manage_progress,can_manage_promos,can_manage_staff,notes` +
    `&is_active=eq.true` +
    `&limit=1`;

  if (staffId) {
    url += `&id=eq.${encodeURIComponent(staffId)}`;
  } else {
    url += `&email=eq.${encodeURIComponent(staffEmail)}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) return null;

  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;

  return normalizeActor(row);
}

async function loadBookingScope({ env, headers, bookingId }) {
  const url =
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,status,job_status` +
    `&id=eq.${encodeURIComponent(bookingId)}` +
    `&limit=1`;

  const res = await fetch(url, { headers });
  if (!res.ok) return null;

  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function normalizeActor(row) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: String(row.email || "").trim().toLowerCase(),
    role_code: String(row.role_code || "detailer").trim(),
    is_active: !!row.is_active,

    can_override_lower_entries: !!row.can_override_lower_entries,
    can_manage_bookings: !!row.can_manage_bookings,
    can_manage_blocks: !!row.can_manage_blocks,
    can_manage_progress: !!row.can_manage_progress,
    can_manage_promos: !!row.can_manage_promos,
    can_manage_staff: !!row.can_manage_staff,

    is_admin: String(row.role_code || "") === "admin",
    is_senior_detailer: String(row.role_code || "") === "senior_detailer",
    is_detailer: String(row.role_code || "") === "detailer"
  };
}

function buildLegacyAdminActor() {
  return {
    id: null,
    full_name: "Legacy Admin",
    email: "",
    role_code: "admin",
    is_active: true,

    can_override_lower_entries: true,
    can_manage_bookings: true,
    can_manage_blocks: true,
    can_manage_progress: true,
    can_manage_promos: true,
    can_manage_staff: true,

    is_admin: true,
    is_senior_detailer: false,
    is_detailer: false,
    is_legacy_admin: true
  };
}

function hasCapability(actor, capability) {
  if (!actor || !actor.is_active) return false;
  if (actor.is_admin) return true;

  switch (capability) {
    case "manage_staff":
      return actor.can_manage_staff;

    case "manage_promos":
      return actor.can_manage_promos;

    case "manage_blocks":
      return actor.can_manage_blocks;

    case "manage_bookings":
      return actor.can_manage_bookings;

    case "manage_progress":
      return actor.can_manage_progress || actor.is_senior_detailer || actor.is_detailer;

    case "work_booking":
      return actor.is_senior_detailer || actor.is_detailer || actor.can_manage_progress;

    case "view_live_ops":
      return actor.can_manage_bookings || actor.can_manage_progress || actor.is_senior_detailer;

    default:
      return false;
  }
}

function canAccessBooking(actor, booking, capability) {
  if (!booking) return false;
  if (actor.is_admin) return true;

  const assignedUserId = String(booking.assigned_staff_user_id || "").trim();
  const assignedEmail = String(booking.assigned_staff_email || "").trim().toLowerCase();
  const assignedName = String(booking.assigned_staff_name || "").trim().toLowerCase();

  const matchesAssignment =
    (assignedUserId && actor.id && assignedUserId === actor.id) ||
    (assignedEmail && actor.email && assignedEmail === actor.email) ||
    (assignedName && actor.full_name && assignedName === String(actor.full_name).trim().toLowerCase());

  switch (capability) {
    case "manage_bookings":
      return !!actor.can_manage_bookings;

    case "manage_progress":
    case "work_booking":
    case "view_live_ops":
      return matchesAssignment || !!actor.can_manage_bookings || !!actor.can_manage_progress;

    default:
      return false;
  }
}

function timingSafeEqual(a, b) {
  a = String(a);
  b = String(b);
  const len = Math.max(a.length, b.length);
  let out = a.length ^ b.length;

  for (let i = 0; i < len; i++) {
    const ca = a.charCodeAt(i) || 0;
    const cb = b.charCodeAt(i) || 0;
    out |= ca ^ cb;
  }

  return out === 0;
}
