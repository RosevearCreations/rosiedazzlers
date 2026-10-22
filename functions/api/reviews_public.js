import { serviceHeaders } from "./_lib/staff-auth.js";

const DEFAULT_REVIEWS = {
  source_status: "not_connected",
  items: []
};
const VERIFIED_REVIEW_SOURCES = new Set(["verified", "connected_verified", "owner_approved"]);

export async function onRequestGet({ env }) {
  try {
    const reviews = await loadReviews(env);
    return withCors(json({ ok: true, ...reviews }));
  } catch (err) {
    return withCors(json({
      ok: true,
      ...DEFAULT_REVIEWS,
      warning: "Verified review proof is currently unavailable."
    }));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function loadReviews(env) {
  const fallback = cloneValue(DEFAULT_REVIEWS);
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return fallback;
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.review_proof&limit=1`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) return fallback;
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return normalizeReviews(row?.value);
}

function normalizeReviews(value) {
  const src = value && typeof value === "object" ? value : DEFAULT_REVIEWS;
  const status = cleanText(src.source_status || "").toLowerCase();
  if (!VERIFIED_REVIEW_SOURCES.has(status)) return cloneValue(DEFAULT_REVIEWS);
  const items = Array.isArray(src.items) ? src.items : [];
  const normalized = items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      rating: clampRating(item.rating),
      name: cleanText(item.name || "Local customer"),
      location: cleanText(item.location || "Oxford / Norfolk Counties"),
      service: cleanText(item.service || "Mobile auto detailing"),
      quote: cleanText(item.quote || item.text || "")
    }))
    .filter((item) => item.quote);
  return {
    source_status: status,
    items: normalized
  };
}

function clampRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function cleanText(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, 600);
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=300"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}
