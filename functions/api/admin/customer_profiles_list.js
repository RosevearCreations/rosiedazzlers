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

    await request.json().catch(() => ({}));

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const [profilesRes, tiersRes] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/customer_profiles` +
          `?select=id,created_at,updated_at,email,full_name,phone,tier_code,lifetime_bookings,lifetime_spend_cents,big_tipper,notes` +
          `&order=full_name.asc.nullslast,email.asc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/customer_tiers` +
          `?select=code,sort_order,label,description,is_active` +
          `&order=sort_order.asc`,
        { headers }
      )
    ]);

    if (!profilesRes.ok) {
      const text = await profilesRes.text();
      return json({ error: `Could not load customer profiles. ${text}` }, 500);
    }

    if (!tiersRes.ok) {
      const text = await tiersRes.text();
      return json({ error: `Could not load customer tiers. ${text}` }, 500);
    }

    const [profiles, tiers] = await Promise.all([
      profilesRes.json(),
      tiersRes.json()
    ]);

    return json({
      ok: true,
      customer_profiles: Array.isArray(profiles) ? profiles : [],
      customer_tiers: Array.isArray(tiers) ? tiers : []
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
