import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { GIFT_DELIVERY_UUID, reconcileGiftDeliveryEvidence } from "../_lib/gift-delivery-evidence-672.js";

const HISTORY_LIMIT = 30;

function noStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, private");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(response.body, { status: response.status, headers });
}

async function readRows(env, endpoint) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${endpoint}`, {
    method: "GET", headers: serviceHeaders(env), redirect: "error"
  });
  if (!response.ok) throw new Error(`Managed source HTTP ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Managed source response invalid");
  return rows;
}

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);
  const giftId = String(new URL(request.url).searchParams.get("gift_id") || "").trim();
  if (!GIFT_DELIVERY_UUID.test(giftId)) return noStore(json({ ok: false, error: "Enter one valid gift UUID from the authorized customer record." }, 400));
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return noStore(json({ ok: false, error: "Managed delivery records are unavailable." }, 503));

  try {
    const giftRows = await readRows(env, `gift_certificates?${new URLSearchParams({
      select: "id,status,recipient_email,purchaser_email,purchase_context", id: `eq.${giftId}`, limit: "1"
    })}`);
    const gift = giftRows[0] || null;
    if (!gift) return noStore(json({ ok: false, error: "No gift record found for that identifier." }, 404));

    // JSONB path filter limits the source to the requested gift, and select excludes payload,
    // provider response, subject, message bodies and actual contact addresses.
    const eventRows = await readRows(env, `notification_events?${new URLSearchParams({
      select: "id,event_type,status,attempt_count,max_attempts,next_attempt_at,last_error,created_at",
      "payload->>gift_id": `eq.${giftId}`,
      event_type: "in.(gift_scheduled_delivery_email,gift_scheduled_delivery_purchaser_copy_email)",
      order: "created_at.desc", limit: String(HISTORY_LIMIT)
    })}`);
    const evidence = reconcileGiftDeliveryEvidence(gift, eventRows, { now: new Date(), history_complete: true, history_truncated: eventRows.length >= HISTORY_LIMIT });
    return noStore(json({
      ok: true, build: 672, checked_at: new Date().toISOString(), read_only: true,
      gift_id: giftId, evidence,
      interpretation: "Notification 'sent' means provider accepted the message, not inbox delivery; an event retry may have updated notification status without updating the gift's recorded delivery status.",
      privacy_hold: "Gift code, email addresses, purchaser/recipient names, message bodies, notification payloads, provider response, Stripe reference and raw provider errors are not returned.",
      dispatch_hold: "This review makes only bounded GET requests. It neither retries or sends an event, creates a replacement gift, changes the gift delivery context, alters balance, nor issues a refund.",
      owner_action: "Use Admin Notifications to inspect the exact event and permissions before any authorized retry. Reconcile recipient and purchaser-copy states separately; if evidence is incomplete or inconsistent, do not resend."
    }));
  } catch {
    return noStore(json({ ok: false, error: "Gift or notification evidence could not be read. No resend is authorized until staff can verify both sources." }, 502));
  }
}

export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
