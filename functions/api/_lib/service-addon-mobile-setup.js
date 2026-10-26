// Build 658 — bounded service/add-on marketing-copy reconciliation.
// Audit and public guard must not rewrite managed data or municipal rules.
import { hasTownMobileSetupConflict } from "./town-mobile-setup.js";
import { isLegacyCustomerUtilityClaim } from "./mobile-setup-policy.js";

export const SERVICE_ADDON_SAFE_SETUP_COPY =
  "Rosie brings standard detailing water and power. Please provide a safe, permitted work area; local water-use, runoff, weather and site rules still apply.";

export function hasServiceAddonMobileSetupConflict(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return Boolean(text) && (
    hasTownMobileSetupConflict(text)
    || isLegacyCustomerUtilityClaim(text)
    || /\bwater\s*\/\s*power\s+rules\b/i.test(text)
  );
}

export function isServiceAddonLandingPage(page, slug = "", knownSlugs = []) {
  const type = String(page?.type || "").trim().toLowerCase();
  const pageSlug = String(page?.slug || slug || "").trim();
  if (type === "location" || /-auto-detailing$/i.test(pageSlug)) return false;
  return type === "addon" || type === "service" || knownSlugs.includes(pageSlug);
}

const ARRAY_FIELDS = [
  "reasons_page_exists", "process", "equipment", "highlights", "things_to_know",
  "scope_includes", "scope_excludes", "customer_prep", "aftercare", "quote_triggers"
];
const TEXT_FIELDS = ["hero_intro", "meta_description", "water_restriction_note"];

export function auditServiceAddonLandingPage(page, slug = "", knownSlugs = []) {
  if (!isServiceAddonLandingPage(page, slug, knownSlugs)) return [];
  const findings = [];
  const check = (path, value) => {
    if (hasServiceAddonMobileSetupConflict(value)) {
      findings.push({ path, excerpt: String(value).trim().slice(0, 180) });
    }
  };
  for (const field of TEXT_FIELDS) check(field, page?.[field]);
  for (const field of ARRAY_FIELDS) {
    if (!Array.isArray(page?.[field])) continue;
    page[field].slice(0, 100).forEach((value, index) => check(`${field}[${index}]`, value));
  }
  if (Array.isArray(page?.faq)) {
    page.faq.slice(0, 100).forEach((item, index) => {
      check(`faq[${index}].q`, item?.q);
      check(`faq[${index}].a`, item?.a);
    });
  }
  return findings.slice(0, 30);
}

export function flattenServiceAddonLandingContent(value, knownSlugs = []) {
  const pages = {};
  const addRows = (rows) => {
    const pairs = Array.isArray(rows)
      ? rows.slice(0, 300).map((page) => [String(page?.slug || page?.id || "").trim(), page])
      : rows && typeof rows === "object" ? Object.entries(rows).slice(0, 300) : [];
    for (const [slug, page] of pairs) {
      if (!slug || !page || typeof page !== "object" || Array.isArray(page)) continue;
      if (!isServiceAddonLandingPage(page, slug, [...knownSlugs, ...Object.keys(pages)])) continue;
      pages[slug] = { ...(pages[slug] || {}), ...page, slug };
    }
  };
  addRows(value?.default_pages?.pages);
  addRows(value?.expansion_pages?.pages);
  addRows(value?.addon_landing_page_templates);
  addRows(value?.pages);
  addRows(value?.landing_pages);
  return pages;
}
