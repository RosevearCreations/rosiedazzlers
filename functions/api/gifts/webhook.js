import { loadGiftDeliverySettings, processGiftDeliveryRow } from "../_lib/gift-delivery.js";
import { buildGiftPurchaseContext } from "../_lib/gift-delivery-state-673.js";

// /functions/api/gifts/webhook.js
// Stripe webhook -> Supabase fulfilment for Gift Certificate purchases
// Build 674: paid, verified Stripe events enter one database transaction per
// checkout session. Replays and ambiguous legacy sessions cannot issue twice.

export async function onRequestPost({ request, env }) {
  const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET_GIFTS;
  const STRIPE_KEY = env.STRIPE_SECRET_KEY; // kept for future use
  const SUPABASE_URL = env.SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!STRIPE_WEBHOOK_SECRET) return json({ error: "Missing STRIPE_WEBHOOK_SECRET_GIFTS" }, 500);
  if (!STRIPE_KEY) return json({ error: "Missing STRIPE_SECRET_KEY" }, 500);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Missing Supabase env vars" }, 500);

  // Stripe signature verification must use RAW body
  const rawBody = await request.text();
  const sigHeader = request.headers.get("stripe-signature") || "";

  const ok = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET, 300);
  if (!ok) return json({ error: "Invalid Stripe signature" }, 400);

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event?.type)) {
    return json({ ok: true, ignored: event?.type || "unknown" }, 200);
  }

  const session = event?.data?.object;
  if (!session?.id || !event?.id) return json({ error: "Missing verified event or session id" }, 400);

  // Only process gift sessions created by our gift checkout endpoint
  if (session?.metadata?.purpose !== "gift") {
    return json({ ok: true, ignored: "not a gift session" }, 200);
  }

  // A completed Checkout session may still be unpaid for delayed methods.
  // Never issue a redeemable gift before the provider confirms payment.
  if (session.payment_status !== "paid") {
    return json({ ok: true, issued: 0, awaiting_confirmed_payment: true }, 200);
  }

  const cartStr = String(session?.metadata?.cart || "").trim();
  if (!cartStr) return json({ error: "Missing cart metadata" }, 400);

  const purchaser_email =
    String(
      session?.metadata?.purchaser_email ||
        session?.customer_details?.email ||
        session?.customer_email ||
        ""
    ).trim();
  const recipient_email = String(session?.metadata?.recipient_email || "").trim();
  const recipient_name = String(session?.metadata?.recipient_name || "").trim();

  // Capture vehicle intake fields from metadata (present only for service gift purchases)
  const vehicle = {
    year: String(session?.metadata?.vehicle_year || "").trim(),
    make: String(session?.metadata?.vehicle_make || "").trim(),
    model: String(session?.metadata?.vehicle_model || "").trim(),
    body_style: String(session?.metadata?.vehicle_body_style || "").trim(),
    declared_size: String(session?.metadata?.vehicle_declared_size || "").trim(),
    photo_url: String(session?.metadata?.vehicle_photo_url || "").trim(),
  };
  const purchase_context = buildGiftPurchaseContext(session.metadata, vehicle);

  const cartItems = parseCart(cartStr);
  if (!cartItems.length) return json({ error: "Cart metadata invalid/empty" }, 400);

  const skus = [...new Set(cartItems.map((x) => x.sku))];
  const products = await supaGetGiftProducts(SUPABASE_URL, SERVICE_KEY, skus);
  const bySku = new Map(products.map((p) => [p.sku, p]));

  // Stripe session.created is unix seconds
  const createdUnix = Number(session?.created);
  if (!Number.isSafeInteger(createdUnix) || createdUnix <= 0) return json({ error: "Missing Stripe creation timestamp" }, 400);
  const createdAt = new Date(createdUnix * 1000);
  const expiresAt = new Date(createdAt.getTime());
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // + 1 year

  const certRows = [];

  for (const it of cartItems) {
    const p = bySku.get(it.sku);
    if (!p || p.is_active !== true) {
      return json({ error: `Unknown or inactive SKU in cart: ${it.sku}` }, 400);
    }

    for (let i = 0; i < it.qty; i++) {
      const type = p.type;
      const currency = p.currency || "CAD";

      let face = Number(p.face_value_cents);

      // open_value: amount is set at checkout
      if (type === "open_value") {
        if (!Number.isFinite(it.amount_cents) || it.amount_cents <= 0) {
          return json({ error: `Missing amount_cents for open_value SKU ${it.sku}` }, 400);
        }
        face = it.amount_cents;
      }

      if (!Number.isFinite(face) || face < 0) return json({ error: `Bad face value for ${it.sku}` }, 400);

      certRows.push({
        code: generateGiftCode(),
        checkout_line_number: certRows.length + 1,
        sku: p.sku,
        type,
        currency,

        face_value_cents: face,
        remaining_cents: face,

        package_code: p.package_code || null,
        vehicle_size: p.vehicle_size || null,

        status: "active",

        purchaser_email: purchaser_email || null,
        recipient_name: recipient_name || null,
        recipient_email: recipient_email || null,

        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent || null,

        // enforce 1-year validity window
        expires_at: expiresAt.toISOString(),

        // store intake details
        purchase_context: structuredClone(purchase_context),
      });
    }
  }

  if (certRows.length > 100) return json({ error: "Gift checkout item limit exceeded" }, 400);
  // Exclude generated codes from the stable fingerprint: parallel workers
  // generate different random codes for the *same* paid checkout intent.
  const payloadDigest = await sha256Hex(JSON.stringify(certRows.map(({ code, ...item }) => item)));
  let issuance;
  try {
    issuance = await supaIssueGiftCertificatesAtomic(SUPABASE_URL, SERVICE_KEY, {
      p_session_id: session.id,
      p_event_id: event.id,
      p_event_type: event.type,
      p_payload_digest: payloadDigest,
      p_rows: certRows
    });
  } catch (error) {
    console.error("Gift issuance transaction unavailable; owner reconciliation hold required", {
      event_id: event.id, session_id: session.id, reason: error?.message || "unknown"
    });
    return json({ ok: false, issued: 0, owner_recovery_hold: true,
      error: "Gift issuance could not be verified atomically. Check the issuance receipt before attempting owner recovery." }, 503);
  }
  if (issuance.outcome === "hold") {
    return json({ ok: true, issued: 0, owner_recovery_hold: true,
      hold_reason: issuance.hold_reason || "prior_recovery_hold",
      session_id: session.id, event_id: event.id }, 200);
  }
  if (issuance.outcome === "replayed") {
    return json({ ok: true, issued: 0, idempotent: true,
      replay_evidence_recorded: true, session_id: session.id }, 200);
  }
  if (issuance.outcome !== "issued" || issuance.issued_count !== certRows.length) {
    return json({ ok: false, issued: 0, owner_recovery_hold: true,
      error: "Unrecognized certificate issuance receipt" }, 503);
  }

  let delivery_results = [];
  try {
    const giftSettings = await loadGiftDeliverySettings(env);
    const issuedRows = await supaGetGiftCertificatesBySession(SUPABASE_URL, SERVICE_KEY, session.id);
    for (const gift of issuedRows) {
      const result = await processGiftDeliveryRow(env, gift, giftSettings, { origin: (env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, '') });
      delivery_results.push(result);
    }
  } catch {}

  return json({
    ok: true,
    issued: issuance.issued_count,
    replay_evidence_recorded: true,
    session_id: session.id,
    expires_at: expiresAt.toISOString(),
    delivery_results
  });
}

