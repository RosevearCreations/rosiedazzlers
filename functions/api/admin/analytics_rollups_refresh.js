// Build 262 — CPU-safe analytics rollup refresh.
// Heavy aggregation runs in Supabase/Postgres; the Pages Function performs one RPC call.
import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response('', { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: 'manage_staff', allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const days = Math.max(7, Math.min(365, Number(body.days || 90)));
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/refresh_site_activity_rollups_cpu_safe`, {
      method: 'POST',
      headers: serviceHeaders(env, { Prefer: 'return=representation' }),
      body: JSON.stringify({ p_days: days })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const migrationMissing = res.status === 404 || /refresh_site_activity_rollups_cpu_safe|PGRST202|function/i.test(detail);
      return withCors(json({
        ok: false,
        error: migrationMissing
          ? 'Build 262 analytics migration is required before rollups can be refreshed safely.'
          : `Could not refresh analytics rollups (${res.status}).`,
        migration_required: migrationMissing,
        migration: '2026-08-20_build262_cpu_safe_analytics_rollups.sql'
      }, migrationMissing ? 409 : 502));
    }

    const payload = await res.json().catch(() => null);
    const result = Array.isArray(payload) ? payload[0] || {} : payload || {};
    return withCors(json({ ...result, ok: true, cpu_safe: true }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || 'Unexpected server error.' }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
