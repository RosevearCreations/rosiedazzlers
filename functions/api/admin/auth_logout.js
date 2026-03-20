// functions/api/admin/auth_logout.js
//
// Staff logout endpoint.
//
// What this file does:
// - reads the current rd_staff_session cookie
// - revokes the matching session in staff_auth_sessions
// - clears the session cookie
// - returns a simple signed-out response
//
// Expected env vars:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - STAFF_SESSION_SECRET

import {
  getCurrentStaffSession,
  revokeStaffSessionByToken,
  appendSetCookie,
  buildClearSessionCookie
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

    const current = await getCurrentStaffSession({
      env,
      request
    });

    if (current && current.raw_token) {
      await revokeStaffSessionByToken({
        env,
        token: current.raw_token
      });
    }

    let headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });

    headers = appendSetCookie(headers, buildClearSessionCookie());
    headers = applyCors(headers);

    return new Response(
      JSON.stringify(
        {
          ok: true,
          message: "Signed out."
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
    let headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });

    headers = appendSetCookie(headers, buildClearSessionCookie());
    headers = applyCors(headers);

    return new Response(
      JSON.stringify(
        {
          error: err && err.message ? err.message : "Unexpected server error."
        },
        null,
        2
      ),
      {
        status: 500,
        headers
      }
    );
  }
}

export async function onRequestGet(context) {
  return onRequestPost(context);
}

/* ---------------- helpers ---------------- */

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
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
