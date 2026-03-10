// /functions/api/admin/blocks.js
// REPLACE ENTIRE FILE
//
// POST /api/admin/blocks
//
// Supports 4 actions used by /admin.html:
// - date_block_add
// - date_block_remove
// - slot_block_add
// - slot_block_remove
//
// Request JSON:
// {
//   "admin_password": "...",
//   "action": "date_block_add",
//   "service_date": "2026-03-10",
//   "reason": "Vacation day",   // optional
//   "slot": "AM"               // required for slot_* actions
// }
//
// Env vars required:
// - ADMIN_PASSWORD
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Tables expected:
// - date_blocks(blocked_date text/date, reason text)
// - slot_blocks(blocked_date text/date, slot text, reason text)

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "";
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!ADMIN_PASSWORD) return corsJson({ ok: false, error: "Server missing ADMIN_PASSWORD" }, 500);
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return corsJson({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const body = await readJson(request);

    const pw = String(body.admin_password || "");
    if (!timingSafeEqual(pw, ADMIN_PASSWORD)) return corsJson({ ok: false, error: "Unauthorized" }, 401);

    const action = String(body.action || "").trim();
    const service_date = String(body.service_date || "").trim();
    const reason = body.reason != null ? String(body.reason).trim() : null;
    const slot = body.slot != null ? String(body.slot).trim().toUpperCase() : null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(service_date)) {
      return corsJson({ ok: false, error: "service_date must be YYYY-MM-DD" }, 400);
    }

    const isSlotAction = action.startsWith("slot_");
    if (isSlotAction && !["AM", "PM"].includes(slot || "")) {
      return corsJson({ ok: false, error: "slot must be AM or PM for slot_* actions" }, 400);
    }

    const supa = async (method, path, payload, extraHeaders = {}) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method,
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...extraHeaders,
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const text = await res.text();
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    // ---- Date blocks ----
    if (action === "date_block_add") {
      // Upsert by blocked_date (requires unique constraint to truly upsert, but safe either way)
      const path =
        `/rest/v1/date_blocks?on_conflict=blocked_date`;

      const ins = await supa(
        "POST",
        path,
        { blocked_date: service_date, reason: reason || null },
        { Prefer: "resolution=merge-duplicates,return=representation" }
      );

      if (!ins.ok) {
        return corsJson({ ok: false, error: "Supabase insert failed (date_blocks)", details: ins }, 502);
      }
      return corsJson({ ok: true, action, service_date, row: ins.data?.[0] || null });
    }

    if (action === "date_block_remove") {
      const del = await supa(
        "DELETE",
        `/rest/v1/date_blocks?blocked_date=eq.${encodeURIComponent(service_date)}`,
        null,
        { Prefer: "return=minimal" }
      );

      if (!del.ok) {
        return corsJson({ ok: false, error: "Supabase delete failed (date_blocks)", details: del }, 502);
      }
      return corsJson({ ok: true, action, service_date });
    }

    // ---- Slot blocks ----
    if (action === "slot_block_add") {
      const path =
        `/rest/v1/slot_blocks?on_conflict=blocked_date,slot`;

      const ins = await supa(
        "POST",
        path,
        { blocked_date: service_date, slot, reason: reason || null },
        { Prefer: "resolution=merge-duplicates,return=representation" }
      );

      if (!ins.ok) {
        return corsJson({ ok: false, error: "Supabase insert failed (slot_blocks)", details: ins }, 502);
      }
      return corsJson({ ok: true, action, service_date, slot, row: ins.data?.[0] || null });
    }

    if (action === "slot_block_remove") {
      const del = await supa(
        "DELETE",
        `/rest/v1/slot_blocks?blocked_date=eq.${encodeURIComponent(service_date)}&slot=eq.${encodeURIComponent(slot)}`,
        null,
        { Prefer: "return=minimal" }
      );

      if (!del.ok) {
        return corsJson({ ok: false, error: "Supabase delete failed (slot_blocks)", details: del }, 502);
      }
      return corsJson({ ok: true, action, service_date, slot });
    }

    return corsJson({ ok: false, error: "Unknown action" }, 400);
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- helpers ---------------- */

async function readJson(request) {
  const t = await request.text();
  if (!t) return {};
  try { return JSON.parse(t); } catch { return {}; }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function timingSafeEqual(a, b) {
  a = String(a);
  b = String(b);
  const len = Math.max(a.length, b.length);
  let out = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    const ca = a.charCodeAt(i) || 0;
    const cb = b.charCodeAt(i) || 0;
    out |= (ca ^ cb);
  }
  return out === 0;
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
}

function corsJson(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

function corsResponse(body = "", status = 200) {
  return new Response(body, { status, headers: corsHeaders() });
}
