// Build 389 — fail-closed public proof feed for local/service landing pages.
import { serviceHeaders } from "./_lib/staff-auth.js";
import {
  cleanText,
  galleryProofEligibility,
  normalizeConsent,
  normalizePublicationStatus,
} from "./_lib/gallery-publication.js";

const LOCATION_PAGE_TOWNS = Object.freeze({
  "tillsonburg-auto-detailing": ["tillsonburg"],
  "woodstock-ingersoll-auto-detailing": ["woodstock", "ingersoll"],
  "norwich-otterville-auto-detailing": ["norwich", "otterville"],
  "zorra-thamesford-embro-auto-detailing": ["zorra", "thamesford", "embro"],
  "simcoe-delhi-auto-detailing": ["simcoe", "delhi"],
  "port-dover-auto-detailing": ["port-dover"],
  "waterford-vittoria-auto-detailing": ["waterford", "vittoria"],
  "port-rowan-turkey-point-auto-detailing": ["port-rowan", "turkey-point"],
});

const SERVICE_ALIASES = Object.freeze({
  "odor-removal": ["odor-removal", "odour-removal"],
  "odour-removal": ["odor-removal", "odour-removal"],
  "complete-detail": ["complete-detail", "complete-detailing"],
  "interior-detail": ["interior-detail", "interior-detailing"],
  "exterior-detail": ["exterior-detail", "exterior-detailing"],
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const criteria = resolveProofCriteria({
    slug: url.searchParams.get("slug"),
    town: url.searchParams.get("town"),
    service: url.searchParams.get("service"),
  });

  if (!hasServiceConfiguration(env)) {
    return withCors(json(emptyPayload(criteria, "unavailable", "Public proof database configuration is unavailable.")));
  }

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.before_after_gallery&limit=1`,
      { headers: serviceHeaders(env) },
    );
    if (!response.ok) {
      return withCors(json(emptyPayload(criteria, "unavailable", `Public proof authority returned ${response.status}.`)));
    }

    const rows = await response.json().catch(() => []);
    const gallery = Array.isArray(rows) ? rows[0]?.value || null : null;
    const items = publicProofItems(gallery, criteria);

    return withCors(json({
      ok: true,
      items,
      proof_ready_count: items.length,
      filters: criteria,
      source_status: gallery ? "database" : "empty",
      fallback_used: false,
      publication_rule: "Landing proof is returned only from the saved Gallery authority; bundled samples and fallback media are never returned.",
      proof_rule: "Each item must be explicitly published, public-use/privacy approved, non-sample, and include vehicle, condition, problem, process, and result context.",
    }));
  } catch (error) {
    return withCors(json(emptyPayload(criteria, "unavailable", cleanText(error?.message || "Public proof could not be loaded."))));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export function publicProofItems(gallery, criteria = resolveProofCriteria({})) {
  const source = gallery && typeof gallery === "object" && Array.isArray(gallery.items) ? gallery.items : [];
  return source
    .map(normalizeProofItem)
    .filter((item) => galleryProofEligibility(item).eligible)
    .filter((item) => matchesCriteria(item, criteria))
    .map(sanitizeProofItem)
    .slice(0, 6);
}

export function resolveProofCriteria({ slug = "", town = "", service = "" } = {}) {
  const pageSlug = slugify(slug);
  const explicitTown = slugify(town);
  const explicitService = slugify(service);

  if (explicitTown || explicitService) {
    return {
      slug: pageSlug,
      towns: explicitTown ? [explicitTown] : [],
      services: explicitService ? serviceAliases(explicitService) : [],
    };
  }

  if (LOCATION_PAGE_TOWNS[pageSlug]) {
    return { slug: pageSlug, towns: [...LOCATION_PAGE_TOWNS[pageSlug]], services: [] };
  }

  return {
    slug: pageSlug,
    towns: [],
    services: pageSlug && pageSlug !== "all" ? serviceAliases(pageSlug) : [],
  };
}

function normalizeProofItem(raw = {}) {
  const town = cleanText(raw.town || raw.city || String(raw.location || "").split(",")[0]);
  const service = cleanText(raw.service || raw.service_label || raw.category || raw.addon_name);
  const consent = normalizeConsent(firstText(raw.consent_status, raw.media_consent_status, raw.public_consent_status));
  const privacy = normalizeConsent(firstText(raw.media_privacy_status, raw.privacy_status, raw.media_status));
  return {
    title: cleanText(raw.title || raw.name || raw.caption || "Detail result"),
    location: cleanText(raw.location || town),
    town,
    town_slug: slugify(raw.town_slug || town),
    service,
    service_slug: slugify(raw.service_slug || service),
    before_kind: mediaKind(raw.before_kind || raw.beforeKind || raw.before_url),
    before_url: firstText(raw.before_url, raw.beforeUrl, raw.before_image_url, raw.before_media_url),
    after_kind: mediaKind(raw.after_kind || raw.afterKind || raw.after_url),
    after_url: firstText(raw.after_url, raw.afterUrl, raw.after_image_url, raw.after_media_url),
    note: cleanText(raw.note || raw.description || ""),
    consent_status: consent,
    media_privacy_status: privacy,
    publication_status: normalizePublicationStatus(raw.publication_status),
    proof_kind: cleanText(raw.proof_kind || (consent === "sample" ? "sample" : "customer_work")),
    vehicle_label: cleanText(raw.vehicle_label || raw.vehicleLabel),
    condition_summary: cleanText(raw.condition_summary || raw.condition),
    problem: cleanText(raw.problem),
    process: cleanText(raw.process),
    result: cleanText(raw.result),
  };
}

function sanitizeProofItem(item) {
  return {
    title: item.title,
    location: item.location,
    town: item.town,
    town_slug: item.town_slug,
    service: item.service,
    service_slug: item.service_slug,
    before_kind: item.before_kind,
    before_url: item.before_url,
    after_kind: item.after_kind,
    after_url: item.after_url,
    note: item.note,
    publication_status: item.publication_status,
    proof_kind: item.proof_kind,
    vehicle_label: item.vehicle_label,
    condition_summary: item.condition_summary,
    problem: item.problem,
    process: item.process,
    result: item.result,
  };
}

function matchesCriteria(item, criteria) {
  const towns = Array.isArray(criteria?.towns) ? criteria.towns : [];
  const services = Array.isArray(criteria?.services) ? criteria.services : [];
  if (towns.length && !towns.includes(slugify(item.town_slug || item.town))) return false;
  if (services.length && !services.includes(slugify(item.service_slug || item.service))) return false;
  return true;
}

function serviceAliases(value) {
  const normalized = slugify(value);
  return [...new Set(SERVICE_ALIASES[normalized] || [normalized])];
}

function emptyPayload(criteria, sourceStatus, warning) {
  return {
    ok: true,
    items: [],
    proof_ready_count: 0,
    filters: criteria,
    source_status: sourceStatus,
    fallback_used: false,
    warning,
    publication_rule: "Landing proof fails closed when the saved Gallery authority is unavailable.",
    proof_rule: "Sample, fallback, unpublished, private, or context-incomplete media is never returned as landing-page proof.",
  };
}

function hasServiceConfiguration(env) {
  return Boolean(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY));
}
function slugify(value) { return cleanText(value).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "all"; }
function firstText(...values) { for (const value of values) { const text = cleanText(value); if (text) return text; } return ""; }
function mediaKind(value) { const raw = cleanText(value).toLowerCase(); return raw === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(raw) ? "video" : "image"; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
