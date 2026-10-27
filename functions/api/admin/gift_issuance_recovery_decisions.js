import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

// Build 675: Stripe checks here are GET-only. Every POST rechecks Stripe before
// the database RPC atomically verifies issuance evidence and appends a decision.
const SESSION_ID = /^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(['maintain_hold', 'escalate_review', 'close_verified_no_action']);
const REASONS = new Set(['missing_issuance', 'conflicting_evidence', 'provider_pending', 'provider_unavailable', 'delivery_needs_review', 'verified_no_duplicate', 'other_owner_review']);

function privateResponse(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, private');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(response.body, { status: response.status, headers });
}

async function ownerAccess(request, env, body = {}) {
  const access = await requireStaffAccess({ request, env, body, capability: 'manage_staff', allowLegacyAdminFallback: true });
  if (!access.ok) return access;
  // Never accept the old unauthenticated x-staff-email/id bridge for finance
  // evidence. This decision requires a real signed-in owner or an explicitly
  // enabled legacy password session.
  if (!['session', 'legacy_admin_password'].includes(access.auth_mode) ||
      !(access.actor.is_admin || access.actor.is_legacy_admin)) {
    return { ok: false, response: json({ ok: false, error: 'An authenticated owner session is required.' }, 403) };
  }
  return access;
}

function parseCartCount(cart) {
  if (typeof cart !== 'string' || !cart || cart.length > 4500) return null;
  const parts = cart.split('|');
  if (!parts.length || parts.length > 100) return null;
  let total = 0;
  for (const part of parts) {
    const fields = part.split(':');
    if (fields.length !== 3 || !/^[a-zA-Z0-9._-]{1,130}$/.test(fields[0]) ||
        !/^(?:[1-9]|1\d|2[0-5])$/.test(fields[1]) ||
        (fields[2] && !/^\d{1,9}$/.test(fields[2]))) return null;
    total += Number(fields[1]);
  }
  return total >= 1 && total <= 100 ? total : null;
}

async function stripeGet(env, path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'GET', redirect: 'error', signal: AbortSignal.timeout(8500),
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Stripe-Version': '2026-08-26.dahlia' }
  });
  if (!res.ok) throw new Error('Provider read-only check unavailable');
  return res.json();
}

