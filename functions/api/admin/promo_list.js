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

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500));
    }

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/promo_codes?select=*&order=created_at.desc`,
      {
        method: "GET",
        headers: { ...serviceHeaders(env), Accept: "application/json" },
      }
    );

    const text = await res.text();
    const data = safeJson(text);

    if (!res.ok) {
      return withCors(json({ ok: false, error: "Supabase error (promo_codes list)", details: data }, 502));
    }

    return withCors(json({ ok: true, rows: Array.isArray(data) ? data : [], actor: access.actor.full_name || access.actor.email || "Staff" }));
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
