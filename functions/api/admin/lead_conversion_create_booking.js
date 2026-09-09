// Build 362 — create a real booking from a reviewed conversion using current price + availability authority.
// Accepted quote commercial terms are immutable context only; current catalog and current slot state must still match.
import { requireStaffAccess, json, serviceHeaders, cleanText, cleanEmail, isUuid, toBoolean, methodNotAllowed } from "../_lib/staff-auth.js";
import { resolveCurrentQuotePrice, checkCurrentBookingAvailability } from "../_lib/quote-booking-authority.js";
import { compareAcceptedTermsToCurrentPrice, hashStructuredQuoteTerms, normalizeAddonCodes, replayDecision, validateStructuredQuoteTerms } from "../_lib/quote-booking-terms.js";

const CONVERSION_SELECT = [
  "id", "lead_id", "quote_proposal_draft_id", "status", "customer_name", "customer_email", "customer_phone",
  "service_area", "vehicle_count", "preferred_cadence", "proposed_package_code", "proposed_vehicle_size",
  "proposed_booking", "proposed_quote", "internal_note", "next_action", "converted_booking_id", "converted_at",
  "final_price_review", "final_price_status", "final_price_total_cents", "final_deposit_cents", "final_price_reviewed_at"
];
const QUOTE_SELECT = [
  "id", "status", "acceptance_status", "accepted_at", "accepted_terms", "accepted_terms_hash", "accepted_terms_at",
  "terms_expires_at", "final_booking_id"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return fail("SERVER_CONFIGURATION_INCOMPLETE", "Supabase service configuration is incomplete.", 500);

    const conversionId = cleanText(body.conversion_draft_id || body.id);
    if (!isUuid(conversionId)) return fail("CONVERSION_ID_REQUIRED", "Valid conversion_draft_id is required.", 400);

    const conversion = await loadConversionDraft(env, conversionId);
    if (!conversion) return fail("CONVERSION_NOT_FOUND", "Conversion draft not found.", 404);

    const replay = replayDecision(conversion.converted_booking_id);
    if (replay.replay) return replayResponse(env, replay.booking_id, conversion);

    const operational = normalizeOperationalInput(body, conversion);
    if (!operational.ok) return fail(operational.code, operational.error, 400, { required_fields: REQUIRED_FIELDS });

    let quote = null;
    let packageCode = operational.package_code;
    let vehicleSize = operational.vehicle_size;
    let addonCodes = operational.addon_codes;

    if (conversion.quote_proposal_draft_id) {
      quote = await loadQuoteDraft(env, conversion.quote_proposal_draft_id);
      if (!quote) return fail("QUOTE_NOT_FOUND", "The linked quote/proposal was not found.", 409);
      if (quote.final_booking_id) return replayResponse(env, quote.final_booking_id, conversion);
      if (quote.acceptance_status !== "accepted" || !quote.accepted_at) return fail("QUOTE_NOT_ACCEPTED", "The linked quote must be accepted before creating a booking.", 409);

      const checkedTerms = validateStructuredQuoteTerms(quote.accepted_terms);
      if (!checkedTerms.ok) return fail(checkedTerms.code, checkedTerms.error, checkedTerms.code === "QUOTE_EXPIRED" ? 410 : 409);
      if (!quote.accepted_terms_hash) return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "The accepted quote is missing its immutable terms hash.", 409);
      const actualHash = await hashStructuredQuoteTerms(checkedTerms.terms);
      if (actualHash !== quote.accepted_terms_hash) return fail("QUOTE_TERMS_HASH_MISMATCH", "The accepted quote terms no longer match their recorded hash.", 409);

      packageCode = checkedTerms.terms.package_code;
      vehicleSize = checkedTerms.terms.vehicle_size;
      addonCodes = checkedTerms.terms.addon_codes;
    }

    const currentPrice = await resolveCurrentQuotePrice(env, { package_code: packageCode, vehicle_size: vehicleSize, addon_codes: addonCodes });
    if (!currentPrice.ok) return fail(currentPrice.code || "QUOTE_PRICE_REVALIDATION_FAILED", currentPrice.error || "Current pricing could not be validated.", 409);

    if (quote) {
      const compared = compareAcceptedTermsToCurrentPrice(quote.accepted_terms, currentPrice);
      if (!compared.ok) return fail(compared.code, compared.error, compared.code === "QUOTE_EXPIRED" ? 410 : 409, { accepted: compared.accepted, current: compared.current });
    }

    const availability = await checkCurrentBookingAvailability(env, {
      service_date: operational.service_date,
      start_slot: operational.start_slot,
      duration_slots: operational.duration_slots,
      hold_minutes: currentPrice.hold_minutes
    });
    if (!availability.ok) return fail(availability.code || "BOOKING_AVAILABILITY_CHECK_FAILED", availability.error || "Appointment availability could not be validated.", availability.code === "BOOKING_AVAILABILITY_CHECK_FAILED" ? 500 : 409);

    const bookingPayload = {
      status: cleanCode(body.status) || "pending",
      job_status: cleanCode(body.job_status) || "scheduled",
      service_date: operational.service_date,
      start_slot: operational.start_slot,
      duration_slots: operational.duration_slots,
      service_area: operational.service_area,
      package_code: currentPrice.package_code,
      vehicle_size: currentPrice.vehicle_size,
      addons: currentPrice.addons,
      customer_name: operational.customer_name,
      customer_email: operational.customer_email,
      customer_phone: operational.customer_phone || null,
      address_line1: operational.address_line1,
      address_line2: operational.address_line2 || null,
      city: operational.city || null,
      postal_code: operational.postal_code || null,
      currency: "CAD",
      price_total_cents: currentPrice.total_cents,
      deposit_cents: currentPrice.deposit_cents,
      progress_enabled: toBoolean(body.progress_enabled),
      progress_token: crypto.randomUUID(),
      source_quote_proposal_draft_id: conversion.quote_proposal_draft_id || null,
      source_conversion_draft_id: conversion.id,
      notes: operational.notes
    };

    const inserted = await insertBooking(env, bookingPayload);
    if (!inserted.ok && inserted.duplicate) {
      const existing = await loadBookingBySource(env, conversion.id, conversion.quote_proposal_draft_id);
      if (existing) return withCors(json({ ok: true, code: "BOOKING_ALREADY_CREATED", replay: true, booking: existing, conversion_draft_id: conversion.id }));
    }
    if (!inserted.ok) return fail("BOOKING_CREATE_FAILED", inserted.error || "Could not create booking.", 500);
    const created = inserted.booking;

    await Promise.all([
      patchConversion(env, conversion.id, created.id, access.actor, bookingPayload).catch(() => null),
      patchLead(env, conversion.lead_id, created.id).catch(() => null),
      patchQuoteDraft(env, conversion.quote_proposal_draft_id, created.id).catch(() => null),
      insertBookingEvent(env, created.id, access.actor, conversion.id, conversion.quote_proposal_draft_id).catch(() => null)
    ]);

    return withCors(json({ ok: true, code: "BOOKING_CREATED", replay: false, booking: created, conversion_draft_id: conversion.id, lead_id: conversion.lead_id, actor: actorSummary(access.actor) }));
  } catch (err) {
    return fail("QUOTE_BOOKING_CONVERSION_FAILED", err?.message || "Could not create booking from conversion draft.", 500, { migration_hint: "Apply sql/2026-09-09_build362_quote_booking_acceptance.sql after Builds 175–180." });
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

const REQUIRED_FIELDS = ["conversion_draft_id", "service_date", "start_slot", "address_line1", "package_code", "vehicle_size", "customer_name", "customer_email"];

async function loadConversionDraft(env, id) {
  const url = `${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?select=${encodeURIComponent(CONVERSION_SELECT.join(","))}&id=eq.${encodeURIComponent(id)}&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  const text = await res.text(); const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load conversion draft."));
  return Array.isArray(data) ? data[0] || null : null;
}

async function loadQuoteDraft(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?select=${encodeURIComponent(QUOTE_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text(); const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load accepted quote."));
  return Array.isArray(data) ? data[0] || null : null;
}

async function loadBooking(env, id) {
  if (!id || !isUuid(id)) return null;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const data = res.ok ? await res.json().catch(() => []) : [];
  return Array.isArray(data) ? data[0] || null : null;
}

async function loadBookingBySource(env, conversionId, quoteId) {
  const clauses = [`source_conversion_draft_id.eq.${conversionId}`];
  if (quoteId) clauses.push(`source_quote_proposal_draft_id.eq.${quoteId}`);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=*&or=(${clauses.join(",")})&limit=1`, { headers: serviceHeaders(env) });
  const data = res.ok ? await res.json().catch(() => []) : [];
  return Array.isArray(data) ? data[0] || null : null;
}

