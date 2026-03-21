// functions/api/admin/staff_save.js
//
// Role-aware staff save endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_staff capability
// - creates new staff_users rows
// - updates existing staff_users rows
// - keeps permissions additive and explicit
//
// Supported request body:
// {
//   id?: "uuid",
//   full_name: "Jane Doe",
//   email: "jane@example.com",
//   role_code: "admin" | "senior_detailer" | "detailer",
//   is_active: true,
//   can_override_lower_entries: false,
//   can_manage_bookings: false,
//   can_manage_blocks: false,
//   can_manage_progress: true,
//   can_manage_promos: false,
//   can_manage_staff: false,
//   notes: "optional"
// }
//
// Transition notes:
// - x-admin-password is still required
// - x-staff-email / x-staff-user-id should identify the acting staff user
// - later auth/session work should only need changes in the shared auth helper

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  isUuid,
  cleanText,
  toBoolean
} from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);
    const normalized = normalizeStaffPayload(body);

    if (!normalized.ok) {
      return withCors(json({ error: normalized.error }, 400));
    }

    const payload = normalized.payload;

    if (payload.id) {
      const existing = await fetchExistingStaffUser(env, headers, payload.id);
      if (!existing.ok) {
        return withCors(existing.response);
      }

      const patch = {
        full_name: payload.full_name,
        email: payload.email,
        role_code: payload.role_code,
        is_active: payload.is_active,
        can_override_lower_entries: payload.can_override_lower_entries,
        can_manage_bookings: payload.can_manage_bookings,
        can_manage_blocks: payload.can_manage_blocks,
        can_manage_progress: payload.can_manage_progress,
        can_manage_promos: payload.can_manage_promos,
        can_manage_staff: payload.can_manage_staff,
        phone: payload.phone,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2,
        city: payload.city,
        province: payload.province,
        postal_code: payload.postal_code,
        employee_code: payload.employee_code,
        position_title: payload.position_title,
        hire_date: payload.hire_date,
        emergency_contact_name: payload.emergency_contact_name,
        emergency_contact_phone: payload.emergency_contact_phone,
        vehicle_notes: payload.vehicle_notes,
        notes: payload.notes,
        updated_at: new Date().toISOString()
      };

      const updateRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/staff_users?id=eq.${encodeURIComponent(payload.id)}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
          body: JSON.stringify(patch)
        }
      );

      if (!updateRes.ok) {
        const text = await updateRes.text();
        return withCors(json({ error: `Could not update staff user. ${text}` }, 500));
      }

      const rows = await updateRes.json().catch(() => []);
      const staffUser = Array.isArray(rows) ? rows[0] : null;

      return withCors(
        json({
          ok: true,
          mode: "update",
          message: "Staff user updated.",
          staff_user: staffUser
        })
      );
    }

    const createPayload = {
      full_name: payload.full_name,
      email: payload.email,
      role_code: payload.role_code,
      is_active: payload.is_active,
      can_override_lower_entries: payload.can_override_lower_entries,
      can_manage_bookings: payload.can_manage_bookings,
      can_manage_blocks: payload.can_manage_blocks,
      can_manage_progress: payload.can_manage_progress,
      can_manage_promos: payload.can_manage_promos,
      can_manage_staff: payload.can_manage_staff,
      phone: payload.phone,
      address_line1: payload.address_line1,
      address_line2: payload.address_line2,
      city: payload.city,
      province: payload.province,
      postal_code: payload.postal_code,
      employee_code: payload.employee_code,
      position_title: payload.position_title,
      hire_date: payload.hire_date,
      emergency_contact_name: payload.emergency_contact_name,
      emergency_contact_phone: payload.emergency_contact_phone,
      vehicle_notes: payload.vehicle_notes,
      notes: payload.notes
    };

    const createRes = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([createPayload])
    });

    if (!createRes.ok) {
      const text = await createRes.text();
      return withCors(json({ error: `Could not create staff user. ${text}` }, 500));
    }

    const rows = await createRes.json().catch(() => []);
    const staffUser = Array.isArray(rows) ? rows[0] : null;

    return withCors(
      json({
        ok: true,
        mode: "create",
        message: "Staff user created.",
        staff_user: staffUser
      })
    );
  } catch (err) {
    return withCors(
      json(
        {
          error: err && err.message ? err.message : "Unexpected server error."
        },
        500
      )
    );
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

/* ---------------- helpers ---------------- */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  const extras = corsHeaders();

  for (const [key, value] of Object.entries(extras)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function normalizeStaffPayload(body) {
  const id = cleanText(body.id);
  const full_name = cleanText(body.full_name);
  const email = String(body.email || "").trim().toLowerCase();
  const requestedRole = cleanText(body.role_code) || "detailer";

  if (id && !isUuid(id)) {
    return { ok: false, error: "Invalid staff user id." };
  }

  if (!full_name) {
    return { ok: false, error: "Full name is required." };
  }

  if (!email || !isValidEmail(email)) {
    return { ok: false, error: "A valid email is required." };
  }

  if (!["admin", "senior_detailer", "detailer"].includes(requestedRole)) {
    return { ok: false, error: "Invalid role_code." };
  }

  const defaults = deriveRoleDefaults(requestedRole);

  const payload = {
    id: id || null,
    full_name,
    email,
    role_code: requestedRole,
    is_active: body.is_active === undefined ? true : toBoolean(body.is_active),

    can_override_lower_entries:
      body.can_override_lower_entries === undefined
        ? defaults.can_override_lower_entries
        : toBoolean(body.can_override_lower_entries),

    can_manage_bookings:
      body.can_manage_bookings === undefined
        ? defaults.can_manage_bookings
        : toBoolean(body.can_manage_bookings),

    can_manage_blocks:
      body.can_manage_blocks === undefined
        ? defaults.can_manage_blocks
        : toBoolean(body.can_manage_blocks),

    can_manage_progress:
      body.can_manage_progress === undefined
        ? defaults.can_manage_progress
        : toBoolean(body.can_manage_progress),

    can_manage_promos:
      body.can_manage_promos === undefined
        ? defaults.can_manage_promos
        : toBoolean(body.can_manage_promos),

    can_manage_staff:
      body.can_manage_staff === undefined
        ? defaults.can_manage_staff
        : toBoolean(body.can_manage_staff),

    notes: cleanText(body.notes)
  };

  return { ok: true, payload };
}

function deriveRoleDefaults(roleCode) {
  switch (roleCode) {
    case "admin":
      return {
        can_override_lower_entries: true,
        can_manage_bookings: true,
        can_manage_blocks: true,
        can_manage_progress: true,
        can_manage_promos: true,
        can_manage_staff: true
      };

    case "senior_detailer":
      return {
        can_override_lower_entries: true,
        can_manage_bookings: false,
        can_manage_blocks: false,
        can_manage_progress: true,
        can_manage_promos: false,
        can_manage_staff: false
      };

    case "detailer":
    default:
      return {
        can_override_lower_entries: false,
        can_manage_bookings: false,
        can_manage_blocks: false,
        can_manage_progress: true,
        can_manage_promos: false,
        can_manage_staff: false
      };
  }
}

async function fetchExistingStaffUser(env, headers, id) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
      `?select=id,email` +
      `&id=eq.${encodeURIComponent(id)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify staff user. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;

  if (!row) {
    return {
      ok: false,
      response: json({ error: "Staff user not found." }, 404)
    };
  }

  return { ok: true, row };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}
