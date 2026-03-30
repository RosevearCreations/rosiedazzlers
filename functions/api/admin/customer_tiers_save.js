// functions/api/admin/customer_tiers_save.js
//
// Role-aware customer tier save endpoint.
//
// What this file does:
// - prefers signed-in staff session access
// - requires manage_bookings capability
// - creates new customer_tiers rows
// - updates existing customer_tiers rows
// - keeps customer tier management separate from staff security roles
//
// Supported request body:
// {
//   code?: "gold",
//   sort_order?: 20,
//   label: "Gold",
//   description?: "Top repeat customers",
//   is_active?: true
// }
//
// Notes:
// - code is the row identifier for customer_tiers
// - if code already exists, the row is updated
// - customer tiers are business segmentation, not access/security roles
//
// Request headers supported:
// - x-admin-password: transitional compatibility only when explicitly used
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  cleanText,
  toBoolean,
  toNullableInteger
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

    const normalized = normalizeTierPayload(body);
    if (!normalized.ok) {
      return withCors(json({ error: normalized.error }, 400));
    }

    const payload = normalized.payload;
    const headers = serviceHeaders(env);

    const existing = await findTierByCode(env, headers, payload.code);

    if (!existing.ok) {
      return withCors(existing.response);
    }

    if (existing.row) {
      const patch = {
        sort_order: payload.sort_order,
        label: payload.label,
        description: payload.description,
        is_active: payload.is_active
      };

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/customer_tiers?code=eq.${encodeURIComponent(payload.code)}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
          body: JSON.stringify(patch)
        }
      );

      if (!res.ok) {
        const text = await res.text();
        return withCors(json({ error: `Could not update customer tier. ${text}` }, 500));
      }

      const rows = await res.json().catch(() => []);
      return withCors(
        json({
          ok: true,
          mode: "update",
          message: "Customer tier updated.",
          customer_tier: Array.isArray(rows) ? rows[0] || null : null
        })
      );
    }

    const createPayload = {
      code: payload.code,
      sort_order: payload.sort_order,
      label: payload.label,
      description: payload.description,
      is_active: payload.is_active
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_tiers`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([createPayload])
    });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not create customer tier. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    return withCors(
      json({
        ok: true,
        mode: "create",
        message: "Customer tier created.",
        customer_tier: Array.isArray(rows) ? rows[0] || null : null
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

function normalizeTierPayload(body) {
  const rawCode = cleanText(body.code);
  const code = rawCode ? String(rawCode).trim().toLowerCase() : null;
  const sort_order = toNullableInteger(body.sort_order);
  const label = cleanText(body.label);
  const description = cleanText(body.description);
  const is_active = body.is_active === undefined ? true : toBoolean(body.is_active);

  if (!code) {
    return { ok: false, error: "code is required." };
  }

  if (!/^[a-z0-9_-]{1,50}$/.test(code)) {
    return { ok: false, error: "Invalid code." };
  }

  if (!label) {
    return { ok: false, error: "label is required." };
  }

  if (sort_order !== null && sort_order < 0) {
    return { ok: false, error: "sort_order cannot be negative." };
  }

  return {
    ok: true,
    payload: {
      code,
      sort_order: sort_order ?? 0,
      label,
      description,
      is_active
    }
  };
}

async function findTierByCode(env, headers, code) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/customer_tiers` +
      `?select=code,label,is_active` +
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
  return {
    ok: true,
    row: Array.isArray(rows) ? rows[0] || null : null
  };
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
