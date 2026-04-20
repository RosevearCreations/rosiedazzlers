import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: 'manage_staff',
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const limit = Math.max(1, Math.min(25, Math.floor(Number(body.limit || 10))));
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/membership_interest_requests?select=id,created_at,full_name,email,phone,postal_code,vehicle_count,preferred_cycle,notes,status,reminder_opt_in,reminder_status,reminder_count,last_reminder_at,next_reminder_at&order=created_at.desc&limit=${limit}`, {
      headers: serviceHeaders(env)
    });
    const rows = res.ok ? await res.json().catch(() => []) : [];

    return withCors(json({ ok: true, requests: Array.isArray(rows) ? rows : [] }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Could not load maintenance interest requests.' }, 500));
  }
}

export async function onRequestGet(context) { return onRequestPost(context); }
export async function onRequestOptions() { return new Response('', { status: 204, headers: corsHeaders() }); }
export async function onRequestPut() { return withCors(methodNotAllowed(['GET','POST','OPTIONS'])); }

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password, x-staff-email, x-staff-user-id',
    'Cache-Control': 'no-store'
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
