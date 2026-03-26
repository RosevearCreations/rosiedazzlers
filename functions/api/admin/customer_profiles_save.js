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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body." }, 400);
    }

    const id = cleanText(body.id);
    const email = cleanEmail(body.email);
    const full_name = cleanText(body.full_name);
    const phone = cleanText(body.phone);
    const tier_code = cleanTier(body.tier_code);
    const lifetime_bookings = toNonNegativeInteger(body.lifetime_bookings, 0);
    const lifetime_spend_cents = toNonNegativeInteger(body.lifetime_spend_cents, 0);
    const big_tipper = toBooleanDefault(body.big_tipper, false);
    const notes = cleanText(body.notes);

    if (!email) {
      return json({ error: "Missing or invalid email." }, 400);
    }

    if (!tier_code) {
      return json({ error: "Invalid tier_code." }, 400);
    }

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

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    if (id) {
      const patchRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
          body: JSON.stringify(record)
        }
      );

      if (!patchRes.ok) {
        const text = await patchRes.text();
        return json({ error: `Could not update customer profile. ${text}` }, 500);
      }

      const rows = await patchRes.json();
      const row = Array.isArray(rows) ? rows[0] : null;

      if (!row) {
        return json({ error: "Customer profile not found." }, 404);
      }

      return json({
        ok: true,
        message: "Customer profile updated.",
        customer_profile: row
      });
    }

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([
        {
          ...record,
          created_at: new Date().toISOString()
        }
      ])
    });

    if (!insertRes.ok) {
      const text = await insertRes.text();
      return json({ error: `Could not create customer profile. ${text}` }, 500);
    }

    const rows = await insertRes.json();
    const row = Array.isArray(rows) ? rows[0] : null;

    return json({
      ok: true,
      message: "Customer profile created.",
      customer_profile: row || null
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
}

function cleanText(value) {
  const s = String(value ?? "").trim();
  return s || null;
}

function cleanEmail(value) {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s;
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

function toBooleanDefault(value, fallback = false) {
  if (value === null || value === undefined || value === "") return fallback;
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
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
