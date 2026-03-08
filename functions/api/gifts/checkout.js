// /functions/api/gifts/checkout.js
// Creates Stripe Checkout Sessions for gift purchases.
// FIXES:
// 1) Vehicle photo is OPTIONAL (recommended) for service gifts.
// 2) Success/cancel always returns to /gifts (not home).
// 3) Avoids double slashes by normalizing origin (removes trailing /).

export async function onRequestPost({ request, env }) {
  try {
    const body = await safeJson(request);

    // ---- 1) Validate input ----
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) return json({ error: "Missing items[]" }, 400);

    const purchaser_email = asString(body?.purchaser_email);
    const recipient_email = asString(body?.recipient_email);
    const recipient_name = asString(body?.recipient_name);

    if (!purchaser_email) return json({ error: "Missing purchaser_email" }, 400);
    if (!recipient_email) return json({ error: "Missing recipient_email" }, 400);

    const vehicle = body?.vehicle && typeof body.vehicle === "object" ? body.vehicle : null;

    // ---- 2) Server config ----
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const STRIPE_KEY = env.STRIPE_SECRET_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ error: "Server not configured (Supabase env vars missing)" }, 500);
    }
    if (!STRIPE_KEY) {
      return json({ error: "Server not configured (Stripe secret missing)" }, 500);
    }

    // ORIGIN: prefer env.SITE_ORIGIN, otherwise infer from request
    const inferredOrigin = inferOrigin(request);
    const originRaw = env.SITE_ORIGIN || inferredOrigin || "https://rosiedazzlers.ca";
    const ORIGIN = stripTrailingSlashes(originRaw);

    // ---- 3) Load gift_products from Supabase ----
    const skus = [...new Set(items.map((i) => asString(i?.sku)).filter(Boolean))];
    if (!skus.length) return json({ error: "No valid SKUs in items[]" }, 400);

    const products = await supaGetGiftProducts(SUPABASE_URL, SERVICE_KEY, skus);
    const bySku = new Map(products.map((p) => [p.sku, p]));

    // Determine if cart contains ANY service gifts
    const hasServiceGift = products.some((p) => p.type === "service");

    // If service gift exists, require vehicle object fields (photo OPTIONAL)
    let vYear = "", vMake = "", vModel = "", vBody = "", vSize = "", vPhoto = "";
    if (hasServiceGift) {
      vYear = asString(vehicle?.year);
      vMake = asString(vehicle?.make);
      vModel = asString(vehicle?.model);
      vBody = asString(vehicle?.body_style);
      vSize = asString(vehicle?.declared_size);
      vPhoto = asString(vehicle?.photo_url); // OPTIONAL

      if (!vYear || !vMake || !vModel || !vBody || !vSize) {
        return json(
          {
            error: "Missing vehicle info for service gift purchase",
            required: [
              "vehicle.year",
              "vehicle.make",
              "vehicle.model",
              "vehicle.body_style",
              "vehicle.declared_size"
            ],
            optional: ["vehicle.photo_url"]
          },
          400
        );
      }
    }

    // ---- 4) Build Stripe line items ----
    const lineItems = [];
    const cartCompact = []; // sku:qty:amount(optional)

    for (const reqItem of items) {
      const sku = asString(reqItem?.sku);
      const qty = toInt(reqItem?.qty, 1);
      if (!sku || qty < 1 || qty > 25) return json({ error: `Invalid qty for sku ${sku}` }, 400);

      const p = bySku.get(sku);
      if (!p) return json({ error: `Unknown SKU: ${sku}` }, 400);
      if (p.is_active !== true) return json({ error: `SKU not active: ${sku}` }, 400);

      let unitAmount = Number(p.sale_price_cents);

      if (p.type === "open_value") {
        const amt = toInt(reqItem?.amount_cents, 0);
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

      cartCompact.push(`${sku}:${qty}:${p.type === "open_value" ? unitAmount : ""}`);
    }

    // ---- 5) Create Stripe Checkout Session ----
    // FIX: always return to /gifts so receipt UI can show codes
    const successUrl = `${ORIGIN}/gifts?gift=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${ORIGIN}/gifts?gift=cancel`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", successUrl);
    form.set("cancel_url", cancelUrl);
    form.set("customer_email", purchaser_email);

    // Session metadata (used by webhook fulfilment)
    form.set("metadata[purpose]", "gift");
    form.set("metadata[cart]", cartCompact.join("|"));
    form.set("metadata[purchaser_email]", purchaser_email);
    form.set("metadata[recipient_email]", recipient_email);
    if (recipient_name) form.set("metadata[recipient_name]", recipient_name);

    // Vehicle metadata (photo OPTIONAL)
    if (hasServiceGift) {
      form.set("metadata[vehicle_year]", vYear);
      form.set("metadata[vehicle_make]", vMake);
      form.set("metadata[vehicle_model]", vModel);
      form.set("metadata[vehicle_body_style]", vBody);
      form.set("metadata[vehicle_declared_size]", vSize);
      if (vPhoto) form.set("metadata[vehicle_photo_url]", vPhoto.slice(0, 480));
    }

    form.set("client_reference_id", `gift_${crypto.randomUUID()}`.slice(0, 200));

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
        "Idempotency-Key": `gift_checkout_${crypto.randomUUID()}`,
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
      version: "gifts_checkout_v4_photo_optional_and_return_fix",
      checkout_url: stripe.url,
      session_id: stripe.id,
      return_origin: ORIGIN,
      return_success_url: successUrl
    });
  } catch (e) {
    return json({ error: "Server error", details: String(e) }, 500);
  }
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
