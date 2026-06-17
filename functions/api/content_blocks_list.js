// Build 175 — Admin Content Center generic content block listing.
import { requireStaffAccess, json, serviceHeaders, cleanText, methodNotAllowed } from "../_lib/staff-auth.js";

const BLOCK_SELECT = [
  "id", "created_at", "updated_at", "content_type", "placement", "slug", "title", "summary", "body", "cta_label", "cta_href", "image_url", "sort_order", "is_active", "metadata"
].join(",");

const STATIC_BLOCKS = [
  { content_type: "special", placement: "specials_page", slug: "seasonal-refresh", title: "Seasonal refresh special", summary: "A timely detailing reminder for road salt, pollen, summer dust, or winter prep.", body: "Use this block for specials that should be visible on the Specials page without editing HTML.", cta_label: "View specials", cta_href: "/specials", sort_order: 10, is_active: true },
  { content_type: "service_blurb", placement: "services_page", slug: "photo-estimate-first", title: "Send photos first when condition matters", summary: "Pet hair, odour, salt, paint correction, ceramic coating, and fleet jobs should be reviewed before final pricing.", body: "This service blurb supports quote-first customer education and reduces pricing surprises.", cta_label: "Send photos", cta_href: "/book?estimate=photos", sort_order: 20, is_active: true },
  { content_type: "homepage_card", placement: "home_feature", slug: "mobile-detailing-proof", title: "Mobile detailing proof", summary: "Feature local before/after proof once privacy-approved media is ready.", body: "Use this block to connect the homepage to approved gallery and recent-work proof.", cta_label: "See gallery", cta_href: "/gallery", sort_order: 30, is_active: true },
  { content_type: "help_article", placement: "help_hub", slug: "road-salt-cleanup", title: "Ontario road salt cleanup", summary: "Explain why winter salt cleanup matters for Southern Ontario vehicles.", body: "Help article content can be expanded here before becoming a dedicated help page.", cta_label: "Read help articles", cta_href: "/blog", sort_order: 40, is_active: true }
];

export async function onRequestGet(context) { return onRequestPost(context); }

export async function onRequestPost({ request, env }) {
  try {
    const body = request.method === "GET" ? Object.fromEntries(new URL(request.url).searchParams.entries()) : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: true, source: "static_fallback", table_ready: false, items: filterRows(STATIC_BLOCKS, body), migration_hint: "Apply sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql before saving content blocks." }));
    }

    const rows = await loadBlocks(env, body);
    return withCors(json({ ok: true, source: "db", table_ready: true, items: rows }));
  } catch (err) {
    return withCors(json({ ok: true, source: "static_fallback", table_ready: false, warning: err?.message || "Content block table is not ready.", items: filterRows(STATIC_BLOCKS, {}), migration_hint: "Apply sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql before saving content blocks." }));
  }
}

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPut() { return withCors(methodNotAllowed()); }

async function loadBlocks(env, body) {
  const params = new URLSearchParams();
  params.set("select", BLOCK_SELECT);
  params.set("order", "sort_order.asc,updated_at.desc");
  params.set("limit", String(clampInt(body.limit, 1, 250, 100)));
  const type = cleanSlug(body.content_type || body.type || "all");
  const placement = cleanSlug(body.placement || "all");
  const status = cleanSlug(body.status || "all");
  const q = cleanText(body.q || body.search);
  if (type && type !== "all") params.set("content_type", `eq.${type}`);
  if (placement && placement !== "all") params.set("placement", `eq.${placement}`);
  if (status === "active") params.set("is_active", "eq.true");
  if (status === "hidden") params.set("is_active", "eq.false");
  if (q) {
    const like = `*${q.replace(/[*,()]/g, " ").trim()}*`;
    params.set("or", `(title.ilike.${like},summary.ilike.${like},body.ilike.${like},slug.ilike.${like},placement.ilike.${like})`);
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/site_content_blocks?${params.toString()}`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load site content blocks."));
  return Array.isArray(data) ? data : [];
}

function filterRows(rows, body) { const type = cleanSlug(body.content_type || body.type || "all"); const q = cleanText(body.q || body.search).toLowerCase(); return rows.filter((row) => type === "all" || !type || row.content_type === type).filter((row) => !q || [row.title, row.summary, row.body, row.slug, row.placement].join(" ").toLowerCase().includes(q)); }
function cleanSlug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_ -]+/g, "").replace(/\s+/g, "_"); }
function clampInt(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
