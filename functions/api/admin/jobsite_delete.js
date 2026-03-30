// functions/api/admin/jobsite_delete.js
//
// Role-aware jobsite intake delete endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to delete any intake record
// - allows assigned detailers / senior detailers to delete intake only for bookings they can work
// - blocks cross-staff deletion unless override permission is present
// - writes to staff_override_log when one staff user deletes another staff user's intake record
//
// Supported request body:
// {
//   intake_id: "uuid",
//   override_reason?: "Intake needs to be redone"
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
    const intake_id = String(body.intake_id || "").trim();
    const override_reason = cleanText(body.override_reason);

    if (!intake_id) {
      return withCors(json({ error: "Missing intake_id." }, 400));
    }

    if (!isUuid(intake_id)) {
      return withCors(json({ error: "Invalid intake_id." }, 400));
    }

    const headers = serviceHeaders(env);
    const intakeLookup = await loadIntake(env, headers, intake_id);

    if (!intakeLookup.ok) {
      return withCors(intakeLookup.response);
    }

    const intake = intakeLookup.intake;

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: intake.booking_id,
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const actor = access.actor;

    const deletingOwnRecord =
      !!actor.id &&
      !!intake.updated_by_staff_user_id &&
      String(actor.id).trim() === String(intake.updated_by_staff_user_id).trim();

    const canDeleteOthers =
      actor.is_admin ||
      actor.can_manage_bookings ||
      actor.can_override_lower_entries;

    if (intake.updated_by_staff_user_id && !deletingOwnRecord && !canDeleteOthers) {
      return withCors(
        json(
          {
            error:
              "This intake record belongs to another staff user. Override permission is required."
          },
          403
        )
      );
    }

    const delRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/jobsite_intake?id=eq.${encodeURIComponent(intake_id)}`,
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
      return withCors(json({ error: `Could not delete intake record. ${text}` }, 500));
    }

    const rows = await delRes.json().catch(() => []);
    const deleted = Array.isArray(rows) ? rows[0] || intake : intake;

    const deletedAnotherStaff =
      !!intake.updated_by_staff_user_id &&
      !!actor.id &&
      String(intake.updated_by_staff_user_id).trim() !== String(actor.id).trim();

    if (deletedAnotherStaff && canDeleteOthers) {
      await insertOverrideLog({
        env,
        booking_id: intake.booking_id,
        source_table: "jobsite_intake",
        source_row_id: intake.id,
        overridden_by_staff_user_id: actor.id || null,
        previous_staff_user_id: intake.updated_by_staff_user_id || null,
        override_reason:
          override_reason || "Deleted another staff user's intake record.",
        change_summary: "Deleted jobsite intake record."
      });
    }

    return withCors(
      json({
        ok: true,
        message: "Intake record deleted.",
        deleted_intake: {
          id: deleted.id || intake.id,
          booking_id: deleted.booking_id || intake.booking_id,
          intake_complete:
            deleted.intake_complete === true || intake.intake_complete === true,
          updated_by_staff_user_id:
            deleted.updated_by_staff_user_id || intake.updated_by_staff_user_id || null,
          updated_by_staff_name:
            deleted.updated_by_staff_name || intake.updated_by_staff_name || null,
          created_at: deleted.created_at || intake.created_at || null,
          updated_at: deleted.updated_at || intake.updated_at || null
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

async function loadIntake(env, headers, intakeId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/jobsite_intake` +
      `?select=id,booking_id,intake_complete,updated_by_staff_user_id,updated_by_staff_name,created_at,updated_at` +
      `&id=eq.${encodeURIComponent(intakeId)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify intake record. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const intake = Array.isArray(rows) ? rows[0] || null : null;

  if (!intake) {
    return {
      ok: false,
      response: json({ error: "Intake record not found." }, 404)
    };
  }

  return { ok: true, intake };
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
