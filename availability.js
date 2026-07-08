// /functions/api/availability.js
// Build 192: availability now includes editable business-hours / holiday-closure checks.
//
// GET /api/availability?date=YYYY-MM-DD
// Returns: { ok:true, date, blocked, reason?, AM, PM, business_hours, business_hours_conflict }

import { loadEditableSetting } from "./_lib/editable-settings.js";
import { serviceHeaders } from "./_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const date = (url.searchParams.get("date") || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ ok: false, error: "Missing or invalid date (YYYY-MM-DD)" }, 400);
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const supaGet = async (path) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method: "GET",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Accept: "application/json",
        },
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      if (!res.ok) return { ok: false, status: res.status, data, raw: text };
      return { ok: true, status: res.status, data };
    };

    const businessHours = await loadBusinessHoursStatus(env, date);
    const holidayClosed = businessHours?.is_closed === true;

    // ---- 1) Full-day block? ----
    const dayBlock = await supaGet(
      `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(date)}`
    );

    if (!dayBlock.ok) {
      return json({ ok: false, error: "Supabase error (date_blocks)", details: dayBlock }, 502);
    }

    if (Array.isArray(dayBlock.data) && dayBlock.data.length > 0) {
      return json({
        ok: true,
        date,
        blocked: true,
        reason: dayBlock.data[0]?.reason ?? "Blocked",
        AM: false,
        PM: false,
        business_hours: businessHours,
        business_hours_conflict: holidayClosed,
      });
    }

    // Start as open unless editable hours/holiday settings say closed.
    let AM = !holidayClosed;
    let PM = !holidayClosed;

    // ---- 2) Slot blocks ----
    const slotBlocks = await supaGet(
      `/rest/v1/slot_blocks?select=blocked_date,slot,reason&blocked_date=eq.${encodeURIComponent(date)}`
    );

    if (!slotBlocks.ok) {
      return json({ ok: false, error: "Supabase error (slot_blocks)", details: slotBlocks }, 502);
    }

    const slots = Array.isArray(slotBlocks.data) ? slotBlocks.data : [];
    for (const s of slots) {
      const slot = String(s.slot || "").toUpperCase();
      if (slot === "AM") AM = false;
      if (slot === "PM") PM = false;
    }

    // ---- 3) Bookings reserve slots ----
    const bookings = await supaGet(
      `/rest/v1/bookings?select=status,start_slot,duration_slots&service_date=eq.${encodeURIComponent(date)}&status=in.(pending,confirmed)`
    );

    if (!bookings.ok) {
      return json({ ok: false, error: "Supabase error (bookings)", details: bookings }, 502);
    }

    for (const b of (bookings.data || [])) {
      const dur = Number(b.duration_slots);
      const start = String(b.start_slot || "").toUpperCase();

      if (dur === 2) { AM = false; PM = false; break; }
      if (dur === 1 && start === "AM") AM = false;
      if (dur === 1 && start === "PM") PM = false;
    }

    return json({
      ok: true,
      date,
      blocked: holidayClosed,
      reason: holidayClosed ? (businessHours?.reason || businessHours?.hours_label || "Closed by business-hours settings") : null,
      AM,
      PM,
      business_hours: businessHours,
      business_hours_conflict: holidayClosed,
    });

  } catch (e) {
    return json({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

async function loadBusinessHoursStatus(env, dateText) {
  const fallback = {
    date: dateText,
    day: dayKeyForDate(dateText),
    is_closed: false,
    hours_label: "By appointment",
    reason: null,
    source_status: "unavailable",
    warning: null,
  };

  try {
    const loaded = await loadEditableSetting(env, "business_hours_holidays", { headers: serviceHeaders(env) });
    const value = loaded?.value && typeof loaded.value === "object" ? loaded.value : {};
    const closures = Array.isArray(value.holiday_closures) ? value.holiday_closures : [];
    const closure = closures.find((item) => {
      const raw = String(item?.date || item?.day || item?.closure_date || "").slice(0, 10);
      return raw === dateText;
    }) || null;
    const day = dayKeyForDate(dateText);
    const hoursLabel = value.hours && typeof value.hours === "object" ? String(value.hours[day] || "By appointment") : "By appointment";
    const closedByHours = /\bclosed\b/i.test(hoursLabel);
    const closed = !!closure || closedByHours;
    return {
      date: dateText,
      day,
      is_closed: closed,
      hours_label: closure ? (closure.label || closure.reason || "Closed") : hoursLabel,
      reason: closure ? (closure.reason || closure.label || "Holiday closure") : (closedByHours ? hoursLabel : null),
      closure,
      source_status: loaded?.source_status || loaded?.source || "fallback",
      timezone: value.timezone || "America/Toronto",
      notes: value.notes || null,
    };
  } catch (error) {
    return { ...fallback, warning: String(error?.message || error) };
  }
}

function dayKeyForDate(dateText) {
  try {
    return new Date(`${dateText}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long" }).toLowerCase();
  } catch {
    return "unknown";
  }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}
