// Build 450/460 — pure Local Search Measurement & Conversion Attribution + evidence-quality helper.
// Reconciles retained provider evidence with privacy-safe first-party same-session funnel evidence.
// It never joins anonymous sessions to customer identity and never infers Google ranking/indexing outcomes.

const TARGET_PATHS = Object.freeze([
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
]);

export function buildLocalSearchMeasurementConversionAttribution(input = {}) {
  const generatedAt = validIso(input.generated_at) || new Date().toISOString();
  const providerRefresh = objectOrEmpty(input.provider_refresh);
  const firstParty = objectOrEmpty(providerRefresh?.reconciliation?.first_party);
  const providers = safeArray(providerRefresh.providers);
  const attribution = deriveSameSessionConversionAttribution(
    input.events,
    input.events_available !== false,
    input.events_truncated_possible === true
  );

  const providerRows = providers.map((row) => ({
    provider: clean(row.provider) || "unknown",
    provider_label: clean(row.provider_label) || clean(row.provider) || "Provider",
    classification: clean(row.classification) || "provider_dependent",
    evidence_state: clean(row.evidence_state) || "unavailable",
    observed_at: row?.identity?.observed_at || null,
    period_start: row?.identity?.period_start || null,
    period_end: row?.identity?.period_end || null,
    first_party_window_overlap: row.first_party_window_overlap ?? null,
    identity_explicit: row?.identity?.explicit === true,
    freshness_days: finiteWholeOrNull(row.freshness_days),
    freshness_limit_days: finiteWholeOrNull(row.freshness_limit_days),
    refresh_required: row.refresh_required === true,
    session_level_join_performed: false
  }));

  const providerObserved = providerRows.filter((row) => row.classification === "observed").length;
  const providerHold = providerRows.length - providerObserved;
  const firstPartyAvailable = firstParty.available === true;
  const firstPartyWindow = {
    start: firstParty.window_start || null,
    end: firstParty.window_end || null
  };
  const evidenceQuality = buildProviderAttributionEvidenceQuality({
    provider_rows: providerRows,
    first_party_available: firstPartyAvailable,
    first_party_window: firstPartyWindow,
    attribution
  });

  let status = "observed";
  if (!attribution.available) status = "unavailable";
  else if (attribution.rows_truncated_possible) status = "bounded_partial";

  const actions = unique([
    ...safeArray(providerRefresh.actions),
    !attribution.available
      ? "Restore the bounded site_activity_events evidence source before using same-session local-search conversion attribution."
      : "",
    attribution.rows_truncated_possible
      ? "Treat same-session attribution counts as lower-bound evidence because the bounded analytics row limit may have truncated the window."
      : "",
    !firstPartyAvailable
      ? "Restore the retained first-party landing-page/referral rollup source before comparing local acquisition traffic with booking-funnel evidence."
      : ""
  ].filter(Boolean));

  return {
    build: 450,
    evidence_quality_build: 460,
    authority: "local_search_measurement_conversion_attribution",
    evidence_quality_authority: "local_search_provider_attribution_evidence_quality",
    retained_provider_authority: "local_search_provider_evidence_refresh",
    generated_at: generatedAt,
    status,
    summary: {
      provider_state: clean(providerRefresh.status) || "unavailable",
      provider_observed_count: providerObserved,
      provider_hold_count: providerHold,
      first_party_rollup_available: firstPartyAvailable,
      same_session_attribution_available: attribution.available,
      same_session_rows_truncated_possible: attribution.rows_truncated_possible
    },
    provider_evidence: providerRows,
    first_party_window: firstPartyWindow,
    conversion_attribution: attribution,
    evidence_quality: evidenceQuality,
    reconciliation: {
      interpretation: "Dated Search Console / Google Business Profile snapshots, first-party landing/referral rollups and anonymous same-session booking funnel evidence are reconciled side by side. Provider metrics are not joined to individual sessions and no causal Google outcome is inferred.",
      provider_window_overlap_is_correlation_only: true,
      first_party_same_session_attribution_is_observed_not_causal: true,
      provider_metric_to_funnel_rate_comparison_performed: false,
      cross_source_correlation_score_calculated: false
    },
    actions,
    truth_boundary: {
      ranking_outcome_inferred: false,
      indexing_outcome_inferred: false,
      maps_visibility_inferred: false,
      search_console_click_to_session_join: false,
      gbp_action_to_session_join: false,
      provider_metric_to_booking_join: false,
      first_party_same_session_causation_inferred: false,
      anonymous_session_to_customer_identity_join: false,
      persisted_booking_attributed_to_anonymous_session: false,
      provider_metric_correlation_score_calculated: false,
      provider_outcome_to_funnel_causation_claimed: false,
      cross_source_identity_join_performed: false,
      customer_identity_exposed: false
    },
    boundaries: {
      read_only: true,
      manual_refresh_only: true,
      schema_authority: false,
      analytics_write_performed: false,
      provider_contact_performed: false,
      provider_snapshot_write_performed: false,
      content_publishing_allowed: false,
      ad_spend_mutation_allowed: false,
      dns_mutation_allowed: false,
      customer_outreach_allowed: false,
      permanent_polling: false
    }
  };
}


