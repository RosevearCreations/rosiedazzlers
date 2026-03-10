// /functions/api/progress/view.js
// CREATE THIS FILE (or REPLACE ENTIRE FILE)
//
// GET /api/progress/view?token=UUID
//
// Customer-facing progress feed:
// - Resolves booking by progress_token
// - Returns customer-visible updates + media
// - Converts "sb://bucket/path" media into a signed URL (short-lived)
//
// Env vars required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Optional env vars:
// - JOB_MEDIA_SIGN_SECONDS (default 3600)

export async function onRequestGet({ request, env }) {
  try {
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    const SIGN_SECONDS = Number(env.JOB_MEDIA_SIGN_SECONDS || 3600);

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const url = new URL(request.url);
    const token = String(url.searchParams.get("token") || "").trim();
    if (!isUuid(token)) return json({ ok: false, error: "Missing or invalid token" }, 400);

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

    // 1) Resolve booking
    const b = await supaGet(
      `/rest/v1/bookings?select=id,customer_name,service_date,package_code,vehicle_size,progress_enabled,job_status,completed_at&progress_token=eq.${encodeURIComponent(token)}&limit=1`
    );

    if (!b.ok) return json({ ok: false, error: "Supabase error (bookings)", details: b }, 502);

    const booking = Array.isArray(b.data) ? b.data[0] : null;
    if (!booking) return json({ ok: false, error: "Not found" }, 404);
    if (booking.progress_enabled !== true) return json({ ok: false, error: "Progress tracking disabled" }, 403);

    // 2) Load updates (customer visibility only)
    const updates = await supaGet(
      `/rest/v1/job_updates?select=id,created_at,created_by,note,visibility&booking_id=eq.${encodeURIComponent(booking.id)}&visibility=eq.customer&order=created_at.desc&limit=200`
    );
    if (!updates.ok) return json({ ok: false, error: "Supabase error (job_updates)", details: updates }, 502);

    // 3) Load media (customer visibility only)
    const media = await supaGet(
      `/rest/v1/job_media?select=id,created_at,created_by,kind,caption,media_url,visibility&booking_id=eq.${encodeURIComponent(booking.id)}&visibility=eq.customer&order=created_at.desc&limit=200`
    );
    if (!media.ok) return json({ ok: false, error: "Supabase error (job_media)", details: media }, 502);

    // 4) Convert sb:// refs to signed URLs
    const signedMedia = [];
    for (const m of (media.data || [])) {
      const raw = String(m.media_url || "");
      if (raw.startsWith("sb://")) {
        const { bucket, path } = parseSb(raw);
        const signed = await signStorageUrl(SUPABASE_URL, SERVICE_KEY, bucket, path, SIGN_SECONDS);
        signedMedia.push({
          ...m,
          media_url_raw: raw,
          media_url: signed.ok ? signed.url : null,
          signed_ok: signed.ok,
        });
      } else {
        signedMedia.push({ ...m, media_url_raw: raw, signed_ok: true });
      }
    }

    return json({
      ok: true,
      booking: {
        id: booking.id,
        customer_name: booking.customer_name,
        service_date: booking.service_date,
        package_code: booking.package_code,
        vehicle_size: booking.vehicle_size,
        job_status: booking.job_status || null,
        completed_at: booking.completed_at || null,
      },
      updates: updates.data || [],
      media: signedMedia,
    });
  } catch (e) {
    return json({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- helpers ---------------- */

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ""));
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function parseSb(ref) {
  // sb://bucket/path/to/file
  const x = ref.replace("sb://", "");
  const idx = x.indexOf("/");
  if (idx < 0) return { bucket: x, path: "" };
  return { bucket: x.slice(0, idx), path: x.slice(idx + 1) };
}

async function signStorageUrl(SUPABASE_URL, SERVICE_KEY, bucket, path, expiresInSeconds) {
  try {
    const endpoint =
      `${SUPABASE_URL}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodePath(path)}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: Number(expiresInSeconds || 3600) }),
    });

    const text = await res.text();
    let out = null;
    try { out = text ? JSON.parse(text) : null; } catch { out = null; }

    if (!res.ok) return { ok: false, status: res.status, error: out || text };

    const signedURL =
      out?.signedURL || out?.signedUrl || out?.signed_url || out?.url;

    if (!signedURL) return { ok: false, status: 502, error: out || "No signedURL" };

    const url = signedURL.startsWith("http")
      ? signedURL
      : `${SUPABASE_URL}/storage/v1${signedURL}`;

    return { ok: true, url };
  } catch (e) {
    return { ok: false, status: 500, error: String(e) };
  }
}

function encodePath(path) {
  return encodeURIComponent(path).replace(/%2F/g, "/");
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}
