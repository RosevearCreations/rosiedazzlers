// Build 174 — save persistent quote/proposal drafts from Admin Leads.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const ALLOWED_STATUS = new Set(["draft", "needs_review", "ready_to_send", "sent", "accepted", "declined", "archived"]);

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({
        ok: false,
        table_ready: false,
        error: "Server configuration is incomplete. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY.",
        migration_hint: "Apply sql/2026-05-24_build174_quote_proposal_drafts.sql before saving quote drafts."
      }, 500));
    }

    const payload = normalizePayload(body, access.actor);
    if (!payload.lead_id && !payload.booking_id) {
      return withCors(json({ ok: false, error: "A lead id or booking id is required before saving a quote draft." }, 400));
    }
    if (!payload.title || !payload.body) {
      return withCors(json({ ok: false, error: "Quote draft title and body are required." }, 400));
    }

    const id = cleanText(body.id);
    if (id && !isUuid(id)) return withCors(json({ ok: false, error: "Invalid quote draft id." }, 400));

    const result = id
      ? await updateDraft(env, id, payload)
      : await createDraft(env, payload);

    return withCors(json({
      ok: true,
      table_ready: true,
      created: !id,
      draft: result,
      actor: actorSummary(access.actor)
    }));
  } catch (err) {
    return withCors(json({
      ok: false,
      table_ready: false,
      error: err?.message || "Could not save quote/proposal draft.",
      migration_hint: "Apply sql/2026-05-24_build174_quote_proposal_drafts.sql before saving quote drafts from Admin Leads."
    }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

export async function onRequestPut() {
  return withCors(methodNotAllowed());
}

async function createDraft(env, payload) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts`, {
    method: "POST",
    headers: {
      ...serviceHeaders(env),
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(payload)
  });
  return parseWriteResponse(res, "Could not create quote/proposal draft.");
}

async function updateDraft(env, id, payload) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      ...serviceHeaders(env),
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(payload)
  });
  return parseWriteResponse(res, "Could not update quote/proposal draft.");
}

async function parseWriteResponse(res, fallback) {
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, fallback));
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

function normalizePayload(body, actor) {
  const status = normalizeStatus(body.status);
  const payload = {
    title: cleanText(body.title)?.slice(0, 180) || "Rosie Dazzlers quote draft",
    status,
    body: cleanText(body.body)?.slice(0, 12000) || "",
    pricing_note: nullableText(body.pricing_note, 2500),
    internal_note: nullableText(body.internal_note, 2500),
    customer_email: cleanEmailLoose(body.customer_email),
    customer_name: nullableText(body.customer_name, 180),
    source: nullableText(body.source, 80) || "admin_leads",
    updated_at: new Date().toISOString()
  };

  const leadId = cleanText(body.lead_id);
  const bookingId = cleanText(body.booking_id);
  if (leadId && isUuid(leadId)) payload.lead_id = leadId;
  if (bookingId && isUuid(bookingId)) payload.booking_id = bookingId;

  const followUpAt = normalizeIso(body.follow_up_at);
  if (followUpAt) payload.follow_up_at = followUpAt;

  if (status === "sent" && !body.sent_at) payload.sent_at = new Date().toISOString();
  const sentAt = normalizeIso(body.sent_at);
  if (sentAt) payload.sent_at = sentAt;

  if (actor?.id && isUuid(actor.id)) payload.updated_by_staff_user_id = actor.id;
  if (!body.id && actor?.id && isUuid(actor.id)) payload.created_by_staff_user_id = actor.id;
  return payload;
}

function normalizeStatus(value) {
  const status = String(value || "draft").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  return ALLOWED_STATUS.has(status) ? status : "draft";
}

function nullableText(value, max) {
  const text = cleanText(value);
  return text ? text.slice(0, max || 500) : null;
}

function cleanEmailLoose(value) {
  const text = cleanText(value);
  if (!text) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text.toLowerCase().slice(0, 240) : null;
}

function normalizeIso(value) {
  const text = cleanText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function actorSummary(actor) {
  return actor ? {
    id: actor.id || null,
    full_name: actor.full_name || null,
    email: actor.email || null,
    role_code: actor.role_code || null
  } : null;
}

function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && getSupabaseServiceRoleKey(env));
}

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function extractSupabaseError(data, text, fallback) {
  if (data && data.message) return data.message;
  if (typeof text === "string" && text.trim()) return text.slice(0, 300);
  return fallback;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
