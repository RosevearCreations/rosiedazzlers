// functions/api/admin/day_schedule.js
//
// Role-aware admin day schedule endpoint.
//
// What this file does:
// - requires manage_bookings capability
// - loads one service date schedule in one call
// - supports the LIVE legacy block schema:
//     date_blocks(blocked_date, reason)
//     slot_blocks(blocked_date, slot, reason)
// - maps those legacy rows into the newer UI shape expected by admin-blocks.html
// - returns date block, slot blocks, and bookings occupying AM / PM / FULL space
//
// Supported request body:
// {
//   service_date: "2026-03-21"
// }

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
    const service_date = cleanDate(body.service_date);

    if (!service_date) {
      return withCors(json({ error: "Valid service_date is required." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);

    const [dateBlockRes, slotBlocksRes, bookingsRes] = await Promise.all([
      fetch(buildDateBlockUrl(env, service_date), { headers }),
      fetch(buildSlotBlocksUrl(env, service_date), { headers }),
      fetch(buildBookingsUrl(env, service_date), { headers })
    ]);

    if (!dateBlockRes.ok) {
      const text = await dateBlockRes.text();
      return withCors(json({ error: `Could not load date block. ${text}` }, 500));
    }

    if (!slotBlocksRes.ok) {
      const text = await slotBlocksRes.text();
      return withCors(json({ error: `Could not load slot blocks. ${text}` }, 500));
    }

    if (!bookingsRes.ok) {
      const text = await bookingsRes.text();
      return withCors(json({ error: `Could not load bookings for day. ${text}` }, 500));
    }

    const [dateBlockRows, slotBlockRows, bookingRows] = await Promise.all([
      dateBlockRes.json().catch(() => []),
      slotBlocksRes.json().catch(() => []),
      bookingsRes.json().catch(() => [])
    ]);

    const dateBlock = Array.isArray(dateBlockRows) ? dateBlockRows[0] || null : null;
    const slotBlocks = Array.isArray(slotBlockRows) ? slotBlockRows : [];
    const bookings = Array.isArray(bookingRows) ? bookingRows : [];

    const slotSummary = summarizeSlots(slotBlocks, bookings);

    return withCors(
      json({
        ok: true,
        actor: {
          id: access.actor.id || null,
          full_name: access.actor.full_name || null,
          email: access.actor.email || null,
          role_code: access.actor.role_code || null
        },
        service_date,
        date_block: dateBlock
          ? {
              id: dateBlock.id || null,
              block_date: dateBlock.blocked_date || null,
              blocked_date: dateBlock.blocked_date || null,
              is_closed: true,
              reason: dateBlock.reason || null,
              created_at: dateBlock.created_at || null,
              updated_at: dateBlock.updated_at || null
            }
          : null,
        slot_blocks: slotBlocks.map((row) => ({
          id: row.id || null,
          block_date: row.blocked_date || null,
          blocked_date: row.blocked_date || null,
          slot_code: normalizeSlot(row.slot) || row.slot || null,
          slot: normalizeSlot(row.slot) || row.slot || null,
          is_blocked: true,
          reason: row.reason || null,
          created_at: row.created_at || null,
          updated_at: row.updated_at || null
        })),
        slots: slotSummary,
        bookings: bookings.map((row) => ({
          id: row.id,
          service_date: row.service_date || null,
          start_slot: normalizeSlot(row.start_slot) || row.start_slot || null,
          status: row.status || null,
          job_status: row.job_status || null,
          customer_name: row.customer_name || null,
          customer_email: row.customer_email || null,
          customer_phone: row.customer_phone || null,
          package_code: row.package_code || null,
          vehicle_size: row.vehicle_size || null,
          assigned_to: row.assigned_to || null,
          assigned_staff_user_id: row.assigned_staff_user_id || null,
          assigned_staff_email: row.assigned_staff_email || null,
          assigned_staff_name: row.assigned_staff_name || null,
          progress_enabled: row.progress_enabled === true
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

/* ---------------- query builders ---------------- */

function buildDateBlockUrl(env, service_date) {
  return (
    `${env.SUPABASE_URL}/rest/v1/date_blocks` +
    `?select=id,blocked_date,reason,created_at` +
    `&blocked_date=eq.${encodeURIComponent(service_date)}` +
    `&limit=1`
  );
}

function buildSlotBlocksUrl(env, service_date) {
  return (
    `${env.SUPABASE_URL}/rest/v1/slot_blocks` +
    `?select=id,blocked_date,slot,reason,created_at` +
    `&blocked_date=eq.${encodeURIComponent(service_date)}` +
    `&order=slot.asc,created_at.desc`
  );
}

function buildBookingsUrl(env, service_date) {
  return (
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,service_date,start_slot,status,job_status,customer_name,customer_email,customer_phone,package_code,vehicle_size,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,progress_enabled,created_at` +
    `&service_date=eq.${encodeURIComponent(service_date)}` +
    `&order=created_at.desc`
  );
}

/* ---------------- slot summary ---------------- */

function summarizeSlots(slotBlocks, bookings) {
  const blockMap = new Map();

  for (const row of slotBlocks) {
    const slot = normalizeSlot(row.slot);
    if (!slot) continue;

    const current = blockMap.get(slot) || [];
    current.push({
      id: row.id,
      reason: row.reason || null,
      is_blocked: true
    });
    blockMap.set(slot, current);
  }

  const activeBookings = bookings.filter((row) => !isCancelled(row.status, row.job_status));

  const amBookings = activeBookings.filter((row) => bookingUsesSlot(row.start_slot, "AM"));
  const pmBookings = activeBookings.filter((row) => bookingUsesSlot(row.start_slot, "PM"));
  const fullDayBookings = activeBookings.filter((row) => normalizeSlot(row.start_slot) === "FULL");

  return {
    AM: {
      slot_code: "AM",
      blocked: (blockMap.get("AM") || []).length > 0,
      block_reasons: (blockMap.get("AM") || []).filter((row) => row.reason).map((row) => row.reason),
      active_booking_count: amBookings.length,
      available:
        (blockMap.get("AM") || []).length === 0 && amBookings.length === 0,
      bookings: amBookings.map(slimBooking)
    },
    PM: {
      slot_code: "PM",
      blocked: (blockMap.get("PM") || []).length > 0,
      block_reasons: (blockMap.get("PM") || []).filter((row) => row.reason).map((row) => row.reason),
      active_booking_count: pmBookings.length,
      available:
        (blockMap.get("PM") || []).length === 0 && pmBookings.length === 0,
      bookings: pmBookings.map(slimBooking)
    },
    FULL: {
      slot_code: "FULL",
      blocked:
        (blockMap.get("AM") || []).length > 0 ||
        (blockMap.get("PM") || []).length > 0,
      block_reasons: [
        ...((blockMap.get("AM") || []).filter((row) => row.reason).map((row) => `AM: ${row.reason}`)),
        ...((blockMap.get("PM") || []).filter((row) => row.reason).map((row) => `PM: ${row.reason}`))
      ],
      active_booking_count: fullDayBookings.length,
      available:
        (blockMap.get("AM") || []).length === 0 &&
        (blockMap.get("PM") || []).length === 0 &&
        amBookings.length === 0 &&
        pmBookings.length === 0,
      bookings: activeBookings
        .filter((row) => bookingUsesSlot(row.start_slot, "AM") || bookingUsesSlot(row.start_slot, "PM"))
        .map(slimBooking)
    }
  };
}

function slimBooking(row) {
  return {
    id: row.id,
    start_slot: normalizeSlot(row.start_slot) || row.start_slot || null,
    status: row.status || null,
    job_status: row.job_status || null,
    customer_name: row.customer_name || null,
    customer_email: row.customer_email || null,
    package_code: row.package_code || null,
    vehicle_size: row.vehicle_size || null,
    assigned_to: row.assigned_to || null
  };
}

/* ---------------- booking / slot helpers ---------------- */

function normalizeSlot(value) {
  const s = String(value || "").trim().toUpperCase();

  if (["AM", "MORNING"].includes(s)) return "AM";
  if (["PM", "AFTERNOON"].includes(s)) return "PM";
  if (["FULL", "FULL_DAY", "BOTH", "ALL_DAY"].includes(s)) return "FULL";

  return s || null;
}

function bookingUsesSlot(startSlot, slot) {
  const normalized = normalizeSlot(startSlot);
  const wanted = normalizeSlot(slot);

  if (!normalized || !wanted) return false;
  if (normalized === "FULL") return wanted === "AM" || wanted === "PM";
  return normalized === wanted;
}

function isCancelled(status, job_status) {
  const a = String(status || "").trim().toLowerCase();
  const b = String(job_status || "").trim().toLowerCase();
  return a === "cancelled" || b === "cancelled";
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

function cleanDate(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
