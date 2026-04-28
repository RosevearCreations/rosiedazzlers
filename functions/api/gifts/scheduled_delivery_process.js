import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadGiftDeliverySettings, processGiftDeliveryRow } from "../_lib/gift-delivery.js";

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

    const settings = await loadGiftDeliverySettings(env);
    const sessionId = String(body.session_id || "").trim();
    const code = String(body.code || "").trim();
    const limit = Math.max(1, Math.min(100, Math.floor(Number(body.limit || 50))));
    const origin = String(env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, "");

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?select=id,created_at,code,type,package_code,vehicle_size,remaining_cents,face_value_cents,expires_at,purchaser_email,recipient_name,recipient_email,stripe_session_id,purchase_context,status&recipient_email=not.is.null&status=eq.active&order=created_at.asc&limit=${limit}`, {
      headers: serviceHeaders(env)
    });
    const rows = res.ok ? await res.json().catch(() => []) : [];
    const gifts = Array.isArray(rows) ? rows : [];
    const filtered = gifts.filter((gift) => {
      if (sessionId && String(gift.stripe_session_id || "") !== sessionId) return false;
      if (code && String(gift.code || "") !== code) return false;
      return true;
    });

    const results = [];
    for (const gift of filtered) {
      const result = await processGiftDeliveryRow(env, gift, settings, { origin });
      results.push(result);
    }

    return withCors(json({
      ok: true,
      scanned: filtered.length,
      processed: results.filter((row) => row.ok).length,
      skipped: results.filter((row) => row.skipped).length,
      results
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Could not process scheduled gift delivery." }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed(["POST", "OPTIONS"]));
}

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
