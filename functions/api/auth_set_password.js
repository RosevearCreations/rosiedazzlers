// functions/api/admin/auth_set_password.js
//
// Staff password set/reset endpoint.
//
// What this file does:
// - allows an authorized admin to set or reset a staff user's password
// - writes password_hash into public.staff_users
// - supports bcrypt when available, with sha256 fallback
// - keeps legacy ADMIN_PASSWORD bridge support through requireStaffAccess()
//
// Supported request body:
// {
//   staff_user_id: "uuid",
//   new_password: "new password",
//   hash_mode?: "bcrypt" | "sha256"
// }
//
// Notes:
// - bcrypt is preferred when available
// - sha256 mode is included only as a fallback/bootstrap path
// - this endpoint is for admin/staff management, not customer auth

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  isUuid,
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
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ error: "Server configuration is incomplete." }, 500));
    }

    const body = await request.json().catch(() => ({}));
    const staff_user_id = String(body.staff_user_id || "").trim();
    const new_password = String(body.new_password || "");
    const hash_mode = normalizeHashMode(body.hash_mode);

    if (!staff_user_id) {
      return withCors(json({ error: "Missing staff_user_id." }, 400));
    }

    if (!isUuid(staff_user_id)) {
      return withCors(json({ error: "Invalid staff_user_id." }, 400));
    }

    const passwordCheck = validatePassword(new_password);
    if (!passwordCheck.ok) {
      return withCors(json({ error: passwordCheck.error }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const existing = await loadStaffUser(env, staff_user_id);
    if (!existing) {
      return withCors(json({ error: "Staff user not found." }, 404));
    }

    const password_hash = await makePasswordHash(new_password, hash_mode);

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/staff_users?id=eq.${encodeURIComponent(staff_user_id)}`,
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
      return withCors(json({ error: `Could not update password. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        message: "Staff password updated.",
        staff_user: row
          ? {
              id: row.id || null,
              full_name: row.full_name || null,
              email: row.email || null,
              role_code: row.role_code || null,
              is_active: row.is_active === true
            }
          : {
              id: existing.id,
              full_name: existing.full_name || null,
              email: existing.email || null,
              role_code: existing.role_code || null,
              is_active: existing.is_active === true
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

async function loadStaffUser(env, staffUserId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
      `?select=id,full_name,email,role_code,is_active` +
      `&id=eq.${encodeURIComponent(staffUserId)}` +
      `&limit=1`,
    {
      headers: serviceHeaders(env)
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Could not verify staff user. ${text}`);
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

/* ---------------- helpers ---------------- */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  const extras = corsHeaders();

  for (const [key, value] of Object.entries(extras)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
