// Build 657 — shared, bounded public-copy audit rules. No managed-data writes.
// A municipal water-use or runoff notice is not a customer-supplied utility.
export const TOWN_SAFE_SETUP_COPY =
  "Rosie brings standard detailing water and power. Please provide a safe, permitted work area; local outdoor water-use, runoff and site rules still apply.";

const CONTRADICTORY_SETUP_PATTERNS = [
  /customer[- ]supplied\s+(?:garden\s+)?(?:water|power|electricity|hose|outlet)/i,
  /\bcustomers?\b.{0,28}\b(?:must|need|should|required|expected|asked)\b.{0,25}\b(?:provide|bring|supply|confirm|arrange)\b.{0,36}\b(?:water|power|electricity|hose|outlet)\b/i,
  /\bcustomers?\b.{0,28}\b(?:provide|bring|supply|supplies)\b.{0,25}\b(?:water|power|electricity|hose|outlet)\b/i,
  /\bcustomer(?:'s)?\s+(?:water|power|electricity|outlet|hose)\s+(?:access|supply|connection)/i,
  /\b(?:garden\s+)?hose\s*(?:\/|or|and)\s*(?:electrical\s+)?outlet\s+(?:expectations|access|availability)/i,
  /\b(?:garden\s+)?hose\s+(?:access|connection|required)/i,
  /\b(?:standard|exterior|outdoor)\s+(?:electrical\s+)?outlet\s+(?:access|required|available)/i,
  /\b(?:electrical\s+access|water\s*\/\s*power\s+availability)\b/i,
  /\b(?:rural|driveway)\b.{0,40}\bwater\s+access\b/i,
  /\b(?:safe\s+parking|driveway\s+access)\b.{0,35}\bpower\s*,?\s*water\s+access\b/i,
  /\b(?:time[- ]of[- ]use|off[- ]peak|TOU)\b.{0,145}\b(?:service|detail|power|electricity)\b/i,
  /\bhousehold\s+(?:electricity|power)\b.{0,75}\b(?:service|detail|driveway)\b/i,
  /\bpower[- ]supported\s+driveway\s+service\b/i
];

export function hasTownMobileSetupConflict(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return Boolean(text) && CONTRADICTORY_SETUP_PATTERNS.some((pattern) => pattern.test(text));
}

export function isTownLandingPage(page, slug = "") {
  return String(page?.type || "").trim().toLowerCase() === "location"
    || /-auto-detailing$/i.test(String(page?.slug || slug || "").trim());
}

const CONTENT_ARRAY_FIELDS = [
  "reasons_page_exists", "process", "equipment", "highlights", "things_to_know",
  "scope_includes", "scope_excludes", "customer_prep", "aftercare", "quote_triggers"
];
const CONTENT_TEXT_FIELDS = ["hero_intro", "meta_description", "water_restriction_note"];

// Never inspect official URLs or customer data: only town marketing-copy fields.
export function auditTownLandingPage(page, slug = "") {
  if (!isTownLandingPage(page, slug)) return [];
  const findings = [];
  const check = (path, text) => {
    if (!hasTownMobileSetupConflict(text)) return;
    findings.push({ path, excerpt: String(text).trim().slice(0, 180) });
  };
  for (const field of CONTENT_TEXT_FIELDS) check(field, page?.[field]);
  for (const field of CONTENT_ARRAY_FIELDS) {
    if (!Array.isArray(page?.[field])) continue;
    page[field].slice(0, 100).forEach((value, i) => check(`${field}[${i}]`, value));
  }
  if (Array.isArray(page?.faq)) {
    page.faq.slice(0, 100).forEach((item, i) => {
      check(`faq[${i}].q`, item?.q);
      check(`faq[${i}].a`, item?.a);
    });
  }
  return findings.slice(0, 30);
}

export function flattenTownLandingContent(value) {
  const pages = {};
  const addRows = (rows) => {
    if (Array.isArray(rows)) {
      for (const page of rows.slice(0, 300)) {
        const slug = String(page?.slug || page?.id || "").trim();
        if (slug && isTownLandingPage(page, slug)) pages[slug] = { ...(pages[slug] || {}), ...page, slug };
      }
    } else if (rows && typeof rows === "object") {
      for (const [slug, page] of Object.entries(rows).slice(0, 300)) {
        if (page && typeof page === "object" && isTownLandingPage(page, slug)) {
          pages[slug] = { ...(pages[slug] || {}), ...page, slug };
        }
      }
    }
  };
  addRows(value?.default_pages?.pages);
  addRows(value?.expansion_pages?.pages);
  addRows(value?.pages);
  addRows(value?.landing_pages);
  return pages;
}
