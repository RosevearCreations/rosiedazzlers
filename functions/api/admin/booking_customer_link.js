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

    const booking_id = cleanText(body.booking_id);
    const customer_profile_id = cleanText(body.customer_profile_id);

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
        `?select=id,customer_profile_id,customer_tier_code` +
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

    let customerProfile = null;

    if (customer_profile_id) {
      const profileRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/customer_profiles` +
          `?select=id,email,full_name,tier_code` +
          `&id=eq.${encodeURIComponent(customer_profile_id)}` +
          `&limit=1`,
        { headers }
      );

      if (!profileRes.ok) {
        const text = await profileRes.text();
        return json({ error: `Could not load customer profile. ${text}` }, 500);
      }

      const profileRows = await profileRes.json();
      customerProfile = Array.isArray(profileRows) ? profileRows[0] : null;

      if (!customerProfile) {
        return json({ error: "Customer profile not found." }, 404);
      }
    }

    const patch = {
      customer_profile_id: customerProfile?.id || null,
      customer_tier_code: customerProfile?.tier_code || null
    };

    const patchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`,
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
      return json({ error: `Could not link booking to customer. ${text}` }, 500);
    }

    const rows = await patchRes.json();
    const updated = Array.isArray(rows) ? rows[0] : null;

    return json({
      ok: true,
      message: customerProfile
        ? "Booking linked to customer profile."
        : "Customer profile link removed from booking.",
      booking: updated || null,
      customer_profile: customerProfile || null
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
}

function cleanText(value) {
  const s = String(value ?? "").trim();
  return s || null;
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
