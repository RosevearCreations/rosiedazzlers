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

    const blocked_date = String(body.blocked_date || "").trim();
    const reason = String(body.reason || "").trim();

    if (!blocked_date) {
      return json({ error: "Missing blocked_date." }, 400);
    }

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates"
    };

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks`, {
      method: "POST",
      headers,
      body: JSON.stringify([
        {
          blocked_date,
          reason: reason || null
        }
      ])
    });

    if (!insertRes.ok) {
      const text = await insertRes.text();
      return json({ error: `Could not block date. ${text}` }, 500);
    }

    const rows = await insertRes.json();
    const row = Array.isArray(rows) ? rows[0] : null;

    return json({
      ok: true,
      message: "Date blocked.",
      date_block: row || {
        blocked_date,
        reason: reason || null
      }
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
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
