// functions/api/admin/dashboard_summary.js
//
// Role-aware admin dashboard summary endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - powers the main /admin dashboard with a compact operations snapshot
// - allows admin / booking managers to see full counts
// - allows senior/detailer staff to see only scoped assigned-work counts
//
// Supported request body:
// {
//   service_date?: "2026-03-19"
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

    const actor = access.actor;
    const headers = serviceHeaders(env);
    const serviceDate = cleanDate(body.service_date) || todayDate();

    if (body.service_date && !cleanDate(body.service_date)) {
      return withCors(json({ error: "Invalid service_date." }, 400));
    }

    const bookingUrl = buildBookingsUrl(env, actor, serviceDate);
    const [bookingsRes, blocksRes, promoRes] = await Promise.all([
      fetch(bookingUrl, { headers }),
      fetch(buildBlocksUrl(env, serviceDate), { headers }),
      fetch(buildPromoUrl(env), { headers })
    ]);

    if (!bookingsRes.ok) {
      const text = await bookingsRes.text();
      return withCors(json({ error: `Could not load dashboard bookings. ${text}` }, 500));
    }

    if (!blocksRes.ok) {
      const text = await blocksRes.text();
      return withCors(json({ error: `Could not load dashboard blocks. ${text}` }, 500));
    }

    if (!promoRes.ok) {
      const text = await promoRes.text();
      return withCors(json({ error: `Could not load dashboard promos. ${text}` }, 500));
    }

    const [bookingRows, blockRows, promoRows] = await Promise.all([
      bookingsRes.json().catch(() => []),
      blocksRes.json().catch(() => []),
      promoRes.json().catch(() => [])
    ]);

    const bookings = Array.isArray(bookingRows) ? bookingRows : [];
    const blocks = Array.isArray(blockRows) ? blockRows : [];
    const promos = Array.isArray(promoRows) ? promoRows : [];

    const bookingIds = bookings.map((b) => b.id).filter(Boolean);

    const [updatesMap, mediaMap, signoffMap, intakeMap, timeMap] = await Promise.all([
      loadUpdateMap(env, headers, bookingIds),
      loadMediaMap(env, headers, bookingIds),
      loadSignoffMap(env, headers, bookingIds),
      loadIntakeMap(env, headers, bookingIds),
      loadTimeMap(env, headers, bookingIds)
    ]);

    const summary = summarizeBookings({
      bookings,
      updatesMap,
      mediaMap,
      signoffMap,
      intakeMap,
      timeMap
    });

    return withCors(
      json({
        ok: true,
        actor: {
          id: actor.id || null,
          full_name: actor.full_name || null,
          email: actor.email || null,
          role_code: actor.role_code || null
        },
        service_date: serviceDate,
        scope: actor.is_admin || actor.can_manage_bookings ? "full" : "assigned",
        summary: {
          bookings_total: summary.bookings_total,
          pending_count: summary.pending_count,
          confirmed_count: summary.confirmed_count,
          in_progress_count: summary.in_progress_count,
          completed_count: summary.completed_count,
          cancelled_count: summary.cancelled_count,
          progress_enabled_count: summary.progress_enabled_count,
          intake_complete_count: summary.intake_complete_count,
          signoff_complete_count: summary.signoff_complete_count,
          total_time_minutes: summary.total_time_minutes,
          progress_note_count: summary.progress_note_count,
          media_count: summary.media_count,
          blocked_slots_count: blocks.length,
          active_promos_count: promos.length
        },
        upcoming: bookings.slice(0, 12).map((row) => ({
          id: row.id,
          service_date: row.service_date || null,
          start_slot: row.start_slot || null,
          status: row.status || null,
          job_status: row.job_status || null,
          customer_name: row.customer_name || null,
          package_code: row.package_code || null,
          vehicle_size: row.vehicle_size || null,
          assigned_to: row.assigned_to || null,
          progress_enabled: row.progress_enabled === true,
          intake_complete: intakeMap.get(row.id) === true,
          has_signoff: signoffMap.get(row.id) === true,
          time_minutes: timeMap.get(row.id) || 0,
          progress_notes: updatesMap.get(row.id) || 0,
          media_items: mediaMap.get(row.id) || 0
        }))
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

/* ---------------- queries ---------------- */

function buildBookingsUrl(env, actor, serviceDate) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,service_date,start_slot,status,job_status,customer_name,package_code,vehicle_size,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,progress_enabled,created_at` +
    `&service_date=eq.${encodeURIComponent(serviceDate)}` +
    `&order=start_slot.asc,created_at.desc`;

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

function buildBlocksUrl(env, serviceDate) {
  return (
    `${env.SUPABASE_URL}/rest/v1/slot_blocks` +
    `?select=id,block_date,slot_code,is_blocked` +
    `&block_date=eq.${encodeURIComponent(serviceDate)}` +
    `&is_blocked=eq.true`
  );
}

function buildPromoUrl(env) {
  const nowIso = new Date().toISOString();
  return (
    `${env.SUPABASE_URL}/rest/v1/promo_codes` +
    `?select=id,code,is_active,starts_at,ends_at` +
    `&is_active=eq.true` +
    `&or=(starts_at.is.null,starts_at.lte.${encodeURIComponent(nowIso)})` +
    `&or=(ends_at.is.null,ends_at.gte.${encodeURIComponent(nowIso)})`
  );
}

/* ---------------- aggregates ---------------- */

async function loadUpdateMap(env, headers, bookingIds) {
  return countByBooking(
    `${env.SUPABASE_URL}/rest/v1/job_updates?select=booking_id&booking_id=in.(${encodeIdList(bookingIds)})`,
    headers
  );
}

async function loadMediaMap(env, headers, bookingIds) {
  return countByBooking(
    `${env.SUPABASE_URL}/rest/v1/job_media?select=booking_id&booking_id=in.(${encodeIdList(bookingIds)})`,
    headers
  );
}

async function loadSignoffMap(env, headers, bookingIds) {
  const rows = await fetchRows(
    `${env.SUPABASE_URL}/rest/v1/job_signoffs?select=booking_id&booking_id=in.(${encodeIdList(bookingIds)})`,
    headers
  );
  const map = new Map();
  for (const row of rows) {
    map.set(row.booking_id, true);
  }
  return map;
}

async function loadIntakeMap(env, headers, bookingIds) {
  const rows = await fetchRows(
    `${env.SUPABASE_URL}/rest/v1/jobsite_intake?select=booking_id,intake_complete&booking_id=in.(${encodeIdList(bookingIds)})`,
    headers
  );
  const map = new Map();
  for (const row of rows) {
    map.set(row.booking_id, row.intake_complete === true);
  }
  return map;
}

async function loadTimeMap(env, headers, bookingIds) {
  const rows = await fetchRows(
    `${env.SUPABASE_URL}/rest/v1/job_time_entries?select=booking_id,minutes&booking_id=in.(${encodeIdList(bookingIds)})`,
    headers
  );
  const map = new Map();
  for (const row of rows) {
    map.set(row.booking_id, (map.get(row.booking_id) || 0) + Number(row.minutes || 0));
  }
  return map;
}

async function countByBooking(url, headers) {
  const rows = await fetchRows(url, headers);
  const map = new Map();
  for (const row of rows) {
    map.set(row.booking_id, (map.get(row.booking_id) || 0) + 1);
  }
  return map;
}

async function fetchRows(url, headers) {
  if (!url.includes("in.()")) {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const rows = await res.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  }
  return [];
}

function summarizeBookings({ bookings, updatesMap, mediaMap, signoffMap, intakeMap, timeMap }) {
  const out = {
    bookings_total: bookings.length,
    pending_count: 0,
    confirmed_count: 0,
    in_progress_count: 0,
    completed_count: 0,
    cancelled_count: 0,
    progress_enabled_count: 0,
    intake_complete_count: 0,
    signoff_complete_count: 0,
    total_time_minutes: 0,
    progress_note_count: 0,
    media_count: 0
  };

  for (const row of bookings) {
    const status = String(row.status || "").toLowerCase();
    const jobStatus = String(row.job_status || "").toLowerCase();

    if (status === "pending") out.pending_count += 1;
    if (status === "confirmed") out.confirmed_count += 1;
    if (status === "cancelled") out.cancelled_count += 1;
    if (status === "completed" || jobStatus === "completed") out.completed_count += 1;
    if (jobStatus === "in_progress") out.in_progress_count += 1;
    if (row.progress_enabled === true) out.progress_enabled_count += 1;
    if (intakeMap.get(row.id) === true) out.intake_complete_count += 1;
    if (signoffMap.get(row.id) === true) out.signoff_complete_count += 1;

    out.total_time_minutes += Number(timeMap.get(row.id) || 0);
    out.progress_note_count += Number(updatesMap.get(row.id) || 0);
    out.media_count += Number(mediaMap.get(row.id) || 0);
  }

  return out;
}

/* ---------------- utilities ---------------- */

function encodeIdList(ids) {
  return Array.isArray(ids) && ids.length
    ? ids.map((id) => encodeURIComponent(String(id))).join(",")
    : "";
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

function todayDate() {
  return new Date().toISOString().slice(0, 10);
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
