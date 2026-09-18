// Build 414 — Local search measurement, Search Console and GBP proof.
// Read-only report. First-party analytics and approved local proof are kept separate
// from manually observed provider evidence; provider success is never inferred.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

const SETTING_KEY = "local_search_provider_evidence";
const WINDOW_DAYS = 30;
const SNAPSHOT_FRESH_DAYS = 45;
const TARGET_PATHS = [
  "/tillsonburg-auto-detailing",
  "/woodstock-ingersoll-auto-detailing",
  "/simcoe-delhi-auto-detailing",
  "/port-dover-auto-detailing",
  "/norwich-otterville-auto-detailing",
  "/zorra-thamesford-embro-auto-detailing",
  "/waterford-vittoria-auto-detailing",
  "/port-rowan-turkey-point-auto-detailing",
  "/ceramic-coating",
  "/pet-hair-removal",
  "/odor-removal",
  "/headlight-restoration",
  "/paint-correction",
  "/services",
  "/pricing",
  "/book"
];

export async function onRequestGet(context) { return handle(context); }
export async function onRequestPost(context) { return handle(context); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function handle({ request, env }) {
  try {
    const body = request?.method === "POST" ? await request.json().catch(() => ({})) : {};
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({
        ok: true,
        generated_at: new Date().toISOString(),
        first_party: unavailableFirstParty("Supabase analytics evidence is unavailable."),
        local_proof: unavailableProof("Supabase local-proof evidence is unavailable."),
        providers: {
          search_console: providerState(null, "search_console"),
          google_business_profile: providerState(null, "google_business_profile")
        },
        recommendations: ["Restore the bounded Supabase evidence path before using first-party measurement."],
        rules: evidenceRules()
      }));
    }

    const headers = serviceHeaders(env);
    const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
    const [providerRes, galleryRes, referrerRes, pageRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.${encodeURIComponent(SETTING_KEY)}&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.before_after_gallery&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/site_activity_dimension_daily_rollups?select=rollup_date,dimension_value,count&dimension_type=eq.referrer&rollup_date=gte.${encodeURIComponent(since)}&order=rollup_date.asc&limit=1200`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/site_activity_dimension_daily_rollups?select=rollup_date,dimension_value,count&dimension_type=eq.page_path&rollup_date=gte.${encodeURIComponent(since)}&order=rollup_date.asc&limit=2000`, { headers })
    ]);

    const providerRows = providerRes.ok ? await providerRes.json().catch(() => []) : [];
    const providerValue = Array.isArray(providerRows) && providerRows[0]?.value && typeof providerRows[0].value === "object"
      ? providerRows[0].value
      : {};

    const galleryRows = galleryRes.ok ? await galleryRes.json().catch(() => []) : [];
    const galleryValue = Array.isArray(galleryRows) && galleryRows[0]?.value && typeof galleryRows[0].value === "object"
      ? galleryRows[0].value
      : {};

    const referrerRows = referrerRes.ok ? await referrerRes.json().catch(() => []) : [];
    const pageRows = pageRes.ok ? await pageRes.json().catch(() => []) : [];

    const firstParty = referrerRes.ok && pageRes.ok
      ? summarizeFirstParty(referrerRows, pageRows, since)
      : unavailableFirstParty("First-party analytics rollups could not be read.");
    const localProof = galleryRes.ok
      ? summarizeLocalProof(galleryValue)
      : unavailableProof("Approved local-proof evidence could not be read.");

    const providers = {
      search_console: providerState(providerValue.search_console, "search_console"),
      google_business_profile: providerState(providerValue.google_business_profile, "google_business_profile")
    };

    return withCors(json({
      ok: true,
      generated_at: new Date().toISOString(),
      window_days: WINDOW_DAYS,
      first_party: firstParty,
      local_proof: localProof,
      providers,
      recommendations: buildRecommendations(firstParty, localProof, providers),
      rules: evidenceRules()
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: safeError(err) }, 500));
  }
}

