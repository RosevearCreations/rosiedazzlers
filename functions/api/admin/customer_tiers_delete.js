// functions/api/admin/customer_tiers_delete.js
//
// Role-aware customer tier delete endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_bookings capability
// - permanently deletes one customer_tiers row
// - intended for true admin cleanup cases, not normal tier edits
//
// Supported request body:
// {
//   code: "gold"
// }
//
// Notes:
// - Use customer_tiers_save.js for normal edits
// - Use this only when the tier should be removed entirely
// - Customer tiers are business segmentation, not security roles
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
    const body = await request.json().catch(() => ({}));
    const code = cleanTierCode(body.code);

    if (!code) {
      return withCors(json({ error: "Valid code is required." }, 400));
    }

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

    const headers = serviceHeaders(env);
    const existing = await loadCustomerTier(env, headers, code);

    if (!existing.ok) {
      return withCors(existing.response);
    }

    const tier = existing.customer_tier;

    const delRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/customer_tiers?code=eq.${encodeURIComponent(code)}`,
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
      return withCors(json({ error: `Could not delete customer tier. ${text}` }, 500));
    }

    const rows = await delRes.json().catch(() => []);
    const deleted = Array.isArray(rows) ? rows[0] || tier : tier;

    return withCors(
      json({
        ok: true,
        message: "Customer tier deleted.",
        deleted_customer_tier: {
          code: deleted.code || tier.code || null,
          sort_order:
            deleted.sort_order == null
              ? Number(tier.sort_order || 0)
              : Number(deleted.sort_order),
          label: deleted.label || tier.label || null,
          description: deleted.description || tier.description || null,
          is_active:
            deleted.is_active === true || tier.is_active === true
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

async function loadCustomerTier(env, headers, code) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/customer_tiers` +
      `?select=code,sort_order,label,description,is_active` +
      `&code=eq.${encodeURIComponent(code)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify customer tier. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const customer_tier = Array.isArray(rows) ? rows[0] || null : null;

  if (!customer_tier) {
    return {
      ok: false,
      response: json({ error: "Customer tier not found." }, 404)
    };
  }

  return { ok: true, customer_tier };
}

function cleanTierCode(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^[a-z0-9_-]{1,50}$/i.test(s) ? String(s).trim().toLowerCase() : null;
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
