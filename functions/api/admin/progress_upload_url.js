import { requireStaffAccess, json, methodNotAllowed, cleanText, isUuid } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ error: "Server not configured (Supabase env vars missing)" }, 500));
    }

    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    const filename = String(body.filename || "").trim();
    const content_type = String(body.content_type || "image/jpeg").trim().toLowerCase() || "image/jpeg";
    const file_size_bytes = Number(body.file_size_bytes || 0);
    const customer_visible = body.customer_visible === true || String(body.visibility || "").trim().toLowerCase() === "customer";
    const media_kind = normalizeMediaKind(body.media_kind, content_type);
    const duration_seconds = Number(body.duration_seconds || 0);
    const retention_policy = normalizeRetention(body.retention_policy);
    const max_duration_seconds = Number(env.JOB_MEDIA_MAX_VIDEO_SECONDS || 120);
    if (media_kind === 'video' && duration_seconds > 0 && duration_seconds > max_duration_seconds) {
      return withCors(json({ error: `Video is longer than the ${max_duration_seconds}-second limit.`, max_duration_seconds }, 400));
    }

    if (!isUuid(booking_id)) return withCors(json({ error: "booking_id must be a uuid." }, 400));
    if (!filename) return withCors(json({ error: "filename required." }, 400));
    if (!isAllowedContentType(content_type)) {
      return withCors(json({ error: "Unsupported upload type.", allowed: allowedContentTypes() }, 400));
    }
    if (file_size_bytes > 0) {
      const limit = getUploadSizeLimit({ env, content_type, media_kind });
      if (file_size_bytes > limit) {
        return withCors(json({ error: `File is too large for ${media_kind}.`, max_size_bytes: limit }, 400));
      }
    }

    const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId: booking_id, allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const bucket = String(env.JOB_MEDIA_BUCKET || "job-media").trim() || "job-media";
    const safeName = sanitizeFilename(filename);
    const stamp = new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
    const path = `jobs/${booking_id}/${stamp}_${safeName}`;

    const signRes = await fetch(`${env.SUPABASE_URL}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodePath(path)}`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ expiresIn: 60 * 10, contentType: content_type })
    });
    const signText = await signRes.text();
    const sign = safeJson(signText) || {};
    if (!signRes.ok) return withCors(json({ error: "Supabase Storage sign failed.", details: sign || signText }, 502));

    const signedURL = sign.signedURL || sign.signedUrl || sign.signed_url || sign.url;
    if (!signedURL) return withCors(json({ error: "Supabase Storage sign returned no signedURL." }, 502));

    const upload_url = signedURL.startsWith("http") ? signedURL : `${env.SUPABASE_URL}/storage/v1${signedURL}`;
    const upload_session_id = crypto.randomUUID();
    await createUploadSession({ env, id: upload_session_id, booking_id, filename: safeName, content_type, file_size_bytes, media_kind, bucket, path, retention_policy, actor: access.actor }).catch(() => null);

    const public_url = customer_visible
      ? `${env.JOB_MEDIA_PUBLIC_BASE || `${env.SUPABASE_URL}/storage/v1/object/public`}/${encodeURIComponent(bucket)}/${encodePath(path)}`
      : null;

    return withCors(json({
      ok: true,
      bucket,
      path,
      media_ref: `sb://${bucket}/${path}`,
      upload_url,
      public_url,
      customer_visible,
      media_kind,
      upload_session_id,
      retention_policy,
      max_duration_seconds,
      compression_guidance: media_kind === 'video' ? 'For faster mobile uploads, use MP4/H.264 at 1080p or lower. The browser will not silently alter the original evidence file.' : 'Use JPEG or WebP when practical for faster mobile uploads.',
      max_size_bytes: getUploadSizeLimit({ env, content_type, media_kind }),
      uploaded_by: access.actor.full_name || cleanText(body.staff_name) || "Staff"
    }));
  } catch (err) {
    return withCors(json({ error: err && err.message ? err.message : "Unexpected server error." }, 500));
  }
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }
function sanitizeFilename(name) { const base = name.split(/[\/]/).pop() || "file"; return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120); }
function encodePath(path) { return encodeURIComponent(path).replace(/%2F/g, "/"); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }

function normalizeMediaKind(value, contentType) {
  const raw = String(value || "").trim().toLowerCase();
  if (["image", "video", "document"].includes(raw)) return raw;
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("image/")) return "image";
  return "document";
}

function allowedContentTypes() {
  return [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "video/mp4",
    "video/quicktime"
  ];
}

function isAllowedContentType(value) {
  return allowedContentTypes().includes(String(value || "").trim().toLowerCase());
}

function getUploadSizeLimit({ env, content_type, media_kind }) {
  const defaultImage = Number(env.JOB_MEDIA_MAX_IMAGE_BYTES || 25 * 1024 * 1024);
  const defaultVideo = Number(env.JOB_MEDIA_MAX_VIDEO_BYTES || 150 * 1024 * 1024);
  if (media_kind === "video" || String(content_type || "").startsWith("video/")) return defaultVideo;
  return defaultImage;
}


function normalizeRetention(value) {
  const raw = String(value || 'standard_365_days').trim().toLowerCase();
  const aliases={job_plus_90_days:'temporary_90_days',job_plus_365_days:'standard_365_days',permanent_evidence:'permanent_proof'};
  const normalized=aliases[raw]||raw;
  return ['temporary_90_days','standard_365_days','permanent_proof','legal_hold'].includes(normalized) ? normalized : 'standard_365_days';
}

async function createUploadSession({ env, id, booking_id, filename, content_type, file_size_bytes, media_kind, bucket, path, retention_policy, actor }) {
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/live_upload_sessions`, {
    method: 'POST', headers, body: JSON.stringify([{ id, booking_id, filename, content_type, file_size_bytes: file_size_bytes || null, media_kind, storage_bucket: bucket, storage_path: path, retention_policy, status: 'prepared', staff_user_id: actor?.id || null }])
  });
  if (!res.ok) throw new Error(await res.text());
}
