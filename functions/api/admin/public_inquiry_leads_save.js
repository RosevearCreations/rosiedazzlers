import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: false, error: "Server configuration is incomplete. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY." }, 500));
    }

    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const id = cleanText(body.id);
    if (!isUuid(id)) return withCors(json({ ok: false, error: "Valid lead id is required." }, 400));

    const status = normalizeStatus(body.status);
    const staff_note = cleanText(body.staff_note);
    const converted_booking_id = cleanText(body.converted_booking_id);
    if (converted_booking_id && !isUuid(converted_booking_id)) {
      return withCors(json({ ok: false, error: "Converted booking id must be a valid UUID or blank." }, 400));
    }

    const patch = {
      status,
      staff_note: staff_note || null,
      converted_booking_id: converted_booking_id || null,
      updated_at: new Date().toISOString()
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(patch)
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) {
      return withCors(json({
        ok: false,
        error: extractSupabaseError(data, text, "Could not update lead."),
        migration_hint: "Run sql/2026-05-23_build167_competetive_matrix_leads_upload_schema.sql if public_inquiry_leads is missing."
      }, 500));
    }

    const lead = Array.isArray(data) ? data[0] || null : data;
    return withCors(json({ ok: true, lead, actor: actorSummary(access.actor) }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not update lead." }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

function normalizeStatus(value) {
  const status = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_ -]+/g, "").replace(/\s+/g, "_");
  const allowed = new Set(["new", "reviewing", "contacted", "quoted", "converted", "closed", "spam"]);
  return allowed.has(status) ? status : "reviewing";
}

function actorSummary(actor) {
  return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null;
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
