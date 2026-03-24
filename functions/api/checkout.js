// functions/api/checkout.js
// REPLACE ENTIRE FILE
//
// POST /api/checkout
// Creates a pending booking in Supabase, creates a Stripe Checkout Session for the deposit,
// then returns checkout_url.
//
// Updates in this version:
// - Enforces vehicle Year/Make/Model BEFORE Stripe (photo recommended, not required)
// - Respects slot_blocks (AM/PM) in addition to bookings/date_blocks
// - Supports promo_code (percent or amount) from public.promo_codes
//   * Promo reduces the TOTAL (price_total_cents), but DOES NOT reduce the deposit charged today
//   * Promo is recorded in booking notes + Stripe metadata (no DB schema change required)
//
// Rules:
// - confirmed bookings always block
// - pending bookings block only if created within HOLD_MINUTES
// - full-day (duration_slots=2) requires both AM + PM
// - half-day (duration_slots=1) reserves AM or PM only
//
// IMPORTANT:
// This file is aligned to:
// /data/rosie_services_pricing_and_packages.json

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
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

    // Mandatory acknowledgements
    const acks = ["ack_driveway", "ack_power_water", "ack_bylaw", "ack_cancellation"];
    for (const a of acks) {
      if (body[a] !== true) return corsJson({ error: `Missing acknowledgement: ${a}` }, 400);
    }

    // Mandatory vehicle intake (photo recommended, not required)
    const vehicle = body.vehicle || {};
    const vYear = Number(vehicle.year);
    const vMake = String(vehicle.make || "").trim();
    const vModel = String(vehicle.model || "").trim();
    const vPhoto = String(vehicle.photo_url || "").trim() || null;

    if (!Number.isFinite(vYear) || vYear < 1950 || vYear > 2100) {
      return corsJson({ error: "Missing/invalid vehicle.year" }, 400);
    }
    if (!vMake) return corsJson({ error: "Missing vehicle.make" }, 400);
    if (!vModel) return corsJson({ error: "Missing vehicle.model" }, 400);

    // Optional codes
    const promoCodeRaw = String(body.promo_code || "").trim();
    const promoCode = promoCodeRaw ? promoCodeRaw.toUpperCase() : null;
    const giftCode = String(body.gift_code || "").trim() || null;

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

    // ---- 3) Package pricing (matches your corrected pricing) ----
    // cents CAD
    const PRICING = {
      premium_wash: { small: 8500, mid: 10500, oversize: 12500 },
      basic_detail: { small: 11500, mid: 13500, oversize: 17000 },
      complete_detail: { small: 31900, mid: 36900, oversize: 41900 },
      interior_detail: { small: 19500, mid: 22000, oversize: 24500 },
      exterior_detail: { small: 19500, mid: 22000, oversize: 24500 },
    };

    // ---- 4) Add-ons aligned to your generated JSON ----
    // If quote_required is true, it is recorded but not charged online.
    // If price is present and quote_required is false, it is added to total.
    const ADDONS = {
      full_clay_treatment: {
        label: "Full Clay Treatment",
        prices_cents: { small: 7900, mid: 9900, oversize: 12900 },
        quote_required: false,
      },
      two_stage_polish: {
        label: "Two Stage Polish",
        prices_cents: { small: 19900, mid: 27900, oversize: 35900 },
        quote_required: true,
      },
      high_grade_paint_sealant: {
        label: "High Grade Paint Sealant",
        prices_cents: { small: 5900, mid: 7900, oversize: 9900 },
        quote_required: false,
      },
      uv_protectant_applied_on_interior_panels: {
        label: "UV Protectant Applied on Interior Panels",
        prices_cents: { small: 2500, mid: 3500, oversize: 4500 },
        quote_required: false,
      },
      de_ionizing_treatment: { label: "De-Ionizing Treatment", quote_required: true },
      de_badging: { label: "De-Badging", quote_required: true },
      engine_cleaning: { label: "Engine Cleaning", price_cents: 5900, quote_required: false },
      external_ceramic_coating: { label: "External Ceramic Coating", quote_required: true },
      external_graphene_fine_finish: { label: "External Graphene Fine Finish", quote_required: true },
      external_wax: {
        label: "External Wax",
        prices_cents: { small: 4900, mid: 5900, oversize: 6900 },
        quote_required: false,
      },
      vinyl_wrapping: { label: "Vinyl Wrapping", quote_required: true },
      window_tinting: { label: "Window Tinting", quote_required: true },
    };

    // ---- 5) Base price ----
    const base = PRICING?.[body.package_code]?.[body.vehicle_size];
    if (!base) {
      return corsJson({ error: "Unknown package_code or vehicle_size" }, 400);
    }

    // ---- 6) Add-on calculation ----
    const addonCodes = Array.isArray(body.addon_codes) ? body.addon_codes : [];
    let addonsTotal = 0;
    const addonsChosen = [];
    const quoteAddonsChosen = [];

    for (const code of addonCodes) {
      const a = ADDONS[code];
      if (!a) continue;

      let cents = null;

      if (a.price_cents != null) {
        cents = a.price_cents;
      } else if (a.prices_cents?.[body.vehicle_size] != null) {
        cents = a.prices_cents[body.vehicle_size];
      }

      const item = {
        code,
        label: a.label,
        cents,
        quote_required: a.quote_required === true,
      };

      addonsChosen.push(item);

      if (item.quote_required) {
        quoteAddonsChosen.push(item.label);
      } else if (typeof cents === "number") {
        addonsTotal += cents;
      }
    }

    let totalCents = base + addonsTotal;

    // ---- 7) Deposit rule ----
    // Premium Wash / Basic Detail = $50
    // Full-day detail packages = $100
    const depositCents = ["premium_wash", "basic_detail"].includes(body.package_code) ? 5000 : 10000;

    // ---- 8) Supabase helper ----
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

    // ---- 9) Check blocked date ----
    const blk = await supa(
      "GET",
      `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(body.service_date)}`
    );

    if (!blk.ok) return corsJson({ error: "Supabase error (date_blocks)", details: blk }, 500);

    if (Array.isArray(blk.data) && blk.data.length > 0) {
      return corsJson({ error: "Date is blocked", reason: blk.data[0]?.reason ?? "Blocked" }, 409);
    }

    // ---- 9.5) Slot blocks (AM/PM) ----
    const slotBlocks = await supa(
      "GET",
      `/rest/v1/slot_blocks?select=blocked_date,slot,reason&blocked_date=eq.${encodeURIComponent(body.service_date)}`
    );
    if (!slotBlocks.ok) return corsJson({ error: "Supabase error (slot_blocks)", details: slotBlocks }, 500);

    let slotAM = true;
    let slotPM = true;
    for (const s of slotBlocks.data || []) {
      const slot = String(s.slot || "").toUpperCase();
      if (slot === "AM") slotAM = false;
      if (slot === "PM") slotPM = false;
    }

    // ---- 10) Availability with hold timeout ----
    const HOLD_MINUTES = 30;
    const holdSince = new Date(Date.now() - HOLD_MINUTES * 60 * 1000).toISOString();

    // clean old pending (optional field "failed" may not exist as enum; fallback to cancelled-like)
    await supa(
      "PATCH",
      `/rest/v1/bookings?service_date=eq.${encodeURIComponent(body.service_date)}&status=eq.pending&created_at=lt.${encodeURIComponent(
        holdSince
      )}`,
      { status: "cancelled" }
    );

    const confirmed = await supa(
      "GET",
      `/rest/v1/bookings?select=status,start_slot,duration_slots&service_date=eq.${encodeURIComponent(body.service_date)}&status=eq.confirmed`
    );
    if (!confirmed.ok) return corsJson({ error: "Supabase error (confirmed)", details: confirmed }, 500);

    const pending = await supa(
      "GET",
      `/rest/v1/bookings?select=status,start_slot,duration_slots,created_at&service_date=eq.${encodeURIComponent(
        body.service_date
      )}&status=eq.pending&created_at=gte.${encodeURIComponent(holdSince)}`
    );
    if (!pending.ok) return corsJson({ error: "Supabase error (pending)", details: pending }, 500);

    const rows = [...(confirmed.data || []), ...(pending.data || [])];

    let AM = slotAM;
    let PM = slotPM;

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

    // ---- 10.5) Promo code validation (optional) ----
    let promo = null;
    let promoDiscountCents = 0;

    if (promoCode) {
      const pr = await supa(
        "GET",
        `/rest/v1/promo_codes?select=code,is_active,percent_off,amount_off_cents,starts_on,ends_on&code=eq.${encodeURIComponent(
          promoCode
        )}&limit=1`
      );

      if (!pr.ok) return corsJson({ error: "Supabase error (promo_codes)", details: pr }, 500);

      promo = Array.isArray(pr.data) ? pr.data[0] : null;
      if (!promo?.code) return corsJson({ error: `Invalid promo code: ${promoCode}` }, 400);
      if (promo.is_active !== true) return corsJson({ error: `Promo code not active: ${promoCode}` }, 400);

      // Apply window against the SERVICE DATE (not "today")
      const d = body.service_date;
      if (promo.starts_on && d < promo.starts_on) {
        return corsJson({ error: `Promo not started yet: ${promoCode}` }, 400);
      }
      if (promo.ends_on && d > promo.ends_on) {
        return corsJson({ error: `Promo expired: ${promoCode}` }, 400);
      }

      // Compute discount against total, but never below deposit
      let discount = 0;
      if (promo.percent_off != null) {
        discount = Math.round((totalCents * Number(promo.percent_off)) / 100);
      } else if (promo.amount_off_cents != null) {
        discount = Number(promo.amount_off_cents);
      }

      const maxDiscount = Math.max(0, totalCents - depositCents);
      promoDiscountCents = Math.max(0, Math.min(discount, maxDiscount));
      totalCents = totalCents - promoDiscountCents;
    }

    // ---- 11) Insert pending booking ----
    const ip = request.headers.get("cf-connecting-ip") || null;

    const notes = [];
    notes.push(`Vehicle: ${vYear} ${vMake} ${vModel}`);
    if (vPhoto) notes.push(`Vehicle photo: ${vPhoto}`);
    if (giftCode) notes.push(`Gift code provided: ${giftCode}`);
    if (promo && promoDiscountCents > 0) {
      const promoLabel =
        promo.percent_off != null
          ? `${promo.code} (${promo.percent_off}% off)`
          : `${promo.code} ($${(Number(promo.amount_off_cents) / 100).toFixed(2)} off)`;
      notes.push(`Promo applied: ${promoLabel} (-$${(promoDiscountCents / 100).toFixed(2)})`);
    }
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
    if (!booking?.id) {
      return corsJson({ error: "Booking insert returned no id", details: ins }, 500);
    }

    // ---- 12) Create Stripe Checkout Session ----
    const origin = new URL(request.url).origin;
    const successUrl = `${origin}/?checkout=success&bid=${booking.id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?checkout=cancel&bid=${booking.id}`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", successUrl);
    form.set("cancel_url", cancelUrl);
    form.set("customer_email", body.customer_email);

    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", "cad");
    form.set("line_items[0][price_data][unit_amount]", String(depositCents));
    form.set("line_items[0][price_data][product_data][name]", "Rosie Dazzlers Booking Deposit");
    form.set(
      "line_items[0][price_data][product_data][description]",
      `${body.package_code} (${body.vehicle_size}) - ${body.service_date} ${body.start_slot}`
    );

    // Metadata
    form.set("metadata[booking_id]", booking.id);
    form.set("metadata[service_date]", body.service_date);
    form.set("metadata[package_code]", body.package_code);
    form.set("metadata[vehicle]", `${vYear} ${vMake} ${vModel}`.trim());
    if (promoCode) form.set("metadata[promo_code]", promoCode);
    if (promoDiscountCents > 0) form.set("metadata[promo_discount_cents]", String(promoDiscountCents));
    if (giftCode) form.set("metadata[gift_code]", giftCode);

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

    // ---- 13) Update booking with stripe session id ----
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

    // ---- 14) Return checkout url ----
    return corsJson({
      ok: true,
      booking_id: booking.id,
      deposit_cents: depositCents,
      total_cents: totalCents,
      promo_discount_cents: promoDiscountCents,
      checkout_url: stripe.url,
      hold_minutes: HOLD_MINUTES,
      quote_addons: quoteAddonsChosen,
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
