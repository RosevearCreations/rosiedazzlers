// functions/api/admin/assign.js
// POST /api/admin/assign
// Admin-only: assign staff + internal notes to a booking.
//
// Env vars required:
// - ADMIN_PASSWORD
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Request JSON:
// {
//   "admin_password":"...",
//   "booking_id":"uuid",
//   "assigned_staff_name":"Jack",
//   "assigned_staff_email":"staff@example.com",
//   "internal_notes":"Bring extra towels"
// }
//
// Response:
// { ok:true, booking_id, updated:true }

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

    const patch = {};
    if (body.assigned_staff_name != null) patch.assigned_staff_name = String(body.assigned_staff_name || "").trim() || null;
    if (body.assigned_staff_email != null) patch.assigned_staff_email = String(body.assigned_staff_email || "").trim() || null;
    if (body.internal_notes != null) patch.internal_notes = String(body.internal_notes || "").trim() || null;

    if (Object.keys(patch).length === 0) {
      return corsJson({ ok: false, error: "Nothing to update" }, 400);
    }

    const url = `${SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      return corsJson({ ok: false, error: "Supabase update failed", details: { status: res.status, data } }, 502);
    }

    return corsJson({ ok: true, booking_id: bookingId, updated: true, row: Array.isArray(data) ? data[0] : data });
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
