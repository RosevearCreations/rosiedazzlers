// /functions/api/admin/progress_post.js
// REPLACE ENTIRE FILE
//
// Creates a progress update (photo + note) tied to a booking_id.
//
// POST JSON:
// {
//   "admin_password": "....",
//   "booking_id": "uuid",
//   "stage": "arrival|precheck|wash|interior|exterior|finishing|complete",
//   "progress_percent": 0-100 (optional),
//   "visibility": "public"|"private",
//   "photo_url": "https://..." (optional),
//   "note": "text" (optional)
// }
//
// IMPORTANT:
// This expects a Supabase table named: public.progress_updates
// (We’ll create the SQL for that next.)

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

    // --- Validate input ---
    const booking_id = String(body.booking_id || "").trim();
    if (!isUuid(booking_id)) return json({ ok: false, error: "Invalid booking_id" }, 400);

    const stage = String(body.stage || "").trim() || "update";
    const visibility = String(body.visibility || "public").trim().toLowerCase();
    if (!["public", "private"].includes(visibility)) {
      return json({ ok: false, error: "visibility must be public or private" }, 400);
    }

    const progress_percent =
      body.progress_percent === null || body.progress_percent === undefined || body.progress_percent === ""
        ? null
        : Number(body.progress_percent);

    if (progress_percent !== null && (!Number.isFinite(progress_percent) || progress_percent < 0 || progress_percent > 100)) {
      return json({ ok: false, error: "progress_percent must be 0..100" }, 400);
    }

    const photo_url = body.photo_url ? String(body.photo_url).trim() : null;
    const note = body.note ? String(body.note).trim() : null;

    if (!photo_url && !note) {
      return json({ ok: false, error: "Provide photo_url or note" }, 400);
    }

    // --- Supabase config ---
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    // --- Insert update ---
    const payload = {
      booking_id,
      stage,
      progress_percent,
      visibility,
      photo_url,
      note,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/progress_updates`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = safeJson(text);

    if (!res.ok) {
      return json({ ok: false, error: "Supabase error (progress_updates insert)", details: data }, 502);
    }

    const row = Array.isArray(data) ? data[0] : data;
    return json({ ok: true, row });

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
