// Build 661: quote/deposit customer-copy review. No scheduling, sends or
// authorization decisions originate here; owner-managed templates stay intact.
import {
  SAFE_APPOINTMENT_SETUP_COPY,
  hasAppointmentUtilityConflict,
  reconcileAppointmentMessageText
} from "./appointment-preparation-660.js";

export const QUOTE_NEXT_STEPS_COPY =
  "A quote is not a confirmed appointment. We will confirm availability and scheduling separately. Rosie brings standard detailing water and power for normal mobile service; please tell us about access or local restrictions before work is booked.";

export const DEPOSIT_NEXT_STEPS_COPY =
  "A deposit request is not a receipt or a confirmed appointment. Payment is recorded only after verification, and Rosie will confirm scheduling separately.";

export const QUOTE_FOLLOW_UP_SMS_DRAFT =
  "Rosie Dazzlers: please review your quote using the secure link in our email. A quote is not a confirmed booking. Reply to our office with questions.";

const BOOKING_PROMISE_PATTERNS = [
  /\b(?:pay(?:ing)?|submit(?:ting)?|send(?:ing)?|receiv(?:e|ing))\s+(?:the|your|a)?\s*deposit\b.{0,80}\b(?:automatically\s+)?(?:confirms?|guarantees?|secures?|books?)\b.{0,32}\b(?:appointment|booking|slot|date)\b/i,
  /\b(?:accept(?:ing)?|approv(?:e|ing))\s+(?:the|your|a)?\s*quote\b.{0,80}\b(?:automatically\s+)?(?:confirms?|guarantees?|books?|reserves?)\b.{0,32}\b(?:appointment|booking|slot|date)\b/i,
  /\b(?:your|the)\s+(?:appointment|booking|slot)\s+(?:is|will\s+be)\s+(?:automatically\s+)?(?:confirmed|guaranteed|reserved)\s+(?:once|when|after)\b.{0,50}\b(?:quote|deposit|payment)\b/i
];

function plain(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function hasQuoteBookingPromise(value) {
  const text = plain(value);
  return BOOKING_PROMISE_PATTERNS.some((pattern) => pattern.test(text));
}

function hasQuoteUtilityConflict(value) {
  return hasAppointmentUtilityConflict(value)
    || /\b(?:please\s+)?(?:provide|bring|supply)\s+(?:(?:a|an|your|own|the)\s+)?(?:hose|water(?![-\s]+(?:use|rules?|restrictions?|information))|power|outlet|electricity)\b/i.test(plain(value));
}

export function quoteCopyRiskCodes(value) {
  const risks = [];
  if (hasQuoteUtilityConflict(value)) risks.push("customer_supplied_utilities");
  if (hasQuoteBookingPromise(value)) risks.push("premature_booking_promise");
  return risks;
}

// Limit automatic reconciliation to greeting/intro copy explicitly selected
// by staff. Never rewrite the quote body, prices, deposits, payment evidence,
// customer consent, legal terms, or stored master templates.
export function reconcileQuoteIntroCopy(value) {
  const text = reconcileUtilities(value);
  if (!hasQuoteBookingPromise(text)) return text;
  return text.split(/(?<=[.!?])\s+|\r?\n/).map((sentence) =>
    hasQuoteBookingPromise(sentence) ? QUOTE_NEXT_STEPS_COPY : sentence
  ).join("\n");
}

export function reconcileDepositReceiptIntroCopy(value) {
  const text = reconcileUtilities(value);
  if (!hasQuoteBookingPromise(text)) return text;
  return text.split(/(?<=[.!?])\s+|\r?\n/).map((sentence) =>
    hasQuoteBookingPromise(sentence) ? DEPOSIT_NEXT_STEPS_COPY : sentence
  ).join("\n");
}

function reconcileUtilities(value) {
  const original = String(value || "");
  if (!hasQuoteUtilityConflict(original)) return original;
  const text = reconcileAppointmentMessageText(original);
  if (!hasQuoteUtilityConflict(text)) return text;
  return text.split(/(?<=[.!?])\s+|\r?\n/).map((sentence) =>
    hasQuoteUtilityConflict(sentence) ? SAFE_APPOINTMENT_SETUP_COPY : sentence
  ).join("\n");
}

function redactedExcerpt(value) {
  return plain(value)
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]")
    .replace(/https?:\/\/\S+/gi, "[link]")
    .slice(0, 180);
}

// Only quote/proposal/follow-up/deposit/receipt-related template fields; do
// not sweep legal notices, appointment copy, invoices or unrelated campaigns.
export function auditQuoteDepositTemplateFields(value, source = "document_templates") {
  const findings = [];
  if (!value || typeof value !== "object") return findings;
  const walk = (node, path, depth = 0, inScope = false) => {
    if (depth > 6 || findings.length >= 50) return;
    if (typeof node === "string") {
      if (!inScope) return;
      for (const code of quoteCopyRiskCodes(node)) {
        findings.push({ source, field: path, code, excerpt: redactedExcerpt(node) });
      }
      return;
    }
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    for (const [key, child] of Object.entries(node).slice(0, 100)) {
      if (/^(?:appointment|booking_confirmation|refund|invoice|terms|waiver|consent|legal|privacy)(?:_|$)/i.test(key)) continue;
      const quoteContext = /quote|proposal|deposit|receipt|follow.?up/i.test(key);
      walk(child, `${path}.${key}`, depth + 1, inScope || quoteContext);
    }
  };
  walk(value, source, 0, /app_management_settings\.(?:quote_templates|proposal_templates|receipt_templates)$/.test(source));
  return findings.slice(0, 50);
}
