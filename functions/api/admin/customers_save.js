// functions/api/admin/customers_save.js
//
// Role-aware customer save endpoint.

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  isUuid,
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

    const normalized = normalizeCustomerPayload(body);
    if (!normalized.ok) {
      return withCors(json({ error: normalized.error }, 400));
    }

    const payload = normalized.payload;
    const headers = serviceHeaders(env);

    if (payload.tier_code) {
      const tierCheck = await findTierByCode(env, headers, payload.tier_code);
      if (!tierCheck.ok) {
        return withCors(tierCheck.response);
      }
    }

    if (payload.id) {
      const existing = await findCustomerById(env, headers, payload.id);
      if (!existing.ok) {
        return withCors(existing.response);
      }

      const patch = {
        full_name: payload.customer_name,
        email: payload.customer_email,
        phone: payload.customer_phone,
        tier_code: payload.tier_code,
        notes: payload.notes,
        updated_at: new Date().toISOString()
      };

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(payload.id)}`,
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
        return withCors(json({ error: `Could not update customer profile. ${text}` }, 500));
      }

      const rows = await res.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] || null : null;

      return withCors(
        json({
          ok: true,
          mode: "update",
          message: "Customer profile updated.",
          customer_profile: mapCustomerProfile(row)
        })
      );
    }

    const createPayload = {
      full_name: payload.customer_name,
      email: payload.customer_email,
      phone: payload.customer_phone,
      tier_code: payload.tier_code,
      notes: payload.notes
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([createPayload])
    });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not create customer profile. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        mode: "create",
        message: "Customer profile created.",
        customer_profile: mapCustomerProfile(row)
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

function normalizeCustomerPayload(body) {
  const id = cleanText(body.id);
  const customer_name = cleanText(body.customer_name);
  const customer_email = cleanEmail(body.customer_email);
  const customer_phone = cleanPhone(body.customer_phone);
  const tier_code = cleanTierCode(body.tier_code);
  const notes = cleanText(body.notes);

  if (id && !isUuid(id)) {
    return { ok: false, error: "Invalid customer profile id." };
  }

  if (!customer_name) {
    return { ok: false, error: "customer_name is required." };
  }

  if (!customer_email) {
    return { ok: false, error: "customer_email is required." };
  }

  if (body.customer_email && !customer_email) {
    return { ok: false, error: "Invalid customer_email." };
  }

  if (body.customer_phone && !customer_phone) {
    return { ok: false, error: "Invalid customer_phone." };
  }

  if (body.tier_code && !tier_code) {
    return { ok: false, error: "Invalid tier_code." };
  }

  return {
    ok: true,
    payload: {
      id: id || null,
      customer_name,
      customer_email,
      customer_phone,
      tier_code,
      notes
    }
  };
}

async function findCustomerById(env, headers, id) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/customer_profiles` +
      `?select=id,full_name,email` +
      `&id=eq.${encodeURIComponent(id)}` +
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
  const row = Array.isArray(rows) ? rows[0] || null : null;

  if (!row) {
    return {
      ok: false,
      response: json({ error: "Customer profile not found." }, 404)
    };
  }

  return { ok: true, row };
}

async function findTierByCode(env, headers, code) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/customer_tiers` +
      `?select=code,is_active` +
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
  const row = Array.isArray(rows) ? rows[0] || null : null;

  if (!row) {
    return {
      ok: false,
      response: json({ error: "Customer tier not found." }, 404)
    };
  }

  return { ok: true, row };
}

function mapCustomerProfile(row) {
  if (!row) return null;

  return {
    ...row,
    customer_name: row.full_name || null,
    customer_email: row.email || null,
    customer_phone: row.phone || null
  };
}

function cleanTierCode(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^[a-z0-9_-]{1,50}$/i.test(s) ? s : null;
}

function cleanEmail(value) {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function cleanPhone(value) {
  const s = String(value || "").trim();
  if (!s) return null;
  return s.length >= 7 ? s : null;
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
