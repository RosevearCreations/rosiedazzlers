// Build 671 — copy-only guidance. Do not infer inbox delivery from provider acceptance.
export const GIFT_DELIVERY_PREVIEW = "Choose the recipient email carefully and select a preferred send date. A gift can be waiting for its send date, waiting for staff review, queued for email, accepted by the email provider, or failed. Provider acceptance does not prove it reached the recipient's inbox. If the recipient has not received it, check spam/junk and contact Rosie Dazzlers through the contact page with the purchase reference; do not publish gift codes or recipient details. Staff must inspect the recipient and purchaser-copy notification events before deciding whether a resend is safe. A retry is not a new purchase or a refund.";

const RULES = [
  ["guaranteed_inbox_delivery", /\b(?:guaranteed|always|instantly)\s+(?:delivered|arrives?\s+in\s+(?:the\s+)?inbox)\b|\b(?:will|must)\s+(?:always\s+)?reach\s+(?:your|the)\s+inbox\b/i],
  ["sent_proves_received", /\b(?:sent|provider\s+accepted|email\s+accepted)\b.{0,75}\b(?:proves?|guarantees?|confirms?)\b.{0,50}\b(?:received|delivered|inbox)\b/i],
  ["failed_means_refunded", /\b(?:failed|undelivered)\s+(?:gift|email|delivery)\b.{0,75}\b(?:automatically|immediately)\s+(?:refunded|cancelled)\b/i],
  ["automatic_duplicate_resend", /\b(?:failed|missing|late)\s+(?:gift|email|delivery)\b.{0,75}\b(?:automatically\s+resend|send\s+another\s+gift)\b/i],
  ["public_gift_code_disclosure", /\b(?:post|publish|share)\s+(?:(?:the|your|full)\s+){0,2}(?:gift|redemption)\s+code\b.{0,65}?\b(?:publicly|social\s+media|online|anyone)\b/i]
];

