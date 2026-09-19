// Build 440 — pure local-search provider evidence refresh/reconciliation helper.
// Provider snapshots remain operator-observed evidence. No ranking/indexing/Maps result is inferred.

const PROVIDER_KEYS = Object.freeze(["search_console", "google_business_profile"]);
const PROVIDER_LABELS = Object.freeze({
  search_console: "Google Search Console",
  google_business_profile: "Google Business Profile"
});
const METRIC_KEYS = Object.freeze({
  search_console: ["clicks", "impressions", "ctr_percent", "average_position"],
  google_business_profile: ["profile_views", "website_clicks", "calls", "direction_requests"]
});

export function buildLocalSearchProviderEvidenceRefresh({ measurement = {}, generated_at = null } = {}) {
  const generatedAt = validIso(generated_at) || new Date().toISOString();
  const firstParty = summarizeFirstParty(measurement?.first_party);
  const localProof = summarizeLocalProof(measurement?.local_proof);
  const providers = PROVIDER_KEYS.map((key) => summarizeProvider(
    key,
    measurement?.providers?.[key],
    firstParty,
    generatedAt
  ));

  const counts = {
    total_providers: providers.length,
    observed: providers.filter((item) => item.classification === "observed").length,
    provider_dependent: providers.filter((item) => item.classification === "provider_dependent").length,
    owner_action: providers.filter((item) => item.classification === "owner_action").length,
    refresh_required: providers.filter((item) => item.refresh_required === true).length
  };

  let status = "observed";
  if (counts.provider_dependent > 0) status = "provider_dependent";
  else if (counts.owner_action > 0) status = "owner_action";
  else if (!firstParty.available || !localProof.available) status = "unavailable";

  const actions = unique([
    ...providers.filter((item) => item.refresh_required).map((item) => item.safe_next_action),
    !firstParty.available ? "Restore the bounded first-party analytics evidence source before comparing provider evidence with on-site traffic." : "",
    !localProof.available ? "Restore the approved public local-proof evidence source before using proof coverage in local-search decisions." : ""
  ].filter(Boolean));

  return {
    build: 440,
    authority: "local_search_provider_evidence_refresh",
    generated_at: generatedAt,
    status,
    counts,
    providers,
    reconciliation: {
      first_party: firstParty,
      local_proof: localProof,
      interpretation: "Provider snapshots, first-party traffic and approved local proof are shown side by side only. None of these sources is used to infer ranking, indexing, Maps visibility or future Google performance."
    },
    actions,
    boundaries: {
      read_only: true,
      manual_refresh_only: true,
      google_provider_contact_performed: false,
      provider_snapshot_write_performed: false,
      ranking_outcome_inferred: false,
      indexing_outcome_inferred: false,
      maps_visibility_inferred: false,
      fabricated_review_or_location_allowed: false,
      third_party_publishing_allowed: false,
      ad_spend_mutation_allowed: false,
      dns_mutation_allowed: false,
      customer_outreach_allowed: false,
      permanent_polling: false
    }
  };
}

