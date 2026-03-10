// functions/api/admin/bookings.js
// POST /api/admin/bookings
// Admin-only: returns bookings list for the Admin dashboard.
//
// Request JSON:
// {
//   "admin_password": "...",
//   "mode": "next30" | "latest100"
// }
//
// Env vars required:
// - ADMIN_PASSWORD
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Returns:
// { ok:true, rows:[ ... ] }

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "";
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!ADMIN_PASSWORD) return corsJson({ ok: false, error: "Server missing ADMIN_PASSWORD" }, 500);
    if (!SUPABASE_URL || !SERVICE_KEY) return corsJson({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);

    const body = await readJson(request);
    const pw = String(body.admin_password || "");
    if (!timingSafeEqual(pw, ADMIN_PASSWORD)) return corsJson({ ok: false, error: "Unauthorized" }, 401);

    const mode = String(body.mode || "next30");

    // Build Supabase REST query
    // Use select=* so schema changes don’t break the endpoint.
    let path = "/rest/v1/bookings?select=*";

    if (mode === "next30") {
      const start = isoDate(new Date());
      const end = isoDate(addDays(new Date(), 30));
      path += `&service_date=gte.${encodeURIComponent(start)}&service_date=lte.${encodeURIComponent(end)}`;
      path += "&order=service_date.asc,start_slot.asc";
      path += "&limit=200";
    } else if (mode === "latest100") {
      // Fallback ordering: created_at desc if present, else service_date desc
      // Supabase will ignore unknown order columns? (it may error) -> safest: order=service_date.desc
      // We’ll try created_at first; if error, retry with service_date.
      const attempt = await supaGet(SUPABASE_URL, SERVICE_KEY, path + "&order=created_at.desc&limit=100");
      if (attempt.ok) {
        return corsJson({ ok: true, rows: sanitizeRows(attempt.data) });
      }
      const attempt2 = await supaGet(SUPABASE_URL, SERVICE_KEY, path + "&order=service_date.desc&limit=100");
      if (!attempt2.ok) {
        return corsJson({ ok: false, error: "Supabase error (bookings)", details: attempt2 }, 502);
      }
      return corsJson({ ok: true, rows: sanitizeRows(attempt2.data) });
    } else {
      return corsJson({ ok: false, error: "mode must be next30 or latest100" }, 400);
    }

    const res = await supaGet(SUPABASE_URL, SERVICE_KEY, path);
    if (!res.ok) return corsJson({ ok: false, error: "Supabase error (bookings)", details: res }, 502);

    return corsJson({ ok: true, rows: sanitizeRows(res.data) });
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

async function supaGet(SUPABASE_URL, SERVICE_KEY, path) {
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
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function sanitizeRows(rows) {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((b) => {
    // Only return what the admin UI needs; omit Stripe ids and waiver UA/IP noise.
    // Keep vehicle (JSON) if present.
    return {
      id: b.id,
      status: b.status,
      job_status: b.job_status,
      service_date: b.service_date,
      start_slot: b.start_slot,
      duration_slots: b.duration_slots,
      service_area: b.service_area,

      package_code: b.package_code,
      vehicle_size: b.vehicle_size,

      customer_name: b.customer_name,
      customer_email: b.customer_email,
      customer_phone: b.customer_phone,

      address_line1: b.address_line1,
      city: b.city,
      postal_code: b.postal_code,

      vehicle: b.vehicle ?? null,

      // totals (some may not exist yet; admin UI tolerates null)
      subtotal_cents: b.subtotal_cents ?? null,
      promo_code: b.promo_code ?? null,
      gift_code: b.gift_code ?? null,
      promo_discount_cents: b.promo_discount_cents ?? null,
      gift_applied_cents: b.gift_applied_cents ?? null,

      price_total_cents: b.price_total_cents ?? null,
      deposit_cents: b.deposit_cents ?? null,

      assigned_staff_name: b.assigned_staff_name ?? null,
      assigned_staff_email: b.assigned_staff_email ?? null,
      internal_notes: b.internal_notes ?? null,

      progress_enabled: b.progress_enabled ?? null,
      progress_token: b.progress_token ?? null,

      created_at: b.created_at ?? null,
      updated_at: b.updated_at ?? null,
    };
  });
}

function isoDate(d) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + Number(days || 0));
  return x;
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
