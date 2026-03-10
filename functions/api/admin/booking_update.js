// /functions/api/admin/booking_update.js
// CREATE THIS FILE (or REPLACE ENTIRE FILE)
//
// POST /api/admin/booking_update
//
// Actions used by /admin-booking.html:
// - set_job_status
// - set_progress_enabled
// - regen_progress_token
//
// Request JSON:
// {
//   "admin_password": "...",
//   "booking_id": "uuid",
//   "action": "set_job_status",
//   "job_status": "scheduled|in_progress|completed|cancelled",  // required for set_job_status
//   "progress_enabled": true|false                             // required for set_progress_enabled
// }
//
// Response:
// {
//   ok:true,
//   row: { ... },
//   links: { progress_url, complete_url }
// }
//
// Env vars required:
// - ADMIN_PASSWORD
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "";
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!ADMIN_PASSWORD) return corsJson({ ok: false, error: "Server missing ADMIN_PASSWORD" }, 500);
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return corsJson({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const body = await readJson(request);

    const pw = String(body.admin_password || "");
    if (!timingSafeEqual(pw, ADMIN_PASSWORD)) return corsJson({ ok: false, error: "Unauthorized" }, 401);

    const booking_id = String(body.booking_id || "").trim();
    if (!isUuid(booking_id)) return corsJson({ ok: false, error: "booking_id must be a uuid" }, 400);

    const action = String(body.action || "").trim();

    const supa = async (method, path, payload, prefer = "return=representation") => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method,
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: prefer,
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    // Load booking to ensure it exists + to return links
    const get = await supa(
      "GET",
      `/rest/v1/bookings?select=id,progress_token,progress_enabled,job_status,service_date,package_code,vehicle_size&` +
        `id=eq.${encodeURIComponent(booking_id)}&limit=1`,
      null,
      "return=representation"
    );
    if (!get.ok) return corsJson({ ok: false, error: "Supabase error (booking lookup)", details: get }, 502);

    const booking = Array.isArray(get.data) ? get.data[0] : null;
    if (!booking) return corsJson({ ok: false, error: "Booking not found" }, 404);

    const now = new Date().toISOString();
    let patchPayload = null;

    if (action === "set_job_status") {
      const job_status = String(body.job_status || "").trim();
      if (!["scheduled", "in_progress", "completed", "cancelled"].includes(job_status)) {
        return corsJson({ ok: false, error: "job_status must be scheduled|in_progress|completed|cancelled" }, 400);
      }
      patchPayload = { job_status, updated_at: now };
      if (job_status === "completed") patchPayload.completed_at = now;
    }

    if (action === "set_progress_enabled") {
      const pe = body.progress_enabled;
      if (typeof pe !== "boolean") return corsJson({ ok: false, error: "progress_enabled must be boolean" }, 400);

      patchPayload = { progress_enabled: pe, updated_at: now };

      // If enabling and there isn't a token yet, create one
      if (pe === true && !booking.progress_token) {
        patchPayload.progress_token = crypto.randomUUID();
      }
    }

    if (action === "regen_progress_token") {
      patchPayload = {
        progress_token: crypto.randomUUID(),
        progress_enabled: true,
        updated_at: now,
      };
    }

    if (!patchPayload) {
      return corsJson({ ok: false, error: "Unknown action" }, 400);
    }

    const upd = await supa(
      "PATCH",
      `/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`,
      patchPayload,
      "return=representation"
    );
    if (!upd.ok) return corsJson({ ok: false, error: "Supabase update failed (bookings)", details: upd }, 502);

    const row = Array.isArray(upd.data) ? upd.data[0] : upd.data;

    const origin = new URL(request.url).origin; // works for prod + preview
    const token = row.progress_token || null;

    const links = token
      ? {
          progress_url: `${origin}/progress?token=${encodeURIComponent(token)}`,
          complete_url: `${origin}/complete?token=${encodeURIComponent(token)}`,
        }
      : null;

    return corsJson({ ok: true, row, links });
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- helpers ---------------- */

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