async function replayResponse(env, bookingId, conversion) {
  const booking = await loadBooking(env, bookingId);
  return withCors(json({ ok: true, code: "BOOKING_ALREADY_CREATED", replay: true, booking: booking || { id: bookingId }, conversion_draft_id: conversion.id }));
}

function normalizeOperationalInput(body, conversion) {
  const proposed = conversion.proposed_booking && typeof conversion.proposed_booking === "object" ? conversion.proposed_booking : {};
  const quote = conversion.proposed_quote && typeof conversion.proposed_quote === "object" ? conversion.proposed_quote : {};
  const serviceDate = cleanDate(body.service_date || proposed.service_date);
  const startSlot = cleanSlot(body.start_slot || proposed.start_slot);
  const addressLine1 = cleanText(body.address_line1 || proposed.address_line1);
  const customerName = cleanText(body.customer_name || conversion.customer_name || proposed.customer_name);
  const customerEmail = cleanEmail(body.customer_email || conversion.customer_email || proposed.customer_email);
  const packageCode = cleanCode(body.package_code || conversion.proposed_package_code || proposed.package_code);
  const vehicleSize = cleanCode(body.vehicle_size || conversion.proposed_vehicle_size || proposed.vehicle_size);
  if (!customerName) return invalid("CUSTOMER_NAME_REQUIRED", "Customer name is required before creating a booking.");
  if (!customerEmail) return invalid("CUSTOMER_EMAIL_REQUIRED", "Valid customer email is required before creating a booking.");
  if (!serviceDate) return invalid("SERVICE_DATE_REQUIRED", "Valid service date is required before creating a booking.");
  if (!startSlot) return invalid("BOOKING_SLOT_INVALID", "Start slot must be AM or PM.");
  if (!addressLine1 || /^to be confirmed$/i.test(addressLine1)) return invalid("SERVICE_ADDRESS_REQUIRED", "Confirmed address_line1 is required before creating a booking.");
  if (!packageCode) return invalid("PACKAGE_CODE_REQUIRED", "Package code is required before creating a booking.");
  if (!vehicleSize) return invalid("VEHICLE_SIZE_REQUIRED", "Vehicle size is required before creating a booking.");
  return {
    ok: true,
    service_date: serviceDate,
    start_slot: startSlot,
    duration_slots: clampInt(body.duration_slots || proposed.duration_slots, 1, 2, 1),
    service_area: cleanText(body.service_area || conversion.service_area || proposed.service_area) || "Oxford / Norfolk Counties",
    package_code: packageCode,
    vehicle_size: vehicleSize,
    addon_codes: normalizeAddonCodes(body.addons ?? body.addon_codes ?? proposed.addons),
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: cleanText(body.customer_phone || conversion.customer_phone || proposed.customer_phone),
    address_line1: addressLine1,
    address_line2: cleanText(body.address_line2 || proposed.address_line2),
    city: cleanText(body.city || proposed.city),
    postal_code: cleanText(body.postal_code || proposed.postal_code),
    notes: [
      "Created from reviewed Admin Leads conversion draft using Build 362 current price/availability revalidation.",
      conversion.internal_note ? `Conversion note: ${conversion.internal_note}` : "",
      quote.body ? `Quote draft context:\n${String(quote.body).slice(0, 1500)}` : "",
      cleanText(body.notes || proposed.notes)
    ].filter(Boolean).join("\n\n")
  };
}