export function buildProviderAttributionEvidenceQuality({
  provider_rows = [],
  first_party_available = false,
  first_party_window = {},
  attribution = {}
} = {}) {
  const rows = safeArray(provider_rows).map((row) => {
    const classification = clean(row?.classification) || "provider_dependent";
    const overlap = row?.first_party_window_overlap;
    const attributionAvailable = attribution?.available === true;
    const truncated = attribution?.rows_truncated_possible === true;
    const firstPartyAvailable = first_party_available === true;

    let comparisonState = "comparable_observed";
    if (classification === "provider_dependent") comparisonState = "provider_dependent";
    else if (classification === "owner_action") comparisonState = "owner_action";
    else if (!firstPartyAvailable || !attributionAvailable) comparisonState = "unavailable";
    else if (truncated) comparisonState = "bounded_partial";
    else if (overlap === false) comparisonState = "window_mismatch";
    else if (overlap !== true) comparisonState = "window_unknown";

    return {
      provider: clean(row?.provider) || "unknown",
      provider_label: clean(row?.provider_label) || clean(row?.provider) || "Provider",
      provider_classification: classification,
      comparison_state: comparisonState,
      provider_identity_complete: row?.identity_explicit === true,
      provider_freshness_state: classification === "provider_dependent"
        ? "missing_or_incomplete"
        : classification === "owner_action"
          ? "stale"
          : "current",
      provider_freshness_days: finiteWholeOrNull(row?.freshness_days),
      provider_freshness_limit_days: finiteWholeOrNull(row?.freshness_limit_days),
      provider_window_overlap: overlap === true ? "overlap" : overlap === false ? "nonoverlap" : "unknown",
      first_party_available: firstPartyAvailable,
      same_session_attribution_available: attributionAvailable,
      same_session_rows_truncated_possible: truncated,
      provider_metric_to_session_join_performed: false,
      provider_metric_to_funnel_rate_comparison_performed: false,
      causal_conversion_claimed: false,
      interpretation: comparisonState === "comparable_observed"
        ? "Provider and first-party windows are comparable as dated descriptive evidence only. Provider outcomes remain distinct from anonymous same-session funnel observations."
        : comparisonState === "window_mismatch"
          ? "Provider and first-party windows do not overlap; show the evidence separately and do not compare the periods as if they represented the same observation window."
          : comparisonState === "window_unknown"
            ? "Provider/first-party window alignment cannot be established from the retained dated evidence."
            : comparisonState === "bounded_partial"
              ? "Provider evidence may be current, but same-session analytics are bounded/truncated; treat attribution counts as lower-bound observations."
              : comparisonState === "unavailable"
                ? "First-party or same-session evidence is unavailable; cross-source reconciliation is not guessed."
                : "Provider evidence still requires owner/provider action before current cross-source reconciliation."
    };
  });

  const counts = {
    total_providers: rows.length,
    comparable_observed: rows.filter((row) => row.comparison_state === "comparable_observed").length,
    provider_dependent: rows.filter((row) => row.comparison_state === "provider_dependent").length,
    owner_action: rows.filter((row) => row.comparison_state === "owner_action").length,
    unavailable: rows.filter((row) => row.comparison_state === "unavailable").length,
    bounded_partial: rows.filter((row) => row.comparison_state === "bounded_partial").length,
    window_mismatch: rows.filter((row) => row.comparison_state === "window_mismatch").length,
    window_unknown: rows.filter((row) => row.comparison_state === "window_unknown").length
  };

  let status = "comparable_observed";
  if (counts.provider_dependent > 0) status = "provider_dependent";
  else if (counts.owner_action > 0) status = "owner_action";
  else if (counts.unavailable > 0) status = "unavailable";
  else if (counts.bounded_partial > 0) status = "bounded_partial";
  else if (counts.window_mismatch > 0) status = "window_mismatch";
  else if (counts.window_unknown > 0) status = "window_unknown";

  return {
    build: 460,
    authority: "local_search_provider_attribution_evidence_quality",
    status,
    counts,
    first_party_window: {
      start: first_party_window?.start || null,
      end: first_party_window?.end || null
    },
    providers: rows,
    comparison_rules: {
      dated_windows_required_for_comparability: true,
      provider_freshness_required_for_current_comparison: true,
      provider_metrics_remain_source_attributed: true,
      provider_metric_to_funnel_rate_comparison_performed: false,
      provider_outcome_to_funnel_causation_claimed: false,
      provider_metric_correlation_score_calculated: false,
      cross_source_identity_join_performed: false,
      same_session_is_observed_path_only: true
    },
    interpretation: "Evidence quality describes whether dated provider snapshots and anonymous first-party funnel observations are sufficiently current and window-aligned to review side by side. It does not turn provider outcomes into session identity, a causal conversion claim or a marketing-performance score."
  };
}

