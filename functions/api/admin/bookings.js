// functions/api/admin/bookings.js
// POST /api/admin/bookings
// Admin-only: lists bookings from Supabase (service role).
//
// Requires Cloudflare Pages env vars:
// - ADMIN_PASSWORD
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Request JSON:
// { "admin_password": "...", "mode": "next30" | "latest100" | "range", "from_date": "YYYY-MM-DD", "to_date": "YYYY-MM-DD" }
//
// Response JSON:
// { ok: true, rows: [...] }

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

    const raw = await request.text();
    if (!raw) return corsJson({ ok: false, error: "Missing JSON body" }, 400);

    let body;
    try { body = JSON.parse(raw); }
    catch { return corsJson({ ok: false, error: "Invalid JSON" }, 400); }

    const pw = String(body.admin_password || "");
    if (!timingSafeEqual(pw, ADMIN_PASSWORD)) {
      return corsJson({ ok: false, error: "Unauthorized" }, 401);
    }

    const mode = String(body.mode || "next30");

    const today = new Date();
    const yyyyMmDd = (d) => d.toISOString().slice(0, 10);

    const addDays = (d, n) => {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      return x;
    };

    let filter = "";
    let order = "";

    if (mode === "latest100") {
      // Most recent first
      filter = "";
      order = "created_at.desc";
    } else if (mode === "range") {
      const from = String(body.from_date || "");
      const to = String(body.to_date || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return corsJson({ ok: false, error: "range requires from_date and to_date as YYYY-MM-DD" }, 400);
      }
      filter =
        `&service_date=gte.${encodeURIComponent(from)}` +
        `&service_date=lte.${encodeURIComponent(to)}`;
      order = "service_date.asc,created_at.asc";
    } else {
      // next30 (default)
      const from = yyyyMmDd(today);
      const to = yyyyMmDd(addDays(today, 30));
      filter =
        `&service_date=gte.${encodeURIComponent(from)}` +
        `&service_date=lte.${encodeURIComponent(to)}`;
      order = "service_date.asc,created_at.asc";
    }

    const select =
      [
        "id",
        "status",
        "service_date",
        "start_slot",
        "duration_slots",
        "service_area",
        "package_code",
        "vehicle_size",
        "customer_name",
        "customer_email",
        "customer_phone",
        "address_line1",
        "city",
        "postal_code",
        "vehicle",
        "addons",
        "subtotal_cents",
        "promo_code",
        "gift_code",
        "promo_discount_cents",
        "gift_applied_cents",
        "price_total_cents",
        "deposit_cents",
        "stripe_session_id",
        "created_at",
      ].join(",");

    const limit = mode === "latest100" ? 100 : 300;

    const url =
      `${SUPABASE_URL}/rest/v1/bookings` +
      `?select=${encodeURIComponent(select)}` +
      filter +
      `&order=${encodeURIComponent(order)}` +
      `&limit=${limit}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      return corsJson({ ok: false, error: "Supabase error", details: { status: res.status, data } }, 502);
    }

    return corsJson({ ok: true, rows: Array.isArray(data) ? data : [] }, 200);
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- helpers ---------------- */

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function timingSafeEqual(a, b) {
  // Simple timing-safe compare for small strings (good enough for this use).
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
