// functions/api/admin/auth_me.js
// Session-based current staff endpoint with fail-open identity checks.

import {
  getCurrentStaffSession,
  touchStaffSession,
  rotateStaffSession,
  appendSetCookie,
  buildClearSessionCookie
} from "../_lib/staff-session.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const authEnv = normalizeEnv(env);

  if (!hasSupabaseConfig(authEnv)) {
    return unauthenticatedResponse({
      reason: "configuration_incomplete",
      message: "Staff session storage is not configured yet. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Cloudflare Pages settings."
    });
  }

  try {
    const current = await getCurrentStaffSession({ env: authEnv, request });

    if (!current || !current.staff_user) {
      return unauthenticatedResponse({
        clearCookie: current?.clear_cookie || buildClearSessionCookie()
      });
    }

    await touchStaffSession({
      env: authEnv,
      sessionId: current.session?.id || null,
      request
    });

    let sessionCookie = null;
    if (current.needs_rotation === true) {
      const rotated = await rotateStaffSession({
        env: authEnv,
        request,
        currentSession: current.session,
        staffUser: current.staff_user
      });
      sessionCookie = rotated.cookie || null;
    }

    let headers = jsonHeaders();
    if (sessionCookie) headers = appendSetCookie(headers, sessionCookie);
    headers = applyCors(headers);

    return new Response(
      JSON.stringify({ ok: true, authenticated: true, actor: formatActor(current.staff_user) }),
      { status: 200, headers }
    );
  } catch (err) {
    return unauthenticatedResponse({
      degraded: true,
      reason: "session_storage_unavailable",
      message: "Staff session could not be verified, so the UI is treating the visitor as signed out instead of throwing a server error.",
      diagnostic: safeError(err),
      clearCookie: buildClearSessionCookie()
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
  const body = { ok: true, authenticated: false, actor: null };
  if (degraded || reason || message || diagnostic) {
    body.degraded = degraded === true;
    body.reason = reason;
    body.message = message;
    body.diagnostic = diagnostic;
  }
  return new Response(JSON.stringify(body), { status: 200, headers });
}

function formatActor(staffUser) {
  const roleCode = String(staffUser.role_code || "").trim();
  const isAdmin = staffUser.is_admin === true || roleCode === "admin";
  const isSenior = staffUser.is_senior_detailer === true || roleCode === "senior_detailer";
  const isDetailer = staffUser.is_detailer === true || roleCode === "detailer";
  return {
    id: staffUser.id || null,
    full_name: staffUser.full_name || null,
    email: staffUser.email || null,
    role_code: roleCode || null,
    is_active: staffUser.is_active === true,
    is_admin: isAdmin,
    is_senior_detailer: isSenior,
    is_detailer: isDetailer,
    capabilities: {
      can_override_lower_entries: isAdmin || staffUser.can_override_lower_entries === true,
      can_manage_bookings: isAdmin || staffUser.can_manage_bookings === true,
      can_manage_blocks: isAdmin || staffUser.can_manage_blocks === true,
      can_manage_progress: isAdmin || staffUser.can_manage_progress === true,
      can_manage_promos: isAdmin || staffUser.can_manage_promos === true,
      can_manage_staff: isAdmin || staffUser.can_manage_staff === true
    }
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
