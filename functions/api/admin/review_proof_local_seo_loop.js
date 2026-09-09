// Build 365 — Review -> Proof -> Local SEO loop.
// Read-only authority that turns approved customer review evidence into actionable
// local proof opportunities without publishing media or mutating SEO/content state.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

const TARGET_TOWNS = ["Tillsonburg", "Woodstock", "Ingersoll", "Simcoe", "Delhi", "Port Dover", "Norwich", "Aylmer"];
const TARGET_SERVICES = ["Interior detailing", "Exterior detailing", "Complete detail", "Ceramic coating", "Paint correction", "Pet hair removal", "Odour removal", "Headlight restoration"];

export async function onRequestGet({ request, env }) { return handle({ request, env }); }
export async function onRequestPost({ request, env }) { return handle({ request, env }); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function handle({ request, env }) {
  try {
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!env?.SUPABASE_URL) return withCors(json({ ok: false, error: "Supabase runtime is unavailable." }, 503));
    const headers = serviceHeaders(env);

    const [reviewRes, galleryRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_reviews?select=*&order=created_at.desc&limit=250`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.before_after_gallery&limit=1`, { headers })
    ]);
    if (!reviewRes.ok) return withCors(json({ ok: false, error: "Could not load customer review evidence." }, 503));

    const reviewRows = await reviewRes.json().catch(() => []);
    const approvedReviews = (Array.isArray(reviewRows) ? reviewRows : []).filter(isApprovedPublicReview);
    const bookingIds = [...new Set(approvedReviews.map((row) => numericId(row.booking_id)).filter(Boolean))];
    const bookings = await loadBookings(env, headers, bookingIds);
    const bookingMap = new Map(bookings.map((row) => [String(row.id), row]));

    const galleryRows = galleryRes.ok ? await galleryRes.json().catch(() => []) : [];
    const gallery = Array.isArray(galleryRows) ? galleryRows[0]?.value || {} : {};
    const proofItems = normalizePublishedProof(gallery);
    const opportunities = approvedReviews.map((review) => buildOpportunity(review, bookingMap.get(String(numericId(review.booking_id) || "")), proofItems));
    const actionable = opportunities.filter((row) => row.status !== "covered");
    const townCoverage = coverage(TARGET_TOWNS, proofItems, "town");
    const serviceCoverage = coverage(TARGET_SERVICES, proofItems, "service");

    return withCors(json({
      ok: true,
      summary: {
        approved_public_reviews: approvedReviews.length,
        linked_completed_bookings: opportunities.filter((row) => row.booking_completed).length,
        approved_public_proof_items: proofItems.length,
        review_proof_opportunities: actionable.length,
        towns_with_proof: townCoverage.filter((row) => row.count > 0).length,
        services_with_proof: serviceCoverage.filter((row) => row.count > 0).length
      },
      opportunities: actionable,
      covered: opportunities.filter((row) => row.status === "covered"),
      town_coverage: townCoverage,
      service_coverage: serviceCoverage,
      rules: {
        review_authority: "Only approved/public customer_reviews are considered.",
        booking_authority: "A review becomes local-proof actionable only when its linked booking is genuinely completed.",
        media_authority: "Only explicitly published, public-approved, non-sample before/after evidence counts as Rosie proof.",
        publication_authority: "Build 365 is read-only: it recommends proof work but never auto-publishes reviews, gallery media, town pages, or service pages."
      }
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: safeError(err) }, 500));
  }
}

async function loadBookings(env, headers, ids) {
  if (!ids.length) return [];
  const inList = ids.join(",");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=*&id=in.(${inList})&limit=250`, { headers });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

function isApprovedPublicReview(row) {
  const status = clean(row?.status).toLowerCase();
  return ["approved", "published"].includes(status) && (row?.is_public === true || Number(row?.is_public) === 1);
}
function buildOpportunity(review, booking, proofItems) {
  const town = titleCase(first(booking?.town, booking?.city, booking?.customer_city, booking?.service_city, booking?.location));
  const service = titleCase(first(booking?.service_label, booking?.service, booking?.package_name, booking?.package_code));
  const bookingCompleted = isCompleted(booking);
  const matchingProof = proofItems.filter((item) => (!town || slug(item.town) === slug(town)) && (!service || slug(item.service) === slug(service)));
  let status = "needs_booking_context";
  if (bookingCompleted && matchingProof.length) status = "covered";
  else if (bookingCompleted && town && service) status = "ready_for_proof_capture_or_link";
  else if (bookingCompleted) status = "needs_local_context";
  return {
    review_id: review.id || null,
    booking_id: review.booking_id || null,
    rating: Number(review.rating || 0) || null,
    town: town || null,
    service: service || null,
    booking_completed: bookingCompleted,
    matching_public_proof_count: matchingProof.length,
    status,
    recommendation: recommendation(status, town, service)
  };
}
function normalizePublishedProof(value) {
  const items = Array.isArray(value?.items) ? value.items : [];
  return items.filter((item) => {
    const publication = clean(item?.publication_status).toLowerCase();
    const consent = clean(item?.consent_status || item?.media_consent_status).toLowerCase();
    const privacy = clean(item?.media_privacy_status || item?.privacy_status).toLowerCase();
    const proofKind = clean(item?.proof_kind).toLowerCase();
    const hasPair = Boolean(clean(item?.before_url || item?.beforeUrl) && clean(item?.after_url || item?.afterUrl));
    const publicApproved = ["approved_public", "customer_approved_public", "public", "approved"].includes(consent) || ["approved_public", "customer_approved_public", "public"].includes(privacy);
    return publication === "published" && publicApproved && proofKind !== "sample" && hasPair;
  }).map((item) => ({
    town: titleCase(first(item.town, item.city, String(item.location || "").split(",")[0])),
    service: titleCase(first(item.service, item.service_label, item.category, item.addon_name))
  }));
}
function isCompleted(row) {
  return Boolean(row) && clean(row.status).toLowerCase() === "completed" && clean(row.job_status).toLowerCase() === "completed" && Boolean(row.completed_at || row.detailing_completed_at);
}
function coverage(targets, items, key) { return targets.map((label) => ({ label, slug: slug(label), count: items.filter((item) => slug(item[key]) === slug(label)).length })); }
function recommendation(status, town, service) {
  if (status === "covered") return "Existing approved review and published before/after proof already support this completed job.";
  if (status === "ready_for_proof_capture_or_link") return `Use this approved review with customer-approved before/after evidence for ${town} + ${service}; then link the proof from the matching town and service pages.`;
  if (status === "needs_local_context") return "Confirm the completed booking's town and service taxonomy before turning this approved review into local proof.";
  return "Keep this review out of the local proof loop until genuine completed-booking evidence is available.";
}
function numericId(value) { const n = Number.parseInt(String(value ?? ""), 10); return Number.isInteger(n) && n > 0 ? n : 0; }
function first(...values) { for (const value of values) { const text = clean(value); if (text) return text; } return ""; }
function clean(value) { return String(value == null ? "" : value).trim().slice(0, 500); }
function titleCase(value) { return clean(value).replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
function slug(value) { return clean(value).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function safeError(err) { return clean(err?.message || err || "Unexpected Build 365 error.").replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]"); }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
