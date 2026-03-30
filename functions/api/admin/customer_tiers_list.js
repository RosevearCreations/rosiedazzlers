// functions/api/admin/customer_tiers_list.js
//
// Role-aware customer tier list endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_bookings capability
// - returns customer_tiers for the admin customers area
// - keeps customer tier management separate from staff security roles
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
      capability: "manage_bookings",
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const activeOnly = body.active_only === undefined ? false : toBoolean(body.active_only);
    const headers = serviceHeaders(env);

    let url =
      `${env.SUPABASE_URL}/rest/v1/customer_tiers` +
      `?select=code,sort_order,label,description,is_active` +
      `&order=sort_order.asc,code.asc`;

    if (activeOnly) {
      url += `&is_active=eq.true`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not load customer tiers. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const customerTiers = Array.isArray(rows) ? rows : [];

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
        customer_tiers: customerTiers.map((row) => ({
          code: row.code || null,
          sort_order: row.sort_order == null ? 0 : Number(row.sort_order),
          label: row.label || null,
          description: row.description || null,
          is_active: row.is_active === true
        }))
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
