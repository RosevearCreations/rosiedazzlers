// functions/api/paypal/capture-order.js
// Capture an approved PayPal order, confirm the booking, and record any gift redemption.
// Based on PayPal Orders v2 capture flow.

export async function onRequestOptions() {
  return corsResponse('', 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = String(body.order_id || '').trim();
    const bookingId = String(body.booking_id || '').trim();
    if (!orderId) return corsJson({ error: 'Missing order_id.' }, 400);
    if (!bookingId) return corsJson({ error: 'Missing booking_id.' }, 400);

    const accessToken = await getAccessToken(env);
    if (!accessToken.ok) return corsJson({ error: accessToken.error }, 500);

    const captureRes = await fetch(`${paypalBase(env)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: '{}'
    });
    const captureText = await captureRes.text();
    const captureData = safeJson(captureText);
    if (!captureRes.ok) return corsJson({ error: 'PayPal capture failed.', details: captureData }, 502);
    if (String(captureData?.status || '').toUpperCase() != 'COMPLETED') {
      return corsJson({ error: 'PayPal order was not completed.', details: captureData }, 400);
    }

    const metadata = captureData?.purchase_units?.[0]?.custom_id ? safeJson(decodeURIComponent(captureData.purchase_units[0].custom_id)) : {};
    if (String(metadata.booking_id || '') !== bookingId) {
      return corsJson({ error: 'Booking metadata mismatch.' }, 400);
    }

    await updateBookingAndGift({ env, bookingId, orderId, captureData, metadata });

    return corsJson({ ok: true, order: { id: captureData.id, status: captureData.status }, booking_id: bookingId });
  } catch (err) {
    return corsJson({ error: err?.message || 'Unexpected server error.' }, 500);
  }
}

async function updateBookingAndGift({ env, bookingId, orderId, captureData, metadata }) {
  const headers = supaHeaders(env);
  await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      status: 'confirmed',
      paypal_order_id: orderId,
      paypal_capture_id: captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
      payment_provider: 'paypal'
    })
  });

  const giftCode = String(metadata.gift_code || '').trim() || null;
  const giftCertificateId = String(metadata.gift_certificate_id || '').trim() || null;
  const giftRedeemedCents = Math.max(0, Math.floor(Number(metadata.gift_redeemed_cents || 0)));
  if (giftCode && giftCertificateId && giftRedeemedCents > 0) {
    const already = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificate_redemptions?select=id&booking_id=eq.${encodeURIComponent(bookingId)}&gift_certificate_id=eq.${encodeURIComponent(giftCertificateId)}&limit=1`, { headers });
    const alreadyRows = already.ok ? await already.json().catch(() => []) : [];
    if (!Array.isArray(alreadyRows) || alreadyRows.length === 0) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificate_redemptions`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify([{ gift_certificate_id: giftCertificateId, booking_id: bookingId, amount_cents: giftRedeemedCents, notes: `Applied automatically from PayPal checkout gift code ${giftCode}` }])
      });
      const gcRes = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?select=remaining_cents&code=eq.${encodeURIComponent(giftCode)}&id=eq.${encodeURIComponent(giftCertificateId)}&limit=1`, { headers });
      const gcRows = gcRes.ok ? await gcRes.json().catch(() => []) : [];
      const current = Array.isArray(gcRows) ? gcRows[0] || null : null;
      if (current) {
        const nextRemaining = Math.max(0, Number(current.remaining_cents || 0) - giftRedeemedCents);
        await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?id=eq.${encodeURIComponent(giftCertificateId)}`, {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify({ remaining_cents: nextRemaining, status: nextRemaining > 0 ? 'active' : 'redeemed' })
        });
      }
    }
  }

  await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ booking_id: bookingId, event_type: 'paypal_capture_confirmed', details: { order_id: orderId, capture_id: captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id || null } })
  }).catch(() => null);
}

function paypalBase(env) {
  return String(env.PAYPAL_API_BASE || '').trim() || 'https://api-m.paypal.com';
}

async function getAccessToken(env) {
  const clientId = String(env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = String(env.PAYPAL_CLIENT_SECRET || '').trim();
  if (!clientId || !clientSecret) return { ok: false, error: 'Missing PayPal client credentials.' };
  const auth = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.access_token) return { ok: false, error: 'Could not obtain PayPal access token.', details: data };
  return { ok: true, token: data.access_token };
}
function supaHeaders(env) { return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' }; }
function safeJson(text) { try { return JSON.parse(text); } catch { return { raw: text }; } }
function corsHeaders() { return { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST,OPTIONS', 'access-control-allow-headers': 'Content-Type' }; }
function corsJson(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...corsHeaders() } }); }
function corsResponse(body = '', status = 200) { return new Response(body, { status, headers: corsHeaders() }); }
