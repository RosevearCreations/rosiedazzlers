// functions/api/admin/blocks_save.js
//
// Role-aware schedule blocks save endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_blocks capability
// - creates or updates date_blocks rows
// - creates or updates slot_blocks rows
// - supports clearing blocks by setting flags false
//
// Supported request body examples:
//
// Date block:
// {
//   "mode": "date",
//   "block_date": "2026-03-20",
//   "is_closed": true,
//   "reason": "Shop closed"
// }
//
// Slot block:
// {
//   "mode": "slot",
//   "block_date": "2026-03-20",
//   "slot_code": "morning",
//   "is_blocked": true,
//   "reason": "Already booked externally"
// }
//
// Clear date block:
// {
//   "mode": "date",
//   "block_date": "2026-03-20",
//   "is_closed": false
// }
//
// Clear slot block:
// {
//   "mode": "slot",
//   "block_date": "2026-03-20",
//   "slot_code": "morning",
//   "is_blocked": false
// }

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  cleanText,
  toBoolean
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

    const mode = String(body.mode || "").trim().toLowerCase();

    if (mode === "date") {
      return withCors(await saveDateBlock({ env, body }));
    }

    if (mode === "slot") {
      return withCors(await saveSlotBlock({ env, body }));
    }

    return withCors(json({ error: "Invalid mode. Use 'date' or 'slot'." }, 400));
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

/* ---------------- date blocks ---------------- */

async function saveDateBlock({ env, body }) {
  const headers = serviceHeaders(env);
  const block_date = cleanDate(body.block_date);
  const is_closed = toBoolean(body.is_closed);
  const reason = cleanText(body.reason);

  if (!block_date) {
    return json({ error: "Valid block_date is required." }, 400);
  }

  const existing = await findDateBlock(env, headers, block_date);
  if (!existing.ok) return existing.response;

  if (existing.row) {
    const patch = {
      is_closed,
      reason,
      updated_at: new Date().toISOString()
    };

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/date_blocks?id=eq.${encodeURIComponent(existing.row.id)}`,
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
      return json({ error: `Could not update date block. ${text}` }, 500);
    }

    const rows = await res.json().catch(() => []);
    return json({
      ok: true,
      mode: "date",
      action: is_closed ? "updated" : "cleared",
      row: Array.isArray(rows) ? rows[0] || null : null
    });
  }

  const createPayload = {
    block_date,
    is_closed,
    reason
  };

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "return=representation"
    },
    body: JSON.stringify([createPayload])
  });

  if (!res.ok) {
    const text = await res.text();
    return json({ error: `Could not create date block. ${text}` }, 500);
  }

  const rows = await res.json().catch(() => []);
  return json({
    ok: true,
    mode: "date",
    action: is_closed ? "created" : "created_unblocked",
    row: Array.isArray(rows) ? rows[0] || null : null
  });
}

/* ---------------- slot blocks ---------------- */

async function saveSlotBlock({ env, body }) {
  const headers = serviceHeaders(env);
  const block_date = cleanDate(body.block_date);
  const slot_code = cleanSlotCode(body.slot_code);
  const is_blocked = toBoolean(body.is_blocked);
  const reason = cleanText(body.reason);

  if (!block_date) {
    return json({ error: "Valid block_date is required." }, 400);
  }

  if (!slot_code) {
    return json({ error: "Valid slot_code is required." }, 400);
  }

  const existing = await findSlotBlock(env, headers, block_date, slot_code);
  if (!existing.ok) return existing.response;

  if (existing.row) {
    const patch = {
      is_blocked,
      reason,
      updated_at: new Date().toISOString()
    };

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/slot_blocks?id=eq.${encodeURIComponent(existing.row.id)}`,
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
      return json({ error: `Could not update slot block. ${text}` }, 500);
    }

    const rows = await res.json().catch(() => []);
    return json({
      ok: true,
      mode: "slot",
      action: is_blocked ? "updated" : "cleared",
      row: Array.isArray(rows) ? rows[0] || null : null
    });
  }

  const createPayload = {
    block_date,
    slot_code,
    is_blocked,
    reason
  };

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/slot_blocks`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "return=representation"
    },
    body: JSON.stringify([createPayload])
  });

  if (!res.ok) {
    const text = await res.text();
    return json({ error: `Could not create slot block. ${text}` }, 500);
  }

  const rows = await res.json().catch(() => []);
  return json({
    ok: true,
    mode: "slot",
    action: is_blocked ? "created" : "created_unblocked",
    row: Array.isArray(rows) ? rows[0] || null : null
  });
}

/* ---------------- lookup helpers ---------------- */

async function findDateBlock(env, headers, block_date) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/date_blocks` +
      `?select=id,block_date,is_closed,reason` +
      `&block_date=eq.${encodeURIComponent(block_date)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify date block. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  return {
    ok: true,
    row: Array.isArray(rows) ? rows[0] || null : null
  };
}

async function findSlotBlock(env, headers, block_date, slot_code) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/slot_blocks` +
      `?select=id,block_date,slot_code,is_blocked,reason` +
      `&block_date=eq.${encodeURIComponent(block_date)}` +
      `&slot_code=eq.${encodeURIComponent(slot_code)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify slot block. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  return {
    ok: true,
    row: Array.isArray(rows) ? rows[0] || null : null
  };
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

function cleanDate(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function cleanSlotCode(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^[a-z0-9_-]{1,50}$/i.test(s) ? s : null;
}
