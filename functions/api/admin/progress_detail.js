// functions/api/admin/progress_detail.js
//
// Role-aware combined progress detail endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - supports token-based booking lookup (preferred progress model)
// - allows admin / booking managers to read any booking progress detail
// - allows assigned detailers / senior detailers to read only bookings they can work
// - returns booking + progress updates + media + signoff in one call
//
// Supported request body:
// {
//   token?: "progress-token",
//   booking_id?: "uuid"
// }
//
// Request headers supported:
// - x-admin-password: transitional compatibility only when explicitly used
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
    const booking_id = String(body.booking_id || "").trim();
    const visibility_filter = String(body.visibility_filter || "all").trim().toLowerCase();

    if (!token && !booking_id) {
      return withCors(json({ error: "Missing token or booking_id." }, 400));
    }

    if (booking_id && !isUuid(booking_id)) {
      return withCors(json({ error: "Invalid booking_id." }, 400));
    }

    const headers = serviceHeaders(env);

    const bookingLookup = await loadBookingByTokenOrId({
      env,
      headers,
      token,
      bookingId: booking_id
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
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const [updatesRes, mediaRes, signoffRes] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_updates` +
          `?select=id,booking_id,created_at,created_by,note,visibility` +
          `&booking_id=eq.${encodeURIComponent(booking.id)}` +
          `&order=created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_media` +
          `?select=id,booking_id,media_url,media_type,caption,visibility,sort_order,uploaded_by_staff_user_id,uploaded_by_staff_name,created_at` +
          `&booking_id=eq.${encodeURIComponent(booking.id)}` +
          `&order=sort_order.asc,created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_signoffs` +
          `?select=id,booking_id,customer_name,signature_data_url,approval_notes,signed_at,updated_by_staff_user_id,updated_by_staff_name,created_at,updated_at` +
          `&booking_id=eq.${encodeURIComponent(booking.id)}` +
          `&limit=1`,
        { headers }
      )
    ]);

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

    const [updateRows, mediaRows, signoffRows] = await Promise.all([
      updatesRes.json().catch(() => []),
      mediaRes.json().catch(() => []),
      signoffRes.json().catch(() => [])
    ]);

    const allUpdates = Array.isArray(updateRows) ? updateRows : [];
    const allMedia = Array.isArray(mediaRows) ? mediaRows : [];
    const updates = applyVisibilityFilter(allUpdates, visibility_filter);
    const media = applyVisibilityFilter(allMedia, visibility_filter);
    const signoff = Array.isArray(signoffRows) ? signoffRows[0] || null : null;

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
        progress: {
          count: updates.length,
          latest_at: updates.length ? updates[0].created_at || null : null,
          updates
        },
        media: {
          count: media.length,
          items: media
        },
        actor: {
          id: access.actor.id || null,
          full_name: access.actor.full_name || null,
          email: access.actor.email || null,
          role_code: access.actor.role_code || null
        },
        signoff: signoff
          ? {
              id: signoff.id,
              booking_id: signoff.booking_id,
              customer_name: signoff.customer_name || null,
              signature_data_url: signoff.signature_data_url || null,
              approval_notes: signoff.approval_notes || null,
              signed_at: signoff.signed_at || null,
              updated_by_staff_user_id: signoff.updated_by_staff_user_id || null,
              updated_by_staff_name: signoff.updated_by_staff_name || null,
              created_at: signoff.created_at || null,
              updated_at: signoff.updated_at || null
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

async function loadBookingByTokenOrId({ env, headers, token, bookingId }) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,service_date,start_slot,status,job_status,customer_name,customer_email,customer_phone,package_code,vehicle_size,progress_enabled,progress_token,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name` +
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


function applyVisibilityFilter(items, filterValue) {
  const rows = Array.isArray(items) ? items : [];
  if (!filterValue || filterValue === "all") return rows;
  if (filterValue === "internal") return rows.filter((row) => String(row.visibility || "customer").toLowerCase() === "internal");
  if (filterValue === "hidden") return rows.filter((row) => String(row.visibility || "customer").toLowerCase() === "hidden");
  if (filterValue === "customer") return rows.filter((row) => !row.visibility || String(row.visibility).toLowerCase() === "customer");
  return rows;
}
