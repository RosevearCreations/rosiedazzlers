// functions/api/admin/staff_me.js
//
// Role-aware current staff identity endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - resolves the acting staff user through staff_users
// - returns the current role/capabilities for the admin/detailer UI
// - supports legacy admin fallback during transition
//
// Supported request body:
// {
//   staff_email?: "detailer@example.com",
//   staff_user_id?: "uuid"
// }
//
// Request headers supported:
// - x-admin-password: required
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative
//
// Why this file matters:
// - admin/detailer pages need an easy way to know what actions to show
// - the project is in transition from shared password to role-aware operations
// - this endpoint lets the UI react to the real staff capability set without
//   duplicating permission logic on the frontend

import {
  requireStaffAccess,
  json,
  methodNotAllowed
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
      capability: "view_live_ops",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const actor = access.actor;

    return withCors(
      json({
        ok: true,
        actor: {
          id: actor.id || null,
          full_name: actor.full_name || null,
          email: actor.email || null,
          role_code: actor.role_code || null,
          is_active: actor.is_active === true,

          is_admin: actor.is_admin === true,
          is_senior_detailer: actor.is_senior_detailer === true,
          is_detailer: actor.is_detailer === true,
          is_legacy_admin: actor.is_legacy_admin === true,

          capabilities: {
            can_override_lower_entries: actor.can_override_lower_entries === true,
            can_manage_bookings: actor.can_manage_bookings === true,
            can_manage_blocks: actor.can_manage_blocks === true,
            can_manage_progress: actor.can_manage_progress === true,
            can_manage_promos: actor.can_manage_promos === true,
            can_manage_staff: actor.can_manage_staff === true
          }
        }
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
