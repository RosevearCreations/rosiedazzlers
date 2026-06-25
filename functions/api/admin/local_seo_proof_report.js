// Build 177 / Build 178 / Build 196 — local SEO proof coverage report plus next proof recommendations from privacy-approved gallery evidence.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

const TARGET_TOWNS = ["Tillsonburg", "Woodstock", "Ingersoll", "Simcoe", "Delhi", "Port Dover", "Norwich", "Aylmer"];
const TARGET_SERVICES = ["Interior detailing", "Exterior detailing", "Complete detail", "Ceramic coating", "Paint correction", "Pet hair removal", "Odour removal", "Headlight restoration"];
const DEFAULT_GALLERY = { items: [
  { title: "Interior refresh", town: "Tillsonburg", service: "Interior detailing", before_url: "sample-before", after_url: "sample-after", consent_status: "sample", media_privacy_status: "approved_public" },
  { title: "Exterior wash and gloss", town: "Woodstock", service: "Exterior detailing", before_url: "sample-before", after_url: "sample-after", consent_status: "sample", media_privacy_status: "approved_public" }
] };

async function handleLocalSeoProofReport({ request, env }) {
  try {
    const body = request?.method === "POST" ? await request.json().catch(() => ({})) : {};
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const gallery = await loadGallery(env);
    const rows = normalizeGallery(gallery);
    const approved = rows.filter(isPublicApproved);
    const blocked = rows.filter((row) => !isPublicApproved(row));
    const towns = coverageRows(TARGET_TOWNS, approved, "town");
    const services = coverageRows(TARGET_SERVICES, approved, "service");
    const strongest_towns = topRows(approved, "town");
    const strongest_services = topRows(approved, "service");
    const proof_recommendations = buildProofRecommendations(towns, services, approved);

    return withCors(json({
      ok: true,
      summary: {
        approved_public_items: approved.length,
        blocked_private_or_pending_items: blocked.length,
        towns_with_proof: towns.filter((row) => row.count > 0).length,
        services_with_proof: services.filter((row) => row.count > 0).length,
        target_towns: towns.length,
        target_services: services.length,
        next_best_gap: firstGap(towns, services)
      },
      towns,
      services,
      strongest_towns,
      strongest_services,
      proof_recommendations,
      recommendations: proof_recommendations,
      next_proof_recommendations: proof_recommendations,
      gaps: proof_recommendations,
      privacy_rule: "Only sample or approved-public/customer-approved-public media counts as local proof. Pending/private/needs-blur/rejected items are excluded.",
      recommendation: "Prioritize before/after proof for target town + service combinations that have zero approved public examples, then link those examples from service and town pages."
    }));
  } catch (err) {
    return withCors(json({ ok: true, summary: { approved_public_items: 0, blocked_private_or_pending_items: 0 }, towns: [], services: [], warning: err?.message || "Could not build local SEO proof report." }));
  }
}

export async function onRequestPost(context) { return handleLocalSeoProofReport(context); }
export async function onRequestGet(context) { return handleLocalSeoProofReport(context); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadGallery(env) {
  if (!env?.SUPABASE_URL || !(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)) return clone(DEFAULT_GALLERY);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.before_after_gallery&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return clone(DEFAULT_GALLERY);
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return row?.value || clone(DEFAULT_GALLERY);
}

function normalizeGallery(value) {
  const items = Array.isArray(value?.items) ? value.items : [];
  return items.map((item) => ({
    title: String(item?.title || "Detail result").trim(),
    town: titleCase(String(item?.town || item?.location || "Oxford / Norfolk").split(",")[0]),
    service: titleCase(String(item?.service || item?.service_label || item?.category || "Mobile detailing")),
    consent_status: String(item?.consent_status || item?.media_consent_status || "").trim().toLowerCase(),
    media_privacy_status: String(item?.media_privacy_status || item?.privacy_status || "").trim().toLowerCase(),
    before_url: String(item?.before_url || "").trim(),
    after_url: String(item?.after_url || "").trim()
  })).filter((item) => item.before_url && item.after_url);
}

function isPublicApproved(item) {
  const consent = String(item.consent_status || "").toLowerCase();
  const privacy = String(item.media_privacy_status || "").toLowerCase();
  if (consent === "sample") return true;
  if (["rejected", "private", "approved_private", "pending", "pending_review", "needs_blur"].includes(consent)) return false;
  if (["rejected", "approved_private", "pending_review", "needs_blur"].includes(privacy)) return false;
  return ["approved_public", "customer_approved_public", "public", "approved"].includes(consent) || ["approved_public", "customer_approved_public", "public"].includes(privacy);
}

function buildProofRecommendations(towns, services, approved) {
  const missingTowns = towns.filter((row) => row.count === 0).map((row) => row.label);
  const missingServices = services.filter((row) => row.count === 0).map((row) => row.label);
  const pairs = [];
  for (const town of missingTowns.slice(0, 6)) {
    const service = missingServices[pairs.length % Math.max(1, missingServices.length)] || services.find((row) => row.count < 2)?.label || "Complete detail";
    pairs.push({ town, service, priority: "high", recommendation: `Create or approve one before/after gallery item for ${town} + ${service}, then link it from the related town and service pages.` });
  }
  if (!pairs.length) {
    const service = services.find((row) => row.count < 2);
    const town = towns.find((row) => row.count < 2);
    if (town || service) pairs.push({ town: town?.label || "highest-value town", service: service?.label || "highest-value service", priority: "medium", recommendation: "Add a second approved public example so local proof is not dependent on a single media item." });
  }
  if (!pairs.length && approved.length) pairs.push({ town: "All priority towns", service: "All priority services", priority: "maintenance", recommendation: "Keep adding fresh seasonal proof and rotate older examples into service/town pages." });
  return pairs;
}

function coverageRows(targets, approved, key) {
  return targets.map((label) => {
    const wanted = slugify(label);
    const count = approved.filter((row) => slugify(row[key]) === wanted).length;
    return { label, slug: wanted, count, status: count > 0 ? "has_proof" : "needs_proof" };
  });
}
function topRows(rows, key) { const map = new Map(); for (const row of rows) { const label = row[key] || "Unknown"; map.set(label, (map.get(label) || 0) + 1); } return Array.from(map.entries()).map(([label, count]) => ({ label, count })).sort((a,b)=>b.count-a.count).slice(0,8); }
function firstGap(towns, services) { const town = towns.find((row) => row.count === 0); const service = services.find((row) => row.count === 0); if (town && service) return `${town.label} + ${service.label}`; if (town) return `${town.label} local proof`; if (service) return `${service.label} proof`; return "Add fresh approved examples and link them from service/town pages."; }
function titleCase(value) { return String(value || "").trim().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
function slugify(value) { return String(value || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