async function insertBooking(env, payload) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings`, { method: "POST", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(payload) });
  const text = await res.text(); const data = safeJson(text);
  if (!res.ok) return { ok: false, duplicate: data?.code === "23505", error: extractSupabaseError(data, text, "Could not create booking.") };
  return { ok: true, booking: Array.isArray(data) ? data[0] || null : data };
}

async function patchConversion(env, conversionId, bookingId, actor, bookingPayload) {
  const patch = { status: "converted", converted_booking_id: bookingId, converted_at: new Date().toISOString(), updated_at: new Date().toISOString(), final_price_status: "ready_to_book", final_price_total_cents: bookingPayload.price_total_cents, final_deposit_cents: bookingPayload.deposit_cents, final_price_reviewed_at: new Date().toISOString() };
  if (actor?.id && isUuid(actor.id)) patch.updated_by_staff_user_id = actor.id;
  await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?id=eq.${encodeURIComponent(conversionId)}`, { method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify(patch) });
}
async function patchLead(env, leadId, bookingId) { if (leadId) await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?id=eq.${encodeURIComponent(leadId)}`, { method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify({ status: "converted", converted_booking_id: bookingId, updated_at: new Date().toISOString() }) }); }
async function patchQuoteDraft(env, draftId, bookingId) { if (draftId) await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?id=eq.${encodeURIComponent(draftId)}`, { method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify({ status: "accepted", final_booking_id: bookingId, updated_at: new Date().toISOString() }) }); }
async function insertBookingEvent(env, bookingId, actor, conversionId, quoteId) { await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method: "POST", headers: serviceHeaders(env), body: JSON.stringify([{ booking_id: bookingId, event_type: "quote_conversion_booking_created", actor_name: actor?.full_name || actor?.email || "Staff", event_note: `Booking created after current price and availability revalidation for conversion ${conversionId}.`, payload: { conversion_draft_id: conversionId, quote_proposal_draft_id: quoteId || null, build: 362 } }]) }); }

function fail(code, error, status, extra = {}) { return withCors(json({ ok: false, code, error, ...extra }, status)); }
function invalid(code, error) { return { ok: false, code, error }; }
function cleanDate(value) { const text = cleanText(value); return /^\d{4}-\d{2}-\d{2}$/.test(text || "") ? text : null; }
function cleanSlot(value) { const text = String(value || "").trim().toUpperCase(); return ["AM", "PM"].includes(text) ? text : null; }
function cleanCode(value) { const text = cleanText(value); return /^[a-z0-9_-]{1,100}$/i.test(text || "") ? text : null; }
function clampInt(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback; }
function actorSummary(actor) { return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
