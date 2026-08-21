import { serviceHeaders } from "./_lib/staff-auth.js";
import fallbackPricingCatalog from "./data/rosie_services_pricing_and_packages.json";
import fallbackProductCatalog from "./data/rosie_products_catalog.json";
import fallbackWaterRestrictionRules from "../../data/water_restriction_rules.json";
import fallbackLandingPagesContent from "./data/landing_pages_content.json";
import {
  applyWaterRestrictionRulesToLandingPages,
  loadEditableWaterRestrictionRules,
  normalizeWaterRestrictionPayload
} from "./_lib/water-restrictions.js";

const DEFAULT_LANDING_PAGES = fallbackLandingPagesContent.default_pages || { pages: {} };

const LANDING_PAGE_EXPANSIONS = fallbackLandingPagesContent.expansion_pages || { pages: {} };
const ADDON_LANDING_PAGE_TEMPLATES = fallbackLandingPagesContent.addon_landing_page_templates || {};


const PRICING_CATALOG_DEFAULT = fallbackPricingCatalog && typeof fallbackPricingCatalog === "object" ? fallbackPricingCatalog : {};
const PRODUCT_CATALOG_DEFAULT = Array.isArray(fallbackProductCatalog) ? fallbackProductCatalog : [];

const ADDON_LANDING_PAGE_MAP = {
  full_clay_treatment: "full-clay-treatment",
  two_stage_polish: "two-stage-polish",
  high_grade_paint_sealant: "high-grade-paint-sealant",
  uv_protectant_applied_on_interior_panels: "uv-protectant",
  de_ionizing_treatment: "de-ionizing-treatment",
  de_badging: "de-badging",
  engine_cleaning: "engine-cleaning",
  external_ceramic_coating: "external-ceramic-coating",
  external_graphene_fine_finish: "graphene-finish",
  external_wax: "exterior-wax",
  vinyl_wrapping: "vinyl-wrapping",
  window_tinting: "window-tinting"
};

const GENERATED_ADDON_LANDING_PAGES = buildGeneratedAddonPages();


function firstAddonImageUrl(addon) {
  const primary = String(addon?.image_url || "").trim();
  const fallback = String(addon?.image_fallback_url || "").trim();
  if (primary && !primary.toLowerCase().endsWith(".svg")) return primary;
  return primary || fallback || "";
}

function defaultAddonLandingProcess(addonName) {
  const name = String(addonName || "this add-on").trim();
  return [
    `Confirm whether ${name.toLowerCase()} can be done as a focused add-on or should be paired with a larger package.`,
    "Inspect the affected surfaces and explain any limits before work begins.",
    "Complete the needed prep, cleaning, agitation, treatment, or protection steps using product-safe methods.",
    "Review the result, aftercare notes, and any follow-up recommendation before the vehicle leaves the workflow."
  ];
}

function defaultAddonLandingEquipment(addonName) {
  const name = String(addonName || "the service").trim();
  return [
    `products and tools matched to ${name.toLowerCase()} rather than a one-size-fits-all shortcut`,
    "inspection lighting, microfiber, brushes, pads, towels, or applicators as needed",
    "package-specific cleaning/protection products from the current shop catalog",
    "customer notes so scope, limits, and quote requirements stay visible"
  ];
}

function defaultAddonLandingHighlights(addonName) {
  const name = String(addonName || "this add-on").trim();
  return [
    `${name} has its own page because customers often search for this exact problem or service by name.`,
    "The page explains when the add-on is standalone, package-dependent, or quote-led.",
    "It gives local search engines a clear, service-specific page instead of hiding the answer inside a long package list.",
    "It helps customers understand the process before they reach checkout or request a quote."
  ];
}

function defaultAddonThingsToKnow(addonName) {
  const name = String(addonName || "this add-on").trim();
  return [
    `${name} may depend on vehicle condition, surface material, access, weather, and the selected main package.`,
    "Photos help, but inspection may still change the final recommendation.",
    "Zero-dollar or missing prices should be treated as Quote required, not as a free service.",
    "The landing page should stay honest about limits, prep steps, and aftercare."
  ];
}


