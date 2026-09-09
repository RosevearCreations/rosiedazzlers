// Build 362 — final price reconciliation against the current booking catalog authority.
// Staff-entered totals, tax/travel math, and human-readable quote text are not booking price authority.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { resolveCurrentQuotePrice } from "../_lib/quote-booking-authority.js";
import { normalizeAddonCodes } from "../_lib/quote-booking-terms.js";

const CONVERSION_SELECT = [
  "id", "lead_id", "quote_proposal_draft_id", "status", "customer_name", "customer_email", "customer_phone",
  "service_area", "vehicle_count", "preferred_cadence", "proposed_package_code", "proposed_vehicle_size",
  "proposed_booking", "proposed_quote", "internal_note", "next_action", "converted_booking_id", "converted_at"
];

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const conversionId = cleanText(body.conversion_draft_id || body.id);
    if (!isUuid(conversionId)) return withCors(json({ ok: false, code: "CONVERSION_ID_REQUIRED", error: "Valid conversion_draft_id is required." }, 400));
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, code: "SERVER_CONFIGURATION_INCOMPLETE", error: "Supabase service configuration is incomplete." }, 500));

    const conversion = await loadConversionDraft(env, conversionId);
    if (!conversion) return withCors(json({ ok: false, code: "CONVERSION_NOT_FOUND", error: "Conversion draft was not found." }, 404));

    const proposed = conversion.proposed_booking && typeof conversion.proposed_booking === "object" ? conversion.proposed_booking : {};
    const packageCode = cleanCode(body.package_code || conversion.proposed_package_code || proposed.package_code);
    const vehicleSize = cleanCode(body.vehicle_size || conversion.proposed_vehicle_size || proposed.vehicle_size);
    const addonCodes = normalizeAddonCodes(body.addons ?? proposed.addons);
    const current = await resolveCurrentQuotePrice(env, { package_code: packageCode, vehicle_size: vehicleSize, addon_codes: addonCodes });

    const required = {
      service_date: !!cleanDate(body.service_date || proposed.service_date),
      start_slot: !!cleanSlot(body.start_slot || proposed.start_slot),
      address_line1: validAddress(body.address_line1 || proposed.address_line1),
      package_code: current.ok === true,
      vehicle_size: ["small", "mid", "oversize"].includes(vehicleSize || ""),
      customer_name: !!cleanText(body.customer_name || conversion.customer_name || proposed.customer_name),
      customer_email: !!cleanEmail(body.customer_email || conversion.customer_email || proposed.customer_email)
    };
    const missing = Object.entries(required).filter(([, ok]) => !ok).map(([key]) => key);
    const warnings = [];
    if (!current.ok) warnings.push(current.error || "Current pricing could not be validated.");
    if (missing.length) warnings.push(`Still missing before real booking: ${missing.join(", ")}.`);

    const reconciliation = {
      ready_to_book: current.ok === true && missing.length === 0,
      required,
      missing,
      warnings,
      authority: "current_checkout_catalog",
      package: current.ok ? { code: current.package_code, name: current.package_name, vehicle_size_used: current.vehicle_size } : null,
      addons: current.ok ? current.addons.map((row) => ({ code: row.code, name: row.label, price_cents: row.cents, quote_required: false })) : [],
      addon_codes: current.ok ? current.addon_codes : addonCodes,
      vehicle_size_used: current.ok ? current.vehicle_size : vehicleSize,
      total_cents: current.ok ? current.total_cents : null,
      deposit_cents: current.ok ? current.deposit_cents : null,
      copy_text: buildCopyText(conversion, current, warnings)
    };

    return withCors(json({ ok: true, table_ready: true, source: current.catalog_source || "pricing_catalog", conversion_draft: conversion, reconciliation, actor: actorSummary(access.actor) }));
  } catch (err) {
    return withCors(json({ ok: false, code: "QUOTE_PRICE_REVALIDATION_FAILED", error: err?.message || "Could not reconcile price for conversion draft." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadConversionDraft(env, id) {
  const url = `${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?select=${encodeURIComponent(CONVERSION_SELECT.join(","))}&id=eq.${encodeURIComponent(id)}&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load conversion draft."));
  return Array.isArray(data) ? data[0] || null : null;
}

function buildCopyText(conversion, current, warnings) {
  if (!current.ok) return `Current booking-authority price review blocked: ${current.error || current.code || "unknown pricing error"}`;
  return [
    `Final current-catalog review for ${conversion.customer_name || "customer"}`,
    `Package: ${current.package_name} (${current.vehicle_size})`,
    current.addons.length ? `Add-ons: ${current.addons.map((row) => `${row.label} ${money(row.cents)}`).join(" | ")}` : "Add-ons: none selected",
    `Booking-authority total: ${money(current.total_cents)} | Deposit: ${money(current.deposit_cents)}`,
    warnings.length ? `Warnings: ${warnings.join(" ")}` : "Current commercial terms are ready for staff review and quote delivery."
  ].join("\n");
}

function validAddress(value) { const text = cleanText(value); return !!text && !/^to be confirmed$/i.test(text); }
function cleanDate(value) { const text = cleanText(value); return /^\d{4}-\d{2}-\d{2}$/.test(text || "") ? text : null; }
function cleanSlot(value) { const text = String(value || "").trim().toUpperCase(); return ["AM", "PM"].includes(text) ? text : null; }
function cleanCode(value) { const text = cleanText(value); return /^[a-z0-9_-]{1,100}$/i.test(text || "") ? text : null; }
function cleanEmail(value) { const text = cleanText(value); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text || "") ? text.toLowerCase() : null; }
function money(cents) { return `$${(Number(cents || 0) / 100).toFixed(2)} CAD`; }
function actorSummary(actor) { return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
