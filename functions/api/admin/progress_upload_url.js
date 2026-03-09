// functions/api/admin/progress_upload_url.js
// POST /api/admin/progress_upload_url
// Admin-only: returns a Supabase Storage SIGNED UPLOAD URL for a job photo.
//
// WHY: lets you upload photos from the browser/phone while detailing,
// without exposing the Supabase service role key.
//
// Env vars required:
// - ADMIN_PASSWORD
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// Optional:
// - JOB_MEDIA_BUCKET   (default: "job-media")
//
// Request JSON:
// {
//   "admin_password":"...",
//   "booking_id":"uuid",
//   "filename":"before-driver-floor.jpg",
//   "content_type":"image/jpeg"
// }
//
// Response JSON:
// {
//   "ok": true,
//   "bucket": "job-media",
//   "path": "jobs/<booking_id>/2026-03-09T...Z_before-driver-floor.jpg",
//   "media_ref": "sb://job-media/jobs/<booking_id>/...jpg",
//   "upload_url": "https://<SUPABASE_URL>/storage/v1/...."
// }
//
// NOTE: After uploading, you will call /api/admin/progress_post and set:
//   media_url = media_ref   (sb://bucket/path)  (we’ll make the view endpoint sign it next)

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "";
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const BUCKET = env.JOB_MEDIA_BUCKET || "job-media";

    if (!ADMIN_PASSWORD) return corsJson({ ok: false, error: "Server missing ADMIN_PASSWORD" }, 500);
    if (!SUPABASE_URL || !SERVICE_KEY) return corsJson({ ok: false, error: "Server missing Supabase env vars" }, 500);

    const body = await readJson(request);

    const pw = String(body.admin_password || "");
    if (!timingSafeEqual(pw, ADMIN_PASSWORD)) return corsJson({ ok: false, error: "Unauthorized" }, 401);

    const bookingId = String(body.booking_id || "").trim();
    if (!isUuid(bookingId)) return corsJson({ ok: false, error: "booking_id must be a uuid" }, 400);

    const filenameRaw = String(body.filename || "").trim();
    if (!filenameRaw) return corsJson({ ok: false, error: "Missing filename" }, 400);

    const contentType = String(body.content_type || "").trim() || "application/octet-stream";

    const safeName = sanitizeFilename(filenameRaw);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `jobs/${bookingId}/${stamp}_${safeName}`;

    // Supabase Storage signed upload URL endpoint
    // POST {SUPABASE_URL}/storage/v1/object/upload/sign/{bucket}/{path}
    const storageBase = `${SUPABASE_URL}/storage/v1`;
    const signUrl =
      `${storageBase}/object/upload/sign/${encodeURIComponent(BUCKET)}/${encodePath(path)}`;

    const res = await fetch(signUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 60 * 60 }), // 1 hour
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      return corsJson({ ok: false, error: "Supabase Storage sign failed", details: { status: res.status, data } }, 502);
    }

    // Supabase returns a relative URL in data.url (e.g. "/object/upload/sign/...?...").
    // Turn it into a full upload URL.
    const upload_url = data?.url ? `${storageBase}${data.url}` : null;
    if (!upload_url) {
      return corsJson({ ok: false, error: "Signed upload URL missing from response", details: data }, 502);
    }

    return corsJson({
      ok: true,
      bucket: BUCKET,
      path,
      content_type: contentType,
      media_ref: `sb://${BUCKET}/${path}`,
      upload_url,
      upload_headers: {
        "content-type": contentType,
        "x-upsert": "true",
      },
    });
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

function sanitizeFilename(name) {
  // keep letters, numbers, dash, underscore, dot
  return name
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 120) || "upload.bin";
}

// encode path segments but keep slashes
function encodePath(path) {
  return encodeURIComponent(path).replace(/%2F/g, "/");
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
