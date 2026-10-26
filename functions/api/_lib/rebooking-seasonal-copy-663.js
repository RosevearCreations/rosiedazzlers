// Build 663: read-only audit; never authorizes marketing or appointment confirmation.
export const REBOOKING_PREVIEW = "Ready for another detail? Contact Rosie Dazzlers to request availability and a new quote. A reminder or request does not reserve an appointment. Rosie brings standard detailing water and power for normal mobile service.";
export const SEASONAL_PREVIEW = "Seasonal maintenance availability depends on temperature, weather, safe access, service eligibility and local rules. Please ask our team for a current quote and confirmed time; no visit is booked by this reminder.";
const plain = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
export function rebookingCopyRisks(value) {
  const text = plain(value);
  const risks = [];
  if (/\b(?:customer|you|your household)\s+(?:must|need(?:s)? to|will have to)\s+(?:provide|supply|bring)\s+(?:the|your|a|an)?\s*(?:water|power|electricity|outlet|hose)\b/i.test(text)) risks.push("customer_supplied_utilities");
  if (text.split(/[.!?]\s+/).some((sentence) => /\b(?:reminder|rebook(?:ing)?|reply|request)\b.{0,90}\b(?:automatically\s+)?(?:confirms?|guarantees?|reserves?|books?)\b.{0,40}\b(?:appointment|booking|slot|date)\b/i.test(sentence) && !/\b(?:does not|do not|will not|cannot|never)\b/i.test(sentence))) risks.push("premature_rebooking_promise");
  if (/\b(?:all|every|any)\s+(?:winter|seasonal|cold.weather)\s+(?:services?|appointments?|dates?)\s+(?:are|is)\s+(?:always\s+)?available\b|\bguaranteed\s+(?:winter|year.round)\s+(?:service|availability)\b/i.test(text)) risks.push("unverified_seasonal_availability");
  if (/\b(?:we|our team)\s+(?:will|shall)\s+(?:automatically\s+)?(?:text|email|message|contact)\s+you\s+(?:every|each)\s+(?:week|month|season|year)\b/i.test(text)) risks.push("unsanctioned_recurring_contact_claim");
  return risks;
}
const excerpt = (value) => plain(value).replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]").replace(/https?:\/\/\S+/gi, "[link]").replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]").slice(0, 180);
export function auditRebookingSeasonalFields(value, source) {
  const findings = [];
  const walk = (node, path, depth, relevant) => {
    if (depth > 6 || findings.length >= 50) return;
    if (typeof node === "string") {
      if (relevant) for (const code of rebookingCopyRisks(node)) findings.push({ source, field: path, code, excerpt: excerpt(node) });
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node).slice(0, 100)) {
      if (/^(?:terms|waiver|privacy|legal|consent|refund|deposit|invoice|quote|appointment_confirmation)(?:_|$)/i.test(key)) continue;
      const scoped = /rebook|maintenance.?remind|seasonal.?remind|retention.?remind|next.?service|repeat.?visit/i.test(key);
      walk(child, `${path}.${key}`, depth + 1, relevant || scoped);
    }
  };
  walk(value, source, 0, /app_management_settings\.(?:rebooking_templates|maintenance_reminder_templates|seasonal_reminder_templates)$/.test(source));
  return findings;
}
