// functions/api/checkout.js
// Booking checkout with canonical package/add-on pricing from /data/rosie_services_pricing_and_packages.json
// Supports Stripe, PayPal Orders v2 approval, and zero-due gift confirmation.

export async function onRequestOptions() {
  return corsResponse('', 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJson(request);
    const required = ['service_date','start_slot','duration_slots','service_area','package_code','vehicle_size','customer_name','customer_email','address_line1'];
    for (const k of required) if (!body?.[k]) return corsJson({ error: `Missing ${k}` }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.service_date)) return corsJson({ error: 'service_date must be YYYY-MM-DD' }, 400);
    if (!['AM','PM'].includes(body.start_slot)) return corsJson({ error: 'start_slot must be AM or PM' }, 400);
    const duration = Number(body.duration_slots);
    if (![1,2].includes(duration)) return corsJson({ error:'duration_slots must be 1 or 2' },400);
    if (!['Norfolk','Oxford'].includes(body.service_area)) return corsJson({ error:'service_area must be Norfolk or Oxford' },400);
    if (!['small','mid','oversize'].includes(body.vehicle_size)) return corsJson({ error:'vehicle_size must be small, mid, or oversize' },400);
    const acks = ['ack_driveway','ack_power_water','ack_bylaw','ack_cancellation'];
    for (const a of acks) if (body[a] !== true) return corsJson({ error:`Missing acknowledgement: ${a}` },400);

    const vehicle = body.vehicle || {};
    const vYear = Number(vehicle.year);
    const vMake = String(vehicle.make || '').trim();
    const vModel = String(vehicle.model || '').trim();
    const vPhoto = String(vehicle.photo_url || '').trim() || null;
    if (!Number.isFinite(vYear) || vYear < 1950 || vYear > 2100) return corsJson({ error:'Missing/invalid vehicle.year' },400);
    if (!vMake) return corsJson({ error:'Missing vehicle.make' },400);
    if (!vModel) return corsJson({ error:'Missing vehicle.model' },400);

    const paymentMethod = String(body.payment_method || 'stripe').trim().toLowerCase();
    if (!['stripe','paypal'].includes(paymentMethod)) return corsJson({ error:'payment_method must be stripe or paypal' },400);

    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) return corsJson({ error:'Server not configured (Supabase env vars missing)' },500);

    const pricing = await loadPricingFromPublicData(request);
    const pricingByCode = Object.fromEntries((pricing.packages || []).map((pkg) => [pkg.code, pkg]));
    const addonsByCode = Object.fromEntries((pricing.addons || []).map((addon) => [addon.code, addon]));
    const pkg = pricingByCode[body.package_code];
    if (!pkg) return corsJson({ error:'Unknown package_code' },400);
    const base = centsFromCad(pkg?.prices_cad?.[body.vehicle_size]);
    if (!Number.isFinite(base) || base <= 0) return corsJson({ error:'Unknown package_code or vehicle_size' },400);

    const addonCodes = Array.isArray(body.addon_codes) ? [...new Set(body.addon_codes.map((x) => String(x || '').trim()).filter(Boolean))] : [];
    let addonsTotal = 0;
    const addonsChosen = [];
    const quoteAddonsChosen = [];
    for (const code of addonCodes) {
      const a = addonsByCode[code];
      if (!a) continue;
      let cents = null;
      if (a.prices_cad?.[body.vehicle_size] != null) cents = centsFromCad(a.prices_cad[body.vehicle_size]);
      else if (a.price_cad != null) cents = centsFromCad(a.price_cad);
      const item = { code, label: a.name || a.label || code, cents, quote_required: a.quote_required === true };
      addonsChosen.push(item);
      if (item.quote_required) quoteAddonsChosen.push(item.label);
      else if (typeof cents === 'number' && Number.isFinite(cents)) addonsTotal += cents;
    }

    const subtotalCents = base + addonsTotal;
    const depositBaseCents = Number(pkg.deposit_cad != null ? centsFromCad(pkg.deposit_cad) : calcDepositCents(body.package_code));

    const supa = async (method, path, payload) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, { method, headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' }, body: payload ? JSON.stringify(payload) : undefined });
      const text = await res.text();
      return { ok: res.ok, status: res.status, data: text ? safeJson(text) : null, raw: text };
    };

    const blk = await supa('GET', `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(body.service_date)}`);
    if (!blk.ok) return corsJson({ error:'Supabase error (date_blocks)', details: blk },500);
    if (Array.isArray(blk.data) && blk.data.length) return corsJson({ error:'Date is blocked', reason: blk.data[0]?.reason ?? 'Blocked' },409);

    const slotBlocks = await supa('GET', `/rest/v1/slot_blocks?select=blocked_date,slot,reason&blocked_date=eq.${encodeURIComponent(body.service_date)}`);
    if (!slotBlocks.ok) return corsJson({ error:'Supabase error (slot_blocks)', details: slotBlocks },500);
    let slotAM = true, slotPM = true;
    for (const s of slotBlocks.data || []) { const slot = String(s.slot || '').toUpperCase(); if (slot === 'AM') slotAM = false; if (slot === 'PM') slotPM = false; }

    const HOLD_MINUTES = 30;
    const holdSince = new Date(Date.now() - HOLD_MINUTES * 60 * 1000).toISOString();
    await supa('PATCH', `/rest/v1/bookings?service_date=eq.${encodeURIComponent(body.service_date)}&status=eq.pending&created_at=lt.${encodeURIComponent(holdSince)}`, { status:'cancelled' });
    const confirmed = await supa('GET', `/rest/v1/bookings?select=status,start_slot,duration_slots&service_date=eq.${encodeURIComponent(body.service_date)}&status=eq.confirmed`);
    const pending = await supa('GET', `/rest/v1/bookings?select=status,start_slot,duration_slots,created_at&service_date=eq.${encodeURIComponent(body.service_date)}&status=eq.pending&created_at=gte.${encodeURIComponent(holdSince)}`);
    if (!confirmed.ok || !pending.ok) return corsJson({ error:'Supabase error (availability)' },500);
    const rows = [...(Array.isArray(confirmed.data) ? confirmed.data : []), ...(Array.isArray(pending.data) ? pending.data : [])];
    let AM = slotAM, PM = slotPM;
    for (const b of rows) {
      const dur = Number(b.duration_slots);
      if (dur === 2) { AM = false; PM = false; break; }
      if (dur === 1 && b.start_slot === 'AM') AM = false;
      if (dur === 1 && b.start_slot === 'PM') PM = false;
    }
    const okSlot = body.start_slot === 'AM' ? AM : PM;
    const okFullDay = duration === 2 ? AM && PM : true;
    if (!okSlot || !okFullDay) return corsJson({ error:'Selected slot not available', availability:{ AM, PM }, hold_minutes:HOLD_MINUTES },409);

    const promoCode = String(body.promo_code || '').trim().toUpperCase() || null;
    const giftCode = String(body.gift_code || '').trim().toUpperCase() || null;
    const pricingPreview = await previewCodes({ supa, subtotalCents, depositBaseCents, packageCode: body.package_code, vehicleSize: body.vehicle_size, promoCode, giftCode });
    if (!pricingPreview.ok) return corsJson({ error: pricingPreview.error },400);

    let giftCertificate = pricingPreview.gift || null;
    const totalCents = pricingPreview.total_after_discounts_cents;
    const promoDiscountCents = pricingPreview.promo_discount_cents;
    const giftDiscountCents = pricingPreview.gift_apply_cents;
    const depositCents = pricingPreview.deposit_due_now_cents;

    const ip = request.headers.get('cf-connecting-ip') || null;
    const notes = [];
    notes.push(`Vehicle: ${vYear} ${vMake} ${vModel}`);
    if (vPhoto) notes.push(`Vehicle photo: ${vPhoto}`);
    if (promoCode) notes.push(`Promo checked: ${promoCode} (${pricingPreview.promo_message || 'preview'})`);
    if (giftCode) notes.push(`Gift checked: ${giftCode} (${pricingPreview.gift_message || 'preview'})`);
    if (giftDiscountCents > 0) notes.push(`Gift applied: ${giftCode} (-$${(giftDiscountCents / 100).toFixed(2)})`);
    if (promoDiscountCents > 0) notes.push(`Promo discount applied (-$${(promoDiscountCents / 100).toFixed(2)})`);
    if (quoteAddonsChosen.length) notes.push(`Quote add-ons requested: ${quoteAddonsChosen.join(', ')}`);

    const bookingPayload = {
      status: depositCents > 0 ? 'pending' : 'confirmed',
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
      currency: 'CAD',
      price_total_cents: totalCents,
      deposit_cents: depositCents,
      payment_provider: depositCents > 0 ? paymentMethod : 'gift',
      ack_driveway: true,
      ack_power_water: true,
      ack_bylaw: true,
      ack_cancellation: true,
      waiver_accepted_at: new Date().toISOString(),
      waiver_ip: ip,
      waiver_user_agent: request.headers.get('user-agent') || null,
      notes: notes.length ? notes.join(' | ') : null,
    };
    const ins = await supa('POST', '/rest/v1/bookings', bookingPayload);
    if (!ins.ok) return corsJson({ error:'Supabase insert failed', details: ins },500);
    const booking = Array.isArray(ins.data) ? ins.data[0] : ins.data?.[0];
    if (!booking?.id) return corsJson({ error:'Booking insert returned no id', details: ins },500);

    if (giftCode && giftCertificate?.id && giftDiscountCents > 0 && depositCents === 0) {
      await applyGiftRedemption({ env, bookingId: booking.id, giftCode, giftCertificateId: giftCertificate.id, giftRedeemedCents: giftDiscountCents, provider: 'gift_only' });
    }

    if (depositCents === 0) {
      return corsJson({ ok:true, booking_id: booking.id, total_cents: totalCents, deposit_cents: 0, promo_discount_cents: promoDiscountCents, gift_discount_cents: giftDiscountCents, hold_minutes:HOLD_MINUTES, quote_addons: quoteAddonsChosen, booking_status:'confirmed', confirmation_mode:'gift_only', redirect_url:`/my-account?booking_confirmed=${encodeURIComponent(booking.id)}` });
    }

    if (paymentMethod === 'paypal') {
      const order = await createPaypalOrder({ request, env, bookingId: booking.id, depositCents, description: `${pkg.name || pkg.label || body.package_code} (${body.vehicle_size}) - ${body.service_date} ${body.start_slot}`, metadata: { booking_id: booking.id, service_date: body.service_date, package_code: body.package_code, vehicle: `${vYear} ${vMake} ${vModel}`.trim(), promo_code: promoCode, promo_discount_cents: promoDiscountCents, gift_code: giftCode, gift_certificate_id: giftCertificate?.id || null, gift_redeemed_cents: giftDiscountCents } });
      if (!order.ok) return corsJson({ error: order.error, details: order.details },502);
      await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${booking.id}`, { method:'PATCH', headers:{ apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`, 'Content-Type':'application/json', Prefer:'return=minimal' }, body: JSON.stringify({ paypal_order_id: order.order_id, payment_provider:'paypal' }) });
      return corsJson({ ok:true, booking_id: booking.id, deposit_cents: depositCents, total_cents: totalCents, promo_discount_cents: promoDiscountCents, gift_discount_cents: giftDiscountCents, approval_url: order.approval_url, hold_minutes:HOLD_MINUTES, quote_addons: quoteAddonsChosen, payment_method:'paypal' });
    }

    const STRIPE_KEY = env.STRIPE_SECRET_KEY;
    if (!STRIPE_KEY) return corsJson({ error:'Server not configured (Stripe secret missing)' },500);
    const origin = new URL(request.url).origin;
    const successUrl = `${origin}/?checkout=success&bid=${booking.id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?checkout=cancel&bid=${booking.id}`;
    const form = new URLSearchParams();
    form.set('mode', 'payment');
    form.set('success_url', successUrl);
    form.set('cancel_url', cancelUrl);
    form.set('customer_email', body.customer_email);
    form.set('line_items[0][quantity]', '1');
    form.set('line_items[0][price_data][currency]', 'cad');
    form.set('line_items[0][price_data][unit_amount]', String(depositCents));
    form.set('line_items[0][price_data][product_data][name]', 'Rosie Dazzlers Booking Deposit');
    form.set('line_items[0][price_data][product_data][description]', `${pkg.name || pkg.label || body.package_code} (${body.vehicle_size}) - ${body.service_date} ${body.start_slot}`);
    form.set('metadata[booking_id]', booking.id);
    form.set('metadata[service_date]', body.service_date);
    form.set('metadata[package_code]', body.package_code);
    form.set('metadata[vehicle]', `${vYear} ${vMake} ${vModel}`.trim());
    if (promoCode) form.set('metadata[promo_code]', promoCode);
    if (promoDiscountCents > 0) form.set('metadata[promo_discount_cents]', String(promoDiscountCents));
    if (giftCode) form.set('metadata[gift_code]', giftCode);
    if (giftCertificate?.id) form.set('metadata[gift_certificate_id]', giftCertificate.id);
    if (giftDiscountCents > 0) form.set('metadata[gift_redeemed_cents]', String(giftDiscountCents));
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', { method:'POST', headers:{ Authorization:`Bearer ${STRIPE_KEY}`, 'Content-Type':'application/x-www-form-urlencoded' }, body: form.toString() });
    const stripeText = await stripeRes.text();
    const stripe = safeJson(stripeText);
    if (!stripeRes.ok) return corsJson({ error:'Stripe error creating session', stripe },502);
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${booking.id}`, { method:'PATCH', headers:{ apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`, 'Content-Type':'application/json', Prefer:'return=minimal' }, body: JSON.stringify({ stripe_session_id: stripe.id, payment_provider:'stripe' }) });
    return corsJson({ ok:true, booking_id: booking.id, deposit_cents: depositCents, total_cents: totalCents, promo_discount_cents: promoDiscountCents, gift_discount_cents: giftDiscountCents, checkout_url: stripe.url, hold_minutes:HOLD_MINUTES, quote_addons: quoteAddonsChosen, payment_method:'stripe' });
  } catch (e) {
    return corsJson({ error:'Server error', details:String(e) },500);
  }
}

