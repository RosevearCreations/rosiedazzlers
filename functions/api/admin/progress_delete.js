// functions/api/admin/progress_delete.js
//
// Role-aware job progress delete endpoint.
//
// What this file does:
// - prefers signed-in staff session access
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to delete any progress update
// - allows assigned detailers / senior detailers to delete updates only for bookings they can work
// - blocks cross-staff deletion unless override permission is present
// - writes to staff_override_log when one staff user deletes another staff user's progress update
//
// Supported request body:
// {
//   update_id: "uuid",
//   override_reason?: "Duplicate note"
// }
//
// Request headers supported:
// - x-admin-password: transitional compatibility only when explicitly used
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  cleanText,
  isUuid,
  insertOverrideLog
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
    const update_id = String(body.update_id || "").trim();
    const override_reason = cleanText(body.override_reason);

    if (!update_id) {
      return withCors(json({ error: "Missing update_id." }, 400));
    }

    if (!isUuid(update_id)) {
      return withCors(json({ error: "Invalid update_id." }, 400));
    }

    const headers = serviceHeaders(env);
    const updateLookup = await loadProgressUpdate(env, headers, update_id);

    if (!updateLookup.ok) {
      return withCors(updateLookup.response);
    }

    const update = updateLookup.update;

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: update.booking_id,
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const actor = access.actor;
    const createdBy = String(update.created_by || "").trim().toLowerCase();
    const actorName = String(actor.full_name || "").trim().toLowerCase();
    const actorEmail = String(actor.email || "").trim().toLowerCase();

    const deletingOwnUpdate =
      (createdBy && actorName && createdBy === actorName) ||
      (createdBy && actorEmail && createdBy === actorEmail);

    const canDeleteOthers =
      actor.is_admin ||
      actor.can_manage_bookings ||
      actor.can_override_lower_entries;

    if (createdBy && !deletingOwnUpdate && !canDeleteOthers) {
      return withCors(
        json(
          {
            error:
              "This progress update appears to belong to another staff user. Override permission is required."
          },
          403
        )
      );
    }

    const delRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/job_updates?id=eq.${encodeURIComponent(update_id)}`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          Prefer: "return=representation"
        }
      }
    );

    if (!delRes.ok) {
      const text = await delRes.text();
      return withCors(json({ error: `Could not delete progress update. ${text}` }, 500));
    }

    const rows = await delRes.json().catch(() => []);
    const deleted = Array.isArray(rows) ? rows[0] || update : update;

    const deletedAnotherStaff = createdBy && !deletingOwnUpdate;

    if (deletedAnotherStaff && canDeleteOthers) {
      await insertOverrideLog({
        env,
        booking_id: update.booking_id,
        source_table: "job_updates",
        source_row_id: update.id,
        overridden_by_staff_user_id: actor.id || null,
        previous_staff_user_id: null,
        override_reason:
          override_reason || "Deleted another staff user's progress update.",
        change_summary: `Deleted progress update${update.note ? `: ${truncate(update.note, 140)}` : "."}`
      });
    }

    return withCors(
      json({
        ok: true,
        message: "Progress update deleted.",
        deleted_update: {
          id: deleted.id || update.id,
          booking_id: deleted.booking_id || update.booking_id,
          created_at: deleted.created_at || update.created_at || null,
          created_by: deleted.created_by || update.created_by || null,
          note: deleted.note || update.note || null,
          visibility: deleted.visibility || update.visibility || null
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

async function loadProgressUpdate(env, headers, updateId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/job_updates` +
      `?select=id,booking_id,created_at,created_by,note,visibility` +
      `&id=eq.${encodeURIComponent(updateId)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify progress update. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const update = Array.isArray(rows) ? rows[0] || null : null;

  if (!update) {
    return {
      ok: false,
      response: json({ error: "Progress update not found." }, 404)
    };
  }

  return { ok: true, update };
}

function truncate(value, max) {
  const s = String(value || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
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
