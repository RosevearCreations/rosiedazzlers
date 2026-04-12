import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_promos",
      allowLegacyAdminFallback: false,
    });
    if (!access.ok) return withCors(access.response);

    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return withCors(json({ ok: false, error: "Missing code" }, 400));
    if (!/^[A-Z0-9][A-Z0-9_-]{2,30}$/.test(code)) {
      return withCors(json({ ok: false, error: "Invalid code format (use A-Z, 0-9, _ or -)" }, 400));
    }

    const is_active = body.is_active === false ? false : true;
    const percent_off = body.percent_off === null || body.percent_off === undefined || body.percent_off === "" ? null : Number(body.percent_off);
    const amount_off_cents = body.amount_off_cents === null || body.amount_off_cents === undefined || body.amount_off_cents === "" ? null : Number(body.amount_off_cents);

    if (percent_off !== null && (!Number.isFinite(percent_off) || percent_off <= 0 || percent_off > 100)) {
      return withCors(json({ ok: false, error: "percent_off must be >0 and <=100" }, 400));
    }
    if (amount_off_cents !== null && (!Number.isFinite(amount_off_cents) || amount_off_cents <= 0)) {
      return withCors(json({ ok: false, error: "amount_off_cents must be >0" }, 400));
    }
    if ((percent_off === null) === (amount_off_cents === null)) {
      return withCors(json({ ok: false, error: "Provide either percent_off OR amount_off_cents (not both)" }, 400));
    }

    const starts_on = body.starts_on ? String(body.starts_on).trim() : null;
    const ends_on = body.ends_on ? String(body.ends_on).trim() : null;
    if (starts_on && !/^\d{4}-\d{2}-\d{2}$/.test(starts_on)) return withCors(json({ ok: false, error: "starts_on must be YYYY-MM-DD" }, 400));
    if (ends_on && !/^\d{4}-\d{2}-\d{2}$/.test(ends_on)) return withCors(json({ ok: false, error: "ends_on must be YYYY-MM-DD" }, 400));

    const note = body.note ? String(body.note).trim() : null;

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500));
    }

    const url = `${env.SUPABASE_URL}/rest/v1/promo_codes?on_conflict=code`;
    const payload = [{
      code,
      is_active,
      percent_off: percent_off === null ? null : Math.round(percent_off * 100) / 100,
      amount_off_cents: amount_off_cents === null ? null : Math.round(amount_off_cents),
      starts_on,
      ends_on,
      note,
      updated_at: new Date().toISOString(),
    }];

    const res = await fetch(url, {
      method: "POST",
      headers: { ...serviceHeaders(env), Accept: "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) {
      return withCors(json({ ok: false, error: "Supabase error (promo_codes upsert)", details: data }, 502));
    }

    const row = Array.isArray(data) ? data[0] : data;
    return withCors(json({ ok: true, row, actor: access.actor.full_name || access.actor.email || "Staff" }));
  } catch (e) {
    return withCors(json({ ok: false, error: "Server error", details: String(e) }, 500));
  }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store",
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
