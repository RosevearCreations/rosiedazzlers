// functions/api/admin/live_list.js
//
// Role-aware live operations endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to view the full live operations board
// - allows assigned detailers / senior detailers to view only their scoped work
// - returns booking summary plus intake / time / progress / media / signoff counts
//
// Supported request body:
// {
//   service_date?: "2026-03-18",
//   status?: "confirmed",
//   job_status?: "in_progress"
// }
//
// Request headers supported:
// Signed-in staff session preferred; legacy admin password bridge disabled for this route.
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  cleanText
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

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "view_live_ops",
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);
    const actor = access.actor;

    const serviceDate = cleanDate(body.service_date);
    const status = cleanText(body.status);
    const jobStatus = cleanText(body.job_status);

    if (body.service_date && !serviceDate) {
      return withCors(json({ error: "Invalid service_date." }, 400));
    }

    const bookingsUrl = buildBookingsUrl(env, {
      actor,
      serviceDate,
      status,
      jobStatus
    });

    const bookingsRes = await fetch(bookingsUrl, { headers });

    if (!bookingsRes.ok) {
      const text = await bookingsRes.text();
      return withCors(json({ error: `Could not load live bookings. ${text}` }, 500));
    }

    const bookings = await bookingsRes.json().catch(() => []);
    const bookingList = Array.isArray(bookings) ? bookings : [];

    if (!bookingList.length) {
      return withCors(
        json({
          ok: true,
          actor: slimActor(actor),
          filters: {
            service_date: serviceDate,
            status: status || null,
            job_status: jobStatus || null
          },
          rows: []
        })
      );
    }

    const bookingIds = bookingList.map((b) => b.id).filter(Boolean);

    const [
      intakeMap,
      timeMap,
      progressMap,
      mediaMap,
      signoffMap
    ] = await Promise.all([
      loadIntakeMap(env, headers, bookingIds),
      loadTimeMap(env, headers, bookingIds),
      loadProgressMap(env, headers, bookingIds),
      loadMediaMap(env, headers, bookingIds),
      loadSignoffMap(env, headers, bookingIds)
    ]);

    const rows = bookingList.map((booking) => {
      const intake = intakeMap.get(booking.id) || null;
      const time = timeMap.get(booking.id) || null;
      const progress = progressMap.get(booking.id) || { count: 0, latest_at: null };
      const media = mediaMap.get(booking.id) || { count: 0, latest_at: null };
      const signoff = signoffMap.get(booking.id) || null;

      return {
        booking: {
          id: booking.id,
          service_date: booking.service_date || null,
          start_slot: booking.start_slot || null,
          status: booking.status || null,
          job_status: booking.job_status || null,
          package_code: booking.package_code || null,
          vehicle_size: booking.vehicle_size || null,
          customer_name: booking.customer_name || null,
          customer_email: booking.customer_email || null,
          customer_phone: booking.customer_phone || null,
          progress_enabled: booking.progress_enabled === true,
          progress_token: booking.progress_token || null,
          assigned_to: booking.assigned_to || null,
          assigned_staff_user_id: booking.assigned_staff_user_id || null,
          assigned_staff_email: booking.assigned_staff_email || null,
          assigned_staff_name: booking.assigned_staff_name || null
        },
        intake: intake
          ? {
              id: intake.id,
              intake_complete: intake.intake_complete === true,
              updated_at: intake.updated_at || intake.created_at || null
            }
          : null,
        time: time
          ? {
              entry_count: time.entry_count,
              total_minutes: time.total_minutes,
              last_entry_at: time.last_entry_at
            }
          : {
              entry_count: 0,
              total_minutes: 0,
              last_entry_at: null
            },
        progress: {
          count: progress.count,
          latest_at: progress.latest_at
        },
        media: {
          count: media.count,
          latest_at: media.latest_at
        },
        signoff: signoff
          ? {
              id: signoff.id,
              signed_at: signoff.signed_at || signoff.created_at || null,
              customer_name: signoff.customer_name || null
            }
          : null
      };
    });

    return withCors(
      json({
        ok: true,
        actor: slimActor(actor),
        filters: {
          service_date: serviceDate,
          status: status || null,
          job_status: jobStatus || null
        },
        rows
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

/* ---------------- bookings ---------------- */

function buildBookingsUrl(env, { actor, serviceDate, status, jobStatus }) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,service_date,start_slot,status,job_status,package_code,vehicle_size,` +
    `customer_name,customer_email,customer_phone,progress_enabled,progress_token,` +
    `assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,created_at,updated_at` +
    `&order=service_date.asc,start_slot.asc,created_at.desc`;

  if (serviceDate) {
    url += `&service_date=eq.${encodeURIComponent(serviceDate)}`;
  }

  if (status) {
    url += `&status=eq.${encodeURIComponent(status)}`;
  }

  if (jobStatus) {
    url += `&job_status=eq.${encodeURIComponent(jobStatus)}`;
  }

  if (!(actor.is_admin || actor.can_manage_bookings)) {
    const orParts = [];

    if (actor.id) {
      orParts.push(`assigned_staff_user_id.eq.${escapeFilterValue(actor.id)}`);
    }

    if (actor.email) {
      orParts.push(`assigned_staff_email.eq.${escapeFilterValue(actor.email)}`);
    }

    if (actor.full_name) {
      orParts.push(`assigned_staff_name.ilike.${escapeLikeValue(actor.full_name)}`);
      orParts.push(`assigned_to.ilike.${escapeLikeValue(actor.full_name)}`);
    }

    if (!orParts.length) {
      url += `&id=eq.__no_match__`;
    } else {
      url += `&or=(${orParts.join(",")})`;
    }
  }

  return url;
}

/* ---------------- summary maps ---------------- */

async function loadIntakeMap(env, headers, bookingIds) {
  const rows = await fetchRows(
    `${env.SUPABASE_URL}/rest/v1/jobsite_intake` +
      `?select=id,booking_id,intake_complete,created_at,updated_at` +
      `&booking_id=in.(${encodeIdList(bookingIds)})`,
    headers
  );

  const map = new Map();

  for (const row of rows) {
    const current = map.get(row.booking_id);
    const currentTime = current ? Date.parse(current.updated_at || current.created_at || 0) : 0;
    const rowTime = Date.parse(row.updated_at || row.created_at || 0);

    if (!current || rowTime >= currentTime) {
      map.set(row.booking_id, row);
    }
  }

  return map;
}

async function loadTimeMap(env, headers, bookingIds) {
  const rows = await fetchRows(
    `${env.SUPABASE_URL}/rest/v1/job_time_entries` +
      `?select=id,booking_id,minutes,created_at` +
      `&booking_id=in.(${encodeIdList(bookingIds)})`,
    headers
  );

  const map = new Map();

  for (const row of rows) {
    const key = row.booking_id;
    const current = map.get(key) || {
      entry_count: 0,
      total_minutes: 0,
      last_entry_at: null
    };

    current.entry_count += 1;
    current.total_minutes += Number(row.minutes || 0);

    const currentLast = current.last_entry_at ? Date.parse(current.last_entry_at) : 0;
    const rowTime = Date.parse(row.created_at || 0);
    if (!current.last_entry_at || rowTime > currentLast) {
      current.last_entry_at = row.created_at || null;
    }

    map.set(key, current);
  }

  return map;
}

async function loadProgressMap(env, headers, bookingIds) {
  const rows = await fetchRows(
    `${env.SUPABASE_URL}/rest/v1/job_updates` +
      `?select=id,booking_id,created_at` +
      `&booking_id=in.(${encodeIdList(bookingIds)})`,
    headers
  );

  const map = new Map();

  for (const row of rows) {
    const key = row.booking_id;
    const current = map.get(key) || { count: 0, latest_at: null };

    current.count += 1;

    const currentLast = current.latest_at ? Date.parse(current.latest_at) : 0;
    const rowTime = Date.parse(row.created_at || 0);
    if (!current.latest_at || rowTime > currentLast) {
      current.latest_at = row.created_at || null;
    }

    map.set(key, current);
  }

  return map;
}

async function loadMediaMap(env, headers, bookingIds) {
  const rows = await fetchRows(
    `${env.SUPABASE_URL}/rest/v1/job_media` +
      `?select=id,booking_id,created_at` +
      `&booking_id=in.(${encodeIdList(bookingIds)})`,
    headers
  );

  const map = new Map();

  for (const row of rows) {
    const key = row.booking_id;
    const current = map.get(key) || { count: 0, latest_at: null };

    current.count += 1;

    const currentLast = current.latest_at ? Date.parse(current.latest_at) : 0;
    const rowTime = Date.parse(row.created_at || 0);
    if (!current.latest_at || rowTime > currentLast) {
      current.latest_at = row.created_at || null;
    }

    map.set(key, current);
  }

  return map;
}

async function loadSignoffMap(env, headers, bookingIds) {
  const rows = await fetchRows(
    `${env.SUPABASE_URL}/rest/v1/job_signoffs` +
      `?select=id,booking_id,customer_name,signed_at,created_at` +
      `&booking_id=in.(${encodeIdList(bookingIds)})`,
    headers
  );

  const map = new Map();

  for (const row of rows) {
    const current = map.get(row.booking_id);
    const currentTime = current
      ? Date.parse(current.signed_at || current.created_at || 0)
      : 0;
    const rowTime = Date.parse(row.signed_at || row.created_at || 0);

    if (!current || rowTime >= currentTime) {
      map.set(row.booking_id, row);
    }
  }

  return map;
}

/* ---------------- shared helpers ---------------- */

async function fetchRows(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

function slimActor(actor) {
  return {
    id: actor.id || null,
    full_name: actor.full_name || null,
    email: actor.email || null,
    role_code: actor.role_code || null
  };
}

function encodeIdList(ids) {
  return ids.map((id) => encodeURIComponent(String(id))).join(",");
}

function escapeFilterValue(value) {
  return String(value || "").replace(/,/g, "%2C");
}

function escapeLikeValue(value) {
  return `*${String(value || "").trim().replace(/,/g, " ")}*`;
}

function cleanDate(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
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
