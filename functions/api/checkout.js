// /functions/api/checkout.js
// REPLACE ENTIRE FILE
//
// Booking checkout endpoint (deposit via Stripe).
//
// Updates made vs earlier versions:
// - Accepts optional vehicle object and stores it on bookings.vehicle (JSON)
// - Accepts optional gift_code + promo_code (stored for future discount system)
// - Computes subtotal_cents so admin UI can show breakdown
// - Keeps pricing aligned with your chart (Premium/Basic/Complete/Interior/Exterior)
// - Returns { checkout_url } to redirect to Stripe
//
// Required env vars:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - STRIPE_SECRET_KEY  (set per environment: sk_test_... in Preview, sk_live_... in Production)

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    // ---- 1) Validate input ----
    const required = [
      "service_date", "start_slot", "duration_slots",
      "service_area", "package_code", "vehicle_size",
      "customer_name", "customer_email",
      "address_line1"
    ];
    for (const k of required) {
      if (!body?.[k]) return json({ error: `Missing ${k}` }, 400);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.service_date)) {
      return json({ error: "service_date must be YYYY-MM-DD" }, 400);
    }
    if (!["AM", "PM"].includes(body.start_slot)) {
      return json({ error: "start_slot must be AM or PM" }, 400);
    }
    const duration = Number(body.duration_slots);
    if (![1, 2].includes(duration)) {
      return json({ error: "duration_slots must be 1 or 2" }, 400);
    }
    if (!["Norfolk", "Oxford"].includes(body.service_area)) {
      return json({ error: "service_area must be Norfolk or Oxford" }, 400);
    }
    if (!["small", "mid", "oversize"].includes(body.vehicle_size)) {
      return json({ error: "vehicle_size must be small, mid, or oversize" }, 400);
    }

    // Required acknowledgements (enforced)
    const acks = ["ack_driveway", "ack_power_water", "ack_bylaw", "ack_cancellation"];
    for (const a of acks) {
      if (body[a] !== true) return json({ error: `Missing acknowledgement: ${a}` }, 400);
    }

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

    // ---- 3) Pricing (CAD cents) ----
    const PRICING = {
      premium_wash:     { small:  8500, mid: 10500, oversize: 12500 },
      basic_detail:     { small: 11500, mid: 13500, oversize: 17000 },
      complete_detail:  { small: 31900, mid: 36900, oversize: 41900 },
      interior_detail:  { small: 19500, mid: 22000, oversize: 24500 },
      exterior_detail:  { small: 19500, mid: 22000, oversize: 24500 },
    };

    // Add-ons (optional). Some are quote_required (not charged online).
    // This list matches your services JSON choices.
    const ADDONS = {
      full_clay_treatment: { label: "Full Clay Treatment", prices: { small: 7900, mid: 9900, oversize: 12900 }, quote_required: false },
      two_stage_polish: { label: "Two Stage Polish", prices: { small: 19900, mid: 27900, oversize: 35900 }, quote_required: true },
      high_grade_paint_sealant: { label: "High Grade Paint Sealant", prices: { small: 5900, mid: 7900, oversize: 9900 }, quote_required: false },
      uv_protectant_applied_on_interior_panels: { label: "UV Protectant Applied on Interior Panels", prices: { small: 2500, mid: 3500, oversize: 4500 }, quote_required: false },

      de_ionizing_treatment: { label: "De-Ionizing Treatment", quote_required: true },
      de_badging: { label: "De-Badging", quote_required: true },
      engine_cleaning: { label: "Engine Cleaning", price: 5900, quote_required: false },
      external_ceramic_coating: { label: "External Ceramic Coating", quote_required: true },
      external_graphene_fine_finish: { label: "External Graphene Fine Finish", quote_required: true },
      external_wax: { label: "External Wax", prices: { small: 4900, mid: 5900, oversize: 6900 }, quote_required: false },
      vinyl_wrapping: { label: "Vinyl Wrapping", quote_required: true },
      window_tinting: { label: "Window Tinting", quote_required: true },
    };

    const base = PRICING?.[body.package_code]?.[body.vehicle_size];
    if (!base) {
      return json({ error: "Unknown package_code or vehicle_size (update PRICING in /api/checkout.js)" }, 400);
    }

    const addonCodes = Array.isArray(body.addon_codes) ? body.addon_codes : [];
    let addonsTotal = 0;
    const addonsChosen = [];
    const quoteOnly = [];

    for (const code of addonCodes) {
      const a = ADDONS[code];
      if (!a) continue;

      if (a.quote_required) {
        quoteOnly.push(code);
        addonsChosen.push({ code, label: a.label, quote_required: true });
        continue;
      }

      let cents = null;
      if (typeof a.price === "number") cents = a.price;
      else if (a.prices && typeof a.prices[body.vehicle_size] === "number") cents = a.prices[body.vehicle_size];

      if (typeof cents === "number") {
        addonsTotal += cents;
        addonsChosen.push({ code, label: a.label, cents, quote_required: false });
      }
    }

    const subtotalCents = base + addonsTotal;
    const totalCents = subtotalCents; // no discounts applied yet (future promo/gift system)

    // Deposit rule
    const depositCents =
      ["premium_wash", "basic_detail"].includes(body.package_code) ? 5000 : 10000;

    // ---- 4) Availability check (blocks + existing bookings) ----
    const supa = async (method, path, payload) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method,
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      if (!res.ok) return { ok: false, status: res.status, data, raw: text };
      return { ok: true, status: res.status, data };
    };

    // Date blocked?
    const blk = await supa(
      "GET",
      `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(body.service_date)}`
    );
    if (!blk.ok) return json({ error: "Supabase error (date_blocks)", details: blk }, 500);
    if (Array.isArray(blk.data) && blk.data.length > 0) {
      return json({ error: "Date is blocked", reason: blk.data[0].reason ?? "Blocked" }, 409);
    }

    // Slot blocked?
    const sblk = await supa(
      "GET",
      `/rest/v1/slot_blocks?select=blocked_date,slot,reason&blocked_date=eq.${encodeURIComponent(body.service_date)}`
    );
    if (!sblk.ok) return json({ error: "Supabase error (slot_blocks)", details: sblk }, 500);

    const blockedSlots = new Set((sblk.data || []).map(r => String(r.slot || "").toUpperCase()));
    if (blockedSlots.has(body.start_slot)) {
      return json({ error: "Selected slot is blocked", slot: body.start_slot }, 409);
    }
    if (duration === 2 && (blockedSlots.has("AM") || blockedSlots.has("PM"))) {
      return json({ error: "Full-day not available (slot blocked)", blocked: Array.from(blockedSlots) }, 409);
    }

    // Conflicting bookings? (pending + confirmed reserve slots)
    const bks = await supa(
      "GET",
      `/rest/v1/bookings?select=status,start_slot,duration_slots&service_date=eq.${encodeURIComponent(body.service_date)}&status=in.(pending,confirmed)`
    );
    if (!bks.ok) return json({ error: "Supabase error (bookings)", details: bks }, 500);

    let AM = !blockedSlots.has("AM"), PM = !blockedSlots.has("PM");
    for (const b of (bks.data || [])) {
      const dur = Number(b.duration_slots);
      if (dur === 2) { AM = false; PM = false; break; }
      if (dur === 1 && b.start_slot === "AM") AM = false;
      if (dur === 1 && b.start_slot === "PM") PM = false;
    }

    const want = body.start_slot;
    const okSlot = (want === "AM" ? AM : PM);
    const okFullDay = duration === 2 ? (AM && PM) : true;

    if (!okSlot || !okFullDay) {
      return json({ error: "Selected slot not available", availability: { AM, PM } }, 409);
    }

    // ---- 5) Create pending booking (no stripe id yet) ----
    // Optional vehicle object stored on booking.vehicle JSON
    const vehicle = normalizeVehicle(body.vehicle);

    const bookingPayload = {
      status: "pending",
      service_date: body.service_date,
      start_slot: body.start_slot,
      duration_slots: duration,

      service_area: body.service_area,
      package_code: body.package_code,
      vehicle_size: body.vehicle_size,

      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone ?? null,

      address_line1: body.address_line1,
      city: body.city ?? null,
      postal_code: body.postal_code ?? null,

      vehicle, // JSON (nullable)
      addons: addonsChosen, // JSON
      quote_addons: quoteOnly, // JSON array (optional column)
      currency: "CAD",

      subtotal_cents: subtotalCents,
      price_total_cents: totalCents,
      deposit_cents: depositCents,

      gift_code: body.gift_code ?? null,
      promo_code: body.promo_code ?? null,

      ack_driveway: true,
      ack_power_water: true,
      ack_bylaw: true,
      ack_cancellation: true,

      waiver_accepted_at: new Date().toISOString(),
      waiver_user_agent: request.headers.get("user-agent") || null,
    };

    const ins = await supa("POST", "/rest/v1/bookings", bookingPayload);
    if (!ins.ok) return json({ error: "Supabase insert failed", details: ins }, 500);

    const booking = ins.data?.[0];
    if (!booking?.id) return json({ error: "Booking insert returned no id", details: ins }, 500);

    // ---- 6) Create Stripe Checkout Session for deposit ----
    const origin = "https://rosiedazzlers.ca"; // stable for success/cancel
    const successUrl = `${origin}/?checkout=success&bid=${booking.id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${origin}/?checkout=cancel&bid=${booking.id}`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", successUrl);
    form.set("cancel_url", cancelUrl);
    form.set("customer_email", body.customer_email);

    // One line item: deposit
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", "cad");
    form.set("line_items[0][price_data][unit_amount]", String(depositCents));
    form.set("line_items[0][price_data][product_data][name]", "Rosie Dazzlers Booking Deposit");

    const descParts = [
      `${body.package_code} (${body.vehicle_size})`,
      `${body.service_date} ${body.start_slot}`,
      vehicle ? `${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""}`.trim() : "",
    ].filter(Boolean);

    form.set("line_items[0][description]", descParts.join(" - ").slice(0, 400));

    // Helpful metadata
    form.set("metadata[booking_id]", booking.id);
    form.set("metadata[service_date]", body.service_date);
    form.set("metadata[package_code]", body.package_code);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const stripeText = await stripeRes.text();
    const stripe = safeJson(stripeText);

    if (!stripeRes.ok) {
      return json({ error: "Stripe error creating session", stripe }, 502);
    }

    // ---- 7) Update booking with stripe session id ----
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${booking.id}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ stripe_session_id: stripe.id }),
    });

    // ---- 8) Return checkout url ----
    return json({
      ok: true,
      booking_id: booking.id,
      deposit_cents: depositCents,
      total_cents: totalCents,
      checkout_url: stripe.url,
    });

  } catch (e) {
    return json({ error: "Server error", details: String(e) }, 500);
  }
}

function normalizeVehicle(v) {
  if (!v || typeof v !== "object") return null;
  const year = v.year != null ? Number(v.year) : null;
  const make = v.make != null ? String(v.make).trim() : "";
  const model = v.model != null ? String(v.model).trim() : "";
  const plate = v.plate != null ? String(v.plate).trim() : "";
  const mileage = v.mileage != null && v.mileage !== "" ? Number(v.mileage) : null;
  const photo_url = v.photo_url != null ? String(v.photo_url).trim() : "";

  // Keep only meaningful content
  const out = {
    year: Number.isFinite(year) ? year : null,
    make: make || null,
    model: model || null,
    plate: plate || null,
    mileage: Number.isFinite(mileage) ? mileage : null,
    photo_url: photo_url || null,
  };

  // If all null, return null
  const any = Object.values(out).some(x => x != null);
  return any ? out : null;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
}