export function deliveryReadable(value) {
  return String(value ?? "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/&(?:nbsp|amp|quot|#39);/gi, " ")
    .replace(/\s+/g, " ").trim();
}

export function deliveryCopyRisks(value) {
  const copy = deliveryReadable(value);
  return RULES.filter(([code, regex]) => [...copy.matchAll(new RegExp(regex.source, "gi"))].some((match) => {
    if (code === "sent_proves_received" && /\b(?:does\s+not|doesn['’]?t|not|never)\b.{0,35}\b(?:prove|guarantee|confirm)\b/i.test(match[0])) return false;
    if (code === "public_gift_code_disclosure" && /\b(?:do\s+not|don['’]?t|never)\s*$/i.test(copy.slice(Math.max(0, match.index - 16), match.index))) return false;
    return true;
  })).map(([code]) => code);
}

function safeExcerpt(value, code) {
  const copy = deliveryReadable(value);
  const at = RULES.find(([name]) => name === code)?.[1].exec(copy)?.index ?? 0;
  return copy.slice(Math.max(0, at - 28), Math.min(copy.length, at + 195))
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]")
    .replace(/https?:\/\/\S+/gi, "[link]")
    .replace(/\b(?:cs_(?:test_|live_)?|RD[-_])[a-z0-9_-]+\b/gi, "[reference]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]").slice(0, 170);
}

export function auditDeliveryFields(value, source) {
  const findings = [];
  const scope = /gift|deliver|recipient|purchaser|resend|email|notification/i;
  const check = (text, field) => {
    for (const code of deliveryCopyRisks(text)) {
      if (findings.length < 50) findings.push({ field, code, excerpt: safeExcerpt(text, code) });
    }
  };
  const rows = Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : null;
  if (rows) {
    rows.slice(0, 100).forEach((row, index) => {
      if (!scope.test(`${row?.category || ""} ${row?.question || ""}`)) return;
      check(row?.question, `rows[${index}].question`);
      check(row?.answer, `rows[${index}].answer`);
    });
    return findings;
  }
  const walk = (node, path, depth, inScope) => {
    if (depth > 7 || findings.length >= 50) return;
    if (typeof node === "string") { if (inScope || scope.test(node)) check(node, path); return; }
    if (!node || typeof node !== "object") return;
    for (const [key, nested] of Object.entries(node).slice(0, 100)) {
      if (/^(?:privacy|analytics|security|marketing|consent)(?:_|$)/i.test(key)) continue;
      walk(nested, `${path}.${key}`, depth + 1, inScope || scope.test(key));
    }
  };
  walk(value, source, 0, scope.test(source));
  return findings;
}

const CHECKLIST = {
  "/gifts": [
    ["send_date_is_preference", /(?:preferred\s+send\s+date|chosen\s+delivery\s+date)/i, "Describe the requested send date as a preference, not guaranteed inbox arrival."],
    ["delivery_state_meaning", /(?:waiting|queued|sent).{0,140}(?:provider|delivered|inbox|failed)/i, "Explain waiting/queued/provider-accepted/failed delivery states without implying inbox receipt."],
    ["failed_delivery_help", /(?:not\s+(?:received|arrived)|failed\s+delivery).{0,160}(?:contact|help|support)/i, "Tell purchasers what to do when the recipient has not received the e-gift."],
    ["owner_safe_resend", /(?:resend|retry).{0,175}(?:staff|review|notification|contact)/i, "Explain that staff review delivery evidence before any resend, and no automatic duplicate gift is created."],
    ["protect_gift_code", /(?:don['’]?t|do\s+not|never).{0,75}(?:publish|share|post).{0,50}gift\s+code/i, "Remind customers not to post or share gift codes publicly."]
  ],
  "/gift-cards": [
    ["delivery_support_path", /(?:gift|recipient).{0,145}(?:email|delivery|receive).{0,155}(?:contact|help|support)/i, "Provide a direct contact route for an undelivered gift."]
  ]
};

export function deliveryGuidanceGaps(path, raw) {
  const copy = String(raw || "").slice(0, 170000).replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  return (CHECKLIST[path] || []).filter(([, regex]) => !regex.test(copy)).map(([code, , note]) => ({ code, note }));
}

// These are source-review findings, not claims about any actual customer or provider event.
export const DELIVERY_RUNTIME_FINDINGS = [
  { code: "provider_accepted_not_inbox_confirmed", source: "functions/api/_lib/gift-delivery.js", note: "The gift status 'sent' is written after provider dispatch returns ok; no recipient inbox or bounce confirmation is checked. Avoid saying 'delivered' to the purchaser." },
  { code: "purchaser_copy_failure_blurs_recipient_result", source: "functions/api/_lib/gift-delivery.js", note: "A purchaser-copy send failure can set the shared gift delivery_status to 'failed' even after the recipient event was sent. Review both event IDs individually before retry." },
  { code: "retry_event_does_not_reconcile_gift_context", source: "functions/api/notifications_process.js", note: "Notification retry updates the event but does not update gift purchase_context delivery_status; a gift may still read 'failed' after successful event retry." },
  { code: "scheduled_date_template_context_mismatch", source: "functions/api/_lib/gift-delivery.js", note: "Email payload copy refers to gift.delivery_date, while scheduling reads purchase_context.gift_delivery.delivery_date. Owner should verify the displayed date." },
  { code: "resend_duplicate_risk", source: "functions/api/gifts/scheduled_delivery_process.js", note: "A failed gift with an existing event ID may be picked up again by the scheduled processor, which creates a new event. Staff must review existing recipient event status before attempting a resend." }
];

export const DELIVERY_STATUS_GUIDANCE = [
  { state: "waiting", customer: "Your gift is waiting for the preferred send time or staff review; it has not been sent yet.", owner: "Check delivery date/timezone, automation settings and approval before taking action." },
  { state: "queued", customer: "The gift email is queued for sending. Delivery to the recipient is not confirmed.", owner: "Check the recipient notification event and scheduling; do not create another gift." },
  { state: "sent", customer: "Our email provider accepted the gift message. This does not confirm the recipient received it.", owner: "Inspect provider/event evidence; ask the recipient to check spam/junk before considering any resend." },
  { state: "failed", customer: "We could not confirm successful sending. Please contact Rosie Dazzlers with the purchase reference.", owner: "Identify which recipient/copy event failed, inspect attempts and error, then use authorized retry only if safe." },
  { state: "unknown", customer: "The current delivery state cannot be confirmed. Contact Rosie Dazzlers for help.", owner: "Reconcile gift context and notification events; do not infer a delivery outcome from a receipt." }
];
