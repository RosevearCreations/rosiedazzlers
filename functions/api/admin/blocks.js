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

    await request.json().catch(() => ({}));

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const [dateRes, slotRes] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/date_blocks?select=id,blocked_date,reason,created_at&order=blocked_date.asc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/slot_blocks?select=id,blocked_date,slot,reason,created_at&order=blocked_date.asc,slot.asc`,
        { headers }
      )
    ]);

    if (!dateRes.ok) {
      const text = await dateRes.text();
      return json({ error: `Could not load date blocks. ${text}` }, 500);
    }

    if (!slotRes.ok) {
      const text = await slotRes.text();
      return json({ error: `Could not load slot blocks. ${text}` }, 500);
    }

    const [dateBlocks, slotBlocks] = await Promise.all([
      dateRes.json(),
      slotRes.json()
    ]);

    return json({
      ok: true,
      date_blocks: Array.isArray(dateBlocks) ? dateBlocks : [],
      slot_blocks: Array.isArray(slotBlocks) ? slotBlocks : []
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
