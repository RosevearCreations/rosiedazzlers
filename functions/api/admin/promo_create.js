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
    const discount_type = String(body.discount_type || "").trim().toLowerCase();
    const discount_value = body.discount_value === null || body.discount_value === undefined || body.discount_value === "" ? null : Number(body.discount_value);

    if (!["percent", "fixed"].includes(discount_type)) {
      return withCors(json({ ok: false, error: "discount_type must be 'percent' or 'fixed'" }, 400));
    }
    if (discount_value === null || !Number.isFinite(discount_value) || discount_value <= 0) {
      return withCors(json({ ok: false, error: "discount_value must be > 0" }, 400));
    }
    if (discount_type === "percent" && discount_value > 100) {
      return withCors(json({ ok: false, error: "Percent discount_value must be <= 100" }, 400));
    }

    const starts_at = body.starts_at ? String(body.starts_at).trim() : null;
    const ends_at = body.ends_at ? String(body.ends_at).trim() : null;
    if (starts_at && Number.isNaN(Date.parse(starts_at))) return withCors(json({ ok: false, error: "starts_at must be a valid datetime" }, 400));
    if (ends_at && Number.isNaN(Date.parse(ends_at))) return withCors(json({ ok: false, error: "ends_at must be a valid datetime" }, 400));

    const description = body.description ? String(body.description).trim() : null;

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500));
    }

    const url = `${env.SUPABASE_URL}/rest/v1/promo_codes?on_conflict=code`;
    const payload = [{
      code,
      is_active,
      discount_type,
      discount_value: Math.round(discount_value * 100) / 100,
      starts_at,
      ends_at,
      description,
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
