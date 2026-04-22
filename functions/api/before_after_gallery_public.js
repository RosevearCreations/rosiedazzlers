import { serviceHeaders } from "./_lib/staff-auth.js";

const DEFAULT_GALLERY = {
  items: [
    {
      title: "Interior refresh",
      location: "Tillsonburg, ON",
      before_kind: "image",
      before_url: "https://assets.rosiedazzlers.ca/brand/CarPrice2025.PNG",
      after_kind: "image",
      after_url: "https://assets.rosiedazzlers.ca/brand/CarPriceDetails2025.PNG",
      note: "Replace these sample images with customer-approved work from App Management.",
      consent_status: "sample"
    },
    {
      title: "Exterior wash and gloss",
      location: "Woodstock, ON",
      before_kind: "image",
      before_url: "https://assets.rosiedazzlers.ca/brand/CarSizeChart.PNG",
      after_kind: "image",
      after_url: "https://assets.rosiedazzlers.ca/brand/CarPrice2025.PNG",
      note: "Use matched angles for the best before/after slider result.",
      consent_status: "sample"
    }
  ]
};

export async function onRequestGet({ env }) {
  try {
    const gallery = await loadGallery(env);
    return withCors(json({ ok: true, ...gallery }));
  } catch (err) {
    return withCors(json({
      ok: true,
      ...DEFAULT_GALLERY,
      warning: err?.message || "Could not load saved gallery content; using fallback sample data."
    }));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function loadGallery(env) {
  const fallback = cloneValue(DEFAULT_GALLERY);
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return fallback;
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.before_after_gallery&limit=1`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) return fallback;
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return normalizeGallery(row?.value);
}

function normalizeGallery(value) {
  const src = value && typeof value === "object" ? value : DEFAULT_GALLERY;
  const items = Array.isArray(src.items) ? src.items : [];
  return {
    items: items
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        title: String(item.title || "Detail result").trim(),
        location: String(item.location || "Oxford / Norfolk Counties").trim(),
        before_kind: String(item.before_kind || "image").trim().toLowerCase() === "video" ? "video" : "image",
        before_url: String(item.before_url || "").trim(),
        after_kind: String(item.after_kind || "image").trim().toLowerCase() === "video" ? "video" : "image",
        after_url: String(item.after_url || "").trim(),
        note: String(item.note || "").trim(),
        consent_status: String(item.consent_status || "").trim(),
        customer_name: String(item.customer_name || "").trim(),
        vehicle_label: String(item.vehicle_label || "").trim()
      }))
      .filter((item) => item.before_url && item.after_url)
  };
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
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
