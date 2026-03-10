// /functions/api/availability.js
// REPLACE ENTIRE FILE
//
// GET /api/availability?date=YYYY-MM-DD
//
// Returns availability for AM/PM, respecting:
// - date_blocks (full day blocked)
// - slot_blocks (AM/PM blocked)
// - existing bookings (pending + confirmed)
//
// Env vars required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Response example:
// {
//   "date":"2026-02-28",
//   "blocked":false,
//   "reason":null,
//   "AM":true,
//   "PM":false,
//   "blocked_slots":["PM"],
//   "hold_minutes":30
// }

export async function onRequestGet({ request, env }) {
  try {
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    const HOLD_MINUTES = Number(env.PENDING_HOLD_MINUTES || 30);

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const url = new URL(request.url);
    const date = String(url.searchParams.get("date") || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ ok: false, error: "date must be YYYY-MM-DD" }, 400);
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
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    // 1) Full-day block?
    const day = await supaGet(
      `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(date)}&limit=1`
    );
    if (!day.ok) return json({ ok: false, error: "Supabase error (date_blocks)", details: day }, 502);

    if (Array.isArray(day.data) && day.data.length > 0) {
      return json({
        ok: true,
        date,
        blocked: true,
        reason: day.data[0]?.reason ?? "Blocked",
        AM: false,
        PM: false,
        blocked_slots: ["AM", "PM"],
        hold_minutes: HOLD_MINUTES,
      });
    }

    // 2) Slot blocks?
    const sblk = await supaGet(
      `/rest/v1/slot_blocks?select=slot,reason&blocked_date=eq.${encodeURIComponent(date)}`
    );
    if (!sblk.ok) return json({ ok: false, error: "Supabase error (slot_blocks)", details: sblk }, 502);

    const blockedSlots = new Set();
    for (const r of (sblk.data || [])) {
      const s = String(r.slot || "").toUpperCase();
      if (s === "AM" || s === "PM") blockedSlots.add(s);
    }

    let AM = !blockedSlots.has("AM");
    let PM = !blockedSlots.has("PM");

    // 3) Bookings on this date (pending + confirmed reserve)
    // NOTE: If you later add hold-expiry logic (created_at), we can exclude old pending holds.
    const bks = await supaGet(
      `/rest/v1/bookings?select=status,start_slot,duration_slots&service_date=eq.${encodeURIComponent(date)}&status=in.(pending,confirmed)`
    );
    if (!bks.ok) return json({ ok: false, error: "Supabase error (bookings)", details: bks }, 502);

    for (const b of (bks.data || [])) {
      const dur = Number(b.duration_slots);
      if (dur === 2) { AM = false; PM = false; break; }
      if (dur === 1 && String(b.start_slot).toUpperCase() === "AM") AM = false;
      if (dur === 1 && String(b.start_slot).toUpperCase() === "PM") PM = false;
    }

    const outBlocked = [];
    if (!AM) outBlocked.push("AM");
    if (!PM) outBlocked.push("PM");

    return json({
      ok: true,
      date,
      blocked: false,
      reason: null,
      AM,
      PM,
      blocked_slots: outBlocked,
      hold_minutes: HOLD_MINUTES,
    });
  } catch (e) {
    return json({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- helpers ---------------- */

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}
