
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
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const headers = serviceHeaders(env);
    const keys = [
      "visibility_matrix",
      "manual_scheduling_rules",
      "blocking_policy",
      "feature_flags",
      "quote_booking_settings",
      "gift_delivery_settings",
      "membership_plan_settings",
      "recovery_templates",
      "recovery_rules",
      "recovery_provider_rules",
      "moderation_rules",
      "pricing_catalog",
      "document_templates",
      "social_feeds",
      "before_after_gallery"
    ];

    const out = {};
    for (const key of keys) {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value,updated_at&key=eq.${encodeURIComponent(key)}&limit=1`,
        { headers }
      );
      if (!res.ok) continue;
      const rows = await res.json().catch(() => []);
      out[key] = Array.isArray(rows) && rows[0] ? rows[0] : { key, value: {} };
    }

    return withCors(json({ ok: true, settings: out }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

export async function onRequestGet(context) {
  return onRequestPost(context);
}

export async function onRequestPut() {
  return withCors(methodNotAllowed());
}

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
