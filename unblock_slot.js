import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

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
      capability: "manage_blocks",
      allowLegacyAdminFallback: false
    });
    if (!access.ok) return access.response;

    const blocked_date = String(body.blocked_date || "").trim();
    const slot = String(body.slot || "").trim().toUpperCase();

    if (!blocked_date) {
      return json({ error: "Missing blocked_date." }, 400);
    }

    if (!["AM", "PM"].includes(slot)) {
      return json({ error: "Invalid slot. Use AM or PM." }, 400);
    }

    const deleteRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/slot_blocks?blocked_date=eq.${encodeURIComponent(blocked_date)}&slot=eq.${encodeURIComponent(slot)}`,
      {
        method: "DELETE",
        headers: {
          ...serviceHeaders(env),
          Prefer: "return=representation"
        }
      }
    );

    if (!deleteRes.ok) {
      const text = await deleteRes.text();
      return json({ error: `Could not unblock slot. ${text}` }, 500);
    }

    const rows = await deleteRes.json().catch(() => []);
    const removed = Array.isArray(rows) ? rows[0] || null : null;

    return json({
      ok: true,
      message: "Slot block removed.",
      actor: {
        id: access.actor.id || null,
        full_name: access.actor.full_name || null,
        email: access.actor.email || null,
        role_code: access.actor.role_code || null
      },
      removed: removed || { blocked_date, slot }
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
}
