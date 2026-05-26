// Build 176 — create a real booking from a reviewed lead conversion draft.
// This endpoint intentionally requires final staff-confirmed booking details.
// Inserts into public.bookings after those details are confirmed.
import { requireStaffAccess, json, serviceHeaders, cleanText, cleanEmail, isUuid, toBoolean, methodNotAllowed } from "../_lib/staff-auth.js";

const CONVERSION_SELECT = [
  "id",
  "lead_id",
  "quote_proposal_draft_id",
  "status",
  "customer_name",
  "customer_email",
  "customer_phone",
  "service_area",
  "vehicle_count",
  "preferred_cadence",
  "proposed_package_code",
  "proposed_vehicle_size",
  "proposed_booking",
  "proposed_quote",
  "internal_note",
  "next_action",
  "converted_booking_id",
  "converted_at"
];

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: false, error: "Server configuration is incomplete.", migration_hint: "Confirm Supabase service env vars and apply Build 175/176 SQL before creating bookings from conversion drafts." }, 500));
    }

    const conversionId = cleanText(body.conversion_draft_id || body.id);
    if (!isUuid(conversionId)) return withCors(json({ ok: false, error: "Valid conversion_draft_id is required." }, 400));

    const conversion = await loadConversionDraft(env, conversionId);
    if (!conversion) return withCors(json({ ok: false, error: "Conversion draft not found." }, 404));
    if (conversion.converted_booking_id && !body.allow_duplicate) {
      return withCors(json({ ok: false, error: "This conversion draft already has a booking linked.", converted_booking_id: conversion.converted_booking_id }, 409));
    }

    const normalized = normalizeBookingInput(body, conversion);
    if (!normalized.ok) return withCors(json({ ok: false, error: normalized.error, required_fields: REQUIRED_FIELDS }, 400));

    const bookingPayload = normalized.payload;
    const created = await insertBooking(env, bookingPayload);
    if (!created) throw new Error("Booking insert returned no row.");

    await Promise.all([
      patchConversion(env, conversion.id, created.id, access.actor).catch(() => null),
      patchLead(env, conversion.lead_id, created.id).catch(() => null),
      patchQuoteDraft(env, conversion.quote_proposal_draft_id).catch(() => null),
      insertBookingEvent(env, created.id, access.actor, conversion.id).catch(() => null)
    ]);

    return withCors(json({ ok: true, booking: created, conversion_draft_id: conversion.id, lead_id: conversion.lead_id, actor: actorSummary(access.actor) }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not create booking from conversion draft.", migration_hint: "Apply sql/2026-05-25_build176_conversion_to_booking_dashboard_privacy.sql after Build 175 SQL." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

const REQUIRED_FIELDS = ["conversion_draft_id", "service_date", "start_slot", "address_line1", "package_code", "vehicle_size", "customer_name", "customer_email"];

async function loadConversionDraft(env, id) {
  const url = `${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?select=${encodeURIComponent(CONVERSION_SELECT.join(","))}&id=eq.${encodeURIComponent(id)}&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load conversion draft."));
  return Array.isArray(data) ? data[0] || null : null;
}

function normalizeBookingInput(body, conversion) {
  const proposed = conversion.proposed_booking && typeof conversion.proposed_booking === "object" ? conversion.proposed_booking : {};
  const quote = conversion.proposed_quote && typeof conversion.proposed_quote === "object" ? conversion.proposed_quote : {};
  const serviceDate = cleanDate(body.service_date || proposed.service_date);
  const startSlot = cleanSlot(body.start_slot || proposed.start_slot);
  const addressLine1 = cleanText(body.address_line1 || proposed.address_line1);
  const customerName = cleanText(body.customer_name || conversion.customer_name || proposed.customer_name);
  const customerEmail = cleanEmail(body.customer_email || conversion.customer_email || proposed.customer_email);
  const customerPhone = cleanText(body.customer_phone || conversion.customer_phone || proposed.customer_phone);
  const serviceArea = cleanText(body.service_area || conversion.service_area || proposed.service_area) || "Oxford / Norfolk Counties";
  const packageCode = cleanCode(body.package_code || conversion.proposed_package_code || proposed.package_code);
  const vehicleSize = cleanCode(body.vehicle_size || conversion.proposed_vehicle_size || proposed.vehicle_size);
  const city = cleanText(body.city || proposed.city);
  const postalCode = cleanText(body.postal_code || proposed.postal_code);
  const totalCents = moneyToCents(body.price_total_cents ?? body.total_cents ?? body.total_price ?? body.price_total ?? proposed.price_total_cents ?? proposed.total_price);
  const depositCents = moneyToCents(body.deposit_cents ?? body.deposit_amount ?? proposed.deposit_cents ?? proposed.deposit_amount);
  const notes = [
    "Created from reviewed Admin Leads conversion draft.",
    conversion.internal_note ? `Conversion note: ${conversion.internal_note}` : "",
    quote.body ? `Quote draft:\n${String(quote.body).slice(0, 1500)}` : "",
    cleanText(body.notes || proposed.notes)
  ].filter(Boolean).join("\n\n");

  if (!customerName) return { ok: false, error: "Customer name is required before creating a booking." };
  if (!customerEmail) return { ok: false, error: "Valid customer email is required before creating a booking." };
  if (!serviceDate) return { ok: false, error: "Valid service date is required before creating a booking." };
  if (!startSlot) return { ok: false, error: "Start slot must be AM or PM." };
  if (!addressLine1 || /^to be confirmed$/i.test(addressLine1)) return { ok: false, error: "Confirmed address_line1 is required before creating a booking." };
  if (!packageCode) return { ok: false, error: "Package code is required before creating a booking." };
  if (!vehicleSize) return { ok: false, error: "Vehicle size is required before creating a booking." };

  return {
    ok: true,
    payload: {
      status: cleanCode(body.status) || "pending",
      job_status: cleanCode(body.job_status) || "scheduled",
      service_date: serviceDate,
      start_slot: startSlot,
      duration_slots: clampInt(body.duration_slots || proposed.duration_slots, 1, 2, 1),
      service_area: serviceArea,
      package_code: packageCode,
      vehicle_size: vehicleSize,
      addons: normalizeAddons(body.addons || proposed.addons),
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      address_line1: addressLine1,
      address_line2: cleanText(body.address_line2 || proposed.address_line2),
      city,
      postal_code: postalCode,
      currency: "CAD",
      price_total_cents: totalCents || 0,
      deposit_cents: depositCents || 0,
      progress_enabled: toBoolean(body.progress_enabled),
      progress_token: crypto.randomUUID(),
      notes
    }
  };
}

async function insertBooking(env, payload) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not create booking."));
  return Array.isArray(data) ? data[0] || null : data;
}

async function patchConversion(env, conversionId, bookingId, actor) {
  const patch = { status: "converted", converted_booking_id: bookingId, converted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  if (actor?.id && isUuid(actor.id)) patch.updated_by_staff_user_id = actor.id;
  await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?id=eq.${encodeURIComponent(conversionId)}`, { method: "PATCH", headers: { ...serviceHeaders(env), "Content-Type": "application/json" }, body: JSON.stringify(patch) });
}
async function patchLead(env, leadId, bookingId) {
  if (!leadId) return;
  await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?id=eq.${encodeURIComponent(leadId)}`, { method: "PATCH", headers: { ...serviceHeaders(env), "Content-Type": "application/json" }, body: JSON.stringify({ status: "converted", converted_booking_id: bookingId, updated_at: new Date().toISOString() }) });
}
async function patchQuoteDraft(env, draftId) {
  if (!draftId) return;
  await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?id=eq.${encodeURIComponent(draftId)}`, { method: "PATCH", headers: { ...serviceHeaders(env), "Content-Type": "application/json" }, body: JSON.stringify({ status: "accepted", updated_at: new Date().toISOString() }) });
}
async function insertBookingEvent(env, bookingId, actor, conversionId) {
  await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method: "POST", headers: serviceHeaders(env), body: JSON.stringify([{ booking_id: bookingId, event_type: "lead_conversion_booking_created", actor_name: actor?.full_name || actor?.email || "Staff", event_note: `Booking created from lead conversion draft ${conversionId}.`, payload: { conversion_draft_id: conversionId } }]) });
}

function cleanDate(value) { const text = cleanText(value); return /^\d{4}-\d{2}-\d{2}$/.test(text || "") ? text : null; }
function cleanSlot(value) { const text = String(value || "").trim().toUpperCase(); if (["AM", "MORNING"].includes(text)) return "AM"; if (["PM", "AFTERNOON"].includes(text)) return "PM"; return null; }
function cleanCode(value) { const text = cleanText(value); return /^[a-z0-9 _-]{1,100}$/i.test(text || "") ? text : null; }
function normalizeAddons(value) { if (Array.isArray(value)) return value; if (typeof value === "string" && value.trim()) { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return value.split(",").map((item) => item.trim()).filter(Boolean); } } return []; }
function moneyToCents(value) { if (value === null || value === undefined || value === "") return 0; const raw = Number(value); if (!Number.isFinite(raw) || raw < 0) return 0; return Math.round(raw > 9999 ? raw : raw * 100); }
function clampInt(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback; }
function actorSummary(actor) { return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
