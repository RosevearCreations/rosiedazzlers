// functions/api/client/auth_me.js
// Session-based current customer endpoint with fail-open identity checks.

import {
  getCurrentCustomerSession,
  touchCustomerSession,
  rotateCustomerSession,
  appendSetCookie,
  buildClearCustomerSessionCookie
} from "../_lib/customer-session.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const authEnv = normalizeEnv(env);

  if (!hasSupabaseConfig(authEnv)) {
    return unauthenticatedResponse({
      reason: "configuration_incomplete",
      message: "Client session storage is not configured yet. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Cloudflare Pages settings."
    });
  }

  try {
    const current = await getCurrentCustomerSession({ env: authEnv, request });

    if (!current || !current.customer_profile) {
      return unauthenticatedResponse({
        clearCookie: current?.clear_cookie || buildClearCustomerSessionCookie()
      });
    }

    await touchCustomerSession({
      env: authEnv,
      sessionId: current.session?.id || null,
      request
    });

    let rotatedCookie = null;
    if (current.needs_rotation === true) {
      const rotated = await rotateCustomerSession({
        env: authEnv,
        request,
        currentSession: current.session,
        customerProfile: current.customer_profile
      });
      rotatedCookie = rotated.cookie || null;
    }

    let headers = jsonHeaders();
    if (rotatedCookie) headers = appendSetCookie(headers, rotatedCookie);
    headers = applyCors(headers);

    return new Response(
      JSON.stringify({ ok: true, authenticated: true, customer: formatCustomer(current.customer_profile) }),
      { status: 200, headers }
    );
  } catch (err) {
    return unauthenticatedResponse({
      degraded: true,
      reason: "session_storage_unavailable",
      message: "Client session could not be verified, so the UI is treating the visitor as signed out instead of throwing a server error.",
      diagnostic: safeError(err),
      clearCookie: buildClearCustomerSessionCookie()
    });
  }
}

export async function onRequestPost(context) {
  return onRequestGet(context);
}

function unauthenticatedResponse({ clearCookie = null, degraded = false, reason = null, message = null, diagnostic = null } = {}) {
  let headers = jsonHeaders();
  if (clearCookie) headers = appendSetCookie(headers, clearCookie);
  headers = applyCors(headers);
  const body = { ok: true, authenticated: false, customer: null };
  if (degraded || reason || message || diagnostic) {
    body.degraded = degraded === true;
    body.reason = reason;
    body.message = message;
    body.diagnostic = diagnostic;
  }
  return new Response(JSON.stringify(body), { status: 200, headers });
}

function formatCustomer(row) {
  return {
    id: row.id || null,
    email: row.email || null,
    full_name: row.full_name || null,
    phone: row.phone || null,
    tier_code: row.tier_code || null,
    address_line1: row.address_line1 || null,
    address_line2: row.address_line2 || null,
    city: row.city || null,
    province: row.province || null,
    postal_code: row.postal_code || null,
    vehicle_notes: row.vehicle_notes || null
  };
}

function normalizeEnv(env) {
  return new Proxy(env || {}, {
    get(target, prop) {
      if (prop === "SUPABASE_SERVICE_ROLE_KEY") return getSupabaseServiceRoleKey(target);
      return target[prop];
    }
  });
}

function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && getSupabaseServiceRoleKey(env));
}

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
}

function safeError(err) {
  const raw = err?.message || String(err || "Unexpected server error.");
  return raw.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, "Bearer [redacted]").slice(0, 500);
}

function jsonHeaders() {
  return new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function applyCors(headers) {
  const out = headers instanceof Headers ? new Headers(headers) : new Headers(headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) if (!out.has(key)) out.set(key, value);
  return out;
}
