// Build 390 — public quote/proposal acceptance with immutable structured commercial terms and explicit continuity state.
import { json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "./_lib/staff-auth.js";
import { hashStructuredQuoteTerms, validateStructuredQuoteTerms } from "./_lib/quote-booking-terms.js";
import { acceptedQuoteContinuity } from "./_lib/commercial-continuity.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const draftId = cleanText(body.draft_id || body.id);
    const token = cleanText(body.token);
    const action = normalizeAction(body.action);
    const note = cleanText(body.note || body.customer_response_note || "").slice(0, 2000);
    if (!draftId || !isUuid(draftId)) return fail("QUOTE_ID_REQUIRED", "A valid quote draft id is required.", 400);
    if (!token) return fail("QUOTE_RESPONSE_TOKEN_REQUIRED", "Response token is required.", 400);
    if (!action) return fail("QUOTE_RESPONSE_ACTION_REQUIRED", "Choose accepted or declined.", 400);
    if (!hasSupabaseConfig(env)) return fail("SERVER_CONFIGURATION_INCOMPLETE", "Quote response storage is not configured yet.", 503);

    const tokenHash = await sha256Hex(token);
    const existing = await loadDraft(env, draftId);
    if (!existing) return fail("QUOTE_NOT_FOUND", "Quote/proposal was not found.", 404);
    if (!existing.acceptance_token_hash || existing.acceptance_token_hash !== tokenHash) {
      return fail("QUOTE_RESPONSE_TOKEN_INVALID", "This quote response link is invalid or expired.", 403);
    }

    const now = new Date().toISOString();
    if (action === "accepted") {
      const checked = validateStructuredQuoteTerms(existing.structured_terms);
      if (!checked.ok) return fail(checked.code, checked.error, checked.code === "QUOTE_EXPIRED" ? 410 : 409);
      if (!existing.structured_terms_hash) return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "This quote is missing its structured terms hash. Ask Rosie Dazzlers to resend the quote.", 409);
      const actualHash = await hashStructuredQuoteTerms(checked.terms);
      if (actualHash !== existing.structured_terms_hash) return fail("QUOTE_TERMS_HASH_MISMATCH", "This quote's structured terms no longer match the delivered version. Ask Rosie Dazzlers to resend it.", 409);

      if (existing.acceptance_status === "accepted" && existing.accepted_terms && existing.accepted_terms_hash) {
        const acceptedCheck = validateStructuredQuoteTerms(existing.accepted_terms);
        const acceptedHash = acceptedCheck.ok ? await hashStructuredQuoteTerms(acceptedCheck.terms) : "";
        if (acceptedCheck.ok && acceptedHash === existing.accepted_terms_hash && existing.accepted_terms_hash === existing.structured_terms_hash) {
          return withCors(json({ ok: true, code: "QUOTE_ALREADY_ACCEPTED", replay: true, action: "accepted", draft: publicDraft(existing), commercial_continuity: acceptedQuoteContinuity(), message: "This quote was already accepted. Acceptance is not a booking confirmation." }));
        }
        return fail("QUOTE_ACCEPTED_TERMS_CONFLICT", "This quote already has a different accepted commercial snapshot. Ask Rosie Dazzlers to review it before booking.", 409);
      }

      const patch = {
        acceptance_status: "accepted",
        status: "accepted",
        customer_response_note: note || null,
        responded_at: now,
        accepted_at: now,
        declined_at: null,
        accepted_terms: checked.terms,
        accepted_terms_hash: existing.structured_terms_hash,
        accepted_terms_at: now,
        updated_at: now
      };
      const updated = await patchDraft(env, draftId, patch);
      return withCors(json({ ok: true, code: "QUOTE_ACCEPTED", replay: false, action: "accepted", draft: publicDraft(updated), commercial_continuity: acceptedQuoteContinuity(), message: "Thank you. Your quote has been accepted. Availability, deposit/payment and final appointment confirmation are verified separately." }));
    }

    if (existing.acceptance_status === "declined") {
      return withCors(json({ ok: true, code: "QUOTE_ALREADY_DECLINED", replay: true, action: "declined", draft: publicDraft(existing), message: "This quote was already declined." }));
    }
    if (existing.acceptance_status === "accepted") {
      return fail("QUOTE_ALREADY_ACCEPTED", "An accepted quote cannot be changed to declined from the same response link. Contact Rosie Dazzlers if the request has changed.", 409);
    }

    const updated = await patchDraft(env, draftId, {
      acceptance_status: "declined",
      status: "declined",
      customer_response_note: note || null,
      responded_at: now,
      declined_at: now,
      accepted_at: null,
      accepted_terms: null,
      accepted_terms_hash: null,
      accepted_terms_at: null,
      updated_at: now
    });
    return withCors(json({ ok: true, code: "QUOTE_DECLINED", replay: false, action: "declined", draft: publicDraft(updated), message: "Thank you. Your quote response has been marked declined." }));
  } catch (err) {
    return fail("QUOTE_RESPONSE_SAVE_FAILED", err?.message || "Could not save quote response.", 500);
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadDraft(env, id) {
  const select = [
    "id", "title", "customer_name", "customer_email", "acceptance_token_hash", "acceptance_status",
    "structured_terms", "structured_terms_hash", "terms_expires_at", "accepted_terms", "accepted_terms_hash", "accepted_terms_at",
    "accepted_at", "declined_at", "responded_at"
  ].join(",");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?select=${encodeURIComponent(select)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
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
function publicDraft(draft) { return draft ? { id: draft.id, title: draft.title || null, customer_name: draft.customer_name || null, acceptance_status: draft.acceptance_status || null, accepted_at: draft.accepted_at || null, declined_at: draft.declined_at || null, terms_expires_at: draft.terms_expires_at || draft.structured_terms?.expires_at || null } : null; }
async function sha256Hex(value) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value || ""))); return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""); }
function fail(code, error, status, extra = {}) { return withCors(json({ ok: false, code, error, ...extra }, status)); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
