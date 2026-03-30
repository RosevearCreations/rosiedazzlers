// functions/api/admin/booking_complete.js
//
// Role-aware booking complete / reopen endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - allows admin / booking managers to mark any booking complete
// - allows assigned detailers / senior detailers to reopen only bookings they can work
// - sets status/job_status consistently
// - records completed_at when completing
//
// Supported request body:
// {
//   booking_id: "uuid",
//   completed: true,
//   reopen_status?: "confirmed",
//   reopen_job_status?: "in_progress"
// }
//
// Behavior:
// - completed=true  -> status=completed, job_status=completed
// - completed=false -> restores status/job_status using supplied reopen values
//                      or sensible defaults
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
    const booking_id = String(body.booking_id || "").trim();

    if (!booking_id) {
      return withCors(json({ error: "Missing booking_id." }, 400));
    }

    if (!isUuid(booking_id)) {
      return withCors(json({ error: "Invalid booking_id." }, 400));
    }

    if (body.completed === undefined) {
      return withCors(json({ error: "completed is required." }, 400));
    }

    const completed = toBoolean(body.completed);

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: completed ? "manage_bookings" : "work_booking",
      bookingId: booking_id,
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const actor = access.actor;

    // Reopening should still be limited:
    // admin / booking managers can reopen anything,
    // assigned workers can reopen only their scoped booking.
    if (
      !completed &&
      !(
        actor.is_admin ||
        actor.can_manage_bookings ||
        actor.is_senior_detailer ||
        actor.is_detailer ||
        actor.can_manage_progress
      )
    ) {
      return withCors(json({ error: "Permission denied." }, 403));
    }

    const headers = serviceHeaders(env);
    const existing = await loadBooking(env, headers, booking_id);

    if (!existing.ok) {
      return withCors(existing.response);
    }

    const booking = existing.booking;
    const patch = completed
      ? buildCompletePatch()
      : buildReopenPatch(body, booking);

    patch.updated_at = new Date().toISOString();

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`,
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
      return withCors(json({ error: `Could not update booking completion state. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        message: completed ? "Booking marked complete." : "Booking reopened.",
        booking: row
      })
    );
  } catch (err) {
    return withCors(
      json(
        { error: err && err.message ? err.message : "Unexpected server error." },
        500
      )
    );
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

/* ---------------- helpers ---------------- */

async function loadBooking(env, headers, bookingId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/bookings` +
      `?select=id,status,job_status,completed_at` +
      `&id=eq.${encodeURIComponent(bookingId)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify booking. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const booking = Array.isArray(rows) ? rows[0] || null : null;

  if (!booking) {
    return {
      ok: false,
      response: json({ error: "Booking not found." }, 404)
    };
  }

  return { ok: true, booking };
}

function buildCompletePatch() {
  return {
    status: "completed",
    job_status: "completed",
    completed_at: new Date().toISOString()
  };
}

function buildReopenPatch(body, booking) {
  const reopen_status = cleanStatus(body.reopen_status) || inferReopenStatus(booking);
  const reopen_job_status = cleanJobStatus(body.reopen_job_status) || inferReopenJobStatus(booking);

  return {
    status: reopen_status,
    job_status: reopen_job_status,
    completed_at: null
  };
}

function inferReopenStatus(booking) {
  const prior = String(booking.status || "").trim().toLowerCase();
  if (prior && prior !== "completed") return prior;
  return "confirmed";
}

function inferReopenJobStatus(booking) {
  const prior = String(booking.job_status || "").trim().toLowerCase();
  if (prior && prior !== "completed") return prior;
  return "in_progress";
}

function cleanStatus(value) {
  const s = String(value || "").trim().toLowerCase();
  return ["pending", "confirmed", "cancelled", "completed"].includes(s) ? s : null;
}

function cleanJobStatus(value) {
  const s = String(value || "").trim().toLowerCase();
  return ["scheduled", "in_progress", "cancelled", "completed"].includes(s) ? s : null;
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