export function deriveSameSessionConversionAttribution(events = [], available = true, truncated = false) {
  if (!available) return unavailableAttribution();

  const sessions = new Map();
  for (const row of safeArray(events)) {
    const sessionId = clean(row?.session_id).slice(0, 128);
    if (!sessionId) continue;
    if (!sessions.has(sessionId)) sessions.set(sessionId, []);
    sessions.get(sessionId).push(row);
  }

  const cohortSets = {
    all: new Set(),
    google_referral: new Set(),
    local_target_landing: new Set(),
    google_referral_local_target_landing: new Set()
  };
  const landingStats = new Map();

  for (const [sessionId, rows] of sessions) {
    rows.sort((a, b) => timestamp(a?.created_at) - timestamp(b?.created_at));
    const first = rows.find((row) => clean(row?.page_path)) || rows[0] || {};
    const landingPath = normalizePath(first?.page_path);
    const googleReferral = isGoogleSource(first?.referrer, first?.source);
    const localLanding = TARGET_PATHS.includes(landingPath);
    const stages = bookingStages(rows);

    cohortSets.all.add(sessionId);
    if (googleReferral) cohortSets.google_referral.add(sessionId);
    if (localLanding) cohortSets.local_target_landing.add(sessionId);
    if (googleReferral && localLanding) cohortSets.google_referral_local_target_landing.add(sessionId);

    if (localLanding) {
      if (!landingStats.has(landingPath)) {
        landingStats.set(landingPath, {
          path: landingPath,
          sessions: 0,
          google_referral_sessions: 0,
          booking_start_sessions: 0,
          checkout_started_sessions: 0,
          checkout_completed_sessions: 0
        });
      }
      const stat = landingStats.get(landingPath);
      stat.sessions += 1;
      if (googleReferral) stat.google_referral_sessions += 1;
      if (stages.booking_start) stat.booking_start_sessions += 1;
      if (stages.checkout_started) stat.checkout_started_sessions += 1;
      if (stages.checkout_completed) stat.checkout_completed_sessions += 1;
    }
  }

  const cohort = (ids) => {
    let bookingStart = 0;
    let checkoutStarted = 0;
    let checkoutCompleted = 0;
    for (const sessionId of ids) {
      const stages = bookingStages(sessions.get(sessionId) || []);
      if (stages.booking_start) bookingStart += 1;
      if (stages.checkout_started) checkoutStarted += 1;
      if (stages.checkout_completed) checkoutCompleted += 1;
    }
    return {
      sessions: ids.size,
      booking_start_sessions: bookingStart,
      checkout_started_sessions: checkoutStarted,
      checkout_completed_sessions: checkoutCompleted,
      session_to_booking_start_pct: pct(bookingStart, ids.size),
      session_to_checkout_completion_pct: pct(checkoutCompleted, ids.size),
      booking_start_to_checkout_completion_pct: pct(checkoutCompleted, bookingStart)
    };
  };

  const topLandingPages = [...landingStats.values()]
    .map((row) => ({
      ...row,
      session_to_booking_start_pct: pct(row.booking_start_sessions, row.sessions),
      session_to_checkout_completion_pct: pct(row.checkout_completed_sessions, row.sessions)
    }))
    .sort((a, b) => b.sessions - a.sessions || String(a.path).localeCompare(String(b.path)))
    .slice(0, 16);

  return {
    available: true,
    evidence_state: truncated ? "bounded_partial" : "observed",
    source: "site_activity_events same-session anonymous analytics",
    rows_read: safeArray(events).length,
    rows_truncated_possible: truncated,
    sessions_observed: sessions.size,
    cohorts: {
      all_observed: cohort(cohortSets.all),
      google_referral: cohort(cohortSets.google_referral),
      local_target_landing: cohort(cohortSets.local_target_landing),
      google_referral_local_target_landing: cohort(cohortSets.google_referral_local_target_landing)
    },
    target_landing_pages: topLandingPages,
    attribution_rule: "same_session_only",
    persisted_booking_outcome_joined: false,
    customer_identity_joined: false,
    causal_attribution_claimed: false,
    note: "Conversion attribution means anonymous events observed in the same analytics session. It does not prove that Google caused a booking, and it does not connect an anonymous session to a persisted customer or booking record."
  };
}

