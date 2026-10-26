// Build 659 — service-area access-rule copy classification and public display.
// Municipal water restrictions, drainage rules and owner-managed records remain separate authorities.
import { hasTownMobileSetupConflict } from "./town-mobile-setup.js";
import { isLegacyCustomerUtilityClaim } from "./mobile-setup-policy.js";

export const SAFE_SERVICE_AREA_ACCESS_RULE =
  "Confirm a safe, permitted, reasonably level work area, legal parking, apartment/condo access and building rules before arrival. Rosie brings standard detailing water and power; local water-use and runoff restrictions still apply.";

export function hasServiceAreaUtilityConflict(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return Boolean(text) && (
    hasTownMobileSetupConflict(text)
    || isLegacyCustomerUtilityClaim(text)
    || /\b(?:confirm|check|verify|require|arrange|assess)\b.{0,36}\b(?:hose\s*\/\s*power|water\s*\/\s*power|power\s*\/\s*water|outlet\s*\/\s*hose)\s+(?:availability|access|supply)\b/i.test(text)
    || /\b(?:water|electric(?:al|ity)?|power|hose|outlet)\s+(?:must|needs?\s+to)\s+be\s+(?:available|provided|supplied)\s+by\s+(?:the\s+)?customer\b/i.test(text)
  );
}

export function auditServiceAreaAccessRows(rows) {
  return (Array.isArray(rows) ? rows : []).slice(0, 500).flatMap((row, index) => {
    if (!row || typeof row !== "object" || !hasServiceAreaUtilityConflict(row.access_rule)) return [];
    return [{
      index,
      key: String(row.key || row.value || row.label || "").slice(0, 120),
      county: String(row.county || "").slice(0, 100),
      field: "access_rule",
      excerpt: String(row.access_rule).trim().slice(0, 200)
    }];
  });
}

export function guardPublicServiceAreaAccessRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => row && typeof row === "object"
    ? { ...row, access_rule: hasServiceAreaUtilityConflict(row.access_rule) ? SAFE_SERVICE_AREA_ACCESS_RULE : row.access_rule }
    : row);
}
