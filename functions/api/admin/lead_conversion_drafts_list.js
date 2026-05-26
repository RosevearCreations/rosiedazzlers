// Build 176 — list reviewable lead conversion drafts for Admin Leads.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const SELECT = [
  "id",
  "lead_id",
  "quote_proposal_draft_id",
  "converted_booking_id",
  "converted_at",
  "status",
  "customer_name",
  "customer_email",
  "customer_phone",
  "service_area",
  "vehicle_count",
  "preferred_cadence",
  "proposed_package_code",
  "proposed_vehicle_size",
  "proposed_booking",
  "proposed_quote",
  "internal_note",
  "next_action",
  "created_at",
  "updated_at"
];

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: true, table_ready: false, drafts: [], warning: "Supabase env vars are not configured.", migration_hint: "Apply Build 175 SQL, then Build 176 SQL before loading conversion drafts." }));
    }

    const leadId = cleanText(body.lead_id || body.id);
    if (leadId && !isUuid(leadId)) return withCors(json({ ok: false, error: "lead_id must be a valid UUID." }, 400));
    const status = normalizeStatus(body.status || "all");
    const limit = clampInt(body.limit, 1, 100, 20);

    const params = [
      `select=${encodeURIComponent(SELECT.join(","))}`,
      `order=${encodeURIComponent("updated_at.desc")}`,
      `limit=${limit}`
    ];
    if (leadId) params.push(`lead_id=eq.${encodeURIComponent(leadId)}`);
    if (status !== "all") params.push(`status=eq.${encodeURIComponent(status)}`);

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?${params.join("&")}`, { headers: serviceHeaders(env) });
    const text = await res.text();
    const data = safeJson(text);

    if (!res.ok) {
      return withCors(json({ ok: true, table_ready: false, drafts: [], warning: extractSupabaseError(data, text, "Could not load conversion drafts."), migration_hint: "Apply sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql and sql/2026-05-25_build176_conversion_to_booking_dashboard_privacy.sql." }));
    }

    return withCors(json({ ok: true, table_ready: true, drafts: Array.isArray(data) ? data : [], actor: actorSummary(access.actor) }));
  } catch (err) {
    return withCors(json({ ok: true, table_ready: false, drafts: [], warning: err?.message || "Could not load conversion drafts.", migration_hint: "Apply Build 175/176 SQL before using reviewed conversion drafts." }));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

function normalizeStatus(value) { const status = String(value || "all").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_"); return new Set(["all", "draft_booking", "needs_review", "ready_to_book", "converted", "closed"]).has(status) ? status : "all"; }
function clampInt(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback; }
function actorSummary(actor) { return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
