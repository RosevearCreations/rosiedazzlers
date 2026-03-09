// functions/api/admin/progress_post.js
// REPLACE ENTIRE FILE with this version.
//
// POST /api/admin/progress_post
// Admin-only: post a progress update and/or a photo reference to a booking.
//
// v2 CHANGE:
// - media_url can now be:
//    1) https://... (regular URL)
//    2) sb://bucket/path  (Supabase Storage reference)
// This matches /api/progress/view (which converts sb://... into signed URLs for customers).

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "";
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!ADMIN_PASSWORD) return corsJson({ ok: false, error: "Server missing ADMIN_PASSWORD" }, 500);
    if (!SUPABASE_URL || !SERVICE_KEY) return corsJson({ ok: false, error: "Server missing Supabase env vars" }, 500);

    const body = await readJson(request);

    const pw = String(body.admin_password || "");
    if (!timingSafeEqual(pw, ADMIN_PASSWORD)) return corsJson({ ok: false, error: "Unauthorized" }, 401);

    const bookingId = String(body.booking_id || "").trim();
    if (!isUuid(bookingId)) return corsJson({ ok: false, error: "booking_id must be a uuid" }, 400);

    const createdBy = body.created_by != null ? String(body.created_by).trim() : null;

    const visibility = (body.visibility ? String(body.visibility).toLowerCase() : "customer");
    if (!["customer", "internal"].includes(visibility)) {
      return corsJson({ ok: false, error: "visibility must be customer or internal" }, 400);
    }

    const note = body.note != null ? String(body.note).trim() : "";
    const mediaUrl = body.media_url != null ? String(body.media_url).trim() : "";
    const caption = body.caption != null ? String(body.caption).trim() : null;

    const kind = body.kind != null ? String(body.kind).toLowerCase() : "during";
    if (!["before", "during", "after", "other"].includes(kind)) {
      return corsJson({ ok: false, error: "kind must be before,during,after,other" }, 400);
    }

    if (!note && !mediaUrl) {
      return corsJson({ ok: false, error: "Provide note and/or media_url" }, 400);
    }

    // Allow sb://bucket/path OR https://...
    if (mediaUrl) {
      const ok =
        mediaUrl.startsWith("sb://") ||
        looksLikeUrl(mediaUrl);

      if (!ok) {
        return corsJson({
          ok: false,
          error: "media_url must be https://... or sb://bucket/path",
        }, 400);
      }
    }

    const supa = async (method, path, payload) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method,
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const text = await res.text();
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    const results = {};

    if (note) {
      const ins = await supa("POST", "/rest/v1/job_updates", {
        booking_id: bookingId,
        visibility,
        created_by: createdBy,
        note,
      });
      if (!ins.ok) return corsJson({ ok: false, error: "Insert failed (job_updates)", details: ins }, 502);
      results.update = ins.data?.[0] || null;
    }

    if (mediaUrl) {
      const ins = await supa("POST", "/rest/v1/job_media", {
        booking_id: bookingId,
        visibility,
        created_by: createdBy,
        kind,
        caption,
        media_url: mediaUrl,
      });
      if (!ins.ok) return corsJson({ ok: false, error: "Insert failed (job_media)", details: ins }, 502);
      results.media = ins.data?.[0] || null;
    }

    return corsJson({ ok: true, results });
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* helpers */

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

function looksLikeUrl(u) {
  try { new URL(u); return true; } catch { return false; }
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
