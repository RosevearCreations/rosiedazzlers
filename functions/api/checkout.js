// functions/api/checkout.js
// Canonical checkout flow.
// - uses DB-backed pricing catalog (app_management_settings.pricing_catalog) with bundled JSON fallback
// - supports Stripe, PayPal, and gift-covered confirmations
// - validates gift codes and records gift metadata for later reconciliation

import { loadPricingCatalog } from "./_lib/pricing-catalog.js";

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return corsJson({ error: "Invalid JSON body" }, 400);

    const required = [
      "service_date", "start_slot", "duration_slots", "service_area", "package_code", "vehicle_size",
      "customer_name", "customer_email", "address_line1"
    ];
    for (const key of required) {
      if (!body[key]) return corsJson({ error: `Missing ${key}` }, 400);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.service_date || ""))) return corsJson({ error: "service_date must be YYYY-MM-DD" }, 400);
    if (!["AM", "PM"].includes(String(body.start_slot || ""))) return corsJson({ error: "start_slot must be AM or PM" }, 400);
    if (![1,2].includes(Number(body.duration_slots))) return corsJson({ error: "duration_slots must be 1 or 2" }, 400);
    if (!["small", "mid", "oversize"].includes(String(body.vehicle_size || ""))) return corsJson({ error: "vehicle_size must be small, mid, or oversize" }, 400);

    for (const ack of ["ack_driveway", "ack_power_water", "ack_bylaw", "ack_cancellation"]) {
      if (body[ack] !== true) return corsJson({ error: `Missing acknowledgement: ${ack}` }, 400);
    }

    const vehicle = body.vehicle && typeof body.vehicle === "object" ? body.vehicle : {};
    const vYear = Number(vehicle.year);
    const vMake = String(vehicle.make || "").trim();
    const vModel = String(vehicle.model || "").trim();
    if (!Number.isFinite(vYear) || vYear < 1950 || vYear > 2100) return corsJson({ error: "Missing/invalid vehicle.year" }, 400);
    if (!vMake) return corsJson({ error: "Missing vehicle.make" }, 400);
    if (!vModel) return corsJson({ error: "Missing vehicle.model" }, 400);

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return corsJson({ error: "Server not configured (Supabase env vars missing)" }, 500);

    const pricing = await loadPricingCatalog(env);
    const serviceAreaRaw = String(body.service_area || "").trim();
    const allowedAreas = new Set((Array.isArray(pricing.service_areas) ? pricing.service_areas : []).flatMap((row)=>[row?.value, row?.label]).filter(Boolean).map((v)=>String(v).trim()));
    if (!serviceAreaRaw) return corsJson({ error: "Missing service_area" }, 400);
    if (allowedAreas.size && !allowedAreas.has(serviceAreaRaw) && !["Norfolk", "Oxford", "Norfolk County", "Oxford County"].includes(serviceAreaRaw)) return corsJson({ error: "service_area is not a supported service zone" }, 400);
    const pkg = pricing.package_map[String(body.package_code || "")];
    if (!pkg) return corsJson({ error: "Unknown package_code" }, 400);

    const vehicleSize = String(body.vehicle_size || "");
    const baseCad = pkg.prices_cad?.[vehicleSize];
    if (!Number.isFinite(baseCad)) return corsJson({ error: "Unknown package/vehicle size combination" }, 400);

    const addonCodes = Array.isArray(body.addon_codes) ? body.addon_codes.map((v) => String(v || "").trim()).filter(Boolean) : [];
    const addonsChosen = [];
    const quoteAddonsChosen = [];
    let addonsTotalCents = 0;
    for (const code of addonCodes) {
      const addon = pricing.addon_map[code];
      if (!addon) continue;
      const addonCad = addon.prices_cad?.[vehicleSize];
      const cents = Number.isFinite(addonCad) ? Math.round(addonCad * 100) : null;
      const item = { code, label: addon.name, cents, quote_required: addon.quote_required === true };
      addonsChosen.push(item);
      if (item.quote_required || cents == null) quoteAddonsChosen.push(item.label);
      else addonsTotalCents += cents;
    }

    let totalCents = Math.round(baseCad * 100) + addonsTotalCents;
    let depositCents = Math.round((Number(pkg.deposit_cad || 0) || 0) * 100);
    if (depositCents <= 0) depositCents = ["premium_wash", "basic_detail"].includes(pkg.code) ? 5000 : 10000;

    const supa = async (method, path, payload, extraHeaders = {}) => {
      const res = await fetch(`${env.SUPABASE_URL}${path}`, {
        method,
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
          ...extraHeaders
        },
        body: payload == null ? undefined : JSON.stringify(payload)
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, data: text ? safeJson(text) : null, raw: text };
    };

    const blk = await supa("GET", `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(body.service_date)}`);
    if (!blk.ok) return corsJson({ error: "Supabase error (date_blocks)", details: blk.raw }, 500);
    if (Array.isArray(blk.data) && blk.data.length) return corsJson({ error: "Date is blocked", reason: blk.data[0]?.reason ?? "Blocked" }, 409);

    const slotBlocks = await supa("GET", `/rest/v1/slot_blocks?select=blocked_date,slot,reason&blocked_date=eq.${encodeURIComponent(body.service_date)}`);
    if (!slotBlocks.ok) return corsJson({ error: "Supabase error (slot_blocks)", details: slotBlocks.raw }, 500);
    let slotAM = true, slotPM = true;
    for (const s of Array.isArray(slotBlocks.data) ? slotBlocks.data : []) {
      const slot = String(s.slot || "").toUpperCase();
      if (slot === "AM") slotAM = false;
      if (slot === "PM") slotPM = false;
    }
    if (Number(body.duration_slots) === 2 && (!slotAM || !slotPM)) return corsJson({ error: "Selected slot not available" }, 409);
    if (Number(body.duration_slots) === 1 && String(body.start_slot) === "AM" && !slotAM) return corsJson({ error: "Selected slot not available" }, 409);
    if (Number(body.duration_slots) === 1 && String(body.start_slot) === "PM" && !slotPM) return corsJson({ error: "Selected slot not available" }, 409);

    const HOLD_MINUTES = 30;
    const holdSince = new Date(Date.now() - HOLD_MINUTES * 60 * 1000).toISOString();
    const bookingConflict = await supa(
      "GET",
      `/rest/v1/bookings?select=id,status,service_date,start_slot,duration_slots,created_at&service_date=eq.${encodeURIComponent(body.service_date)}` +
      `&or=(status.eq.confirmed,and(status.eq.pending,created_at.gte.${encodeURIComponent(holdSince)}))`
    );
    if (!bookingConflict.ok) return corsJson({ error: "Supabase error (bookings)", details: bookingConflict.raw }, 500);
    const conflicts = Array.isArray(bookingConflict.data) ? bookingConflict.data : [];
    const requestedSlots = Number(body.duration_slots) === 2 ? ["AM","PM"] : [String(body.start_slot)];
    const isBlocked = conflicts.some((row) => {
      const existing = Number(row.duration_slots) === 2 ? ["AM","PM"] : [String(row.start_slot)];
      return existing.some((slot) => requestedSlots.includes(slot));
    });
    if (isBlocked) return corsJson({ error: "Selected slot not available" }, 409);

    let promoApplied = null;
    const promoCodeRaw = String(body.promo_code || "").trim();
    if (promoCodeRaw) {
      const promoCode = promoCodeRaw.toUpperCase();
      const promoRes = await supa("GET", `/rest/v1/promo_codes?select=id,code,discount_type,discount_value,is_active,starts_at,ends_at,usage_limit,uses_count&code=eq.${encodeURIComponent(promoCode)}&limit=1`);
      if (promoRes.ok) {
        const promo = Array.isArray(promoRes.data) ? promoRes.data[0] || null : null;
        if (promo && promo.is_active !== false) {
          const now = Date.now();
          const startsOk = !promo.starts_at || Date.parse(promo.starts_at) <= now;
          const endsOk = !promo.ends_at || Date.parse(promo.ends_at) >= now;
          const usageOk = promo.usage_limit == null || Number(promo.uses_count || 0) < Number(promo.usage_limit || 0);
          if (startsOk && endsOk && usageOk) {
            let discount = 0;
            if (String(promo.discount_type) === "percent") discount = Math.round(totalCents * (Number(promo.discount_value || 0) / 100));
            else discount = Math.round(Number(promo.discount_value || 0) * 100);
            discount = Math.max(0, Math.min(totalCents, discount));
            if (discount > 0) {
              totalCents -= discount;
              promoApplied = { code: promo.code, discount_cents: discount, discount_type: promo.discount_type, discount_value: promo.discount_value };
            }
          }
        }
      }
    }

    let gift = null;
    const giftCode = String(body.gift_code || "").trim() || null;
    if (giftCode) {
      const gcRes = await supa("GET", `/rest/v1/gift_certificates?select=id,code,status,remaining_cents,package_code,vehicle_size,expires_at&code=eq.${encodeURIComponent(giftCode)}&limit=1`);
      if (!gcRes.ok) return corsJson({ error: "Could not validate gift code." }, 500);
      const row = Array.isArray(gcRes.data) ? gcRes.data[0] || null : null;
      if (!row) return corsJson({ error: "Gift code not found." }, 404);
      if (String(row.status || "") !== "active") return corsJson({ error: "Gift code is not active." }, 400);
      if (row.expires_at && Date.parse(row.expires_at) < Date.now()) return corsJson({ error: "Gift code has expired." }, 400);
      if (row.package_code && row.package_code !== pkg.code) return corsJson({ error: "Gift code does not match this package." }, 400);
      if (row.vehicle_size && row.vehicle_size !== vehicleSize) return corsJson({ error: "Gift code does not match this vehicle size." }, 400);
      gift = row;
    }

    const giftRedeemedCents = gift ? Math.max(0, Math.min(Number(gift.remaining_cents || 0), depositCents, totalCents)) : 0;
    const payableDepositCents = Math.max(0, depositCents - giftRedeemedCents);
    const remainingTotalAfterGiftAndDeposit = Math.max(0, totalCents - giftRedeemedCents - payableDepositCents);

    const notes = [];
    if (promoApplied) notes.push(`Promo ${promoApplied.code} applied for ${(promoApplied.discount_cents/100).toFixed(2)} CAD.`);
    if (giftCode) notes.push(`Gift code provided: ${giftCode}`);
    if (giftRedeemedCents > 0) notes.push(`Gift redeemed against deposit: ${(giftRedeemedCents/100).toFixed(2)} CAD.`);
    if (quoteAddonsChosen.length) notes.push(`Quote add-ons requested: ${quoteAddonsChosen.join(", ")}`);

    const bookingPayload = {
      service_date: body.service_date,
      start_slot: body.start_slot,
      duration_slots: Number(body.duration_slots),
      service_area: body.service_area,
      service_area_county: resolvedServiceCounty,
      service_area_municipality: resolvedServiceMunicipality,
      service_area_zone: resolvedServiceZone,
      package_code: pkg.code,
      vehicle_size: vehicleSize,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone || null,
      address_line1: body.address_line1,
      address_line2: body.address_line2 || null,
      city: body.city || null,
      postal_code: body.postal_code || null,
      notes: notes.join(" ") || null,
      status: payableDepositCents === 0 ? "confirmed" : "pending",
      job_status: payableDepositCents === 0 ? "confirmed" : "intake",
      price_total_cents: totalCents,
      deposit_cents: depositCents,
      payment_provider: payableDepositCents === 0 ? "gift" : String(body.payment_provider || "stripe").trim().toLowerCase(),
      addons: addonsChosen,
      vehicle_year: vYear,
      vehicle_make: vMake,
      vehicle_model: vModel,
      vehicle_body_style: String(vehicle.body_style || '').trim() || null,
      vehicle_category: String(vehicle.category || '').trim() || null,
      vehicle_plate: String(vehicle.plate || '').trim() || null,
      vehicle_mileage_km: Number.isFinite(Number(vehicle.mileage)) ? Number(vehicle.mileage) : null,
      vehicle_photo_url: String(vehicle.photo_url || "").trim() || null
    };

    const insertBooking = await supa("POST", `/rest/v1/bookings`, [bookingPayload]);
    if (!insertBooking.ok) return corsJson({ error: "Could not create booking.", details: insertBooking.raw }, 500);
    const booking = Array.isArray(insertBooking.data) ? insertBooking.data[0] || null : null;
    if (!booking?.id) return corsJson({ error: "Booking could not be created." }, 500);

    if (payableDepositCents === 0) {
      await applyGiftRedemption({ env, bookingId: booking.id, gift, amountCents: giftRedeemedCents, note: `Applied automatically during gift-covered booking checkout.` });
      return corsJson({
        ok: true,
        mode: "gift_only_confirm",
        booking_id: booking.id,
        booking_status: "confirmed",
        payable_now_cents: 0,
        gift_redeemed_cents: giftRedeemedCents,
        remaining_due_cents: remainingTotalAfterGiftAndDeposit
      });
    }

    const paymentProvider = bookingPayload.payment_provider === "paypal" ? "paypal" : "stripe";
    if (paymentProvider === "paypal") {
      if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) return corsJson({ error: "Server not configured (PayPal secret missing)" }, 500);
      const order = await createPayPalOrder({ env, request, booking, body, payableDepositCents, gift, giftRedeemedCents });
      await supa("PATCH", `/rest/v1/bookings?id=eq.${encodeURIComponent(booking.id)}`, { paypal_order_id: order.id, payment_provider: "paypal" });
      return corsJson({ ok: true, mode: "paypal", booking_id: booking.id, order_id: order.id, approve_url: order.approve_url, payable_now_cents: payableDepositCents, gift_redeemed_cents: giftRedeemedCents, remaining_due_cents: remainingTotalAfterGiftAndDeposit });
    }

    if (!env.STRIPE_SECRET_KEY) return corsJson({ error: "Server not configured (Stripe secret missing)" }, 500);
    const stripe = await createStripeSession({ env, request, booking, body, payableDepositCents, gift, giftRedeemedCents });
    await supa("PATCH", `/rest/v1/bookings?id=eq.${encodeURIComponent(booking.id)}`, { stripe_session_id: stripe.id, payment_provider: "stripe" });
    return corsJson({ ok: true, mode: "stripe", booking_id: booking.id, checkout_url: stripe.url, payable_now_cents: payableDepositCents, gift_redeemed_cents: giftRedeemedCents, remaining_due_cents: remainingTotalAfterGiftAndDeposit });
  } catch (err) {
    return corsJson({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}

async function createStripeSession({ env, request, booking, body, payableDepositCents, gift, giftRedeemedCents }) {
  const successUrl = new URL("/complete", request.url);
  successUrl.searchParams.set("provider", "stripe");
  successUrl.searchParams.set("booking_id", booking.id);
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  const cancelUrl = new URL("/book", request.url);
  cancelUrl.searchParams.set("booking_id", booking.id);

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", successUrl.toString());
  form.set("cancel_url", cancelUrl.toString());
  form.set("payment_method_types[0]", "card");
  form.set("line_items[0][price_data][currency]", "cad");
  form.set("line_items[0][price_data][product_data][name]", `${body.package_code} deposit`);
  form.set("line_items[0][price_data][unit_amount]", String(payableDepositCents));
  form.set("line_items[0][quantity]", "1");
  form.set("customer_email", String(body.customer_email || ""));
  form.set("metadata[booking_id]", booking.id);
  form.set("metadata[payment_provider]", "stripe");
  if (gift?.id && giftRedeemedCents > 0) {
    form.set("metadata[gift_code]", String(gift.code || ""));
    form.set("metadata[gift_certificate_id]", String(gift.id || ""));
    form.set("metadata[gift_redeemed_cents]", String(giftRedeemedCents));
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.id || !data?.url) throw new Error(`Stripe error creating session. ${text}`);
  return data;
}

async function createPayPalOrder({ env, request, booking, body, payableDepositCents, gift, giftRedeemedCents }) {
  const token = await getPayPalAccessToken(env);
  const returnUrl = new URL("/complete", request.url);
  returnUrl.searchParams.set("provider", "paypal");
  returnUrl.searchParams.set("booking_id", booking.id);
  const cancelUrl = new URL("/book", request.url);
  cancelUrl.searchParams.set("booking_id", booking.id);

  const payload = {
    intent: "CAPTURE",
    purchase_units: [{
      reference_id: booking.id,
      amount: { currency_code: "CAD", value: (payableDepositCents / 100).toFixed(2) },
      custom_id: booking.id,
      description: `${body.package_code} deposit`
    }],
    application_context: {
      brand_name: "Rosie Dazzlers",
      user_action: "PAY_NOW",
      return_url: returnUrl.toString(),
      cancel_url: cancelUrl.toString()
    }
  };
  const res = await fetch(`${paypalBase(env)}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.id) throw new Error(`PayPal error creating order. ${text}`);
  data.approve_url = Array.isArray(data.links) ? (data.links.find((l) => l.rel === "approve") || {}).href || null : null;
  data.metadata = { booking_id: booking.id, gift_code: gift?.code || null, gift_certificate_id: gift?.id || null, gift_redeemed_cents: giftRedeemedCents };
  return data;
}

async function applyGiftRedemption({ env, bookingId, gift, amountCents, note }) {
  if (!gift?.id || !amountCents) return;
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
  await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificate_redemptions`, { method: "POST", headers, body: JSON.stringify([{ gift_certificate_id: gift.id, booking_id: bookingId, amount_cents: amountCents, notes: note || null }]) });
  const nextRemaining = Math.max(0, Number(gift.remaining_cents || 0) - amountCents);
  await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?id=eq.${encodeURIComponent(gift.id)}`, { method: "PATCH", headers, body: JSON.stringify({ remaining_cents: nextRemaining, redeemed_at: nextRemaining === 0 ? new Date().toISOString() : null }) });
}

function paypalBase(env) { return String(env.PAYPAL_API_BASE || "").trim() || "https://api-m.paypal.com"; }
async function getPayPalAccessToken(env) {
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.access_token) throw new Error(`PayPal auth failed. ${text}`);
  return data.access_token;
}

function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function corsJson(data, status = 200) { return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() } }); }
function corsResponse(body = "", status = 200) { return new Response(body, { status, headers: corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
