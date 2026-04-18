// functions/api/admin/bookings_delete.js
//
// Role-aware booking delete endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_bookings capability
// - permanently deletes one booking row
// - intended for true admin cleanup cases, not normal cancellation flow
//
// Supported request body:
// {
//   booking_id: "uuid"
// }
//
// Notes:
// - Use booking_cancel.js for normal customer cancellations / restores
// - Use this only when the booking should be removed entirely
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
      capability: "manage_bookings",
      bookingId: booking_id,
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);
    const existing = await loadBooking(env, headers, booking_id);

    if (!existing.ok) {
      return withCors(existing.response);
    }

    const booking = existing.booking;

    const delRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`,
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
      return withCors(json({ error: `Could not delete booking. ${text}` }, 500));
    }

    const rows = await delRes.json().catch(() => []);
    const deleted = Array.isArray(rows) ? rows[0] || booking : booking;

    return withCors(
      json({
        ok: true,
        message: "Booking deleted.",
        deleted_booking: {
          id: deleted.id || booking.id,
          service_date: deleted.service_date || booking.service_date || null,
          start_slot: deleted.start_slot || booking.start_slot || null,
          status: deleted.status || booking.status || null,
          job_status: deleted.job_status || booking.job_status || null,
          customer_name: deleted.customer_name || booking.customer_name || null,
          customer_email: deleted.customer_email || booking.customer_email || null,
          customer_phone: deleted.customer_phone || booking.customer_phone || null,
          assigned_to: deleted.assigned_to || booking.assigned_to || null,
          progress_enabled:
            deleted.progress_enabled === true || booking.progress_enabled === true
        }
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
      `?select=id,service_date,start_slot,status,job_status,customer_name,customer_email,customer_phone,assigned_to,progress_enabled` +
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
