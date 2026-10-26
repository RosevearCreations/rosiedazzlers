// Build 656: bounded, read-only classification of mobile setup wording.
// The owner-established public operating model is Rosie-supplied standard
// detailing water and power. Never mutate managed policies from this module.

export const PUBLIC_MOBILE_SETUP_COPY =
  "Safe work area required · Rosie brings standard detailing water and power; local restrictions still apply.";

export function isLegacyCustomerUtilityClaim(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return /\b(?:customers?|you)\b.{0,18}\b(?:must\s+|need\s+to\s+|required\s+to\s+|should\s+)?(?:provide|provides|supply|supplies|bring)\b\s+(?:(?:their|own|the|a|an|working|outdoor|household|available|sufficient)\s+){0,4}(?:(?:access\s+to|a\s+supply\s+of)\s+)?(?:water|power|electricity|hose)\b/i.test(text)
    || /\bcustomer[- ]supplied\s+(?:water|power|electricity)\b/i.test(text)
    || /\bif\s+(?:water|power|hose)(?:\s*\/\s*(?:water|power))?.{0,32}\b(?:unavailable|not available)\b.{0,45}\b(?:additional|extra)\s+(?:charges?|fees?)\b/i.test(text);
}

export function classifyMobileSetupCopy(value) {
  const text = String(value || "").trim();
  if (!text) return "missing";
  if (isLegacyCustomerUtilityClaim(text)) return "conflict";
  const rosieSupplies = /\bRosie\b.{0,38}\b(?:brings|supplies|provides)\b.{0,68}\b(?:water|power)\b/i.test(text);
  const bothUtilities = /\bwater\b.{0,32}\bpower\b|\bpower\b.{0,32}\bwater\b/i.test(text);
  return rosieSupplies && bothUtilities ? "aligned" : "review";
}

export function resolvePublicMobileSetupCopy(value) {
  const text = String(value || "").trim();
  return isLegacyCustomerUtilityClaim(text) || !text ? PUBLIC_MOBILE_SETUP_COPY : text;
}
