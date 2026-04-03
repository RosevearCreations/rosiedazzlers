// functions/api/admin/booking_form_data.js
//
// Role-aware booking form bootstrap endpoint.
//
// What this file does:
// - prefers signed-in staff session access
// - requires manage_bookings capability
// - loads admin booking form reference data in one call
// - returns active staff, customer tiers, active promos, and schedule blocks
// - optionally filters blocks by a chosen service_date
//
// Supported request body:
// {
//   service_date?: "2026-03-21"
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
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const service_date = cleanDate(body.service_date);
    if (body.service_date && !service_date) {
      return withCors(json({ error: "Invalid service_date." }, 400));
    }

    const headers = serviceHeaders(env);

    const [
      staffRes,
      tiersRes,
      promosRes,
      dateBlocksRes,
      slotBlocksRes
    ] = await Promise.all([
      fetch(buildStaffUrl(env), { headers }),
      fetch(buildCustomerTiersUrl(env), { headers }),
      fetch(buildPromosUrl(env), { headers }),
      fetch(buildDateBlocksUrl(env, service_date), { headers }),
      fetch(buildSlotBlocksUrl(env, service_date), { headers })
    ]);

    if (!staffRes.ok) {
      const text = await staffRes.text();
      return withCors(json({ error: `Could not load staff options. ${text}` }, 500));
    }

    if (!tiersRes.ok) {
      const text = await tiersRes.text();
      return withCors(json({ error: `Could not load customer tiers. ${text}` }, 500));
    }

    if (!promosRes.ok) {
      const text = await promosRes.text();
      return withCors(json({ error: `Could not load promo options. ${text}` }, 500));
    }

    if (!dateBlocksRes.ok) {
      const text = await dateBlocksRes.text();
      return withCors(json({ error: `Could not load date blocks. ${text}` }, 500));
    }

    if (!slotBlocksRes.ok) {
      const text = await slotBlocksRes.text();
      return withCors(json({ error: `Could not load slot blocks. ${text}` }, 500));
    }

    const [
      staffRows,
      tierRows,
      promoRows,
      dateBlockRows,
      slotBlockRows
    ] = await Promise.all([
      staffRes.json().catch(() => []),
      tiersRes.json().catch(() => []),
      promosRes.json().catch(() => []),
      dateBlocksRes.json().catch(() => []),
      slotBlocksRes.json().catch(() => [])
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
        filters: {
          service_date: service_date || null
        },
        staff_users: Array.isArray(staffRows) ? staffRows : [],
        customer_tiers: Array.isArray(tierRows) ? tierRows : [],
        promo_codes: Array.isArray(promoRows) ? promoRows : [],
        date_blocks: Array.isArray(dateBlockRows) ? dateBlockRows : [],
        slot_blocks: Array.isArray(slotBlockRows) ? slotBlockRows : []
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

/* ---------------- query builders ---------------- */

function buildStaffUrl(env) {
  return (
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
    `?select=id,full_name,email,role_code,is_active,can_manage_bookings,can_manage_progress` +
    `&is_active=eq.true` +
    `&order=full_name.asc`
  );
}

function buildCustomerTiersUrl(env) {
  return (
    `${env.SUPABASE_URL}/rest/v1/customer_tiers` +
    `?select=code,sort_order,label,description,is_active` +
    `&is_active=eq.true` +
    `&order=sort_order.asc,code.asc`
  );
}

function buildPromosUrl(env) {
  const nowIso = new Date().toISOString();

  return (
    `${env.SUPABASE_URL}/rest/v1/promo_codes` +
    `?select=id,code,label,description,discount_type,discount_value,minimum_subtotal,is_active,starts_at,ends_at,max_uses,total_uses,applies_to` +
    `&is_active=eq.true` +
    `&order=code.asc` +
    `&or=(starts_at.is.null,starts_at.lte.${encodeURIComponent(nowIso)})` +
    `&or=(ends_at.is.null,ends_at.gte.${encodeURIComponent(nowIso)})`
  );
}

function buildDateBlocksUrl(env, service_date) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/date_blocks` +
    `?select=id,blocked_date,reason,created_at` +
    `&order=blocked_date.asc,created_at.desc`;

  if (service_date) {
    url += `&blocked_date=eq.${encodeURIComponent(service_date)}`;
  }

  return url;
}

function buildSlotBlocksUrl(env, service_date) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/slot_blocks` +
    `?select=id,blocked_date,slot,reason,created_at` +
    `&order=blocked_date.asc,slot.asc,created_at.desc`;

  if (service_date) {
    url += `&blocked_date=eq.${encodeURIComponent(service_date)}`;
  }

  return url;
}

/* ---------------- helpers ---------------- */

function cleanDate(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
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
