// functions/api/admin/progress_enable.js
//
// Role-aware progress enable/disable endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_bookings capability
// - enables or disables booking progress sharing
// - creates a progress_token when enabling if one does not already exist
// - preserves existing token by default when toggling progress
//
// Supported request body:
// {
//   booking_id: "uuid",
//   progress_enabled: true,
//   regenerate_token?: false
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
  isUuid,
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

    if (body.progress_enabled === undefined) {
      return withCors(json({ error: "progress_enabled is required." }, 400));
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
    const progress_enabled = toBoolean(body.progress_enabled);
    const regenerate_token =
      body.regenerate_token === undefined ? false : toBoolean(body.regenerate_token);

    const existing = await loadBooking(env, headers, booking_id);
    if (!existing.ok) {
      return withCors(existing.response);
    }

    const booking = existing.booking;
    let progress_token = booking.progress_token || null;

    if (progress_enabled && (!progress_token || regenerate_token)) {
      progress_token = crypto.randomUUID();
    }

    const patch = {
      progress_enabled,
      progress_token,
      updated_at: new Date().toISOString()
    };

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
      return withCors(json({ error: `Could not update progress settings. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        message: progress_enabled ? "Progress enabled." : "Progress disabled.",
        booking: row
          ? {
              id: row.id,
              progress_enabled: row.progress_enabled === true,
              progress_token: row.progress_token || null,
              updated_at: row.updated_at || null
            }
          : null
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

async function loadBooking(env, headers, bookingId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/bookings` +
      `?select=id,progress_enabled,progress_token,updated_at` +
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
