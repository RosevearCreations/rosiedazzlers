import { json } from "./_lib/http.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ error: "Server not configured." }, 500));
    }

    const body = await request.json().catch(() => ({}));
    const full_name = cleanText(body.full_name);
    const email = cleanText(body.email).toLowerCase();
    const phone = cleanText(body.phone);
    const postal_code = cleanText(body.postal_code).toUpperCase();
    const preferred_cycle = cleanText(body.preferred_cycle) || "Every 4 weeks";
    const notes = cleanText(body.notes);
    const source_url = cleanText(body.source_url);
    const vehicle_count = clampWhole(body.vehicle_count, 1, 12);

    if (!full_name) return withCors(json({ error: "Name is required." }, 400));
    if (!looksLikeEmail(email)) return withCors(json({ error: "A valid email is required." }, 400));

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    };

    const row = {
      full_name,
      email,
      phone: phone || null,
      postal_code: postal_code || null,
      vehicle_count,
      preferred_cycle,
      notes: notes || null,
      source_url: source_url || null,
      status: "new"
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/membership_interest_requests`, {
      method: "POST",
      headers,
      body: JSON.stringify([row])
    });

    const out = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = Array.isArray(out)
        ? out[0]?.message
        : out?.message || out?.error || "Could not save membership interest.";
      return withCors(json({ error: msg }, 500));
    }

    return withCors(
      json({
        ok: true,
        request: Array.isArray(out) ? out[0] || null : null
      })
    );
  } catch (err) {
    return withCors(json({ error: err?.message || "Could not save membership interest." }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet() {
  return withCors(methodNotAllowed(["POST", "OPTIONS"]));
}

function cleanText(value) {
  return String(value || "").trim();
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
