// functions/api/admin/booking_detail.js
//
// Role-aware booking detail endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_bookings capability
// - loads one booking in full for the admin booking page
// - includes linked intake/time/progress/media/signoff summary data
// - keeps admin-booking editing/review flow simple
//
// Supported request body:
// {
//   booking_id: "uuid"
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
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);

    const [
      bookingRes,
      intakeRes,
      updatesRes,
      mediaRes,
      signoffRes,
      timeRes
    ] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/bookings` +
          `?select=*` +
          `&id=eq.${encodeURIComponent(booking_id)}` +
          `&limit=1`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/jobsite_intake` +
          `?select=*` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&limit=1`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_updates` +
          `?select=id,booking_id,created_at,created_by,note,visibility` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&order=created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_media` +
          `?select=id,booking_id,media_url,media_type,caption,visibility,sort_order,uploaded_by_staff_user_id,uploaded_by_staff_name,created_at` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&order=sort_order.asc,created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_signoffs` +
          `?select=*` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&limit=1`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_time_entries` +
          `?select=id,booking_id,minutes,note,entry_type,staff_user_id,staff_name,created_at` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&order=created_at.desc`,
        { headers }
      )
    ]);

    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return withCors(json({ error: `Could not load booking. ${text}` }, 500));
    }

    if (!intakeRes.ok) {
      const text = await intakeRes.text();
      return withCors(json({ error: `Could not load jobsite intake. ${text}` }, 500));
    }

    if (!updatesRes.ok) {
      const text = await updatesRes.text();
      return withCors(json({ error: `Could not load progress updates. ${text}` }, 500));
    }

    if (!mediaRes.ok) {
      const text = await mediaRes.text();
      return withCors(json({ error: `Could not load media. ${text}` }, 500));
    }

    if (!signoffRes.ok) {
      const text = await signoffRes.text();
      return withCors(json({ error: `Could not load signoff. ${text}` }, 500));
    }

    if (!timeRes.ok) {
      const text = await timeRes.text();
      return withCors(json({ error: `Could not load time entries. ${text}` }, 500));
    }

    const [
      bookingRows,
      intakeRows,
      updateRows,
      mediaRows,
      signoffRows,
      timeRows
    ] = await Promise.all([
      bookingRes.json().catch(() => []),
      intakeRes.json().catch(() => []),
      updatesRes.json().catch(() => []),
      mediaRes.json().catch(() => []),
      signoffRes.json().catch(() => []),
      timeRes.json().catch(() => [])
    ]);

    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    const intake = Array.isArray(intakeRows) ? intakeRows[0] || null : null;
    const updates = Array.isArray(updateRows) ? updateRows : [];
    const media = Array.isArray(mediaRows) ? mediaRows : [];
    const signoff = Array.isArray(signoffRows) ? signoffRows[0] || null : null;
    const time_entries = Array.isArray(timeRows) ? timeRows : [];

    if (!booking) {
      return withCors(json({ error: "Booking not found." }, 404));
    }

    return withCors(
      json({
        ok: true,
        booking,
        intake,
        progress: {
          count: updates.length,
          latest_at: updates.length ? updates[0].created_at || null : null,
          updates
        },
        media: {
          count: media.length,
          items: media
        },
        signoff,
        time: {
          totals: summarizeTime(time_entries),
          entries: time_entries
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

function summarizeTime(entries) {
  const totals = {
    entry_count: 0,
    total_minutes: 0,
    by_type: {},
    by_staff: {}
  };

  for (const row of entries) {
    const minutes = Number(row.minutes || 0);
    const entryType = String(row.entry_type || "work");
    const staffName = String(row.staff_name || "Unknown");

    totals.entry_count += 1;
    totals.total_minutes += minutes;

    if (!totals.by_type[entryType]) {
      totals.by_type[entryType] = {
        entry_count: 0,
        total_minutes: 0
      };
    }

    totals.by_type[entryType].entry_count += 1;
    totals.by_type[entryType].total_minutes += minutes;

    if (!totals.by_staff[staffName]) {
      totals.by_staff[staffName] = {
        entry_count: 0,
        total_minutes: 0
      };
    }

    totals.by_staff[staffName].entry_count += 1;
    totals.by_staff[staffName].total_minutes += minutes;
  }

  return totals;
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
