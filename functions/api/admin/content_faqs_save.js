import { requireStaffAccess, json, serviceHeaders, cleanText, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_promos",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({
        ok: false,
        table_ready: false,
        error: "Server configuration is incomplete. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY.",
        migration_hint: "Apply sql/2026-05-24_build172_public_faq_content_foundation.sql before editing FAQ rows."
      }, 500));
    }

    const payload = normalizePayload(body);
    if (!payload.category || !payload.question || !payload.answer) {
      return withCors(json({ ok: false, error: "Category, question, and answer are required." }, 400));
    }

    const id = cleanText(body.id);
    const result = id
      ? await updateFaqRow(env, id, payload)
      : await createFaqRow(env, payload);

    return withCors(json({
      ok: true,
      table_ready: true,
      created: !id,
      item: result
    }));
  } catch (err) {
    return withCors(json({
      ok: false,
      table_ready: false,
      error: err?.message || "Could not save FAQ entry.",
      migration_hint: "Apply sql/2026-05-24_build172_public_faq_content_foundation.sql before editing FAQ rows from Admin Content."
    }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

export async function onRequestPut() {
  return withCors(methodNotAllowed());
}

async function createFaqRow(env, payload) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_faq_entries`, {
    method: "POST",
    headers: {
      ...serviceHeaders(env),
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(payload)
  });
  return parseWriteResponse(res, "Could not create FAQ entry.");
}

async function updateFaqRow(env, id, payload) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_faq_entries?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      ...serviceHeaders(env),
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(payload)
  });
  return parseWriteResponse(res, "Could not update FAQ entry.");
}

async function parseWriteResponse(res, fallback) {
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, fallback));
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

function normalizePayload(body) {
  const sourceKey = cleanSourceKey(body.source_key);
  const payload = {
    category: cleanText(body.category).slice(0, 120) || "General",
    question: cleanText(body.question).slice(0, 240),
    answer: cleanText(body.answer).slice(0, 2500),
    cta_label: nullableText(body.cta_label, 120),
    cta_href: normalizeHref(body.cta_href),
    sort_order: clampInt(body.sort_order, 0, 9999, 100),
    is_active: body.is_active !== false && String(body.is_active) !== "false",
    updated_at: new Date().toISOString()
  };
  if (sourceKey) payload.source_key = sourceKey;
  return payload;
}

function nullableText(value, max) {
  const text = cleanText(value).slice(0, max || 500);
  return text || null;
}

function normalizeHref(value) {
  const text = cleanText(value).slice(0, 400);
  if (!text) return null;
  if (text.startsWith("/") || text.startsWith("https://rosiedazzlers.ca/")) return text;
  return null;
}

function cleanSourceKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function extractSupabaseError(data, text, fallback) {
  if (data && data.message) return data.message;
  if (typeof text === "string" && text.trim()) return text.slice(0, 300);
  return fallback;
}

function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && getSupabaseServiceRoleKey(env));
}

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
