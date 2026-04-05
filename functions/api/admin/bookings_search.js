// functions/api/admin/bookings_search.js
//
// Role-aware filtered booking search endpoint.
//
// What this file does:
// - prefers signed-in staff session access
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to search all bookings
// - allows senior/detailer staff to search only their assigned bookings
// - supports common admin-booking filters without pulling every booking
//
// Supported request body:
// {
//   q?: "smith",
//   service_date?: "2026-03-21",
//   from_date?: "2026-03-01",
//   to_date?: "2026-03-31",
//   status?: "confirmed",
//   job_status?: "scheduled",
//   assigned_staff_user_id?: "uuid",
//   assigned_staff_email?: "detailer@example.com",
//   assigned_to?: "Jane Detailer",
//   limit?: 50
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
  isUuid,
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
      capability: "view_live_ops",
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const filters = normalizeFilters(body);
    if (!filters.ok) {
      return withCors(json({ error: filters.error }, 400));
    }

    const actor = access.actor;
    const headers = serviceHeaders(env);
    const url = buildSearchUrl(env, actor, filters.value);

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not search bookings. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const bookings = Array.isArray(rows) ? rows : [];

    return withCors(
      json({
        ok: true,
        actor: {
          id: actor.id || null,
          full_name: actor.full_name || null,
          email: actor.email || null,
          role_code: actor.role_code || null
        },
        scope: actor.is_admin || actor.can_manage_bookings ? "full" : "assigned",
        filters: filters.value,
        bookings
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

/* ---------------- filter normalization ---------------- */

function normalizeFilters(body) {
  const q = cleanText(body.q);
  const service_date = cleanDate(body.service_date);
  const from_date = cleanDate(body.from_date);
  const to_date = cleanDate(body.to_date);
  const status = cleanCode(body.status);
  const job_status = cleanCode(body.job_status);
  const assigned_staff_user_id = cleanAssignedId(body.assigned_staff_user_id);
  const assigned_staff_email = cleanEmail(body.assigned_staff_email);
  const assigned_to = cleanText(body.assigned_to);
  const limit = normalizeLimit(body.limit);

  if (body.service_date && !service_date) {
    return { ok: false, error: "Invalid service_date." };
  }

  if (body.from_date && !from_date) {
    return { ok: false, error: "Invalid from_date." };
  }

  if (body.to_date && !to_date) {
    return { ok: false, error: "Invalid to_date." };
  }

  if (from_date && to_date && from_date > to_date) {
    return { ok: false, error: "from_date cannot be later than to_date." };
  }

  if (body.assigned_staff_user_id && !assigned_staff_user_id) {
    return { ok: false, error: "Invalid assigned_staff_user_id." };
  }

  if (body.assigned_staff_email && !assigned_staff_email) {
    return { ok: false, error: "Invalid assigned_staff_email." };
  }

  return {
    ok: true,
    value: {
      q: q || null,
      service_date: service_date || null,
      from_date: from_date || null,
      to_date: to_date || null,
      status: status || null,
      job_status: job_status || null,
      assigned_staff_user_id: assigned_staff_user_id || null,
      assigned_staff_email: assigned_staff_email || null,
      assigned_to: assigned_to || null,
      limit
    }
  };
}

/* ---------------- query builder ---------------- */

function buildSearchUrl(env, actor, filters) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,created_at,service_date,start_slot,status,job_status,customer_name,customer_email,customer_phone,package_code,vehicle_size,total_price,deposit_amount,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,progress_enabled,progress_token,notes` +
    `&order=service_date.desc,start_slot.asc,created_at.desc` +
    `&limit=${encodeURIComponent(String(filters.limit))}`;

  if (filters.service_date) {
    url += `&service_date=eq.${encodeURIComponent(filters.service_date)}`;
  } else {
    if (filters.from_date) {
      url += `&service_date=gte.${encodeURIComponent(filters.from_date)}`;
    }
    if (filters.to_date) {
      url += `&service_date=lte.${encodeURIComponent(filters.to_date)}`;
    }
  }

  if (filters.status) {
    url += `&status=eq.${encodeURIComponent(filters.status)}`;
  }

  if (filters.job_status) {
    url += `&job_status=eq.${encodeURIComponent(filters.job_status)}`;
  }

  if (filters.assigned_staff_user_id) {
    url += `&assigned_staff_user_id=eq.${encodeURIComponent(filters.assigned_staff_user_id)}`;
  }

  if (filters.assigned_staff_email) {
    url += `&assigned_staff_email=eq.${encodeURIComponent(filters.assigned_staff_email)}`;
  }

  if (filters.assigned_to) {
    url += `&assigned_to=ilike.${encodeURIComponent(`*${filters.assigned_to}*`)}`;
  }

  const orParts = [];

  if (filters.q) {
    const like = encodeURIComponent(`*${filters.q}*`);
    orParts.push(`customer_name.ilike.${like}`);
    orParts.push(`customer_email.ilike.${like}`);
    orParts.push(`customer_phone.ilike.${like}`);
    orParts.push(`package_code.ilike.${like}`);
    orParts.push(`vehicle_size.ilike.${like}`);
    orParts.push(`assigned_to.ilike.${like}`);
    orParts.push(`assigned_staff_name.ilike.${like}`);
    orParts.push(`notes.ilike.${like}`);
  }

  if (!(actor.is_admin || actor.can_manage_bookings)) {
    if (actor.id) {
      orParts.push(`assigned_staff_user_id.eq.${escapeFilterValue(actor.id)}`);
    }
    if (actor.email) {
      orParts.push(`assigned_staff_email.eq.${escapeFilterValue(actor.email)}`);
    }
    if (actor.full_name) {
      const likeName = escapeLikeValue(actor.full_name);
      orParts.push(`assigned_staff_name.ilike.${likeName}`);
      orParts.push(`assigned_to.ilike.${likeName}`);
    }
  }

  if (orParts.length) {
    url += `&or=(${orParts.join(",")})`;
  } else if (!(actor.is_admin || actor.can_manage_bookings)) {
    url += `&id=eq.__no_match__`;
  }

  return url;
}

/* ---------------- cleaners ---------------- */

function cleanDate(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function cleanCode(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^[a-z0-9_-]{1,100}$/i.test(s) ? s.toLowerCase() : null;
}

function cleanAssignedId(value) {
  const s = cleanText(value);
  if (!s) return null;
  return isUuid(s) ? s : null;
}

function cleanEmail(value) {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function normalizeLimit(value) {
  const n = toNullableInteger(value);
  if (!n || n < 1) return 50;
  return Math.min(n, 250);
}

function escapeFilterValue(value) {
  return String(value || "").replace(/,/g, "%2C");
}

function escapeLikeValue(value) {
  return `*${String(value || "").trim().replace(/,/g, " ")}*`;
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
