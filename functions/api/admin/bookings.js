// functions/api/admin/bookings.js
//
// Role-aware bookings endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - adds staff-aware access checks through staff_users
// - allows scoped booking listing for non-admin staff
// - keeps booking updates restricted to booking managers/admin
//
// Request headers supported:
// - x-admin-password: required
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative
//
// POST behaviors:
// 1) No booking_id supplied:
//    -> returns booking list
//    -> admin / booking managers: all bookings
//    -> other staff: only assigned bookings
//
// 2) booking_id supplied + status/job_status values:
//    -> updates booking
//    -> requires manage_bookings capability
//
// This file intentionally stays additive and conservative.

import {
  requireStaffAccess,
  serviceHeaders,
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
    const bookingId = String(body.booking_id || "").trim();
    const status = body.status == null ? null : String(body.status).trim();
    const jobStatus = body.job_status == null ? null : String(body.job_status).trim();

    // LIST MODE
    if (!bookingId) {
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

      const { actor } = access;
      const headers = serviceHeaders(env);

      let listUrl =
        `${env.SUPABASE_URL}/rest/v1/bookings` +
        `?select=id,status,job_status,customer_name,customer_email,customer_phone,service_date,start_slot,package_code,vehicle_size,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,progress_enabled,progress_token,created_at,updated_at` +
        `&order=service_date.asc,created_at.desc`;

      // Admins and booking managers can see all bookings.
      // Other staff only see their own assigned work.
      if (!(actor.is_admin || actor.can_manage_bookings)) {
        const orParts = [];

        if (actor.id) {
          orParts.push(`assigned_staff_user_id.eq.${escapeFilterValue(actor.id)}`);
        }

        if (actor.email) {
          orParts.push(`assigned_staff_email.eq.${escapeFilterValue(actor.email)}`);
        }

        if (actor.full_name) {
          orParts.push(`assigned_staff_name.ilike.${escapeLikeValue(actor.full_name)}`);
          orParts.push(`assigned_to.ilike.${escapeLikeValue(actor.full_name)}`);
        }

        if (orParts.length === 0) {
          return withCors(
            json({
              ok: true,
              bookings: [],
              scoped: true,
              message: "No staff identity available for scoped booking lookup."
            })
          );
        }

        listUrl += `&or=(${orParts.join(",")})`;
      }

      const listRes = await fetch(listUrl, { headers });
      if (!listRes.ok) {
        const text = await listRes.text();
        return withCors(json({ error: `Could not load bookings. ${text}` }, 500));
      }

      const bookings = await listRes.json().catch(() => []);

      return withCors(
        json({
          ok: true,
          scoped: !(actor.is_admin || actor.can_manage_bookings),
          actor: {
            id: actor.id || null,
            full_name: actor.full_name || null,
            email: actor.email || null,
            role_code: actor.role_code || null
          },
          bookings: Array.isArray(bookings) ? bookings : []
        })
      );
    }

    // UPDATE MODE
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      bookingId,
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const patch = {};

    if (status !== null) patch.status = status || null;
    if (jobStatus !== null) patch.job_status = jobStatus || null;

    if (Object.keys(patch).length === 0) {
      return withCors(json({ error: "Nothing to update." }, 400));
    }

    if (patch.status === "completed" || patch.job_status === "completed") {
      patch.completed_at = new Date().toISOString();
    }

    patch.updated_at = new Date().toISOString();

    const patchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`,
      {
        method: "PATCH",
        headers: {
          ...serviceHeaders(env),
          Prefer: "return=representation"
        },
        body: JSON.stringify(patch)
      }
    );

    if (!patchRes.ok) {
      const text = await patchRes.text();
      return withCors(json({ error: `Could not update booking. ${text}` }, 500));
    }

    const rows = await patchRes.json().catch(() => []);
    const booking = Array.isArray(rows) ? rows[0] : null;

    if (!booking) {
      return withCors(json({ error: "Booking not found." }, 404));
    }

    return withCors(
      json({
        ok: true,
        message: "Booking updated.",
        booking
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

function escapeFilterValue(value) {
  return String(value || "").replace(/,/g, "%2C");
}

function escapeLikeValue(value) {
  return `*${String(value || "").trim().replace(/,/g, " ")}*`;
}
