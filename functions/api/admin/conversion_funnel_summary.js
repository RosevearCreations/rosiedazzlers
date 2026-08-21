// Build 175 — FAQ/help/lead/quote conversion analytics summary.
import { requireStaffAccess, json, serviceHeaders, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: true, table_ready: false, summary: emptySummary(), warning: "Supabase env vars are not configured; conversion analytics are unavailable." }));
    }

    const days = clampInt(body.days, 1, 365, 30);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [events, leads, drafts, conversions] = await Promise.all([
      loadEvents(env, since).catch(() => []),
      loadRows(env, "public_inquiry_leads", "id,topic,status,source_path,created_at", since).catch(() => []),
      loadRows(env, "quote_proposal_drafts", "id,lead_id,status,source,created_at,updated_at", since, "created_at").catch(() => []),
      loadRows(env, "lead_conversion_drafts", "id,lead_id,status,created_at,updated_at", since, "created_at").catch(() => [])
    ]);

    const summary = summarize({ events, leads, drafts, conversions, since, days });
    return withCors(json({ ok: true, table_ready: true, generated_at: new Date().toISOString(), days, since, summary }));
  } catch (err) {
    return withCors(json({ ok: true, table_ready: false, summary: emptySummary(), warning: err?.message || "Conversion analytics unavailable.", migration_hint: "Apply Build 175 SQL to include lead conversion drafts in analytics." }));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadEvents(env, since) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/site_activity_events?select=event_type,page_path,payload,created_at&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=2000`, { headers: serviceHeaders(env) });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}
async function loadRows(env, table, select, since, dateColumn = "created_at") {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&${dateColumn}=gte.${encodeURIComponent(since)}&order=${dateColumn}.desc&limit=1000`, { headers: serviceHeaders(env) });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}
function summarize({ events, leads, drafts, conversions, since, days }) {
  const pageViews = events.filter((row) => row.event_type === "page_view");
  const faqViews = pageViews.filter((row) => String(row.page_path || "").startsWith("/faq"));
  const helpViews = pageViews.filter((row) => String(row.page_path || "").startsWith("/blog") || String(row.page_path || "").includes("help"));
  const leadEvents = events.filter((row) => /lead|photo_estimate|quote|fleet|maintenance|gift|special/.test(String(row.event_type || "")));
  const quoteEvents = events.filter((row) => /quote|pricing|estimate/.test(String(row.event_type || "")));
  const publicLeads = Array.isArray(leads) ? leads : [];
  const quoteDrafts = Array.isArray(drafts) ? drafts : [];
  const conversionDrafts = Array.isArray(conversions) ? conversions : [];
  return {
    window_days: days,
    since,
    page_views: pageViews.length,
    faq_views: faqViews.length,
    help_views: helpViews.length,
    tracked_lead_events: leadEvents.length,
    tracked_quote_events: quoteEvents.length,
    public_leads: publicLeads.length,
    quote_drafts: quoteDrafts.length,
    lead_conversion_drafts: conversionDrafts.length,
    lead_to_quote_draft_rate: ratio(quoteDrafts.filter((row) => row.lead_id).length, publicLeads.length),
    lead_to_conversion_draft_rate: ratio(conversionDrafts.length, publicLeads.length),
    leads_by_topic: countBy(publicLeads, "topic"),
    leads_by_status: countBy(publicLeads, "status"),
    quote_drafts_by_status: countBy(quoteDrafts, "status"),
    conversion_drafts_by_status: countBy(conversionDrafts, "status"),
    top_entry_pages: countPages(pageViews).slice(0, 12)
  };
}
function emptySummary() { return { page_views: 0, faq_views: 0, help_views: 0, tracked_lead_events: 0, tracked_quote_events: 0, public_leads: 0, quote_drafts: 0, lead_conversion_drafts: 0, leads_by_topic: [], leads_by_status: [], quote_drafts_by_status: [], conversion_drafts_by_status: [], top_entry_pages: [] }; }
function countBy(rows, key) { const map = new Map(); for (const row of rows || []) { const label = String(row?.[key] || "unknown"); map.set(label, (map.get(label) || 0) + 1); } return Array.from(map.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count); }
function countPages(rows) { const map = new Map(); for (const row of rows || []) { const label = String(row.page_path || "/"); map.set(label, (map.get(label) || 0) + 1); } return Array.from(map.entries()).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count); }
function ratio(num, den) { return den > 0 ? Math.round((num / den) * 1000) / 10 : 0; }
function clampInt(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
