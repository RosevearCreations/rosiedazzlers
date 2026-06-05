import { requireStaffAccess, json, serviceHeaders, cleanText, methodNotAllowed } from "../_lib/staff-auth.js";

const FAQ_SELECT = [
  "id",
  "created_at",
  "updated_at",
  "category",
  "question",
  "answer",
  "cta_label",
  "cta_href",
  "sort_order",
  "is_active",
  "source_key"
].join(",");

const STATIC_FAQS = [
  {
    category: "Booking and service area",
    question: "Where does Rosie Dazzlers provide mobile auto detailing?",
    answer: "Rosie Dazzlers serves Oxford County and Norfolk County, Ontario, with strongest public pages for Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, Norwich, Otterville, Waterford, Vittoria, Port Rowan, Turkey Point, Zorra, Thamesford, and Embro. Final availability still depends on schedule, driveway access, travel time, and weather.",
    cta_label: "Check booking availability",
    cta_href: "/book",
    sort_order: 10,
    is_active: true
  },
  {
    category: "Pricing and quotes",
    question: "Should customers book directly or send photos first?",
    answer: "Book directly when the package is clear. Send photos or links first when the vehicle has heavy pet hair, odour, salt, staining, paint correction questions, ceramic coating questions, work-truck buildup, or fleet/maintenance needs.",
    cta_label: "Send photos for estimate",
    cta_href: "/book?estimate=photos",
    sort_order: 50,
    is_active: true
  },
  {
    category: "Photos, privacy, and proof",
    question: "Will customer photos be posted online?",
    answer: "Photos or videos should not be used publicly until staff confirm customer consent, privacy review, and any needed blur/crop work for plates, faces, addresses, or private information.",
    cta_label: "Read privacy policy",
    cta_href: "/privacy",
    sort_order: 120,
    is_active: true
  }
];

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
      capability: "manage_promos",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({
        ok: true,
        source: "static_fallback",
        degraded: true,
        table_ready: false,
        migration_hint: "Set SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY, then apply sql/2026-05-24_build172_public_faq_content_foundation.sql.",
        items: filterItems(STATIC_FAQS, body)
      }));
    }

    const rows = await fetchFaqRows(env, {
      q: cleanText(body.q || body.search),
      status: cleanSlug(body.status || "all"),
      limit: clampInt(body.limit, 1, 200, 100)
    });

    return withCors(json({
      ok: true,
      source: "db",
      degraded: false,
      table_ready: true,
      items: rows
    }));
  } catch (err) {
    return withCors(json({
      ok: true,
      source: "static_fallback",
      degraded: true,
      table_ready: false,
      error: err?.message || "FAQ database read failed; static fallback returned.",
      migration_hint: "Apply sql/2026-05-24_build172_public_faq_content_foundation.sql before editing FAQ rows from Admin Content.",
      items: STATIC_FAQS.map((item) => ({ ...item, source: "static_fallback" }))
    }));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPut() {
  return withCors(methodNotAllowed());
}

async function fetchFaqRows(env, { q, status, limit }) {
  const params = new URLSearchParams();
  params.set("select", FAQ_SELECT);
  params.set("order", "sort_order.asc,category.asc,question.asc");
  params.set("limit", String(limit));
  if (status === "active") params.set("is_active", "eq.true");
  if (status === "hidden") params.set("is_active", "eq.false");
  if (q) {
    const like = `*${q.replace(/[*,()]/g, " ").trim()}*`;
    params.set("or", `(category.ilike.${like},question.ilike.${like},answer.ilike.${like},cta_label.ilike.${like},cta_href.ilike.${like})`);
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_faq_entries?${params.toString()}`, {
    headers: serviceHeaders(env)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load public FAQ entries."));
  return Array.isArray(data) ? data.map(normalizeRow) : [];
}

function normalizeRow(row) {
  return {
    id: cleanText(row.id),
    category: cleanText(row.category) || "General",
    question: cleanText(row.question) || "Question",
    answer: cleanText(row.answer) || "Answer pending.",
    cta_label: cleanText(row.cta_label),
    cta_href: cleanText(row.cta_href),
    sort_order: Number(row.sort_order || 0),
    is_active: row.is_active !== false,
    source_key: cleanText(row.source_key),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function filterItems(items, body) {
  const q = cleanText(body.q || body.search).toLowerCase();
  const status = cleanSlug(body.status || "all");
  return items
    .filter((item) => status !== "hidden")
    .filter((item) => {
      if (!q) return true;
      return [item.category, item.question, item.answer, item.cta_label, item.cta_href].join(" ").toLowerCase().includes(q);
    })
    .map((item) => ({ ...item, source: "static_fallback" }));
}

function queryBody(request) {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
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
