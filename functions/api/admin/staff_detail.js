// functions/api/admin/staff_detail.js
//
// Role-aware staff detail endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_staff capability
// - loads one staff_users row in full
// - returns recent assigned bookings for that staff user
// - returns override log activity summary for that staff user
// - supports the /admin-staff page with one-record detail data
//
// Supported request body:
// {
//   staff_user_id: "uuid"
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
    const staff_user_id = String(body.staff_user_id || "").trim();

    if (!staff_user_id) {
      return withCors(json({ error: "Missing staff_user_id." }, 400));
    }

    if (!isUuid(staff_user_id)) {
      return withCors(json({ error: "Invalid staff_user_id." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_staff",
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);

    const staffRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/staff_users` +
        `?select=id,created_at,updated_at,full_name,email,role_code,is_active,` +
        `can_override_lower_entries,can_manage_bookings,can_manage_blocks,` +
        `can_manage_progress,can_manage_promos,can_manage_staff,preferred_contact_name,sms_phone,phone,address_line1,address_line2,city,province,postal_code,employee_code,position_title,hire_date,emergency_contact_name,emergency_contact_phone,vehicle_notes,vehicle_info,notes,department,admin_level,pay_schedule,hourly_rate_cents,preferred_work_hours,admin_private_notes,detailer_level,permissions_profile,personal_admin_notes,tips_payout_notes,supervisor_staff_user_id` +
        `&id=eq.${encodeURIComponent(staff_user_id)}` +
        `&limit=1`,
      { headers }
    );

    if (!staffRes.ok) {
      const text = await staffRes.text();
      return withCors(json({ error: `Could not load staff user. ${text}` }, 500));
    }

    const staffRows = await staffRes.json().catch(() => []);
    const staff = Array.isArray(staffRows) ? staffRows[0] || null : null;

    if (!staff) {
      return withCors(json({ error: "Staff user not found." }, 404));
    }

    const [bookingsRes, overrideByRes, overridePrevRes] = await Promise.all([
      fetch(buildBookingsUrl(env, staff), { headers }),
      fetch(buildOverrideByUrl(env, staff_user_id), { headers }),
      fetch(buildOverridePrevUrl(env, staff_user_id), { headers })
    ]);

    if (!bookingsRes.ok) {
      const text = await bookingsRes.text();
      return withCors(json({ error: `Could not load assigned bookings. ${text}` }, 500));
    }

    if (!overrideByRes.ok) {
      const text = await overrideByRes.text();
      return withCors(json({ error: `Could not load override activity. ${text}` }, 500));
    }

    if (!overridePrevRes.ok) {
      const text = await overridePrevRes.text();
      return withCors(json({ error: `Could not load override history. ${text}` }, 500));
    }

    const [bookingRows, overrideByRows, overridePrevRows] = await Promise.all([
      bookingsRes.json().catch(() => []),
      overrideByRes.json().catch(() => []),
      overridePrevRes.json().catch(() => [])
    ]);

    const bookings = Array.isArray(bookingRows) ? bookingRows : [];
    const overridesBy = Array.isArray(overrideByRows) ? overrideByRows : [];
    const overridesPrev = Array.isArray(overridePrevRows) ? overridePrevRows : [];

    return withCors(
      json({
        ok: true,
        actor: {
          id: access.actor.id || null,
          full_name: access.actor.full_name || null,
          email: access.actor.email || null,
          role_code: access.actor.role_code || null
        },
        staff_user: {
          id: staff.id,
          created_at: staff.created_at || null,
          updated_at: staff.updated_at || null,
          full_name: staff.full_name || null,
          email: staff.email || null,
          role_code: staff.role_code || null,
          is_active: staff.is_active === true,
          can_override_lower_entries: staff.can_override_lower_entries === true,
          can_manage_bookings: staff.can_manage_bookings === true,
          can_manage_blocks: staff.can_manage_blocks === true,
          can_manage_progress: staff.can_manage_progress === true,
          can_manage_promos: staff.can_manage_promos === true,
          can_manage_staff: staff.can_manage_staff === true,
          phone: staff.phone || null,
          address_line1: staff.address_line1 || null,
          address_line2: staff.address_line2 || null,
          city: staff.city || null,
          province: staff.province || null,
          postal_code: staff.postal_code || null,
          employee_code: staff.employee_code || null,
          position_title: staff.position_title || null,
          hire_date: staff.hire_date || null,
          emergency_contact_name: staff.emergency_contact_name || null,
          emergency_contact_phone: staff.emergency_contact_phone || null,
          vehicle_notes: staff.vehicle_notes || null,
          notes: staff.notes || null
        },
        assignment_summary: summarizeBookings(bookings),
        recent_assigned_bookings: bookings.slice(0, 20).map((row) => ({
          id: row.id,
          created_at: row.created_at || null,
          updated_at: row.updated_at || null,
          service_date: row.service_date || null,
          start_slot: row.start_slot || null,
          status: row.status || null,
          job_status: row.job_status || null,
          customer_name: row.customer_name || null,
          package_code: row.package_code || null,
          vehicle_size: row.vehicle_size || null,
          assigned_to: row.assigned_to || null
        })),
        override_activity: {
          overrides_made_count: overridesBy.length,
          overridden_by_others_count: overridesPrev.length,
          recent_overrides_made: overridesBy.slice(0, 20).map((row) => ({
            id: row.id,
            booking_id: row.booking_id || null,
            source_table: row.source_table || null,
            source_row_id: row.source_row_id || null,
            override_reason: row.override_reason || null,
            change_summary: row.change_summary || null,
            created_at: row.created_at || null
          })),
          recent_times_overridden: overridesPrev.slice(0, 20).map((row) => ({
            id: row.id,
            booking_id: row.booking_id || null,
            source_table: row.source_table || null,
            source_row_id: row.source_row_id || null,
            override_reason: row.override_reason || null,
            change_summary: row.change_summary || null,
            created_at: row.created_at || null
          }))
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

/* ---------------- query builders ---------------- */

function buildBookingsUrl(env, staff) {
  const orParts = [];

  if (staff.id) {
    orParts.push(`assigned_staff_user_id.eq.${encodeURIComponent(staff.id)}`);
  }

  if (staff.email) {
    orParts.push(`assigned_staff_email.eq.${encodeURIComponent(String(staff.email).trim().toLowerCase())}`);
  }

  if (staff.full_name) {
    const fullName = String(staff.full_name).trim().replace(/,/g, " ");
    orParts.push(`assigned_staff_name.ilike.${encodeURIComponent(`*${fullName}*`)}`);
    orParts.push(`assigned_to.ilike.${encodeURIComponent(`*${fullName}*`)}`);
  }

  let url =
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,created_at,updated_at,service_date,start_slot,status,job_status,customer_name,package_code,vehicle_size,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name` +
    `&order=service_date.desc,created_at.desc` +
    `&limit=100`;

  if (!orParts.length) {
    url += `&id=eq.__no_match__`;
  } else {
    url += `&or=(${orParts.join(",")})`;
  }

  return url;
}

function buildOverrideByUrl(env, staff_user_id) {
  return (
    `${env.SUPABASE_URL}/rest/v1/staff_override_log` +
    `?select=id,booking_id,source_table,source_row_id,override_reason,change_summary,created_at` +
    `&overridden_by_staff_user_id=eq.${encodeURIComponent(staff_user_id)}` +
    `&order=created_at.desc` +
    `&limit=100`
  );
}

function buildOverridePrevUrl(env, staff_user_id) {
  return (
    `${env.SUPABASE_URL}/rest/v1/staff_override_log` +
    `?select=id,booking_id,source_table,source_row_id,override_reason,change_summary,created_at` +
    `&previous_staff_user_id=eq.${encodeURIComponent(staff_user_id)}` +
    `&order=created_at.desc` +
    `&limit=100`
  );
}

/* ---------------- summaries ---------------- */

function summarizeBookings(bookings) {
  const out = {
    booking_count: 0,
    pending_count: 0,
    confirmed_count: 0,
    in_progress_count: 0,
    completed_count: 0,
    cancelled_count: 0,
    last_booking_at: null
  };

  for (const row of bookings) {
    out.booking_count += 1;

    const status = String(row.status || "").trim().toLowerCase();
    const jobStatus = String(row.job_status || "").trim().toLowerCase();

    if (status === "pending") out.pending_count += 1;
    if (status === "confirmed") out.confirmed_count += 1;
    if (jobStatus === "in_progress") out.in_progress_count += 1;
    if (status === "completed" || jobStatus === "completed") out.completed_count += 1;
    if (status === "cancelled" || jobStatus === "cancelled") out.cancelled_count += 1;

    const currentLast = out.last_booking_at ? Date.parse(out.last_booking_at) : 0;
    const rowTime = Date.parse(row.service_date || row.created_at || 0);
    if (!out.last_booking_at || rowTime > currentLast) {
      out.last_booking_at = row.service_date || row.created_at || null;
    }
  }

  return out;
}

/* ---------------- shared helpers ---------------- */

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
