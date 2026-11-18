import { serviceHeaders, json, cleanText, cleanEmail } from "./_lib/staff-auth.js";
import {sha256Receipt907} from './_lib/photo-quote-907.js';

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const origin=request.headers.get('origin');
    if(origin && origin!==new URL(request.url).origin)
      return withCors(json({ok:false,error:'Same-origin estimate upload required.'},403));
    if(Number(request.headers.get('content-length')||0)>1600)
      return withCors(json({ok:false,error:'Upload metadata exceeds request limit.'},413));
    if (String(env.PUBLIC_PHOTO_ESTIMATE_UPLOADS_ENABLED || "").toLowerCase() !== "true") {
      return withCors(json({
        ok: false,
        error: "Direct photo upload is not enabled yet. Please paste Google Drive, Dropbox, iCloud, Facebook, or other share links instead.",
        upload_enabled: false
      }, 503));
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ ok: false, error: "Upload service is not configured." }, 500));
    }

    const body = await request.json().catch(() => ({}));
    const website = cleanText(body.website || body.company_website || "");
    if (website) return withCors(json({ ok: false, error: "Upload rejected." }, 400));

    const filename = cleanText(body.filename);
    const content_type = cleanText(body.content_type || "image/jpeg").toLowerCase();
    const file_size_bytes = Number(body.file_size_bytes || 0);
    const customer_email = cleanEmail(body.customer_email || body.email);
    const customer_name = cleanText(body.customer_name || body.name);

    if (!filename) return withCors(json({ ok: false, error: "filename is required." }, 400));
    if (!isAllowedContentType(content_type)) {
      return withCors(json({ ok: false, error: "Unsupported upload type.", allowed: allowedContentTypes() }, 400));
    }

    const limit = uploadLimitBytes(content_type, env);
    if (file_size_bytes > 0 && file_size_bytes > limit) {
      return withCors(json({ ok: false, error: "File is too large.", max_size_bytes: limit }, 400));
    }

    const bucket = cleanText(env.PHOTO_ESTIMATE_BUCKET || env.JOB_MEDIA_BUCKET || "job-media") || "job-media";
    const safeName = sanitizeFilename(filename);
    const stamp = new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
    const intakeId = crypto.randomUUID();
    const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
    const uploadProof=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
    const uploadProofHash=await sha256Receipt907(uploadProof);
    const path = `photo-estimates/${stamp}_${intakeId}_${safeName}`;

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
    if (!signRes.ok) {
      return withCors(json({ ok: false, error: "Storage sign failed.", details: sign || signText }, 502));
    }

    const signedURL = sign.signedURL || sign.signedUrl || sign.signed_url || sign.url;
    if (!signedURL) return withCors(json({ ok: false, error: "Storage sign returned no signed URL." }, 502));

    const upload_url = signedURL.startsWith("http")
      ? signedURL
      : `${String(env.SUPABASE_URL).replace(/\/+$/, "")}${signedURL}`;

    const publicBase = cleanText(env.PHOTO_ESTIMATE_PUBLIC_BASE_URL || env.JOB_MEDIA_PUBLIC_BASE_URL || env.SUPABASE_STORAGE_PUBLIC_BASE_URL);
    const media_url = publicBase ? `${publicBase.replace(/\/+$/, "")}/${path.split("/").map(encodeURIComponent).join("/")}` : `storage://${bucket}/${path}`;

    await recordUploadIntent(env, {
      intake_id: intakeId,
      bucket,
      object_path: path,
      filename: safeName,
      content_type,
      file_size_bytes: Number.isFinite(file_size_bytes) ? file_size_bytes : null,
      customer_email: customer_email || null,
      customer_name: customer_name || null,
      media_url,
      upload_proof_hash:uploadProofHash
    });

    return withCors(json({
      ok: true,
      upload_enabled: true,
      upload_url,
      intake_id:intakeId,
      upload_proof:uploadProof,
      method: "PUT",
      bucket,
      object_path: path,
      media_url,
      public_url: media_url,
      expires_in_seconds: 600
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || String(err) }, 500));
  }
}

export async function onRequestGet() {
  return withCors(json({
    ok: true,
    endpoint: "public_photo_estimate_upload_url",
    methods: ["POST"],
    note: "Direct upload requires PUBLIC_PHOTO_ESTIMATE_UPLOADS_ENABLED=true and Supabase Storage configuration."
  }));
}

async function recordUploadIntent(env, payload) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/photo_estimate_uploads`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
      body: JSON.stringify({
        ...payload,
        source: "public_booking",
        status: "signed",
        created_at: new Date().toISOString()
      })
    });
    if(!res.ok)throw new Error('Upload custody record unavailable.');
  } catch { throw new Error('Upload custody record unavailable. File was not reported as attached.'); }
}

function isAllowedContentType(type) {
  return allowedContentTypes().includes(String(type || "").toLowerCase());
}

function allowedContentTypes() {
  return ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "video/mp4", "video/quicktime", "video/webm"];
}

function uploadLimitBytes(type, env) {
  const configured = Number(env.PUBLIC_PHOTO_ESTIMATE_MAX_BYTES || 0);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return String(type || "").startsWith("video/") ? 60 * 1024 * 1024 : 12 * 1024 * 1024;
}

function sanitizeFilename(name) {
  const cleaned = cleanText(name).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^\.+/, "");
  return (cleaned || "photo-estimate-upload").slice(0, 120);
}

function encodePath(path) {
  return String(path || "").split("/").map(encodeURIComponent).join("/");
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
