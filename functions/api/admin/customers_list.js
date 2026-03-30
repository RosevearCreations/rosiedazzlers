// functions/api/admin/customers_list.js
//
// Role-aware customer list endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to load customer admin data
// - returns customer_profiles, customer_tiers, and recent booking summary data
// - supports optional active tier filtering
//
// Supported request body:
// {
//   tier_code?: "gold",
//   limit?: 100
// }
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
  cleanText,
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
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);
    const tierCode = cleanTierCode(body.tier_code);
    const limit = normalizeLimit(body.limit);

    const profilesUrl = buildCustomerProfilesUrl(env, { tierCode, limit });
    const tiersUrl =
      `${env.SUPABASE_URL}/rest/v1/customer_tiers` +
      `?select=code,sort_order,label,description,is_active` +
      `&order=sort_order.asc`;

    const [profilesRes, tiersRes] = await Promise.all([
      fetch(profilesUrl, { headers }),
      fetch(tiersUrl, { headers })
    ]);

    if (!profilesRes.ok) {
      const text = await profilesRes.text();
      return withCors(json({ error: `Could not load customer profiles. ${text}` }, 500));
    }

    if (!tiersRes.ok) {
      const text = await tiersRes.text();
      return withCors(json({ error: `Could not load customer tiers. ${text}` }, 500));
    }

    const [profilesRows, tiersRows] = await Promise.all([
      profilesRes.json().catch(() => []),
      tiersRes.json().catch(() => [])
    ]);

    const profiles = Array.isArray(profilesRows) ? profilesRows : [];
    const tiers = Array.isArray(tiersRows) ? tiersRows : [];

    const bookingSummaryMap = await loadBookingSummaryMap(env, headers, profiles);

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
          tier_code: tierCode || null,
          limit
        },
        customer_tiers: tiers,
        customer_profiles: profiles.map((row) => {
          const summary = bookingSummaryMap.get(profileKey(row)) || {
            booking_count: 0,
            total_estimated_value: 0,
            last_booking_at: null
          };

          return {
            id: row.id,
            created_at: row.created_at || null,
            updated_at: row.updated_at || null,
            customer_name: row.customer_name || null,
            customer_email: row.customer_email || null,
            customer_phone: row.customer_phone || null,
            tier_code: row.tier_code || null,
            notes: row.notes || null,
            booking_count: summary.booking_count,
            total_estimated_value: summary.total_estimated_value,
            last_booking_at: summary.last_booking_at
          };
        })
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

/* ---------------- profiles ---------------- */

function buildCustomerProfilesUrl(env, { tierCode, limit }) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/customer_profiles` +
    `?select=id,created_at,updated_at,customer_name,customer_email,customer_phone,tier_code,notes` +
    `&order=updated_at.desc,created_at.desc` +
    `&limit=${encodeURIComponent(String(limit))}`;

  if (tierCode) {
    url += `&tier_code=eq.${encodeURIComponent(tierCode)}`;
  }

  return url;
}

async function loadBookingSummaryMap(env, headers, profiles) {
  const keys = profiles
    .map((row) => ({
      email: String(row.customer_email || "").trim().toLowerCase(),
      phone: String(row.customer_phone || "").trim()
    }))
    .filter((row) => row.email || row.phone);

  if (!keys.length) {
    return new Map();
  }

  const orFilters = [];

  for (const row of keys) {
    if (row.email) {
      orFilters.push(`customer_email.eq.${escapeFilterValue(row.email)}`);
    }
    if (row.phone) {
      orFilters.push(`customer_phone.eq.${escapeFilterValue(row.phone)}`);
    }
  }

  if (!orFilters.length) {
    return new Map();
  }

  const url =
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,customer_email,customer_phone,created_at,total_price,deposit_amount,status` +
    `&or=(${orFilters.join(",")})` +
    `&order=created_at.desc`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    return new Map();
  }

  const rows = await res.json().catch(() => []);
  const map = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const keysToUse = [];
    const email = String(row.customer_email || "").trim().toLowerCase();
    const phone = String(row.customer_phone || "").trim();

    if (email) keysToUse.push(`email:${email}`);
    if (phone) keysToUse.push(`phone:${phone}`);

    for (const key of keysToUse) {
      const current = map.get(key) || {
        booking_count: 0,
        total_estimated_value: 0,
        last_booking_at: null
      };

      current.booking_count += 1;
      current.total_estimated_value += Number(row.total_price || row.deposit_amount || 0);

      const currentLast = current.last_booking_at ? Date.parse(current.last_booking_at) : 0;
      const rowTime = Date.parse(row.created_at || 0);
      if (!current.last_booking_at || rowTime > currentLast) {
        current.last_booking_at = row.created_at || null;
      }

      map.set(key, current);
    }
  }

  const profileMap = new Map();

  for (const profile of profiles) {
    const emailKey = profile.customer_email
      ? `email:${String(profile.customer_email).trim().toLowerCase()}`
      : null;
    const phoneKey = profile.customer_phone
      ? `phone:${String(profile.customer_phone).trim()}`
      : null;

    const emailSummary = emailKey ? map.get(emailKey) : null;
    const phoneSummary = phoneKey ? map.get(phoneKey) : null;

    profileMap.set(profileKey(profile), mergeSummaries(emailSummary, phoneSummary));
  }

  return profileMap;
}

function mergeSummaries(a, b) {
  const first = a || { booking_count: 0, total_estimated_value: 0, last_booking_at: null };
  const second = b || { booking_count: 0, total_estimated_value: 0, last_booking_at: null };

  const lastA = first.last_booking_at ? Date.parse(first.last_booking_at) : 0;
  const lastB = second.last_booking_at ? Date.parse(second.last_booking_at) : 0;

  return {
    booking_count: Math.max(first.booking_count, second.booking_count),
    total_estimated_value: Math.max(first.total_estimated_value, second.total_estimated_value),
    last_booking_at: lastA >= lastB ? first.last_booking_at : second.last_booking_at
  };
}

function profileKey(row) {
  const email = String(row.customer_email || "").trim().toLowerCase();
  const phone = String(row.customer_phone || "").trim();
  return email ? `email:${email}` : `phone:${phone}`;
}

/* ---------------- helpers ---------------- */

function cleanTierCode(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^[a-z0-9_-]{1,50}$/i.test(s) ? s : null;
}

function normalizeLimit(value) {
  const n = toNullableInteger(value);
  if (!n || n < 1) return 100;
  return Math.min(n, 500);
}

function escapeFilterValue(value) {
  return String(value || "").replace(/,/g, "%2C");
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
