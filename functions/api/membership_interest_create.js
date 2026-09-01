import { json } from "./_lib/http.js";

const PREFERRED_CYCLES = Object.freeze({
  about_4_weeks: "About every 4 weeks (preference only)",
  about_6_weeks: "About every 6 weeks (preference only)",
  about_8_weeks: "About every 8 weeks (preference only)",
  seasonal_custom: "Seasonal / custom (preference only)",
  not_sure: "Not sure yet"
});

export async function onRequestPost({ request, env }) {
  try {
    const serviceKey = getSupabaseServiceRoleKey(env);
    if (!env?.SUPABASE_URL || !serviceKey) {
      return withCors(json({ error: "Maintenance interest is temporarily unavailable." }, 503));
    }

    const body = await request.json().catch(() => ({}));
    const full_name = cleanText(body.full_name, 180);
    const email = cleanText(body.email, 220).toLowerCase();
    const phone = cleanText(body.phone, 60);
    const postal_code = cleanText(body.postal_code, 24).toUpperCase();
    const preferred_cycle = normalizePreferredCycle(body.preferred_cycle);
    const notes = cleanText(body.notes, 1200);
    const vehicle_count = clampWhole(body.vehicle_count, 1, 12);

    if (!full_name) return withCors(json({ error: "Name is required." }, 400));
    if (!looksLikeEmail(email)) return withCors(json({ error: "A valid email is required." }, 400));
    if (!preferred_cycle) {
      return withCors(json({ error: "Choose a maintenance timing preference." }, 400));
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    };

    const row = {
      full_name,
      email,
      phone: phone || null,
      postal_code: postal_code || null,
      vehicle_count,
      preferred_cycle,
      notes: notes || null,
      source_url: "/maintenance-plan",
      status: "new"
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/membership_interest_requests`, {
      method: "POST",
      headers,
      body: JSON.stringify([row])
    });

    if (!res.ok) {
      console.error("Maintenance interest persistence failed.", { status: res.status });
      return withCors(json({ error: "Could not save maintenance interest right now." }, 503));
    }

    return withCors(json({
      ok: true,
      interest_recorded: true,
      creates_subscription: false,
      creates_appointment: false,
      creates_recurring_billing: false
    }, 201));
  } catch (err) {
    console.error("Maintenance interest request failed.", err);
    return withCors(json({ error: "Could not save maintenance interest right now." }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet() {
  return withCors(methodNotAllowed(["POST", "OPTIONS"]));
}

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
}

function cleanText(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizePreferredCycle(value) {
  const key = cleanText(value, 40).toLowerCase();
  return PREFERRED_CYCLES[key] || "";
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function clampWhole(value, min, max) {
  const num = Math.floor(Number(value || min));
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function methodNotAllowed(allowed = ["POST", "OPTIONS"]) {
  return json(
    {
      error: "Method not allowed.",
      allowed_methods: allowed
    },
    405
  );
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
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
