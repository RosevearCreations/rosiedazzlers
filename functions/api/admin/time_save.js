// functions/api/admin/time_save.js
//
// Role-aware job time save endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to log time for any booking
// - allows assigned detailers / senior detailers to log time only for bookings they can work
// - creates job_time_entries rows
// - supports simple/manual time entry flow used by admin/detailer tools
//
// Supported request body:
// {
//   booking_id: "uuid",
//   minutes: 45,
//   note?: "Interior vacuum and wipe down",
//   entry_type?: "work"
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
    const minutes = Number(body.minutes);
    const note = cleanText(body.note);
    const entry_type = cleanEntryType(body.entry_type);

    if (!booking_id) {
      return withCors(json({ error: "Missing booking_id." }, 400));
    }

    if (!isUuid(booking_id)) {
      return withCors(json({ error: "Invalid booking_id." }, 400));
    }

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return withCors(json({ error: "Valid minutes value is required." }, 400));
    }

    if (minutes > 1440) {
      return withCors(json({ error: "Minutes value is too large." }, 400));
    }

    if (!entry_type) {
      return withCors(json({ error: "Invalid entry_type." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: booking_id,
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const payload = {
      booking_id,
      minutes: Math.round(minutes),
      note,
      entry_type,
      staff_user_id: access.actor.id || null,
      staff_name: access.actor.full_name || cleanText(body.staff_name) || "Staff"
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/job_time_entries`, {
      method: "POST",
      headers: {
        ...serviceHeaders(env),
        Prefer: "return=representation"
      },
      body: JSON.stringify([payload])
    });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not save time entry. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        message: "Time entry saved.",
        time_entry: row
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

function cleanEntryType(value) {
  const s = String(value || "work").trim().toLowerCase();
  return ["work", "travel", "setup", "cleanup", "other"].includes(s) ? s : null;
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
