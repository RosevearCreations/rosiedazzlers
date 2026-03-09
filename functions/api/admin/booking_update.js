// functions/api/admin/booking_update.js
// POST /api/admin/booking_update
// Admin-only: update booking operational fields:
// - job_status (scheduled | in_progress | completed | cancelled)
// - progress_enabled (true/false)
// - regenerate progress_token (new UUID) and return the customer progress/complete links
//
// Env vars required:
// - ADMIN_PASSWORD
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Request JSON examples:
//
// 1) Set job status:
// { "admin_password":"...", "booking_id":"uuid", "action":"set_job_status", "job_status":"in_progress" }
//
// 2) Toggle progress visibility:
// { "admin_password":"...", "booking_id":"uuid", "action":"set_progress_enabled", "progress_enabled":true }
//
// 3) Regenerate progress token:
// { "admin_password":"...", "booking_id":"uuid", "action":"regen_progress_token" }
//
// Response:
// { ok:true, booking_id, row, links:{ progress_url, complete_url } }

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "";
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!ADMIN_PASSWORD) return corsJson({ ok: false, error: "Server missing ADMIN_PASSWORD" }, 500);
    if (!SUPABASE_URL || !SERVICE_KEY) return corsJson({ ok: false, error: "Server missing Supabase env vars" }, 500);

    const body = await readJson(request);

    const pw = String(body.admin_password || "");
    if (!timingSafeEqual(pw, ADMIN_PASSWORD)) return corsJson({ ok: false, error: "Unauthorized" }, 401);

    const bookingId = String(body.booking_id || "").trim();
    if (!isUuid(bookingId)) return corsJson({ ok: false, error: "booking_id must be a uuid" }, 400);

    const action = String(body.action || "").trim();

    const supa = async (method, path, payload) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method,
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    let patch = null;

    if (action === "set_job_status") {
      const s = String(body.job_status || "").trim();
      const allowed = ["scheduled", "in_progress", "completed", "cancelled"];
      if (!allowed.includes(s)) {
        return corsJson({ ok: false, error: "job_status must be scheduled, in_progress, completed, cancelled" }, 400);
      }
      patch = { job_status: s };

      // If admin forces completed, also set completed_at
      if (s === "completed") patch.completed_at = new Date().toISOString();
      // If moving away from completed, clear completed_at (optional behavior)
      if (s !== "completed") patch.completed_at = null;
    }

    else if (action === "set_progress_enabled") {
      const pe = body.progress_enabled;
      if (typeof pe !== "boolean") {
        return corsJson({ ok: false, error: "progress_enabled must be boolean" }, 400);
      }
      patch = { progress_enabled: pe };
    }

    else if (action === "regen_progress_token") {
      // generate new UUID token
      const token = crypto.randomUUID();
      patch = { progress_token: token, progress_enabled: true };
    }

    else {
      return corsJson({ ok: false, error: "Unknown action" }, 400);
    }

    const upd = await supa(
      "PATCH",
      `/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`,
      patch
    );

    if (!upd.ok) {
      return corsJson({ ok: false, error: "Supabase update failed", details: upd }, 502);
    }

    const row = Array.isArray(upd.data) ? upd.data[0] : upd.data;

    // Build customer links if we have a token in the returned row
    const origin = new URL(request.url).origin;
    const token = row?.progress_token ? String(row.progress_token) : null;

    const links = token ? {
      progress_url: `${origin}/progress?token=${encodeURIComponent(token)}`,
      complete_url: `${origin}/complete?token=${encodeURIComponent(token)}`,
    } : null;

    return corsJson({ ok: true, booking_id: bookingId, row, links });
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* helpers */

async function readJson(request) {
  const t = await request.text();
  if (!t) return {};
  try { return JSON.parse(t); } catch { return {}; }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ""));
}

function timingSafeEqual(a, b) {
  a = String(a);
  b = String(b);
  const len = Math.max(a.length, b.length);
  let out = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    const ca = a.charCodeAt(i) || 0;
    const cb = b.charCodeAt(i) || 0;
    out |= (ca ^ cb);
  }
  return out === 0;
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
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