function summarizeFirstParty(referrerRows, pageRows, since) {
  const referrers = aggregate(referrerRows);
  const pages = aggregate(pageRows);
  const googleReferrals = [...referrers.entries()]
    .filter(([label]) => /(^|\.)google\.|google$/i.test(normalizeHost(label)) || /google/i.test(label))
    .reduce((sum, [, count]) => sum + count, 0);

  const target = TARGET_PATHS.map((path) => ({ path, views: Number(pages.get(path) || pages.get(path + "/") || 0) }))
    .filter((row) => row.views > 0)
    .sort((a, b) => b.views - a.views);

  return {
    classification: "runtime_proven",
    evidence_state: "first_party_observed",
    source: "Rosie Dazzlers site activity rollups",
    window_start: since,
    window_end: new Date().toISOString().slice(0, 10),
    google_referral_events: googleReferrals,
    target_local_service_page_views: target.reduce((sum, row) => sum + row.views, 0),
    target_pages_with_observed_views: target.length,
    top_target_pages: target.slice(0, 10),
    interpretation: "Google referral and on-site page-view evidence describes observed Rosie traffic only. It does not prove Search Console rankings, impressions, indexing, map visibility, or GBP performance."
  };
}

function summarizeLocalProof(value) {
  const items = Array.isArray(value?.items) ? value.items : [];
  const approved = items.filter((item) => {
    const publication = clean(item?.publication_status).toLowerCase();
    const proofKind = clean(item?.proof_kind).toLowerCase();
    const consent = clean(item?.consent_status || item?.media_consent_status).toLowerCase();
    const privacy = clean(item?.media_privacy_status || item?.privacy_status).toLowerCase();
    const pair = Boolean(clean(item?.before_url || item?.beforeUrl) && clean(item?.after_url || item?.afterUrl));
    const publicApproved = ["approved_public", "customer_approved_public", "public", "approved"].includes(consent)
      || ["approved_public", "customer_approved_public", "public"].includes(privacy);
    return publication === "published" && proofKind !== "sample" && publicApproved && pair;
  });

  const towns = new Set(approved.map((item) => clean(item?.town || item?.city || "").toLowerCase()).filter(Boolean));
  const services = new Set(approved.map((item) => clean(item?.service || item?.service_label || item?.category || "").toLowerCase()).filter(Boolean));
  return {
    classification: "runtime_proven",
    evidence_state: "approved_public_proof_observed",
    source: "Published customer-approved before/after evidence",
    approved_public_non_sample_pairs: approved.length,
    towns_with_published_proof: towns.size,
    services_with_published_proof: services.size,
    interpretation: "Only published, public-approved, non-sample before/after pairs count. Proof coverage does not imply ranking or indexing success."
  };
}

function providerState(raw, provider) {
  const snapshot = sanitizeSnapshot(raw, provider);
  if (!snapshot) {
    return {
      classification: "provider_dependent",
      evidence_state: "unavailable",
      provider,
      observed_at: null,
      metrics: {},
      action: provider === "search_console"
        ? "Open Search Console, choose the verified Rosie Dazzlers property and record a dated performance snapshot."
        : "Open Google Business Profile performance for the Rosie Dazzlers location and record a dated performance snapshot.",
      interpretation: "No provider result is inferred from source markup, first-party analytics, or configuration."
    };
  }
  const ageDays = Math.max(0, Math.floor((Date.now() - Date.parse(snapshot.observed_at)) / 86400000));
  const stale = ageDays > SNAPSHOT_FRESH_DAYS;
  return {
    classification: "owner_action",
    evidence_state: stale ? "stale_observed_snapshot" : "observed_snapshot",
    provider,
    freshness_days: ageDays,
    freshness_limit_days: SNAPSHOT_FRESH_DAYS,
    ...snapshot,
    action: stale ? "Refresh this provider snapshot before using it for current local-search decisions." : "Use this as dated provider evidence only; refresh it when the measurement window changes.",
    interpretation: "This is a manually observed provider snapshot. It is source-attributed evidence, not a live API assertion and not a guarantee of future ranking or visibility."
  };
}

