// /functions/api/admin/unblock_date.js
// REPLACE ENTIRE FILE
//
// POST JSON:
// {
//   "admin_password": "....",
//   "blocked_date": "YYYY-MM-DD"
// }
//
// Deletes from public.date_blocks where blocked_date matches

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);

    const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) return json({ ok: false, error: "Server not configured (ADMIN_PASSWORD missing)" }, 500);
    if (!body?.admin_password || body.admin_password !== ADMIN_PASSWORD) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const blocked_date = String(body.blocked_date || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(blocked_date)) {
      return json({ ok: false, error: "blocked_date must be YYYY-MM-DD" }, 400);
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const url = `${SUPABASE_URL}/rest/v1/date_blocks?blocked_date=eq.${encodeURIComponent(blocked_date)}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: "application/json",
        Prefer: "return=representation",
      },
    });

    const text = await res.text();
    const data = safeJson(text);

    if (!res.ok) {
      return json({ ok: false, error: "Supabase error (date_blocks delete)", details: data }, 500);
    }

    return json({ ok: true, deleted: data });

  } catch (e) {
    return json({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}
