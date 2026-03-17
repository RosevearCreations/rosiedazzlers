// /functions/api/admin/promo_create.js
// REPLACE ENTIRE FILE
//
// Creates or updates a promo code (upsert by code).
//
// POST JSON:
// {
//   "admin_password": "....",
//   "code": "SPRING10",
//   "is_active": true,
//   "percent_off": 10.0,            // OR
//   "amount_off_cents": 2500,       // ($25)
//   "starts_on": "YYYY-MM-DD" | null,
//   "ends_on": "YYYY-MM-DD" | null,
//   "note": "optional"
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

    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return json({ ok: false, error: "Missing code" }, 400);
    if (!/^[A-Z0-9][A-Z0-9_-]{2,30}$/.test(code)) {
      return json({ ok: false, error: "Invalid code format (use A-Z, 0-9, _ or -)" }, 400);
    }

    const is_active = body.is_active === false ? false : true;

    const percent_off =
      body.percent_off === null || body.percent_off === undefined || body.percent_off === ""
        ? null
        : Number(body.percent_off);

    const amount_off_cents =
      body.amount_off_cents === null || body.amount_off_cents === undefined || body.amount_off_cents === ""
        ? null
        : Number(body.amount_off_cents);

    if (percent_off !== null && (!Number.isFinite(percent_off) || percent_off <= 0 || percent_off > 100)) {
      return json({ ok: false, error: "percent_off must be >0 and <=100" }, 400);
    }
    if (amount_off_cents !== null && (!Number.isFinite(amount_off_cents) || amount_off_cents <= 0)) {
      return json({ ok: false, error: "amount_off_cents must be >0" }, 400);
    }
    if ((percent_off === null) === (amount_off_cents === null)) {
      return json({ ok: false, error: "Provide either percent_off OR amount_off_cents (not both)" }, 400);
    }

    const starts_on = body.starts_on ? String(body.starts_on).trim() : null;
    const ends_on = body.ends_on ? String(body.ends_on).trim() : null;

    if (starts_on && !/^\d{4}-\d{2}-\d{2}$/.test(starts_on)) return json({ ok: false, error: "starts_on must be YYYY-MM-DD" }, 400);
    if (ends_on && !/^\d{4}-\d{2}-\d{2}$/.test(ends_on)) return json({ ok: false, error: "ends_on must be YYYY-MM-DD" }, 400);

    const note = body.note ? String(body.note).trim() : null;

    // --- Supabase config ---
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    // Upsert via unique index on lower(code)
    // We use on_conflict=code here (PostgREST supports on_conflict with column names).
    // If your unique index is lower(code), Postgres still enforces uniqueness; conflict column remains 'code'.
    const url = `${SUPABASE_URL}/rest/v1/promo_codes?on_conflict=code`;

    const payload = [{
      code,
      is_active,
      percent_off: percent_off === null ? null : Math.round(percent_off * 100) / 100,
      amount_off_cents: amount_off_cents === null ? null : Math.round(amount_off_cents),
      starts_on,
      ends_on,
      note
    }];

    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = safeJson(text);

    if (!res.ok) {
      return json({ ok: false, error: "Supabase error (promo_codes upsert)", details: data }, 502);
    }

    const row = Array.isArray(data) ? data[0] : data;
    return json({ ok: true, row });

  } catch (e) {
    return json({ ok: false, error: "Server error", details: String(e) }, 500);
  }
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