async function providerCrossCheck(env, sessionId) {
  const checkedAt = new Date().toISOString();
  const unavailable = { check: 'unavailable', payment_status: 'unknown', session_status: 'unknown',
    livemode: null, expected_count: null, amount_cents: null, payment_intent: null, currency: null,
    line_count_matched: false, checked_at: checkedAt };
  if (!env?.STRIPE_SECRET_KEY) return unavailable;
  try {
    const session = await stripeGet(env, `checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (session?.id !== sessionId) return { ...unavailable, check: 'inconsistent' };
    const paid = session.payment_status === 'paid';
    const cartCount = parseCartCount(session?.metadata?.cart);
    const amountCents = Number(session.amount_total);
    let lineCount = null;
    let lineItemsComplete = false;
    if (paid && session?.metadata?.purpose === 'gift') {
      const lines = await stripeGet(env, `checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=100`);
      if (Array.isArray(lines.data) && lines.has_more === false && lines.data.length <= 100 &&
          lines.data.every((line) => Number.isSafeInteger(line.quantity) && line.quantity > 0)) {
        lineCount = lines.data.reduce((sum, line) => sum + line.quantity, 0);
        lineItemsComplete = true;
      }
    }
    const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    const compatible = session?.metadata?.purpose === 'gift' && session.mode === 'payment' &&
      session.status === 'complete' && paid && cartCount !== null && cartCount === lineCount &&
      lineItemsComplete && Number.isSafeInteger(amountCents) && amountCents > 0 &&
      typeof paymentIntent === 'string' && /^pi_[a-zA-Z0-9_]+$/.test(paymentIntent) &&
      typeof session.currency === 'string' && /^[a-z]{3}$/.test(session.currency) &&
      session.livemode === sessionId.startsWith('cs_live_');
    return {
      check: compatible ? 'paid_verified' : paid ? 'inconsistent' : 'unpaid',
      payment_status: ['paid', 'unpaid', 'no_payment_required'].includes(session.payment_status) ? session.payment_status : 'unknown',
      session_status: ['complete', 'open', 'expired'].includes(session.status) ? session.status : 'unknown',
      livemode: typeof session.livemode === 'boolean' ? session.livemode : null,
      expected_count: cartCount, amount_cents: Number.isSafeInteger(amountCents) ? amountCents : null,
      payment_intent: typeof paymentIntent === 'string' ? paymentIntent : null,
      currency: typeof session.currency === 'string' ? session.currency : null,
      line_count_matched: lineItemsComplete && lineCount === cartCount,
      checked_at: checkedAt
    };
  } catch {
    return unavailable;
  }
}

async function sha256(data) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(data)));
  return [...new Uint8Array(bytes)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function readDecisions(env, sessionId) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_issuance_recovery_decisions?select=id,action,reason_code,provider_check,receipt_state,observed_certificates,held_events,review_required_certificates,checked_at,created_at,actor_label&stripe_session_id=eq.${encodeURIComponent(sessionId)}&order=created_at.desc&limit=20`, {
    method: 'GET', headers: serviceHeaders(env), redirect: 'error'
  });
  if (!res.ok) throw new Error('Decision ledger unavailable');
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('Invalid decision ledger response');
  return rows;
}

export async function onRequestGet({ request, env }) {
  const access = await ownerAccess(request, env);
  if (!access.ok) return privateResponse(access.response);
  const sessionId = String(new URL(request.url).searchParams.get('session_id') || '').trim();
  if (!SESSION_ID.test(sessionId)) return privateResponse(json({ ok: false, error: 'Enter a valid gift Checkout session ID.' }, 400));
  try {
    const [provider, decisions] = await Promise.all([providerCrossCheck(env, sessionId), readDecisions(env, sessionId)]);
    const { payment_intent: _pi, ...safeProvider } = provider;
    return privateResponse(json({ ok: true, build: 675, read_only: true,
      session_id: sessionId, provider: safeProvider, decisions,
      closeout_eligible_for_db_check: provider.check === 'paid_verified',
      caution: 'A paid Stripe session alone is not issuance or delivery proof. Saving a closeout independently rechecks the provider and current database under lock. No customer messages or payment operations occur.' }));
  } catch {
    return privateResponse(json({ ok: false, owner_recovery_hold: true, error: 'Owner evidence ledger is unavailable; keep the recovery hold.' }, 503));
  }
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return privateResponse(json({ ok: false, error: 'Cross-origin decision refused.' }, 403));
  if (request.headers.get('sec-fetch-site') === 'cross-site') return privateResponse(json({ ok: false, error: 'Cross-site decision refused.' }, 403));
  const body = await request.json().catch(() => ({}));
  const access = await ownerAccess(request, env, body);
  if (!access.ok) return privateResponse(access.response);
  const sessionId = String(body.session_id || '').trim();
  const action = String(body.action || '').trim();
  const reason = String(body.reason_code || '').trim();
  const id = String(body.decision_id || '').trim();
  if (!SESSION_ID.test(sessionId) || !UUID.test(id) || !ACTIONS.has(action) || !REASONS.has(reason)) {
    return privateResponse(json({ ok: false, error: 'A valid session, unique decision ID, action and reason are required.' }, 400));
  }
  if (action === 'close_verified_no_action' && (reason !== 'verified_no_duplicate' || body.confirm_no_customer_action !== true)) {
    return privateResponse(json({ ok: false, error: 'Closeout requires explicit no-customer-action confirmation.' }, 409));
  }
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return privateResponse(json({ ok: false, error: 'Decision ledger configuration unavailable.' }, 503));
  }
  const provider = await providerCrossCheck(env, sessionId); // NEVER trust browser payment status.
  if (action === 'close_verified_no_action' && provider.check !== 'paid_verified') {
    return privateResponse(json({ ok: false, owner_recovery_hold: true, error: 'Stripe paid-session cross-check did not pass. The hold remains.' }, 409));
  }
  const fingerprint = await sha256({ sessionId, check: provider.check, paymentStatus: provider.payment_status,
    sessionStatus: provider.session_status, live: provider.livemode, count: provider.expected_count,
    total: provider.amount_cents, paymentIntent: provider.payment_intent, currency: provider.currency });
  const actor = access.actor;
  const actorLabel = String(actor.id || (access.auth_mode === 'legacy_admin_password' ? 'legacy_authorized_owner' : 'owner')).slice(0, 100);
  const payload = {
    p_id: id, p_session_id: sessionId, p_actor_id: UUID.test(String(actor.id || '')) ? actor.id : null,
    p_actor_label: actorLabel, p_action: action, p_reason_code: reason,
    p_provider_check: provider.check, p_provider_payment_status: provider.payment_status,
    p_provider_session_status: provider.session_status, p_provider_livemode: provider.livemode,
    p_provider_expected_count: provider.expected_count, p_provider_amount_cents: provider.amount_cents,
    p_provider_payment_intent: provider.payment_intent, p_provider_currency: provider.currency,
    p_evidence_sha256: fingerprint, p_checked_at: provider.checked_at
  };
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_issuance_recovery_decision`, {
      method: 'POST', redirect: 'error', headers: serviceHeaders(env), body: JSON.stringify(payload)
    });
    if (!res.ok) return privateResponse(json({ ok: false, owner_recovery_hold: true,
      error: res.status === 400 || res.status === 409
        ? 'Decision refused: latest issuance evidence does not permit this closeout. Keep the hold and recheck.'
        : 'Owner ledger could not save this decision. Keep the recovery hold.' }, 409));
    const recorded = await res.json();
    return privateResponse(json({ ok: true, build: 675, decision: recorded,
      customer_contact: 'none', certificate_mutations: 0, payment_mutations: 0,
      next_step: action === 'close_verified_no_action'
        ? 'Issuance is closed as verified with no duplicate action. Verify scheduled delivery separately; no customer contact was sent.'
        : 'Owner recovery hold remains. Continue authorized review; no certificate, refund or message was created.' }));
  } catch {
    return privateResponse(json({ ok: false, owner_recovery_hold: true, error: 'Owner ledger write could not be confirmed. Recheck the decision ID before retrying.' }, 503));
  }
}
