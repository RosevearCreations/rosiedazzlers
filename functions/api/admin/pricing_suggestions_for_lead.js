// Build 175 — catalog-backed package/add-on price suggestions for public leads.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadPricingCatalog } from "../_lib/pricing-catalog.js";

const LEAD_SELECT = [
  "id",
  "topic",
  "full_name",
  "email",
  "phone",
  "service_area",
  "vehicle_count",
  "preferred_cadence",
  "message",
  "photo_estimate_links",
  "status",
  "staff_note",
  "converted_booking_id",
  "created_at",
  "updated_at"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const leadId = cleanText(body.id || body.lead_id);
    const lead = leadId && isUuid(leadId) && hasSupabaseConfig(env)
      ? await loadLead(env, leadId).catch(() => null)
      : null;

    const catalog = await loadPricingCatalog(env);
    const context = normalizeContext({ ...body, ...(lead || {}) });
    const suggestions = buildSuggestions(catalog, context);

    return withCors(json({
      ok: true,
      source: catalog?.source || "pricing_catalog",
      lead,
      context,
      suggestions,
      note: "Staff must confirm vehicle size, condition, access, travel, and quote-required add-ons before sending a final price."
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not build pricing suggestions." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadLead(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?select=${encodeURIComponent(LEAD_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load lead for pricing suggestions."));
  return Array.isArray(data) ? data[0] || null : null;
}

function normalizeContext(row) {
  const message = cleanText(row.message || row.staff_note || "");
  const haystack = [row.topic, row.service_area, row.preferred_cadence, message].join(" ").toLowerCase();
  const vehicleSize = inferVehicleSize(row.vehicle_size || row.vehicle_category || haystack);
  return {
    topic: cleanSlug(row.topic || "general"),
    service_area: cleanText(row.service_area),
    preferred_cadence: cleanText(row.preferred_cadence),
    vehicle_count: Number(row.vehicle_count || 1) || 1,
    vehicle_size: vehicleSize,
    message,
    keywords: Array.from(new Set(haystack.split(/[^a-z0-9]+/).filter((x) => x.length > 2))).slice(0, 25)
  };
}

function inferVehicleSize(value) {
  const text = String(value || "").toLowerCase();
  if (/oversize|large|truck|van|fleet|work|suburban|expedition|crew cab|sprinter|cargo/.test(text)) return "oversize";
  if (/mid|suv|crossover|wagon|minivan|rav|crv|escape|rogue/.test(text)) return "mid";
  if (/small|car|sedan|coupe|hatch|compact|civic|corolla/.test(text)) return "small";
  return "mid";
}

function buildSuggestions(catalog, context) {
  const packages = Array.isArray(catalog?.packages) ? catalog.packages : [];
  const addons = Array.isArray(catalog?.addons) ? catalog.addons : [];
  const message = String(context.message || "").toLowerCase();
  const topic = context.topic;
  const size = context.vehicle_size || "mid";

  const packageScores = packages.map((pkg) => {
    const code = String(pkg.code || "");
    const text = [pkg.name, pkg.subtitle, code, ...(pkg.notes || []), ...(pkg.included_services || []).map((x) => x.name || x)].join(" ").toLowerCase();
    let score = 0;
    if (topic === "fleet" && /complete|interior|exterior|wash/.test(text)) score += 2;
    if (topic === "maintenance" && /premium|basic|wash/.test(text)) score += 2;
    if (/pet|hair|salt|stain|odou?r|shampoo|interior/.test(message) && /interior|complete|basic/.test(text)) score += 4;
    if (/paint|polish|ceramic|coat|wax|sealant|clay|exterior/.test(message) && /exterior|complete|wash/.test(text)) score += 4;
    if (/quick|basic|budget/.test(message) && /basic|premium/.test(text)) score += 2;
    if (/full|deep|complete|whole/.test(message) && /complete/.test(text)) score += 4;
    if (score === 0 && /complete/.test(text)) score = 1;
    return { pkg, score };
  }).filter((row) => row.score > 0).sort((a, b) => b.score - a.score).slice(0, 4).map(({ pkg, score }) => ({
    code: pkg.code,
    name: pkg.name,
    reason: reasonForPackage(pkg, context),
    price_cad: moneyForSize(pkg, size),
    deposit_cad: numberOrNull(pkg.deposit_cad),
    vehicle_size_used: size,
    score
  }));

  const addonScores = addons.map((addon) => {
    const text = [addon.name, addon.code, addon.category, addon.type, addon.requirement_note, ...(addon.notes || [])].join(" ").toLowerCase();
    let score = 0;
    if (/pet|dog|cat|hair/.test(message) && /pet|hair|interior|vacuum/.test(text)) score += 5;
    if (/odou?r|smell|smoke|mildew|mold|mould/.test(message) && /odou?r|ozone|deodor|interior/.test(text)) score += 5;
    if (/salt|stain|shampoo|carpet|seat/.test(message) && /shampoo|salt|interior|seat|carpet/.test(text)) score += 4;
    if (/clay|rough|sap|tar|paint/.test(message) && /clay|decontamination|surface/.test(text)) score += 4;
    if (/polish|scratch|swirl|correction/.test(message) && /polish|correction/.test(text)) score += 5;
    if (/ceramic|coating|graphene|sealant|wax/.test(message) && /ceramic|graphene|sealant|wax|protection/.test(text)) score += 5;
    if (topic === "photo_estimate" && addon.quote_required) score += 1;
    return { addon, score };
  }).filter((row) => row.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map(({ addon, score }) => ({
    code: addon.code,
    name: addon.name,
    reason: reasonForAddon(addon, context),
    price_cad: moneyForSize(addon, size),
    quote_required: addon.quote_required === true,
    requirement_note: addon.requirement_note || null,
    vehicle_size_used: size,
    score
  }));

  const lines = [
    `Catalog-backed pricing suggestions (${size} vehicle size assumption):`,
    packageScores.length ? `Packages: ${packageScores.map(formatSuggestion).join(" | ")}` : "Packages: no strong package match; confirm manually.",
    addonScores.length ? `Add-ons: ${addonScores.map(formatSuggestion).join(" | ")}` : "Add-ons: no strong add-on match from message.",
    "Price note: confirm vehicle size, condition, travel, water/power access, and quote-required items before sending."
  ];

  return {
    vehicle_size_used: size,
    packages: packageScores,
    addons: addonScores,
    copy_text: lines.join("\n")
  };
}

function moneyForSize(row, size) {
  const prices = row?.prices_cad && typeof row.prices_cad === "object" ? row.prices_cad : {};
  const value = numberOrNull(prices[size] ?? prices.mid ?? prices.small ?? prices.oversize ?? row.price_cad);
  return value == null ? null : value;
}

function numberOrNull(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function formatSuggestion(row) { return `${row.name || row.code}${row.price_cad == null ? " (quote)" : ` $${row.price_cad} CAD`}${row.quote_required ? " quote-required" : ""}`; }
function reasonForPackage(pkg, context) { return `Matched to ${context.topic || "lead"} wording and ${context.vehicle_size || "mid"} vehicle-size assumption.`; }
function reasonForAddon(addon, context) { return addon.quote_required ? "Condition-sensitive add-on; confirm from photos before final pricing." : `Matched customer wording with ${context.vehicle_size || "mid"} vehicle-size pricing.`; }
function cleanSlug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_ -]+/g, "").replace(/\s+/g, "_"); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
