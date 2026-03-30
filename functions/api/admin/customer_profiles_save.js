import { requireStaffAccess, json, cleanText, cleanEmail, serviceHeaders, toBoolean } from "../_lib/staff-auth.js";

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
      allowLegacyAdminFallback: false
    });
    if (!access.ok) return access.response;

    const id = cleanText(body.id);
    const email = cleanEmail(body.email);
    const full_name = cleanText(body.full_name);
    const phone = cleanText(body.phone);
    const tier_code = cleanTier(body.tier_code);
    const lifetime_bookings = toNonNegativeInteger(body.lifetime_bookings, 0);
    const lifetime_spend_cents = toNonNegativeInteger(body.lifetime_spend_cents, 0);
    const big_tipper = toBoolean(body.big_tipper);
    const notes = cleanText(body.notes);

    if (!email) return json({ error: "Missing or invalid email." }, 400);
    if (!tier_code) return json({ error: "Invalid tier_code." }, 400);

    const record = {
      email,
      full_name,
      phone,
      tier_code,
      lifetime_bookings,
      lifetime_spend_cents,
      big_tipper,
      notes,
      updated_at: new Date().toISOString()
    };

    const headers = serviceHeaders(env);

    if (id) {
      const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(record)
      });
      if (!patchRes.ok) return json({ error: `Could not update customer profile. ${await patchRes.text()}` }, 500);
      const rows = await patchRes.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) return json({ error: "Customer profile not found." }, 404);
      return json({ ok: true, message: "Customer profile updated.", actor: { id: access.actor.id || null, full_name: access.actor.full_name || null }, customer_profile: row });
    }

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify([{ ...record, created_at: new Date().toISOString() }])
    });
    if (!insertRes.ok) return json({ error: `Could not create customer profile. ${await insertRes.text()}` }, 500);
    const rows = await insertRes.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    return json({ ok: true, message: "Customer profile created.", actor: { id: access.actor.id || null, full_name: access.actor.full_name || null }, customer_profile: row || null });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}

function cleanTier(value) {
  const s = String(value ?? "").trim().toLowerCase();
  return ["random", "regular", "silver", "gold", "vip"].includes(s) ? s : null;
}

function toNonNegativeInteger(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}
