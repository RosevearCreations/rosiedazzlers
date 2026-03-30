// functions/api/admin/promos_save.js
//
// Role-aware promo save endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_promos capability
// - creates new promo_codes rows
// - updates existing promo_codes rows
// - keeps promo field handling additive and conservative
//
// Supported request body:
// {
//   id?: "uuid",
//   code: "SPRING10",
//   label?: "Spring Sale",
//   description?: "10 percent off spring promo",
//   discount_type: "percent" | "fixed",
//   discount_value: 10,
//   minimum_subtotal?: 50,
//   is_active?: true,
//   starts_at?: "2026-03-18T00:00:00.000Z",
//   ends_at?: "2026-03-31T23:59:59.999Z",
//   max_uses?: 100,
//   total_uses?: 0,
//   applies_to?: "all",
//   notes?: "optional"
// }

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  isUuid,
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
      capability: "manage_promos",
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const normalized = normalizePromoPayload(body);
    if (!normalized.ok) {
      return withCors(json({ error: normalized.error }, 400));
    }

    const payload = normalized.payload;
    const headers = serviceHeaders(env);

    if (payload.id) {
      const existing = await findPromoById(env, headers, payload.id);
      if (!existing.ok) {
        return withCors(existing.response);
      }

      const patch = {
        code: payload.code,
        label: payload.label,
        description: payload.description,
        discount_type: payload.discount_type,
        discount_value: payload.discount_value,
        minimum_subtotal: payload.minimum_subtotal,
        is_active: payload.is_active,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
        max_uses: payload.max_uses,
        total_uses: payload.total_uses,
        applies_to: payload.applies_to,
        notes: payload.notes,
        updated_at: new Date().toISOString()
      };

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/promo_codes?id=eq.${encodeURIComponent(payload.id)}`,
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
        return withCors(json({ error: `Could not update promo code. ${text}` }, 500));
      }

      const rows = await res.json().catch(() => []);
      return withCors(
        json({
          ok: true,
          mode: "update",
          message: "Promo code updated.",
          promo_code: Array.isArray(rows) ? rows[0] || null : null
        })
      );
    }

    const createPayload = {
      code: payload.code,
      label: payload.label,
      description: payload.description,
      discount_type: payload.discount_type,
      discount_value: payload.discount_value,
      minimum_subtotal: payload.minimum_subtotal,
      is_active: payload.is_active,
      starts_at: payload.starts_at,
      ends_at: payload.ends_at,
      max_uses: payload.max_uses,
      total_uses: payload.total_uses,
      applies_to: payload.applies_to,
      notes: payload.notes
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/promo_codes`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([createPayload])
    });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not create promo code. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    return withCors(
      json({
        ok: true,
        mode: "create",
        message: "Promo code created.",
        promo_code: Array.isArray(rows) ? rows[0] || null : null
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

function normalizePromoPayload(body) {
  const id = cleanText(body.id);
  const code = String(body.code || "").trim().toUpperCase();
  const label = cleanText(body.label);
  const description = cleanText(body.description);
  const discount_type = String(body.discount_type || "").trim().toLowerCase();
  const discount_value = toNumberOrNull(body.discount_value);
  const minimum_subtotal = toNumberOrNull(body.minimum_subtotal);
  const is_active = body.is_active === undefined ? true : toBoolean(body.is_active);
  const starts_at = cleanIsoDateTime(body.starts_at);
  const ends_at = cleanIsoDateTime(body.ends_at);
  const max_uses = toNullableInteger(body.max_uses);
  const total_uses = toNullableInteger(body.total_uses);
  const applies_to = cleanText(body.applies_to) || "all";
  const notes = cleanText(body.notes);

  if (id && !isUuid(id)) {
    return { ok: false, error: "Invalid promo id." };
  }

  if (!code || !/^[A-Z0-9_-]{2,50}$/.test(code)) {
    return { ok: false, error: "Valid promo code is required." };
  }

  if (!["percent", "fixed"].includes(discount_type)) {
    return { ok: false, error: "discount_type must be 'percent' or 'fixed'." };
  }

  if (discount_value === null || discount_value < 0) {
    return { ok: false, error: "Valid discount_value is required." };
  }

  if (discount_type === "percent" && discount_value > 100) {
    return { ok: false, error: "Percent discount_value cannot exceed 100." };
  }

  if (minimum_subtotal !== null && minimum_subtotal < 0) {
    return { ok: false, error: "minimum_subtotal cannot be negative." };
  }

  if (max_uses !== null && max_uses < 0) {
    return { ok: false, error: "max_uses cannot be negative." };
  }

  if (total_uses !== null && total_uses < 0) {
    return { ok: false, error: "total_uses cannot be negative." };
  }

  if (starts_at === false) {
    return { ok: false, error: "Invalid starts_at." };
  }

  if (ends_at === false) {
    return { ok: false, error: "Invalid ends_at." };
  }

  if (starts_at && ends_at && new Date(starts_at).getTime() > new Date(ends_at).getTime()) {
    return { ok: false, error: "starts_at cannot be later than ends_at." };
  }

  return {
    ok: true,
    payload: {
      id: id || null,
      code,
      label,
      description,
      discount_type,
      discount_value,
      minimum_subtotal,
      is_active,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
      max_uses,
      total_uses,
      applies_to,
      notes
    }
  };
}

async function findPromoById(env, headers, id) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes` +
      `?select=id,code` +
      `&id=eq.${encodeURIComponent(id)}` +
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
  const row = Array.isArray(rows) ? rows[0] || null : null;

  if (!row) {
    return {
      ok: false,
      response: json({ error: "Promo code not found." }, 404)
    };
  }

  return { ok: true, row };
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cleanIsoDateTime(value) {
  const s = cleanText(value);
  if (!s) return null;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return false;
  return new Date(t).toISOString();
}
