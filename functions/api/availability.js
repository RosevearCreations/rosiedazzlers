// functions/api/availability.js
// GET /api/availability?date=YYYY-MM-DD
// - confirmed bookings always block
// - pending bookings block only if created within HOLD_MINUTES

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date"); // YYYY-MM-DD

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return corsJson({ error: "Missing or invalid ?date=YYYY-MM-DD" }, 400);
  }

  const SUPABASE_URL = env.SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return corsJson({ error: "Server not configured (missing Supabase env vars)" }, 500);
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

  // 1) Is date blocked?
  const blk = await supaGet(
    `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(date)}`
  );
  if (!blk.ok) return corsJson({ error: "Supabase error (date_blocks)", details: blk }, 500);

  if (Array.isArray(blk.data) && blk.data.length > 0) {
    return corsJson({
      date,
      blocked: true,
      reason: blk.data[0]?.reason ?? "Blocked",
      AM: false,
      PM: false,
    });
  }

  // 2) Bookings that block
  const HOLD_MINUTES = 30;
  const holdSince = new Date(Date.now() - HOLD_MINUTES * 60 * 1000).toISOString();

  // confirmed always blocks
  const confirmed = await supaGet(
    `/rest/v1/bookings?select=status,start_slot,duration_slots&service_date=eq.${encodeURIComponent(
      date
    )}&status=eq.confirmed`
  );
  if (!confirmed.ok) return corsJson({ error: "Supabase error (confirmed)", details: confirmed }, 500);

  // pending blocks only if recent
  const pending = await supaGet(
    `/rest/v1/bookings?select=status,start_slot,duration_slots,created_at&service_date=eq.${encodeURIComponent(
      date
    )}&status=eq.pending&created_at=gte.${encodeURIComponent(holdSince)}`
  );
  if (!pending.ok) return corsJson({ error: "Supabase error (pending)", details: pending }, 500);

  const rows = [...(confirmed.data || []), ...(pending.data || [])];

  let AM = true;
  let PM = true;

  for (const b of rows) {
    const dur = Number(b.duration_slots);
    const slot = b.start_slot;

    // full-day blocks both
    if (dur === 2) {
      AM = false;
      PM = false;
      break;
    }

    // half-day blocks its start slot
    if (dur === 1 && slot === "AM") AM = false;
    if (dur === 1 && slot === "PM") PM = false;
  }

  return corsJson({ date, blocked: false, AM, PM, hold_minutes: HOLD_MINUTES });
}

/* ---------------- helpers ---------------- */

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
}

function corsJson(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

function corsResponse(body = "", status = 200) {
  return new Response(body, { status, headers: corsHeaders() });
}
