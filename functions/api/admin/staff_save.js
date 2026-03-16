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
    const full_name = cleanText(body.full_name);
    const email = cleanEmail(body.email);
    const role_code = cleanRole(body.role_code);
    const is_active = toBooleanDefault(body.is_active, true);

    if (!full_name) return json({ error: "Missing full_name." }, 400);
    if (!email) return json({ error: "Missing or invalid email." }, 400);
    if (!role_code) return json({ error: "Invalid role_code." }, 400);

    const record = {
      full_name,
      email,
      role_code,
      is_active,
      can_override_lower_entries: toBooleanDefault(body.can_override_lower_entries, false),
      can_manage_bookings: toBooleanDefault(body.can_manage_bookings, false),
      can_manage_blocks: toBooleanDefault(body.can_manage_blocks, false),
      can_manage_progress: toBooleanDefault(body.can_manage_progress, false),
      can_manage_promos: toBooleanDefault(body.can_manage_promos, false),
      can_manage_staff: toBooleanDefault(body.can_manage_staff, false),
      notes: cleanText(body.notes),
      updated_at: new Date().toISOString()
    };

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    if (id) {
      const patchRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/staff_users?id=eq.${encodeURIComponent(id)}`,
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
        return json({ error: `Could not update staff user. ${text}` }, 500);
      }

      const rows = await patchRes.json();
      const row = Array.isArray(rows) ? rows[0] : null;

      if (!row) {
        return json({ error: "Staff user not found." }, 404);
      }

      return json({
        ok: true,
        message: "Staff user updated.",
        staff_user: row
      });
    }

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users`, {
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
      return json({ error: `Could not create staff user. ${text}` }, 500);
    }

    const rows = await insertRes.json();
    const row = Array.isArray(rows) ? rows[0] : null;

    return json({
      ok: true,
      message: "Staff user created.",
      staff_user: row || null
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

function cleanRole(value) {
  const s = String(value ?? "").trim().toLowerCase();
  return ["admin", "senior_detailer", "detailer"].includes(s) ? s : null;
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
