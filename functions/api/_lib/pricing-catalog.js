// functions/api/_lib/pricing-catalog.js
// Canonical pricing catalog loader.
// Reads app_management_settings.pricing_catalog first, then falls back to bundled JSON.

import { serviceHeaders } from "./staff-session.js";

import FALLBACK_CATALOG from "../data/rosie_services_pricing_and_packages.json";

const LOCAL_CHART_URLS = {
  "CarPrice2025.PNG": "/assets/brand/CarPrice2025.PNG",
  "CarPriceDetails2025.PNG": "/assets/brand/CarPriceDetails2025.PNG",
  "CarSizeChart.PNG": "https://assets.rosiedazzlers.ca/packages/CarSizeChart.PNG"
};

// Build 274 retained operating authority: Rosie brings standard detailing water and power.
// Keep this runtime-owned so stale database/bundled wording cannot reintroduce a contradictory customer promise.
const ROSIE_PUBLIC_REQUIREMENTS = Object.freeze([
  "Driveway/private work area preferred",
  "Rosie brings standard detailing water and power; unusual site/access requirements must be confirmed before dispatch",
  "Staff verify county water-use, runoff and site-access reminders before dispatch"
]);

const ROSIE_ACCESS_RULE = "Confirm a safe driveway/private work area, slope, parking, apartment/condo access and building rules before dispatch. Rosie brings standard detailing water and power unless an explicitly approved service setup says otherwise.";

const DEFAULT_BOOKING_RULES = {
  availability_window_days: 21,
  default_service_area: "Tillsonburg, Oxford County",
  hold_minutes: 30,
  slot_labels: {
    AM: "AM half day",
    PM: "PM half day",
    FULL: "Full day"
  },
  public_requirements: [...ROSIE_PUBLIC_REQUIREMENTS],
  travel_pricing: {
    urban: 0,
    township: 0,
    hamlet: 10,
    coastal: 20,
    rural: 20,
    out_of_zone: 50,
    notes: "Travel charges are managed centrally in App Management."
  },
  price_controls: {
    fuel_surcharge_cad: 0,
    material_surcharge_cad: 0,
    minimum_callout_cad: 0,
    tax_rate_percent: 13
  }
};

