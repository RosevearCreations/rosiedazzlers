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
    const created_by = String(body.created_by || "").trim();
    const kind = String(body.kind || "photo").trim();
    const caption = String(body.caption || "").trim();
    const media_url = String(body.media_url || "").trim();
    const visibility = String(body.visibility || "customer").trim();

    if (!token) return json({ error: "Missing token." }, 400);
    if (!created_by) return json({ error: "Missing created_by." }, 400);
    if (!media_url) return json({ error: "Missing media_url." }, 400);

    if (!["photo", "video"].includes(kind)) {
      return json({ error: "Invalid kind. Use photo or video." }, 400);
    }

    if (!["customer", "internal"].includes(visibility)) {
      return json({ error: "Invalid visibility." }, 400);
    }

    try {
      new URL(media_url);
    } catch {
      return json({ error: "media_url must be a valid absolute URL." }, 400);
    }

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const bookingUrl =
      `${env.SUPABASE_URL}/rest/v1/bookings` +
      `?select=id,progress_enabled,progress_token` +
      `&progress_token=eq.${encodeURIComponent(token)}` +
      `&limit=1`;

    const bookingRes = await fetch(bookingUrl, { headers });
    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return json({ error: `Could not load booking. ${text}` }, 500);
    }

    const bookings = await bookingRes.json();
    const booking = Array.isArray(bookings) ? bookings[0] : null;

    if (!booking) {
      return json({ error: "Booking not found for token." }, 404);
    }

    if (booking.progress_enabled === false) {
      return json({ error: "Progress is not enabled for this booking." }, 403);
    }

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_media`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([
        {
          booking_id: booking.id,
          created_by,
          kind,
          caption: caption || null,
          media_url,
          visibility
        }
      ])
    });

    if (!insertRes.ok) {
      const text = await insertRes.text();
      return json({ error: `Could not save media. ${text}` }, 500);
    }

    const rows = await insertRes.json();
    const row = Array.isArray(rows) ? rows[0] : null;

    return json({
      ok: true,
      message: "Media attached.",
      media: row || null
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
