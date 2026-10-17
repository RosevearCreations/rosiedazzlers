// Build 571: read-only public catalog VIEW MODEL. No prices, terms or booking authority.
const PACKAGE_ORDER = Object.freeze([
  "premium_wash", "basic_detail", "interior_detail", "exterior_detail", "complete_detail"
]);
const MAX_TEXT = 140;
const safe = (value) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_TEXT) : "";
const valid = (value) => value && typeof value === "object" && !Array.isArray(value);
const freezeRows = rows => Object.freeze(rows.map(row => Object.freeze(row)));
export function buildServiceGuide571(catalog) {
  // Untrusted public data. Never accept client-controlled price, service authority or URLs.
  if (!valid(catalog) || catalog.ok !== true || !Array.isArray(catalog.packages)) {
    return Object.freeze({
      status: "catalog_unavailable", package_cards: Object.freeze([]),
      addon_cards: Object.freeze([]), publishing_approved: false,
      prices_visible: false, quote_submitted: false, booking_created: false
    });
  }
  const byCode = new Map();
  for (const row of catalog.packages) {
    if (valid(row) && PACKAGE_ORDER.includes(row.code) && !byCode.has(row.code))
      byCode.set(row.code, row);
  }
  const packages = PACKAGE_ORDER.filter(code => byCode.has(code)).map(code => {
    const row = byCode.get(code);
    return {
      code,
      title: safe(row.name) || code.replace(/_/g, " "),
      overview: safe(row.description) || "Ask staff about suitability and scope.",
      status: row.quote_required === true ? "Scope requires a staff quote" : "Final scope and price confirmed by staff",
      call_to_action: "Explore the quote-first preview"
    };
  });
  const seen = new Set();
  const addons = (Array.isArray(catalog.addons) ? catalog.addons : []).filter(row => {
    if (!valid(row)) return false;
    const code = safe(row.code);
    if (!code || seen.has(code) || seen.size >= 24) return false;
    seen.add(code);
    return true;
  }).map(row => ({
    code: safe(row.code),
    title: safe(row.name) || "Optional detailing treatment",
    guidance: row.quote_required === true ? "Requires individual scope review" : "Availability and price must be confirmed"
  }));
  return Object.freeze({
    status: packages.length ? "catalog_view_only" : "catalog_unavailable",
    package_cards: freezeRows(packages),
    addon_cards: freezeRows(addons),
    catalog_origin: catalog.source === "fallback" ? "bundled_fallback" : "unverified_db_or_fallback",
    publishing_approved: false,
    prices_visible: false,
    quote_submitted: false,
    booking_created: false
  });
}