async function loadPricingFromPublicData(request) {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/data/rosie_services_pricing_and_packages.json`, { cf: { cacheTtl: 0, cacheEverything: false } });
  if (!res.ok) throw new Error('Could not load pricing data JSON.');
  return await res.json();
}
async function createPaypalOrder({ request, env, bookingId, depositCents, description, metadata }) {
  const clientId = String(env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = String(env.PAYPAL_CLIENT_SECRET || '').trim();
  if (!clientId || !clientSecret) return { ok:false, error:'Missing PayPal client credentials.' };
  const base = String(env.PAYPAL_API_BASE || '').trim() || 'https://api-m.paypal.com';
  const auth = btoa(`${clientId}:${clientSecret}`);
  const tokenRes = await fetch(`${base}/v1/oauth2/token`, { method:'POST', headers:{ Authorization:`Basic ${auth}`, 'Content-Type':'application/x-www-form-urlencoded' }, body:'grant_type=client_credentials' });
  const tokenText = await tokenRes.text();
  const tokenData = safeJson(tokenText);
  if (!tokenRes.ok || !tokenData?.access_token) return { ok:false, error:'Could not obtain PayPal access token.', details: tokenData };
  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/book?paypal_return=1&booking_id=${encodeURIComponent(bookingId)}`;
  const cancelUrl = `${origin}/book?paypal_cancel=1&booking_id=${encodeURIComponent(bookingId)}`;
  const customId = encodeURIComponent(JSON.stringify(metadata || {}));
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [{ amount: { currency_code: 'CAD', value: (depositCents / 100).toFixed(2) }, description, custom_id: customId }],
    payment_source: { paypal: { experience_context: { return_url: returnUrl, cancel_url: cancelUrl, brand_name: 'Rosie Dazzlers', user_action: 'PAY_NOW', shipping_preference: 'NO_SHIPPING' } } }
  };
  const orderRes = await fetch(`${base}/v2/checkout/orders`, { method:'POST', headers:{ Authorization:`Bearer ${tokenData.access_token}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(payload) });
  const orderText = await orderRes.text();
  const orderData = safeJson(orderText);
  if (!orderRes.ok) return { ok:false, error:'Could not create PayPal order.', details: orderData };
  const approvalUrl = (orderData?.links || []).find((x) => x.rel === 'payer-action' || x.rel === 'approve')?.href || null;
  return { ok:true, order_id: orderData.id, approval_url: approvalUrl, details: orderData };
}
async function previewCodes({ supa, subtotalCents, depositBaseCents, packageCode, vehicleSize, promoCode, giftCode }) {
  let promo = null, promoDiscountCents = 0, promoMessage = null;
  if (promoCode) {
    const promoRes = await supa('GET', `/rest/v1/promo_codes?select=code,active,discount_type,discount_percent,discount_cents,starts_at,ends_at,max_uses,uses,is_active,percent_off,amount_off_cents,starts_on,ends_on&code=eq.${encodeURIComponent(promoCode)}&limit=1`);
    if (!promoRes.ok) return { ok:false, error:'Supabase error (promo_codes)' };
    promo = Array.isArray(promoRes.data) ? promoRes.data[0] : null;
    if (!promo) promoMessage = 'Invalid promo code';
    else {
      const now = new Date();
      const startsAt = promo.starts_at ? new Date(promo.starts_at) : (promo.starts_on ? new Date(`${promo.starts_on}T00:00:00Z`) : null);
      const endsAt = promo.ends_at ? new Date(promo.ends_at) : (promo.ends_on ? new Date(`${promo.ends_on}T23:59:59Z`) : null);
      const activeFlag = promo.active === true || promo.is_active === true;
      if (!activeFlag) promoMessage = 'Promo code is not active';
      else if (startsAt && now < startsAt) promoMessage = 'Promo code is not active yet';
      else if (endsAt && now > endsAt) promoMessage = 'Promo code has expired';
      else {
        const maxUses = Number(promo.max_uses ?? 0); const uses = Number(promo.uses ?? 0);
        if (maxUses > 0 && uses >= maxUses) promoMessage = 'Promo code usage limit reached';
        else {
          const type = String(promo.discount_type || (promo.percent_off != null ? 'percent' : 'amount')).toLowerCase();
          if (type === 'percent') {
            const pct = Math.max(0, Math.min(90, Number(promo.discount_percent ?? promo.percent_off ?? 0)));
            promoDiscountCents = Math.floor((subtotalCents * pct) / 100);
          } else {
            promoDiscountCents = Number(promo.discount_cents ?? promo.amount_off_cents ?? 0);
          }
          promoDiscountCents = Math.min(Math.max(0, promoDiscountCents), subtotalCents);
          promoMessage = 'Promo applied';
        }
      }
    }
  }
  const afterPromoCents = Math.max(0, subtotalCents - promoDiscountCents);
  let gift = null, giftApplyCents = 0, giftMessage = null;
  if (giftCode) {
    const giftRes = await supa('GET', `/rest/v1/gift_certificates?select=id,code,type,status,remaining_cents,expires_at,package_code,vehicle_size,currency&code=eq.${encodeURIComponent(giftCode)}&limit=1`);
    if (!giftRes.ok) return { ok:false, error:'Supabase error (gift_certificates)' };
    gift = Array.isArray(giftRes.data) ? giftRes.data[0] : null;
    if (!gift) giftMessage = 'Invalid gift code';
    else {
      const nowIso = new Date().toISOString();
      if (String(gift.status) !== 'active') giftMessage = 'Gift code is not active';
      else if (gift.expires_at && String(gift.expires_at) <= nowIso) giftMessage = 'Gift code has expired';
      else {
        const remaining = Number(gift.remaining_cents ?? 0);
        if (!Number.isFinite(remaining) || remaining <= 0) giftMessage = 'Gift code has no remaining balance';
        else {
          const gType = String(gift.type || '').toLowerCase();
          if (gType === 'service') {
            if (gift.package_code !== packageCode || gift.vehicle_size !== vehicleSize) giftMessage = 'Service gift does not match selected package/size';
            else { giftApplyCents = Math.min(remaining, afterPromoCents); giftMessage = 'Service gift valid'; }
          } else {
            giftApplyCents = Math.min(remaining, afterPromoCents); giftMessage = 'Dollar gift valid';
          }
        }
      }
    }
  }
  const totalAfterDiscounts = Math.max(0, afterPromoCents - giftApplyCents);
  const depositCapped = Math.min(depositBaseCents, afterPromoCents);
  const giftToDeposit = Math.min(depositCapped, giftApplyCents);
  const depositDueNow = Math.max(0, depositCapped - giftToDeposit);
  return { ok:true, promo, gift, promo_message:promoMessage, gift_message:giftMessage, promo_discount_cents:promoDiscountCents, gift_apply_cents:giftApplyCents, total_after_discounts_cents:totalAfterDiscounts, deposit_due_now_cents:depositDueNow };
}
async function applyGiftRedemption({ env, bookingId, giftCode, giftCertificateId, giftRedeemedCents, provider }) {
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json', Accept:'application/json' };
  const already = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificate_redemptions?select=id&booking_id=eq.${encodeURIComponent(bookingId)}&gift_certificate_id=eq.${encodeURIComponent(giftCertificateId)}&limit=1`, { headers });
  const alreadyRows = already.ok ? await already.json().catch(() => []) : [];
  if (Array.isArray(alreadyRows) && alreadyRows.length) return;
  await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificate_redemptions`, { method:'POST', headers:{ ...headers, Prefer:'return=minimal' }, body: JSON.stringify([{ gift_certificate_id: giftCertificateId, booking_id: bookingId, amount_cents: giftRedeemedCents, notes: `Applied automatically from ${provider} checkout gift code ${giftCode}` }]) });
  const gcRes = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?select=remaining_cents&code=eq.${encodeURIComponent(giftCode)}&id=eq.${encodeURIComponent(giftCertificateId)}&limit=1`, { headers });
  const gcRows = gcRes.ok ? await gcRes.json().catch(() => []) : [];
  const current = Array.isArray(gcRows) ? gcRows[0] || null : null;
  if (!current) return;
  const nextRemaining = Math.max(0, Number(current.remaining_cents || 0) - giftRedeemedCents);
  await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?id=eq.${encodeURIComponent(giftCertificateId)}`, { method:'PATCH', headers:{ ...headers, Prefer:'return=minimal' }, body: JSON.stringify({ remaining_cents: nextRemaining, status: nextRemaining > 0 ? 'active' : 'redeemed' }) });
  await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method:'POST', headers:{ ...headers, Prefer:'return=minimal' }, body: JSON.stringify({ booking_id: bookingId, event_type: 'gift_only_checkout_confirmed', details: { gift_code: giftCode, gift_redeemed_cents: giftRedeemedCents } }) }).catch(() => null);
}
function centsFromCad(value) { return Math.round(Number(value || 0) * 100); }
function calcDepositCents(packageCode) { return packageCode === 'premium_wash' || packageCode === 'basic_detail' ? 5000 : 10000; }
async function readJson(request) { const raw = await request.text(); if (!raw) return {}; try { return JSON.parse(raw); } catch { throw new Error('Invalid JSON body'); } }
function safeJson(text) { try { return JSON.parse(text); } catch { return { raw: text }; } }
function corsHeaders() { return { 'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'Content-Type' }; }
function corsJson(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { 'content-type':'application/json', ...corsHeaders() } }); }
function corsResponse(body = '', status = 200) { return new Response(body, { status, headers: corsHeaders() }); }
