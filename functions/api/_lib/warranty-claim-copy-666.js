// Build 666: advisory wording review only. Never adjudicates claims or interprets legal rights.
export const WARRANTY_REVIEW_PREVIEW = "Questions about the work performed? Contact Rosie Dazzlers with your service details and any relevant photos. Our team will review the concern, the agreed service scope and applicable terms before discussing next steps. This message does not approve or deny a claim.";

const plain = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const PATTERNS = [
  ["unqualified_lifetime_guarantee", /\b(?:unlimited|unconditional|lifetime|forever)\s+(?:warranty|guarantee|protection|coverage)\b|\b(?:guaranteed|warranted)\s+(?:for\s+life|forever)\b/i],
  ["automatic_claim_or_payout", /\b(?:all|every|any)\s+(?:claims?|warranty\s+claims?)\s+(?:are|will\s+be)\s+(?:automatically\s+)?(?:approved|paid|accepted|covered)\b|\b(?:automatic|guaranteed|instant)\s+(?:claim\s+approval|payout|replacement|refund)\b/i],
  ["statutory_rights_disclaimer", /\b(?:no|zero)\s+(?:consumer|statutory|legal)\s+rights\b|\b(?:waive|give\s+up|forfeit)\s+(?:all|your|any)\s+(?:consumer|statutory|legal)\s+rights\b/i],
  ["unqualified_damage_protection", /\b(?:100%|complete|total|permanent)\s+(?:scratch|stain|rust|damage|chip|fade|water)\s*(?:proof|protection|prevention|coverage)\b/i],
  ["unsupported_claim_deadline", /\b(?:all|any|every)\s+(?:warranty\s+)?claims?\s+(?:must|have\s+to)\s+be\s+(?:submitted|filed|reported)\s+within\s+24\s+hours\b/i]
];

export function warrantyCopyRisks(value) {
  const text = plain(value);
  return PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([code]) => code);
}

const excerpt = (value) => plain(value)
  .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]")
  .replace(/https?:\/\/\S+/gi, "[link]")
  .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
  .slice(0, 180);

export function auditWarrantyClaimFields(value, source) {
  const findings = [];
  const check = (value, path) => {
    for (const code of warrantyCopyRisks(value)) {
      if (findings.length < 50) findings.push({ source, field: path, code, excerpt: excerpt(value) });
    }
  };
  if (Array.isArray(value?.items)) {
    value.items.slice(0, 100).forEach((item, i) => {
      const text = `${plain(item?.category)} ${plain(item?.question)}`;
      if (/warrant|guarantee|claim|damage|service.?issue/i.test(text)) {
        check(item?.question, `items[${i}].question`);
        check(item?.answer, `items[${i}].answer`);
      }
    });
    return findings;
  }
  if (Array.isArray(value)) {
    value.slice(0, 100).forEach((item, i) => {
      const scope = `${plain(item?.category)} ${plain(item?.question)}`;
      if (/warrant|guarantee|claim|damage|service.?issue/i.test(scope)) {
        check(item?.question, `rows[${i}].question`);
        check(item?.answer, `rows[${i}].answer`);
      }
    });
    return findings;
  }
  const walk = (node, path, depth, inScope) => {
    if (depth > 6 || findings.length >= 50) return;
    if (typeof node === "string") { if (inScope) check(node, path); return; }
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node).slice(0, 100)) {
      if (/^(?:privacy|consent|invoice|deposit|quote|appointment)(?:_|$)/i.test(key)) continue;
      walk(child, `${path}.${key}`, depth + 1, inScope || /warrant|guarantee|claim|service.?issue|damage.?report|claim.?follow.?up/i.test(key));
    }
  };
  walk(value, source, 0, /app_management_settings\.(?:warranty_templates|guarantee_templates|claim_templates)$/.test(source));
  return findings;
}
