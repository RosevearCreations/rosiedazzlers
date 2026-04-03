// functions/api/admin/booking_availability.js
//
// Role-aware admin booking availability check endpoint.
//
// What this file does:
// - prefers signed-in staff session access
// - requires manage_bookings capability
// - checks whether a selected service date / slot is usable
// - respects date_blocks and slot_blocks
// - counts existing bookings on that date/slot
// - supports excluding one booking during edit mode
//
// Supported request body:
// {
//   service_date: "2026-03-21",
//   start_slot: "AM",
//   exclude_booking_id?: "uuid"
// }
//
// Booking model notes:
// - Half-day slots are AM / PM
// - Full-day consumes both slots; this endpoint treats FULL, FULL_DAY, or BOTH
//   as both AM and PM when found in existing bookings
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

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const service_date = cleanDate(body.service_date);
    const start_slot = normalizeSlot(body.start_slot);
    const exclude_booking_id = cleanBookingId(body.exclude_booking_id);

    if (!service_date) {
      return withCors(json({ error: "Valid service_date is required." }, 400));
    }

    if (!start_slot) {
      return withCors(json({ error: "Valid start_slot is required." }, 400));
    }

    if (body.exclude_booking_id && !exclude_booking_id) {
      return withCors(json({ error: "Invalid exclude_booking_id." }, 400));
    }

    const headers = serviceHeaders(env);

    const [dateBlockRes, slotBlockRes, bookingsRes] = await Promise.all([
      fetch(buildDateBlockUrl(env, service_date), { headers }),
      fetch(buildSlotBlockUrl(env, service_date, start_slot), { headers }),
      fetch(buildBookingsUrl(env, service_date, exclude_booking_id), { headers })
    ]);

    if (!dateBlockRes.ok) {
      const text = await dateBlockRes.text();
      return withCors(json({ error: `Could not load date block data. ${text}` }, 500));
    }

    if (!slotBlockRes.ok) {
      const text = await slotBlockRes.text();
      return withCors(json({ error: `Could not load slot block data. ${text}` }, 500));
    }

    if (!bookingsRes.ok) {
      const text = await bookingsRes.text();
      return withCors(json({ error: `Could not load booking availability data. ${text}` }, 500));
    }

    const [dateBlockRows, slotBlockRows, bookingRows] = await Promise.all([
      dateBlockRes.json().catch(() => []),
      slotBlockRes.json().catch(() => []),
      bookingsRes.json().catch(() => [])
    ]);

    const dateBlocks = Array.isArray(dateBlockRows) ? dateBlockRows : [];
    const slotBlocks = Array.isArray(slotBlockRows) ? slotBlockRows : [];
    const bookings = Array.isArray(bookingRows) ? bookingRows : [];

    const isDateClosed = dateBlocks.length > 0;
    const isSlotBlocked = slotBlocks.length > 0;

    const activeBookings = bookings.filter((row) => !isCancelled(row.status, row.job_status));
    const slotBookings = activeBookings.filter((row) => bookingUsesSlot(row.start_slot, start_slot));

    const reasons = [];
    if (isDateClosed) reasons.push("Date is closed.");
    if (isSlotBlocked) reasons.push(`Slot ${start_slot} is blocked.`);
    if (slotBookings.length > 0) reasons.push(`Slot ${start_slot} already has ${slotBookings.length} active booking(s).`);

    const available = !isDateClosed && !isSlotBlocked && slotBookings.length === 0;

    return withCors(
      json({
        ok: true,
        actor: {
          id: access.actor.id || null,
          full_name: access.actor.full_name || null,
          email: access.actor.email || null,
          role_code: access.actor.role_code || null
        },
        availability: {
          service_date,
          start_slot,
          available,
          reasons,
          date_closed: isDateClosed,
          slot_blocked: isSlotBlocked,
          active_bookings_on_slot: slotBookings.length
        },
        matching_bookings: slotBookings.map((row) => ({
          id: row.id,
          service_date: row.service_date || null,
          start_slot: row.start_slot || null,
          status: row.status || null,
          job_status: row.job_status || null,
          customer_name: row.customer_name || null,
          assigned_to: row.assigned_to || null
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

/* ---------------- query builders ---------------- */

function buildDateBlockUrl(env, service_date) {
  return (
    `${env.SUPABASE_URL}/rest/v1/date_blocks` +
    `?select=id,blocked_date,reason` +
    `&blocked_date=eq.${encodeURIComponent(service_date)}`
  );
}

function buildSlotBlockUrl(env, service_date, start_slot) {
  return (
    `${env.SUPABASE_URL}/rest/v1/slot_blocks` +
    `?select=id,blocked_date,slot,reason` +
    `&blocked_date=eq.${encodeURIComponent(service_date)}` +
    `&slot=eq.${encodeURIComponent(start_slot)}`
  );
}

function buildBookingsUrl(env, service_date, exclude_booking_id) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,service_date,start_slot,status,job_status,customer_name,assigned_to` +
    `&service_date=eq.${encodeURIComponent(service_date)}` +
    `&order=created_at.desc`;

  if (exclude_booking_id) {
    url += `&id=neq.${encodeURIComponent(exclude_booking_id)}`;
  }

  return url;
}

/* ---------------- availability helpers ---------------- */

function bookingUsesSlot(bookingSlot, requestedSlot) {
  const s = normalizeSlot(bookingSlot);
  if (!s) return false;
  if (s === requestedSlot) return true;
  return s === "FULL";
}

function isCancelled(status, job_status) {
  const a = String(status || "").trim().toLowerCase();
  const b = String(job_status || "").trim().toLowerCase();
  return a === "cancelled" || b === "cancelled";
}

/* ---------------- cleaners ---------------- */

function cleanDate(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function normalizeSlot(value) {
  const s = String(value || "").trim().toUpperCase();
  if (s === "AM" || s === "PM") return s;
  if (s === "FULL" || s === "FULL_DAY" || s === "BOTH") return "FULL";
  return null;
}

function cleanBookingId(value) {
  const s = cleanText(value);
  if (!s) return null;
  return isUuid(s) ? s : null;
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
