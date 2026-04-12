// /assets/pricing-catalog-client.js
// Shared client-side pricing catalog loader and normalizer for public Rosie Dazzlers pages.

const DEFAULT_CHARTS = [
  { filename: "CarPrice2025.PNG", title: "Vehicle Price Chart 2025", r2_url: "https://assets.rosiedazzlers.ca/brand/CarPrice2025.PNG" },
  { filename: "CarPriceDetails2025.PNG", title: "Package Service Details Chart", r2_url: "https://assets.rosiedazzlers.ca/brand/CarPriceDetails2025.PNG" },
  { filename: "CarSizeChart.PNG", title: "Vehicle Size Chart", r2_url: "https://assets.rosiedazzlers.ca/packages/CarSizeChart.PNG" }
];

export const DEFAULT_BOOKING_RULES = {
  availability_window_days: 21,
  default_service_area: "Tillsonburg, Oxford County",
  hold_minutes: 30,
  slot_labels: {
    AM: "AM half day",
    PM: "PM half day",
    FULL: "Full day"
  },
  public_requirements: [
    "Driveway required",
    "Customer provides power and water or additional fees may apply",
    "One vehicle per day unless half-day jobs are confirmed"
  ]
};

function toMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeSizeMap(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    small: toMoney(source.small),
    mid: toMoney(source.mid),
    oversize: toMoney(source.oversize)
  };
}

function normalizeCharts(rows) {
  const source = Array.isArray(rows) && rows.length ? rows : DEFAULT_CHARTS;
  return source.map((row) => ({
    filename: String(row?.filename || "").trim() || null,
    title: String(row?.title || row?.filename || "").trim() || null,
    r2_url: String(row?.r2_url || "").trim() || null
  })).filter((row) => row.title && row.r2_url);
}

function normalizePackages(rows) {
  return (Array.isArray(rows) ? rows : []).map((pkg) => {
    const code = String(pkg?.code || "").trim();
    if (!code) return null;
    const images = pkg?.images_by_size && typeof pkg.images_by_size === "object" ? pkg.images_by_size : {};
    const included = Array.isArray(pkg?.included_services) ? pkg.included_services : [];
    const notes = Array.isArray(pkg?.notes) ? pkg.notes : [];
    return {
      ...pkg,
      code,
      name: String(pkg?.name || code).trim(),
      subtitle: String(pkg?.subtitle || "").trim() || null,
      deposit_cad: toMoney(pkg?.deposit_cad),
      prices_cad: normalizeSizeMap(pkg?.prices_cad),
      images_by_size: {
        small: String(images.small || "").trim() || null,
        mid: String(images.mid || "").trim() || null,
        oversize: String(images.oversize || "").trim() || null
      },
      included_services: included.map((row) => typeof row === "string" ? { name: row } : {
        ...row,
        name: String(row?.name || "").trim()
      }).filter((row) => row.name),
      notes: notes.map((row) => String(row || "").trim()).filter(Boolean)
    };
  }).filter(Boolean);
}

function normalizeAddons(rows) {
  return (Array.isArray(rows) ? rows : []).map((addon) => {
    const code = String(addon?.code || "").trim();
    if (!code) return null;
    const notes = Array.isArray(addon?.notes) ? addon.notes : [];
    return {
      ...addon,
      code,
      name: String(addon?.name || code).trim(),
      quote_required: addon?.quote_required === true,
      prices_cad: normalizeSizeMap(addon?.prices_cad),
      price_cad: toMoney(addon?.price_cad),
      image_url: String(addon?.image_url || "").trim() || null,
      image_fallback_url: String(addon?.image_fallback_url || "").trim() || null,
      notes: notes.map((row) => String(row || "").trim()).filter(Boolean)
    };
  }).filter(Boolean);
}

