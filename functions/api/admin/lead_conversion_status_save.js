// Build 178 — save conversion draft status without creating a booking.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const ALLOWED_STATUS = new Set(["draft_booking", "needs_review", "ready_to_book", "converted", "closed"]);

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const id = cleanText(body.conversion_draft_id || body.id);
    if (!id || !isUuid(id)) return withCors(json({ ok: false, error: "conversion_draft_id must be a valid UUID." }, 400));
    const status = normalizeStatus(body.status);
    if (!ALLOWED_STATUS.has(status)) return withCors(json({ ok: false, error: "Status must be draft_booking, needs_review, ready_to_book, converted, or closed." }, 400));
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Supabase env vars are not configured.", migration_hint: "Apply Build 175+ SQL and confirm SUPABASE_URL plus service role key." }, 200));

    const patch = {
      status,
      updated_at: new Date().toISOString(),
      next_action: cleanText(body.next_action || ""),
      internal_note: cleanText(body.internal_note || body.status_note || "")
    };
    if (access.actor?.id && isUuid(access.actor.id)) patch.updated_by_staff_user_id = access.actor.id;

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(patch)
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return withCors(json({ ok: false, error: extractSupabaseError(data, text, "Could not save conversion status."), migration_hint: "Apply Build 175+ conversion draft SQL." }, 200));
    const row = Array.isArray(data) ? data[0] || null : data;
    return withCors(json({ ok: true, draft: row, actor: actorSummary(access.actor) }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not save conversion status." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

function normalizeStatus(value) { return String(value || "needs_review").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_"); }
function actorSummary(actor) { return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
