import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_blocks", allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;

    const [dateRes, slotRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks?select=id,blocked_date,reason,created_at&order=blocked_date.asc`, { headers: serviceHeaders(env) }),
      fetch(`${env.SUPABASE_URL}/rest/v1/slot_blocks?select=id,blocked_date,slot,reason,created_at&order=blocked_date.asc,slot.asc`, { headers: serviceHeaders(env) })
    ]);
    if (!dateRes.ok) return json({ error: `Could not load date blocks. ${await dateRes.text()}` }, 500);
    if (!slotRes.ok) return json({ error: `Could not load slot blocks. ${await slotRes.text()}` }, 500);
    const [dateBlocks, slotBlocks] = await Promise.all([dateRes.json().catch(() => []), slotRes.json().catch(() => [])]);
    return json({ ok: true, actor: { id: access.actor?.id || null, full_name: access.actor?.full_name || null }, date_blocks: Array.isArray(dateBlocks) ? dateBlocks : [], slot_blocks: Array.isArray(slotBlocks) ? slotBlocks : [] });
  } catch (err) { return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500); }
}
