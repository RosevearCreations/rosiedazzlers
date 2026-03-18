// functions/api/admin/promos_list.js
//
// Role-aware promo list endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_promos capability
// - returns promo codes for the admin promos page
// - supports optional active-only filtering
//
// Supported request body:
// {
//   active_only?: true
// }
//
// Request headers supported:
// - x-admin-password: required
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  toBoolean
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
    const body = await request.json().catch(() => ({}));

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_promos",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const activeOnly = body.active_only === undefined ? false : toBoolean(body.active_only);
    const headers = serviceHeaders(env);

    let url =
      `${env.SUPABASE_URL}/rest/v1/promo_codes` +
      `?select=id,created_at,updated_at,code,label,description,discount_type,discount_value,` +
      `minimum_subtotal,is_active,starts_at,ends_at,max_uses,total_uses,applies_to,notes` +
      `&order=created_at.desc`;

    if (activeOnly) {
      url += `&is_active=eq.true`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not load promo codes. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);

    return withCors(
      json({
        ok: true,
        actor: {
          id: access.actor.id || null,
          full_name: access.actor.full_name || null,
          email: access.actor.email || null,
          role_code: access.actor.role_code || null
        },
        filters: {
          active_only: activeOnly
        },
        promo_codes: Array.isArray(rows) ? rows : []
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
