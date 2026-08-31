// functions/api/admin/auth_login.js
// Staff login endpoint with schema/config diagnostics that do not throw raw 500s.

import {
  createStaffSession,
  appendSetCookie,
  serviceHeaders
} from "../_lib/staff-session.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const authEnv = normalizeEnv(env);

  try {
    if (!hasSupabaseConfig(authEnv)) {
      return withCors(json(loginError("Staff sign-in is not configured yet. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Cloudflare Pages.")));
    }

    const body = await request.json().catch(() => ({}));
    const email = cleanEmail(body.email);
    const password = String(body.password || "");

    if (!email) return withCors(json(loginError("Valid email is required.")));
    if (!password) return withCors(json(loginError("Password is required.")));

    const staffUser = await loadStaffUserByEmail(authEnv, email);
    if (!staffUser) return withCors(json(loginError("Invalid email or password.")));
    if (staffUser.is_active !== true) return withCors(json(loginError("This staff account is inactive.")));
    if (!staffUser.password_hash) return withCors(json(loginError("This staff account cannot sign in yet.")));

    const passwordOk = await verifyPassword(password, staffUser.password_hash);
    if (!passwordOk.ok) return withCors(json(loginError(passwordOk.publicMessage || "Invalid email or password.", passwordOk.diagnostic)));
    if (passwordOk.match !== true) return withCors(json(loginError("Invalid email or password.")));

    const created = await createStaffSession({ env: authEnv, staffUser, request });

    let headers = jsonHeaders();
    headers = appendSetCookie(headers, created.cookie);
    headers = applyCors(headers);

    return new Response(
      JSON.stringify({ ok: true, message: "Signed in.", actor: formatActor(staffUser) }),
      { status: 200, headers }
    );
  } catch (err) {
    return withCors(json(loginError(
      "Staff sign-in is temporarily unavailable. Check the Supabase auth tables, staff_users columns, and Cloudflare environment variables.",
      safeError(err)
    )));
  }
}

export async function onRequestGet() {
  return withCors(json({ ok: false, error: "Method not allowed." }, 405));
}

async function loadStaffUserByEmail(env, email) {
  const extendedSelect =
    "id,created_at,updated_at,full_name,email,role_code,is_active,password_hash," +
    "can_override_lower_entries,can_manage_bookings,can_manage_blocks,can_manage_progress,can_manage_promos,can_manage_staff,permissions_profile,notes";
  const minimalSelect = "id,created_at,updated_at,full_name,email,role_code,is_active,password_hash,notes";

  const first = await fetchStaffUser(env, email, extendedSelect);
  if (first.ok) return normalizeStaffRow(first.row);

  const second = await fetchStaffUser(env, email, minimalSelect);
  if (second.ok) return normalizeStaffRow(second.row);

  throw new Error(first.error || second.error || "Could not load staff account.");
}

async function fetchStaffUser(env, email, select) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users?select=${encodeURIComponent(select)}&email=eq.${encodeURIComponent(email)}&limit=1`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) return { ok: false, error: `Could not load staff account. ${await res.text()}` };
  const rows = await res.json().catch(() => []);
  return { ok: true, row: Array.isArray(rows) ? rows[0] || null : null };
}

function normalizeStaffRow(row) {
  if (!row) return null;
  const roleCode = String(row.role_code || "").trim();
  const isAdmin = roleCode === "admin";
  return {
    id: row.id || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    full_name: row.full_name || null,
    email: row.email || null,
    role_code: roleCode || null,
    is_active: row.is_active === true,
    password_hash: row.password_hash || null,
    can_override_lower_entries: isAdmin || row.can_override_lower_entries === true,
    can_manage_bookings: isAdmin || row.can_manage_bookings === true,
    can_manage_blocks: isAdmin || row.can_manage_blocks === true,
    can_manage_progress: isAdmin || row.can_manage_progress === true,
    can_manage_promos: isAdmin || row.can_manage_promos === true,
    can_manage_staff: isAdmin || row.can_manage_staff === true,
    permissions_profile: row.permissions_profile && typeof row.permissions_profile === "object" ? row.permissions_profile : {},
    module_access: row.permissions_profile?.module_access && typeof row.permissions_profile.module_access === "object" ? row.permissions_profile.module_access : {},
    notes: row.notes || null,
    is_admin: isAdmin,
    is_senior_detailer: roleCode === "senior_detailer",
    is_detailer: roleCode === "detailer"
  };
}

async function verifyPassword(password, storedHash) {
  const value = String(storedHash || "");
  if (!value) return { ok: true, match: false };

  if (value.startsWith("sha256:")) {
    const expected = value.slice("sha256:".length);
    const actual = await sha256Hex(password);
    return { ok: true, match: safeEqual(actual, expected) };
  }

  if (/^\$2[aby]\$\d{2}\$/.test(value)) {
    const bcrypt = await loadBcrypt();
    if (!bcrypt) {
      return {
        ok: false,
        match: false,
        publicMessage: "This account uses a bcrypt password hash, but bcryptjs is not bundled in this Pages build. Re-bootstrap this account with hash_mode=sha256 or add bcryptjs to the build.",
        diagnostic: "bcryptjs dynamic import failed"
      };
    }
    return { ok: true, match: !!(await bcrypt.compare(password, value)) };
  }

  if (value.startsWith("plain:")) return { ok: true, match: safeEqual(password, value.slice("plain:".length)) };
  return { ok: true, match: false };
}

async function loadBcrypt() {
  try {
    const mod = await import("bcryptjs");
    return mod && mod.default ? mod.default : mod;
  } catch {
    return null;
  }
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(String(input || ""));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  const x = String(a || "");
  const y = String(b || "");
  if (x.length !== y.length) return false;
  let out = 0;
  for (let i = 0; i < x.length; i++) out |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return out === 0;
}

function formatActor(staffUser) {
  return {
    id: staffUser.id || null,
    full_name: staffUser.full_name || null,
    email: staffUser.email || null,
    role_code: staffUser.role_code || null,
    is_active: staffUser.is_active === true,
    is_admin: staffUser.is_admin === true,
    is_senior_detailer: staffUser.is_senior_detailer === true,
    is_detailer: staffUser.is_detailer === true,
    permissions_profile: staffUser.permissions_profile || {},
    module_access: staffUser.module_access || staffUser.permissions_profile?.module_access || {},
    capabilities: {
      can_override_lower_entries: staffUser.can_override_lower_entries === true,
      can_manage_bookings: staffUser.can_manage_bookings === true,
      can_manage_blocks: staffUser.can_manage_blocks === true,
      can_manage_progress: staffUser.can_manage_progress === true,
      can_manage_promos: staffUser.can_manage_promos === true,
      can_manage_staff: staffUser.can_manage_staff === true
    }
  };
}

function loginError(error, diagnostic = null) {
  const out = { ok: false, error };
  if (diagnostic) out.diagnostic = diagnostic;
  return out;
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

function cleanEmail(value) {
  const s = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function safeError(err) {
  const raw = err?.message || String(err || "Unexpected server error.");
  return raw.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, "Bearer [redacted]").slice(0, 700);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders() });
}

function jsonHeaders() {
  return new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function applyCors(headers) {
  const out = headers instanceof Headers ? new Headers(headers) : new Headers(headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) if (!out.has(key)) out.set(key, value);
  return out;
}

function withCors(response) {
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: applyCors(response.headers || {}) });
}
