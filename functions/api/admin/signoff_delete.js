// functions/api/admin/signoff_delete.js
//
// Role-aware job signoff delete endpoint.
//
// What this file does:
// - prefers signed-in staff session access
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to delete any signoff
// - allows assigned detailers / senior detailers to delete signoff only for bookings they can work
// - blocks cross-staff deletion unless override permission is present
// - writes to staff_override_log when one staff user deletes another staff user's signoff
//
// Supported request body:
// {
//   signoff_id: "uuid",
//   override_reason?: "Customer requested redo"
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
    const signoff_id = String(body.signoff_id || "").trim();
    const override_reason = cleanText(body.override_reason);

    if (!signoff_id) {
      return withCors(json({ error: "Missing signoff_id." }, 400));
    }

    if (!isUuid(signoff_id)) {
      return withCors(json({ error: "Invalid signoff_id." }, 400));
    }

    const headers = serviceHeaders(env);
    const signoffLookup = await loadSignoff(env, headers, signoff_id);

    if (!signoffLookup.ok) {
      return withCors(signoffLookup.response);
    }

    const signoff = signoffLookup.signoff;

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: signoff.booking_id,
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const actor = access.actor;

    const deletingOwnRecord =
      !!actor.id &&
      !!signoff.updated_by_staff_user_id &&
      String(actor.id).trim() === String(signoff.updated_by_staff_user_id).trim();

    const canDeleteOthers =
      actor.is_admin ||
      actor.can_manage_bookings ||
      actor.can_override_lower_entries;

    if (signoff.updated_by_staff_user_id && !deletingOwnRecord && !canDeleteOthers) {
      return withCors(
        json(
          {
            error:
              "This signoff record belongs to another staff user. Override permission is required."
          },
          403
        )
      );
    }

    const delRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/job_signoffs?id=eq.${encodeURIComponent(signoff_id)}`,
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
      return withCors(json({ error: `Could not delete signoff. ${text}` }, 500));
    }

    const rows = await delRes.json().catch(() => []);
    const deleted = Array.isArray(rows) ? rows[0] || signoff : signoff;

    const deletedAnotherStaff =
      !!signoff.updated_by_staff_user_id &&
      !!actor.id &&
      String(signoff.updated_by_staff_user_id).trim() !== String(actor.id).trim();

    if (deletedAnotherStaff && canDeleteOthers) {
      await insertOverrideLog({
        env,
        booking_id: signoff.booking_id,
        source_table: "job_signoffs",
        source_row_id: signoff.id,
        overridden_by_staff_user_id: actor.id || null,
        previous_staff_user_id: signoff.updated_by_staff_user_id || null,
        override_reason:
          override_reason || "Deleted another staff user's signoff record.",
        change_summary: `Deleted signoff${signoff.customer_name ? ` for ${signoff.customer_name}` : ""}.`
      });
    }

    return withCors(
      json({
        ok: true,
        message: "Signoff deleted.",
        deleted_signoff: {
          id: deleted.id || signoff.id,
          booking_id: deleted.booking_id || signoff.booking_id,
          customer_name: deleted.customer_name || signoff.customer_name || null,
          signed_at: deleted.signed_at || signoff.signed_at || null,
          updated_by_staff_user_id:
            deleted.updated_by_staff_user_id || signoff.updated_by_staff_user_id || null,
          updated_by_staff_name:
            deleted.updated_by_staff_name || signoff.updated_by_staff_name || null,
          created_at: deleted.created_at || signoff.created_at || null
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

async function loadSignoff(env, headers, signoffId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/job_signoffs` +
      `?select=id,booking_id,customer_name,signed_at,updated_by_staff_user_id,updated_by_staff_name,created_at` +
      `&id=eq.${encodeURIComponent(signoffId)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify signoff. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const signoff = Array.isArray(rows) ? rows[0] || null : null;

  if (!signoff) {
    return {
      ok: false,
      response: json({ error: "Signoff not found." }, 404)
    };
  }

  return { ok: true, signoff };
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
