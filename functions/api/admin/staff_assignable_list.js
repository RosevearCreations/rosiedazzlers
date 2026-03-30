// functions/api/admin/staff_assignable_list.js
//
// Role-aware assignable staff list endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_bookings capability
// - returns only active staff users suitable for assignment
// - supports optional role filtering
// - gives admin-booking / admin-live / assignment tools a clean staff source
//
// Supported request body:
// {
//   role_code?: "admin" | "senior_detailer" | "detailer",
//   include_admins?: true
// }
//
// Request headers supported:
// - x-admin-password: required
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
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
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const role_code = cleanRoleCode(body.role_code);
    const include_admins =
      body.include_admins === undefined ? true : toBoolean(body.include_admins);

    if (body.role_code && !role_code) {
      return withCors(json({ error: "Invalid role_code." }, 400));
    }

    const headers = serviceHeaders(env);
    const url = buildStaffUrl(env, { role_code, include_admins });

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not load assignable staff. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const staff = Array.isArray(rows) ? rows : [];

    return withCors(
      json({
        ok: true,
        actor: {
          id: access.actor.id || null,
          full_name: access.actor.full_name || null,
          email: access.actor.email || null,
          role_code: access.actor.role_code || null
        },
        filters: {
          role_code: role_code || null,
          include_admins
        },
        staff_users: staff.map((row) => ({
          id: row.id || null,
          full_name: row.full_name || null,
          email: row.email || null,
          role_code: row.role_code || null,
          is_active: row.is_active === true,
          can_manage_bookings: row.can_manage_bookings === true,
          can_manage_progress: row.can_manage_progress === true,
          can_override_lower_entries: row.can_override_lower_entries === true,
          assignment_label: buildAssignmentLabel(row)
        }))
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

/* ---------------- query builder ---------------- */

function buildStaffUrl(env, { role_code, include_admins }) {
  const allowedRoles = ["senior_detailer", "detailer"];
  if (include_admins) {
    allowedRoles.unshift("admin");
  }

  let url =
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
    `?select=id,full_name,email,role_code,is_active,can_manage_bookings,can_manage_progress,can_override_lower_entries` +
    `&is_active=eq.true` +
    `&order=role_code.asc,full_name.asc`;

  if (role_code) {
    url += `&role_code=eq.${encodeURIComponent(role_code)}`;
  } else {
    const roleFilters = allowedRoles.map((role) => `role_code.eq.${role}`).join(",");
    url += `&or=(${roleFilters})`;
  }

  return url;
}

/* ---------------- helpers ---------------- */

function cleanRoleCode(value) {
  const s = cleanText(value);
  if (!s) return null;
  return ["admin", "senior_detailer", "detailer"].includes(s) ? s : null;
}

function buildAssignmentLabel(row) {
  const name = String(row.full_name || "").trim();
  const role = humanizeRole(row.role_code);
  const email = String(row.email || "").trim();

  if (name && email) return `${name} — ${role} (${email})`;
  if (name) return `${name} — ${role}`;
  if (email) return `${email} — ${role}`;
  return role;
}

function humanizeRole(role_code) {
  switch (String(role_code || "").trim()) {
    case "admin":
      return "Admin";
    case "senior_detailer":
      return "Senior Detailer";
    case "detailer":
      return "Detailer";
    default:
      return "Staff";
  }
}

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
