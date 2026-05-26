// Build 177 — final price reconciliation helper for lead conversion drafts.
// Calculates package/add-on/travel/tax totals from the pricing catalog before staff create a real booking.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadPricingCatalog } from "../_lib/pricing-catalog.js";

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

    const conversionId = cleanText(body.conversion_draft_id || body.id);
    if (!isUuid(conversionId)) return withCors(json({ ok: false, error: "Valid conversion_draft_id is required." }, 400));

    const conversion = hasSupabaseConfig(env) ? await loadConversionDraft(env, conversionId).catch(() => null) : null;
    if (!conversion) {
      return withCors(json({ ok: true, table_ready: false, reconciliation: null, warnings: ["Conversion draft could not be loaded. Apply Build 175/176 SQL and confirm Supabase service variables."], migration_hint: "Apply Build 175 SQL, then Build 176 SQL before price reconciliation." }));
    }

    const catalog = await loadPricingCatalog(env);
    const reconciliation = reconcilePrice(catalog, conversion, body);
    return withCors(json({ ok: true, table_ready: true, source: catalog?.source || "pricing_catalog", conversion_draft: conversion, reconciliation, actor: actorSummary(access.actor) }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not reconcile price for conversion draft." }, 500));
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

function reconcilePrice(catalog, conversion, body) {
  const proposedBooking = conversion.proposed_booking && typeof conversion.proposed_booking === "object" ? conversion.proposed_booking : {};
  const bookingAddons = normalizeAddons(body.addons ?? proposedBooking.addons);
  const size = cleanCode(body.vehicle_size || conversion.proposed_vehicle_size || proposedBooking.vehicle_size) || "mid";
  const packageCode = cleanCode(body.package_code || conversion.proposed_package_code || proposedBooking.package_code);
  const packageMap = catalog?.package_map || mapByCode(catalog?.packages || []);
  const addonMap = catalog?.addon_map || mapByCode(catalog?.addons || []);
  const packageRow = packageCode ? packageMap[packageCode] : null;
  const warnings = [];

  if (!packageCode) warnings.push("Package code is missing. Choose a package before booking.");
  if (packageCode && !packageRow) warnings.push(`Package code '${packageCode}' was not found in the pricing catalog.`);
  if (!["small", "mid", "oversize"].includes(size)) warnings.push("Vehicle size should be small, mid, or oversize before final pricing.");

  const packageCents = centsForSize(packageRow, size);
  const addonRows = bookingAddons.map((code) => {
    const row = addonMap[code] || null;
    const cents = centsForSize(row, size);
    if (!row) warnings.push(`Add-on '${code}' was not found in the pricing catalog.`);
    if (row?.quote_required) warnings.push(`${row.name || row.code} is quote-required; confirm from photos/condition before final price.`);
    if (row && cents == null && !row.quote_required) warnings.push(`${row.name || row.code} has no ${size} price in the catalog.`);
    return { code, name: row?.name || code, price_cents: cents || 0, quote_required: row?.quote_required === true };
  });

  const bookingRules = catalog?.booking_rules || {};
  const travelZone = cleanCode(body.travel_zone || proposedBooking.travel_zone || "urban") || "urban";
  const travelPricing = bookingRules.travel_pricing || {};
  const travelCents = dollarsToCents(travelPricing[travelZone] ?? body.travel_cad ?? 0);
  const fuelCents = dollarsToCents(body.fuel_surcharge_cad ?? bookingRules?.price_controls?.fuel_surcharge_cad ?? 0);
  const materialCents = dollarsToCents(body.material_surcharge_cad ?? bookingRules?.price_controls?.material_surcharge_cad ?? 0);
  const discountCents = dollarsToCents(body.discount_cad || 0);
  const taxRate = numberOr(body.tax_rate_percent, bookingRules?.price_controls?.tax_rate_percent ?? 13);
  const addonSubtotalCents = addonRows.reduce((sum, row) => sum + Number(row.price_cents || 0), 0);
  const subtotalBeforeTaxCents = Math.max(0, (packageCents || 0) + addonSubtotalCents + travelCents + fuelCents + materialCents - discountCents);
  const taxCents = Math.round(subtotalBeforeTaxCents * (taxRate / 100));
  const totalCents = subtotalBeforeTaxCents + taxCents;
  const catalogDepositCents = dollarsToCents(packageRow?.deposit_cad || 0);
  const overrideDeposit = body.deposit_cents || body.deposit_cad || proposedBooking.deposit_cents || proposedBooking.deposit_amount;
  const depositCents = overrideDeposit == null || overrideDeposit === "" ? catalogDepositCents : moneyInputToCents(overrideDeposit);

  const required = {
    service_date: !!cleanDate(body.service_date || proposedBooking.service_date),
    start_slot: !!cleanSlot(body.start_slot || proposedBooking.start_slot),
    address_line1: !!cleanText(body.address_line1 || proposedBooking.address_line1) && !/^to be confirmed$/i.test(cleanText(body.address_line1 || proposedBooking.address_line1) || ""),
    package_code: !!packageRow,
    vehicle_size: ["small", "mid", "oversize"].includes(size),
    customer_name: !!cleanText(body.customer_name || conversion.customer_name || proposedBooking.customer_name),
    customer_email: !!cleanText(body.customer_email || conversion.customer_email || proposedBooking.customer_email)
  };

  const missing = Object.entries(required).filter(([, ok]) => !ok).map(([key]) => key);
  if (missing.length) warnings.push(`Still missing before real booking: ${missing.join(", ")}.`);
  if (totalCents <= 0) warnings.push("Total is zero. Confirm package/add-ons or enter an override before booking.");

  const copyText = [
    `Final price review for ${conversion.customer_name || "customer"}`,
    `Package: ${packageRow?.name || packageCode || "not selected"} (${size}) — ${money(packageCents || 0)}`,
    addonRows.length ? `Add-ons: ${addonRows.map((row) => `${row.name} ${money(row.price_cents)}`).join(" | ")}` : "Add-ons: none selected",
    `Travel/surcharges/discount: travel ${money(travelCents)}, fuel ${money(fuelCents)}, materials ${money(materialCents)}, discount ${money(discountCents)}`,
    `Subtotal: ${money(subtotalBeforeTaxCents)} | HST ${taxRate}%: ${money(taxCents)} | Total: ${money(totalCents)} | Deposit: ${money(depositCents)}`,
    warnings.length ? `Warnings: ${warnings.join(" ")}` : "Ready for staff final review."
  ].join("\n");

  return {
    ready_to_book: missing.length === 0 && warnings.filter((w) => !/quote-required/i.test(w)).length === 0,
    required,
    missing,
    warnings,
    package: packageRow ? { code: packageRow.code, name: packageRow.name, price_cents: packageCents || 0, vehicle_size_used: size } : null,
    addons: addonRows,
    vehicle_size_used: size,
    travel_zone: travelZone,
    subtotal_before_tax_cents: subtotalBeforeTaxCents,
    tax_rate_percent: taxRate,
    tax_cents: taxCents,
    total_cents: totalCents,
    deposit_cents: depositCents,
    copy_text: copyText
  };
}

function mapByCode(rows) { const out = Object.create(null); for (const row of Array.isArray(rows) ? rows : []) if (row?.code) out[row.code] = row; return out; }
function centsForSize(row, size) { if (!row) return null; const prices = row.prices_cad && typeof row.prices_cad === "object" ? row.prices_cad : {}; const value = prices[size] ?? prices.mid ?? prices.small ?? prices.oversize ?? row.price_cad; return value == null ? null : dollarsToCents(value); }
function normalizeAddons(value) { if (Array.isArray(value)) return value.map(cleanCode).filter(Boolean); if (typeof value === "string" && value.trim()) { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(cleanCode).filter(Boolean) : []; } catch { return value.split(",").map(cleanCode).filter(Boolean); } } return []; }
function dollarsToCents(value) { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0; }
function moneyInputToCents(value) { const n = Number(value); if (!Number.isFinite(n) || n < 0) return 0; return Math.round(n > 9999 ? n : n * 100); }
function numberOr(value, fallback) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function money(cents) { return `$${(Number(cents || 0) / 100).toFixed(2)} CAD`; }
function cleanDate(value) { const text = cleanText(value); return /^\d{4}-\d{2}-\d{2}$/.test(text || "") ? text : null; }
function cleanSlot(value) { const text = String(value || "").trim().toUpperCase(); if (["AM", "MORNING"].includes(text)) return "AM"; if (["PM", "AFTERNOON"].includes(text)) return "PM"; return null; }
function cleanCode(value) { const text = cleanText(value); return /^[a-z0-9 _-]{1,100}$/i.test(text || "") ? text : null; }
function actorSummary(actor) { return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
