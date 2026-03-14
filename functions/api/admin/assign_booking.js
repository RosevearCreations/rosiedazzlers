// /functions/api/admin/assign_booking.js
// REPLACE ENTIRE FILE
//
// Assigns a staff name to a booking (simple field: assigned_to)
//
// POST JSON:
// {
//   "admin_password": "....",
//   "booking_id": "uuid",
//   "assigned_to": "Name or empty string"
// }

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

    const assigned_to = body.assigned_to === null || body.assigned_to === undefined
      ? null
      : String(body.assigned_to).trim();

    // --- Supabase config ---
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    // PATCH booking row
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ assigned_to: assigned_to || null }),
    });

    const text = await res.text();
    const data = safeJson(text);

    if (!res.ok) {
      return json({ ok: false, error: "Supabase error (bookings assign)", details: data }, 502);
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
