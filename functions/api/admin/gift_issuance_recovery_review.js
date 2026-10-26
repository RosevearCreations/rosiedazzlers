import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

const SESSION_ID = /^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;

function privateResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, private");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(response.body, { status: response.status, headers });
}

async function rows(env, path) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: serviceHeaders(env), method: "GET", redirect: "error"
  });
  if (!response.ok) throw new Error(`Issuance evidence unavailable: HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Invalid issuance evidence response");
  return data;
}

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return privateResponse(access.response);
  const sessionId = String(new URL(request.url).searchParams.get("session_id") || "").trim();
  if (!SESSION_ID.test(sessionId)) return privateResponse(json({ ok: false, error: "Enter a valid Stripe gift Checkout session ID." }, 400));
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return privateResponse(json({ ok: false, error: "Managed issuance evidence unavailable." }, 503));

  try {
    const filter = `stripe_session_id=eq.${encodeURIComponent(sessionId)}`;
    const [receipts, events, certificates] = await Promise.all([
      rows(env, `gift_issuance_receipts?select=state,expected_count,issued_count,hold_reason,replay_count,first_event_id,last_event_id,created_at,last_seen_at&${filter}&limit=1`),
      rows(env, `gift_issuance_webhook_events?select=event_id,event_type,observed_state,delivery_count,first_seen_at,last_seen_at&${filter}&order=first_seen_at.asc&limit=100`),
      rows(env, `gift_certificates?select=id,checkout_line_number,status&${filter}&limit=101`)
    ]);
    const receipt = receipts[0] || null;
    const lines = certificates.map(({ checkout_line_number: line }) => line);
    const complete = Boolean(receipt && receipt.state === "issued" && events.length > 0 &&
      events.length < 100 && certificates.length < 101 &&
      events.every((event) => event.observed_state !== "hold") &&
      receipt.expected_count === receipt.issued_count && receipt.issued_count === certificates.length &&
      new Set(lines).size === lines.length && lines.every((line) => Number.isInteger(line) && line >= 1 && line <= lines.length));
    const decision = complete ? "issued_consistent_review_only" : "owner_recovery_hold";
    return privateResponse(json({ ok: true, build: 674, read_only: true,
      session_id: sessionId, checked_at: new Date().toISOString(), decision,
      receipt: receipt ? {
        state: receipt.state, expected_count: receipt.expected_count, issued_count: receipt.issued_count,
        hold_reason: receipt.hold_reason, replay_count: receipt.replay_count,
        first_event_id: receipt.first_event_id, last_event_id: receipt.last_event_id,
        created_at: receipt.created_at, last_seen_at: receipt.last_seen_at
      } : null,
      observed_certificates: certificates.length,
      // Do not return gift codes, contact details, payment amounts or contexts.
      events, evidence_truncated: events.length >= 100 || certificates.length >= 101,
      owner_action: complete
        ? "Cross-check Stripe's paid session and provider delivery before marking the gift accepted. This review never resends."
        : "HOLD. Check the paid Stripe session, event IDs, each certificate and delivery history in authorized tools. Do not replay manually, issue replacements, refund or resend based on this report alone.",
      no_mutation: "This endpoint makes GET requests only. It does not issue gifts, alter balances or send messages."
    }));
  } catch {
    return privateResponse(json({ ok: false, owner_recovery_hold: true, error: "Issuance evidence could not be reconciled; no manual replay or gift replacement is authorized." }, 502));
  }
}

export async function onRequestPost() {
  return privateResponse(json({ ok: false, error: "Read-only owner review; POST is not allowed." }, 405));
}
