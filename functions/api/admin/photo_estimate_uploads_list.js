import { requireStaffAccess, json, serviceHeaders, cleanText, methodNotAllowed } from "../_lib/staff-auth.js";

const EXTENDED_SELECT = [
  "id",
  "intake_id",
  "booking_id",
  "lead_id",
  "source",
  "bucket",
  "object_path",
  "media_url",
  "filename",
  "content_type",
  "file_size_bytes",
  "customer_email",
  "customer_name",
  "status",
  "privacy_status",
  "privacy_note",
  "staff_note",
  "reviewed_at",
  "reviewed_by_staff_user_id",
  "created_at",
  "linked_at"
].join(",");

const BASE_SELECT = [
  "id",
  "intake_id",
  "booking_id",
  "lead_id",
  "source",
  "bucket",
  "object_path",
  "media_url",
  "filename",
  "content_type",
  "file_size_bytes",
  "customer_email",
  "customer_name",
  "status",
  "privacy_status",
  "created_at",
  "linked_at"
].join(",");

export async function onRequestGet(context) {
  return onRequestPost(context);
}

export async function onRequestPost({ request, env }) {
  try {
    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: false, error: "Server configuration is incomplete. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY." }, 500));
    }

    const body = request.method === "GET" ? queryBody(request) : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const limit = clampInt(body.limit, 1, 100, 50);
    const status = normalizeStatus(body.status, true);
    const privacy_status = normalizePrivacyStatus(body.privacy_status, true);
    const q = cleanText(body.q || body.search);

    const result = await fetchUploadRows(env, { limit, status, privacy_status, q });
    return withCors(json({
      ok: true,
      table_ready: true,
      extended_review_fields_ready: result.extended,
      uploads: result.rows,
      filters: { limit, status, privacy_status, q: q || null }
    }));
  } catch (err) {
    return withCors(json({
      ok: false,
      table_ready: false,
      error: err?.message || "Could not load photo estimate uploads.",
      migration_hint: "Run sql/2026-05-23_build167_competetive_matrix_leads_upload_schema.sql and then sql/2026-05-23_build168_admin_leads_photo_review.sql."
    }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPut() {
  return withCors(methodNotAllowed());
}

async function fetchUploadRows(env, filters) {
  try {
    return { rows: await fetchRowsWithSelect(env, EXTENDED_SELECT, filters), extended: true };
  } catch (err) {
    const message = String(err?.message || "");
    if (!/privacy_note|staff_note|reviewed_at|reviewed_by_staff_user_id|column/i.test(message)) throw err;
    return { rows: await fetchRowsWithSelect(env, BASE_SELECT, filters), extended: false };
  }
}

async function fetchRowsWithSelect(env, select, { limit, status, privacy_status, q }) {
  const params = new URLSearchParams();
  params.set("select", select);
  params.set("order", "created_at.desc");
  params.set("limit", String(limit));
  if (status && status !== "all") params.set("status", `eq.${status}`);
  if (privacy_status && privacy_status !== "all") params.set("privacy_status", `eq.${privacy_status}`);
  if (q) {
    const like = `*${q.replace(/[*,()]/g, " ").trim()}*`;
    params.set("or", `(filename.ilike.${like},customer_email.ilike.${like},customer_name.ilike.${like},object_path.ilike.${like})`);
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/photo_estimate_uploads?${params.toString()}`, {
    headers: serviceHeaders(env)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load photo estimate uploads."));
  return Array.isArray(data) ? data : [];
}

function queryBody(request) {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}

function normalizeStatus(value, allowAll = false) {
  const status = cleanSlug(value);
  const allowed = new Set(["signed", "uploaded", "linked", "reviewed", "rejected", "expired"]);
  if (allowAll && (!status || status === "all")) return "all";
  return allowed.has(status) ? status : allowAll ? "all" : "signed";
}

function normalizePrivacyStatus(value, allowAll = false) {
  const status = cleanSlug(value);
  const allowed = new Set(["pending_review", "approved_private", "approved_public", "needs_blur", "rejected"]);
  if (allowAll && (!status || status === "all")) return "all";
  return allowed.has(status) ? status : allowAll ? "all" : "pending_review";
}

function cleanSlug(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_ -]+/g, "").replace(/\s+/g, "_");
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function extractSupabaseError(data, text, fallback) {
  if (data && data.message) return data.message;
  if (typeof text === "string" && text.trim()) return text.slice(0, 300);
  return fallback;
}


function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && getSupabaseServiceRoleKey(env));
}

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
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
