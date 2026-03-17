// /functions/api/admin/assign.js
// CREATE THIS FILE (or REPLACE ENTIRE FILE)
//
// POST /api/admin/assign
// Admin-only: assigns staff + internal notes to a booking.
//
// Request JSON:
// {
//   "admin_password": "...",
//   "booking_id": "uuid",
//   "assigned_staff_name": "Jack",
//   "assigned_staff_email": "jack@example.com",   // optional
//   "internal_notes": "optional notes"
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

    const assigned_staff_name = body.assigned_staff_name != null ? String(body.assigned_staff_name).trim() : "";
    const assigned_staff_email = body.assigned_staff_email != null ? String(body.assigned_staff_email).trim() : "";
    const internal_notes = body.internal_notes != null ? String(body.internal_notes).trim() : "";

    const supaPatch = async (path, payload) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method: "PATCH",
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
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    const patch = await supaPatch(
      `/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`,
      {
        assigned_staff_name: assigned_staff_name || null,
        assigned_staff_email: assigned_staff_email || null,
        internal_notes: internal_notes || null,
        updated_at: new Date().toISOString(),
      }
    );

    if (!patch.ok) {
      return corsJson({ ok: false, error: "Supabase update failed (bookings)", details: patch }, 502);
    }

    const row = Array.isArray(patch.data) ? patch.data[0] : patch.data;
    return corsJson({ ok: true, row });
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
