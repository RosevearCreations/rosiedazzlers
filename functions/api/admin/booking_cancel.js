// functions/api/admin/booking_cancel.js
//
// Role-aware booking cancel / restore endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_bookings capability
// - cancels a booking by setting status/job_status
// - can restore a cancelled booking back to an active state
// - keeps changes additive and avoids destructive deletion
//
// Supported request body:
// {
//   booking_id: "uuid",
//   cancelled: true,
//   cancel_reason?: "Customer rescheduled",
//   restore_status?: "pending",
//   restore_job_status?: "scheduled"
// }
//
// Behavior:
// - cancelled=true  -> status=cancelled, job_status=cancelled
// - cancelled=false -> restores status/job_status using supplied restore values
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

    if (body.cancelled === undefined) {
      return withCors(json({ error: "cancelled is required." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      bookingId: booking_id,
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);
    const cancelled = toBoolean(body.cancelled);

    const existing = await loadBooking(env, headers, booking_id);
    if (!existing.ok) {
      return withCors(existing.response);
    }

    const booking = existing.booking;

    const patch = cancelled
      ? buildCancelPatch(body)
      : buildRestorePatch(body, booking);

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
      return withCors(json({ error: `Could not update booking status. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        message: cancelled ? "Booking cancelled." : "Booking restored.",
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
      `?select=id,status,job_status,notes` +
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

function buildCancelPatch(body) {
  const cancel_reason = cleanText(body.cancel_reason);
  const patch = {
    status: "cancelled",
    job_status: "cancelled"
  };

  if (cancel_reason) {
    patch.notes = appendNote(body.existing_notes, `Cancel reason: ${cancel_reason}`);
  }

  patch.cancelled_at = new Date().toISOString();

  return patch;
}

function buildRestorePatch(body, booking) {
  const restore_status = cleanStatus(body.restore_status) || inferRestoreStatus(booking);
  const restore_job_status =
    cleanJobStatus(body.restore_job_status) || inferRestoreJobStatus(booking);

  return {
    status: restore_status,
    job_status: restore_job_status
  };
}

function inferRestoreStatus(booking) {
  const prior = String(booking.status || "").trim().toLowerCase();
  if (prior && prior !== "cancelled") return prior;
  return "pending";
}

function inferRestoreJobStatus(booking) {
  const prior = String(booking.job_status || "").trim().toLowerCase();
  if (prior && prior !== "cancelled") return prior;
  return "scheduled";
}

function cleanStatus(value) {
  const s = String(value || "").trim().toLowerCase();
  return ["pending", "confirmed", "cancelled", "completed"].includes(s) ? s : null;
}

function cleanJobStatus(value) {
  const s = String(value || "").trim().toLowerCase();
  return ["scheduled", "in_progress", "cancelled", "completed"].includes(s) ? s : null;
}

function appendNote(existing, extra) {
  const a = cleanText(existing);
  const b = cleanText(extra);
  if (!a) return b || null;
  if (!b) return a;
  return `${a}\n${b}`;
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
