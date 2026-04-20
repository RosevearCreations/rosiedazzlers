import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "./_lib/staff-auth.js";
import { loadMembershipPlanSettings, processMembershipReminderRow } from "./_lib/membership-reminders.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const hasToken = hasAutomationToken(request, env);
    if (!hasToken) {
      const access = await requireStaffAccess({
        request,
        env,
        body,
        capability: "manage_staff",
        allowLegacyAdminFallback: true
      });
      if (!access.ok) return withCors(access.response);
    }

    const settings = await loadMembershipPlanSettings(env);
    const limit = Math.max(1, Math.min(100, Math.floor(Number(body.limit || 50))));
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/membership_interest_requests?select=id,created_at,full_name,email,phone,postal_code,vehicle_count,preferred_cycle,notes,status,reminder_opt_in,reminder_status,reminder_count,last_reminder_at,next_reminder_at&order=created_at.asc&limit=${limit}`, {
      headers: serviceHeaders(env)
    });
    const rows = res.ok ? await res.json().catch(() => []) : [];
    const items = Array.isArray(rows) ? rows.filter((row) => !["closed","converted","opted_out"].includes(String(row.status || "").toLowerCase())) : [];

    const results = [];
    for (const row of items) {
      const result = await processMembershipReminderRow(env, row, settings, { origin: String(env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, "") });
      results.push(result);
    }

    return withCors(json({ ok: true, scanned: items.length, processed: results.filter((row) => row.ok).length, skipped: results.filter((row) => row.skipped).length, results }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Could not process maintenance reminders." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed(["POST", "OPTIONS"])); }

function hasAutomationToken(request, env) {
  const expected = String(env.INTERNAL_AUTOMATION_TOKEN || env.NOTIFICATIONS_PROVIDER_AUTH_TOKEN || "").trim();
  if (!expected) return false;
  const header = String(request.headers.get("x-automation-token") || "").trim();
  const auth = String(request.headers.get("authorization") || "").trim();
  return header === expected || auth === `Bearer ${expected}`;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id, x-automation-token, authorization",
    "Cache-Control": "no-store"
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
