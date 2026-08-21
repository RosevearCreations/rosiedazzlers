// Build 204 privacy enforcement — public gallery with resilient media fallbacks and legacy field aliases.
import { serviceHeaders } from "./_lib/staff-auth.js";

const DEFAULT_GALLERY = {
  items: [
    {
      title: "Interior refresh",
      location: "Tillsonburg, ON",
      town: "Tillsonburg",
      town_slug: "tillsonburg",
      service: "Interior detailing",
      service_slug: "interior-detailing",
      before_kind: "image",
      before_url: "/assets/brand/CarPrice2025.PNG",
      after_kind: "image",
      after_url: "/assets/brand/CarPriceDetails2025.PNG",
      note: "Sample placeholder. Replace with customer-approved work from App Management.",
      consent_status: "sample",
      media_privacy_status: "approved_public"
    },
    {
      title: "Exterior wash and gloss",
      location: "Woodstock, ON",
      town: "Woodstock",
      town_slug: "woodstock",
      service: "Exterior detailing",
      service_slug: "exterior-detailing",
      before_kind: "image",
      before_url: "/assets/brand/CarSizeChart.PNG",
      after_kind: "image",
      after_url: "/assets/brand/CarPrice2025.PNG",
      note: "Sample placeholder. Use matched before/after angles for best results.",
      consent_status: "sample",
      media_privacy_status: "approved_public"
    }
  ]
};

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const filters = {
      service: slugify(url.searchParams.get("service") || "all"),
      town: slugify(url.searchParams.get("town") || "all")
    };
    const loaded = await loadGallery(request, env);
    const normalized = normalizeGallery(loaded.gallery);
    const fallback = normalizeGallery(await loadStaticGallery(request));
    const sourceItems = normalized.items.length ? normalized.items : fallback.items;
    const sourceStatus = normalized.items.length ? loaded.source : "static_fallback";
    const approved = sourceItems.filter(isPublicApproved);
    const filtered = approved.filter((item) => matchesFilters(item, filters));
    const payload = {
      ok: true,
      items: filtered,
      filters,
      source_status: sourceStatus,
      fallback_used: sourceStatus !== loaded.source || loaded.warning || !normalized.items.length,
      available_services: uniqueOptions(approved, "service", "service_slug"),
      available_towns: uniqueOptions(approved, "town", "town_slug"),
      blocked_count: Math.max(0, sourceItems.length - approved.length),
      privacy_rule: "Only sample items and media with approved_public/customer_approved_public consent are returned publicly. Pending/private/rejected media is blocked before gallery reuse."
    };
    if (loaded.warning) payload.warning = loaded.warning;
    if (!normalized.items.length) payload.warning = payload.warning || "Saved gallery had no usable before/after media URLs, so static fallback samples were used.";
    return withCors(json(payload));
  } catch (err) {
    const fallback = normalizeGallery(await loadStaticGallery(request));
    return withCors(json({
      ok: true,
      items: fallback.items.filter(isPublicApproved),
      available_services: uniqueOptions(fallback.items, "service", "service_slug"),
      available_towns: uniqueOptions(fallback.items, "town", "town_slug"),
      blocked_count: 0,
      source_status: "emergency_default",
      fallback_used: true,
      warning: err?.message || "Could not load saved gallery content; using fallback sample data.",
      privacy_rule: "Only sample items and media with approved_public/customer_approved_public consent are returned publicly. Pending/private/rejected media is blocked before gallery reuse."
    }));
  }
}

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadGallery(request, env) {
  if (!env?.SUPABASE_URL || !(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)) {
    return { gallery: await loadStaticGallery(request), source: "static_fallback", warning: "Database settings were unavailable; gallery used bundled static fallback data." };
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.before_after_gallery&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return { gallery: await loadStaticGallery(request), source: "static_fallback", warning: `Database gallery lookup returned ${res.status}; gallery used bundled fallback data.` };
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return { gallery: row?.value || await loadStaticGallery(request), source: row?.value ? "database" : "static_fallback" };
}

async function loadStaticGallery(request) {
  try {
    const staticUrl = new URL("/data/before_after_gallery.json", request.url);
    const res = await fetch(staticUrl.toString(), { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {}
  return cloneValue(DEFAULT_GALLERY);
}

function normalizeGallery(value) {
  const src = value && typeof value === "object" ? value : DEFAULT_GALLERY;
  const items = Array.isArray(src.items) ? src.items : [];
  return {
    items: items
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const location = clean(item.location || item.town || item.city || "Oxford / Norfolk Counties");
        const town = clean(item.town || item.city || location.split(",")[0] || "Oxford / Norfolk");
        const service = clean(item.service || item.service_label || item.category || item.addon_name || "Mobile detailing");
        const beforeUrl = normalizeMediaUrl(firstText(item.before_url, item.beforeUrl, item.before_image_url, item.beforeImageUrl, item.before_media_url, item.beforeMediaUrl, item.before, item.before_image, item.beforeImage));
        const afterUrl = normalizeMediaUrl(firstText(item.after_url, item.afterUrl, item.after_image_url, item.afterImageUrl, item.after_media_url, item.afterMediaUrl, item.after, item.after_image, item.afterImage, item.image_url, item.media_url));
        const consent = normalizeConsent(firstText(item.consent_status, item.media_consent_status, item.public_consent_status, item.consentStatus));
        const privacy = normalizeConsent(firstText(item.media_privacy_status, item.privacy_status, item.media_status, item.privacyStatus));
        return {
          title: clean(item.title || item.name || item.caption || "Detail result"),
          location,
          town,
          town_slug: slugify(item.town_slug || item.townSlug || town),
          service,
          service_slug: slugify(item.service_slug || item.serviceSlug || service),
          before_kind: mediaKind(item.before_kind || item.beforeKind || beforeUrl),
          before_url: beforeUrl,
          after_kind: mediaKind(item.after_kind || item.afterKind || afterUrl),
          after_url: afterUrl,
          note: clean(item.note || item.description || item.caption || ""),
          consent_status: consent,
          media_privacy_status: privacy,
          privacy_reviewed_at: item.privacy_reviewed_at || item.media_consent_reviewed_at || null,
          customer_name: clean(item.customer_name || item.customerName || ""),
          vehicle_label: clean(item.vehicle_label || item.vehicleLabel || ""),
          fallback_before_url: localAssetFallback(beforeUrl),
          fallback_after_url: localAssetFallback(afterUrl)
        };
      })
      .filter((item) => item.before_url && item.after_url)
  };
}

function isPublicApproved(item) {
  const consent = normalizeConsent(item.consent_status);
  const privacy = normalizeConsent(item.media_privacy_status);
  if (consent === "sample") return true;
  if (["rejected", "private", "approved_private", "pending", "pending_review", "needs_review", "needs_blur"].includes(consent)) return false;
  if (["rejected", "private", "approved_private", "pending", "pending_review", "needs_review", "needs_blur"].includes(privacy)) return false;
  return ["approved_public", "customer_approved_public", "public", "approved"].includes(consent) || ["approved_public", "customer_approved_public", "public", "approved"].includes(privacy);
}
function matchesFilters(item, filters) { return (!filters.service || filters.service === "all" || item.service_slug === filters.service) && (!filters.town || filters.town === "all" || item.town_slug === filters.town); }
function uniqueOptions(items, labelKey, slugKey) { const map = new Map(); for (const item of items) { const slug = item[slugKey]; if (!slug || map.has(slug)) continue; map.set(slug, { value: slug, label: item[labelKey] || slug }); } return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label)); }
function slugify(value) { return String(value || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "all"; }
function cloneValue(value) { return JSON.parse(JSON.stringify(value)); }
function clean(value) { return String(value ?? "").trim(); }
function firstText(...values) { for (const value of values) { const text = clean(value); if (text) return text; } return ""; }
function normalizeConsent(value) {
  const raw = clean(value).toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  const aliases = {
    customer_public: "customer_approved_public",
    customer_approved: "customer_approved_public",
    approved_customer: "customer_approved_public",
    public_approved: "approved_public",
    approved_for_public: "approved_public",
    public_ok: "approved_public",
    ok_public: "approved_public",
    needs_review_public: "needs_review",
    review: "needs_review"
  };
  return aliases[raw] || raw;
}
function mediaKind(value) {
  const raw = clean(value).toLowerCase();
  if (raw === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(raw)) return "video";
  return "image";
}
function normalizeMediaUrl(value) {
  const raw = clean(value);
  if (!raw) return "";
  if (/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i.test(raw)) return raw.replace(/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i, "/assets/brand/");
  if (/^\/brand\//i.test(raw)) return raw.replace(/^\/brand\//i, "/assets/brand/");
  return raw;
}
function localAssetFallback(value) {
  const raw = clean(value);
  if (/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i.test(raw)) return raw.replace(/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i, "/assets/brand/");
  return "";
}
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
