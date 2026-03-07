// /functions/api/gifts/checkout.js
// Creates a Stripe Checkout Session for Gift Certificates (service vouchers OR dollar-value vouchers)

export async function onRequestPost({ request, env }) {
  try {
    const body = await safeJson(request);

    // -------- 1) Validate input --------
    // items: [{ sku: "GIFT-100", qty: 1 }, { sku:"SVC-premium_wash-small", qty:1 }, { sku:"OPEN", qty:1, amount_cents: 25000 }]
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) return json({ error: "Missing items[]" }, 400);

    // Optional purchaser / recipient info (helps fulfilment later)
    const purchaser_email = asString(body?.purchaser_email);
    const recipient_email = asString(body?.recipient_email);
    const recipient_name = asString(body?.recipient_name);

    // -------- 2) Server config --------
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const STRIPE_KEY = env.STRIPE_SECRET_KEY;
    const ORIGIN = env.SITE_ORIGIN || "https://rosiedazzlers.ca";

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ error: "Server not configured (Supabase env vars missing)" }, 500);
    }
    if (!STRIPE_KEY) {
      return json({ error: "Server not configured (Stripe secret missing)" }, 500);
    }

    // -------- 3) Load gift_products from Supabase --------
    // Pull the SKUs from request (and de-dupe)
    const skus = [...new Set(items.map((i) => asString(i?.sku)).filter(Boolean))];
    if (!skus.length) return json({ error: "No valid SKUs in items[]" }, 400);

    const products = await supaGetGiftProducts(SUPABASE_URL, SERVICE_KEY, skus);
    const bySku = new Map(products.map((p) => [p.sku, p]));

    // -------- 4) Build Stripe line items --------
    // Stripe Checkout Sessions can use inline price_data with unit_amount/currency. :contentReference[oaicite:2]{index=2}
    const lineItems = [];
    const cartCompact = []; // compact metadata for webhook fulfilment later

    for (const reqItem of items) {
      const sku = asString(reqItem?.sku);
      const qty = toInt(reqItem?.qty, 1);
      if (!sku || qty < 1 || qty > 25) return json({ error: `Invalid qty for sku ${sku}` }, 400);

      const p = bySku.get(sku);
      if (!p) return json({ error: `Unknown SKU: ${sku}` }, 400);
      if (p.is_active !== true) return json({ error: `SKU not active: ${sku}` }, 400);

      // For open_value products, allow amount override
      let unitAmount = Number(p.sale_price_cents);

      if (p.type === "open_value") {
        const amt = toInt(reqItem?.amount_cents, 0);
        // guardrails (adjust as you like)
        if (amt < 2500 || amt > 200000) {
          return json({ error: `Invalid amount_cents for ${sku}. Min 2500, max 200000.` }, 400);
        }
        unitAmount = amt;
      }

      if (!Number.isFinite(unitAmount) || unitAmount < 0) {
        return json({ error: `Invalid price for ${sku}` }, 400);
      }

      const name = asString(p.name) || sku;
      const desc = asString(p.description) || undefined;
      const img = asString(p.image_url) || undefined;

      lineItems.push({
        sku,
        qty,
        unit_amount: unitAmount,
        name,
        description: desc,
        image: img,
        currency: (p.currency || "CAD").toLowerCase(),
      });

      // Compact cart encoding: sku:qty:amount(optional)
      // Example: GIFT-100:1: | OPEN:1:25000
      cartCompact.push(`${sku}:${qty}:${p.type === "open_value" ? unitAmount : ""}`);
    }

    // -------- 5) Create Stripe Checkout Session --------
    // Stripe API expects form-encoded parameters when calling directly via fetch.
    // We'll create line_items with price_data. :contentReference[oaicite:3]{index=3}
    const successUrl = `${ORIGIN}/?gift=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${ORIGIN}/?gift=cancel`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", successUrl);
    form.set("cancel_url", cancelUrl);

    if (purchaser_email) form.set("customer_email", purchaser_email);

    // Session-level metadata is what you’ll read in the webhook fulfilment step. :contentReference[oaicite:4]{index=4}
    form.set("metadata[purpose]", "gift");
    form.set("metadata[cart]", cartCompact.join("|"));
    if (purchaser_email) form.set("metadata[purchaser_email]", purchaser_email);
    if (recipient_email) form.set("metadata[recipient_email]", recipient_email);
    if (recipient_name) form.set("metadata[recipient_name]", recipient_name);

    // Optional: internal reference
    form.set("client_reference_id", `gift_${crypto.randomUUID()}`.slice(0, 200));

    // Add each line item
    lineItems.forEach((li, idx) => {
      form.set(`line_items[${idx}][quantity]`, String(li.qty));
      form.set(`line_items[${idx}][price_data][currency]`, li.currency);
      form.set(`line_items[${idx}][price_data][unit_amount]`, String(li.unit_amount));
      form.set(`line_items[${idx}][price_data][product_data][name]`, li.name);
      if (li.description) form.set(`line_items[${idx}][price_data][product_data][description]`, li.description);
      if (li.image) form.set(`line_items[${idx}][price_data][product_data][images][0]`, li.image);
    });

    const idempotencyKey = `gift_checkout_${crypto.randomUUID()}`;

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": idempotencyKey,
      },
      body: form.toString(),
    });

    const stripeText = await stripeRes.text();
    const stripe = safeJsonText(stripeText);

    if (!stripeRes.ok) {
      return json({ error: "Stripe error creating session", stripe }, 502);
    }

    return json({
      ok: true,
      checkout_url: stripe.url,
      session_id: stripe.id,
    });

  } catch (e) {
    return json({ error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- Helpers ---------------- */

async function safeJson(request) {
  const t = await request.text();
  if (!t) return {};
  try { return JSON.parse(t); } catch { return {}; }
}

function safeJsonText(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function asString(v) {
  if (typeof v !== "string") return "";
  return v.trim();
}

function toInt(v, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
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

async function supaGetGiftProducts(SUPABASE_URL, SERVICE_KEY, skus) {
  // Build: sku=in.(A,B,C)
  const inList = skus.map((s) => `"${s.replace(/"/g, "")}"`).join(",");
  const url = `${SUPABASE_URL}/rest/v1/gift_products?select=sku,type,name,description,package_code,vehicle_size,face_value_cents,sale_price_cents,currency,image_url,is_active&sku=in.(${encodeURIComponent(inList)})`;

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
