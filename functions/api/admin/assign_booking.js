// functions/api/admin/assign_booking.js
//
// Role-aware booking assignment endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_bookings capability
// - assigns or clears booking staff assignment
// - preserves legacy assigned_to while also filling structured staff fields
// - supports assignment by staff_user_id and/or email
//
// Supported request body:
// {
//   booking_id: "uuid",
//   assigned_staff_user_id?: "uuid",
//   assigned_staff_email?: "staff@example.com",
//   assigned_to?: "Display Name"   // legacy/manual fallback
// }
//
// Notes:
// - If assigned_staff_user_id is sent, the endpoint resolves the staff user.
// - If assigned_staff_email is sent, the endpoint resolves the staff user.
// - If only assigned_to is sent, legacy name-only assignment still works.
// - If none are sent, the assignment is cleared.

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  cleanText,
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

    const booking_id = String(body.booking_id || "").trim();
    if (!booking_id) {
      return withCors(json({ error: "Missing booking_id." }, 400));
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

    const normalized = {
      assigned_staff_user_id: cleanText(body.assigned_staff_user_id),
      assigned_staff_email: String(body.assigned_staff_email || "").trim().toLowerCase() || null,
      assigned_to: cleanText(body.assigned_to)
    };

    if (normalized.assigned_staff_user_id && !isUuid(normalized.assigned_staff_user_id)) {
      return withCors(json({ error: "Invalid assigned_staff_user_id." }, 400));
    }

    let resolvedStaff = null;

    if (normalized.assigned_staff_user_id) {
      resolvedStaff = await findStaffUserById(env, headers, normalized.assigned_staff_user_id);
      if (!resolvedStaff) {
        return withCors(json({ error: "Assigned staff user not found or inactive." }, 404));
      }
    } else if (normalized.assigned_staff_email) {
      resolvedStaff = await findStaffUserByEmail(env, headers, normalized.assigned_staff_email);
      if (!resolvedStaff) {
        return withCors(json({ error: "Assigned staff user not found or inactive." }, 404));
      }
    }

    const patch = buildAssignmentPatch({ resolvedStaff, normalized });
    patch.updated_at = new Date().toISOString();

    const patchRes = await fetch(
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

    if (!patchRes.ok) {
      const text = await patchRes.text();
      return withCors(json({ error: `Could not update assigned staff. ${text}` }, 500));
    }

    const rows = await patchRes.json().catch(() => []);
    const booking = Array.isArray(rows) ? rows[0] : null;

    if (!booking) {
      return withCors(json({ error: "Booking not found." }, 404));
    }

    return withCors(
      json({
        ok: true,
        message: booking.assigned_to ? "Booking assigned." : "Booking assignment cleared.",
        booking: {
          id: booking.id,
          assigned_to: booking.assigned_to || null,
          assigned_staff_user_id: booking.assigned_staff_user_id || null,
          assigned_staff_email: booking.assigned_staff_email || null,
          assigned_staff_name: booking.assigned_staff_name || null
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

async function findStaffUserById(env, headers, id) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
      `?select=id,full_name,email,role_code,is_active` +
      `&id=eq.${encodeURIComponent(id)}` +
      `&is_active=eq.true` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) return null;

  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function findStaffUserByEmail(env, headers, email) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
      `?select=id,full_name,email,role_code,is_active` +
      `&email=eq.${encodeURIComponent(email)}` +
      `&is_active=eq.true` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) return null;

  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function buildAssignmentPatch({ resolvedStaff, normalized }) {
  // Clear assignment
  if (!resolvedStaff && !normalized.assigned_to) {
    return {
      assigned_to: null,
      assigned_staff_user_id: null,
      assigned_staff_email: null,
      assigned_staff_name: null
    };
  }

  // Structured assignment from staff_users table
  if (resolvedStaff) {
    return {
      assigned_to: resolvedStaff.full_name || normalized.assigned_to || null,
      assigned_staff_user_id: resolvedStaff.id || null,
      assigned_staff_email: resolvedStaff.email || null,
      assigned_staff_name: resolvedStaff.full_name || null
    };
  }

  // Legacy/manual name-only fallback
  return {
    assigned_to: normalized.assigned_to || null,
    assigned_staff_user_id: null,
    assigned_staff_email: null,
    assigned_staff_name: normalized.assigned_to || null
  };
}
