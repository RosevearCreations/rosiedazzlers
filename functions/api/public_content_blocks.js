// Build 175 — public content block reader with safe fallback.
import { serviceHeaders } from "./_lib/staff-auth.js";

const FALLBACK_BLOCKS = [
  { content_type: "service_blurb", placement: "services_page", slug: "photo-estimate-first", title: "Send photos first when condition matters", summary: "Pet hair, odour, salt, paint correction, ceramic coating, and fleet jobs should be reviewed before final pricing.", cta_label: "Send photos", cta_href: "/book?estimate=photos", sort_order: 20, is_active: true },
  { content_type: "homepage_card", placement: "home_feature", slug: "local-proof", title: "Local detailing proof", summary: "Before/after media is only shown publicly after privacy approval.", cta_label: "See gallery", cta_href: "/gallery", sort_order: 30, is_active: true }
];

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const placement = cleanSlug(url.searchParams.get("placement") || "all");
    const type = cleanSlug(url.searchParams.get("content_type") || url.searchParams.get("type") || "all");
    const items = await loadBlocks(env, { placement, type });
    return withCors(json({ ok: true, source: env?.SUPABASE_URL ? "db_or_fallback" : "fallback", items }));
  } catch (err) {
    return withCors(json({ ok: true, source: "fallback", warning: err?.message || "Content blocks unavailable; using fallback.", items: FALLBACK_BLOCKS }));
  }
}
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
async function loadBlocks(env, { placement, type }) {
  if (!env?.SUPABASE_URL || !(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)) return filterRows(FALLBACK_BLOCKS, { placement, type });
  const params = new URLSearchParams();
  params.set("select", "content_type,placement,slug,title,summary,body,cta_label,cta_href,image_url,sort_order,metadata");
  params.set("is_active", "eq.true");
  params.set("order", "sort_order.asc,title.asc");
  params.set("limit", "100");
  if (placement && placement !== "all") params.set("placement", `eq.${placement}`);
  if (type && type !== "all") params.set("content_type", `eq.${type}`);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/site_content_blocks?${params.toString()}`, { headers: serviceHeaders(env) });
  if (!res.ok) return filterRows(FALLBACK_BLOCKS, { placement, type });
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows.length ? rows : filterRows(FALLBACK_BLOCKS, { placement, type });
}
function filterRows(rows, { placement, type }) { return rows.filter((row) => !placement || placement === "all" || row.placement === placement).filter((row) => !type || type === "all" || row.content_type === type); }
function cleanSlug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_ -]+/g, "").replace(/\s+/g, "_"); }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
