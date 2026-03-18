// functions/api/admin/progress_list.js
//
// Role-aware progress list endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - supports token-based booking lookup (preferred progress model)
// - allows admin / booking managers to read any booking progress
// - allows assigned detailers / senior detailers to read only bookings they can work
// - returns job_updates for the booking in newest-first order
//
// Supported request body:
// {
//   token?: "progress-token",
//   booking_id?: "uuid"
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
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return withCors(json({ error: "Invalid request body." }, 400));
    }

    const token = String(body.token || "").trim();
    const directBookingId = String(body.booking_id || "").trim();

    if (!token && !directBookingId) {
      return withCors(json({ error: "Missing token or booking_id." }, 400));
    }

    if (directBookingId && !isUuid(directBookingId)) {
      return withCors(json({ error: "Invalid booking_id." }, 400));
    }

    const headers = serviceHeaders(env);

    const bookingLookup = await loadBookingByTokenOrId({
      env,
      headers,
      token,
      bookingId: directBookingId
    });

    if (!bookingLookup.ok) {
      return withCors(bookingLookup.response);
    }

    const booking = bookingLookup.booking;

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: booking.id,
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const updatesRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/job_updates` +
        `?select=id,booking_id,created_at,created_by,note,visibility` +
        `&booking_id=eq.${encodeURIComponent(booking.id)}` +
        `&order=created_at.desc`,
      { headers }
    );

    if (!updatesRes.ok) {
      const text = await updatesRes.text();
      return withCors(json({ error: `Could not load progress updates. ${text}` }, 500));
    }

    const rows = await updatesRes.json().catch(() => []);

    return withCors(
      json({
        ok: true,
        booking: {
          id: booking.id,
          progress_enabled: booking.progress_enabled,
          progress_token: booking.progress_token || null
        },
        updates: Array.isArray(rows) ? rows : []
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

async function loadBookingByTokenOrId({ env, headers, token, bookingId }) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,progress_enabled,progress_token,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,status,job_status` +
    `&limit=1`;

  if (bookingId) {
    url += `&id=eq.${encodeURIComponent(bookingId)}`;
  } else {
    url += `&progress_token=eq.${encodeURIComponent(token)}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not load booking. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const booking = Array.isArray(rows) ? rows[0] || null : null;

  if (!booking) {
    return {
      ok: false,
      response: json(
        { error: bookingId ? "Booking not found." : "Booking not found for token." },
        404
      )
    };
  }

  return { ok: true, booking };
}