/* ----------------- Cart parsing ----------------- */
/*
cart format: sku:qty:amount(optional) separated by |
Example:
GIFT-100:1:|GIFT-OPEN:1:25000|SVC-premium_wash-small:1:
*/
function parseCart(cartStr) {
  const parts = cartStr.split("|").map((s) => s.trim()).filter(Boolean);
  const out = [];

  for (const p of parts) {
    const [skuRaw, qtyRaw, amtRaw] = p.split(":");
    const sku = (skuRaw || "").trim();
    const qty = Math.max(1, Math.min(25, Math.floor(Number(qtyRaw || 1))));
    const amount_cents = amtRaw && String(amtRaw).trim() !== "" ? Math.floor(Number(amtRaw)) : null;

    if (!sku) continue;
    out.push({ sku, qty, amount_cents });
  }

  return out;
}

/* ----------------- Gift code generation ----------------- */
function generateGiftCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `RD-${hex}`;
}

/* ----------------- Stripe signature verification ----------------- */
async function verifyStripeSignature(rawBody, sigHeader, secret, toleranceSeconds = 300) {
  try {
    const parts = sigHeader.split(",").map((x) => x.trim());
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Parts = parts.filter((p) => p.startsWith("v1="));

    if (!tPart || v1Parts.length === 0) return false;

    const t = Number(tPart.slice(2));
    if (!Number.isFinite(t)) return false;

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - t) > toleranceSeconds) return false;

    const signedPayload = `${t}.${rawBody}`;
    const expected = await hmacSha256Hex(secret, signedPayload);

    for (const v of v1Parts) {
      const sig = v.slice(3);
      if (timingSafeEqual(sig, expected)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bufToHex(sig).toLowerCase();
}

function bufToHex(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

function timingSafeEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/* ----------------- Supabase helpers ----------------- */
async function supaIssueGiftCertificatesAtomic(SUPABASE_URL, SERVICE_KEY, params) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/issue_gift_certificates_atomic`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Atomic issuance RPC HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !["issued", "replayed", "hold"].includes(data.outcome)) {
    throw new Error("Atomic issuance RPC returned an invalid receipt");
  }
  return data;
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  return bufToHex(await crypto.subtle.digest("SHA-256", bytes));
}

async function supaGetGiftProducts(SUPABASE_URL, SERVICE_KEY, skus) {
  const inList = skus.map((s) => `"${String(s).replace(/"/g, "")}"`).join(",");
  const url = `${SUPABASE_URL}/rest/v1/gift_products?select=sku,type,package_code,vehicle_size,face_value_cents,currency,is_active&sku=in.(${encodeURIComponent(
    inList
  )})`;

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
    throw new Error(`Supabase gift_products fetch failed: ${res.status} ${txt}`);
  }

  return await res.json();
}

async function supaGetGiftCertificatesBySession(SUPABASE_URL, SERVICE_KEY, sessionId) {
  const url = `${SUPABASE_URL}/rest/v1/gift_certificates?select=id,created_at,code,type,package_code,vehicle_size,remaining_cents,face_value_cents,expires_at,purchaser_email,recipient_name,recipient_email,stripe_session_id,purchase_context,status&stripe_session_id=eq.${encodeURIComponent(sessionId)}&order=created_at.asc`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
