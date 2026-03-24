// functions/api/stripe/webhook.js
export async function onRequestPost({ request, env }) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
  if (!SUPABASE_URL || !SERVICE_KEY || !WEBHOOK_SECRET) return new Response("Server not configured", { status: 500 });
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("Missing Stripe-Signature", { status: 400 });
  const rawBody = await request.text();
  const verified = await verifyStripeSignature({ signatureHeader: sig, payload: rawBody, secret: WEBHOOK_SECRET, toleranceSeconds: 300 });
  if (!verified.ok) return new Response(`Signature verification failed: ${verified.reason}`, { status: 400 });
  let event; try { event = JSON.parse(rawBody); } catch { return new Response("Invalid JSON", { status: 400 }); }
  if (event?.type !== "checkout.session.completed") return new Response("Ignored", { status: 200 });
  const session = event?.data?.object;
  const bookingId = session?.metadata?.booking_id;
  if (!bookingId) { await logEvent(SUPABASE_URL, SERVICE_KEY, null, "stripe_webhook_missing_booking_id", event); return new Response("Missing booking_id metadata", { status: 200 }); }
  const patch = await supaPatch(SUPABASE_URL, SERVICE_KEY, `/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, { status: "confirmed", stripe_session_id: session?.id ?? null, stripe_payment_intent_id: session?.payment_intent ?? null, payment_provider: 'stripe' });
  if (!patch.ok) { await logEvent(SUPABASE_URL, SERVICE_KEY, bookingId, "stripe_webhook_update_failed", patch); return new Response("Supabase update failed", { status: 500 }); }
  const giftCode = String(session?.metadata?.gift_code || '').trim() || null;
  const giftCertificateId = String(session?.metadata?.gift_certificate_id || '').trim() || null;
  const giftRedeemedCents = Math.max(0, Math.floor(Number(session?.metadata?.gift_redeemed_cents || 0)));
  if (giftCode && giftCertificateId && giftRedeemedCents > 0) {
    const already = await fetch(`${SUPABASE_URL}/rest/v1/gift_certificate_redemptions?select=id&booking_id=eq.${encodeURIComponent(bookingId)}&gift_certificate_id=eq.${encodeURIComponent(giftCertificateId)}&limit=1`, { headers: supaHeaders(SERVICE_KEY) });
    const alreadyRows = already.ok ? await already.json().catch(() => []) : [];
    if (!Array.isArray(alreadyRows) || alreadyRows.length === 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/gift_certificate_redemptions`, { method:'POST', headers:{ ...supaHeaders(SERVICE_KEY), Prefer:'return=minimal' }, body: JSON.stringify([{ gift_certificate_id: giftCertificateId, booking_id: bookingId, amount_cents: giftRedeemedCents, notes: `Applied automatically from checkout gift code ${giftCode}` }]) });
      const gcRes = await fetch(`${SUPABASE_URL}/rest/v1/gift_certificates?select=remaining_cents&code=eq.${encodeURIComponent(giftCode)}&id=eq.${encodeURIComponent(giftCertificateId)}&limit=1`, { headers: supaHeaders(SERVICE_KEY) });
      const gcRows = gcRes.ok ? await gcRes.json().catch(() => []) : [];
      const current = Array.isArray(gcRows) ? gcRows[0] || null : null;
      if (current) {
        const nextRemaining = Math.max(0, Number(current.remaining_cents || 0) - giftRedeemedCents);
        await supaPatch(SUPABASE_URL, SERVICE_KEY, `/rest/v1/gift_certificates?id=eq.${encodeURIComponent(giftCertificateId)}`, { remaining_cents: nextRemaining, status: nextRemaining > 0 ? 'active' : 'redeemed' });
      }
    }
  }
  await logEvent(SUPABASE_URL, SERVICE_KEY, bookingId, "stripe_webhook_confirmed", { session_id: session?.id, payment_intent: session?.payment_intent, gift_code: giftCode, gift_redeemed_cents: giftRedeemedCents });
  return new Response("OK", { status: 200 });
}
function supaHeaders(SERVICE_KEY){ return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type":"application/json", Accept:"application/json" }; }
async function supaPatch(SUPABASE_URL, SERVICE_KEY, path, payload) { const res = await fetch(`${SUPABASE_URL}${path}`, { method: "PATCH", headers: { ...supaHeaders(SERVICE_KEY), Prefer: "return=minimal" }, body: JSON.stringify(payload) }); const text = await res.text(); return { ok: res.ok, status: res.status, body: text }; }
async function logEvent(SUPABASE_URL, SERVICE_KEY, bookingId, eventType, details) { try { await fetch(`${SUPABASE_URL}/rest/v1/booking_events`, { method: "POST", headers: { ...supaHeaders(SERVICE_KEY), Prefer: "return=minimal" }, body: JSON.stringify({ booking_id: bookingId, event_type: eventType, details: details ?? {} }) }); } catch {} }
async function verifyStripeSignature({ signatureHeader, payload, secret, toleranceSeconds }) { const parts = Object.fromEntries(signatureHeader.split(",").map(kv => { const [k, v] = kv.split("="); return [k, v]; })); const t = parts.t; const v1 = parts.v1; if (!t || !v1) return { ok: false, reason: "Missing t or v1" }; const timestamp = Number(t); if (!Number.isFinite(timestamp)) return { ok: false, reason: "Bad timestamp" }; const now = Math.floor(Date.now() / 1000); if (Math.abs(now - timestamp) > toleranceSeconds) return { ok: false, reason: "Timestamp outside tolerance" }; const signedPayload = `${t}.${payload}`; const expected = await hmacSha256Hex(secret, signedPayload); if (!timingSafeEqualHex(expected, v1)) return { ok: false, reason: "Bad signature" }; return { ok: true }; }
async function hmacSha256Hex(secret, message) { const enc = new TextEncoder(); const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message)); return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join(""); }
function timingSafeEqualHex(a, b) { if (a.length !== b.length) return false; let out = 0; for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i); return out === 0; }
