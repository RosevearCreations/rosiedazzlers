// Build 179 — public quote/proposal acceptance response endpoint.
import { json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "./_lib/staff-auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const draftId = cleanText(body.draft_id || body.id);
    const token = cleanText(body.token);
    const action = normalizeAction(body.action);
    const note = cleanText(body.note || body.customer_response_note || "").slice(0, 2000);
    if (!draftId || !isUuid(draftId)) return withCors(json({ ok: false, error: "A valid quote draft id is required." }, 400));
    if (!token) return withCors(json({ ok: false, error: "Response token is required." }, 400));
    if (!action) return withCors(json({ ok: false, error: "Choose accepted or declined." }, 400));
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Quote response storage is not configured yet." }, 503));

    const tokenHash = await sha256Hex(token);
    const existing = await loadDraft(env, draftId);
    if (!existing) return withCors(json({ ok: false, error: "Quote/proposal was not found." }, 404));
    if (!existing.acceptance_token_hash || existing.acceptance_token_hash !== tokenHash) return withCors(json({ ok: false, error: "This quote response link is invalid or expired." }, 403));

    const now = new Date().toISOString();
    const patch = {
      acceptance_status: action,
      status: action === "accepted" ? "accepted" : "declined",
      customer_response_note: note || null,
      responded_at: now,
      accepted_at: action === "accepted" ? now : existing.accepted_at || null,
      declined_at: action === "declined" ? now : existing.declined_at || null,
      updated_at: now
    };
    const updated = await patchDraft(env, draftId, patch);
    return withCors(json({ ok: true, action, draft: publicDraft(updated), message: action === "accepted" ? "Thank you. Your quote response has been marked accepted." : "Thank you. Your quote response has been marked declined." }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not save quote response." }, 200));
  }
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
async function loadDraft(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?select=id,title,customer_name,customer_email,acceptance_token_hash,acceptance_status,accepted_at,declined_at&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text(); const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load quote/proposal."));
  return Array.isArray(data) ? data[0] || null : null;
}
async function patchDraft(env, id, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(patch) });
  const text = await res.text(); const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not update quote/proposal response."));
  return Array.isArray(data) ? data[0] || null : data;
}
function normalizeAction(value) { const v = cleanText(value).toLowerCase(); if (["accept", "accepted", "approve", "approved"].includes(v)) return "accepted"; if (["decline", "declined", "reject", "rejected"].includes(v)) return "declined"; return ""; }
function publicDraft(draft) { return draft ? { id: draft.id, title: draft.title || null, customer_name: draft.customer_name || null, acceptance_status: draft.acceptance_status || null, accepted_at: draft.accepted_at || null, declined_at: draft.declined_at || null } : null; }
async function sha256Hex(value) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value || ""))); return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0,300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
