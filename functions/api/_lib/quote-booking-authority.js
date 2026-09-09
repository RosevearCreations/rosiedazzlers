// Build 362 — shared current catalog and appointment authority for quote-to-booking conversion.
import { loadPricingCatalog } from "./pricing-catalog.js";
import { serviceHeaders } from "./staff-session.js";
import { evaluateSlotAvailability, normalizeAddonCodes } from "./quote-booking-terms.js";

export async function resolveCurrentQuotePrice(env, input = {}) {
  const pricing = await loadPricingCatalog(env);
  const packageCode = String(input.package_code || input.packageCode || "").trim();
  const vehicleSize = String(input.vehicle_size || input.vehicleSize || "").trim();
  const addonCodes = normalizeAddonCodes(input.addon_codes || input.addonCodes || input.addons);

  if (!packageCode) return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "A package code is required before pricing can be validated.");
  if (!["small", "mid", "oversize"].includes(vehicleSize)) return fail("QUOTE_STRUCTURED_TERMS_REQUIRED", "Vehicle size must be small, mid, or oversize.");

  const pkg = pricing?.package_map?.[packageCode];
  if (!pkg) return fail("QUOTE_PRICE_CHANGED", `Package '${packageCode}' is no longer available in the current pricing catalog.`);
  const baseCad = pkg.prices_cad?.[vehicleSize];
  if (!Number.isFinite(baseCad)) return fail("QUOTE_PRICE_CHANGED", `Package '${packageCode}' no longer has a ${vehicleSize} price.`);

  const addons = [];
  let addonsTotalCents = 0;
  for (const code of addonCodes) {
    const addon = pricing?.addon_map?.[code];
    if (!addon) return fail("QUOTE_PRICE_CHANGED", `Add-on '${code}' is no longer available in the current pricing catalog.`);
    const requiredPackages = Array.isArray(addon.requires_package_codes_any) ? addon.requires_package_codes_any.map((value) => String(value || "").trim()).filter(Boolean) : [];
    if (requiredPackages.length && addon.standalone_allowed !== true && !requiredPackages.includes(pkg.code)) {
      return fail("QUOTE_PRICE_CHANGED", addon.requirement_note || `${addon.name || code} is no longer compatible with ${pkg.name || pkg.code}.`);
    }
    const addonCad = addon.prices_cad?.[vehicleSize];
    if (addon.quote_required === true || !Number.isFinite(addonCad)) {
      return fail("QUOTE_REQUIRES_MANUAL_REVIEW", `${addon.name || code} requires a condition-specific price and cannot be auto-carried into a booking.`);
    }
    const cents = Math.round(addonCad * 100);
    addonsTotalCents += cents;
    addons.push({ code, label: addon.name || code, cents, quote_required: false });
  }

  const totalCents = Math.round(baseCad * 100) + addonsTotalCents;
  let depositCents = Math.round((Number(pkg.deposit_cad || 0) || 0) * 100);
  if (depositCents <= 0) depositCents = ["premium_wash", "basic_detail"].includes(pkg.code) ? 5000 : 10000;

  return {
    ok: true,
    package_code: pkg.code,
    package_name: pkg.name || pkg.code,
    vehicle_size: vehicleSize,
    addon_codes: addonCodes,
    addons,
    total_cents: totalCents,
    deposit_cents: depositCents,
    hold_minutes: Number(pricing?.booking_rules?.hold_minutes || 30) || 30,
    catalog_source: pricing?.source || "pricing_catalog"
  };
}

export async function checkCurrentBookingAvailability(env, input = {}) {
  const serviceDate = String(input.service_date || input.serviceDate || "").trim();
  const startSlot = String(input.start_slot || input.startSlot || "").trim().toUpperCase();
  const durationSlots = Number(input.duration_slots || input.durationSlots || 1);
  const holdMinutes = Number(input.hold_minutes || input.holdMinutes || 30) || 30;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) return fail("BOOKING_SLOT_INVALID", "service_date must be YYYY-MM-DD.");
  if (!["AM", "PM"].includes(startSlot) || ![1, 2].includes(durationSlots)) return fail("BOOKING_SLOT_INVALID", "A valid AM/PM start slot and duration are required.");

  const dateRows = await supabaseRows(env, `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(serviceDate)}`);
  if (!dateRows.ok) return fail("BOOKING_AVAILABILITY_CHECK_FAILED", dateRows.error);

  const slotRows = await supabaseRows(env, `/rest/v1/slot_blocks?select=blocked_date,slot,reason&blocked_date=eq.${encodeURIComponent(serviceDate)}`);
  if (!slotRows.ok) return fail("BOOKING_AVAILABILITY_CHECK_FAILED", slotRows.error);

  const holdSince = new Date(Date.now() - holdMinutes * 60 * 1000).toISOString();
  const bookingRows = await supabaseRows(
    env,
    `/rest/v1/bookings?select=id,status,service_date,start_slot,duration_slots,created_at&service_date=eq.${encodeURIComponent(serviceDate)}` +
      `&or=(status.eq.confirmed,and(status.eq.pending,created_at.gte.${encodeURIComponent(holdSince)}))`
  );
  if (!bookingRows.ok) return fail("BOOKING_AVAILABILITY_CHECK_FAILED", bookingRows.error);

  const evaluated = evaluateSlotAvailability({
    dateBlocked: dateRows.rows.length > 0,
    blockedSlots: slotRows.rows.map((row) => row.slot),
    conflicts: bookingRows.rows,
    startSlot,
    durationSlots
  });
  return evaluated.ok ? { ok: true, service_date: serviceDate, start_slot: startSlot, duration_slots: durationSlots } : evaluated;
}

async function supabaseRows(env, path) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}${path}`, { headers: serviceHeaders(env) });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return { ok: false, error: data?.message || text.slice(0, 300) || "Supabase availability query failed." };
    return { ok: true, rows: Array.isArray(data) ? data : [] };
  } catch (err) {
    return { ok: false, error: err?.message || "Supabase availability query failed." };
  }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function fail(code, error) {
  return { ok: false, code, error };
}