function normalizeServiceAreas(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const officialLinks = Array.isArray(row?.official_links) ? row.official_links : [];
    return {
      ...row,
      county: String(row?.county || "").trim() || null,
      value: String(row?.value || row?.label || "").trim() || null,
      label: String(row?.label || row?.value || "").trim() || null,
      municipality: String(row?.municipality || "").trim() || null,
      zone: String(row?.zone || "").trim() || null,
      bylaw_note: String(row?.bylaw_note || "").trim() || null,
      parking_rule: String(row?.parking_rule || "").trim() || null,
      noise_rule: String(row?.noise_rule || "").trim() || null,
      water_rule: String(row?.water_rule || "").trim() || null,
      access_rule: String(row?.access_rule || "").trim() || null,
      official_links: officialLinks.map((link) => ({
        label: String(link?.label || "Official source").trim(),
        url: String(link?.url || "").trim()
      })).filter((link) => link.url)
    };
  }).filter((row) => row.value || row.label);
}

export function normalizePricingCatalog(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const charts = normalizeCharts(source.charts);
  const packages = normalizePackages(source.packages);
  const addons = normalizeAddons(source.addons);
  const serviceMatrix = Array.isArray(source.service_matrix) ? source.service_matrix : [];
  const serviceAreas = normalizeServiceAreas(source.service_areas);

  const bookingRuleSource = source.booking_rules && typeof source.booking_rules === "object" ? source.booking_rules : {};
  const booking_rules = {
    availability_window_days: Number(bookingRuleSource.availability_window_days || DEFAULT_BOOKING_RULES.availability_window_days) || DEFAULT_BOOKING_RULES.availability_window_days,
    default_service_area: String(bookingRuleSource.default_service_area || DEFAULT_BOOKING_RULES.default_service_area).trim() || DEFAULT_BOOKING_RULES.default_service_area,
    hold_minutes: Number(bookingRuleSource.hold_minutes || DEFAULT_BOOKING_RULES.hold_minutes) || DEFAULT_BOOKING_RULES.hold_minutes,
    slot_labels: {
      ...DEFAULT_BOOKING_RULES.slot_labels,
      ...(bookingRuleSource.slot_labels && typeof bookingRuleSource.slot_labels === "object" ? bookingRuleSource.slot_labels : {})
    },
    public_requirements: (Array.isArray(bookingRuleSource.public_requirements) ? bookingRuleSource.public_requirements : DEFAULT_BOOKING_RULES.public_requirements)
      .map((row) => String(row || "").trim())
      .filter(Boolean)
  };

  const public_requirements = (Array.isArray(source.public_requirements) ? source.public_requirements : booking_rules.public_requirements)
    .map((row) => String(row || "").trim())
    .filter(Boolean);

  return {
    ...source,
    charts,
    packages,
    addons,
    service_matrix: serviceMatrix,
    service_areas: serviceAreas,
    booking_rules,
    public_requirements
  };
}

function mergeCatalog(primary, fallback) {
  return normalizePricingCatalog({
    ...fallback,
    ...primary,
    charts: Array.isArray(primary?.charts) && primary.charts.length ? primary.charts : fallback?.charts,
    packages: Array.isArray(primary?.packages) && primary.packages.length ? primary.packages : fallback?.packages,
    addons: Array.isArray(primary?.addons) && primary.addons.length ? primary.addons : fallback?.addons,
    service_matrix: Array.isArray(primary?.service_matrix) && primary.service_matrix.length ? primary.service_matrix : fallback?.service_matrix,
    service_areas: Array.isArray(primary?.service_areas) && primary.service_areas.length ? primary.service_areas : fallback?.service_areas,
    booking_rules: {
      ...(fallback?.booking_rules || {}),
      ...(primary?.booking_rules || {})
    },
    public_requirements: Array.isArray(primary?.public_requirements) && primary.public_requirements.length ? primary.public_requirements : fallback?.public_requirements
  });
}

export async function fetchJsonStrict(url, options = {}) {
  const res = await fetch(url, { cache: "no-store", ...options });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    const head = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`Expected JSON from ${url} but got: ${head}`);
  }
  if (!res.ok) throw new Error(parsed?.error || `Request failed for ${url}`);
  return parsed;
}

