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
      capability: "manage_blocks",
      allowLegacyAdminFallback: false,
    });
    if (!access.ok) return withCors(access.response);

    const blocked_date = String(body.blocked_date || "").trim();
    const reason = body.reason ? String(body.reason).trim() : null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(blocked_date)) {
      return withCors(json({ ok: false, error: "blocked_date must be YYYY-MM-DD" }, 400));
    }
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500));
    }

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks?on_conflict=blocked_date`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Accept: "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([{ blocked_date, reason, updated_at: new Date().toISOString() }]),
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return withCors(json({ ok: false, error: "Supabase error (date_blocks upsert)", details: data }, 500));

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
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store",
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
