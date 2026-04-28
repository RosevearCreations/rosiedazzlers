import { requireStaffAccess, json, methodNotAllowed } from "./_lib/staff-auth.js";
import { loadMembershipPlanSettings, buildMembershipReminderCandidates, processMembershipReminderCandidate } from "./_lib/membership-reminders.js";

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
    const limit = Math.max(1, Math.min(250, Math.floor(Number(body.limit || 75))));
    const candidates = await buildMembershipReminderCandidates(env, settings, {
      origin: String(env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, ""),
      limit
    });
    const dueOnly = candidates.filter((row) => row.due);

    const results = [];
    for (const candidate of dueOnly) {
      const result = await processMembershipReminderCandidate(env, candidate, settings, {
        origin: String(env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, "")
      });
      results.push(result);
    }

    return withCors(json({
      ok: true,
      scanned: candidates.length,
      due: dueOnly.length,
      processed: results.filter((row) => row.ok).length,
      skipped: candidates.length - dueOnly.length,
      results
    }));
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
