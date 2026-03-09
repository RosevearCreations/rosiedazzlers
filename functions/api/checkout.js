// functions/api/checkout.js
// POST /api/checkout
// v4: adds slot_blocks (AM/PM) admin blocking support.
// Creates a booking in Supabase, applies optional promo_code + gift_code,
// stores vehicle + code/discount fields, then creates Stripe Checkout Session
// for deposit (or confirms if deposit due is 0).

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  const VERSION = "checkout_v4_slot_blocks_20260308";

  try {
    const raw = await request.text();
    if (!raw) return corsJson({ version: VERSION, error: "Missing JSON body" }, 400);

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return corsJson({ version: VERSION, error: "Invalid JSON body" }, 400);
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
      "car_year",
      "car_make",
      "car_model",
    ];

    for (const k of required) {
      if (!body?.[k]) return corsJson({ version: VERSION, error: `Missing ${k}` }, 400);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.service_date)) {
      return corsJson({ version: VERSION, error: "service_date must be YYYY-MM-DD" }, 400);
    }

    if (!["AM", "PM"].includes(body.start_slot)) {
      return corsJson({ version: VERSION, error: "start_slot must be AM or PM" }, 400);
    }

    const duration = Number(body.duration_slots);
    if (![1, 2].includes(duration)) {
      return corsJson({ version: VERSION, error: "duration_slots must be 1 or 2" }, 400);
    }

    if (!["Norfolk", "Oxford"].includes(body.service_area)) {
      return corsJson({ version: VERSION, error: "service_area must be Norfolk or Oxford" }, 400);
    }

    if (!["small", "mid", "oversize"].includes(body.vehicle_size)) {
      return corsJson({ version: VERSION, error: "vehicle_size must be small, mid, or oversize" }, 400);
    }

    const year = Number(body.car_year);
    if (!Number.isFinite(year) || year < 1980 || year > 2035) {
      return corsJson({ version: VERSION, error: "car_year must be a valid year (1980–2035)" }, 400);
    }

    const email = String(body.customer_email || "").trim();
    if (!email || !email.includes("@")) {
      return corsJson({ version: VERSION, error: "customer_email must be a valid email" }, 400);
    }

    const acks = ["ack_driveway", "ack_power_water", "ack_bylaw", "ack_cancellation"];
    for (const a of acks) {
      if (body[a] !== true) return corsJson({ version: VERSION, error: `Missing acknowledgement: ${a}` }, 400);
    }

    const giftCode = typeof body.gift_code === "string" ? body.gift_code.trim().toUpperCase() : "";
    const promoCode = typeof body.promo_code === "string" ? body.promo_code.trim().toUpperCase() : "";

    // ---- 2) Server config ----
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const STRIPE_KEY = env.STRIPE_SECRET_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return corsJson({ version: VERSION, error: "Server not configured (Supabase env vars missing)" }, 500);
    }
    if (!STRIPE_KEY) {
      return corsJson({ version: VERSION, error: "Server not configured (Stripe secret missing)" }, 500);
    }

    // ---- 3) Pricing ----
    const PRICING = {
      premium_wash:    { small:  8500, mid: 10500, oversize: 12500 },
      basic_detail:    { small: 11500, mid: 13500, oversize: 17000 },
      complete_detail: { small: 31900, mid: 36900, oversize: 41900 },
      interior_detail: { small: 19500, mid: 22000, oversize: 24500 },
      exterior_detail: { small: 19500, mid: 22000, oversize: 24500 },
    };

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

    const base = PRICING?.[body.package_code]?.[body.vehicle_size];
    if (!base) return corsJson({ version: VERSION, error: "Unknown package_code or vehicle_size" }, 400);

    const addonCodes = Array.isArray(body.addon_codes) ? body.addon_codes : [];
    let addonsTotal = 0;
    const addonsChosen = [];
    const quoteAddonsChosen = [];

    for (const code of addonCodes) {
      const a = ADDONS[code];
      if (!a) continue;

      let cents = null;
      if (a.price_cents != null) cents = a.price_cents;
      else if (a.prices_cents?.[body.vehicle_size] != null) cents = a.prices_cents[body.vehicle_size];

      const item = { code, label: a.label, cents, quote_required: a.quote_required === true };
      addonsChosen.push(item);

      if (item.quote_required) quoteAddonsChosen.push(item.label);
      else if (typeof cents === "number") addonsTotal += cents;
    }

    const subtotalCents = base + addonsTotal;

    const depositBaseCents =
      ["premium_wash", "basic_detail"].includes(body.package_code) ? 5000 : 10000;

    // ---- 4) Supabase helper ----
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

    // ---- 5) Date blocked? ----
    const blk = await supa(
      "GET",
      `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(body.service_date)}`
    );
    if (!blk.ok) return corsJson({ version: VERSION, error: "Supabase error (date_blocks)", details: blk }, 500);
    if (Array.isArray(blk.data) && blk.data.length > 0) {
      return corsJson({ version: VERSION, error: "Date is blocked", reason: blk.data[0]?.reason ?? "Blocked" }, 409);
    }

    // ---- 6) Slot blocked? (AM/PM admin blocks) ----
    const slotBlock = await supa(
      "GET",
      `/rest/v1/slot_blocks?select=service_date,slot,reason&service_date=eq.${encodeURIComponent(body.service_date)}&slot=eq.${encodeURIComponent(body.start_slot)}&limit=1`
    );
    if (!slotBlock.ok) return corsJson({ version: VERSION, error: "Supabase error (slot_blocks)", details: slotBlock }, 500);
    if (Array.isArray(slotBlock.data) && slotBlock.data.length > 0) {
      return corsJson({ version: VERSION, error: "Selected slot is blocked", reason: slotBlock.data[0]?.reason ?? "Blocked" }, 409);
    }

    // ---- 7) Availability (confirmed + active holds) ----
    const HOLD_MINUTES = 30;
    const holdSince = new Date(Date.now() - HOLD_MINUTES * 60 * 1000).toISOString();

    await supa(
      "PATCH",
      `/rest/v1/bookings?service_date=eq.${encodeURIComponent(body.service_date)}&status=eq.pending&created_at=lt.${encodeURIComponent(holdSince)}`,
      { status: "failed" }
    );

    const confirmed = await supa(
      "GET",
      `/rest/v1/bookings?select=status,start_slot,duration_slots&service_date=eq.${encodeURIComponent(body.service_date)}&status=eq.confirmed`
    );
    if (!confirmed.ok) return corsJson({ version: VERSION, error: "Supabase error (confirmed)", details: confirmed }, 500);

    const pending = await supa(
      "GET",
      `/rest/v1/bookings?select=status,start_slot,duration_slots,created_at&service_date=eq.${encodeURIComponent(body.service_date)}&status=eq.pending&created_at=gte.${encodeURIComponent(holdSince)}`
    );
    if (!pending.ok) return corsJson({ version: VERSION, error: "Supabase error (pending)", details: pending }, 500);

    const rows = [...(confirmed.data || []), ...(pending.data || [])];

    let AM = true, PM = true;
    for (const b of rows) {
      const dur = Number(b.duration_slots);
      if (dur === 2) { AM = false; PM = false; break; }
      if (dur === 1 && b.start_slot === "AM") AM = false;
      if (dur === 1 && b.start_slot === "PM") PM = false;
    }

    if (body.start_slot === "AM") AM = AM && true;
    if (body.start_slot === "PM") PM = PM && true;

    const okSlot = body.start_slot === "AM" ? AM : PM;
    const okFullDay = duration === 2 ? (AM && PM) : true;

    if (!okSlot || !okFullDay) {
      return corsJson({ version: VERSION, error: "Selected slot not available", availability: { AM, PM } }, 409);
    }

    // ---- 8) Promo ----
    let promo = null;
    let promoDiscountCents = 0;

    if (promoCode) {
      const promoRes = await supa(
        "GET",
        `/rest/v1/promo_codes?select=code,active,discount_type,discount_percent,discount_cents,starts_at,ends_at,max_uses,uses&code=eq.${encodeURIComponent(promoCode)}&limit=1`
      );
      if (!promoRes.ok) return corsJson({ version: VERSION, error: "Supabase error (promo_codes)", details: promoRes }, 500);

      promo = Array.isArray(promoRes.data) ? promoRes.data[0] : null;
      if (!promo) return corsJson({ version: VERSION, error: "Invalid promo code" }, 400);

      const now = new Date();
      const startsAt = promo.starts_at ? new Date(promo.starts_at) : null;
      const endsAt = promo.ends_at ? new Date(promo.ends_at) : null;

      if (promo.active !== true) return corsJson({ version: VERSION, error: "Promo code is not active" }, 400);
      if (startsAt && now < startsAt) return corsJson({ version: VERSION, error: "Promo code is not active yet" }, 400);
      if (endsAt && now > endsAt) return corsJson({ version: VERSION, error: "Promo code has expired" }, 400);

      const maxUses = Number(promo.max_uses ?? 0);
      const uses = Number(promo.uses ?? 0);
      if (maxUses > 0 && uses >= maxUses) return corsJson({ version: VERSION, error: "Promo code usage limit reached" }, 400);

      const type = String(promo.discount_type || "").toLowerCase();
      if (type === "percent") {
        const pct = Math.max(0, Math.min(90, Number(promo.discount_percent ?? 0)));
        promoDiscountCents = Math.floor((subtotalCents * pct) / 100);
      } else {
        promoDiscountCents = Number(promo.discount_cents ?? 0);
      }

      if (!Number.isFinite(promoDiscountCents) || promoDiscountCents < 0) promoDiscountCents = 0;
      promoDiscountCents = Math.min(promoDiscountCents, subtotalCents);
    }

    const afterPromoCents = Math.max(0, subtotalCents - promoDiscountCents);

    // ---- 9) Gift ----
    let gift = null;
    let giftApplyCents = 0;

    if (giftCode) {
      const nowIso = new Date().toISOString();

      const giftRes = await supa(
        "GET",
        `/rest/v1/gift_certificates?select=id,code,type,status,remaining_cents,expires_at,package_code,vehicle_size,currency,purchase_context&code=eq.${encodeURIComponent(giftCode)}&limit=1`
      );
      if (!giftRes.ok) return corsJson({ version: VERSION, error: "Supabase error (gift_certificates)", details: giftRes }, 500);

      gift = Array.isArray(giftRes.data) ? giftRes.data[0] : null;
      if (!gift) return corsJson({ version: VERSION, error: "Invalid gift code" }, 400);

      if (String(gift.status) !== "active") return corsJson({ version: VERSION, error: "Gift code is not active" }, 400);
      if (gift.expires_at && String(gift.expires_at) <= nowIso) return corsJson({ version: VERSION, error: "Gift code has expired" }, 400);

      const remaining = Number(gift.remaining_cents ?? 0);
      if (!Number.isFinite(remaining) || remaining <= 0) return corsJson({ version: VERSION, error: "Gift code has no remaining balance" }, 400);

      const gType = String(gift.type || "").toLowerCase();
      if (gType === "service") {
        if (gift.package_code !== body.package_code || gift.vehicle_size !== body.vehicle_size) {
          return corsJson({ version: VERSION, error: "Service gift does not match selected package/size" }, 400);
        }
      }

      giftApplyCents = Math.min(remaining, afterPromoCents);
    }

    const afterGiftCents = Math.max(0, afterPromoCents - giftApplyCents);

    const depositCapped = Math.min(depositBaseCents, afterPromoCents);
    const giftToDeposit = Math.min(depositCapped, giftApplyCents);
    const depositDueNowCents = Math.max(0, depositCapped - giftToDeposit);

    // ---- 10) Vehicle JSON ----
    const vehicle = {
      year,
      make: String(body.car_make || "").trim(),
      model: String(body.car_model || "").trim(),
      plate: String(body.car_plate || "").trim() || null,
      mileage: body.car_mileage != null ? String(body.car_mileage).trim() : null,
      photo_url: String(body.car_photo_url || "").trim() || null,
    };

    // ---- 11) Insert booking ----
    const notes = [];
    if (quoteAddonsChosen.length) notes.push(`Quote add-ons requested: ${quoteAddonsChosen.join(", ")}`);
    if (promoCode && promoDiscountCents > 0) notes.push(`Promo applied: ${promoCode}`);
    if (giftCode && giftApplyCents > 0) notes.push(`Gift applied: ${giftCode}`);

    const bookingPayload = {
      status: depositDueNowCents === 0 ? "confirmed" : "pending",

      service_date: body.service_date,
      start_slot: body.start_slot,
      duration_slots: duration,

      service_area: body.service_area,
      package_code: body.package_code,
      vehicle_size: body.vehicle_size,

      customer_name: String(body.customer_name || "").trim(),
      customer_email: email,
      customer_phone: body.customer_phone ? String(body.customer_phone).trim() : null,

      address_line1: String(body.address_line1 || "").trim(),
      city: body.city ? String(body.city).trim() : null,
      postal_code: body.postal_code ? String(body.postal_code).trim() : null,

      addons: addonsChosen,
      currency: "CAD",

      subtotal_cents: subtotalCents,
      promo_code: promoCode || null,
      gift_code: giftCode || null,
      promo_discount_cents: promoDiscountCents || 0,
      gift_applied_cents: giftApplyCents || 0,

      price_total_cents: afterGiftCents,
      deposit_cents: depositDueNowCents,

      vehicle,

      ack_driveway: true,
      ack_power_water: true,
      ack_bylaw: true,
      ack_cancellation: true,

      waiver_accepted_at: new Date().toISOString(),
      waiver_user_agent: request.headers.get("user-agent") || null,

      notes: notes.length ? notes.join(" | ") : null,
    };

    const ins = await supa("POST", "/rest/v1/bookings", bookingPayload);
    if (!ins.ok) return corsJson({ version: VERSION, error: "Supabase insert failed", details: ins }, 500);

    const booking = ins.data?.[0];
    if (!booking?.id) return corsJson({ version: VERSION, error: "Booking insert returned no id" }, 500);

    // ---- 12) Redeem gift ----
    if (gift && giftApplyCents > 0) {
      const remaining = Number(gift.remaining_cents ?? 0);
      const newRemaining = Math.max(0, remaining - giftApplyCents);
      const newStatus = newRemaining === 0 ? "redeemed" : "active";

      const pc = (gift.purchase_context && typeof gift.purchase_context === "object") ? gift.purchase_context : {};
      pc.redemption = {
        booking_id: booking.id,
        applied_cents: giftApplyCents,
        promo_code: promoCode || null,
        redeemed_at: new Date().toISOString(),
      };

      let filter = `id=eq.${encodeURIComponent(gift.id)}&status=eq.active&remaining_cents=gte.${encodeURIComponent(giftApplyCents)}`;
      if (String(gift.type || "").toLowerCase() === "service") {
        filter += `&package_code=eq.${encodeURIComponent(body.package_code)}&vehicle_size=eq.${encodeURIComponent(body.vehicle_size)}`;
      }

      const upd = await supa("PATCH", `/rest/v1/gift_certificates?${filter}`, {
        remaining_cents: newRemaining,
        status: newStatus,
        purchase_context: pc,
      });

      if (!upd.ok) {
        await supa("PATCH", `/rest/v1/bookings?id=eq.${encodeURIComponent(booking.id)}`, { status: "failed" });
        return corsJson({ version: VERSION, error: "Gift redemption failed (try again)", details: upd }, 409);
      }
    }

    // ---- 13) Increment promo usage (best-effort) ----
    if (promoCode && promo && promoDiscountCents > 0) {
      const currentUses = Number(promo.uses ?? 0);
      await supa(
        "PATCH",
        `/rest/v1/promo_codes?code=eq.${encodeURIComponent(promoCode)}&uses=eq.${encodeURIComponent(currentUses)}`,
        { uses: currentUses + 1 }
      );
    }

    // ---- 14) Stripe checkout (deposit) ----
    const origin = new URL(request.url).origin;

    if (depositDueNowCents === 0) {
      return corsJson({
        ok: true,
        version: VERSION,
        booking_id: booking.id,
        subtotal_cents: subtotalCents,
        promo_discount_cents: promoDiscountCents,
        gift_applied_cents: giftApplyCents,
        total_cents: afterGiftCents,
        deposit_cents: 0,
        checkout_url: `${origin}/?checkout=success&bid=${booking.id}&session_id=NO_PAYMENT`,
        no_payment: true,
      });
    }

    const successUrl = `${origin}/?checkout=success&bid=${booking.id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?checkout=cancel&bid=${booking.id}`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", successUrl);
    form.set("cancel_url", cancelUrl);
    form.set("customer_email", email);

    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", "cad");
    form.set("line_items[0][price_data][unit_amount]", String(depositDueNowCents));
    form.set("line_items[0][price_data][product_data][name]", "Rosie Dazzlers Booking Deposit");

    form.set("metadata[booking_id]", booking.id);
    form.set("metadata[service_date]", body.service_date);
    form.set("metadata[package_code]", body.package_code);
    if (promoCode) form.set("metadata[promo_code]", promoCode);
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
      await supa("PATCH", `/rest/v1/bookings?id=eq.${encodeURIComponent(booking.id)}`, { status: "failed" });
      return corsJson({ version: VERSION, error: "Stripe error creating session", stripe }, 502);
    }

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

    return corsJson({
      ok: true,
      version: VERSION,
      booking_id: booking.id,
      subtotal_cents: subtotalCents,
      promo_discount_cents: promoDiscountCents,
      gift_applied_cents: giftApplyCents,
      total_cents: afterGiftCents,
      deposit_cents: depositDueNowCents,
      checkout_url: stripe.url,
    });
  } catch (e) {
    return corsJson({ error: "Server error", details: String(e) }, 500);
  }
}

/* helpers */

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
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
