import { serviceHeaders } from "./_lib/staff-auth.js";

const DEFAULT_REVIEWS = {
  source_status: "temporary_sample_until_review_api_connected",
  items: [
    {
      rating: 5,
      name: "Melissa R.",
      location: "Tillsonburg, ON",
      service: "SUV interior detail",
      quote: "Our SUV had winter salt in every corner. The interior detail made it feel fresh again, especially the mats and door jambs."
    },
    {
      rating: 5,
      name: "Jason K.",
      location: "Woodstock, ON",
      service: "Engine cleaning",
      quote: "The engine bay cleaning was exactly what we wanted before selling the car. It looked cared for without being overdone."
    },
    {
      rating: 5,
      name: "Amanda P.",
      location: "Ingersoll, ON",
      service: "Pet hair removal",
      quote: "Pet hair was our biggest problem. They took the time to work through the seats and cargo area and the car finally looked presentable again."
    },
    {
      rating: 5,
      name: "Trevor M.",
      location: "Simcoe, ON",
      service: "Clay treatment and sealant",
      quote: "The clay treatment and sealant brought the paint back to a smooth shine. Water beads much better now after washing."
    },
    {
      rating: 5,
      name: "Rachel D.",
      location: "Delhi, ON",
      service: "Complete detail",
      quote: "We booked a complete detail before a family trip. The van smelled cleaner, the glass was spotless, and the kids noticed first."
    }
  ]
};

export async function onRequestGet({ env }) {
  try {
    const reviews = await loadReviews(env);
    return withCors(json({ ok: true, ...reviews }));
  } catch (err) {
    return withCors(json({
      ok: true,
      ...DEFAULT_REVIEWS,
      warning: err?.message || "Could not load review proof; using sample fallback data."
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
    source_status: cleanText(src.source_status || "temporary_sample_until_review_api_connected"),
    items: normalized.length ? normalized : cloneValue(DEFAULT_REVIEWS.items)
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
