import { serviceHeaders, json, cleanText, cleanEmail } from "./_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const website = cleanText(body.website || body.company_website || "");
    if (website) return withCors(json({ ok: true, ignored: true }));

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({
        ok: false,
        error: "Lead storage is not configured yet. Please call, text, or use the booking form."
      }, 500));
    }

    const topic = normalizeTopic(body.topic || body.lead_type || "general");
    const full_name = cleanText(body.full_name || body.name);
    const email = cleanEmail(body.email || body.customer_email);
    const phone = cleanText(body.phone || body.customer_phone);
    const service_area = cleanText(body.service_area || body.town || body.city);
    const vehicle_count = clampNumber(body.vehicle_count, 1, 250);
    const preferred_cadence = cleanText(body.preferred_cadence || body.cadence);
    const source_path = cleanText(body.source_path || "");
    const message = cleanText(body.message || body.notes);
    const photo_estimate_links = normalizeStringList(body.photo_estimate_links || body.photo_links);

    if (!full_name) return withCors(json({ ok: false, error: "Name is required." }, 400));
    if (!email && !phone) return withCors(json({ ok: false, error: "Email or phone is required." }, 400));
    if (message.length < 8) return withCors(json({ ok: false, error: "Please add a few details so we know what you need." }, 400));

    const payload = {
      topic,
      full_name,
      email: email || null,
      phone: phone || null,
      service_area: service_area || null,
      vehicle_count: Number.isFinite(vehicle_count) ? vehicle_count : null,
      preferred_cadence: preferred_cadence || null,
      source_path: source_path || null,
      message,
      photo_estimate_links,
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    const data = safeJson(text);

    if (!res.ok) {
      return withCors(json({
        ok: false,
        error: "Lead could not be saved yet. Please call, text, or use the booking form.",
        details: data || text
      }, 502));
    }

    return withCors(json({ ok: true, lead: Array.isArray(data) ? data[0] : data }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || String(err) }, 500));
  }
}

export async function onRequestGet() {
  return withCors(json({
    ok: true,
    endpoint: "public_lead_submit",
    methods: ["POST"],
    topics: ["fleet", "maintenance", "gift_card", "special", "photo_estimate", "general"]
  }));
}

function normalizeTopic(value) {
  const topic = cleanText(value).toLowerCase().replace(/[^a-z0-9_ -]+/g, "").replace(/\s+/g, "_");
  const allowed = new Set(["fleet", "maintenance", "gift_card", "special", "photo_estimate", "general"]);
  return allowed.has(topic) ? topic : "general";
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).slice(0, 20);
  return String(value || "")
    .split(/[\n,]+/)
    .map(cleanText)
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, 20);
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
