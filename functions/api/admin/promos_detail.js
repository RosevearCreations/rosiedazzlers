// functions/api/admin/promos_detail.js
//
// Role-aware promo detail endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_promos capability
// - loads one promo_codes row in full
// - returns basic usage context from bookings referencing that promo code
// - supports the /admin-promos page with one-record detail data
//
// Supported request body:
// {
//   promo_id: "uuid"
// }
//
// Notes:
// - booking linkage assumes bookings may store promo_code or promo_code_text style data
// - this endpoint searches common field names conservatively and returns empty usage if none match
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
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);

    const promoRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/promo_codes` +
        `?select=id,created_at,updated_at,code,label,description,discount_type,discount_value,minimum_subtotal,is_active,starts_at,ends_at,max_uses,total_uses,applies_to,notes` +
        `&id=eq.${encodeURIComponent(promo_id)}` +
        `&limit=1`,
      { headers }
    );

    if (!promoRes.ok) {
      const text = await promoRes.text();
      return withCors(json({ error: `Could not load promo code. ${text}` }, 500));
    }

    const promoRows = await promoRes.json().catch(() => []);
    const promo = Array.isArray(promoRows) ? promoRows[0] || null : null;

    if (!promo) {
      return withCors(json({ error: "Promo code not found." }, 404));
    }

    const bookingsUsage = await loadPromoBookings(env, headers, promo.code);

    return withCors(
      json({
        ok: true,
        actor: {
          id: access.actor.id || null,
          full_name: access.actor.full_name || null,
          email: access.actor.email || null,
          role_code: access.actor.role_code || null
        },
        promo_code: {
          id: promo.id,
          created_at: promo.created_at || null,
          updated_at: promo.updated_at || null,
          code: promo.code || null,
          label: promo.label || null,
          description: promo.description || null,
          discount_type: promo.discount_type || null,
          discount_value: promo.discount_value == null ? null : Number(promo.discount_value),
          minimum_subtotal:
            promo.minimum_subtotal == null ? null : Number(promo.minimum_subtotal),
          is_active: promo.is_active === true,
          starts_at: promo.starts_at || null,
          ends_at: promo.ends_at || null,
          max_uses: promo.max_uses == null ? null : Number(promo.max_uses),
          total_uses: promo.total_uses == null ? null : Number(promo.total_uses),
          applies_to: promo.applies_to || null,
          notes: promo.notes || null
        },
        usage_summary: summarizePromoUsage(bookingsUsage),
        recent_bookings: bookingsUsage.slice(0, 20).map((row) => ({
          id: row.id,
          created_at: row.created_at || null,
          updated_at: row.updated_at || null,
          service_date: row.service_date || null,
          start_slot: row.start_slot || null,
          status: row.status || null,
          job_status: row.job_status || null,
          customer_name: row.customer_name || null,
          customer_email: row.customer_email || null,
          total_price: row.total_price == null ? null : Number(row.total_price),
          deposit_amount: row.deposit_amount == null ? null : Number(row.deposit_amount)
        }))
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

/* ---------------- usage helpers ---------------- */

async function loadPromoBookings(env, headers, promoCode) {
  const searches = [
    buildPromoBookingsUrl(env, "promo_code", promoCode),
    buildPromoBookingsUrl(env, "promo_code_text", promoCode),
    buildPromoBookingsUrl(env, "discount_code", promoCode),
    buildPromoBookingsUrl(env, "coupon_code", promoCode)
  ];

  for (const url of searches) {
    const res = await fetch(url, { headers }).catch(() => null);
    if (!res || !res.ok) continue;

    const rows = await res.json().catch(() => []);
    if (Array.isArray(rows) && rows.length) {
      return rows;
    }
  }

  return [];
}

function buildPromoBookingsUrl(env, fieldName, promoCode) {
  return (
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,created_at,updated_at,service_date,start_slot,status,job_status,customer_name,customer_email,total_price,deposit_amount` +
    `&${fieldName}=eq.${encodeURIComponent(promoCode)}` +
    `&order=service_date.desc,created_at.desc` +
    `&limit=100`
  );
}

function summarizePromoUsage(bookings) {
  const out = {
    booking_count: 0,
    completed_count: 0,
    cancelled_count: 0,
    active_count: 0,
    total_estimated_value: 0,
    total_deposits: 0,
    last_used_at: null
  };

  for (const row of bookings) {
    out.booking_count += 1;

    const status = String(row.status || "").trim().toLowerCase();
    const jobStatus = String(row.job_status || "").trim().toLowerCase();

    if (status === "cancelled" || jobStatus === "cancelled") {
      out.cancelled_count += 1;
    } else {
      out.active_count += 1;
    }

    if (status === "completed" || jobStatus === "completed") {
      out.completed_count += 1;
    }

    out.total_estimated_value += Number(row.total_price || 0);
    out.total_deposits += Number(row.deposit_amount || 0);

    const currentLast = out.last_used_at ? Date.parse(out.last_used_at) : 0;
    const rowTime = Date.parse(row.service_date || row.created_at || 0);
    if (!out.last_used_at || rowTime > currentLast) {
      out.last_used_at = row.service_date || row.created_at || null;
    }
  }

  return out;
}

/* ---------------- shared helpers ---------------- */

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
