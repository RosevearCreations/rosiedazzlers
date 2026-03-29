import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;

    const [staffRes, tiersRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/staff_users?select=id,created_at,updated_at,full_name,email,role_code,is_active,password_hash,can_override_lower_entries,can_manage_bookings,can_manage_blocks,can_manage_progress,can_manage_promos,can_manage_staff,notes&order=full_name.asc`, { headers: serviceHeaders(env) }),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_tiers?select=code,sort_order,label,description,is_active&order=sort_order.asc`, { headers: serviceHeaders(env) })
    ]);
    if (!staffRes.ok) return json({ error: `Could not load staff users. ${await staffRes.text()}` }, 500);
    if (!tiersRes.ok) return json({ error: `Could not load customer tiers. ${await tiersRes.text()}` }, 500);
    const [staffUsers, customerTiers] = await Promise.all([staffRes.json().catch(() => []), tiersRes.json().catch(() => [])]);
    return json({ ok: true, actor: { id: access.actor?.id || null, full_name: access.actor?.full_name || null }, staff_users: Array.isArray(staffUsers) ? staffUsers : [], customer_tiers: Array.isArray(customerTiers) ? customerTiers : [] });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}
