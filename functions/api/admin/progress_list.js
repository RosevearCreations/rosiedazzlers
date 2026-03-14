// /functions/api/admin/progress_list.js
// REPLACE ENTIRE FILE
//
// Lists progress updates for a booking_id (admin view).
//
// POST JSON:
// {
//   "admin_password": "....",
//   "booking_id": "uuid",
//   "limit": 20
// }
//
// Returns rows ordered newest -> oldest.

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);

    // --- Auth ---
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) return json({ ok: false, error: "Server not configured (ADMIN_PASSWORD missing)" }, 500);
    if (!body?.admin_password || body.admin_password !== ADMIN_PASSWORD) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const booking_id = String(body.booking_id || "").trim();
    if (!isUuid(booking_id)) return json({ ok: false, error: "Invalid booking_id" }, 400);

    const limit = Math.max(1, Math.min(100, Number(body.limit || 20)));

    // --- Supabase config ---
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const url =
      `${SUPABASE_URL}/rest/v1/progress_updates` +
      `?select=*` +
      `&booking_id=eq.${encodeURIComponent(booking_id)}` +
      `&order=created_at.desc` +
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
      return json({ ok: false, error: "Supabase error (progress_updates list)", details: data }, 502);
    }

    return json({ ok: true, rows: Array.isArray(data) ? data : [] });

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
