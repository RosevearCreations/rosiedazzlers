// Build 664: advisory copy inspection only, never a new customer-care message.
export const COMPLETION_CARE_PREVIEW = "After your detail, follow the drying and product-specific curing guidance supplied by our team. Coating, glass and interior treatments can have different first-use instructions. If you have concerns, contact Rosie Dazzlers so we can review the completed work.";
const plain = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
export function completionCopyRisks(value) {
  const text = plain(value);
  const codes = [];
  if (/\b(?:customer|you|your household)\s+(?:must|need(?:s)? to|will have to)\s+(?:provide|supply|bring)\s+(?:the|your|a|an)?\s*(?:water|power|electricity|outlet|hose)\b/i.test(text)) codes.push("customer_supplied_utilities");
  if (/\b(?:all|every|any)\s+(?:coatings?|treatments?|surfaces?|fabrics?)\s+(?:are|is)\s+(?:fully\s+)?(?:dry|cured|safe to wash)\s+(?:immediately|instantly)\b/i.test(text)) codes.push("universal_instant_cure");
  if (/\b(?:guaranteed|lifetime|permanent)\s+(?:stain|scratch|damage|odor|odour|rust)\s*(?:removal|protection|prevention)\b/i.test(text)) codes.push("unsupported_permanent_result");
  if (/\b(?:completion|job finished|service complete)\b.{0,75}\b(?:automatically\s+)?(?:settles?|waives?|refunds?)\b.{0,40}\b(?:invoice|balance|payment|deposit)\b/i.test(text)) codes.push("premature_payment_claim");
  return codes;
}
const excerpt = (value) => plain(value).replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]").replace(/https?:\/\/\S+/gi, "[link]").replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]").slice(0, 180);
export function auditCompletionFaq(value, source) {
  const findings = [];
  const check = (text, field) => { for (const code of completionCopyRisks(text)) if (findings.length < 50) findings.push({ source, field, code, excerpt: excerpt(text) }); };
  if (Array.isArray(value?.items)) value.items.slice(0, 100).forEach((item, i) => { check(item?.question, `items[${i}].question`); check(item?.answer, `items[${i}].answer`); });
  else if (Array.isArray(value)) value.slice(0, 100).forEach((item, i) => { check(item?.question, `rows[${i}].question`); check(item?.answer, `rows[${i}].answer`); });
  else if (value && typeof value === "object") {
    const walk = (node, path, depth, scoped) => {
      if (depth > 6 || findings.length >= 50) return;
      if (typeof node === "string") { if (scoped) check(node, path); return; }
      if (!node || typeof node !== "object") return;
      for (const [key, child] of Object.entries(node).slice(0, 100)) {
        if (/^(?:terms|waiver|privacy|legal|consent|refund|invoice|deposit|quote)(?:_|$)/i.test(key)) continue;
        walk(child, `${path}.${key}`, depth + 1, scoped || /completion|after.?care|customer.?care|post.?service|faq|service.?summary/i.test(key));
      }
    };
    walk(value, source, 0, /app_management_settings\.(?:faq_templates|aftercare_templates|completion_templates)$/.test(source));
  }
  return findings;
}
