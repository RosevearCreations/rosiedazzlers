import { requireStaffAccess, json, serviceHeaders, cleanText, methodNotAllowed } from "../_lib/staff-auth.js";

const LEAD_SELECT = [
  "id",
  "topic",
  "full_name",
  "email",
  "phone",
  "service_area",
  "vehicle_count",
  "preferred_cadence",
  "source_path",
  "message",
  "photo_estimate_links",
  "status",
  "staff_note",
  "converted_booking_id",
  "created_at",
  "updated_at"
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
    const topic = normalizeTopic(body.topic, true);
    const q = cleanText(body.q || body.search);

    const rows = await fetchLeadRows(env, { limit, status, topic, q });
    return withCors(json({
      ok: true,
      table_ready: true,
      leads: rows,
      filters: { limit, status, topic, q: q || null }
    }));
  } catch (err) {
    return withCors(json({
      ok: false,
      table_ready: false,
      error: err?.message || "Could not load public inquiry leads.",
      migration_hint: "Run sql/2026-05-23_build167_competetive_matrix_leads_upload_schema.sql before relying on Admin Leads."
    }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPut() {
  return withCors(methodNotAllowed());
}

async function fetchLeadRows(env, { limit, status, topic, q }) {
  const params = new URLSearchParams();
  params.set("select", LEAD_SELECT);
  params.set("order", "created_at.desc");
  params.set("limit", String(limit));
  if (status && status !== "all") params.set("status", `eq.${status}`);
  if (topic && topic !== "all") params.set("topic", `eq.${topic}`);
  if (q) {
    const like = `*${q.replace(/[*,()]/g, " ").trim()}*`;
    params.set("or", `(full_name.ilike.${like},email.ilike.${like},phone.ilike.${like},service_area.ilike.${like},message.ilike.${like})`);
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?${params.toString()}`, {
    headers: serviceHeaders(env)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load public inquiry leads."));
  return Array.isArray(data) ? data : [];
}

function queryBody(request) {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}

function normalizeStatus(value, allowAll = false) {
  const status = cleanSlug(value);
  const allowed = new Set(["new", "reviewing", "contacted", "quoted", "converted", "closed", "spam"]);
  if (allowAll && (!status || status === "all")) return "all";
  return allowed.has(status) ? status : allowAll ? "all" : "new";
}

function normalizeTopic(value, allowAll = false) {
  const topic = cleanSlug(value);
  const allowed = new Set(["fleet", "maintenance", "gift_card", "special", "photo_estimate", "general"]);
  if (allowAll && (!topic || topic === "all")) return "all";
  return allowed.has(topic) ? topic : allowAll ? "all" : "general";
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
