// /functions/api/gifts/receipt.js
// POST /api/gifts/receipt
// Returns issued gift codes for a Stripe Checkout session.
// SECURITY: requires session_id match + (purchaser_email OR recipient_email) match.
//
// Accepts JSON:
// { "session_id": "cs_test_...", "email": "you@example.com" }
// (Also accepts legacy: purchaser_email)
//
// Response:
// { ok:true, session_id, email, gifts:[{code,type,sku,remaining,remaining_cents,expires_at,...}] }

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return corsJson({ error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const body = await readJson(request);

    const session_id = str(body?.session_id);
    const email =
      str(body?.email) ||
      str(body?.purchaser_email) ||
      str(body?.recipient_email);

    if (!session_id) return corsJson({ error: "Missing session_id" }, 400);
    if (!email) return corsJson({ error: "Missing email" }, 400);

    if (!session_id.startsWith("cs_")) {
      return corsJson({ error: "session_id must look like a Stripe Checkout session id (cs_...)" }, 400);
    }
    if (!looksLikeEmail(email)) {
      return corsJson({ error: "email is not a valid email format" }, 400);
    }

    const rows = await supaFindGiftCertsForSession(SUPABASE_URL, SERVICE_KEY, session_id, email);

    if (!rows.length) {
      // Don’t reveal whether the session exists without the matching email.
      return corsJson({ error: "No gift certificates found for that session/email" }, 404);
    }

    return corsJson({
      ok: true,
      session_id,
      email,
      gifts: rows.map((r) => ({
        code: r.code,
        sku: r.sku,
        type: r.type,
        currency: r.currency || "CAD",
        package_code: r.package_code ?? null,
        vehicle_size: r.vehicle_size ?? null,

        face_value_cents: r.face_value_cents,
        remaining_cents: r.remaining_cents,
        remaining: formatCad(r.remaining_cents),

        expires_at: r.expires_at,
        purchaser_email: r.purchaser_email ?? null,
        recipient_email: r.recipient_email ?? null,
        recipient_name: r.recipient_name ?? null,
        sender_name: r.purchase_context?.gift_delivery?.sender_name ?? null,
        delivery_date: r.purchase_context?.gift_delivery?.delivery_date ?? null,
        gift_message: r.purchase_context?.gift_delivery?.gift_message ?? null,
      })),
    });
  } catch (e) {
    return corsJson({ error: "Server error", details: String(e) }, 500);
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

function formatCad(cents) {
  const n = Number(cents || 0);
  const dollars = n / 100;
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(dollars);
  } catch {
    return `$${dollars.toFixed(2)}`;
  }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
}

function corsJson(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

function corsResponse(body = "", status = 200) {
  return new Response(body, { status, headers: corsHeaders() });
}

async function supaFindGiftCertsForSession(SUPABASE_URL, SERVICE_KEY, sessionId, email) {
  // Supabase REST "or" filter:
  // &or=(purchaser_email.eq.EMAIL,recipient_email.eq.EMAIL)
  const or = `(purchaser_email.eq.${encodeURIComponent(email)},recipient_email.eq.${encodeURIComponent(email)})`;

  const url =
    `${SUPABASE_URL}/rest/v1/gift_certificates` +
    `?select=code,sku,type,currency,package_code,vehicle_size,face_value_cents,remaining_cents,expires_at,purchaser_email,recipient_email,recipient_name,purchase_context` +
    `&stripe_session_id=eq.${encodeURIComponent(sessionId)}` +
    `&or=${or}` +
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
