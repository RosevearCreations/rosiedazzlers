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
    if (!token) {
      return json({ error: "Missing token." }, 400);
    }

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const bookingUrl =
      `${env.SUPABASE_URL}/rest/v1/bookings` +
      `?select=id,status,job_status,customer_name,service_date,start_slot,package_code,vehicle_size,assigned_to,progress_enabled,progress_token` +
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

    const bookingId = booking.id;

    const [updatesRes, mediaRes, signoffsRes] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_updates?select=id,created_at,created_by,note,visibility,thread_status,moderated_at,moderated_by_name,moderation_reason&booking_id=eq.${bookingId}&order=created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_media?select=id,created_at,created_by,kind,caption,media_url,visibility,thread_status,moderated_at,moderated_by_name,moderation_reason&booking_id=eq.${bookingId}&order=created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_signoffs?select=id,signer_type,signer_name,signer_email,notes,signed_at,user_agent&booking_id=eq.${bookingId}&order=signed_at.desc`,
        { headers }
      )
    ]);

    if (!updatesRes.ok) {
      const text = await updatesRes.text();
      return json({ error: `Could not load updates. ${text}` }, 500);
    }

    if (!mediaRes.ok) {
      const text = await mediaRes.text();
      return json({ error: `Could not load media. ${text}` }, 500);
    }

    if (!signoffsRes.ok) {
      const text = await signoffsRes.text();
      return json({ error: `Could not load signoffs. ${text}` }, 500);
    }

    const [updates, media, signoffs] = await Promise.all([
      updatesRes.json(),
      mediaRes.json(),
      signoffsRes.json()
    ]);

    const packageName = booking.package_code
      ? booking.package_code
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "";

    return json({
      ok: true,
      booking: {
        id: booking.id,
        status: booking.status,
        job_status: booking.job_status,
        customer_name: booking.customer_name,
        service_date: booking.service_date,
        start_slot: booking.start_slot,
        package_code: booking.package_code,
        package_name: packageName,
        vehicle_size: booking.vehicle_size,
        assigned_to: booking.assigned_to,
        progress_enabled: booking.progress_enabled,
        progress_token: booking.progress_token
      },
      updates: Array.isArray(updates) ? updates : [],
      media: Array.isArray(media) ? media : [],
      signoffs: Array.isArray(signoffs) ? signoffs : []
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
