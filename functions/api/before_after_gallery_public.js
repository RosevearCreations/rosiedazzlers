// Build 283 — public Gallery is explicitly published, privacy-approved, and fail-closed.
import { serviceHeaders } from "./_lib/staff-auth.js";
import {
  cleanText,
  galleryProofEligibility,
  isGalleryPublished,
  normalizeConsent,
  normalizePublicationStatus,
} from "./_lib/gallery-publication.js";

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
      note: "Sample placeholder. Replace with customer-approved work from Gallery Approvals.",
      consent_status: "sample",
      media_privacy_status: "approved_public",
      publication_status: "published",
      proof_kind: "sample",
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
      media_privacy_status: "approved_public",
      publication_status: "published",
      proof_kind: "sample",
    },
  ],
};

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const filters = {
      service: slugify(url.searchParams.get("service") || "all"),
      town: slugify(url.searchParams.get("town") || "all"),
    };

    const loaded = await loadGallery(request, env);
    const saved = normalizeGallery(loaded.gallery);
    const fallback = normalizeGallery(await loadStaticGallery(request));
    const savedPublished = saved.items.filter(isGalleryPublished);
    const fallbackPublished = fallback.items.filter(isGalleryPublished);

    // Build 283 deliberately does not infer publication for legacy DB rows. If the
    // saved setting has no explicit published row, preserve a usable public Gallery
    // with bundled sample placeholders while staff reviews/publishes real evidence.
    const useFallback = savedPublished.length === 0;
    const sourceItems = useFallback ? fallbackPublished : savedPublished;
    const sourceStatus = useFallback ? "static_fallback" : loaded.source;
    const filtered = sourceItems.filter((item) => matchesFilters(item, filters));

    const payload = {
      ok: true,
      items: filtered,
      filters,
      source_status: sourceStatus,
      fallback_used: useFallback || Boolean(loaded.warning),
      available_services: uniqueOptions(sourceItems, "service", "service_slug"),
      available_towns: uniqueOptions(sourceItems, "town", "town_slug"),
      blocked_count: Math.max(0, saved.items.length - savedPublished.length),
      proof_ready_count: sourceItems.filter((item) => galleryProofEligibility(item).eligible).length,
      publication_rule: "A saved Gallery row must be explicitly published and pass both public-use consent and media-privacy review. Legacy approval alone never implies publication.",
      proof_rule: "Real Rosie proof additionally requires non-sample media plus vehicle, condition, problem, process, and result context.",
    };

    if (loaded.warning) payload.warning = loaded.warning;
    if (useFallback && saved.items.length) {
      payload.warning = payload.warning || "Saved Gallery rows exist but none are explicitly publishable under Build 283, so public sample fallback remains active.";
    } else if (useFallback && !saved.items.length) {
      payload.warning = payload.warning || "Saved Gallery had no usable rows, so public sample fallback remains active.";
    }
    return withCors(json(payload));
  } catch (err) {
    const fallback = normalizeGallery(await loadStaticGallery(request));
    const items = fallback.items.filter(isGalleryPublished);
    return withCors(json({
      ok: true,
      items,
      available_services: uniqueOptions(items, "service", "service_slug"),
      available_towns: uniqueOptions(items, "town", "town_slug"),
      blocked_count: 0,
      proof_ready_count: 0,
      source_status: "emergency_default",
      fallback_used: true,
      warning: err?.message || "Could not load saved Gallery content; using public sample fallback.",
      publication_rule: "A saved Gallery row must be explicitly published and pass both public-use consent and media-privacy review.",
      proof_rule: "Sample fallback media is never counted as real Rosie proof.",
    }));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function loadGallery(request, env) {
  if (!env?.SUPABASE_URL || !(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)) {
    return { gallery: await loadStaticGallery(request), source: "static_fallback", warning: "Database settings were unavailable; Gallery used bundled sample fallback data." };
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.before_after_gallery&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return { gallery: await loadStaticGallery(request), source: "static_fallback", warning: `Database Gallery lookup returned ${res.status}; Gallery used bundled fallback data.` };
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
        const location = cleanText(item.location || item.town || item.city || "Oxford / Norfolk Counties");
        const town = cleanText(item.town || item.city || location.split(",")[0] || "Oxford / Norfolk");
        const service = cleanText(item.service || item.service_label || item.category || item.addon_name || "Mobile detailing");
        const beforeUrl = normalizeMediaUrl(firstText(item.before_url, item.beforeUrl, item.before_image_url, item.beforeImageUrl, item.before_media_url, item.beforeMediaUrl, item.before, item.before_image, item.beforeImage));
        const afterUrl = normalizeMediaUrl(firstText(item.after_url, item.afterUrl, item.after_image_url, item.afterImageUrl, item.after_media_url, item.afterMediaUrl, item.after, item.after_image, item.afterImage, item.image_url, item.media_url));
        const consent = normalizeConsent(firstText(item.consent_status, item.media_consent_status, item.public_consent_status, item.consentStatus));
        const privacy = normalizeConsent(firstText(item.media_privacy_status, item.privacy_status, item.media_status, item.privacyStatus));
        return {
          title: cleanText(item.title || item.name || item.caption || "Detail result"),
          location,
          town,
          town_slug: slugify(item.town_slug || item.townSlug || town),
          service,
          service_slug: slugify(item.service_slug || item.serviceSlug || service),
          before_kind: mediaKind(item.before_kind || item.beforeKind || beforeUrl),
          before_url: beforeUrl,
          after_kind: mediaKind(item.after_kind || item.afterKind || afterUrl),
          after_url: afterUrl,
          note: cleanText(item.note || item.description || item.caption || ""),
          consent_status: consent,
          media_privacy_status: privacy,
          publication_status: normalizePublicationStatus(item.publication_status),
          proof_kind: cleanText(item.proof_kind || (consent === "sample" ? "sample" : "customer_work")),
          privacy_reviewed_at: item.privacy_reviewed_at || item.media_consent_reviewed_at || null,
          published_at: item.published_at || null,
          customer_name: cleanText(item.customer_name || item.customerName || ""),
          vehicle_label: cleanText(item.vehicle_label || item.vehicleLabel || ""),
          condition_summary: cleanText(item.condition_summary || item.condition || ""),
          problem: cleanText(item.problem || ""),
          process: cleanText(item.process || ""),
          result: cleanText(item.result || ""),
          source_booking_id: cleanText(item.source_booking_id || ""),
          source_job_media_id: cleanText(item.source_job_media_id || ""),
          fallback_before_url: localAssetFallback(beforeUrl),
          fallback_after_url: localAssetFallback(afterUrl),
        };
      })
      .filter((item) => item.before_url && item.after_url),
  };
}

function matchesFilters(item, filters) {
  return (!filters.service || filters.service === "all" || item.service_slug === filters.service)
    && (!filters.town || filters.town === "all" || item.town_slug === filters.town);
}

function uniqueOptions(items, labelKey, slugKey) {
  const map = new Map();
  for (const item of items) {
    const slug = item[slugKey];
    if (!slug || map.has(slug)) continue;
    map.set(slug, { value: slug, label: item[labelKey] || slug });
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "all";
}
function cloneValue(value) { return JSON.parse(JSON.stringify(value)); }
function firstText(...values) { for (const value of values) { const text = cleanText(value); if (text) return text; } return ""; }
function mediaKind(value) { const raw = cleanText(value).toLowerCase(); if (raw === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(raw)) return "video"; return "image"; }
function normalizeMediaUrl(value) {
  const raw = cleanText(value);
  if (!raw) return "";
  if (/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i.test(raw)) return raw.replace(/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i, "/assets/brand/");
  if (/^\/brand\//i.test(raw)) return raw.replace(/^\/brand\//i, "/assets/brand/");
  return raw;
}
function localAssetFallback(value) {
  const raw = cleanText(value);
  if (/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i.test(raw)) return raw.replace(/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i, "/assets/brand/");
  return "";
}
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
