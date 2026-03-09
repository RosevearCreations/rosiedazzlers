// functions/api/progress/view.js
// REPLACE ENTIRE FILE with this version.
// v2: supports media_url stored as:
//   - normal URL (https://...)
//   - OR Supabase Storage reference: sb://bucket/path
// If sb://..., it returns a short-lived signed URL for customer viewing.
//
// GET /api/progress/view?token=UUID
// Customer-safe progress feed (no login yet).
// Does NOT expose customer email/phone/address.

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestGet({ request, env }) {
  try {
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return corsJson({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const url = new URL(request.url);
    const token = (url.searchParams.get("token") || "").trim();

    if (!isUuid(token)) {
      return corsJson({ ok: false, error: "Missing or invalid token" }, 400);
    }

    const supaGet = async (path) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method: "GET",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Accept: "application/json",
        },
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    // 1) Find booking by progress_token
    const b = await supaGet(
      `/rest/v1/bookings?select=id,service_date,start_slot,package_code,vehicle_size,vehicle,status,progress_enabled&progress_token=eq.${encodeURIComponent(token)}&limit=1`
    );

    if (!b.ok) return corsJson({ ok: false, error: "Supabase error (bookings)", details: b }, 502);

    const booking = Array.isArray(b.data) ? b.data[0] : null;
    if (!booking) return corsJson({ ok: false, error: "Not found" }, 404);

    if (booking.progress_enabled !== true) {
      return corsJson({ ok: false, error: "Progress tracking disabled for this booking" }, 403);
    }

    // 2) Customer-visible updates
    const upd = await supaGet(
      `/rest/v1/job_updates?select=id,created_at,created_by,note,visibility&booking_id=eq.${encodeURIComponent(booking.id)}&visibility=eq.customer&order=created_at.asc`
    );
    if (!upd.ok) return corsJson({ ok: false, error: "Supabase error (job_updates)", details: upd }, 502);

    // 3) Customer-visible media
    const med = await supaGet(
      `/rest/v1/job_media?select=id,created_at,created_by,caption,kind,media_url,visibility&booking_id=eq.${encodeURIComponent(booking.id)}&visibility=eq.customer&order=created_at.asc`
    );
    if (!med.ok) return corsJson({ ok: false, error: "Supabase error (job_media)", details: med }, 502);

    const mediaRows = Array.isArray(med.data) ? med.data : [];

    // Convert any sb://bucket/path to signed URLs
    const media = [];
    for (const m of mediaRows) {
      const rawUrl = String(m.media_url || "");
      if (rawUrl.startsWith("sb://")) {
        const signed = await signStorageUrl(SUPABASE_URL, SERVICE_KEY, rawUrl, 60 * 60); // 1 hour
        media.push({ ...m, media_url: signed || rawUrl, media_ref: rawUrl });
      } else {
        media.push(m);
      }
    }

    return corsJson({
      ok: true,
      booking: {
        id: booking.id,
        status: booking.status,
        service_date: booking.service_date,
        start_slot: booking.start_slot,
        package_code: booking.package_code,
        vehicle_size: booking.vehicle_size,
        vehicle: booking.vehicle || null,
      },
      updates: Array.isArray(upd.data) ? upd.data : [],
      media,
    });
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- helpers ---------------- */

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ""));
}

async function signStorageUrl(SUPABASE_URL, SERVICE_KEY, sbRef, expiresInSeconds) {
  // sb://bucket/path
  const m = sbRef.match(/^sb:\/\/([^/]+)\/(.+)$/i);
  if (!m) return null;

  const bucket = m[1];
  const path = m[2];

  const storageBase = `${SUPABASE_URL}/storage/v1`;
  const signEndpoint =
    `${storageBase}/object/sign/${encodeURIComponent(bucket)}/${encodePath(path)}`;

  const res = await fetch(signEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!res.ok) return null;

  // returns { signedURL: "/object/sign/..." } or { signedURL: "..." }
  const signedURL = data?.signedURL || data?.signedUrl || data?.signed_url || data?.url;
  if (!signedURL) return null;

  // Normalize to full URL
  if (signedURL.startsWith("http")) return signedURL;
  return `${storageBase}${signedURL}`;
}

// encode path segments but keep slashes
function encodePath(path) {
  return encodeURIComponent(path).replace(/%2F/g, "/");
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
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
