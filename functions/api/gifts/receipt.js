// /functions/api/gifts/receipt.js
// Returns issued gift codes for a Stripe Checkout session (gift purchases only).
// SECURITY: requires purchaser_email match + session_id match.
// This lets customers see their Gift Code(s) after checkout even before email delivery exists.

export async function onRequestPost({ request, env }) {
  try {
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const body = await readJson(request);

    const session_id = str(body?.session_id);
    const purchaser_email = str(body?.purchaser_email);

    if (!session_id) return json({ error: "Missing session_id" }, 400);
    if (!purchaser_email) return json({ error: "Missing purchaser_email" }, 400);

    if (!session_id.startsWith("cs_")) {
      return json({ error: "session_id must look like a Stripe Checkout session id (cs_...)" }, 400);
    }
    if (!looksLikeEmail(purchaser_email)) {
      return json({ error: "purchaser_email is not a valid email format" }, 400);
    }

    const rows = await supaFindGiftCertsForSession(SUPABASE_URL, SERVICE_KEY, session_id, purchaser_email);

    if (!rows.length) {
      // Don’t reveal whether the session exists without the matching email.
      return json({ error: "No gift certificates found for that session/email" }, 404);
    }

    return json({
      ok: true,
      session_id,
      purchaser_email,
      gifts: rows.map((r) => ({
        code: r.code,
        sku: r.sku,
        type: r.type,
        face_value_cents: r.face_value_cents,
        remaining_cents: r.remaining_cents,
        expires_at: r.expires_at,
        recipient_email: r.recipient_email,
        recipient_name: r.recipient_name,
      })),
    });

  } catch (e) {
    return json({ error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- Helpers ---------------- */

async function readJson(request) {
  const t = await request.text();
  if (!t) return {};
  try { return JSON.parse(t); } catch { return {}; }
}

function str(v) {
  if (typeof v !== "string") return "";
  return v.trim();
}

function looksLikeEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}

async function supaFindGiftCertsForSession(SUPABASE_URL, SERVICE_KEY, sessionId, email) {
  const url =
    `${SUPABASE_URL}/rest/v1/gift_certificates` +
    `?select=code,sku,type,face_value_cents,remaining_cents,expires_at,recipient_email,recipient_name` +
    `&stripe_session_id=eq.${encodeURIComponent(sessionId)}` +
    `&purchaser_email=eq.${encodeURIComponent(email)}` +
    `&order=created_at.asc`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase gift_certificates fetch failed: ${res.status} ${txt}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
