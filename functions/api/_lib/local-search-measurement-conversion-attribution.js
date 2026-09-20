// Build 450 — pure Local Search Measurement & Conversion Attribution helper.
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
    session_level_join_performed: false
  }));

  const providerObserved = providerRows.filter((row) => row.classification === "observed").length;
  const providerHold = providerRows.length - providerObserved;
  const firstPartyAvailable = firstParty.available === true;
  const firstPartyWindow = {
    start: firstParty.window_start || null,
    end: firstParty.window_end || null
  };

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
    authority: "local_search_measurement_conversion_attribution",
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
    reconciliation: {
      interpretation: "Dated Search Console / Google Business Profile snapshots, first-party landing/referral rollups and anonymous same-session booking funnel evidence are reconciled side by side. Provider metrics are not joined to individual sessions and no causal Google outcome is inferred.",
      provider_window_overlap_is_correlation_only: true,
      first_party_same_session_attribution_is_observed_not_causal: true
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
