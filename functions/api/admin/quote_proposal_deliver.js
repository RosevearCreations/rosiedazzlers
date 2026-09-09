// Build 362 — deliver a customer quote only after current catalog terms are reviewed and frozen.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { dispatchNotificationThroughProvider } from "./_lib/provider-dispatch.js";
import { loadEditableSetting } from "../_lib/editable-settings.js";
import { resolveCurrentQuotePrice } from "../_lib/quote-booking-authority.js";
import { hashStructuredQuoteTerms, normalizeAddonCodes } from "../_lib/quote-booking-terms.js";

const DRAFT_SELECT = [
  "id", "lead_id", "booking_id", "title", "status", "body", "pricing_note", "internal_note", "customer_name", "customer_email",
  "follow_up_at", "sent_at", "delivery_status", "acceptance_status", "created_at", "updated_at"
].join(",");
const CONVERSION_SELECT = [
  "id", "quote_proposal_draft_id", "status", "proposed_package_code", "proposed_vehicle_size", "proposed_booking",
  "final_price_review", "final_price_status", "final_price_total_cents", "final_deposit_cents", "final_price_reviewed_at", "updated_at"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return fail("SERVER_CONFIGURATION_INCOMPLETE", "Supabase service configuration is incomplete.", 500);

    const draftId = cleanText(body.draft_id || body.id);
    if (!draftId || !isUuid(draftId)) return fail("QUOTE_ID_REQUIRED", "draft_id must be a valid UUID.", 400);
    const draft = await loadDraft(env, draftId);
    if (!draft) return fail("QUOTE_NOT_FOUND", "Quote/proposal draft was not found.", 404);

    const conversion = await loadReviewedConversion(env, draft.id);
    if (!conversion) return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "Create and review a Conversion Queue draft for this quote before delivery.", 409);
    if (!["ready_to_book", "approved"].includes(String(conversion.final_price_status || ""))) {
      return fail("QUOTE_PRICE_REVIEW_REQUIRED", "Reconcile and save the current price in the Conversion Queue before delivering this quote.", 409);
    }

    const proposed = conversion.proposed_booking && typeof conversion.proposed_booking === "object" ? conversion.proposed_booking : {};
    const review = conversion.final_price_review && typeof conversion.final_price_review === "object" ? conversion.final_price_review : {};
    const packageCode = cleanText(review.package?.code || review.package_code || conversion.proposed_package_code || proposed.package_code);
    const vehicleSize = cleanText(review.vehicle_size_used || review.vehicle_size || conversion.proposed_vehicle_size || proposed.vehicle_size);
    const addonCodes = normalizeAddonCodes(review.addon_codes || review.addons?.map((row) => typeof row === "string" ? row : row?.code) || proposed.addons);
    const current = await resolveCurrentQuotePrice(env, { package_code: packageCode, vehicle_size: vehicleSize, addon_codes: addonCodes });
    if (!current.ok) return fail(current.code || "QUOTE_PRICE_REVALIDATION_FAILED", current.error || "Current pricing could not be validated.", 409);
    if (Number(conversion.final_price_total_cents) !== current.total_cents || Number(conversion.final_deposit_cents) !== current.deposit_cents) {
      return fail("QUOTE_PRICE_CHANGED", "The saved price review no longer matches the current catalog. Reconcile and save the quote again before delivery.", 409, {
        saved_total_cents: conversion.final_price_total_cents,
        current_total_cents: current.total_cents,
        saved_deposit_cents: conversion.final_deposit_cents,
        current_deposit_cents: current.deposit_cents
      });
    }

    const expiresAt = normalizeFutureIso(body.expires_at || body.terms_expires_at || draft.follow_up_at);
    if (!expiresAt) return fail("QUOTE_EXPIRY_REQUIRED", "Set an explicit future quote expiry (expires_at) before delivery. No default validity period is assumed.", 400);

    const terms = {
      version: 1,
      package_code: current.package_code,
      vehicle_size: current.vehicle_size,
      addon_codes: current.addon_codes,
      total_cents: current.total_cents,
      deposit_cents: current.deposit_cents,
      expires_at: expiresAt,
      currency: "CAD"
    };
    const termsHash = await hashStructuredQuoteTerms(terms);
    const recipient = cleanEmailLoose(body.recipient_email || draft.customer_email);
    if (!recipient) return fail("QUOTE_RECIPIENT_REQUIRED", "A valid customer email is required before preparing quote delivery.", 400);

    const origin = siteOrigin(request, env);
    const template = await loadDocumentTemplate(env, "quote_proposal");
    const rawToken = makeToken();
    const tokenHash = await sha256Hex(rawToken);
    const acceptanceUrl = `${origin}/quote-response.html?draft_id=${encodeURIComponent(draft.id)}&token=${encodeURIComponent(rawToken)}`;
    const subject = cleanText(body.subject || template.subject || draft.title || "Your Rosie Dazzlers quote") || "Your Rosie Dazzlers quote";
    const message = cleanText(body.message || template.body || "Please review the quote details below. Use the secure response link to accept or decline so we can keep your request moving.");
    const bodyText = buildQuoteEmailText({ draft, message, acceptanceUrl, terms, current });
    const bodyHtml = buildQuoteEmailHtml({ draft, message, acceptanceUrl, terms, current });

    const event = {
      event_type: "quote_proposal_delivery", channel: "email", recipient_email: recipient, subject, body_text: bodyText, body_html: bodyHtml,
      payload: { quote_proposal_draft_id: draft.id, lead_id: draft.lead_id || null, booking_id: draft.booking_id || null, acceptance_url: acceptanceUrl, terms_expires_at: expiresAt, build: 362 }
    };
    const dispatch = body.preview_only === true ? { ok: false, preview_only: true, error: "Preview only; no email attempted." } : await dispatchNotificationThroughProvider(env, event, {});
    const now = new Date().toISOString();
    const patch = {
      status: dispatch.ok ? "sent" : (draft.status === "draft" ? "ready_to_send" : draft.status || "ready_to_send"),
      delivery_status: dispatch.ok ? "sent" : "prepared",
      delivery_to_email: recipient,
      delivery_subject: subject,
      delivery_message: message,
      acceptance_token_hash: tokenHash,
      acceptance_status: "awaiting_response",
      customer_response_note: null,
      structured_terms: terms,
      structured_terms_hash: termsHash,
      structured_terms_created_at: now,
      terms_expires_at: expiresAt,
      accepted_terms: null,
      accepted_terms_hash: null,
      accepted_terms_at: null,
      accepted_at: null,
      declined_at: null,
      responded_at: null,
      delivered_at: dispatch.ok ? now : null,
      sent_at: dispatch.ok ? now : draft.sent_at || null,
      updated_at: now
    };
    if (access.actor?.id && isUuid(access.actor.id)) patch.updated_by_staff_user_id = access.actor.id;
    const updated = await patchDraft(env, draft.id, patch);

    return withCors(json({
      ok: true,
      code: dispatch.ok ? "QUOTE_SENT" : "QUOTE_PREPARED",
      email_sent: !!dispatch.ok,
      provider_result: dispatch.ok ? { ok: true, provider: dispatch.provider || "email" } : { ok: false, provider: dispatch.provider || "email", error: dispatch.error || "Email provider not configured; delivery was prepared for manual send." },
      draft: updated,
      structured_terms: terms,
      acceptance_url: acceptanceUrl,
      customer_message: bodyText,
      message: dispatch.ok ? "Quote/proposal email sent with frozen structured terms." : "Quote/proposal delivery was prepared with frozen structured terms."
    }));
  } catch (err) {
    return fail("QUOTE_DELIVERY_FAILED", err?.message || "Could not prepare quote/proposal delivery.", 500, { migration_hint: "Apply sql/2026-09-09_build362_quote_booking_acceptance.sql after the earlier quote migrations." });
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadDraft(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?select=${encodeURIComponent(DRAFT_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text(); const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load quote/proposal draft."));
  return Array.isArray(data) ? data[0] || null : null;
}
async function loadReviewedConversion(env, quoteId) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?select=${encodeURIComponent(CONVERSION_SELECT)}&quote_proposal_draft_id=eq.${encodeURIComponent(quoteId)}&order=updated_at.desc&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text(); const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load quote conversion review."));
  return Array.isArray(data) ? data[0] || null : null;
}
async function patchDraft(env, id, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(patch) });
  const text = await res.text(); const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not update quote/proposal delivery tracking."));
  return Array.isArray(data) ? data[0] || null : data;
}
function buildQuoteEmailText({ draft, message, acceptanceUrl, terms, current }) {
  return [
    `Hi ${draft.customer_name || "there"},`, "", message, "", "Quote/proposal details:", draft.body || "Quote details are attached in your Rosie Dazzlers request.",
    draft.pricing_note ? `\nPricing note:\n${draft.pricing_note}` : "", "",
    `Structured price: ${money(current.total_cents)} • Deposit: ${money(current.deposit_cents)}`,
    `Quote valid until: ${terms.expires_at}`, "", `Review/respond here: ${acceptanceUrl}`, "", "Thank you,", "Rosie Dazzlers Mobile Auto Detailing"
  ].filter(Boolean).join("\n");
}
function buildQuoteEmailHtml({ draft, message, acceptanceUrl, terms, current }) {
  return `<p>Hi ${escapeHtml(draft.customer_name || "there")},</p><p>${escapeHtml(message)}</p><h2>Quote/proposal details</h2><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(draft.body || "Quote details are attached in your Rosie Dazzlers request.")}</pre>${draft.pricing_note ? `<h3>Pricing note</h3><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(draft.pricing_note)}</pre>` : ""}<p><strong>Structured price:</strong> ${escapeHtml(money(current.total_cents))}<br><strong>Deposit:</strong> ${escapeHtml(money(current.deposit_cents))}<br><strong>Valid until:</strong> ${escapeHtml(terms.expires_at)}</p><p><a href="${escapeHtml(acceptanceUrl)}">Review, accept, or decline this quote</a></p><p>Thank you,<br>Rosie Dazzlers Mobile Auto Detailing</p>`;
}
async function loadDocumentTemplate(env, key) { const loaded = await loadEditableSetting(env, "document_templates", { headers: serviceHeaders(env) }).catch(() => null); const template = loaded?.value?.templates?.[key] || {}; return template && typeof template === "object" ? template : {}; }
function normalizeFutureIso(value) { const text = cleanText(value); if (!text) return null; const parsed = Date.parse(text); return Number.isFinite(parsed) && parsed > Date.now() ? new Date(parsed).toISOString() : null; }
function siteOrigin(request, env) { const configured = cleanText(env?.SITE_ORIGIN || env?.PUBLIC_SITE_ORIGIN); if (configured) return configured.replace(/\/+$/, ""); const url = new URL(request.url); return `${url.protocol}//${url.host}`; }
function makeToken() { if (crypto.randomUUID) return `${crypto.randomUUID()}-${crypto.randomUUID()}`; const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""); }
async function sha256Hex(value) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value || ""))); return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""); }
function cleanEmailLoose(value) { const text = cleanText(value); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text.toLowerCase().slice(0, 240) : null; }
function money(cents) { return `$${(Number(cents || 0) / 100).toFixed(2)} CAD`; }
function escapeHtml(value) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }
function fail(code, error, status, extra = {}) { return withCors(json({ ok: false, code, error, ...extra }, status)); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
