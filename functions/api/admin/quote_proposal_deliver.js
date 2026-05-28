// Build 179 — prepare/send customer-facing quote/proposal delivery and acceptance link.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { dispatchNotificationThroughProvider } from "./_lib/provider-dispatch.js";

const DRAFT_SELECT = [
  "id", "lead_id", "booking_id", "title", "status", "body", "pricing_note", "internal_note",
  "customer_name", "customer_email", "delivery_status", "acceptance_status", "created_at", "updated_at"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const draftId = cleanText(body.draft_id || body.id);
    if (!draftId || !isUuid(draftId)) return withCors(json({ ok: false, error: "draft_id must be a valid UUID." }, 400));
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Supabase env vars are not configured.", migration_hint: "Apply Build 174 and Build 179 SQL before delivering quote proposals." }, 200));

    const draft = await loadDraft(env, draftId);
    if (!draft) return withCors(json({ ok: false, error: "Quote/proposal draft was not found." }, 404));

    const recipient = cleanEmailLoose(body.recipient_email || draft.customer_email);
    if (!recipient) return withCors(json({ ok: false, error: "A valid customer email is required before preparing quote delivery." }, 400));

    const origin = siteOrigin(request, env);
    const rawToken = makeToken();
    const tokenHash = await sha256Hex(rawToken);
    const acceptanceUrl = `${origin}/quote-response.html?draft_id=${encodeURIComponent(draft.id)}&token=${encodeURIComponent(rawToken)}`;
    const subject = cleanText(body.subject || draft.title || "Your Rosie Dazzlers quote") || "Your Rosie Dazzlers quote";
    const message = cleanText(body.message || "Please review the quote details below. Use the secure response link to accept or decline so we can keep your request moving.");
    const bodyText = buildQuoteEmailText({ draft, message, acceptanceUrl });
    const bodyHtml = buildQuoteEmailHtml({ draft, message, acceptanceUrl });

    const event = {
      event_type: "quote_proposal_delivery",
      channel: "email",
      recipient_email: recipient,
      subject,
      body_text: bodyText,
      body_html: bodyHtml,
      payload: { quote_proposal_draft_id: draft.id, lead_id: draft.lead_id || null, booking_id: draft.booking_id || null, acceptance_url: acceptanceUrl }
    };

    const dispatch = body.preview_only === true ? { ok: false, preview_only: true, error: "Preview only; no email attempted." } : await dispatchNotificationThroughProvider(env, event, {});
    const deliveryStatus = dispatch.ok ? "sent" : "prepared";
    const patch = {
      status: dispatch.ok ? "sent" : (draft.status === "draft" ? "ready_to_send" : draft.status || "ready_to_send"),
      delivery_status: deliveryStatus,
      delivery_to_email: recipient,
      delivery_subject: subject,
      delivery_message: message,
      acceptance_token_hash: tokenHash,
      acceptance_status: "awaiting_response",
      customer_response_note: null,
      delivered_at: dispatch.ok ? new Date().toISOString() : null,
      sent_at: dispatch.ok ? new Date().toISOString() : draft.sent_at || null,
      updated_at: new Date().toISOString()
    };
    if (access.actor?.id && isUuid(access.actor.id)) patch.updated_by_staff_user_id = access.actor.id;

    const updated = await patchDraft(env, draft.id, patch);
    return withCors(json({
      ok: true,
      email_sent: !!dispatch.ok,
      provider_result: dispatch.ok ? { ok: true, provider: dispatch.provider || "email" } : { ok: false, provider: dispatch.provider || "email", error: dispatch.error || "Email provider not configured; delivery was prepared for manual send." },
      draft: updated,
      acceptance_url: acceptanceUrl,
      customer_message: bodyText,
      message: dispatch.ok ? "Quote/proposal email sent and acceptance link created." : "Quote/proposal delivery was prepared. Copy/send manually or configure NOTIFICATIONS_EMAIL_WEBHOOK_URL."
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not prepare quote/proposal delivery.", migration_hint: "Apply sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql before using quote delivery tracking." }, 200));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadDraft(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?select=${encodeURIComponent(DRAFT_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load quote/proposal draft."));
  return Array.isArray(data) ? data[0] || null : null;
}
async function patchDraft(env, id, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(patch)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not update quote/proposal delivery tracking."));
  return Array.isArray(data) ? data[0] || null : data;
}
function buildQuoteEmailText({ draft, message, acceptanceUrl }) {
  const lines = [
    `Hi ${draft.customer_name || "there"},`,
    "",
    message,
    "",
    "Quote/proposal details:",
    draft.body || "Quote details are attached in your Rosie Dazzlers request.",
    draft.pricing_note ? `\nPricing note:\n${draft.pricing_note}` : "",
    "",
    `Review/respond here: ${acceptanceUrl}`,
    "",
    "Thank you,",
    "Rosie Dazzlers Mobile Auto Detailing"
  ];
  return lines.filter((line) => line !== null && line !== undefined).join("\n");
}
function buildQuoteEmailHtml({ draft, message, acceptanceUrl }) {
  return `<p>Hi ${escapeHtml(draft.customer_name || "there")},</p><p>${escapeHtml(message)}</p><h2>Quote/proposal details</h2><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(draft.body || "Quote details are attached in your Rosie Dazzlers request.")}</pre>${draft.pricing_note ? `<h3>Pricing note</h3><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(draft.pricing_note)}</pre>` : ""}<p><a href="${escapeHtml(acceptanceUrl)}">Review, accept, or decline this quote</a></p><p>Thank you,<br>Rosie Dazzlers Mobile Auto Detailing</p>`;
}
function siteOrigin(request, env) { const configured = cleanText(env?.SITE_ORIGIN || env?.PUBLIC_SITE_ORIGIN); if (configured) return configured.replace(/\/+$/, ""); const url = new URL(request.url); return `${url.protocol}//${url.host}`; }
function makeToken() { if (crypto.randomUUID) return `${crypto.randomUUID()}-${crypto.randomUUID()}`; const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""); }
async function sha256Hex(value) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value || ""))); return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""); }
function cleanEmailLoose(value) { const text = cleanText(value); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text.toLowerCase().slice(0,240) : null; }
function escapeHtml(value) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0,300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
