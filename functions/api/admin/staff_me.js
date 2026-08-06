// functions/api/admin/staff_me.js
//
// Compatibility current-staff endpoint.
//
// What this file does:
// - keeps the older /api/admin/staff_me route working
// - resolves the current signed-in staff user from the session cookie
// - returns a familiar actor/capability payload for older admin pages
// - clears the session cookie if it is invalid / expired / revoked
// - acts as a bridge while pages move from older patterns to auth_me.js
//
// Expected env vars:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - STAFF_SESSION_SECRET

import {
  getCurrentStaffSession,
  touchStaffSession,
  rotateStaffSession,
  appendSetCookie,
  buildClearSessionCookie
} from "../_lib/staff-session.js";

export async function onRequestOptions() {
  return new Response("", {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestGet(context) {
  return handleStaffMe(context);
}

export async function onRequestPost(context) {
  return handleStaffMe(context);
}

async function handleStaffMe(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY ) {
      return withCors(json({ error: "Server configuration is incomplete." }, 500));
    }

    const current = await getCurrentStaffSession({
      env,
      request
    });

    if (!current || !current.staff_user) {
      let headers = new Headers({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });

      headers = appendSetCookie(
        headers,
        current && current.clear_cookie ? current.clear_cookie : buildClearSessionCookie()
      );
      headers = applyCors(headers);

      return new Response(
        JSON.stringify(
          {
            ok: true,
            authenticated: false,
            actor: null,
            staff_user: null
          },
          null,
          2
        ),
        {
          status: 200,
          headers
        }
      );
    }

    await touchStaffSession({
      env,
      sessionId: current.session && current.session.id ? current.session.id : null,
      request
    });

    let rotatedCookie = null;

    if (current.needs_rotation === true) {
      const rotated = await rotateStaffSession({
        env,
        request,
        currentSession: current.session,
        staffUser: current.staff_user
      });

      rotatedCookie = rotated.cookie || null;
    }

    const actor = formatActor(current.staff_user);

    let headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });

    if (rotatedCookie) {
      headers = appendSetCookie(headers, rotatedCookie);
    }

    headers = applyCors(headers);

    return new Response(
      JSON.stringify(
        {
          ok: true,
          authenticated: true,
          actor,
          staff_user: actor
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

/* ---------------- actor formatting ---------------- */

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

    can_override_lower_entries: staffUser.can_override_lower_entries === true,
    can_manage_bookings: staffUser.can_manage_bookings === true,
    can_manage_blocks: staffUser.can_manage_blocks === true,
    can_manage_progress: staffUser.can_manage_progress === true,
    can_manage_promos: staffUser.can_manage_promos === true,
    can_manage_staff: staffUser.can_manage_staff === true,

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