export async function loadPricingCatalog(env) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return normalizeCatalog(FALLBACK_CATALOG);
  }

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value&key=eq.pricing_catalog&limit=1`,
      { headers: serviceHeaders(env) }
    );

    if (res.ok) {
      const rows = await res.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] || null : null;
      if (row && row.value && typeof row.value === "object") {
        return mergeCatalog(row.value, FALLBACK_CATALOG);
      }
    }
  } catch {}

  return normalizeCatalog(FALLBACK_CATALOG);
}

export function normalizeCatalog(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const charts = normalizeCharts(source.charts);
  const packages = normalizePackages(source.packages);
  const addons = normalizeAddons(source.addons);
  const serviceAreas = normalizeServiceAreas(source.service_areas);
  const serviceMatrix = Array.isArray(source.service_matrix) ? source.service_matrix : [];

  const packageMap = Object.create(null);
  const addonMap = Object.create(null);

  for (const pkg of packages) packageMap[pkg.code] = pkg;
  for (const addon of addons) addonMap[addon.code] = addon;

  const bookingRuleSource = source.booking_rules && typeof source.booking_rules === "object" ? source.booking_rules : {};
  const bookingRules = {
    availability_window_days: numberOr(bookingRuleSource.availability_window_days, DEFAULT_BOOKING_RULES.availability_window_days),
    default_service_area: cleanText(bookingRuleSource.default_service_area) || DEFAULT_BOOKING_RULES.default_service_area,
    hold_minutes: numberOr(bookingRuleSource.hold_minutes, DEFAULT_BOOKING_RULES.hold_minutes),
    slot_labels: {
      ...DEFAULT_BOOKING_RULES.slot_labels,
      ...(bookingRuleSource.slot_labels && typeof bookingRuleSource.slot_labels === "object" ? bookingRuleSource.slot_labels : {})
    },
    // Build 274: do not allow stale App Management JSON to contradict the mobile operating model.
    public_requirements: [...ROSIE_PUBLIC_REQUIREMENTS],
    travel_pricing: {
      urban: numberOr(bookingRuleSource?.travel_pricing?.urban, DEFAULT_BOOKING_RULES.travel_pricing.urban),
      township: numberOr(bookingRuleSource?.travel_pricing?.township, DEFAULT_BOOKING_RULES.travel_pricing.township),
      hamlet: numberOr(bookingRuleSource?.travel_pricing?.hamlet, DEFAULT_BOOKING_RULES.travel_pricing.hamlet),
      coastal: numberOr(bookingRuleSource?.travel_pricing?.coastal, DEFAULT_BOOKING_RULES.travel_pricing.coastal),
      rural: numberOr(bookingRuleSource?.travel_pricing?.rural, DEFAULT_BOOKING_RULES.travel_pricing.rural),
      out_of_zone: numberOr(bookingRuleSource?.travel_pricing?.out_of_zone, DEFAULT_BOOKING_RULES.travel_pricing.out_of_zone),
      notes: cleanText(bookingRuleSource?.travel_pricing?.notes) || DEFAULT_BOOKING_RULES.travel_pricing.notes
    },
    price_controls: {
      fuel_surcharge_cad: numberOr(bookingRuleSource?.price_controls?.fuel_surcharge_cad, DEFAULT_BOOKING_RULES.price_controls.fuel_surcharge_cad),
      material_surcharge_cad: numberOr(bookingRuleSource?.price_controls?.material_surcharge_cad, DEFAULT_BOOKING_RULES.price_controls.material_surcharge_cad),
      minimum_callout_cad: numberOr(bookingRuleSource?.price_controls?.minimum_callout_cad, DEFAULT_BOOKING_RULES.price_controls.minimum_callout_cad),
      tax_rate_percent: numberOr(bookingRuleSource?.price_controls?.tax_rate_percent, DEFAULT_BOOKING_RULES.price_controls.tax_rate_percent)
    }
  };

  const publicRequirements = [...ROSIE_PUBLIC_REQUIREMENTS];

  return {
    ...source,
    charts,
    packages,
    addons,
    service_matrix: serviceMatrix,
    service_areas: serviceAreas,
    booking_rules: bookingRules,
    public_requirements: publicRequirements,
    package_map: packageMap,
    addon_map: addonMap
  };
}

function mergeRowsByCode(primaryRows, fallbackRows) {
  const fallbackMap = new Map((Array.isArray(fallbackRows) ? fallbackRows : []).map((row) => [String(row?.code || row?.value || row?.label || ""), row]));
  const primaryList = Array.isArray(primaryRows) ? primaryRows : [];
  const merged = primaryList.map((row) => {
    const key = String(row?.code || row?.value || row?.label || "");
    const fallbackRow = fallbackMap.get(key);
    if (!fallbackRow) return row;
    const mergedRow = {
      ...fallbackRow,
      ...row,
      prices_cad: row?.prices_cad && typeof row.prices_cad === "object"
        ? { ...(fallbackRow?.prices_cad || {}), ...row.prices_cad }
        : (fallbackRow?.prices_cad || row?.prices_cad),
      images_by_size: row?.images_by_size && typeof row.images_by_size === "object"
        ? { ...(fallbackRow?.images_by_size || {}), ...row.images_by_size }
        : (fallbackRow?.images_by_size || row?.images_by_size),
      image_url: cleanText(row?.image_url) || cleanText(fallbackRow?.image_url) || null,
      image_fallback_url: cleanText(row?.image_fallback_url) || cleanText(fallbackRow?.image_fallback_url) || null,
      included_services: hasRows(row?.included_services) ? row.included_services : fallbackRow?.included_services,
      notes: hasRows(row?.notes) ? row.notes : fallbackRow?.notes,
      official_links: hasRows(row?.official_links) ? row.official_links : fallbackRow?.official_links,
      requires_package_codes_any: hasRows(row?.requires_package_codes_any) ? row.requires_package_codes_any : (fallbackRow?.requires_package_codes_any || [])
    };
    return mergedRow;
  });
  const seen = new Set(merged.map((row) => String(row?.code || row?.value || row?.label || "")).filter(Boolean));
  for (const row of Array.isArray(fallbackRows) ? fallbackRows : []) {
    const key = String(row?.code || row?.value || row?.label || "");
    if (key && seen.has(key)) continue;
    merged.push(row);
  }
  return merged;
}

function mergeCatalog(primary, fallback) {
  return normalizeCatalog({
    ...fallback,
    ...primary,
    charts: hasRows(primary?.charts) ? primary.charts : fallback?.charts,
    packages: hasRows(primary?.packages) ? mergeRowsByCode(primary.packages, fallback?.packages) : fallback?.packages,
    addons: hasRows(primary?.addons) ? mergeRowsByCode(primary.addons, fallback?.addons) : fallback?.addons,
    service_matrix: hasRows(primary?.service_matrix) ? primary.service_matrix : fallback?.service_matrix,
    service_areas: hasRows(primary?.service_areas) ? mergeRowsByCode(primary.service_areas, fallback?.service_areas) : fallback?.service_areas,
    booking_rules: {
      ...(fallback?.booking_rules || {}),
      ...(primary?.booking_rules || {})
    },
    public_requirements: hasRows(primary?.public_requirements) ? primary.public_requirements : fallback?.public_requirements
  });
}

function hasRows(value) {
  return Array.isArray(value) && value.length > 0;
}

function normalizeCharts(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const title = cleanText(row?.title || row?.filename);
    const filename = cleanText(row?.filename) || null;
    const r2Url = LOCAL_CHART_URLS[filename] || cleanText(row?.r2_url);
    if (!title || !r2Url) return null;
    return {
      filename,
      title,
      r2_url: r2Url
    };
  }).filter(Boolean);
}

function normalizePackages(rows) {
  return (Array.isArray(rows) ? rows : []).map((pkg) => {
    const code = cleanText(pkg?.code);
    if (!code) return null;
    const images = pkg?.images_by_size && typeof pkg.images_by_size === "object" ? pkg.images_by_size : {};
    const included = Array.isArray(pkg?.included_services) ? pkg.included_services : [];
    return {
      ...pkg,
      code,
      name: cleanText(pkg?.name) || code,
      subtitle: cleanText(pkg?.subtitle) || null,
      deposit_cad: toMoney(pkg?.deposit_cad),
      prices_cad: normalizeSizeMap(pkg?.prices_cad),
      images_by_size: {
        small: cleanText(images.small) || null,
        mid: cleanText(images.mid) || null,
        oversize: cleanText(images.oversize) || null
      },
      included_services: included.map((row) => typeof row === "string"
        ? { name: cleanText(row) }
        : { ...row, name: cleanText(row?.name) }
      ).filter((row) => row.name),
      notes: normalizeStringArray(pkg?.notes)
    };
  }).filter(Boolean);
}

function normalizeAddons(rows) {
  return (Array.isArray(rows) ? rows : []).map((addon) => {
    const code = cleanText(addon?.code);
    if (!code) return null;
    return {
      ...addon,
      code,
      name: cleanText(addon?.name) || code,
      quote_required: addon?.quote_required === true,
      standalone_allowed: addon?.standalone_allowed === true,
      requires_package_codes_any: normalizeStringArray(addon?.requires_package_codes_any),
      requirement_note: cleanText(addon?.requirement_note) || null,
      prices_cad: normalizeSizeMap(addon?.prices_cad),
      price_cad: toMoney(addon?.price_cad),
      image_url: cleanText(addon?.image_url) || null,
      image_fallback_url: cleanText(addon?.image_fallback_url) || null,
      notes: normalizeStringArray(addon?.notes)
    };
  }).filter(Boolean);
}

function normalizeServiceAreas(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const value = cleanText(row?.value || row?.label);
    const label = cleanText(row?.label || row?.value);
    if (!value && !label) return null;
    return {
      ...row,
      county: cleanText(row?.county) || null,
      value: value || label,
      label: label || value,
      municipality: cleanText(row?.municipality) || null,
      zone: cleanText(row?.zone) || null,
      area_type: cleanText(row?.area_type) || null,
      travel_tier: cleanText(row?.travel_tier) || "township",
      bylaw_note: cleanText(row?.bylaw_note) || null,
      parking_rule: cleanText(row?.parking_rule) || null,
      noise_rule: cleanText(row?.noise_rule) || null,
      water_rule_key: cleanText(row?.water_rule_key) || null,
      water_rule: cleanText(row?.water_rule) || null,
      access_rule: ROSIE_ACCESS_RULE,
      official_links: (Array.isArray(row?.official_links) ? row.official_links : []).map((link) => ({
        label: cleanText(link?.label) || "Official source",
        url: cleanText(link?.url)
      })).filter((link) => link.url)
    };
  }).filter(Boolean);
}

function normalizeSizeMap(value) {
  const map = value && typeof value === "object" ? value : {};
  return {
    small: toMoney(map.small),
    mid: toMoney(map.mid),
    oversize: toMoney(map.oversize)
  };
}

function normalizeStringArray(value) {
  return (Array.isArray(value) ? value : []).map((row) => cleanText(row)).filter(Boolean);
}

function cleanText(value) {
  return String(value || "").trim();
}

function toMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