function summarizeProvider(key, raw, firstParty, generatedAt) {
  const source = objectOrEmpty(raw);
  const label = clean(source.label).slice(0, 160) || null;
  const periodStart = dateOnly(source.period_start);
  const periodEnd = dateOnly(source.period_end);
  const observedAt = validIso(source.observed_at);
  const explicitIdentity = Boolean(label && periodStart && periodEnd && observedAt);
  const evidenceState = clean(source.evidence_state).toLowerCase();
  const reportedFreshness = finiteWhole(source.freshness_days);
  const freshnessLimit = finiteWhole(source.freshness_limit_days) ?? 45;
  const measuredAge = observedAt ? daysBetween(observedAt, generatedAt) : null;
  const freshnessDays = reportedFreshness ?? measuredAge;
  const missing = evidenceState === "unavailable" || !explicitIdentity;
  const stale = !missing && (
    evidenceState === "stale_observed_snapshot"
    || (freshnessDays != null && freshnessDays > freshnessLimit)
  );

  let classification = "observed";
  let state = "observed_snapshot";
  let refreshRequired = false;
  let safeNextAction = "Keep this dated provider snapshot source-attributed and refresh it when the provider measurement window changes.";

  if (missing) {
    classification = "provider_dependent";
    state = explicitIdentity ? "provider_snapshot_unavailable" : "provider_identity_or_window_missing";
    refreshRequired = true;
    safeNextAction = key === "search_console"
      ? "Open the verified Rosie Dazzlers Search Console property and record a dated performance snapshot with explicit property and measurement-window identity."
      : "Open Rosie Dazzlers Google Business Profile Performance and record a dated snapshot with explicit location and measurement-window identity.";
  } else if (stale) {
    classification = "owner_action";
    state = "stale_observed_snapshot";
    refreshRequired = true;
    safeNextAction = `Refresh the dated ${PROVIDER_LABELS[key]} snapshot before using it for current local-search decisions.`;
  }

  const metrics = {};
  for (const metric of METRIC_KEYS[key]) {
    const value = Number(source?.metrics?.[metric]);
    if (Number.isFinite(value) && value >= 0) metrics[metric] = value;
  }

  return {
    provider: key,
    provider_label: PROVIDER_LABELS[key],
    classification,
    evidence_state: state,
    refresh_required: refreshRequired,
    identity: {
      label,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      observed_at: observedAt,
      explicit: explicitIdentity
    },
    freshness_days: freshnessDays,
    freshness_limit_days: freshnessLimit,
    metrics,
    first_party_window_overlap: windowOverlap(periodStart, periodEnd, firstParty.window_start, firstParty.window_end),
    safe_next_action: safeNextAction,
    interpretation: "This is operator-observed provider evidence only. It is not a live Google API assertion and does not prove ranking, indexing, Maps visibility or future performance."
  };
}

function summarizeFirstParty(raw) {
  const source = objectOrEmpty(raw);
  const available = clean(source.classification) === "runtime_proven"
    && clean(source.evidence_state) === "first_party_observed";
  return {
    available,
    classification: available ? "observed" : "unavailable",
    source: clean(source.source) || "Rosie Dazzlers first-party analytics",
    window_start: dateOnly(source.window_start) || null,
    window_end: dateOnly(source.window_end) || null,
    google_referral_events: nonnegativeNumber(source.google_referral_events),
    target_local_service_page_views: nonnegativeNumber(source.target_local_service_page_views),
    target_pages_with_observed_views: nonnegativeNumber(source.target_pages_with_observed_views),
    interpretation: "First-party traffic describes visits observed by Rosie Dazzlers. It does not prove Search Console impressions/rankings, indexing or Maps visibility."
  };
}

function summarizeLocalProof(raw) {
  const source = objectOrEmpty(raw);
  const available = clean(source.classification) === "runtime_proven"
    && clean(source.evidence_state) === "approved_public_proof_observed";
  return {
    available,
    classification: available ? "observed" : "unavailable",
    source: clean(source.source) || "Rosie Dazzlers approved public proof",
    approved_public_non_sample_pairs: nonnegativeNumber(source.approved_public_non_sample_pairs),
    towns_with_published_proof: nonnegativeNumber(source.towns_with_published_proof),
    services_with_published_proof: nonnegativeNumber(source.services_with_published_proof),
    interpretation: "Approved local proof supports truthful service-area/content claims only; it does not prove Google ranking, indexing or profile performance."
  };
}

function windowOverlap(aStart, aEnd, bStart, bEnd) {
  if (![aStart, aEnd, bStart, bEnd].every(dateOnly)) return null;
  return aStart <= bEnd && bStart <= aEnd;
}

function daysBetween(earlier, later) {
  const a = Date.parse(earlier);
  const b = Date.parse(later);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((b - a) / 86400000));
}

function dateOnly(value) {
  const text = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const parsed = Date.parse(text + "T00:00:00Z");
  return Number.isFinite(parsed) ? text : "";
}
function validIso(value) {
  const text = clean(value);
  if (!text || !Number.isFinite(Date.parse(text))) return null;
  return new Date(text).toISOString();
}
function nonnegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
function finiteWhole(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
}
function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function clean(value) {
  return String(value ?? "").trim();
}
function unique(values) {
  return [...new Set(values)];
}
