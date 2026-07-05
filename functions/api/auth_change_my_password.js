// functions/api/admin/auth_change_my_password.js
//
// Signed-in staff password change endpoint.
//
// What this file does:
// - requires a valid signed-in staff session
// - verifies the current password before allowing a change
// - updates password_hash for the current staff user
// - supports bcrypt when available, with sha256 fallback
//
// Supported request body:
// {
//   current_password: "old password",
//   new_password: "new password",
//   hash_mode?: "bcrypt" | "sha256"
// }
//
// Notes:
// - this endpoint is for the CURRENT signed-in staff user only
// - admin reset for another staff user should continue using auth_set_password.js

import {
  getCurrentStaffSession
} from "../_lib/staff-session.js";
import {
  serviceHeaders,
  json,
  methodNotAllowed,
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
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY ) {
      return withCors(json({ error: "Server configuration is incomplete." }, 500));
    }

    const current = await getCurrentStaffSession({
      env,
      request
    });

    if (!current || !current.staff_user || !current.staff_user.id) {
      return withCors(json({ error: "Unauthorized." }, 401));
    }

    if (current.staff_user.is_active !== true) {
      return withCors(json({ error: "Staff account is inactive." }, 403));
    }

    const body = await request.json().catch(() => ({}));
    const current_password = String(body.current_password || "");
    const new_password = String(body.new_password || "");
    const hash_mode = normalizeHashMode(body.hash_mode);

    if (!current_password) {
      return withCors(json({ error: "current_password is required." }, 400));
    }

    const passwordCheck = validatePassword(new_password);
    if (!passwordCheck.ok) {
      return withCors(json({ error: passwordCheck.error }, 400));
    }

    const fullStaff = await loadStaffUserWithHash(env, current.staff_user.id);
    if (!fullStaff) {
      return withCors(json({ error: "Staff account not found." }, 404));
    }

    if (!fullStaff.password_hash) {
      return withCors(json({ error: "This staff account cannot change password yet." }, 403));
    }

    const currentOk = await verifyPassword(current_password, fullStaff.password_hash);
    if (!currentOk) {
      return withCors(json({ error: "Current password is incorrect." }, 401));
    }

    const password_hash = await makePasswordHash(new_password, hash_mode);

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/staff_users?id=eq.${encodeURIComponent(fullStaff.id)}`,
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
      return withCors(json({ error: `Could not change password. ${text}` }, 500));
    }

    return withCors(
      json({
        ok: true,
        message: "Password changed successfully.",
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

async function loadStaffUserWithHash(env, staffUserId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
      `?select=id,full_name,email,role_code,is_active,password_hash` +
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

/* ---------------- password hashing / verify ---------------- */

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

async function verifyPassword(password, storedHash) {
  const value = String(storedHash || "");
  if (!value) return false;

  if (value.startsWith("sha256:")) {
    const expected = value.slice("sha256:".length);
    const actual = await sha256Hex(password);
    return safeEqual(actual, expected);
  }

  if (/^\$2[aby]\$\d{2}\$/.test(value)) {
    const bcrypt = await loadBcrypt();
    if (!bcrypt) {
      throw new Error(
        "Password hash uses bcrypt but bcrypt is not available in this runtime yet."
      );
    }

    return !!(await bcrypt.compare(password, value));
  }

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
    "Access-Control-Allow-Headers": "Content-Type",
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
