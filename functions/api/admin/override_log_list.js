// functions/api/admin/override_log_list.js
//
// Role-aware staff override log list endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_staff capability
// - returns staff override log rows
// - supports optional filtering by booking_id and source_table
//
// Supported request body:
// {
//   booking_id?: "uuid",
//   source_table?: "jobsite_intake",
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
  isUuid,
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
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const booking_id = cleanBookingId(body.booking_id);
    const source_table = cleanSourceTable(body.source_table);
    const limit = normalizeLimit(body.limit);

    if (body.booking_id && !booking_id) {
      return withCors(json({ error: "Invalid booking_id." }, 400));
    }

    if (body.source_table && !source_table) {
      return withCors(json({ error: "Invalid source_table." }, 400));
    }

    const headers = serviceHeaders(env);
    const url = buildOverrideLogUrl(env, { booking_id, source_table, limit });

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not load override log. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const logRows = Array.isArray(rows) ? rows : [];

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
          booking_id: booking_id || null,
          source_table: source_table || null,
          limit
        },
        override_log: logRows.map((row) => ({
          id: row.id,
          booking_id: row.booking_id || null,
          source_table: row.source_table || null,
          source_row_id: row.source_row_id || null,
          overridden_by_staff_user_id: row.overridden_by_staff_user_id || null,
          previous_staff_user_id: row.previous_staff_user_id || null,
          override_reason: row.override_reason || null,
          change_summary: row.change_summary || null,
          created_at: row.created_at || null,
          overridden_by_staff: row.overridden_by_staff || null,
          previous_staff: row.previous_staff || null
        }))
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

function buildOverrideLogUrl(env, { booking_id, source_table, limit }) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/staff_override_log` +
    `?select=id,booking_id,source_table,source_row_id,overridden_by_staff_user_id,previous_staff_user_id,override_reason,change_summary,created_at,` +
    `overridden_by_staff:staff_users!staff_override_log_overridden_by_staff_user_id_fkey(id,full_name,email,role_code),` +
    `previous_staff:staff_users!staff_override_log_previous_staff_user_id_fkey(id,full_name,email,role_code)` +
    `&order=created_at.desc` +
    `&limit=${encodeURIComponent(String(limit))}`;

  if (booking_id) {
    url += `&booking_id=eq.${encodeURIComponent(booking_id)}`;
  }

  if (source_table) {
    url += `&source_table=eq.${encodeURIComponent(source_table)}`;
  }

  return url;
}

function cleanBookingId(value) {
  const s = String(value || "").trim();
  if (!s) return null;
  return isUuid(s) ? s : null;
}

function cleanSourceTable(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^[a-z0-9_]{1,100}$/i.test(s) ? s : null;
}

function normalizeLimit(value) {
  const n = toNullableInteger(value);
  if (!n || n < 1) return 100;
  return Math.min(n, 500);
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
