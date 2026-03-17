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

    const body = await request.json().catch(() => ({}));
    const bookingId = String(body.booking_id || "").trim();
    const status = body.status == null ? null : String(body.status).trim();
    const jobStatus = body.job_status == null ? null : String(body.job_status).trim();

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    if (!bookingId) {
      const listUrl =
        `${env.SUPABASE_URL}/rest/v1/bookings` +
        `?select=id,status,job_status,customer_name,customer_email,service_date,start_slot,package_code,vehicle_size,assigned_to,progress_enabled,progress_token,created_at` +
        `&order=service_date.asc,created_at.desc`;

      const listRes = await fetch(listUrl, { headers });
      if (!listRes.ok) {
        const text = await listRes.text();
        return json({ error: `Could not load bookings. ${text}` }, 500);
      }

      const bookings = await listRes.json();

      return json({
        ok: true,
        bookings: Array.isArray(bookings) ? bookings : []
      });
    }

    const patch = {};
    if (status !== null) patch.status = status;
    if (jobStatus !== null) patch.job_status = jobStatus || null;

    if (Object.keys(patch).length === 0) {
      return json({ error: "Nothing to update." }, 400);
    }

    if (patch.status === "completed" || patch.job_status === "completed") {
      patch.completed_at = new Date().toISOString();
    }

    const patchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify(patch)
      }
    );

    if (!patchRes.ok) {
      const text = await patchRes.text();
      return json({ error: `Could not update booking. ${text}` }, 500);
    }

    const rows = await patchRes.json();
    const booking = Array.isArray(rows) ? rows[0] : null;

    if (!booking) {
      return json({ error: "Booking not found." }, 404);
    }

    return json({
      ok: true,
      message: "Booking updated.",
      booking
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
