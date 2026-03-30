// functions/api/admin/jobsite_save.js
//
// Role-aware jobsite intake save endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to save intake for any booking
// - allows assigned detailers / senior detailers to save intake only for bookings they can work
// - creates or updates jobsite_intake rows
// - keeps field handling additive and conservative
//
// Supported request body:
// {
//   booking_id: "uuid",
//   pre_existing_condition?: "Light scratches on rear bumper",
//   valuables?: ["Phone charger", "Booster seat"],
//   pre_job_checklist?: ["Walkaround complete", "Photos taken"],
//   owner_notes?: "Customer mentioned weak battery.",
//   acknowledgement_notes?: "Customer approved proceeding.",
//   intake_complete?: true
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
  toBoolean,
  cleanStringArray,
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
    const booking_id = String(body.booking_id || "").trim();

    if (!booking_id) {
      return withCors(json({ error: "Missing booking_id." }, 400));
    }

    if (!isUuid(booking_id)) {
      return withCors(json({ error: "Invalid booking_id." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: booking_id,
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const payload = normalizeIntakePayload(body);
    const headers = serviceHeaders(env);

    const existing = await findExistingIntake(env, headers, booking_id);
    if (!existing.ok) {
      return withCors(existing.response);
    }

    if (existing.row) {
      if (
        existing.row.updated_by_staff_user_id &&
        access.actor.id &&
        existing.row.updated_by_staff_user_id !== access.actor.id &&
        !access.actor.can_override_lower_entries &&
        !access.actor.is_admin &&
        !access.actor.can_manage_bookings
      ) {
        return withCors(
          json(
            {
              error:
                "This intake was last updated by another staff user. Override permission is required."
            },
            403
          )
        );
      }

      const patch = {
        pre_existing_condition: payload.pre_existing_condition,
        valuables: payload.valuables,
        pre_job_checklist: payload.pre_job_checklist,
        owner_notes: payload.owner_notes,
        acknowledgement_notes: payload.acknowledgement_notes,
        intake_complete: payload.intake_complete,
        updated_at: new Date().toISOString(),
        updated_by_staff_user_id: access.actor.id || null,
        updated_by_staff_name: access.actor.full_name || null
      };

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/jobsite_intake?id=eq.${encodeURIComponent(existing.row.id)}`,
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
        return withCors(json({ error: `Could not update jobsite intake. ${text}` }, 500));
      }

      const rows = await res.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] || null : null;

      const overridingAnotherStaff =
        existing.row.updated_by_staff_user_id &&
        access.actor.id &&
        existing.row.updated_by_staff_user_id !== access.actor.id;

      if (overridingAnotherStaff && (access.actor.can_override_lower_entries || access.actor.is_admin)) {
        await insertOverrideLog({
          env,
          booking_id,
          source_table: "jobsite_intake",
          source_row_id: existing.row.id,
          overridden_by_staff_user_id: access.actor.id || null,
          previous_staff_user_id: existing.row.updated_by_staff_user_id || null,
          override_reason: cleanText(body.override_reason) || "Jobsite intake updated by another authorized staff user.",
          change_summary: "Updated jobsite intake record."
        });
      }

      return withCors(
        json({
          ok: true,
          mode: "update",
          message: "Jobsite intake updated.",
          intake: row
        })
      );
    }

    const createPayload = {
      booking_id,
      pre_existing_condition: payload.pre_existing_condition,
      valuables: payload.valuables,
      pre_job_checklist: payload.pre_job_checklist,
      owner_notes: payload.owner_notes,
      acknowledgement_notes: payload.acknowledgement_notes,
      intake_complete: payload.intake_complete,
      updated_by_staff_user_id: access.actor.id || null,
      updated_by_staff_name: access.actor.full_name || null
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/jobsite_intake`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([createPayload])
    });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not create jobsite intake. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        mode: "create",
        message: "Jobsite intake created.",
        intake: row
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

function normalizeIntakePayload(body) {
  return {
    pre_existing_condition: cleanText(body.pre_existing_condition),
    valuables: cleanStringArray(body.valuables),
    pre_job_checklist: cleanStringArray(body.pre_job_checklist),
    owner_notes: cleanText(body.owner_notes),
    acknowledgement_notes: cleanText(body.acknowledgement_notes),
    intake_complete:
      body.intake_complete === undefined ? false : toBoolean(body.intake_complete)
  };
}

async function findExistingIntake(env, headers, bookingId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/jobsite_intake` +
      `?select=id,booking_id,updated_at,updated_by_staff_user_id,updated_by_staff_name` +
      `&booking_id=eq.${encodeURIComponent(bookingId)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify jobsite intake. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  return {
    ok: true,
    row: Array.isArray(rows) ? rows[0] || null : null
  };
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