export async function loadPricingCatalogClient({
  apiUrl = "/api/pricing_catalog_public",
  fallbackUrl = "/data/rosie_services_pricing_and_packages.json",
  credentials = "same-origin"
} = {}) {
  let apiCatalog = null;
  let apiError = null;
  try {
    apiCatalog = normalizePricingCatalog(await fetchJsonStrict(apiUrl, { credentials }));
  } catch (err) {
    apiError = err;
  }

  const needsFallback = !apiCatalog
    || !Array.isArray(apiCatalog.packages) || !apiCatalog.packages.length
    || !Array.isArray(apiCatalog.addons) || !apiCatalog.addons.length
    || !Array.isArray(apiCatalog.service_areas) || !apiCatalog.service_areas.length
    || !Array.isArray(apiCatalog.charts) || !apiCatalog.charts.length;

  if (!needsFallback) {
    if (apiError) {
      apiCatalog._source = "api_with_partial_fallback";
      apiCatalog._fallback_error = apiError?.message || null;
    } else {
      apiCatalog._source = "api";
    }
    return apiCatalog;
  }

  const fallbackCatalog = normalizePricingCatalog(await fetchJsonStrict(fallbackUrl, { credentials }));
  const merged = apiCatalog ? mergeCatalog(apiCatalog, fallbackCatalog) : fallbackCatalog;
  merged._source = apiCatalog ? "api_merged_with_bundled_fallback" : "bundled_json_fallback";
  merged._fallback_error = apiError?.message || null;
  return merged;
}

export function money(cad) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(cad || 0));
}

export function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function packagePrice(pkg, size) {
  return pkg?.prices_cad?.[size] ?? null;
}

export function packageImageForSize(pkg, size) {
  return pkg?.images_by_size?.[size] || Object.values(pkg?.images_by_size || {}).find(Boolean) || "";
}

export function addonPrimaryImage(addon) {
  return String(addon?.image_url || "").trim() || "";
}

export function addonFallbackImage(addon) {
  return String(addon?.image_fallback_url || "").trim() || "/assets/addons/generic_addon.svg";
}

export function addonDisplay(addon, size) {
  if (addon?.quote_required === true) {
    if (addon?.prices_cad?.[size] != null) return `From ${money(addon.prices_cad[size])} · Quote required`;
    if (addon?.price_cad != null) return `From ${money(addon.price_cad)} · Quote required`;
    return "Quote required";
  }
  if (addon?.prices_cad?.[size] != null) return money(addon.prices_cad[size]);
  if (addon?.price_cad != null) return money(addon.price_cad);
  return "$—";
}

export function bookingRules(catalog) {
  return normalizePricingCatalog(catalog).booking_rules;
}

export function publicRequirements(catalog) {
  const normalized = normalizePricingCatalog(catalog);
  return normalized.public_requirements?.length ? normalized.public_requirements : normalized.booking_rules.public_requirements;
}

export function serviceAreaRows(catalog) {
  return normalizePricingCatalog(catalog).service_areas;
}

export function findServiceArea(catalog, value) {
  const needle = String(value || "").trim().toLowerCase();
  return serviceAreaRows(catalog).find((row) => [row?.value, row?.label].some((entry) => String(entry || "").trim().toLowerCase() === needle)) || null;
}

export function chartUrl(catalog, key) {
  const needle = String(key || "").trim().toLowerCase();
  const row = normalizePricingCatalog(catalog).charts.find((chart) =>
    [chart?.title, chart?.filename].some((entry) => String(entry || "").trim().toLowerCase() === needle)
  );
  if (row?.r2_url) return row.r2_url;
  const fallback = DEFAULT_CHARTS.find((chart) =>
    [chart?.title, chart?.filename].some((entry) => String(entry || "").trim().toLowerCase() === needle)
  );
  return fallback?.r2_url || "";
}
