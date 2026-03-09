// functions/api/progress/view.js
// GET /api/progress/view?token=UUID
// Customer-safe progress feed (no login yet).
//
// Uses bookings.progress_token as the only secret.
// Returns booking basics + customer-visible job_updates + customer-visible job_media.
//
// NOTE: This does NOT expose customer email/phone/address.

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
      media: Array.isArray(med.data) ? med.data : [],
    });
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* helpers */

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ""));
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
