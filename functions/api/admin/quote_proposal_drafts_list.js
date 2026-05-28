// Build 179 — list quote/proposal drafts with delivery and acceptance tracking for Admin Leads.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const DRAFT_SELECT = [
  "id",
  "lead_id",
  "booking_id",
  "title",
  "status",
  "body",
  "pricing_note",
  "internal_note",
  "customer_name",
  "customer_email",
  "source",
  "follow_up_at",
  "sent_at",
  "delivery_status",
  "delivery_to_email",
  "delivery_subject",
  "delivered_at",
  "acceptance_status",
  "accepted_at",
  "declined_at",
  "responded_at",
  "customer_response_note",
  "created_by_staff_user_id",
  "updated_by_staff_user_id",
  "created_at",
  "updated_at"
].join(",");

export async function onRequestGet(context) {
  return onRequestPost(context);
}

export async function onRequestPost({ request, env }) {
  try {
    const body = request.method === "GET" ? queryBody(request) : await request.json().catch(() => ({}));
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
        ok: true,
        table_ready: false,
        drafts: [],
        warning: "Server configuration is incomplete. Quote/proposal drafts cannot load yet.",
        migration_hint: "Apply sql/2026-05-24_build174_quote_proposal_drafts.sql and confirm Supabase service env vars."
      }));
    }

    const drafts = await loadDrafts(env, body);
    return withCors(json({ ok: true, table_ready: true, drafts }));
  } catch (err) {
    return withCors(json({
      ok: true,
      table_ready: false,
      drafts: [],
      warning: err?.message || "Quote/proposal draft table is not ready.",
      migration_hint: "Apply sql/2026-05-24_build174_quote_proposal_drafts.sql before using persistent quote drafts."
    }));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPut() {
  return withCors(methodNotAllowed());
}

async function loadDrafts(env, body) {
  const params = new URLSearchParams();
  params.set("select", DRAFT_SELECT);
  params.set("order", "updated_at.desc");
  params.set("limit", String(clampInt(body.limit, 1, 100, 25)));

  const id = cleanText(body.id);
  const leadId = cleanText(body.lead_id);
  const bookingId = cleanText(body.booking_id);
  const status = normalizeStatusFilter(body.status);
  const q = cleanText(body.q);

  if (id && isUuid(id)) params.set("id", `eq.${id}`);
  if (leadId && isUuid(leadId)) params.set("lead_id", `eq.${leadId}`);
  if (bookingId && isUuid(bookingId)) params.set("booking_id", `eq.${bookingId}`);
  if (status && status !== "all") params.set("status", `eq.${status}`);
  if (q) params.set("or", `(title.ilike.*${escapeLike(q)}*,customer_name.ilike.*${escapeLike(q)}*,customer_email.ilike.*${escapeLike(q)}*)`);

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?${params.toString()}`, {
    headers: serviceHeaders(env)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load quote/proposal drafts."));
  return Array.isArray(data) ? data : [];
}

function queryBody(request) {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}

function normalizeStatusFilter(value) {
  const status = String(value || "all").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  return status || "all";
}

function escapeLike(value) {
  return encodeURIComponent(String(value || "").replace(/[,*()]/g, " ").trim().slice(0, 80));
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
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
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
