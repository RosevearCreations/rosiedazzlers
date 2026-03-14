// /functions/api/progress_list_public.js
// REPLACE ENTIRE FILE
//
// Public endpoint: returns ONLY visibility='public' progress updates for a booking.
//
// POST JSON:
// {
//   "booking_id": "uuid",
//   "limit": 50
// }
//
// Security model (simple for now):
// - Anyone with the booking_id link can view public updates
// Later we can require customer_email verification or user login.

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);

    const booking_id = String(body?.booking_id || "").trim();
    if (!isUuid(booking_id)) return json({ ok: false, error: "Invalid booking_id" }, 400);

    const limit = Math.max(1, Math.min(100, Number(body?.limit || 50)));

    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const url =
      `${SUPABASE_URL}/rest/v1/progress_updates` +
      `?select=id,booking_id,stage,progress_percent,photo_url,note,created_at,visibility` +
      `&booking_id=eq.${encodeURIComponent(booking_id)}` +
      `&visibility=eq.public` +
      `&order=created_at.asc` +
      `&limit=${encodeURIComponent(String(limit))}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    const data = safeJson(text);

    if (!res.ok) {
      return json({ ok: false, error: "Supabase error (progress_updates public list)", details: data }, 502);
    }

    // Strip visibility field before returning (optional)
    const rows = Array.isArray(data) ? data.map(r => ({
      id: r.id,
      booking_id: r.booking_id,
      stage: r.stage,
      progress_percent: r.progress_percent,
      photo_url: r.photo_url,
      note: r.note,
      created_at: r.created_at,
    })) : [];

    return json({ ok: true, rows });

  } catch (e) {
    return json({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}
