// Build 175 — Admin Content Center generic content block save endpoint.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const ALLOWED_TYPES = new Set(["special", "service_blurb", "homepage_card", "help_article", "faq_note", "trust_proof", "maintenance", "fleet"]);

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, table_ready: false, error: "Server configuration is incomplete.", migration_hint: "Apply sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql before saving content blocks." }, 500));

    const payload = normalizePayload(body);
    if (!payload.title || !payload.content_type || !payload.placement) return withCors(json({ ok: false, error: "Content type, placement, and title are required." }, 400));
    const id = cleanText(body.id);
    if (id && !isUuid(id)) return withCors(json({ ok: false, error: "Invalid content block id." }, 400));

    const url = id ? `${env.SUPABASE_URL}/rest/v1/site_content_blocks?id=eq.${encodeURIComponent(id)}` : `${env.SUPABASE_URL}/rest/v1/site_content_blocks`;
    const res = await fetch(url, { method: id ? "PATCH" : "POST", headers: { ...serviceHeaders(env), "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(payload) });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not save content block."));
    return withCors(json({ ok: true, table_ready: true, created: !id, item: Array.isArray(data) ? data[0] || null : data }));
  } catch (err) {
    return withCors(json({ ok: false, table_ready: false, error: err?.message || "Could not save content block.", migration_hint: "Apply sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql before saving content blocks." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestPut() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

function normalizePayload(body) {
  const type = cleanSlug(body.content_type || body.type || "service_blurb");
  return {
    content_type: ALLOWED_TYPES.has(type) ? type : "service_blurb",
    placement: cleanSlug(body.placement || "general"),
    slug: cleanSlug(body.slug || body.title || crypto.randomUUID()).slice(0, 140),
    title: cleanText(body.title)?.slice(0, 220) || "Content block",
    summary: nullableText(body.summary, 600),
    body: nullableText(body.body, 6000),
    cta_label: nullableText(body.cta_label, 100),
    cta_href: normalizeHref(body.cta_href),
    image_url: nullableText(body.image_url, 1000),
    sort_order: clampInt(body.sort_order, 0, 9999, 100),
    is_active: body.is_active === false || String(body.is_active).toLowerCase() === "false" ? false : true,
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    updated_at: new Date().toISOString()
  };
}
function nullableText(value, max) { const text = cleanText(value); return text ? text.slice(0, max) : null; }
function normalizeHref(value) { const text = cleanText(value); if (!text) return null; if (/^https?:\/\//i.test(text) || text.startsWith("/")) return text.slice(0, 1000); return `/${text.replace(/^\/+/, "")}`; }
function cleanSlug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_ -]+/g, "").replace(/\s+/g, "_"); }
function clampInt(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
