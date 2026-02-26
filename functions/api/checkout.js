// functions/api/checkout.js
// POST /api/checkout
// Creates a pending booking in Supabase, then creates a Stripe Checkout Session for the deposit,
// then returns checkout_url.
//
// Rules:
// - confirmed bookings always block
// - pending bookings block only if created within HOLD_MINUTES
// - full-day (duration_slots=2) requires AM+PM
// - half-day (duration_slots=1) reserves AM or PM only
//
// Pricing source: Rosie Costings - Car Costing.csv
// Includes source: Rosie Costings - Car details.csv (used in site display, not needed here)

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    // Read raw body first to prevent "Unexpected end of JSON input"
    const raw = await request.text();
    if (!raw) return corsJson({ error: "Missing JSON body" }, 400);

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return corsJson({ error: "Invalid JSON body" }, 400);
    }

    // ---- 1) Validate input ----
    const required = [
      "service_date",
      "start_slot",
      "duration_slots",
      "service_area",
      "package_code",
      "vehicle_size",
      "customer_name",
      "customer_email",
      "address_line1",
    ];
    for (const k of required) {
      if (!body?.[k]) return corsJson({ error: `Missing ${k}` }, 400);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.service_date)) {
      return corsJson({ error: "service_date must be YYYY-MM-DD" }, 400);
    }
    if (!["AM", "PM"].includes(body.start_slot)) {
      return corsJson({ error: "start_slot must be AM or PM" }, 400);
    }

    const duration = Number(body.duration_slots);
    if (![1, 2].includes(duration)) {
      return corsJson({ error: "duration_slots must be 1 or 2" }, 400);
    }

    if (!["Norfolk", "Oxford"].includes(body.service_area)) {
      return corsJson({ error: "service_area must be Norfolk or Oxford" }, 400);
    }

    if (!["small", "mid", "oversize"].includes(body.vehicle_size)) {
      return corsJson({ error: "vehicle_size must be small, mid, or oversize" }, 400);
    }

    // Required acknowledgements (must be true)
    const acks = ["ack_driveway", "ack_power_water", "ack_bylaw", "ack_cancellation"];
    for (const a of acks) {
      if (body[a] !== true) return corsJson({ error: `Missing acknowledgement: ${a}` }, 400);
    }

    // ---- 2) Server config ----
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const STRIPE_KEY = env.STRIPE_SECRET_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return corsJson({ error: "Server not configured (Supabase env vars missing)" }, 500);
    }
    if (!STRIPE_KEY) {
      return corsJson({ error: "Server not configured (Stripe secret missing)" }, 500);
    }

    // ---- 3) Pricing (FROM YOUR CSV) ----
    // Values are cents (CAD).
    // Matches: Premium Wash $85/$105/$125; Basic Detail $115/$135/$170; Complete $319/$369/$419; Interior $195/$220/$245; Exterior $195/$220/$245
    const PRICING = {
      premium_wash: { small: 8500, mid: 10500, oversize: 12500 },
      basic_detail: { small: 11500, mid: 13500, oversize: 17000 }, // your sheet calls it "Basic Detail (Quick Interior clean)"
      complete_detail: { small: 31900, mid: 36900, oversize: 41900 },
      interior_detail: { small: 19500, mid: 22000, oversize: 24500 },
      exterior_detail: { small: 19500, mid: 22000, oversize: 24500 },
    };

    // ---- 4) Add-ons ----
    // Priced add-ons add to total_cents.
    // Quote add-ons are recorded in the booking but do NOT change price_total_cents.
    // (You can later set exact prices when you finalize add-on pricing.)
    const ADDONS = {
      // priced (you can adjust these)
      engine_bay: { label: "Engine Bay Detail", cents: 5900 },
      headlight_restoration: { label: "Headlight Restoration (pair)", cents: 6900 },
      pet_hair: { label: "Pet Hair Removal (base)", cents: 4900 }, // chart shows a range; this is a base/starting price
      stain_extraction: { label: "Stain Extraction (per stain)", cents: 2500 },
      hard_water_spots: { label: "Hard Water Spot Removal (base)", cents: 5000 },

      // quote-based / interpret later
      ceramic_coat: { label: "Ceramic Coating (quote)", cents: null, quote: true },
      graphene_finish: { label: "Graphene Fine Finish (quote)", cents: null, quote: true },
      external_wax: { label: "External Wax (quote)", cents: null, quote: true },
      deionize: { label: "De-Ionizing Vehicle (quote)", cents: null, quote: true },
      debadging: { label: "Debadging (quote)", cents: null, quote: true },
      engine_cleaning: { label: "Engine Cleaning (quote)", cents: null, quote: true },
      vinyl_wrapping: { label: "Vinyl Wrapping (quote)", cents: null, quote: true },
      window_tinting: { label: "Window Tinting (quote)", cents: null, quote: true },

      // services not included in any package (optional upgrade list)
      full_clay_treatment: { label: "Full Clay Treatment (quote)", cents: null, quote: true },
      two_stage_polish: { label: "Two Stage Polish (quote)", cents: null, quote: true },
      high_grade_paint_sealant: { label: "High Grade Paint Sealant (quote)", cents: null, quote: true },
      uv_protectant_panels: { label: "UV Protectant on Interior Panels (quote)", cents: null, quote: true },
    };

    // ---- 5) Determine base price ----
    const base = PRICING?.[body.package_code]?.[body.vehicle_size];
    if (!base) {
      return corsJson(
        { error: "Unknown package_code or vehicle_size (update PRICING in checkout.js)" },
        400
      );
    }

    // ---- 6) Add-ons calculation ----
    const addonCodes = Array.isArray(body.addon_codes) ? body.addon_codes : [];
    let addonsTotal = 0;
    const addonsChosen = [];

    const quoteAddonsChosen = [];

    for (const code of addonCodes) {
      const a = ADDONS[code];
      if (!a) continue;

      const item = {
        code,
        label: a.label,
        cents: a.cents,
        quote_required: a.cents == null || a.quote === true,
      };
      addonsChosen.push(item);

      if (item.quote_required) {
        quoteAddonsChosen.push(item.label);
      } else {
        addonsTotal += a.cents;
      }
    }

    const totalCents = base + addonsTotal;

    // Deposit rule (keep simple and consistent)
    // Premium Wash + Basic Detail = $50 deposit; everything else = $100 deposit
    const depositCents =
      ["premium_wash", "basic_detail"].includes(body.package_code) ? 5000 : 10000;

    // ---- 7) Supabase helper ----
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
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    // ---- 8) Check blocked date ----
    const blk = await supa(
      "GET",
      `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(
        body.service_date
      )}`
    );
    if (!blk.ok) return corsJson({ error: "Supabase error (date_blocks)", details: blk }, 500);

    if (Array.isArray(blk.data) && blk.data.length > 0) {
      return corsJson(
        { error: "Date is blocked", reason: blk.data[0]?.reason ?? "Blocked" },
        409
      );
    }

    // ---- 9) Availability check with hold timeout ----
    const HOLD_MINUTES = 30;
    const holdSince = new Date(Date.now() - HOLD_MINUTES * 60 * 1000).toISOString();

    // Best-effort cleanup: mark *old* pending holds as failed for this date
    await supa(
      "PATCH",
      `/rest/v1/bookings?service_date=eq.${encodeURIComponent(
        body.service_date
      )}&status=eq.pending&created_at=lt.${encodeURIComponent(holdSince)}`,
      { status: "failed" }
    );

    const confirmed = await supa(
      "GET",
      `/rest/v1/bookings?select=status,start_slot,duration_slots&service_date=eq.${encodeURIComponent(
        body.service_date
      )}&status=eq.confirmed`
    );
    if (!confirmed.ok) {
      return corsJson({ error: "Supabase error (confirmed)", details: confirmed }, 500);
    }

    const pending = await supa(
      "GET",
      `/rest/v1/bookings?select=status,start_slot,duration_slots,created_at&service_date=eq.${encodeURIComponent(
        body.service_date
      )}&status=eq.pending&created_at=gte.${encodeURIComponent(holdSince)}`
    );
    if (!pending.ok) {
      return corsJson({ error: "Supabase error (pending)", details: pending }, 500);
    }

    const rows = [...(confirmed.data || []), ...(pending.data || [])];

    let AM = true;
    let PM = true;

    for (const b of rows) {
      const dur = Number(b.duration_slots);
      if (dur === 2) {
        AM = false;
        PM = false;
        break;
      }
      if (dur === 1 && b.start_slot === "AM") AM = false;
      if (dur === 1 && b.start_slot === "PM") PM = false;
    }

    const want = body.start_slot;
    const okSlot = want === "AM" ? AM : PM;
    const okFullDay = duration === 2 ? AM && PM : true;

    if (!okSlot || !okFullDay) {
      return corsJson(
        {
          error: "Selected slot not available",
          availability: { AM, PM },
          hold_minutes: HOLD_MINUTES,
        },
        409
      );
    }

    // ---- 10) Insert pending booking ----
    const ip = request.headers.get("cf-connecting-ip") || null;

    const notes = [];
    if (quoteAddonsChosen.length) {
      notes.push(`Quote add-ons requested: ${quoteAddonsChosen.join(", ")}`);
    }

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

      addons: addonsChosen,
      currency: "CAD",
      price_total_cents: totalCents,
      deposit_cents: depositCents,

      ack_driveway: true,
      ack_power_water: true,
      ack_bylaw: true,
      ack_cancellation: true,

      waiver_accepted_at: new Date().toISOString(),
      waiver_ip: ip,
      waiver_user_agent: request.headers.get("user-agent") || null,

      notes: notes.length ? notes.join(" | ") : null,
    };

    const ins = await supa("POST", "/rest/v1/bookings", bookingPayload);
    if (!ins.ok) return corsJson({ error: "Supabase insert failed", details: ins }, 500);

    const booking = ins.data?.[0];
    if (!booking?.id) return corsJson({ error: "Booking insert returned no id", details: ins }, 500);

    // ---- 11) Create Stripe Checkout Session (deposit) ----
    // Use current origin (works for pages.dev and custom domain)
    const origin = new URL(request.url).origin;
    const successUrl = `${origin}/?checkout=success&bid=${booking.id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?checkout=cancel&bid=${booking.id}`;

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
    form.set(
      "line_items[0][price_data][product_data][description]",
      `${body.package_code} (${body.vehicle_size}) - ${body.service_date} ${body.start_slot}`
    );

    // Metadata so webhook can confirm the right booking
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
      return corsJson({ error: "Stripe error creating session", stripe }, 502);
    }

    // ---- 12) Update booking with stripe session id ----
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

    // ---- 13) Return checkout url ----
    return corsJson({
      ok: true,
      booking_id: booking.id,
      deposit_cents: depositCents,
      total_cents: totalCents,
      checkout_url: stripe.url,
      hold_minutes: HOLD_MINUTES,
      quote_addons: quoteAddonsChosen, // helpful for UI
    });
  } catch (e) {
    return corsJson({ error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- helpers ---------------- */

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
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
