// functions/api/admin/auth_login.js
//
// Staff login endpoint.
//
// What this file does:
// - accepts staff email + password
// - validates credentials against staff_users
// - requires active staff account
// - creates a secure session cookie using staff-session helpers
// - returns current actor summary for admin/detailer UI bootstrapping
//
// Expected env vars:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - STAFF_SESSION_SECRET
//
// Expected staff_users columns for this phase:
// - id
// - full_name
// - email
// - role_code
// - is_active
// - password_hash
// - can_override_lower_entries
// - can_manage_bookings
// - can_manage_blocks
// - can_manage_progress
// - can_manage_promos
// - can_manage_staff
//
// Supported request body:
// {
//   email: "staff@example.com",
//   password: "plain text password for now"
// }
//
// Notes:
// - password verification supports bcrypt style hashes when available
// - if bcrypt verification is unavailable, this file falls back to a plain
//   sha-256 check only if the stored hash is prefixed with "sha256:"
// - if your repo already uses a different hash format, adjust verifyPassword()

import {
  createStaffSession,
  appendSetCookie,
  serviceHeaders
} from "../_lib/staff-session.js";

export async function onRequestOptions() {
  return new Response("", {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.STAFF_SESSION_SECRET) {
      return withCors(json({ error: "Server configuration is incomplete." }, 500));
    }

    const body = await request.json().catch(() => ({}));
    const email = cleanEmail(body.email);
    const password = String(body.password || "");

    if (!email) {
      return withCors(json({ error: "Valid email is required." }, 400));
    }

    if (!password) {
      return withCors(json({ error: "Password is required." }, 400));
    }

    const staffUser = await loadStaffUserByEmail(env, email);

    if (!staffUser) {
      return withCors(json({ error: "Invalid email or password." }, 401));
    }

    if (staffUser.is_active !== true) {
      return withCors(json({ error: "This staff account is inactive." }, 403));
    }

    if (!staffUser.password_hash) {
      return withCors(json({ error: "This staff account cannot sign in yet." }, 403));
    }

    const passwordOk = await verifyPassword(password, staffUser.password_hash);
    if (!passwordOk) {
      return withCors(json({ error: "Invalid email or password." }, 401));
    }

    const created = await createStaffSession({
      env,
      staffUser,
      request
    });

    let headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });

    headers = appendSetCookie(headers, created.cookie);
    headers = applyCors(headers);

    return new Response(
      JSON.stringify(
        {
          ok: true,
          message: "Signed in.",
          actor: formatActor(staffUser)
        },
        null,
        2
      ),
      {
        status: 200,
        headers
      }
    );
  } catch (err) {
    return withCors(
      json(
        {
          error: err && err.message ? err.message : "Unexpected server error."
        },
        500
      )
    );
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

/* ---------------- data access ---------------- */

async function loadStaffUserByEmail(env, email) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
      `?select=id,created_at,updated_at,full_name,email,role_code,is_active,password_hash,` +
      `can_override_lower_entries,can_manage_bookings,can_manage_blocks,can_manage_progress,can_manage_promos,can_manage_staff,notes` +
      `&email=eq.${encodeURIComponent(email)}` +
      `&limit=1`,
    {
      headers: serviceHeaders(env)
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Could not load staff account. ${text}`);
  }

  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  if (!row) return null;

  return {
    id: row.id || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    full_name: row.full_name || null,
    email: row.email || null,
    role_code: row.role_code || null,
    is_active: row.is_active === true,
    password_hash: row.password_hash || null,
    can_override_lower_entries: row.can_override_lower_entries === true,
    can_manage_bookings: row.can_manage_bookings === true,
    can_manage_blocks: row.can_manage_blocks === true,
    can_manage_progress: row.can_manage_progress === true,
    can_manage_promos: row.can_manage_promos === true,
    can_manage_staff: row.can_manage_staff === true,
    notes: row.notes || null
  };
}

/* ---------------- password verification ---------------- */

async function verifyPassword(password, storedHash) {
  const value = String(storedHash || "");
  if (!value) return false;

  // Lightweight fallback path.
  if (value.startsWith("sha256:")) {
    const expected = value.slice("sha256:".length);
    const actual = await sha256Hex(password);
    return safeEqual(actual, expected);
  }

  // bcrypt / $2a$ / $2b$ / $2y$ path if bcrypt lib is available in runtime
  if (/^\$2[aby]\$\d{2}\$/.test(value)) {
    const bcrypt = await loadBcrypt();
    if (!bcrypt) {
      throw new Error(
        "Password hash uses bcrypt but bcrypt is not available in this runtime yet."
      );
    }

    return !!(await bcrypt.compare(password, value));
  }

  // Optional direct equality fallback for temporary bootstrap accounts.
  if (value.startsWith("plain:")) {
    return safeEqual(password, value.slice("plain:".length));
  }

  return false;
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
  const bytes = new Uint8Array(hash);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  const x = String(a || "");
  const y = String(b || "");
  if (x.length !== y.length) return false;

  let out = 0;
  for (let i = 0; i < x.length; i += 1) {
    out |= x.charCodeAt(i) ^ y.charCodeAt(i);
  }
  return out === 0;
}

/* ---------------- response formatting ---------------- */

function formatActor(staffUser) {
  return {
    id: staffUser.id || null,
    full_name: staffUser.full_name || null,
    email: staffUser.email || null,
    role_code: staffUser.role_code || null,
    is_active: staffUser.is_active === true,
    is_admin: String(staffUser.role_code || "") === "admin",
    is_senior_detailer: String(staffUser.role_code || "") === "senior_detailer",
    is_detailer: String(staffUser.role_code || "") === "detailer",
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

/* ---------------- helpers ---------------- */

function cleanEmail(value) {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function methodNotAllowed() {
  return json({ error: "Method not allowed." }, 405);
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
  const extras = corsHeaders();

  for (const [key, value] of Object.entries(extras)) {
    if (!out.has(key)) out.set(key, value);
  }

  return out;
}

function withCors(response) {
  const headers = applyCors(response.headers || {});
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