function buildGeneratedAddonPages() {
  const pages = {};
  const addons = Array.isArray(PRICING_CATALOG_DEFAULT?.addons) ? PRICING_CATALOG_DEFAULT.addons : [];
  for (const addon of addons) {
    const code = String(addon?.code || "").trim();
    if (!code) continue;
    const slug = ADDON_LANDING_PAGE_MAP[code] || String(code).trim().replace(/_/g, "-");
    const template = ADDON_LANDING_PAGE_TEMPLATES[slug] || {};
    const addonName = String(addon?.name || template.name || code).trim();
    pages[slug] = {
      type: "addon",
      related_code: code,
      enabled: true,
      slug,
      nav_group: template.nav_group || "addon-service",
      name: template.name || addonName,
      meta_title: template.meta_title || `${addonName} | Rosie Dazzlers`,
      meta_description: template.meta_description || template.hero_intro || `${addonName} service information for Rosie Dazzlers customers in Oxford and Norfolk Counties.`,
      badge: template.badge || "Add-on landing page",
      hero_title: template.hero_title || addonName,
      hero_intro: template.hero_intro || `${addonName} service information, process, tools, booking fit, and practical expectations for Oxford and Norfolk County vehicles.`,
      hero_image_url: template.hero_image_url || firstAddonImageUrl(addon),
      gallery_image_urls: template.gallery_image_urls || (firstAddonImageUrl(addon) ? [firstAddonImageUrl(addon)] : []),
      reasons_page_exists: template.reasons_page_exists || [
        `${addonName} is a service people search for directly, so it deserves a clearer page than a generic add-on row.`,
        `This page explains how ${addonName.toLowerCase()} fits into a real detailing workflow before someone books or requests a quote.`,
        `It also gives Rosie Dazzlers a stronger local destination for service-specific search intent.`
      ],
      process: template.process || defaultAddonLandingProcess(addonName),
      equipment: template.equipment || defaultAddonLandingEquipment(addonName),
      highlights: template.highlights || defaultAddonLandingHighlights(addonName),
      things_to_know: template.things_to_know || defaultAddonThingsToKnow(addonName),
      official_links: template.official_links || [],
      faq: template.faq || [],
      related_products: normalizeProductRefList(template.related_products || [])
    };
  }
  return { pages };
}

function normalizeProductRefList(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    name: String(row?.name || "").trim(),
    role: String(row?.role || "").trim(),
    note: String(row?.note || "").trim()
  })).filter((row) => row.name);
}

const SYSTEM_LANDING_PAGES = applyWaterRestrictionRulesToLandingPages(
  mergeLandingPages(
    mergeLandingPages(DEFAULT_LANDING_PAGES, LANDING_PAGE_EXPANSIONS),
    GENERATED_ADDON_LANDING_PAGES
  ),
  normalizeWaterRestrictionPayload(fallbackWaterRestrictionRules, "bundled_json_fallback")
);

