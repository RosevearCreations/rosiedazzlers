export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const adminPassword = request.headers.get("x-admin-password") || "";
    if (!env.ADMIN_PASSWORD || adminPassword !== env.ADMIN_PASSWORD) {
      return json({ error: "Unauthorized." }, 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body." }, 400);
    }

    const token = String(body.token || "").trim();
    const booking_id = String(body.booking_id || "").trim();

    if (!token && !booking_id) {
      return json({ error: "Missing token or booking_id." }, 400);
    }

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    let booking = null;

    if (booking_id) {
      const bookingRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/bookings?select=id,progress_enabled,progress_token,status,job_status&` +
        `id=eq.${encodeURIComponent(booking_id)}&limit=1`,
        { headers }
      );

      if (!bookingRes.ok) {
        const text = await bookingRes.text();
        return json({ error: `Could not load booking. ${text}` }, 500);
      }

      const rows = await bookingRes.json();
      booking = Array.isArray(rows) ? rows[0] : null;
    } else {
      const bookingRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/bookings?select=id,progress_enabled,progress_token,status,job_status&` +
        `progress_token=eq.${encodeURIComponent(token)}&limit=1`,
        { headers }
      );

      if (!bookingRes.ok) {
        const text = await bookingRes.text();
        return json({ error: `Could not load booking. ${text}` }, 500);
      }

      const rows = await bookingRes.json();
      booking = Array.isArray(rows) ? rows[0] : null;
    }

    if (!booking) {
      return json({ error: "Booking not found." }, 404);
    }

    const progressToken = booking.progress_token || crypto.randomUUID();

    const patchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking.id)}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          progress_enabled: true,
          progress_token: progressToken
        })
      }
    );

    if (!patchRes.ok) {
      const text = await patchRes.text();
      return json({ error: `Could not enable progress. ${text}` }, 500);
    }

    const rows = await patchRes.json();
    const updated = Array.isArray(rows) ? rows[0] : null;

    return json({
      ok: true,
      message: "Progress enabled.",
      booking_id: updated?.id || booking.id,
      progress_token: updated?.progress_token || progressToken,
      progress_enabled: true
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
