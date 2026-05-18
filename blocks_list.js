// functions/api/admin/blocks_list.js
//
// Role-aware schedule blocks list endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_blocks capability
// - returns date_blocks and slot_blocks for admin schedule controls
// - supports optional date window filtering
//
// Supported request body:
// {
//   start_date?: "2026-03-01",
//   end_date?: "2026-03-31"
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
      capability: "manage_blocks",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const startDate = cleanDate(body.start_date);
    const endDate = cleanDate(body.end_date);

    if (body.start_date && !startDate) {
      return withCors(json({ error: "Invalid start_date." }, 400));
    }

    if (body.end_date && !endDate) {
      return withCors(json({ error: "Invalid end_date." }, 400));
    }

    const headers = serviceHeaders(env);

    const dateBlocksUrl = buildDateBlocksUrl(env, { startDate, endDate });
    const slotBlocksUrl = buildSlotBlocksUrl(env, { startDate, endDate });

    const [dateBlocksRes, slotBlocksRes] = await Promise.all([
      fetch(dateBlocksUrl, { headers }),
      fetch(slotBlocksUrl, { headers })
    ]);

    if (!dateBlocksRes.ok) {
      const text = await dateBlocksRes.text();
      return withCors(json({ error: `Could not load date blocks. ${text}` }, 500));
    }

    if (!slotBlocksRes.ok) {
      const text = await slotBlocksRes.text();
      return withCors(json({ error: `Could not load slot blocks. ${text}` }, 500));
    }

    const [dateBlocks, slotBlocks] = await Promise.all([
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
          start_date: startDate,
          end_date: endDate
        },
        date_blocks: Array.isArray(dateBlocks) ? dateBlocks : [],
        slot_blocks: Array.isArray(slotBlocks) ? slotBlocks : []
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

function cleanDate(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function buildDateBlocksUrl(env, { startDate, endDate }) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/date_blocks` +
    `?select=id,block_date,is_closed,reason,created_at,updated_at` +
    `&order=block_date.asc,created_at.desc`;

  if (startDate) {
    url += `&block_date=gte.${encodeURIComponent(startDate)}`;
  }

  if (endDate) {
    url += `&block_date=lte.${encodeURIComponent(endDate)}`;
  }

  return url;
}

function buildSlotBlocksUrl(env, { startDate, endDate }) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/slot_blocks` +
    `?select=id,block_date,slot_code,is_blocked,reason,created_at,updated_at` +
    `&order=block_date.asc,slot_code.asc,created_at.desc`;

  if (startDate) {
    url += `&block_date=gte.${encodeURIComponent(startDate)}`;
  }

  if (endDate) {
    url += `&block_date=lte.${encodeURIComponent(endDate)}`;
  }

  return url;
}
