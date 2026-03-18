// functions/api/admin/staff_list.js
//
// Role-aware staff list endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows only admin / can_manage_staff users to load staff admin data
// - returns staff users plus customer tiers for the admin-staff page
//
// Request headers supported:
// - x-admin-password: required
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed
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
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);

    const [staffRes, tiersRes] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/staff_users` +
          `?select=id,created_at,updated_at,full_name,email,role_code,is_active,` +
          `can_override_lower_entries,can_manage_bookings,can_manage_blocks,` +
          `can_manage_progress,can_manage_promos,can_manage_staff,notes` +
          `&order=full_name.asc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/customer_tiers` +
          `?select=code,sort_order,label,description,is_active` +
          `&order=sort_order.asc`,
        { headers }
      )
    ]);

    if (!staffRes.ok) {
      const text = await staffRes.text();
      return withCors(json({ error: `Could not load staff users. ${text}` }, 500));
    }

    if (!tiersRes.ok) {
      const text = await tiersRes.text();
      return withCors(json({ error: `Could not load customer tiers. ${text}` }, 500));
    }

    const [staffUsers, customerTiers] = await Promise.all([
      staffRes.json().catch(() => []),
      tiersRes.json().catch(() => [])
    ]);

    return withCors(
      json({
        ok: true,
        actor: {
          id: access.actor.id || null,
          full_name: access.actor.full_name || null,
          email: access.actor.email || null,
          role_code: access.actor.role_code || null
        },
        staff_users: Array.isArray(staffUsers) ? staffUsers : [],
        customer_tiers: Array.isArray(customerTiers) ? customerTiers : []
      })
    );
  } catch (err) {
    return withCors(
      json(
        { error: err && err.message ? err.message : "Unexpected server error." },
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
