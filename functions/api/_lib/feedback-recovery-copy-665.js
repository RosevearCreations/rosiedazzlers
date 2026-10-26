// Build 665: detection-only review; no incident, refund, marketing or outreach authority.
export const FEEDBACK_RESPONSE_PREVIEW = "Thank you for telling Rosie Dazzlers about your concern. Our team will review the details and contact you through your agreed channel if a response is appropriate. We cannot promise an outcome before assessment.";
export const SERVICE_RECOVERY_PREVIEW = "Please describe the concern and share relevant photos through our approved contact process. We will review the completed service and available evidence before discussing next steps. Refunds or additional work require separate staff approval.";
const plain = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
export function feedbackRecoveryRisks(value) {
  const text = plain(value);
  const risks = [];
  if (/\b(?:every|all|any)\s+(?:complaints?|concerns?|issues?|refund requests?)\s+(?:will|are)\s+(?:(?:automatically\s+)?be\s+|be\s+automatically\s+)?(?:approved|refunded|resolved|accepted)\b/i.test(text)) risks.push("unconditional_resolution_promise");
  if (/\b(?:guaranteed|automatic|instant|immediate)\s+(?:full\s+)?refund\b|\b(?:refund|credit)\s+(?:is|will be)\s+(?:automatically|always)\s+(?:issued|approved|paid)\b/i.test(text)) risks.push("unapproved_refund_promise");
  if (/\b(?:we|our team)\s+(?:will|shall)\s+(?:automatically\s+)?(?:call|text|email|message)\s+you\s+(?:every|each)\s+(?:day|week|month)\b/i.test(text)) risks.push("unauthorized_recurring_contact");
  if (/\b(?:negative|bad|critical)\s+review\b.{0,80}\b(?:remove|delete|hide|suppress)\b|\b(?:remove|delete|hide)\b.{0,70}\b(?:negative|bad)\s+review\b/i.test(text)) risks.push("review_suppression_promise");
  if (/\b(?:customer|you|your household)\s+(?:must|need(?:s)? to|will have to)\s+(?:provide|supply|bring)\s+(?:the|your|a|an)?\s*(?:water|power|electricity|outlet|hose)\b/i.test(text)) risks.push("customer_supplied_utilities");
  return risks;
}
const excerpt = (value) => plain(value).replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]").replace(/https?:\/\/\S+/gi, "[link]").replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]").slice(0, 180);
export function auditFeedbackRecoveryFields(value, source) {
  const findings = [];
  const walk = (node, path, depth, scoped) => {
    if (depth > 6 || findings.length >= 50) return;
    if (typeof node === "string") {
      if (scoped) for (const code of feedbackRecoveryRisks(node)) findings.push({ source, field: path, code, excerpt: excerpt(node) });
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node).slice(0, 100)) {
      if (/^(?:terms|waiver|privacy|legal|consent|invoice|deposit|quote|appointment)(?:_|$)/i.test(key)) continue;
      const relevant = /feedback|complaint|service.?recover|customer.?concern|issue.?resolution|incident.?follow.?up|customer.?support/i.test(key);
      walk(child, `${path}.${key}`, depth + 1, scoped || relevant);
    }
  };
  walk(value, source, 0, /app_management_settings\.(?:feedback_templates|service_recovery_templates|customer_support_templates)$/.test(source));
  return findings;
}
