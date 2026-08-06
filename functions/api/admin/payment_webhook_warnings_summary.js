// Build 183 — dashboard warnings for failed/unverified Stripe/PayPal quote-deposit webhook events.
import { requireStaffAccess, json, serviceHeaders, cleanText, methodNotAllowed } from "../_lib/staff-auth.js";

const SELECT = ["id", "provider", "provider_event_id", "provider_event_type", "status", "replay_status", "last_error", "created_at", "updated_at"].join(",");
const PROBLEM_STATUSES = new Set(["failed", "unverified", "replay_failed"]);
const PROBLEM_REPLAY = new Set(["failed", "blocked"]);

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: true, table_ready: false, warning_count: 0, warnings: [], warning: "Supabase env vars are not configured." }));

    const limit = Math.max(10, Math.min(100, Number(body.limit || 50) || 50));
    const params = new URLSearchParams();
    params.set("select", SELECT);
    params.set("order", "updated_at.desc");
    params.set("limit", String(limit));
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_payment_webhook_events?${params.toString()}`, { headers: serviceHeaders(env) });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return withCors(json({ ok: true, table_ready: false, warning_count: 0, warnings: [], warning: extractSupabaseError(data, text, "Could not load webhook warnings."), migration_hint: "Apply Build 182 SQL first." }));
    const rows = Array.isArray(data) ? data : [];
    const warnings = rows.filter((row) => PROBLEM_STATUSES.has(String(row.status || "").toLowerCase()) || PROBLEM_REPLAY.has(String(row.replay_status || "").toLowerCase()));
    const failed = warnings.filter((row) => String(row.status || "").toLowerCase() === "failed" || String(row.replay_status || "").toLowerCase() === "failed").length;
    const unverified = warnings.filter((row) => String(row.status || "").toLowerCase() === "unverified").length;
    const blocked = warnings.filter((row) => String(row.replay_status || "").toLowerCase() === "blocked").length;
    return withCors(json({
      ok: true,
      table_ready: true,
      warning_count: warnings.length,
      failed_count: failed,
      unverified_count: unverified,
      blocked_replay_count: blocked,
      warnings: warnings.slice(0, 20),
      severity: warnings.length ? "attention" : "ok",
      next_step: warnings.length ? "Open Admin Payments, review failed/unverified events, and retry only verified events after checking provider dashboards." : "No failed or unverified webhook events were found in the recent event window."
    }));
  } catch (err) {
    return withCors(json({ ok: true, table_ready: false, warning_count: 0, warnings: [], warning: err?.message || "Could not load webhook warnings." }));
  }
}
export async function onRequestGet(context) { return onRequestPost(context); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPut() { return withCors(methodNotAllowed()); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
