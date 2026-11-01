// Build 736 — read-only guidance derived entirely from the current service catalog.
// No shadow price table, automatic condition assessment, add-on selection or checkout writes.
export const SERVICE_GUIDANCE_SCHEMA_736 = "rosie-service-addon-guidance.v1";
export const VEHICLE_TIERS_736 = Object.freeze([
  Object.freeze({ key: "small", label: "Small" }),
  Object.freeze({ key: "mid", label: "Mid-sized" }),
  Object.freeze({ key: "oversize", label: "Oversized" })
]);

const clean = value => String(value ?? "").trim();
const positiveCents = value => {
  if (value == null || typeof value === "boolean") return null;
  const number = typeof value === "number" ? value : (typeof value === "string" && value.trim() ? Number(value) : NaN);
  if (!Number.isFinite(number) || number <= 0 || !Number.isSafeInteger(Math.round(number * 100)) ||
      Math.abs(number * 100 - Math.round(number * 100)) > 0.000001) return null;
  return Math.round(number * 100);
};

export function priceTiers736(record) {
  const prices = record?.prices_cad && typeof record.prices_cad === "object" ? record.prices_cad : {};
  return VEHICLE_TIERS_736.map(({ key, label }) => ({
    size: key, label, cents: positiveCents(prices[key])
  }));
}

const listedServices = pkg => {
  const found = new Set();
  return (Array.isArray(pkg?.included_services) ? pkg.included_services : [])
    .map(service => ({
      name: clean(typeof service === "string" ? service : service?.name),
      note: clean(typeof service === "string" ? "" : service?.optional_condition_note)
    }))
    .filter(service => {
      const key = service.name.toLocaleLowerCase();
      if (!key || found.has(key)) return false;
      found.add(key);
      return true;
    });
};

export function packageScope736(catalog, pkg) {
  const included = listedServices(pkg);
  const includedNames = new Set(included.map(row => row.name.toLocaleLowerCase()));
  const otherNames = new Map();
  for (const candidate of Array.isArray(catalog?.packages) ? catalog.packages : []) {
    for (const service of listedServices(candidate)) {
      const key = service.name.toLocaleLowerCase();
      if (!includedNames.has(key) && !otherNames.has(key)) otherNames.set(key, service.name);
    }
  }
  return {
    included,
    not_listed: [...otherNames.values()],
    excluded_explanation: "These services appear in other packages but are not listed in this package. Optional specialty work is separate unless explicitly included.",
    is_quote: pkg?.quote_required === true,
    tiers: priceTiers736(pkg),
    source: "current_catalog",
    has_automatic_addons: false
  };
}

export function addonGuidance736(addon, selectedSize = "") {
  const tiers = priceTiers736(addon);
  const hasSizeTiers = tiers.some(row => row.cents !== null);
  const baseCents = !hasSizeTiers ? positiveCents(addon?.price_cad) : null;
  const quoteRequired = addon?.quote_required === true || addon?.pricing_mode === "condition_assessed";
  const selectedTier = tiers.find(row => row.size === selectedSize);
  const selectedCents = hasSizeTiers ? (selectedTier?.cents ?? null) : baseCents;
  return {
    code: clean(addon?.code),
    quote_required: quoteRequired,
    pricing_kind: quoteRequired ? "assessment_quote" : "starting_price",
    tiers,
    has_size_tiers: hasSizeTiers,
    base_cents: baseCents,
    selected_cents: selectedCents,
    selected_size: VEHICLE_TIERS_736.some(row => row.key === selectedSize) ? selectedSize : null,
    assessment_basis: clean(addon?.pricing_basis),
    guidance: quoteRequired
      ? "Photo or condition assessment needed. Any starting amounts are indicative only; staff must confirm the scope and quote before approval."
      : "Advertised starting amount only. Vehicle condition or additional work may change the final quote.",
    is_diagnosed: false,
    is_selected: false,
    is_checkout: false
  };
}
