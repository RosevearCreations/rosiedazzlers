// /functions/api/availability.js
// REPLACE ENTIRE FILE
//
// GET /api/availability?date=YYYY-MM-DD
//
// Returns:
// { ok:true, date:"YYYY-MM-DD", blocked:false|true, reason?, AM:true|false, PM:true|false }
//
// Logic:
// 1) If date is in date_blocks => blocked=true
// 2) Otherwise start with AM/PM open, then apply:
//    - slot_blocks for that date (AM/PM blocks)
//    - bookings (pending/confirmed) reserve AM/PM depending on duration_slots/start_slot

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
      });
    }

    // Start as open
    let AM = true;
    let PM = true;

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

    return json({ ok: true, date, blocked: false, AM, PM });

  } catch (e) {
    return json({ ok: false, error: "Server error", details: String(e) }, 500);
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
