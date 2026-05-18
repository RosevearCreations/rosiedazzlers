// functions/api/admin/customers_delete.js
//
// Role-aware customer profile delete endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_bookings capability
// - permanently deletes one customer_profiles row
// - intended for true admin cleanup cases, not normal edits
//
// Supported request body:
// {
//   customer_profile_id: "uuid"
// }
//
// Notes:
// - Use customers_save.js for normal edits
// - Use this only when the customer profile should be removed entirely
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
  isUuid
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
    const customer_profile_id = String(body.customer_profile_id || "").trim();

    if (!customer_profile_id) {
      return withCors(json({ error: "Missing customer_profile_id." }, 400));
    }

    if (!isUuid(customer_profile_id)) {
      return withCors(json({ error: "Invalid customer_profile_id." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);
    const existing = await loadCustomerProfile(env, headers, customer_profile_id);

    if (!existing.ok) {
      return withCors(existing.response);
    }

    const profile = existing.customer_profile;

    const delRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(customer_profile_id)}`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          Prefer: "return=representation"
        }
      }
    );

    if (!delRes.ok) {
      const text = await delRes.text();
      return withCors(json({ error: `Could not delete customer profile. ${text}` }, 500));
    }

    const rows = await delRes.json().catch(() => []);
    const deleted = Array.isArray(rows) ? rows[0] || profile : profile;

    return withCors(
      json({
        ok: true,
        message: "Customer profile deleted.",
        deleted_customer_profile: {
          id: deleted.id || profile.id,
          customer_name: deleted.customer_name || profile.customer_name || null,
          customer_email: deleted.customer_email || profile.customer_email || null,
          customer_phone: deleted.customer_phone || profile.customer_phone || null,
          tier_code: deleted.tier_code || profile.tier_code || null,
          created_at: deleted.created_at || profile.created_at || null,
          updated_at: deleted.updated_at || profile.updated_at || null
        }
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

async function loadCustomerProfile(env, headers, customerProfileId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/customer_profiles` +
      `?select=id,customer_name,customer_email,customer_phone,tier_code,created_at,updated_at` +
      `&id=eq.${encodeURIComponent(customerProfileId)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify customer profile. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const customer_profile = Array.isArray(rows) ? rows[0] || null : null;

  if (!customer_profile) {
    return {
      ok: false,
      response: json({ error: "Customer profile not found." }, 404)
    };
  }

  return { ok: true, customer_profile };
}

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
