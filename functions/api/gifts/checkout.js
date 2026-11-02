// /functions/api/gifts/checkout.js
// Gift checkout -> creates a Stripe Checkout Session.
//
// FIXES (requested):
// - Vehicle photo is RECOMMENDED (optional), not required.
// - Returns to /gifts (not home) after Stripe.
// - Normalizes origin to avoid double slashes.
// - Adds "version" into ALL responses so we can confirm the deployed file.

const VERSION = "gifts_checkout_v741_catalog_safe_retry";

export async function onRequestPost({ request, env }) {
  try {
    const body = await safeJson(request);

    // ---- 1) Validate input ----
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length || items.length > 20) return json({ version: VERSION, error: "Choose 1 to 20 gift items." }, 400);

    // A retry must reuse the same intent id. Stripe rejects different payloads
    // under the same key; the browser only rotates it when the draft changes.
    const checkoutRequestId = asString(body?.checkout_request_id);
    if (checkoutRequestId && !/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(checkoutRequestId)) {
      return json({ version: VERSION, error: "Invalid checkout request reference." }, 400);
    }

    const purchaser_email = asString(body?.purchaser_email);
    const recipient_email = asString(body?.recipient_email);
    const recipient_name = asString(body?.recipient_name);
    const sender_name = asString(body?.sender_name);
    const delivery_date = asString(body?.delivery_date);
    const gift_message = asString(body?.message);

    if (delivery_date && !isValidGiftDeliveryDate(delivery_date)) {
      return json({ version: VERSION, error: "Invalid gift delivery date. Use YYYY-MM-DD." }, 400);
    }

    if (!looksLikeEmail(purchaser_email) || !looksLikeEmail(recipient_email)) {
      return json({ version: VERSION, error: "A valid purchaser and recipient email are required." }, 400);
    }

    const vehicle = body?.vehicle && typeof body.vehicle === "object" ? body.vehicle : null;

    // ---- 2) Server config ----
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const STRIPE_KEY = env.STRIPE_SECRET_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ version: VERSION, error: "Server not configured (Supabase env vars missing)" }, 500);
    }
    if (!STRIPE_KEY) {
      return json({ version: VERSION, error: "Server not configured (Stripe secret missing)" }, 500);
    }

    // ORIGIN: prefer env.SITE_ORIGIN, otherwise infer from request
    const originRaw = env.SITE_ORIGIN || inferOrigin(request) || "https://rosiedazzlers.ca";
    const ORIGIN = stripTrailingSlashes(originRaw);

    // ---- 3) Load gift_products from Supabase ----
    const skus = [...new Set(items.map((i) => asString(i?.sku)).filter(Boolean))];
    if (!skus.length) return json({ version: VERSION, error: "No valid SKUs in items[]" }, 400);

    const products = await supaGetGiftProducts(SUPABASE_URL, SERVICE_KEY, skus);
    const bySku = new Map(products.map((p) => [p.sku, p]));

    const hasServiceGift = products.some((p) => p.type === "service");

    // A service certificate purchases a package and *size*, not an appointment.
    // The recipient supplies full vehicle details during booking; a purchaser
    // may provide them now, but must not be required to know another car's VIN.
    let vYear = "", vMake = "", vModel = "", vBody = "", vSize = "", vPhoto = "";
    if (hasServiceGift) {
      vYear = asString(vehicle?.year);
      vMake = asString(vehicle?.make);
      vModel = asString(vehicle?.model);
      vBody = asString(vehicle?.body_style);
      vSize = asString(vehicle?.declared_size);
      vPhoto = asString(vehicle?.photo_url); // optional

      if (vSize && !['small', 'mid', 'oversize'].includes(vSize)) return json({ version: VERSION, error: 'Invalid vehicle size.' }, 400);
    }

    // ---- 4) Build Stripe line items ----
    const cartCompact = []; // sku:qty:amount(optional)
    const lineItems = [];

    const usedSkus = new Set();
    let totalQty = 0;
    for (const reqItem of items) {
      const sku = asString(reqItem?.sku);
      const qty = Number(reqItem?.qty ?? 1);
      if (!sku || !Number.isSafeInteger(qty) || qty < 1 || qty > 25 || usedSkus.has(sku)) {
        return json({ version: VERSION, error: `Invalid qty for sku ${sku}` }, 400);
      }
      usedSkus.add(sku);
      totalQty += qty;
      if (totalQty > 100) return json({ version: VERSION, error: 'Gift quantity exceeds 100.' }, 400);

      const p = bySku.get(sku);
      if (!p) return json({ version: VERSION, error: `Unknown SKU: ${sku}` }, 400);
      if (p.is_active !== true) return json({ version: VERSION, error: `SKU not active: ${sku}` }, 400);
      if (p.currency !== 'CAD') return json({ version: VERSION, error: `Unsupported currency for ${sku}` }, 400);
      if (p.type === 'service' && (sku !== `SVC-${p.package_code}-${p.vehicle_size}` ||
          (vSize && vSize !== p.vehicle_size))) {
        return json({ version: VERSION, error: `Service gift package or size does not match catalog: ${sku}` }, 400);
      }

      let unitAmount = Number(p.sale_price_cents);

      if (p.type === "open_value") {
        const amt = toInt(reqItem?.amount_cents, 0);
        if (amt < 2500 || amt > 200000) {
          return json({ version: VERSION, error: `Invalid amount_cents for ${sku}. Min 2500, max 200000.` }, 400);
        }
        unitAmount = amt;
      }

      if (!Number.isSafeInteger(unitAmount) || unitAmount <= 0) {
        return json({ version: VERSION, error: `Invalid price for ${sku}` }, 400);
      }

      cartCompact.push(`${sku}:${qty}:${p.type === "open_value" ? unitAmount : ""}`);

      // Stripe line item
      lineItems.push({
        qty,
        currency: (p.currency || "CAD").toLowerCase(),
        unit_amount: unitAmount,
        name: asString(p.name) || sku,
        description: asString(p.description) || "",
        image: asString(p.image_url) || "",
      });
    }

    // ---- 5) Stripe session (return to /gifts) ----
    const successUrl = `${ORIGIN}/gifts?gift=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${ORIGIN}/gifts?gift=cancel`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", successUrl);
    form.set("cancel_url", cancelUrl);
    form.set("customer_email", purchaser_email);
    // With current Stripe APIs this identifies the checkout surface without
    // activating any additional payment method or fulfillment path.
    form.set('integration_identifier', `rosie-gift-${checkoutRequestId ? idLetters(checkoutRequestId) : randomLetters(8)}`);

    // Metadata for webhook fulfilment
    form.set("metadata[purpose]", "gift");
    form.set("metadata[cart]", cartCompact.join("|"));
    form.set("metadata[purchaser_email]", purchaser_email);
    form.set("metadata[recipient_email]", recipient_email);
    if (recipient_name) form.set("metadata[recipient_name]", recipient_name);
    if (sender_name) form.set("metadata[sender_name]", sender_name);
    if (delivery_date) form.set("metadata[delivery_date]", delivery_date);
    if (gift_message) form.set("metadata[gift_message]", gift_message.slice(0, 450));

    // Vehicle metadata (photo optional)
    if (hasServiceGift) {
      if (vYear) form.set("metadata[vehicle_year]", vYear);
      if (vMake) form.set("metadata[vehicle_make]", vMake);
      if (vModel) form.set("metadata[vehicle_model]", vModel);
      if (vBody) form.set("metadata[vehicle_body_style]", vBody);
      if (vSize) form.set("metadata[vehicle_declared_size]", vSize);
      if (vPhoto) form.set("metadata[vehicle_photo_url]", vPhoto.slice(0, 480));
    }

    lineItems.forEach((li, idx) => {
      form.set(`line_items[${idx}][quantity]`, String(li.qty));
      form.set(`line_items[${idx}][price_data][currency]`, li.currency);
      form.set(`line_items[${idx}][price_data][unit_amount]`, String(li.unit_amount));
      form.set(`line_items[${idx}][price_data][product_data][name]`, li.name);
      if (li.description) form.set(`line_items[${idx}][price_data][product_data][description]`, li.description);
      if (li.image) form.set(`line_items[${idx}][price_data][product_data][images][0]`, li.image);
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": `gift_checkout_v741_${checkoutRequestId || crypto.randomUUID()}`,
      },
      body: form.toString(),
    });

    const stripeText = await stripeRes.text();
    const stripe = safeJsonText(stripeText);

    if (!stripeRes.ok) {
      return json({ version: VERSION, error: 'Could not open secure checkout. Your gift draft is safe to retry.' }, 502);
    }

    if (!stripe.id || !/^https:\/\/checkout\.stripe\.com\//.test(String(stripe.url || ''))) {
      return json({ version: VERSION, error: 'Checkout provider returned an incomplete session. Retry with the same draft.' }, 502);
    }

    return json({
      ok: true,
      version: VERSION,
      checkout_url: stripe.url,
      session_id: stripe.id,
      return_success_url: successUrl,
    });

  } catch (e) {
    console.error('Gift checkout failed before verified redirect', e?.message || 'unknown');
    return json({ version: VERSION, error: 'Could not prepare secure checkout. Your gift draft is safe to retry.' }, 503);
  }
}

function isValidGiftDeliveryDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/* ---------------- Helpers ---------------- */

function stripTrailingSlashes(origin) {
  return String(origin || "").replace(/\/+$/, "");
}

function inferOrigin(request) {
  const origin = request.headers.get("origin");
  if (origin && origin.startsWith("http")) return origin;

  const host = request.headers.get("host");
  if (!host) return "";

  let scheme = "https";
  const cfVisitor = request.headers.get("cf-visitor");
  if (cfVisitor) {
    try {
      const obj = JSON.parse(cfVisitor);
      if (obj?.scheme) scheme = obj.scheme;
    } catch {}
  }
  return `${scheme}://${host}`;
}

async function safeJson(request) {
  const t = await request.text();
  if (!t) return {};
  try { return JSON.parse(t); } catch { return {}; }
}

function safeJsonText(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function asString(v) {
  if (typeof v === "number") return String(v);
  if (typeof v !== "string") return "";
  return v.trim();
}

function toInt(v, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function randomLetters(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const data = crypto.getRandomValues(new Uint8Array(length));
  return [...data].map(n => chars[n % chars.length]).join('');
}

function idLetters(uuid) {
  const hex = uuid.replaceAll('-', '').slice(0, 8).toLowerCase();
  return [...hex].map(ch => 'abcdefghijklmnopqrstuvwxyz'[parseInt(ch, 16)]).join('');
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
  const inList = skus.map((s) => `"${s.replace(/"/g, "")}"`).join(",");
  const url =
    `${SUPABASE_URL}/rest/v1/gift_products` +
    `?select=sku,type,name,description,package_code,vehicle_size,face_value_cents,sale_price_cents,currency,image_url,is_active` +
    `&sku=in.(${encodeURIComponent(inList)})`;

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