function bookingStages(rows) {
  let bookingStart = false;
  let checkoutStarted = false;
  let checkoutCompleted = false;
  for (const row of safeArray(rows)) {
    const type = clean(row?.event_type).toLowerCase();
    const checkout = clean(row?.checkout_state).toLowerCase();
    if (type === "booking_step_view" && Number(row?.payload?.step_number || 0) === 1) bookingStart = true;
    if (type === "checkout_started" || checkout === "started") checkoutStarted = true;
    if (type === "checkout_completed" || checkout === "completed") checkoutCompleted = true;
  }
  return { booking_start: bookingStart, checkout_started: checkoutStarted, checkout_completed: checkoutCompleted };
}

function isGoogleSource(referrer, source) {
  const sourceText = clean(source).toLowerCase();
  if (sourceText === "google" || sourceText.startsWith("google_")) return true;
  const raw = clean(referrer);
  if (!raw) return false;
  try {
    const host = new URL(raw, "https://rosiedazzlers.ca").hostname.toLowerCase();
    return host === "google.com" || host.endsWith(".google.com") || host.startsWith("google.") || host.includes(".google.");
  } catch {
    return /(^|[^a-z])google([^a-z]|$)/i.test(raw);
  }
}

function normalizePath(value) {
  const raw = clean(value);
  if (!raw) return "/";
  try {
    const parsed = new URL(raw, "https://rosiedazzlers.ca");
    return (parsed.pathname || "/").replace(/\/+$/, "") || "/";
  } catch {
    return (raw.split("?")[0].split("#")[0] || "/").replace(/\/+$/, "") || "/";
  }
}

function unavailableAttribution() {
  return {
    available: false,
    evidence_state: "unavailable",
    source: "site_activity_events same-session anonymous analytics",
    rows_read: 0,
    rows_truncated_possible: false,
    sessions_observed: null,
    cohorts: {},
    target_landing_pages: [],
    attribution_rule: "same_session_only",
    persisted_booking_outcome_joined: false,
    customer_identity_joined: false,
    causal_attribution_claimed: false,
    note: "The bounded anonymous analytics source is unavailable; conversion attribution is not guessed."
  };
}

function pct(numerator, denominator) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}
function finiteWholeOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}
function timestamp(value) {
  const n = Date.parse(clean(value));
  return Number.isFinite(n) ? n : 0;
}
function validIso(value) {
  const n = Date.parse(clean(value));
  return Number.isFinite(n) ? new Date(n).toISOString() : null;
}
function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function safeArray(value) {
  return Array.isArray(value) ? value : [];
}
function clean(value) {
  return String(value == null ? "" : value).trim();
}
function unique(values) {
  return [...new Set(values)];
}
