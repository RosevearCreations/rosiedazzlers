// /functions/api/admin/progress_upload_url.js
// CREATE THIS FILE (or REPLACE if you already have one)
//
// POST /api/admin/progress_upload_url
// Admin-only: returns a signed upload URL for Supabase Storage (private bucket).
//
// Request JSON:
// {
//   "admin_password": "...",
//   "booking_id": "uuid",
//   "filename": "photo.jpg",
//   "content_type": "image/jpeg"   // optional
// }
//
// Response:
// {
//   "ok": true,
//   "bucket": "job-media",
//   "path": "jobs/<booking_id>/<timestamp>_<safe_filename>",
//   "media_ref": "sb://job-media/jobs/<booking_id>/<...>",
//   "upload_url": "https://<supabase>/storage/v1/object/upload/sign/...."
// }
//
// ENV VARS required:
// - ADMIN_PASSWORD
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// Optional (defaults shown below):
// - JOB_MEDIA_BUCKET   (default: "job-media")

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
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return corsJson({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const body = await readJson(request);

    const pw = String(body.admin_password || "");
    if (!timingSafeEqual(pw, ADMIN_PASSWORD)) return corsJson({ ok: false, error: "Unauthorized" }, 401);

    const bookingId = String(body.booking_id || "").trim();
    if (!isUuid(bookingId)) return corsJson({ ok: false, error: "booking_id must be a uuid" }, 400);

    const filename = String(body.filename || "").trim();
    if (!filename) return corsJson({ ok: false, error: "filename required" }, 400);

    const contentType = String(body.content_type || "image/jpeg").trim() || "image/jpeg";

    // Build storage path
    const safeName = sanitizeFilename(filename);
    const stamp = new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
    const path = `jobs/${bookingId}/${stamp}_${safeName}`;

    // Create signed upload URL (Supabase Storage signed upload)
    // Endpoint:
    // POST /storage/v1/object/upload/sign/<bucket>/<path>
    const signUrl =
      `${SUPABASE_URL}/storage/v1/object/upload/sign/${encodeURIComponent(BUCKET)}/${encodePath(path)}`;

    const signRes = await fetch(signUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // expiresIn: seconds
        expiresIn: 60 * 10, // 10 minutes
        // contentType is supported by some versions; harmless if ignored
        contentType,
      }),
    });

    const signText = await signRes.text();
    let sign = null;
    try { sign = signText ? JSON.parse(signText) : null; } catch { sign = null; }

    if (!signRes.ok) {
      return corsJson({ ok: false, error: "Supabase Storage sign failed", details: { status: signRes.status, body: sign || signText } }, 502);
    }

    // Supabase returns: { signedURL: "..." } (sometimes relative)
    const signedURL =
      sign?.signedURL || sign?.signedUrl || sign?.signed_url || sign?.url;

    if (!signedURL) {
      return corsJson({ ok: false, error: "Supabase Storage sign returned no signedURL", details: sign }, 502);
    }

    const upload_url = signedURL.startsWith("http")
      ? signedURL
      : `${SUPABASE_URL}/storage/v1${signedURL}`;

    return corsJson({
      ok: true,
      bucket: BUCKET,
      path,
      media_ref: `sb://${BUCKET}/${path}`,
      upload_url,
    });
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

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ""));
}

function sanitizeFilename(name) {
  // keep letters, numbers, dot, dash, underscore; replace others with "_"
  const base = name.split(/[\\/]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

// encode path segments but keep slashes
function encodePath(path) {
  return encodeURIComponent(path).replace(/%2F/g, "/");
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
