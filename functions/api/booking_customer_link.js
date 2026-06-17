import { requireStaffAccess, json, cleanText, serviceHeaders } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body." }, 400);
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return access.response;

    const booking_id = cleanText(body.booking_id);
    const customer_profile_id = cleanText(body.customer_profile_id);

    if (!booking_id) {
      return json({ error: "Missing booking_id." }, 400);
    }

    const headers = serviceHeaders(env);

    const bookingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_profile_id,customer_tier_code&id=eq.${encodeURIComponent(booking_id)}&limit=1`,
      { headers }
    );
    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return json({ error: `Could not load booking. ${text}` }, 500);
    }
    const bookingRows = await bookingRes.json().catch(() => []);
    const booking = Array.isArray(bookingRows) ? bookingRows[0] : null;
    if (!booking) return json({ error: "Booking not found." }, 404);

    let customerProfile = null;
    if (customer_profile_id) {
      const profileRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,email,full_name,tier_code&id=eq.${encodeURIComponent(customer_profile_id)}&limit=1`,
        { headers }
      );
      if (!profileRes.ok) {
        const text = await profileRes.text();
        return json({ error: `Could not load customer profile. ${text}` }, 500);
      }
      const profileRows = await profileRes.json().catch(() => []);
      customerProfile = Array.isArray(profileRows) ? profileRows[0] : null;
      if (!customerProfile) return json({ error: "Customer profile not found." }, 404);
    }

    const patchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          customer_profile_id: customerProfile?.id || null,
          customer_tier_code: customerProfile?.tier_code || null
        })
      }
    );
    if (!patchRes.ok) {
      const text = await patchRes.text();
      return json({ error: `Could not link booking to customer. ${text}` }, 500);
    }

    const rows = await patchRes.json().catch(() => []);
    const updated = Array.isArray(rows) ? rows[0] : null;

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers,
      body: JSON.stringify([{
        booking_id,
        event_type: customerProfile ? "customer_profile_linked" : "customer_profile_unlinked",
        actor_name: access.actor.full_name || access.actor.email || "Staff",
        event_note: customerProfile
          ? `Linked to ${customerProfile.full_name || customerProfile.email || customerProfile.id}`
          : "Customer profile link removed.",
        payload: {
          customer_profile_id: customerProfile?.id || null,
          customer_tier_code: customerProfile?.tier_code || null,
          actor_id: access.actor.id || null
        }
      }])
    }).catch(() => null);

    return json({
      ok: true,
      message: customerProfile ? "Booking linked to customer profile." : "Customer profile link removed from booking.",
      actor: {
        id: access.actor.id || null,
        full_name: access.actor.full_name || null,
        email: access.actor.email || null,
        role_code: access.actor.role_code || null
      },
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
