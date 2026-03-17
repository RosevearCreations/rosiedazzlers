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
    const assigned_to = String(body.assigned_to || "").trim();

    if (!booking_id) {
      return json({ error: "Missing booking_id." }, 400);
    }

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const patchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          assigned_to: assigned_to || null
        })
      }
    );

    if (!patchRes.ok) {
      const text = await patchRes.text();
      return json({ error: `Could not update assigned staff. ${text}` }, 500);
    }

    const rows = await patchRes.json();
    const booking = Array.isArray(rows) ? rows[0] : null;

    if (!booking) {
      return json({ error: "Booking not found." }, 404);
    }

    return json({
      ok: true,
      message: assigned_to ? "Booking assigned." : "Booking assignment cleared.",
      booking: {
        id: booking.id,
        assigned_to: booking.assigned_to || null
      }
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
