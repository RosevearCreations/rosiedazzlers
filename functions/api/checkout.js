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

    // ---- 3) Pricing (EDIT THESE to match your chart) ----
    // IMPORTANT: Put your real numbers here from your CarPrice chart.
    // Values are in cents (CAD).
const PRICING = {
  premium_wash:    { small:  8500, mid: 10500, oversize: 12500 },
  basic_detail:    { small: 11500, mid: 13500, oversize: 17000 },
  complete_detail: { small: 31900, mid: 36900, oversize: 41900 },
  interior_detail: { small: 19500, mid: 22000, oversize: 24500 },
  exterior_detail: { small: 19500, mid: 22000, oversize: 24500 },
};

    // Add-ons (optional). Set to your real add-on prices.
    const ADDONS = {
      engine_bay:     { label: "Engine Bay Detail", cents: 11900 },
      pet_hair:       { label: "Pet Hair Removal",  cents:  8900 },
      odor_treatment: { label: "Odour Treatment",   cents: 12900 },
      // travel fee etc can be handled later based on address
    };

    const base = PRICING?.[body.package_code]?.[body.vehicle_size];
    if (!base) {
      return json({ error: "Unknown package_code or vehicle_size (update PRICING in checkout.js)" }, 400);
    }

    const addonCodes = Array.isArray(body.addon_codes) ? body.addon_codes : [];
    let addonsTotal = 0;
    const addonsChosen = [];
    for (const code of addonCodes) {
      const a = ADDONS[code];
      if (!a) continue;
      addonsTotal += a.cents;
      addonsChosen.push({ code, label: a.label, cents: a.cents });
    }

    const totalCents = base + addonsTotal;

    // Deposit rule (simple, adjust later if you want % deposits)
    // Premium/basic = $50, everything else = $100
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

    // Conflicting bookings? (pending + confirmed reserve slots)
    const bks = await supa(
      "GET",
      `/rest/v1/bookings?select=status,start_slot,duration_slots&service_date=eq.${encodeURIComponent(body.service_date)}&status=in.(pending,confirmed)`
    );
    if (!bks.ok) return json({ error: "Supabase error (bookings)", details: bks }, 500);

    let AM = true, PM = true;
    for (const b of (bks.data || [])) {
      const dur = Number(b.duration_slots);
      if (dur === 2) { AM = false; PM = false; break; }
      if (dur === 1 && b.start_slot === "AM") AM = false;
      if (dur === 1 && b.start_slot === "PM") PM = false;
    }
    const want = body.start_slot;
    const okSlot = (want === "AM" ? AM : PM);

    // full-day requires both slots available
    const okFullDay = duration === 2 ? (AM && PM) : true;

    if (!okSlot || !okFullDay) {
      return json({ error: "Selected slot not available", availability: { AM, PM } }, 409);
    }

    // ---- 5) Create pending booking (no stripe id yet) ----
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
      waiver_user_agent: request.headers.get("user-agent") || null,
      // waiver_ip can be added later from CF headers if you want
    };

    const ins = await supa("POST", "/rest/v1/bookings", bookingPayload);
    if (!ins.ok) return json({ error: "Supabase insert failed", details: ins }, 500);

    const booking = ins.data?.[0];
    if (!booking?.id) return json({ error: "Booking insert returned no id", details: ins }, 500);

    // ---- 6) Create Stripe Checkout Session for deposit ----
    const origin = "https://rosiedazzlers.ca"; // keep stable
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
    form.set("line_items[0][price_data][product_data][description]", `${body.package_code} (${body.vehicle_size}) - ${body.service_date} ${body.start_slot}`);

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

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}