function sanitizeSnapshot(raw, provider) {
  if (!raw || typeof raw !== "object") return null;
  const observedAt = clean(raw.observed_at);
  const periodStart = clean(raw.period_start);
  const periodEnd = clean(raw.period_end);
  const label = clean(raw.label);
  if (!observedAt || Number.isNaN(Date.parse(observedAt)) || !periodStart || !periodEnd || !label) return null;
  const allowed = provider === "search_console"
    ? ["clicks", "impressions", "ctr_percent", "average_position"]
    : ["profile_views", "website_clicks", "calls", "direction_requests"];
  const metrics = {};
  for (const key of allowed) {
    const n = Number(raw?.metrics?.[key]);
    if (Number.isFinite(n) && n >= 0) metrics[key] = n;
  }
  if (!Object.keys(metrics).length) return null;
  return {
    label: label.slice(0, 160),
    observed_at: new Date(observedAt).toISOString(),
    period_start: periodStart.slice(0, 10),
    period_end: periodEnd.slice(0, 10),
    metrics,
    source_note: clean(raw.source_note).slice(0, 300) || null,
    recorded_at: clean(raw.recorded_at) || null
  };
}

function aggregate(rows) {
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const label = clean(row?.dimension_value) || "Unknown";
    map.set(label, (map.get(label) || 0) + Number(row?.count || 0));
  }
  return map;
}
function normalizeHost(value) {
  try { return new URL(clean(value), "https://example.invalid").hostname.toLowerCase(); }
  catch { return clean(value).toLowerCase(); }
}
function buildRecommendations(firstParty, localProof, providers) {
  const out = [];
  if (providers.search_console.evidence_state === "unavailable") out.push("Record a dated Search Console performance snapshot before making query/ranking/indexing claims.");
  else if (providers.search_console.evidence_state.startsWith("stale_")) out.push("Refresh the Search Console snapshot; the retained provider evidence is stale.");
  if (providers.google_business_profile.evidence_state === "unavailable") out.push("Record a dated Google Business Profile performance snapshot before making Maps/profile visibility claims.");
  else if (providers.google_business_profile.evidence_state.startsWith("stale_")) out.push("Refresh the Google Business Profile snapshot; the retained provider evidence is stale.");
  if (firstParty.classification !== "runtime_proven") out.push("Restore first-party analytics rollups before evaluating local landing-page traffic.");
  if (localProof.classification !== "runtime_proven" || Number(localProof.approved_public_non_sample_pairs || 0) === 0) out.push("Add or approve genuine published before/after proof before expanding local proof claims.");
  if (!out.length) out.push("Evidence sources are present. Compare changes over matched date windows before changing local SEO priorities.");
  return out;
}
function unavailableFirstParty(reason) {
  return { classification: "unavailable", evidence_state: "unavailable", source: "Rosie Dazzlers site activity rollups", reason, google_referral_events: null, target_local_service_page_views: null, target_pages_with_observed_views: null, top_target_pages: [] };
}
function unavailableProof(reason) {
  return { classification: "unavailable", evidence_state: "unavailable", source: "Published customer-approved before/after evidence", reason, approved_public_non_sample_pairs: null, towns_with_published_proof: null, services_with_published_proof: null };
}
function evidenceRules() {
  return {
    separation: "First-party analytics, local proof, Search Console and Google Business Profile are separate evidence sources.",
    provider_truth: "Search Console/GBP success is never inferred from markup, canonical tags, structured data, Google referrals, or local proof.",
    attribution: "Provider metrics are retained only as dated operator-observed snapshots with property/location labels and measurement windows.",
    freshness: `Provider snapshots older than ${SNAPSHOT_FRESH_DAYS} days are stale and require owner refresh.`,
    safety: "The report is read-only. It does not contact Google APIs, change rankings, publish content, mutate provider state, or poll in the background."
  };
}
function hasSupabaseConfig(env) { return Boolean(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function clean(value) { return String(value == null ? "" : value).trim(); }
function safeError(err) { return clean(err?.message || err || "Could not build local-search measurement report.").replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]").slice(0, 500); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
