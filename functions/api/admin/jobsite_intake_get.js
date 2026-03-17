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

    const booking_id = String(body.booking_id || "").trim();
    if (!booking_id) {
      return json({ error: "Missing booking_id." }, 400);
    }

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const bookingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings` +
      `?select=id,status,job_status,customer_name,customer_email,service_date,start_slot,package_code,vehicle_size,assigned_to,progress_enabled,progress_token` +
      `&id=eq.${encodeURIComponent(booking_id)}` +
      `&limit=1`,
      { headers }
    );

    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return json({ error: `Could not load booking. ${text}` }, 500);
    }

    const bookingRows = await bookingRes.json();
    const booking = Array.isArray(bookingRows) ? bookingRows[0] : null;

    if (!booking) {
      return json({ error: "Booking not found." }, 404);
    }

    const intakeRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/jobsite_intake` +
      `?select=*` +
      `&booking_id=eq.${encodeURIComponent(booking_id)}` +
      `&limit=1`,
      { headers }
    );

    if (!intakeRes.ok) {
      const text = await intakeRes.text();
      return json({ error: `Could not load intake. ${text}` }, 500);
    }

    const intakeRows = await intakeRes.json();
    const intake = Array.isArray(intakeRows) ? intakeRows[0] || null : null;

    return json({
      ok: true,
      booking,
      intake
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
