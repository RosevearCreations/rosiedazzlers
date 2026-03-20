// functions/api/admin/promos_delete.js
//
// Role-aware promo delete endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_promos capability
// - permanently deletes one promo_codes row
// - intended for true admin cleanup cases, not normal enable/disable flow
//
// Supported request body:
// {
//   promo_id: "uuid"
// }
//
// Notes:
// - Use promos_toggle_active.js for normal promo retirement / reactivation
// - Use this only when the promo should be removed entirely
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
    const promo_id = String(body.promo_id || "").trim();

    if (!promo_id) {
      return withCors(json({ error: "Missing promo_id." }, 400));
    }

    if (!isUuid(promo_id)) {
      return withCors(json({ error: "Invalid promo_id." }, 400));
    }

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

    const headers = serviceHeaders(env);
    const existing = await loadPromo(env, headers, promo_id);

    if (!existing.ok) {
      return withCors(existing.response);
    }

    const promo = existing.promo;

    const delRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/promo_codes?id=eq.${encodeURIComponent(promo_id)}`,
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
      return withCors(json({ error: `Could not delete promo code. ${text}` }, 500));
    }

    const rows = await delRes.json().catch(() => []);
    const deleted = Array.isArray(rows) ? rows[0] || promo : promo;

    return withCors(
      json({
        ok: true,
        message: "Promo code deleted.",
        deleted_promo_code: {
          id: deleted.id || promo.id,
          code: deleted.code || promo.code || null,
          label: deleted.label || promo.label || null,
          discount_type: deleted.discount_type || promo.discount_type || null,
          discount_value:
            deleted.discount_value == null
              ? Number(promo.discount_value || 0)
              : Number(deleted.discount_value),
          is_active:
            deleted.is_active === true || promo.is_active === true,
          starts_at: deleted.starts_at || promo.starts_at || null,
          ends_at: deleted.ends_at || promo.ends_at || null
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

async function loadPromo(env, headers, promoId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes` +
      `?select=id,code,label,discount_type,discount_value,is_active,starts_at,ends_at` +
      `&id=eq.${encodeURIComponent(promoId)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify promo code. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const promo = Array.isArray(rows) ? rows[0] || null : null;

  if (!promo) {
    return {
      ok: false,
      response: json({ error: "Promo code not found." }, 404)
    };
  }

  return { ok: true, promo };
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
