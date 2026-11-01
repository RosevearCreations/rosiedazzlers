import { requireStaffAccess, json, serviceHeaders } from "./staff-auth.js";
import { requireActionAccess } from "./action-permissions.js";

// An owner may release a manually blocked day/slot after a written review.
// This does not release a booking hold or bypass one-car capacity. The RPC
// deletes the block and writes an audit row in one database transaction.
export async function releaseOwnerScheduleBlock738({ request, env }, type) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Server configuration is incomplete." }, 500);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid request body." }, 400);
    const access = await requireStaffAccess({ request, env, body, capability: null, allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;
    const actionAccess = requireActionAccess(access.actor, "operations.schedule.manage");
    if (!actionAccess.ok) return actionAccess.response;
    if (access.auth_mode !== "session" || access.actor?.is_admin !== true) {
      return json({ error: "An authenticated owner/admin session is required to release a scheduling block." }, 403);
    }
    const date = String(body.blocked_date || "").trim();
    const slot = type === "slot" ? String(body.slot || "").trim().toUpperCase() : null;
    const reason = String(body.override_reason || body.reason || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (type === "slot" && !["AM", "PM"].includes(slot))) {
      return json({ error: "Valid blocked_date and AM/PM slot are required." }, 400);
    }
    if (reason.length < 20 || reason.length > 2000) {
      return json({ error: "Please document a scheduling exception reason (20–2000 characters)." }, 400);
    }
    const actorLabel = String(access.actor.email || access.actor.full_name || "").trim();
    if (!actorLabel) return json({ error: "Owner identity cannot be verified." }, 403);
    const result = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/rosie_owner_release_schedule_block_738`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify({ p_service_date: date, p_slot: slot, p_reason: reason,
        p_actor_id: access.actor.id || null, p_actor_label: actorLabel })
    });
    const raw = await result.text();
    if (!result.ok) return json({ error: "Could not release and audit this schedule block.", details: raw }, result.status === 400 ? 409 : 503);
    const saved = raw ? JSON.parse(raw) : null;
    return json({ ok: true, message: "Owner scheduling exception recorded; existing bookings remain protected.",
      removed: { blocked_date: date, slot }, audit: saved, capacity_override: false });
  } catch (error) {
    return json({ error: error?.message || "Could not process owner scheduling exception." }, 500);
  }
}
