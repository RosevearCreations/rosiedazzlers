// functions/api/admin/signoff_list.js
//
// Role-aware job signoff list/read endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to read signoff for any booking
// - allows assigned detailers / senior detailers to read signoff only for bookings they can work
// - returns booking summary plus the current job signoff row
//
// Supported request body:
// {
//   booking_id: "uuid"
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
      capability: "work_booking",
      bookingId: booking_id,
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);

    const [bookingRes, signoffRes] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/bookings` +
          `?select=id,service_date,start_slot,status,job_status,customer_name,customer_email,customer_phone,package_code,vehicle_size,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name` +
          `&id=eq.${encodeURIComponent(booking_id)}` +
          `&limit=1`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_signoffs` +
          `?select=id,booking_id,customer_name,signature_data_url,approval_notes,signed_at,updated_by_staff_user_id,updated_by_staff_name,created_at,updated_at` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&limit=1`,
        { headers }
      )
    ]);

    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return withCors(json({ error: `Could not load booking. ${text}` }, 500));
    }

    if (!signoffRes.ok) {
      const text = await signoffRes.text();
      return withCors(json({ error: `Could not load signoff. ${text}` }, 500));
    }

    const bookingRows = await bookingRes.json().catch(() => []);
    const signoffRows = await signoffRes.json().catch(() => []);

    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    const signoff = Array.isArray(signoffRows) ? signoffRows[0] || null : null;

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
          assigned_to: booking.assigned_to || null,
          assigned_staff_user_id: booking.assigned_staff_user_id || null,
          assigned_staff_email: booking.assigned_staff_email || null,
          assigned_staff_name: booking.assigned_staff_name || null
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
