import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadMembershipPlanSettings, buildMembershipReminderCandidates } from "../_lib/membership-reminders.js";

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

    const limit = Math.max(1, Math.min(50, Math.floor(Number(body.limit || 10))));
    const settings = await loadMembershipPlanSettings(env);
    const candidates = await buildMembershipReminderCandidates(env, settings, {
      origin: String(env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, ''),
      limit: Math.max(limit * 6, 60)
    });

    return withCors(json({ ok: true, requests: candidates.slice(0, limit) }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Could not load recurring reminder candidates.' }, 500));
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
