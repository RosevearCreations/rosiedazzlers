
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

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
      capability: "manage_progress",
      allowLegacyAdminFallback: false
    });
    if (!access.ok) return withCors(access.response);

    const limit = Number.isFinite(Number(body.limit)) ? Math.min(Math.max(Number(body.limit), 1), 200) : 100;
    const status = String(body.status || "").trim();
    let url = `${env.SUPABASE_URL}/rest/v1/notification_events?select=id,created_at,event_type,channel,booking_id,customer_profile_id,recipient_email,recipient_phone,payload,status,attempt_count,last_error,processed_at,next_attempt_at,max_attempts&order=created_at.desc&limit=${limit}`;
    if (status) url += `&status=eq.${encodeURIComponent(status)}`;

    const res = await fetch(url, { headers: serviceHeaders(env) });
    if (!res.ok) return withCors(json({ error: `Could not load notifications. ${await res.text()}` }, 500));
    const rows = await res.json().catch(() => []);
    return withCors(json({ ok: true, notifications: rows }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}
export async function onRequestGet(context) { return onRequestPost(context); }
export async function onRequestPut() { return withCors(methodNotAllowed()); }

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
