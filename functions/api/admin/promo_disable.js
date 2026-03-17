// /functions/api/admin/promo_disable.js
// REPLACE ENTIRE FILE
//
// Toggles is_active for a promo code (admin).
//
// POST JSON:
// {
//   "admin_password": "....",
//   "promo_id": "uuid"
// }
//
// Behavior:
// - If currently active -> disable
// - If currently disabled -> enable

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);

    // --- Auth ---
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) return json({ ok: false, error: "Server not configured (ADMIN_PASSWORD missing)" }, 500);
    if (!body?.admin_password || body.admin_password !== ADMIN_PASSWORD) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const promo_id = String(body.promo_id || "").trim();
    if (!isUuid(promo_id)) return json({ ok: false, error: "Invalid promo_id" }, 400);

    // --- Supabase config ---
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    // 1) Read current
    const getUrl = `${SUPABASE_URL}/rest/v1/promo_codes?select=id,is_active&` +
                   `id=eq.${encodeURIComponent(promo_id)}&limit=1`;

    const getRes = await fetch(getUrl, {
      method: "GET",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: "application/json",
      },
    });

    const getText = await getRes.text();
    const getData = safeJson(getText);

    if (!getRes.ok) {
      return json({ ok: false, error: "Supabase error (promo read)", details: getData }, 502);
    }

    const row = Array.isArray(getData) ? getData[0] : null;
    if (!row?.id) return json({ ok: false, error: "Promo not found" }, 404);

    const nextActive = !(row.is_active === true);

    // 2) Update
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?id=eq.${encodeURIComponent(promo_id)}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ is_active: nextActive }),
    });

    const patchText = await patchRes.text();
    const patchData = safeJson(patchText);

    if (!patchRes.ok) {
      return json({ ok: false, error: "Supabase error (promo update)", details: patchData }, 502);
    }

    const updated = Array.isArray(patchData) ? patchData[0] : patchData;
    return json({ ok: true, row: updated });

  } catch (e) {
    return json({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}
