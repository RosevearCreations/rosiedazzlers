import { requireStaffAccess, json, serviceHeaders, methodNotAllowed } from "../_lib/staff-auth.js";
import { deriveFleetLead, fleetPipelineMetrics, normalizeFleetLeadPatch, writableFleetLeadStatuses } from "../_lib/fleet-account-pipeline.js";

const LEAD_SELECT = [
  "id", "topic", "full_name", "email", "phone", "service_area", "vehicle_count",
  "preferred_cadence", "source_path", "message", "photo_estimate_links", "status",
  "staff_note", "converted_booking_id", "created_at", "updated_at"
].join(",");

export async function onRequestGet(context) {
  return handleList(context);
}

export async function onRequestPatch(context) {
  return handlePatch(context);
}

export async function onRequestPost(context) {
  const override = context?.request?.headers?.get("x-http-method-override") || "";
  return String(override).toUpperCase() === "PATCH" ? handlePatch(context) : withCors(methodNotAllowed());
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function handleList({ request, env }) {
  try {
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Fleet pipeline service configuration is incomplete." }, 500));
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    const access = await requireStaffAccess({ request, env, body: query, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const limit = clampInt(query.limit, 1, 200, 100);
    const status = normalizeFilterStatus(query.status);
    const rows = await fetchFleetRows(env, { limit, status });
    const leads = rows.map(deriveFleetLead);
    return withCors(json({
      ok: true,
      leads,
      metrics: fleetPipelineMetrics(leads),
      writable_statuses: writableFleetLeadStatuses(),
      boundaries: {
        creates_quote: false,
        creates_appointment: false,
        marks_conversion: false,
        enables_recurring_service: false,
        charges_customer: false
      }
    }));
  } catch (err) {
    console.error("Fleet account pipeline list failed.", { message: err?.message || "Unknown error" });
    return withCors(json({ ok: false, error: "Could not load fleet assessment pipeline." }, 500));
  }
}

async function handlePatch({ request, env }) {
  try {
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Fleet pipeline service configuration is incomplete." }, 500));
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const leadId = normalizeLeadId(body.lead_id || body.id);
    if (!leadId) return withCors(json({ ok: false, error: "A valid fleet lead id is required." }, 400));
    const normalized = normalizeFleetLeadPatch(body);
    if (!normalized.ok) return withCors(json({ ok: false, error: normalized.error }, 400));

    const existing = await fetchFleetLeadById(env, leadId);
    if (!existing) return withCors(json({ ok: false, error: "Fleet assessment lead was not found." }, 404));
    if (String(existing.topic || "") !== "fleet") return withCors(json({ ok: false, error: "This lead is not a fleet assessment." }, 409));
    if (String(existing.status || "") === "converted") {
      return withCors(json({ ok: false, error: "Converted fleet leads are read-only here; use the booking/quote workflow." }, 409));
    }

    const patch = { ...normalized.patch, updated_at: new Date().toISOString() };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?id=eq.${encodeURIComponent(leadId)}&topic=eq.fleet`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(patch)
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not save fleet lead."));
    const row = Array.isArray(data) ? data[0] || null : null;
    if (!row) return withCors(json({ ok: false, error: "Fleet lead update did not return a row." }, 409));

    return withCors(json({
      ok: true,
      lead: deriveFleetLead(row),
      creates_quote: false,
      creates_appointment: false,
      marks_conversion: false,
      enables_recurring_service: false,
      charges_customer: false
    }));
  } catch (err) {
    console.error("Fleet account pipeline update failed.", { message: err?.message || "Unknown error" });
    return withCors(json({ ok: false, error: "Could not save fleet assessment follow-up." }, 500));
  }
}

async function fetchFleetRows(env, { limit, status }) {
  const params = new URLSearchParams({ select: LEAD_SELECT, topic: "eq.fleet", order: "created_at.desc", limit: String(limit) });
  if (status !== "all") params.set("status", `eq.${status}`);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?${params.toString()}`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load fleet assessments."));
  return Array.isArray(data) ? data : [];
}

async function fetchFleetLeadById(env, id) {
  const params = new URLSearchParams({ select: LEAD_SELECT, id: `eq.${id}`, limit: "1" });
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?${params.toString()}`, { headers: serviceHeaders(env) });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function normalizeFilterStatus(value) {
  const status = String(value || "all").trim().toLowerCase();
  const allowed = new Set(["all", "new", "reviewing", "contacted", "quoted", "converted", "closed", "spam"]);
  return allowed.has(status) ? status : "all";
}

function normalizeLeadId(value) {
  const id = String(value || "").trim();
  return /^[A-Za-z0-9-]{1,100}$/.test(id) ? id : "";
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;
}
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { return data?.message || (String(text || "").trim().slice(0, 300) || fallback); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PATCH,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-http-method-override, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
