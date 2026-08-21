// functions/api/client/auth_login.js
// Client login endpoint with schema/config diagnostics that do not throw raw 500s.

import { createCustomerSession, appendSetCookie, serviceHeaders } from "../_lib/customer-session.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const authEnv = normalizeEnv(env);

  try {
    if (!hasSupabaseConfig(authEnv)) {
      return withCors(json(loginError("Client sign-in is not configured yet. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Cloudflare Pages.")));
    }

    const body = await request.json().catch(() => ({}));
    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    if (!email) return withCors(json(loginError("Valid email is required.")));
    if (!password) return withCors(json(loginError("Password is required.")));

    const customer = await loadCustomerByEmail(authEnv, email);
    if (!customer || customer.is_active !== true) return withCors(json(loginError("Invalid email or password.")));
    if (!customer.password_hash) return withCors(json(loginError("This client account cannot sign in yet.")));

    const passwordOk = await verifyPassword(password, customer.password_hash);
    if (!passwordOk.ok) return withCors(json(loginError(passwordOk.publicMessage || "Invalid email or password.", passwordOk.diagnostic)));
    if (passwordOk.match !== true) return withCors(json(loginError("Invalid email or password.")));

    const session = await createCustomerSession({ env: authEnv, customerProfile: customer, request });
    let headers = jsonHeaders();
    headers = appendSetCookie(headers, session.cookie);
    headers = applyCors(headers);
    return new Response(JSON.stringify({ ok: true, message: "Signed in.", customer: formatCustomer(customer) }), { status: 200, headers });
  } catch (err) {
    return withCors(json(loginError(
      "Client sign-in is temporarily unavailable. Check the Supabase customer auth tables and Cloudflare environment variables.",
      safeError(err)
    )));
  }
}

export async function onRequestGet() {
  return withCors(json({ ok: false, error: "Method not allowed." }, 405));
}

async function loadCustomerByEmail(env, email) {
  const extendedSelect = "id,email,full_name,phone,tier_code,notes,address_line1,address_line2,city,province,postal_code,vehicle_notes,is_active,password_hash";
  const minimalSelect = "id,email,full_name,phone,tier_code,is_active,password_hash";
  const first = await fetchCustomer(env, email, extendedSelect);
  if (first.ok) return normalizeCustomerRow(first.row);
  const second = await fetchCustomer(env, email, minimalSelect);
  if (second.ok) return normalizeCustomerRow(second.row);
  throw new Error(first.error || second.error || "Could not load client account.");
}

async function fetchCustomer(env, email, select) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=${encodeURIComponent(select)}&email=eq.${encodeURIComponent(email)}&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return { ok: false, error: `Could not load client account. ${await res.text()}` };
  const rows = await res.json().catch(() => []);
  return { ok: true, row: Array.isArray(rows) ? rows[0] || null : null };
}

function normalizeCustomerRow(row) {
  if (!row) return null;
  return {
    id: row.id || null,
    email: row.email || null,
    full_name: row.full_name || null,
    phone: row.phone || null,
    tier_code: row.tier_code || null,
    notes: row.notes || null,
    address_line1: row.address_line1 || null,
    address_line2: row.address_line2 || null,
    city: row.city || null,
    province: row.province || null,
    postal_code: row.postal_code || null,
    vehicle_notes: row.vehicle_notes || null,
    is_active: row.is_active === true,
    password_hash: row.password_hash || null
  };
}

async function verifyPassword(password, storedHash) {
  const value = String(storedHash || "");
  if (!value) return { ok: true, match: false };
  if (value.startsWith("sha256:")) return { ok: true, match: safeEqual(await sha256Hex(password), value.slice(7)) };
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
  if (value.startsWith("plain:")) return { ok: true, match: safeEqual(password, value.slice(6)) };
  return { ok: true, match: false };
}

async function loadBcrypt() {
  try {
    const mod = await import("bcryptjs");
    return mod.default || mod;
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
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" };
}

function applyCors(headers) {
  const out = headers instanceof Headers ? new Headers(headers) : new Headers(headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) if (!out.has(key)) out.set(key, value);
  return out;
}

function withCors(response) {
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: applyCors(response.headers || {}) });
}
