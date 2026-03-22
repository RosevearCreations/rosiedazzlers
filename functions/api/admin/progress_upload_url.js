
import {
  requireStaffAccess,
  serviceHeaders,
  json,
  isUuid
} from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ error: "Server configuration is incomplete." }, 500));
    }

    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    const filename = String(body.filename || "").trim();
    const content_type = String(body.content_type || "image/jpeg").trim() || "image/jpeg";

    if (!booking_id || !isUuid(booking_id)) {
      return withCors(json({ error: "Valid booking_id is required." }, 400));
    }
    if (!filename) {
      return withCors(json({ error: "filename is required." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: booking_id,
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const bucket = env.JOB_MEDIA_BUCKET || "job-media";
    const safeName = sanitizeFilename(filename);
    const stamp = new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
    const path = `jobs/${booking_id}/${stamp}_${safeName}`;

    const signRes = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodeURIComponent(path)}`,
      {
        method: "POST",
        headers: {
          ...serviceHeaders(env)
        },
        body: JSON.stringify({})
      }
    );

    if (!signRes.ok) {
      return withCors(json({ error: `Could not create upload URL. ${await signRes.text()}` }, 500));
    }

    const signData = await signRes.json().catch(() => null);
    const token = signData?.token || signData?.signedURL || null;
    if (!token) {
      return withCors(json({ error: "Upload signing response was incomplete." }, 500));
    }

    const upload_url = `${env.SUPABASE_URL}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodeURIComponent(path)}?token=${encodeURIComponent(token)}`;
    const publicBase = env.JOB_MEDIA_PUBLIC_BASE || `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}`;
    const media_url = `${publicBase}/${path}`;

    return withCors(json({
      ok: true,
      bucket,
      path,
      upload_url,
      media_url,
      content_type
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

function sanitizeFilename(filename) {
  const name = String(filename || "upload")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return name || "upload";
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
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
