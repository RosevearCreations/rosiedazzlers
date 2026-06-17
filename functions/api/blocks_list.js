// functions/api/admin/blocks_list.js
//
// Compatibility schedule blocks list endpoint built on the current legacy
// `blocked_date` / `slot` schema while returning normalized fields as well.

import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, cleanText } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
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

    if (!access.ok) return withCors(access.response);

    const startDate = cleanDate(body.start_date);
    const endDate = cleanDate(body.end_date);

    if (body.start_date && !startDate) return withCors(json({ error: "Invalid start_date." }, 400));
    if (body.end_date && !endDate) return withCors(json({ error: "Invalid end_date." }, 400));

    const headers = serviceHeaders(env);
    const [dateBlocksRes, slotBlocksRes] = await Promise.all([
      fetch(buildDateBlocksUrl(env, { startDate, endDate }), { headers }),
      fetch(buildSlotBlocksUrl(env, { startDate, endDate }), { headers })
    ]);

    if (!dateBlocksRes.ok) return withCors(json({ error: `Could not load date blocks. ${await dateBlocksRes.text()}` }, 500));
    if (!slotBlocksRes.ok) return withCors(json({ error: `Could not load slot blocks. ${await slotBlocksRes.text()}` }, 500));

    const [dateBlocksRaw, slotBlocksRaw] = await Promise.all([
      dateBlocksRes.json().catch(() => []),
      slotBlocksRes.json().catch(() => [])
    ]);

    const dateBlocks = Array.isArray(dateBlocksRaw) ? dateBlocksRaw.map((row) => ({
      ...row,
      block_date: row.blocked_date || null,
      is_closed: true,
      updated_at: row.created_at || null
    })) : [];

    const slotBlocks = Array.isArray(slotBlocksRaw) ? slotBlocksRaw.map((row) => ({
      ...row,
      block_date: row.blocked_date || null,
      slot_code: row.slot || null,
      is_blocked: true,
      updated_at: row.created_at || null
    })) : [];

    return withCors(json({
      ok: true,
      actor: {
        id: access.actor.id || null,
        full_name: access.actor.full_name || null,
        email: access.actor.email || null,
        role_code: access.actor.role_code || null
      },
      filters: { start_date: startDate, end_date: endDate },
      date_blocks: dateBlocks,
      slot_blocks: slotBlocks
    }));
  } catch (err) {
    return withCors(json({ error: err && err.message ? err.message : "Unexpected server error." }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function cleanDate(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function buildDateBlocksUrl(env, { startDate, endDate }) {
  let url = `${env.SUPABASE_URL}/rest/v1/date_blocks?select=id,blocked_date,reason,created_at&order=blocked_date.asc,created_at.desc`;
  if (startDate) url += `&blocked_date=gte.${encodeURIComponent(startDate)}`;
  if (endDate) url += `&blocked_date=lte.${encodeURIComponent(endDate)}`;
  return url;
}

function buildSlotBlocksUrl(env, { startDate, endDate }) {
  let url = `${env.SUPABASE_URL}/rest/v1/slot_blocks?select=id,blocked_date,slot,reason,created_at&order=blocked_date.asc,slot.asc,created_at.desc`;
  if (startDate) url += `&blocked_date=gte.${encodeURIComponent(startDate)}`;
  if (endDate) url += `&blocked_date=lte.${encodeURIComponent(endDate)}`;
  return url;
}
