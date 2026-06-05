// Build 175 — public gallery with service/town filters and privacy enforcement.
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
      before_url: "https://assets.rosiedazzlers.ca/brand/CarPrice2025.PNG",
      after_kind: "image",
      after_url: "https://assets.rosiedazzlers.ca/brand/CarPriceDetails2025.PNG",
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
      before_url: "https://assets.rosiedazzlers.ca/brand/CarSizeChart.PNG",
      after_kind: "image",
      after_url: "https://assets.rosiedazzlers.ca/brand/CarPrice2025.PNG",
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
    const gallery = await loadGallery(env);
    const normalized = normalizeGallery(gallery);
    const approved = normalized.items.filter(isPublicApproved);
    const filtered = approved.filter((item) => matchesFilters(item, filters));
    return withCors(json({
      ok: true,
      items: filtered,
      filters,
      available_services: uniqueOptions(approved, "service", "service_slug"),
      available_towns: uniqueOptions(approved, "town", "town_slug"),
      blocked_count: normalized.items.length - approved.length,
      privacy_rule: "Only sample items and media with approved_public/customer_approved_public consent are returned publicly. Pending/private/rejected media is blocked before gallery reuse."
    }));
  } catch (err) {
    const fallback = normalizeGallery(DEFAULT_GALLERY);
    return withCors(json({ ok: true, ...fallback, warning: err?.message || "Could not load saved gallery content; using fallback sample data." }));
  }
}

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadGallery(env) {
  if (!env?.SUPABASE_URL || !(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)) return cloneValue(DEFAULT_GALLERY);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.before_after_gallery&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return cloneValue(DEFAULT_GALLERY);
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return row?.value || cloneValue(DEFAULT_GALLERY);
}

function normalizeGallery(value) {
  const src = value && typeof value === "object" ? value : DEFAULT_GALLERY;
  const items = Array.isArray(src.items) ? src.items : [];
  return {
    items: items
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const location = String(item.location || item.town || "Oxford / Norfolk Counties").trim();
        const town = String(item.town || location.split(",")[0] || "Oxford / Norfolk").trim();
        const service = String(item.service || item.service_label || item.category || "Mobile detailing").trim();
        return {
          title: String(item.title || "Detail result").trim(),
          location,
          town,
          town_slug: slugify(item.town_slug || town),
          service,
          service_slug: slugify(item.service_slug || service),
          before_kind: String(item.before_kind || "image").trim().toLowerCase() === "video" ? "video" : "image",
          before_url: String(item.before_url || "").trim(),
          after_kind: String(item.after_kind || "image").trim().toLowerCase() === "video" ? "video" : "image",
          after_url: String(item.after_url || "").trim(),
          note: String(item.note || "").trim(),
          consent_status: String(item.consent_status || item.media_consent_status || "").trim().toLowerCase(),
          media_privacy_status: String(item.media_privacy_status || item.privacy_status || "").trim().toLowerCase(),
          privacy_reviewed_at: item.privacy_reviewed_at || item.media_consent_reviewed_at || null,
          customer_name: String(item.customer_name || "").trim(),
          vehicle_label: String(item.vehicle_label || "").trim()
        };
      })
      .filter((item) => item.before_url && item.after_url)
  };
}

function isPublicApproved(item) {
  const consent = String(item.consent_status || "").toLowerCase();
  const privacy = String(item.media_privacy_status || "").toLowerCase();
  if (consent === "sample") return true;
  if (["rejected", "private", "approved_private", "pending", "pending_review", "needs_blur"].includes(consent)) return false;
  if (["rejected", "approved_private", "pending_review", "needs_blur"].includes(privacy)) return false;
  return ["approved_public", "customer_approved_public", "public", "approved"].includes(consent) || ["approved_public", "customer_approved_public", "public"].includes(privacy);
}
function matchesFilters(item, filters) { return (!filters.service || filters.service === "all" || item.service_slug === filters.service) && (!filters.town || filters.town === "all" || item.town_slug === filters.town); }
function uniqueOptions(items, labelKey, slugKey) { const map = new Map(); for (const item of items) { const slug = item[slugKey]; if (!slug || map.has(slug)) continue; map.set(slug, { value: slug, label: item[labelKey] || slug }); } return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label)); }
function slugify(value) { return String(value || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "all"; }
function cloneValue(value) { return JSON.parse(JSON.stringify(value)); }
function json(data, status = 200) { return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
