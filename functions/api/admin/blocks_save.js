// functions/api/admin/blocks_save.js
// Role-aware schedule blocks save endpoint.

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  cleanText,
  toBoolean
} from "../_lib/staff-auth.js";

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
      allowLegacyAdminFallback: false
    });
    if (!access.ok) return withCors(access.response);

    const mode = String(body.mode || "").trim().toLowerCase();
    if (mode === "date") return withCors(await saveDateBlock({ env, body }));
    if (mode === "slot") return withCors(await saveSlotBlock({ env, body }));
    return withCors(json({ error: "Invalid mode. Use 'date' or 'slot'." }, 400));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

async function saveDateBlock({ env, body }) {
  const headers = serviceHeaders(env);
  const block_date = cleanDate(body.block_date);
  const is_closed = toBoolean(body.is_closed);
  const reason = cleanText(body.reason);
  if (!block_date) return json({ error: "Valid block_date is required." }, 400);

  const existing = await findDateBlock(env, headers, block_date);
  if (!existing.ok) return existing.response;

  if (!is_closed) {
    if (!existing.row) return json({ ok: true, mode: "date", action: "already_clear", row: null });
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks?id=eq.${encodeURIComponent(existing.row.id)}`, {
      method: "DELETE",
      headers: { ...headers, Prefer: "return=representation" }
    });
    if (!res.ok) return json({ error: `Could not clear date block. ${await res.text()}` }, 500);
    const rows = await res.json().catch(() => []);
    return json({ ok: true, mode: "date", action: "cleared", row: Array.isArray(rows) ? rows[0] || existing.row : existing.row });
  }

  if (existing.row) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks?id=eq.${encodeURIComponent(existing.row.id)}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) return json({ error: `Could not update date block. ${await res.text()}` }, 500);
    const rows = await res.json().catch(() => []);
    return json({ ok: true, mode: "date", action: "updated", row: Array.isArray(rows) ? rows[0] || null : null });
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify([{ blocked_date: block_date, reason }])
  });
  if (!res.ok) return json({ error: `Could not create date block. ${await res.text()}` }, 500);
  const rows = await res.json().catch(() => []);
  return json({ ok: true, mode: "date", action: "created", row: Array.isArray(rows) ? rows[0] || null : null });
}

async function saveSlotBlock({ env, body }) {
  const headers = serviceHeaders(env);
  const block_date = cleanDate(body.block_date);
  const slot_code = cleanSlotCode(body.slot_code);
  const is_blocked = toBoolean(body.is_blocked);
  const reason = cleanText(body.reason);
  if (!block_date) return json({ error: "Valid block_date is required." }, 400);
  if (!slot_code) return json({ error: "Valid slot_code is required." }, 400);

  const existing = await findSlotBlock(env, headers, block_date, slot_code);
  if (!existing.ok) return existing.response;

  if (!is_blocked) {
    if (!existing.row) return json({ ok: true, mode: "slot", action: "already_clear", row: null });
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/slot_blocks?id=eq.${encodeURIComponent(existing.row.id)}`, {
      method: "DELETE",
      headers: { ...headers, Prefer: "return=representation" }
    });
    if (!res.ok) return json({ error: `Could not clear slot block. ${await res.text()}` }, 500);
    const rows = await res.json().catch(() => []);
    return json({ ok: true, mode: "slot", action: "cleared", row: Array.isArray(rows) ? rows[0] || existing.row : existing.row });
  }

  if (existing.row) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/slot_blocks?id=eq.${encodeURIComponent(existing.row.id)}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) return json({ error: `Could not update slot block. ${await res.text()}` }, 500);
    const rows = await res.json().catch(() => []);
    return json({ ok: true, mode: "slot", action: "updated", row: Array.isArray(rows) ? rows[0] || null : null });
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/slot_blocks`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify([{ blocked_date: block_date, slot: slot_code, reason }])
  });
  if (!res.ok) return json({ error: `Could not create slot block. ${await res.text()}` }, 500);
  const rows = await res.json().catch(() => []);
  return json({ ok: true, mode: "slot", action: "created", row: Array.isArray(rows) ? rows[0] || null : null });
}

async function findDateBlock(env, headers, block_date) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks?select=id,blocked_date,reason,created_at&blocked_date=eq.${encodeURIComponent(block_date)}&limit=1`, { headers });
  if (!res.ok) return { ok: false, response: json({ error: `Could not verify date block. ${await res.text()}` }, 500) };
  const rows = await res.json().catch(() => []);
  return { ok: true, row: Array.isArray(rows) ? rows[0] || null : null };
}

async function findSlotBlock(env, headers, block_date, slot_code) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/slot_blocks?select=id,blocked_date,slot,reason,created_at&blocked_date=eq.${encodeURIComponent(block_date)}&slot=eq.${encodeURIComponent(slot_code)}&limit=1`, { headers });
  if (!res.ok) return { ok: false, response: json({ error: `Could not verify slot block. ${await res.text()}` }, 500) };
  const rows = await res.json().catch(() => []);
  return { ok: true, row: Array.isArray(rows) ? rows[0] || null : null };
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

function cleanSlotCode(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^(AM|PM|FULL)$/i.test(s) ? s.toUpperCase() : null;
}
