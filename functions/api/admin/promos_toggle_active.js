// functions/api/admin/promos_toggle_active.js
//
// Role-aware promo activate / deactivate endpoint.
//
// What this file does:
// - prefers signed-in staff session access
// - requires manage_promos capability
// - activates or deactivates promo_codes without deleting rows
// - preserves promo history and usage counts
// - allows optional note logging into the promo notes field
//
// Supported request body:
// {
//   promo_id: "uuid",
//   is_active: false,
//   reason?: "Seasonal campaign ended"
// }
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
    const is_active = body.is_active;
    const reason = cleanText(body.reason);

    if (!promo_id) {
      return withCors(json({ error: "Missing promo_id." }, 400));
    }

    if (!isUuid(promo_id)) {
      return withCors(json({ error: "Invalid promo_id." }, 400));
    }

    if (typeof is_active !== "boolean") {
      return withCors(json({ error: "is_active must be true or false." }, 400));
    }

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

    const headers = serviceHeaders(env);
    const existing = await loadPromo(env, headers, promo_id);

    if (!existing.ok) {
      return withCors(existing.response);
    }

    const promo = existing.promo;

    const patch = {
      is_active,
      updated_at: new Date().toISOString()
    };

    if (reason) {
      patch.notes = appendReason(promo.notes, reason, is_active);
    }

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/promo_codes?id=eq.${encodeURIComponent(promo_id)}`,
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
      return withCors(json({ error: `Could not update promo status. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        message: is_active ? "Promo code activated." : "Promo code deactivated.",
        promo_code: row
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

async function loadPromo(env, headers, promoId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes` +
      `?select=id,code,label,is_active,notes,updated_at` +
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

function appendReason(existingNotes, reason, isActive) {
  const statusText = isActive ? "Activated" : "Deactivated";
  const stamp = new Date().toISOString();
  const line = `[${stamp}] ${statusText}: ${reason}`;

  const current = cleanText(existingNotes);
  if (!current) return line;
  return `${current}\n${line}`;
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
