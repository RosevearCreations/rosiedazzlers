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

    const [staffRes, tiersRes] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/staff_users` +
          `?select=id,created_at,updated_at,full_name,email,role_code,is_active,` +
          `can_override_lower_entries,can_manage_bookings,can_manage_blocks,` +
          `can_manage_progress,can_manage_promos,can_manage_staff,notes` +
          `&order=full_name.asc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/customer_tiers` +
          `?select=code,sort_order,label,description,is_active` +
          `&order=sort_order.asc`,
        { headers }
      )
    ]);

    if (!staffRes.ok) {
      const text = await staffRes.text();
      return json({ error: `Could not load staff users. ${text}` }, 500);
    }

    if (!tiersRes.ok) {
      const text = await tiersRes.text();
      return json({ error: `Could not load customer tiers. ${text}` }, 500);
    }

    const [staffUsers, customerTiers] = await Promise.all([
      staffRes.json(),
      tiersRes.json()
    ]);

    return json({
      ok: true,
      staff_users: Array.isArray(staffUsers) ? staffUsers : [],
      customer_tiers: Array.isArray(customerTiers) ? customerTiers : []
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
