// functions/api/admin/blocks_save.js
//
// Compatibility schedule block save endpoint that writes against the current
// legacy `blocked_date` / `slot` schema while accepting both old and new keys.

import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, cleanText } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_blocks", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const mode = cleanText(body.mode) || (body.slot || body.slot_code ? 'slot' : 'date');
    const headers = { ...serviceHeaders(env), Accept: 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' };

    if (mode === 'slot') {
      const blocked_date = cleanDate(body.blocked_date || body.block_date);
      const slot = cleanText(body.slot || body.slot_code || '').toUpperCase();
      const reason = cleanNullableText(body.reason);
      if (!blocked_date) return withCors(json({ error: 'Valid blocked_date is required.' }, 400));
      if (!['AM', 'PM'].includes(slot)) return withCors(json({ error: 'slot must be AM or PM.' }, 400));

      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/slot_blocks?on_conflict=blocked_date,slot`, {
        method: 'POST',
        headers,
        body: JSON.stringify([{ blocked_date, slot, reason }])
      });
      const payload = await res.json().catch(() => []);
      if (!res.ok) return withCors(json({ error: 'Could not save slot block.', details: payload }, 500));
      const row = Array.isArray(payload) ? (payload[0] || null) : payload;
      return withCors(json({ ok: true, row: normalizeSlotRow(row), actor: actorShape(access.actor) }));
    }

    const blocked_date = cleanDate(body.blocked_date || body.block_date);
    const reason = cleanNullableText(body.reason);
    if (!blocked_date) return withCors(json({ error: 'Valid blocked_date is required.' }, 400));

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks?on_conflict=blocked_date`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ blocked_date, reason }])
    });
    const payload = await res.json().catch(() => []);
    if (!res.ok) return withCors(json({ error: 'Could not save date block.', details: payload }, 500));
    const row = Array.isArray(payload) ? (payload[0] || null) : payload;
    return withCors(json({ ok: true, row: normalizeDateRow(row), actor: actorShape(access.actor) }));
  } catch (err) {
    return withCors(json({ error: err && err.message ? err.message : 'Unexpected server error.' }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

function normalizeDateRow(row) {
  return row ? { ...row, block_date: row.blocked_date || null, is_closed: true, updated_at: row.created_at || null } : null;
}

function normalizeSlotRow(row) {
  return row ? { ...row, block_date: row.blocked_date || null, slot_code: row.slot || null, is_blocked: true, updated_at: row.created_at || null } : null;
}

function actorShape(actor) {
  return { id: actor?.id || null, full_name: actor?.full_name || null, email: actor?.email || null, role_code: actor?.role_code || null };
}

function cleanDate(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function cleanNullableText(value) {
  const s = cleanText(value);
  return s || null;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password, x-staff-email, x-staff-user-id',
    'Cache-Control': 'no-store'
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
