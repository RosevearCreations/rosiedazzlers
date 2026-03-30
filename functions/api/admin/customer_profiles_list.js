import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: false
    });
    if (!access.ok) return access.response;

    const headers = serviceHeaders(env);
    const [profilesRes, tiersRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,created_at,updated_at,email,full_name,phone,tier_code,lifetime_bookings,lifetime_spend_cents,big_tipper,notes&order=full_name.asc.nullslast,email.asc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_tiers?select=code,sort_order,label,description,is_active&order=sort_order.asc`, { headers })
    ]);

    if (!profilesRes.ok) return json({ error: `Could not load customer profiles. ${await profilesRes.text()}` }, 500);
    if (!tiersRes.ok) return json({ error: `Could not load customer tiers. ${await tiersRes.text()}` }, 500);

    const [profiles, tiers] = await Promise.all([
      profilesRes.json().catch(() => []),
      tiersRes.json().catch(() => [])
    ]);

    return json({
      ok: true,
      actor: {
        id: access.actor.id || null,
        full_name: access.actor.full_name || null,
        email: access.actor.email || null,
        role_code: access.actor.role_code || null
      },
      customer_profiles: Array.isArray(profiles) ? profiles : [],
      customer_tiers: Array.isArray(tiers) ? tiers : []
    });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}
