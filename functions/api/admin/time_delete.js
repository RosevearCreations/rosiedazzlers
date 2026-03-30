// functions/api/admin/time_delete.js
//
// Role-aware job time delete endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to delete any time entry
// - allows assigned detailers / senior detailers to delete time entries only for bookings they can work
// - blocks cross-staff deletion unless override permission is present
// - writes to staff_override_log when one staff user deletes another staff user's entry
//
// Supported request body:
// {
//   time_entry_id: "uuid",
//   override_reason?: "Duplicate entry"
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
    const time_entry_id = String(body.time_entry_id || "").trim();
    const override_reason = cleanText(body.override_reason);

    if (!time_entry_id) {
      return withCors(json({ error: "Missing time_entry_id." }, 400));
    }

    if (!isUuid(time_entry_id)) {
      return withCors(json({ error: "Invalid time_entry_id." }, 400));
    }

    const headers = serviceHeaders(env);
    const entryLookup = await loadTimeEntry(env, headers, time_entry_id);

    if (!entryLookup.ok) {
      return withCors(entryLookup.response);
    }

    const entry = entryLookup.entry;

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: entry.booking_id,
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const actor = access.actor;
    const deletingOwnEntry =
      !!actor.id &&
      !!entry.staff_user_id &&
      String(actor.id).trim() === String(entry.staff_user_id).trim();

    const canDeleteOthers =
      actor.is_admin ||
      actor.can_manage_bookings ||
      actor.can_override_lower_entries;

    if (entry.staff_user_id && !deletingOwnEntry && !canDeleteOthers) {
      return withCors(
        json(
          {
            error:
              "This time entry belongs to another staff user. Override permission is required."
          },
          403
        )
      );
    }

    const delRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/job_time_entries?id=eq.${encodeURIComponent(time_entry_id)}`,
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
      return withCors(json({ error: `Could not delete time entry. ${text}` }, 500));
    }

    const rows = await delRes.json().catch(() => []);
    const deleted = Array.isArray(rows) ? rows[0] || entry : entry;

    const deletedAnotherStaff =
      !!entry.staff_user_id &&
      !!actor.id &&
      String(entry.staff_user_id).trim() !== String(actor.id).trim();

    if (deletedAnotherStaff && canDeleteOthers) {
      await insertOverrideLog({
        env,
        booking_id: entry.booking_id,
        source_table: "job_time_entries",
        source_row_id: entry.id,
        overridden_by_staff_user_id: actor.id || null,
        previous_staff_user_id: entry.staff_user_id || null,
        override_reason:
          override_reason || "Deleted another staff user's time entry.",
        change_summary: `Deleted time entry (${entry.minutes || 0} minutes, ${entry.entry_type || "work"}).`
      });
    }

    return withCors(
      json({
        ok: true,
        message: "Time entry deleted.",
        deleted_time_entry: {
          id: deleted.id || entry.id,
          booking_id: deleted.booking_id || entry.booking_id,
          minutes: Number(deleted.minutes || entry.minutes || 0),
          entry_type: deleted.entry_type || entry.entry_type || null,
          staff_user_id: deleted.staff_user_id || entry.staff_user_id || null,
          staff_name: deleted.staff_name || entry.staff_name || null,
          created_at: deleted.created_at || entry.created_at || null
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

async function loadTimeEntry(env, headers, timeEntryId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/job_time_entries` +
      `?select=id,booking_id,minutes,note,entry_type,staff_user_id,staff_name,created_at` +
      `&id=eq.${encodeURIComponent(timeEntryId)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify time entry. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const entry = Array.isArray(rows) ? rows[0] || null : null;

  if (!entry) {
    return {
      ok: false,
      response: json({ error: "Time entry not found." }, 404)
    };
  }

  return { ok: true, entry };
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
