// functions/api/admin/auth_bootstrap_admin_password.js
//
// One-time admin password bootstrap endpoint.
//
// What this file does:
// - uses the existing legacy ADMIN_PASSWORD bridge
// - finds an existing active admin staff account
// - sets its password_hash if one is missing or if overwrite is explicitly allowed
// - gives you a practical way to bootstrap the first real session-based admin login
//
// Supported request body:
// {
//   email: "admin@example.com",
//   new_password: "new password",
//   hash_mode?: "bcrypt" | "sha256",
//   overwrite_existing?: false
// }
//
// Notes:
// - this is intended as a transition/bootstrap tool
// - protect it with x-admin-password
// - once the first real admin login works, this endpoint can later be retired

import {
  serviceHeaders,
  json,
  methodNotAllowed,
  cleanEmail,
  cleanText
} from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.ADMIN_PASSWORD) {
      return withCors(json({ error: "Server configuration is incomplete." }, 500));
    }

    const provided = request.headers.get("x-admin-password") || "";
    if (!provided || provided !== env.ADMIN_PASSWORD) {
      return withCors(json({ error: "Unauthorized." }, 401));
    }

    const body = await request.json().catch(() => ({}));
    const email = cleanEmail(body.email);
    const new_password = String(body.new_password || "");
    const hash_mode = normalizeHashMode(body.hash_mode);
    const overwrite_existing = toBoolean(body.overwrite_existing);

    if (!email) {
      return withCors(json({ error: "Valid email is required." }, 400));
    }

    const passwordCheck = validatePassword(new_password);
    if (!passwordCheck.ok) {
      return withCors(json({ error: passwordCheck.error }, 400));
    }

    const staffUser = await loadAdminStaffUserByEmail(env, email);
    if (!staffUser) {
      return withCors(json({ error: "Active admin staff account not found." }, 404));
    }

    if (staffUser.password_hash && !overwrite_existing) {
      return withCors(
        json(
          {
            error:
              "This admin account already has a password_hash. Pass overwrite_existing=true only if you intentionally want to replace it."
          },
          409
        )
      );
    }

    const password_hash = await makePasswordHash(new_password, hash_mode);

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/staff_users?id=eq.${encodeURIComponent(staffUser.id)}`,
      {
        method: "PATCH",
        headers: {
          ...serviceHeaders(env),
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          password_hash,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not bootstrap admin password. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        message: "Admin password bootstrap complete.",
        staff_user: row
          ? {
              id: row.id || null,
              full_name: row.full_name || null,
              email: row.email || null,
              role_code: row.role_code || null,
              is_active: row.is_active === true
            }
          : {
              id: staffUser.id,
              full_name: staffUser.full_name || null,
              email: staffUser.email || null,
              role_code: staffUser.role_code || null,
              is_active: staffUser.is_active === true
            },
        hash_mode_used: password_hash.startsWith("sha256:") ? "sha256" : "bcrypt"
      })
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

async function loadAdminStaffUserByEmail(env, email) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
      `?select=id,full_name,email,role_code,is_active,password_hash` +
      `&email=eq.${encodeURIComponent(email)}` +
      `&role_code=eq.admin` +
      `&is_active=eq.true` +
      `&limit=1`,
    {
      headers: serviceHeaders(env)
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Could not verify admin staff account. ${text}`);
  }

  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

/* ---------------- password hashing ---------------- */

async function makePasswordHash(password, requestedMode) {
  const mode = requestedMode || "bcrypt";

  if (mode === "bcrypt") {
    const bcrypt = await loadBcrypt();
    if (bcrypt) {
      const salt = await bcrypt.genSalt(12);
      return bcrypt.hash(password, salt);
    }
  }

  const sha = await sha256Hex(password);
  return `sha256:${sha}`;
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

/* ---------------- validation ---------------- */

function validatePassword(password) {
  if (!password) {
    return { ok: false, error: "new_password is required." };
  }

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters long." };
  }

  if (password.length > 200) {
    return { ok: false, error: "Password is too long." };
  }

  return { ok: true };
}

function normalizeHashMode(value) {
  const s = cleanText(value);
  if (!s) return "bcrypt";

  const mode = String(s).trim().toLowerCase();
  if (mode === "bcrypt" || mode === "sha256") return mode;

  return "bcrypt";
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  const s = String(value || "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

/* ---------------- helpers ---------------- */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
