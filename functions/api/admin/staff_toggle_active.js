// functions/api/admin/staff_toggle_active.js
//
// Role-aware staff activate / deactivate endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_staff capability
// - activates or deactivates staff_users without deleting rows
// - preserves audit/history for assignments and override logs
// - blocks users from deactivating themselves
//
// Supported request body:
// {
//   staff_user_id: "uuid",
//   is_active: false,
//   reason?: "No longer on team"
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
  isUuid
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
    const staff_user_id = String(body.staff_user_id || "").trim();
    const is_active = body.is_active;
    const reason = cleanText(body.reason);

    if (!staff_user_id) {
      return withCors(json({ error: "Missing staff_user_id." }, 400));
    }

    if (!isUuid(staff_user_id)) {
      return withCors(json({ error: "Invalid staff_user_id." }, 400));
    }

    if (typeof is_active !== "boolean") {
      return withCors(json({ error: "is_active must be true or false." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_staff",
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const actor = access.actor;

    if (actor.id && String(actor.id) === staff_user_id) {
      return withCors(
        json(
          {
            error: "You cannot change your own active status from this endpoint."
          },
          403
        )
      );
    }

    const headers = serviceHeaders(env);
    const existing = await loadStaffUser(env, headers, staff_user_id);

    if (!existing.ok) {
      return withCors(existing.response);
    }

    const target = existing.staff_user;

    const patch = {
      is_active,
      updated_at: new Date().toISOString()
    };

    if (reason) {
      patch.notes = appendReason(target.notes, reason, is_active);
    }

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/staff_users?id=eq.${encodeURIComponent(staff_user_id)}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify(patch)
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not update staff status. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        message: is_active ? "Staff user activated." : "Staff user deactivated.",
        staff_user: row
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

async function loadStaffUser(env, headers, staffUserId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
      `?select=id,full_name,email,role_code,is_active,notes` +
      `&id=eq.${encodeURIComponent(staffUserId)}` +
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
  const staff_user = Array.isArray(rows) ? rows[0] || null : null;

  if (!staff_user) {
    return {
      ok: false,
      response: json({ error: "Staff user not found." }, 404)
    };
  }

  return { ok: true, staff_user };
}

function appendReason(existingNotes, reason, isActive) {
  const statusText = isActive ? "Activated" : "Deactivated";
  const stamp = new Date().toISOString();
  const line = `[${stamp}] ${statusText}: ${reason}`;

  const current = cleanText(existingNotes);
  if (!current) return line;
  return `${current}\n${line}`;
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
