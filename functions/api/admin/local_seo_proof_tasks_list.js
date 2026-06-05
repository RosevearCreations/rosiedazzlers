// Build 179 — list assignable local SEO proof tasks for Analytics/Admin follow-up.
import { requireStaffAccess, json, serviceHeaders, cleanText, methodNotAllowed } from "../_lib/staff-auth.js";

const SELECT = [
  "id", "town", "service", "priority", "status", "task_type", "title", "description",
  "assigned_to_email", "due_at", "source_recommendation", "created_by_staff_user_id",
  "updated_by_staff_user_id", "created_at", "updated_at"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_progress", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: true, table_ready: false, tasks: [], warning: "Supabase env vars are not configured." }));

    const params = new URLSearchParams();
    params.set("select", SELECT);
    params.set("order", "updated_at.desc");
    params.set("limit", String(clampInt(body.limit, 1, 100, 25)));
    const status = cleanText(body.status || "all").toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    const town = cleanText(body.town);
    const service = cleanText(body.service);
    if (status && status !== "all") params.set("status", `eq.${status}`);
    if (town) params.set("town", `ilike.*${escapeLike(town)}*`);
    if (service) params.set("service", `ilike.*${escapeLike(service)}*`);

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/local_seo_proof_tasks?${params.toString()}`, { headers: serviceHeaders(env) });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return withCors(json({ ok: true, table_ready: false, tasks: [], warning: extractSupabaseError(data, text, "Local SEO proof task table is not ready."), migration_hint: "Apply sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql." }));
    return withCors(json({ ok: true, table_ready: true, tasks: Array.isArray(data) ? data : [] }));
  } catch (err) {
    return withCors(json({ ok: true, table_ready: false, tasks: [], warning: err?.message || "Could not load local SEO proof tasks." }));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function clampInt(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback; }
function escapeLike(value) { return String(value || "").replace(/[,*()]/g, " ").trim().slice(0, 80); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0,300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
