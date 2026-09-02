import { json } from "./_lib/http.js";

const TOPICS = new Set(["fleet", "maintenance", "gift_card", "special", "photo_estimate", "general"]);
const FLEET_REQUEST_TYPES = Object.freeze({
  workplace_group: "Workplace / same-location vehicle group",
  small_business: "Small business fleet",
  contractor_work_trucks: "Contractor / work trucks",
  household_multi_vehicle: "Household multi-vehicle group",
  dealership_overflow: "Dealership / overflow review",
  other: "Other multi-vehicle request"
});
const FLEET_TIMING_PREFERENCES = Object.freeze({
  not_sure: "Not sure yet",
  one_time: "One-time cleanup (preference only)",
  seasonal: "Seasonal timing (preference only)",
  as_needed: "As needed (preference only)",
  repeat_interest: "Interested in repeat service; timing to be reviewed"
});

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const website = clean(body.website || body.company_website, 240);
    if (website) return withCors(json({ ok: true, ignored: true }));

    const serviceKey = getSupabaseServiceRoleKey(env);
    if (!env?.SUPABASE_URL || !serviceKey) {
      return withCors(json({ ok: false, error: "Inquiry service is temporarily unavailable. Please call, text, or use the booking form." }, 503));
    }

    const topic = normalizeTopic(body.topic || body.lead_type);
    const full_name = clean(body.full_name || body.name, 180);
    const email = cleanEmail(body.email || body.customer_email);
    const phone = clean(body.phone || body.customer_phone, 60);
    const service_area = clean(body.service_area || body.town || body.city, 180);
    const vehicle_count = clampWhole(body.vehicle_count, 1, 250);
    const photo_estimate_links = normalizeStringList(body.photo_estimate_links || body.photo_links);
    const rawMessage = clean(body.message || body.notes, 1800);

    if (!full_name) return withCors(json({ ok: false, error: "Name is required." }, 400));
    if (!email && !phone) return withCors(json({ ok: false, error: "Email or phone is required." }, 400));
    if (rawMessage.length < 8) return withCors(json({ ok: false, error: "Please add a few details so we know what you need." }, 400));

    let preferred_cadence = clean(body.preferred_cadence || body.cadence, 120) || null;
    let source_path = normalizeSourcePath(body.source_path);
    let message = rawMessage;

    if (topic === "fleet") {
      const requestType = normalizeFleetValue(FLEET_REQUEST_TYPES, body.request_type);
      const timingPreference = normalizeFleetValue(FLEET_TIMING_PREFERENCES, body.preferred_cadence || body.timing_preference);
      const businessName = clean(body.business_name || body.organization_name || body.company_name, 180);
      if (!requestType) return withCors(json({ ok: false, error: "Choose the type of fleet or workplace request." }, 400));
      if (!timingPreference) return withCors(json({ ok: false, error: "Choose a timing preference." }, 400));

      preferred_cadence = timingPreference;
      source_path = "/fleet";
      message = [
        `Request type: ${requestType}`,
        businessName ? `Business / organization: ${businessName}` : "",
        rawMessage
      ].filter(Boolean).join("\n").slice(0, 2200);
    }

    const payload = {
      topic,
      full_name,
      email: email || null,
      phone: phone || null,
      service_area: service_area || null,
      vehicle_count,
      preferred_cadence,
      source_path: source_path || null,
      message,
      photo_estimate_links,
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error("Public inquiry persistence failed.", { topic, status: res.status });
      return withCors(json({ ok: false, error: "Inquiry could not be saved right now. Please call, text, or use the booking form." }, 503));
    }

    return withCors(json({
      ok: true,
      lead_recorded: true,
      creates_quote: false,
      creates_appointment: false,
      creates_recurring_commitment: false
    }, 201));
  } catch (err) {
    console.error("Public inquiry request failed.", err);
    return withCors(json({ ok: false, error: "Inquiry could not be saved right now. Please call, text, or use the booking form." }, 500));
  }
}

export async function onRequestGet() {
  return withCors(json({
    ok: false,
    error: "Method not allowed.",
    allowed_methods: ["POST", "OPTIONS"]
  }, 405));
}

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
}

function normalizeTopic(value) {
  const topic = clean(value || "general", 40).toLowerCase().replace(/[^a-z0-9_ -]+/g, "").replace(/\s+/g, "_");
  return TOPICS.has(topic) ? topic : "general";
}

function normalizeFleetValue(map, value) {
  const key = clean(value, 60).toLowerCase();
  return map[key] || "";
}

function normalizeSourcePath(value) {
  const source = clean(value, 220);
  if (!source.startsWith("/")) return "";
  return source.split(/[?#]/, 1)[0].replace(/[^a-zA-Z0-9_\-/.]/g, "").slice(0, 180);
}

function normalizeStringList(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(/[\n,]+/);
  return list.map((item) => clean(item, 500)).filter(Boolean).filter((item, index, all) => all.indexOf(item) === index).slice(0, 20);
}

function clampWhole(value, min, max) {
  if (value === "" || value == null) return null;
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

function clean(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanEmail(value) {
  const email = clean(value, 220).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
