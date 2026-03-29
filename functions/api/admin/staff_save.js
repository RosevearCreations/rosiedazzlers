import { requireStaffAccess, serviceHeaders, json, cleanText, cleanEmail, toBoolean } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;

    const id = cleanText(body.id);
    const full_name = cleanText(body.full_name);
    const email = cleanEmail(body.email);
    const role_code = cleanRole(body.role_code);
    const is_active = toBooleanDefault(body.is_active, true);

    if (!full_name) return json({ error: "Missing full_name." }, 400);
    if (!email) return json({ error: "Missing or invalid email." }, 400);
    if (!role_code) return json({ error: "Invalid role_code." }, 400);

    const record = {
      full_name, email, role_code, is_active,
      can_override_lower_entries: toBooleanDefault(body.can_override_lower_entries, false),
      can_manage_bookings: toBooleanDefault(body.can_manage_bookings, false),
      can_manage_blocks: toBooleanDefault(body.can_manage_blocks, false),
      can_manage_progress: toBooleanDefault(body.can_manage_progress, false),
      can_manage_promos: toBooleanDefault(body.can_manage_promos, false),
      can_manage_staff: toBooleanDefault(body.can_manage_staff, false),
      notes: cleanText(body.notes),
      updated_at: new Date().toISOString()
    };

    if (id) {
      const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(record) });
      if (!patchRes.ok) return json({ error: `Could not update staff user. ${await patchRes.text()}` }, 500);
      const rows = await patchRes.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] || null : null;
      if (!row) return json({ error: "Staff user not found." }, 404);
      return json({ ok: true, message: "Staff user updated.", actor: { id: access.actor?.id || null, full_name: access.actor?.full_name || null }, staff_user: row });
    }

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users`, { method: "POST", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify([{ ...record, created_at: new Date().toISOString() }]) });
    if (!insertRes.ok) return json({ error: `Could not create staff user. ${await insertRes.text()}` }, 500);
    const rows = await insertRes.json().catch(() => []);
    return json({ ok: true, message: "Staff user created.", actor: { id: access.actor?.id || null, full_name: access.actor?.full_name || null }, staff_user: Array.isArray(rows) ? rows[0] || null : null });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}

function cleanRole(value) {
  const s = String(value ?? "").trim().toLowerCase();
  return ["admin", "senior_detailer", "detailer"].includes(s) ? s : null;
}
function toBooleanDefault(value, fallback = false) {
  if (value === null || value === undefined || value === "") return fallback;
  return toBoolean(value);
}
