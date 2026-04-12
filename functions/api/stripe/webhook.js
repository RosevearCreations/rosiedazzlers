// functions/api/stripe/webhook.js
// Verifies Stripe signature (HMAC-SHA256) using the raw request body,
// then confirms the booking in Supabase.
//
// Stripe requires the *raw* body for verification. :contentReference[oaicite:1]{index=1}

export async function onRequestPost({ request, env }) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

  if (!SUPABASE_URL || !SERVICE_KEY || !WEBHOOK_SECRET) {
    return new Response("Server not configured", { status: 500 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("Missing Stripe-Signature", { status: 400 });

  // IMPORTANT: raw body (do not call request.json() before verifying)
  const rawBody = await request.text();

  const verified = await verifyStripeSignature({
    signatureHeader: sig,
    payload: rawBody,
    secret: WEBHOOK_SECRET,
    toleranceSeconds: 300, // 5 minutes
  });

  if (!verified.ok) {
    return new Response(`Signature verification failed: ${verified.reason}`, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // We only need this event for deposit confirmation. :contentReference[oaicite:2]{index=2}
  if (event?.type !== "checkout.session.completed") {
    return new Response("Ignored", { status: 200 });
  }

  const session = event?.data?.object;
  const bookingId = session?.metadata?.booking_id; // we set metadata in /api/checkout :contentReference[oaicite:3]{index=3}

  // Always return 200 for Stripe retries prevention unless something is truly broken.
  if (!bookingId) {
    await logEvent(SUPABASE_URL, SERVICE_KEY, null, "stripe_webhook_missing_booking_id", event);
    return new Response("Missing booking_id metadata", { status: 200 });
  }

  // Update booking to confirmed
  const patch = await supaPatch(
    SUPABASE_URL,
    SERVICE_KEY,
    `/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`,
    {
      status: "confirmed",
      stripe_session_id: session?.id ?? null,
      stripe_payment_intent_id: session?.payment_intent ?? null,
    }
  );

  if (!patch.ok) {
    await logEvent(SUPABASE_URL, SERVICE_KEY, bookingId, "stripe_webhook_update_failed", patch);
    // Return 500 so Stripe retries (temporary DB issue)
    return new Response("Supabase update failed", { status: 500 });
  }

  await logEvent(SUPABASE_URL, SERVICE_KEY, bookingId, "stripe_webhook_confirmed", {
    session_id: session?.id,
    payment_intent: session?.payment_intent,
  });

  return new Response("OK", { status: 200 });
}

/* -------------------- Supabase helpers -------------------- */

async function supaPatch(SUPABASE_URL, SERVICE_KEY, path, payload) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function logEvent(SUPABASE_URL, SERVICE_KEY, bookingId, eventType, details) {
  // best-effort audit log
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        booking_id: bookingId,
        event_type: eventType,
        details: details ?? {},
      }),
    });
  } catch {
    // ignore
  }
}

/* -------------------- Stripe signature verification -------------------- */
/*
Stripe signature format: "t=timestamp,v1=signature,..."
Signed payload: `${t}.${rawBody}`
Signature: HMAC-SHA256(secret, signed_payload)
*/
async function verifyStripeSignature({ signatureHeader, payload, secret, toleranceSeconds }) {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map(kv => {
      const [k, v] = kv.split("=");
      return [k, v];
    })
  );

  const t = parts.t;
  const v1 = parts.v1;

  if (!t || !v1) return { ok: false, reason: "Missing t or v1" };

  const timestamp = Number(t);
  if (!Number.isFinite(timestamp)) return { ok: false, reason: "Bad timestamp" };

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { ok: false, reason: "Timestamp outside tolerance" };
  }

  const signedPayload = `${t}.${payload}`;
  const expected = await hmacSha256Hex(secret, signedPayload);

  // constant-time-ish compare
  if (!timingSafeEqualHex(expected, v1)) return { ok: false, reason: "Bad signature" };

  return { ok: true };
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}
