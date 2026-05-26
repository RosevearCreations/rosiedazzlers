// Build 178 — persist final price reconciliation review for a conversion draft.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const ALLOWED_PRICE_STATUS = new Set(["needs_review", "ready_to_book", "overridden", "approved", "blocked"]);

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const id = cleanText(body.conversion_draft_id || body.id);
    if (!id || !isUuid(id)) return withCors(json({ ok: false, error: "conversion_draft_id must be a valid UUID." }, 400));
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Supabase env vars are not configured.", migration_hint: "Apply Build 177 SQL before saving final price reviews." }, 200));

    const review = normalizeReview(body.reconciliation || body.final_price_review || body.review || {});
    const status = normalizePriceStatus(body.final_price_status || body.price_status || (review.ready_to_book ? "ready_to_book" : "needs_review"));
    const patch = {
      final_price_review: review,
      final_price_status: status,
      final_price_total_cents: cents(review.total_cents ?? body.final_price_total_cents ?? body.total_cents),
      final_deposit_cents: cents(review.deposit_cents ?? body.final_deposit_cents ?? body.deposit_cents),
      final_price_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (status === "ready_to_book" || status === "approved") patch.status = "ready_to_book";
    if (access.actor?.id && isUuid(access.actor.id)) patch.updated_by_staff_user_id = access.actor.id;

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(patch)
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return withCors(json({ ok: false, error: extractSupabaseError(data, text, "Could not save final price review."), migration_hint: "Apply sql/2026-05-25_build177_conversion_review_price_local_proof.sql." }, 200));
    const row = Array.isArray(data) ? data[0] || null : data;
    return withCors(json({ ok: true, draft: row, actor: actorSummary(access.actor) }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not save final price review." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

function normalizeReview(value) {
  const review = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    ...review,
    saved_by: "admin_conversions_build178",
    saved_at: new Date().toISOString()
  };
}
function normalizePriceStatus(value) { const status = String(value || "needs_review").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_"); return ALLOWED_PRICE_STATUS.has(status) ? status : "needs_review"; }
function cents(value) { const n = Number(value); return Number.isFinite(n) && n >= 0 ? Math.round(n) : null; }
function actorSummary(actor) { return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