export async function onRequestGet({ env }) {
  try {
    const landingPages = await loadLandingPages(env);
    return withCors(json({ ok: true, ...landingPages }));
  } catch (err) {
    return withCors(json({ ok: true, ...SYSTEM_LANDING_PAGES, warning: err?.message || "Could not load saved landing pages; using fallback defaults." }, 200));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function loadLandingPages(env) {
  const fallback = cloneLandingPages(SYSTEM_LANDING_PAGES);
  const waterRules = await loadEditableWaterRestrictionRules(env, fallbackWaterRestrictionRules);

  if (!env?.SUPABASE_URL) {
    return applyWaterRestrictionRulesToLandingPages(fallback, waterRules);
  }

  const keys = ["landing_pages_content", "landing_pages"];
  let merged = fallback;
  let found = false;
  for (const key of keys) {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.${encodeURIComponent(key)}&limit=1`,
      { headers: serviceHeaders(env) }
    );
    if (!res.ok) continue;
    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;
    if (!row?.value || typeof row.value !== "object") continue;
    merged = mergeLandingPages(merged, flattenEditableLandingPages(row.value));
    found = true;
  }
  return applyWaterRestrictionRulesToLandingPages(found ? merged : fallback, waterRules);
}

function flattenEditableLandingPages(value) {
  const out = { pages: {} };
  const mergeRows = (rows) => {
    if (!rows || typeof rows !== "object" || Array.isArray(rows)) return;
    for (const [slug, page] of Object.entries(rows)) {
      if (!page || typeof page !== "object") continue;
      out.pages[slug] = { ...(out.pages[slug] || {}), ...page, slug };
    }
  };
  mergeRows(value?.default_pages?.pages);
  mergeRows(value?.expansion_pages?.pages);
  mergeRows(value?.pages);
  if (Array.isArray(value?.pages)) for (const page of value.pages) {
    const slug = String(page?.slug || page?.id || "").trim();
    if (slug) out.pages[slug] = { ...(out.pages[slug] || {}), ...page, slug };
  }
  if (Array.isArray(value?.landing_pages)) for (const page of value.landing_pages) {
    const slug = String(page?.slug || page?.id || "").trim();
    if (slug) out.pages[slug] = { ...(out.pages[slug] || {}), ...page, slug };
  }
  return out;
}

function mergeLandingPages(fallback, candidate) {
  const base = cloneLandingPages(fallback);
  const pages = candidate && typeof candidate === "object" && candidate.pages && typeof candidate.pages === "object" ? candidate.pages : {};
  for (const [slug, page] of Object.entries(pages)) {
    base.pages[slug] = normalizePage({ ...(base.pages[slug] || {}), ...(page || {}), slug });
  }
  return base;
}

function normalizePage(page) {
  const faq = Array.isArray(page?.faq) ? page.faq : [];
  return {
    type: String(page?.type || "addon").trim() || "addon",
    related_code: String(page?.related_code || "").trim() || null,
    enabled: page?.enabled !== false,
    slug: String(page?.slug || "").trim(),
    nav_group: String(page?.nav_group || "other").trim() || "other",
    name: String(page?.name || page?.slug || "Landing page").trim(),
    meta_title: String(page?.meta_title || "").trim(),
    meta_description: String(page?.meta_description || "").trim(),
    badge: String(page?.badge || "Service landing page").trim(),
    hero_title: String(page?.hero_title || page?.name || "Landing page").trim(),
    hero_intro: String(page?.hero_intro || "").trim(),
    hero_image_url: String(page?.hero_image_url || "").trim(),
    // Build 215: local Rosie-owned hero asset is separate so old editable rows cannot keep a legacy remote placeholder in front of it.
    local_hero_image_url: String(page?.local_hero_image_url || "").trim(),
    local_hero_r2_key: String(page?.local_hero_r2_key || "").trim(),
    local_hero_format: String(page?.local_hero_format || "").trim(),
    region_photo_caption: String(page?.region_photo_caption || "").trim(),
    region_photo_source: String(page?.region_photo_source || "").trim(),
    region_photo_source_url: String(page?.region_photo_source_url || "").trim(),
    gallery_image_urls: normalizeStringArray(page?.gallery_image_urls || page?.gallery_urls || page?.gallery_images),
    related_products: normalizeProductArray(page?.related_products),
    reasons_page_exists: normalizeStringArray(page?.reasons_page_exists),
    process: normalizeStringArray(page?.process),
    equipment: normalizeStringArray(page?.equipment),
    highlights: normalizeStringArray(page?.highlights),
    things_to_know: normalizeStringArray(page?.things_to_know),
    water_restriction_note: String(page?.water_restriction_note || page?.verified_water_rule_summary || "").trim(),
    water_restriction_sources: normalizeLinkArray(page?.water_restriction_sources || []),
    official_links: normalizeLinkArray(page?.official_links),
    gallery_images: normalizeStringArray(page?.gallery_images),
    faq: faq.map((item) => ({ q: String(item?.q || "").trim(), a: String(item?.a || "").trim() })).filter((item) => item.q && item.a)
  };
}

function normalizeStringArray(value) {
  return (Array.isArray(value) ? value : []).map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizeLinkArray(value) {
  return (Array.isArray(value) ? value : []).map((item) => ({
    label: String(item?.label || item?.url || "Official source").trim(),
    url: String(item?.url || "").trim()
  })).filter((item) => item.url);
}

function normalizeProductArray(value) {
  return (Array.isArray(value) ? value : []).map((item) => ({
    name: String(item?.name || item?.title || "").trim(),
    role: String(item?.role || "").trim(),
    note: String(item?.note || "").trim(),
    image_url: String(item?.image_url || "").trim()
  })).filter((item) => item.name || item.image_url);
}


function cloneLandingPages(payload) {
  const raw = JSON.parse(JSON.stringify(payload || SYSTEM_LANDING_PAGES));
  const pages = raw.pages && typeof raw.pages === "object" ? raw.pages : {};
  for (const [slug, page] of Object.entries(pages)) pages[slug] = normalizePage({ ...page, slug });
  raw.pages = pages;
  return raw;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
