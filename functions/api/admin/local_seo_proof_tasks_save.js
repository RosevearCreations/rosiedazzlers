// Build 179 — create/update assignable local SEO proof tasks from proof recommendations.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const ALLOWED_STATUS = new Set(["needs_media", "assigned", "in_progress", "ready_for_review", "approved_public", "closed", "archived"]);
const ALLOWED_PRIORITY = new Set(["high", "medium", "low", "maintenance"]);

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_progress", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({
        ok: false,
        table_ready: false,
        error: "Supabase env vars are not configured.",
        migration_hint: "Apply sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql before saving local proof tasks."
      }, 200));
    }

    const id = cleanText(body.id || body.task_id);
    if (id && !isUuid(id)) return withCors(json({ ok: false, error: "task id must be a valid UUID." }, 400));

    const rec = body.recommendation && typeof body.recommendation === "object" ? body.recommendation : {};
    const town = cleanText(body.town || rec.town || "").slice(0, 120);
    const service = cleanText(body.service || rec.service || "").slice(0, 160);
    const priority = normalizePriority(body.priority || rec.priority);
    const status = normalizeStatus(body.status);
    const title = cleanText(body.title || `${town || "Local"} ${service || "detailing"} proof task`).slice(0, 220);
    const description = cleanText(body.description || rec.recommendation || "Create or approve privacy-ready proof media, then link it from the related service/town page.").slice(0, 3000);

    if (!town && !service && !title) return withCors(json({ ok: false, error: "Town, service, or title is required." }, 400));

    const payload = {
      town: town || null,
      service: service || null,
      priority,
      status,
      task_type: cleanText(body.task_type || "gallery_proof").slice(0, 80),
      title: title || "Local proof task",
      description,
      source_recommendation: rec && Object.keys(rec).length ? rec : null,
      assigned_to_email: cleanEmailLoose(body.assigned_to_email),
      due_at: normalizeIso(body.due_at),
      updated_at: new Date().toISOString()
    };
    if (access.actor?.id && isUuid(access.actor.id)) payload.updated_by_staff_user_id = access.actor.id;
    if (!id && access.actor?.id && isUuid(access.actor.id)) payload.created_by_staff_user_id = access.actor.id;

    const result = id ? await updateTask(env, id, payload) : await createTask(env, payload);
    return withCors(json({ ok: true, table_ready: true, task: result, actor: actorSummary(access.actor) }));
  } catch (err) {
    return withCors(json({
      ok: false,
      table_ready: false,
      error: err?.message || "Could not save local SEO proof task.",
      migration_hint: "Apply sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql before assigning proof tasks."
    }, 200));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function createTask(env, payload) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/local_seo_proof_tasks`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
  return parseWrite(res, "Could not create local SEO proof task.");
}
async function updateTask(env, id, payload) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/local_seo_proof_tasks?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
  return parseWrite(res, "Could not update local SEO proof task.");
}
async function parseWrite(res, fallback) {
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, fallback));
  return Array.isArray(data) ? data[0] || null : data;
}
function normalizeStatus(value) { const v = cleanText(value || "needs_media").toLowerCase().replace(/[^a-z0-9_]+/g, "_"); return ALLOWED_STATUS.has(v) ? v : "needs_media"; }
function normalizePriority(value) { const v = cleanText(value || "high").toLowerCase().replace(/[^a-z0-9_]+/g, "_"); return ALLOWED_PRIORITY.has(v) ? v : "high"; }
function cleanEmailLoose(value) { const text = cleanText(value); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text.toLowerCase().slice(0,240) : null; }
function normalizeIso(value) { const text = cleanText(value); if (!text) return null; const d = new Date(text); return Number.isNaN(d.getTime()) ? null : d.toISOString(); }
function actorSummary(actor) { return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0,300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
