// functions/api/admin/media_list.js
//
// Role-aware job media list/read endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to read media for any booking
// - allows assigned detailers / senior detailers to read media only for bookings they can work
// - returns booking summary plus media rows for the booking
//
// Supported request body:
// {
//   booking_id: "uuid",
//   visibility?: "customer" | "internal" | "all"
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
    const visibility = cleanVisibility(body.visibility);

    if (!booking_id) {
      return withCors(json({ error: "Missing booking_id." }, 400));
    }

    if (!isUuid(booking_id)) {
      return withCors(json({ error: "Invalid booking_id." }, 400));
    }

    if (!visibility) {
      return withCors(json({ error: "Invalid visibility." }, 400));
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

    const headers = serviceHeaders(env);

    const [bookingRes, mediaRes] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/bookings` +
          `?select=id,service_date,start_slot,status,job_status,customer_name,customer_email,customer_phone,package_code,vehicle_size,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,progress_enabled,progress_token` +
          `&id=eq.${encodeURIComponent(booking_id)}` +
          `&limit=1`,
        { headers }
      ),
      fetch(buildMediaUrl(env, booking_id, visibility), { headers })
    ]);

    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return withCors(json({ error: `Could not load booking. ${text}` }, 500));
    }

    if (!mediaRes.ok) {
      const text = await mediaRes.text();
      return withCors(json({ error: `Could not load media. ${text}` }, 500));
    }

    const bookingRows = await bookingRes.json().catch(() => []);
    const mediaRows = await mediaRes.json().catch(() => []);

    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    const media = Array.isArray(mediaRows) ? mediaRows : [];

    if (!booking) {
      return withCors(json({ error: "Booking not found." }, 404));
    }

    return withCors(
      json({
        ok: true,
        booking: {
          id: booking.id,
          service_date: booking.service_date || null,
          start_slot: booking.start_slot || null,
          status: booking.status || null,
          job_status: booking.job_status || null,
          customer_name: booking.customer_name || null,
          customer_email: booking.customer_email || null,
          customer_phone: booking.customer_phone || null,
          package_code: booking.package_code || null,
          vehicle_size: booking.vehicle_size || null,
          progress_enabled: booking.progress_enabled === true,
          progress_token: booking.progress_token || null,
          assigned_to: booking.assigned_to || null,
          assigned_staff_user_id: booking.assigned_staff_user_id || null,
          assigned_staff_email: booking.assigned_staff_email || null,
          assigned_staff_name: booking.assigned_staff_name || null
        },
        filters: {
          visibility
        },
        media: media.map((row) => ({
          id: row.id,
          booking_id: row.booking_id,
          media_url: row.media_url || null,
          media_type: row.media_type || null,
          caption: row.caption || null,
          visibility: row.visibility || null,
          sort_order: row.sort_order == null ? 0 : Number(row.sort_order),
          uploaded_by_staff_user_id: row.uploaded_by_staff_user_id || null,
          uploaded_by_staff_name: row.uploaded_by_staff_name || null,
          created_at: row.created_at || null
        }))
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

function buildMediaUrl(env, bookingId, visibility) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/job_media` +
    `?select=id,booking_id,media_url,media_type,caption,visibility,sort_order,uploaded_by_staff_user_id,uploaded_by_staff_name,created_at` +
    `&booking_id=eq.${encodeURIComponent(bookingId)}` +
    `&order=sort_order.asc,created_at.desc`;

  if (visibility !== "all") {
    url += `&visibility=eq.${encodeURIComponent(visibility)}`;
  }

  return url;
}

function cleanVisibility(value) {
  const s = String(value || "all").trim().toLowerCase();
  return ["customer", "internal", "all"].includes(s) ? s : null;
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
