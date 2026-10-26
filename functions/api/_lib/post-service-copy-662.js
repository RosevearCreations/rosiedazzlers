// Build 662: detection only. Owner-managed messages and delivery state are immutable here.
export const AFTERCARE_PREVIEW = "Thank you for choosing Rosie Dazzlers. Follow the drying, curing and first-wash instructions supplied for the products used on your vehicle. Contact our team if anything needs attention.";
export const REVIEW_PREVIEW = "Thank you for choosing Rosie Dazzlers. If you would like to share feedback, please use the review link provided by our team. Review invitations are subject to existing consent and eligibility checks.";

const RISKS = [
  ["customer_supplied_utilities", /\b(?:customer|you|your household)\s+(?:must|need(?:s)? to|will have to)\s+(?:provide|supply|bring)\s+(?:the|your|a|an)?\s*(?:water|power|electricity|outlet|hose)\b/i],
  ["review_incentive_or_pressure", /\b(?:free|discount|coupon|reward|gift|cash|prize)\b.{0,65}\b(?:five.star|5.star|positive|review|rating)\b|\b(?:five.star|5.star|positive)\b.{0,65}\b(?:review|rating)\b/i],
  ["guaranteed_review_publication", /\b(?:your|the)\s+review\s+(?:will|shall)\s+(?:(?:automatically\s+)?be\s+|be\s+automatically\s+)?(?:posted|published|featured)\b/i],
  ["universal_aftercare_claim", /\b(?:all|every|any)\s+(?:coatings?|protectants?|surfaces?)\s+(?:are|is)\s+(?:fully\s+)?cured\s+(?:immediately|instantly)\b/i]
];
const text = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
export function postServiceRisks(value) { return RISKS.filter(([, pattern]) => pattern.test(text(value))).map(([code]) => code); }
function excerpt(value) { return text(value).replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]").replace(/https?:\/\/\S+/gi, "[link]").replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]").slice(0, 180); }

export function auditPostServiceFields(value, source) {
  const findings = [];
  const walk = (node, path, depth, scoped) => {
    if (depth > 6 || findings.length >= 50) return;
    if (typeof node === "string") {
      if (scoped) for (const code of postServiceRisks(node)) findings.push({ source, field: path, code, excerpt: excerpt(node) });
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node).slice(0, 100)) {
      if (/^(?:terms|waiver|privacy|legal|consent|invoice|refund|deposit|quote|appointment)(?:_|$)/i.test(key)) continue;
      const relevant = /after.?care|post.?service|thank.?you|review.?request|review.?invitation|feedback.?request|completion.?follow.?up/i.test(key);
      walk(child, `${path}.${key}`, depth + 1, scoped || relevant);
    }
  };
  walk(value, source, 0, /app_management_settings\.(?:aftercare_templates|review_request_templates|post_service_templates)$/.test(source));
  return findings;
}
