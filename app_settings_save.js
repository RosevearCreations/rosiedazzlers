
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, cleanText } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const key = cleanText(body.key);
    const value = body.value && typeof body.value === "object" ? body.value : {};

    if (!key) return withCors(json({ error: "Missing key." }, 400));

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings`, {
      method: "POST",
      headers: {
        ...serviceHeaders(env),
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify([{ key, value, updated_at: new Date().toISOString() }])
    });

    if (!res.ok) {
      return withCors(json({ error: `Could not save app setting. ${await res.text()}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    return withCors(json({ ok: true, setting: Array.isArray(rows) ? rows[0] || null : null }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
