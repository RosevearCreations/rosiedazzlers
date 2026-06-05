// Build 175 — safe lead → draft booking/quote conversion foundation.
// This creates a reviewable conversion draft, not a live scheduled booking row.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const LEAD_SELECT = "id,topic,full_name,email,phone,service_area,vehicle_count,preferred_cadence,message,photo_estimate_links,status,staff_note,converted_booking_id,created_at,updated_at";
const DRAFT_SELECT = "id,title,status,body,pricing_note,internal_note,customer_name,customer_email,follow_up_at,created_at,updated_at";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: false, table_ready: false, error: "Server configuration is incomplete.", migration_hint: "Apply sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql and confirm Supabase service env vars." }, 500));
    }

    const leadId = cleanText(body.lead_id || body.id);
    if (!isUuid(leadId)) return withCors(json({ ok: false, error: "Valid lead_id is required." }, 400));
    const quoteDraftId = cleanText(body.quote_proposal_draft_id || body.quote_draft_id);
    if (quoteDraftId && !isUuid(quoteDraftId)) return withCors(json({ ok: false, error: "Quote draft id must be a valid UUID or blank." }, 400));

    const lead = await loadLead(env, leadId);
    if (!lead) return withCors(json({ ok: false, error: "Lead not found." }, 404));
    const quoteDraft = quoteDraftId ? await loadQuoteDraft(env, quoteDraftId).catch(() => null) : null;

    const proposed = buildProposedPayload({ lead, quoteDraft, body });
    const payload = {
      lead_id: leadId,
      quote_proposal_draft_id: quoteDraft?.id || null,
      status: normalizeStatus(body.status || "draft_booking"),
      customer_name: cleanText(lead.full_name || quoteDraft?.customer_name) || null,
      customer_email: cleanEmail(lead.email || quoteDraft?.customer_email),
      customer_phone: cleanText(lead.phone) || null,
      service_area: cleanText(lead.service_area) || null,
      vehicle_count: Number(lead.vehicle_count || 1) || 1,
      preferred_cadence: cleanText(lead.preferred_cadence) || null,
      proposed_package_code: cleanText(body.proposed_package_code) || proposed.package_code,
      proposed_vehicle_size: cleanText(body.proposed_vehicle_size) || proposed.vehicle_size,
      proposed_booking: proposed.booking,
      proposed_quote: proposed.quote,
      internal_note: cleanText(body.internal_note || lead.staff_note || "") || null,
      next_action: cleanText(body.next_action || "Review draft details, confirm price, then create a real booking when date/access are confirmed."),
      updated_at: new Date().toISOString()
    };
    if (access.actor?.id && isUuid(access.actor.id)) {
      payload.created_by_staff_user_id = access.actor.id;
      payload.updated_by_staff_user_id = access.actor.id;
    }

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts`, {
      method: "POST",
      headers: { ...serviceHeaders(env), "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not save lead conversion draft."));
    const conversion = Array.isArray(data) ? data[0] || null : data;

    await patchLeadStatus(env, leadId, cleanText(body.mark_lead_status || "quoted"), lead.staff_note).catch(() => null);

    return withCors(json({ ok: true, table_ready: true, conversion, lead, quote_draft: quoteDraft, actor: actorSummary(access.actor) }));
  } catch (err) {
    return withCors(json({ ok: false, table_ready: false, error: err?.message || "Could not create lead conversion draft.", migration_hint: "Apply sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql before using conversion drafts." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadLead(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?select=${encodeURIComponent(LEAD_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load lead."));
  return Array.isArray(data) ? data[0] || null : null;
}

async function loadQuoteDraft(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?select=${encodeURIComponent(DRAFT_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load quote draft."));
  return Array.isArray(data) ? data[0] || null : null;
}

async function patchLeadStatus(env, id, status, existingNote) {
  const allowed = new Set(["new", "reviewing", "contacted", "quoted", "converted", "closed", "spam"]);
  const safeStatus = allowed.has(status) ? status : "quoted";
  const patch = { status: safeStatus, staff_note: existingNote || null, updated_at: new Date().toISOString() };
  await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { ...serviceHeaders(env), "Content-Type": "application/json" }, body: JSON.stringify(patch) });
}

function buildProposedPayload({ lead, quoteDraft, body }) {
  const quoteBody = cleanText(body.quote_body || quoteDraft?.body || "");
  const packageCode = cleanText(body.proposed_package_code || inferPackageCode(lead, quoteBody));
  const vehicleSize = cleanText(body.proposed_vehicle_size || inferVehicleSize([lead.message, quoteBody].join(" ")));
  const booking = {
    status: "draft_quote",
    customer_name: cleanText(lead.full_name) || "To be confirmed",
    customer_email: cleanEmail(lead.email) || null,
    customer_phone: cleanText(lead.phone) || null,
    service_area: cleanText(lead.service_area) || "To be confirmed",
    package_code: packageCode,
    vehicle_size: vehicleSize,
    address_line1: "To be confirmed",
    city: null,
    notes: ["Created from Admin Leads conversion draft.", cleanText(lead.message), quoteBody ? `Quote draft: ${quoteBody.slice(0, 1000)}` : ""].filter(Boolean).join("\n\n")
  };
  return { package_code: packageCode, vehicle_size: vehicleSize, booking, quote: { title: cleanText(quoteDraft?.title || body.title || "Rosie Dazzlers quote draft"), body: quoteBody, pricing_note: cleanText(body.pricing_note || quoteDraft?.pricing_note || "") || null } };
}
function inferPackageCode(lead, quoteBody) { const text = [lead.topic, lead.message, quoteBody].join(" ").toLowerCase(); if (/paint|polish|ceramic|wax|seal|clay|exterior/.test(text)) return "exterior_detail"; if (/pet|hair|salt|stain|odou?r|interior|shampoo/.test(text)) return "interior_detail"; if (/quick|wash|maintenance/.test(text)) return "premium_wash"; return "complete_detail"; }
function inferVehicleSize(text) { const value = String(text || "").toLowerCase(); if (/truck|van|fleet|work|large|oversize|sprinter|cargo/.test(value)) return "oversize"; if (/suv|mid|crossover|minivan/.test(value)) return "mid"; if (/small|sedan|car|compact|coupe|hatch/.test(value)) return "small"; return "mid"; }
function normalizeStatus(value) { const status = String(value || "draft_booking").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_"); return new Set(["draft_booking", "needs_review", "ready_to_book", "converted", "closed"]).has(status) ? status : "draft_booking"; }
function cleanEmail(value) { const text = cleanText(value); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text.toLowerCase().slice(0, 240) : null; }
function actorSummary(actor) { return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
