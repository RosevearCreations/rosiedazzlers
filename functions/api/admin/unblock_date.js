import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Server configuration is incomplete." }, 500);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid request body." }, 400);
    const access = await requireStaffAccess({ request, env, body, capability: null, allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;
    const actionAccess = requireActionAccess(access.actor, "operations.schedule.manage");
    if (!actionAccess.ok) return actionAccess.response;
    const blocked_date = String(body.blocked_date || "").trim();
    if (!blocked_date) return json({ error: "Missing blocked_date." }, 400);
    const deleteRes = await fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks?blocked_date=eq.${encodeURIComponent(blocked_date)}`, { method: "DELETE", headers: { ...serviceHeaders(env), Prefer: "return=representation" } });
    if (!deleteRes.ok) return json({ error: `Could not unblock date. ${await deleteRes.text()}` }, 500);
    const rows = await deleteRes.json().catch(() => []);
    const removed = Array.isArray(rows) ? rows[0] || null : null;
    return json({ ok: true, message: "Date block removed.", actor: { id: access.actor.id || null, full_name: access.actor.full_name || null, email: access.actor.email || null, role_code: access.actor.role_code || null }, removed: removed || { blocked_date } });
  } catch (err) { return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500); }
}
