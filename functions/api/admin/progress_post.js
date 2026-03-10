// /functions/api/admin/progress_post.js
// CREATE THIS FILE (or REPLACE ENTIRE FILE)
//
// POST /api/admin/progress_post
// Admin-only: posts a progress note and/or media item to a booking.
// Writes into:
//   - job_updates (notes)
//   - job_media   (photos/links)
//
// Request JSON:
// {
//   "admin_password": "...",
//   "booking_id": "uuid",
//   "created_by": "Jack",               // optional
//   "visibility": "customer"|"internal",// default "customer"
//   "kind": "before"|"during"|"after"|"other", // default "during"
//   "note": "optional note",
//   "media_url": "optional URL or sb://bucket/path",
//   "caption": "optional caption"
// }
//
// Env vars required:
// - ADMIN_PASSWORD
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY

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

    const booking_id = String(body.booking_id || "").trim();
    if (!isUuid(booking_id)) return corsJson({ ok: false, error: "booking_id must be a uuid" }, 400);

    const created_by = body.created_by != null ? String(body.created_by).trim() : null;

    const visibility = String(body.visibility || "customer").toLowerCase();
    if (!["customer", "internal"].includes(visibility)) {
      return corsJson({ ok: false, error: "visibility must be customer or internal" }, 400);
    }

    const kind = String(body.kind || "during").toLowerCase();
    if (!["before", "during", "after", "other"].includes(kind)) {
      return corsJson({ ok: false, error: "kind must be before/during/after/other" }, 400);
    }

    const note = body.note != null ? String(body.note).trim() : null;
    const media_url = body.media_url != null ? String(body.media_url).trim() : null;
    const caption = body.caption != null ? String(body.caption).trim() : null;

    if (!note && !media_url) {
      return corsJson({ ok: false, error: "Provide note and/or media_url" }, 400);
    }

    const supa = async (method, path, payload, prefer = "return=representation") => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method,
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: prefer,
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    const now = new Date().toISOString();

    let updateRow = null;
    let mediaRow = null;

    // Insert note -> job_updates
    if (note) {
      const insU = await supa("POST", "/rest/v1/job_updates", {
        booking_id,
        visibility,
        created_by: created_by || null,
        note,
        created_at: now,
      });
      if (!insU.ok) return corsJson({ ok: false, error: "Supabase insert failed (job_updates)", details: insU }, 502);
      updateRow = Array.isArray(insU.data) ? insU.data[0] : insU.data;
    }

    // Insert media -> job_media
    if (media_url) {
      const insM = await supa("POST", "/rest/v1/job_media", {
        booking_id,
        visibility,
        created_by: created_by || null,
        kind,
        caption: caption || null,
        media_url,
        created_at: now,
      });
      if (!insM.ok) return corsJson({ ok: false, error: "Supabase insert failed (job_media)", details: insM }, 502);
      mediaRow = Array.isArray(insM.data) ? insM.data[0] : insM.data;
    }

    return corsJson({ ok: true, update: updateRow, media: mediaRow });
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

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ""));
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
