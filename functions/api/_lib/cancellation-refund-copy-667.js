// Build 667: advisory copy review. These findings do not interpret a contract or authorize financial actions.
export const CANCELLATION_REFUND_PREVIEW = "Need to cancel or move your appointment? Please contact Rosie Dazzlers with your booking details. We will check available times, the agreed booking terms, payment status and any work already completed before confirming options. A refund or new time is not approved by this message.";

export const readable = (value) => String(value ?? "")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]*>/g, " ")
  .replace(/&(?:nbsp|amp|quot|#39);/gi, " ")
  .replace(/\s+/g, " ").trim();

const RULES = [
  ["automatic_refund_promise", /\b(?:all|any|every)\s+(?:deposits?|payments?|bookings?|cancellations?)\s+(?:are|is|will\s+be)\s+(?:automatically\s+)?(?:fully\s+)?refundable\b|\b(?:instant|automatic|guaranteed|immediate)\s+(?:full\s+)?refund\b/i],
  ["categorical_no_refund", /\b(?:no refunds?|never refundable|non[ -]?refundable)\b/i],
  ["unconditional_free_reschedule", /\b(?:always|guaranteed|unlimited|automatically)\s+(?:free\s+)?reschedul(?:e|ing)|\bfree\s+reschedul(?:e|ing)\s+(?:anytime|always|unlimited)\b/i],
  ["unqualified_fee_waiver", /\b(?:all|every|any)\s+(?:late\s+)?cancellation\s+fees?\s+(?:are|will\s+be)\s+(?:automatically\s+)?waived\b/i],
  ["absolute_cancellation_cutoff", /\b(?:no|never|cannot|can't)\s+(?:cancellations?|rescheduling|refunds?)\s+(?:after|within)\s+(?:24|48)\s+hours\b/i],
  ["refund_status_overstatement", /\b(?:refund|money)\s+(?:is|has\s+been|was)\s+(?:already\s+)?(?:issued|sent|returned|processed)\s+(?:as\s+soon\s+as|when)\s+(?:you\s+)?(?:request|cancel|reschedule)\b/i],
  ["consumer_rights_exclusion", /\b(?:waive|forfeit|lose|give\s+up)\s+(?:all|any|your)\s+(?:statutory|consumer|legal)\s+rights\b/i]
];

export function cancellationRefundCopyRisks(value) {
  const text = readable(value);
  return RULES.filter(([, expression]) => expression.test(text)).map(([code]) => code);
}

const excerpt = (value) => readable(value)
  .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]")
  .replace(/https?:\/\/\S+/gi, "[link]")
  .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
  .slice(0, 180);
const scope = /cancel|reschedul|refund|deposit|booking|appointment|payment|weather|policy|terms/i;

export function auditCancellationRefundFields(value, source) {
  const findings = [];
  const check = (text, field) => {
    for (const code of cancellationRefundCopyRisks(text)) {
      if (findings.length < 50) findings.push({ source, field, code, excerpt: excerpt(text) });
    }
  };
  const auditRows = (rows, prefix) => {
    rows.slice(0, 100).forEach((row, i) => {
      if (!scope.test(`${readable(row?.category)} ${readable(row?.question)}`)) return;
      check(row?.question, `${prefix}[${i}].question`);
      check(row?.answer, `${prefix}[${i}].answer`);
    });
  };
  if (Array.isArray(value?.items)) auditRows(value.items, "items");
  else if (Array.isArray(value)) auditRows(value, "rows");
  else if (value && typeof value === "object") {
    const walk = (node, path, depth, inScope) => {
      if (depth > 7 || findings.length >= 50) return;
      if (typeof node === "string") { if (inScope) check(node, path); return; }
      if (!node || typeof node !== "object") return;
      for (const [key, child] of Object.entries(node).slice(0, 100)) {
        if (/^(?:privacy|consent|security|analytics|marketing)(?:_|$)/i.test(key)) continue;
        walk(child, `${path}.${key}`, depth + 1, inScope || scope.test(key));
      }
    };
    walk(value, source, 0, /app_management_settings\.(?:refund_templates|site_policies)$/.test(source));
  }
  return findings;
}

export function compareDepositPolicy(termsText, policyText) {
  const terms = readable(termsText);
  const policy = readable(policyText);
  if (/\ba\s+deposit\s+is\s+required\b/i.test(terms) && /\bdeposits?\s+may\s+be\s+requested\b/i.test(policy)) {
    return { code: "deposit_requirement_conflict", terms_source: "/terms", policy_source: "data/site_policies.json", note: "Public Terms require a deposit while the bundled policy says deposits may be requested. Owner must reconcile authoritative wording." };
  }
  return null;
}
