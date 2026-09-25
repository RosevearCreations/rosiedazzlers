// Build 450/460/470/480 — manual read-only local-search measurement, conversion attribution, evidence-quality, window-closure & snapshot-continuity UI.
const byId450 = (id) => document.getElementById(id);
const esc450 = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[c]);

export function startLocalSearchMeasurementConversionAttribution() {
  const button = byId450("refreshLocalConversion450");
  if (!button) return;
  button.addEventListener("click", refresh450);
  setStatus450("Conversion attribution has not been refreshed. Run a bounded read-only snapshot.", "soft");
}

async function refresh450() {
  const button = byId450("refreshLocalConversion450");
  if (button?.disabled) return;
  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Refreshing attribution…";
  }
  setStatus450("Reconciling provider, landing/referral and same-session booking-funnel evidence…", "soft");
  try {
    const response = await fetch("/api/admin/local_search_measurement_conversion_attribution", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || "Local-search conversion attribution is unavailable.");
    renderSummary450(data);
    renderCohorts450(data);
    renderLandingPages450(data);
    renderProvider450(data);
    renderEvidenceQuality460(data);
    renderProviderWindowClosure470(data);
    renderProviderSnapshotContinuity480(data);
    try {
      const continuityResponse = await fetch("/api/admin/provider_local_search_evidence_continuity", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const continuityData = await continuityResponse.json().catch(() => null);
      const safeContinuityData = continuityResponse.ok && continuityData ? continuityData : {};
      renderProviderLocalSearchContinuity489(safeContinuityData);
      renderProviderLocalSearchOutcomeRefresh499(safeContinuityData);
    } catch {
      renderProviderLocalSearchContinuity489({});
      renderProviderLocalSearchOutcomeRefresh499({});
    }
    const stamp = data.generated_at ? new Date(data.generated_at).toLocaleString("en-CA") : "unknown time";
    const qualityState = String(data?.evidence_quality?.status || "unavailable").replaceAll("_", " ");
    const closureState = String(data?.provider_window_attribution_closure?.status || "unavailable").replaceAll("_", " ");
    const continuityState = String(data?.provider_snapshot_continuity?.status || "continuity_incomplete").replaceAll("_", " ");
    setStatus450("Read-only attribution refreshed " + stamp + ". Attribution: " + String(data.status || "unavailable").replaceAll("_", " ") + " · evidence quality: " + qualityState + " · provider-window closure: " + closureState + " · snapshot continuity: " + continuityState + ". No provider or analytics write was performed.", data.status === "observed" && qualityState === "comparable observed" && closureState === "closure ready" && continuityState === "descriptive review ready" ? "ok" : "warn");
  } catch (error) {
    setStatus450(error?.message || "Could not refresh local-search conversion attribution.", "bad");
  } finally {
    if (button) {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      button.textContent = "Refresh conversion attribution";
    }
  }
}

function renderSummary450(data) {
  const host = byId450("localConversionSummary450");
  if (!host) return;
  const s = data.summary || {};
  const a = data.conversion_attribution || {};
  host.innerHTML = [
    row450("Overall state", data.status || "unavailable"),
    row450("Provider state", s.provider_state || "unavailable"),
    row450("Providers observed", (s.provider_observed_count ?? 0) + " / " + ((s.provider_observed_count ?? 0) + (s.provider_hold_count ?? 0))),
    row450("Same-session rows", a.rows_read ?? 0),
    row450("Sessions observed", a.sessions_observed ?? "—"),
    row450("Attribution rule", a.attribution_rule || "same_session_only")
  ].join("");
}

function renderCohorts450(data) {
  const host = byId450("localConversionCohorts450");
  if (!host) return;
  const cohorts = data?.conversion_attribution?.cohorts || {};
  const labels = {
    all_observed: "All observed sessions",
    google_referral: "Google-referral sessions",
    local_target_landing: "Local/service landing sessions",
    google_referral_local_target_landing: "Google + local/service landing"
  };
  host.innerHTML = Object.entries(cohorts).map(([key, value]) =>
    '<div class="summary-item"><div><strong>' + esc450(labels[key] || key.replaceAll("_", " ")) + '</strong>'
    + '<div class="muted">Booking starts ' + esc450(value.booking_start_sessions ?? 0)
    + ' · checkout completed ' + esc450(value.checkout_completed_sessions ?? 0)
    + ' · session→checkout ' + esc450(value.session_to_checkout_completion_pct ?? "—") + '%</div></div>'
    + '<span>' + esc450(value.sessions ?? 0) + ' sessions</span></div>'
  ).join("") || '<div class="summary-item muted">No same-session cohort evidence is available.</div>';
}

function renderLandingPages450(data) {
  const host = byId450("localConversionLanding450");
  if (!host) return;
  const rows = Array.isArray(data?.conversion_attribution?.target_landing_pages)
    ? data.conversion_attribution.target_landing_pages
    : [];
  host.innerHTML = rows.map((item) =>
    '<div class="summary-item"><div><strong><code>' + esc450(item.path) + '</code></strong>'
    + '<div class="muted">Google referrals ' + esc450(item.google_referral_sessions ?? 0)
    + ' · booking starts ' + esc450(item.booking_start_sessions ?? 0)
    + ' · checkout completed ' + esc450(item.checkout_completed_sessions ?? 0) + '</div></div>'
    + '<span>' + esc450(item.sessions ?? 0) + ' landing sessions</span></div>'
  ).join("") || '<div class="summary-item muted">No target landing-page sessions were observed in the bounded window.</div>';
}


function renderEvidenceQuality460(data) {
  const host = byId450("localEvidenceQuality460");
  if (!host) return;
  const quality = data?.evidence_quality || {};
  const rows = Array.isArray(quality.providers) ? quality.providers : [];
  const summary = '<div class="summary-item"><div><strong>Evidence-quality state</strong>'
    + '<div class="muted">Comparability describes freshness, availability and dated window alignment only; it is not a performance or causation score.</div></div>'
    + '<span>' + esc450(quality.status || "unavailable") + '</span></div>';
  const providerRows = rows.map((item) =>
    '<div class="summary-item"><div><strong>' + esc450(item.provider_label || item.provider) + '</strong>'
    + '<div class="muted">identity ' + esc450(item.provider_identity_complete ? "complete" : "incomplete")
    + ' · freshness ' + esc450(item.provider_freshness_state || "unknown")
    + ' · window ' + esc450(item.provider_window_overlap || "unknown")
    + ' · same-session ' + esc450(item.same_session_attribution_available ? (item.same_session_rows_truncated_possible ? "bounded partial" : "available") : "unavailable")
    + '</div><div class="muted">' + esc450(item.interpretation || "") + '</div></div>'
    + '<span>' + esc450(item.comparison_state || "unavailable") + '</span></div>'
  ).join("");
  host.innerHTML = summary + (providerRows || '<div class="summary-item muted">No provider evidence-quality rows are available.</div>');
}


function renderProviderWindowClosure470(data) {
  const host = byId450("localProviderWindowClosure470");
  if (!host) return;
  const closure = data?.provider_window_attribution_closure || {};
  const rows = Array.isArray(closure.providers) ? closure.providers : [];
  const first = closure.first_party_window || {};
  const obs = closure.bounded_first_party_observations || {};
  const summary = '<div class="summary-item"><div><strong>Build 470 closure state</strong>'
    + '<div class="muted">Closure-ready means descriptive window alignment only; provider identity, provider window, first-party window and bounded same-session availability must all be explicit.</div></div>'
    + '<span>' + esc450(closure.status || "unavailable") + '</span></div>'
    + '<div class="summary-item"><div><strong>First-party observation window</strong>'
    + '<div class="muted">' + esc450(first.start || "—") + ' → ' + esc450(first.end || "—")
    + ' · same-session ' + esc450(first.same_session_attribution_available ? (first.same_session_rows_truncated_possible ? "bounded partial" : "available") : "unavailable")
    + '</div></div><span>' + esc450(obs.google_referral_sessions ?? 0) + ' Google-referral sessions</span></div>';
  const providerRows = rows.map((item) =>
    '<div class="summary-item"><div><strong>' + esc450(item.provider_label || item.provider) + '</strong>'
    + '<div class="muted">' + esc450(item.identity_kind || "source") + ': ' + esc450(item.property_location_label || "not recorded")
    + ' · provider window ' + esc450(item.provider_period_start || "—") + ' → ' + esc450(item.provider_period_end || "—")
    + ' · first-party overlap ' + esc450(item.first_party_window_overlap || "unknown") + '</div>'
    + '<div class="muted">' + esc450(item.safe_next_action || "") + '</div></div>'
    + '<span>' + esc450(item.closure_state || "unavailable") + '</span></div>'
  ).join("");
  host.innerHTML = summary + (providerRows || '<div class="summary-item muted">No provider-window closure rows are available.</div>');
}

function renderProviderSnapshotContinuity480(data) {
  const host = byId450("localProviderSnapshotContinuity480");
  if (!host) return;
  const continuity = data?.provider_snapshot_continuity || {};
  const rows = Array.isArray(continuity.providers) ? continuity.providers : [];
  const seasonal = continuity.southern_ontario_seasonal_truth_boundary || {};
  const summary = '<div class="summary-item"><div><strong>Build 480 continuity state</strong>'
    + '<div class="muted">Successive snapshots are comparable only when the same provider property/location identity and equal-length dated windows are present. Metric changes remain descriptive only.</div></div>'
    + '<span>' + esc450(continuity.status || "continuity_incomplete") + '</span></div>';
  const providerRows = rows.map((item) => {
    const current = item.current_snapshot || {};
    const previous = item.previous_snapshot || {};
    const deltas = item.metric_deltas || {};
    const deltaText = Object.entries(deltas).map(([key,row]) =>
      key.replaceAll("_"," ") + ": " + String(row.previous) + " → " + String(row.current)
      + " (Δ " + String(row.delta) + (row.percent_change == null ? "" : ", " + String(row.percent_change) + "%") + ")"
    ).join(" · ");
    return '<div class="summary-item"><div><strong>' + esc450(item.provider_label || item.provider) + '</strong>'
      + '<div class="muted">previous ' + esc450(previous.period_start || "—") + ' → ' + esc450(previous.period_end || "—")
      + ' · current ' + esc450(current.period_start || "—") + ' → ' + esc450(current.period_end || "—")
      + ' · identity match ' + esc450(item.identity_match ? "yes" : "no") + '</div>'
      + '<div class="muted">' + esc450(deltaText || item.interpretation || "No comparable metric delta available.") + '</div></div>'
      + '<span>' + esc450(item.continuity_state || "continuity_incomplete") + '</span></div>';
  }).join("");
  const seasonalBoundary = '<div class="summary-item"><div><strong>Southern Ontario seasonal truth boundary</strong>'
    + '<div class="muted">' + esc450(seasonal.requirement || "Search/funnel changes do not prove weather effects or winter service availability. Exact temperature limits require explicit service/product/equipment constraints.") + '</div></div>'
    + '<span>no inference</span></div>';
  host.innerHTML = summary + (providerRows || '<div class="summary-item muted">No provider continuity rows are available.</div>') + seasonalBoundary;
}

function renderProviderLocalSearchContinuity489(data) {
  const host = byId450("localProviderContinuity489");
  if (!host) return;
  const continuity = data?.provider_local_search_evidence_continuity || {};
  const provider = continuity.provider_outcomes_and_communications || {};
  const local = continuity.local_search || {};
  const rules = continuity.continuity_rules || {};
  const truth = continuity.truth_boundary || {};
  const summary = '<div class="summary-item"><div><strong>Build 489 continuity state</strong>'
    + '<div class="muted">Separate provider populations remain source-owned. Payment/refund/message evidence is not joined to Search Console/GBP or referral evidence.</div></div>'
    + '<span>' + esc450(continuity.status || "continuity_review_incomplete") + '</span></div>';
  const rows = [
    ["Provider outcomes & communications", provider.status || "unavailable", "current " + String(provider.current_count ?? 0) + " / " + String(provider.required_count ?? 0)],
    ["Local-search provider continuity", local.status || "unavailable", "descriptive-ready " + String(local.descriptive_review_ready_count ?? 0) + " / " + String(local.total_provider_rows ?? 0)],
    ["Separate provider populations", rules.cross_family_identity_join_performed === false ? "YES" : "NO", "no payment/search provider join"],
    ["Weather / seasonal causation", truth.search_or_referral_movement_is_weather_causation === false ? "NOT INFERRED" : "UNKNOWN", "search/referral movement never proves weather effects"]
  ];
  host.innerHTML = summary + rows.map((row) =>
    '<div class="summary-item"><div><strong>' + esc450(row[0]) + '</strong><div class="muted">' + esc450(row[2]) + '</div></div><span>' + esc450(row[1]) + '</span></div>'
  ).join("");
}

function renderProviderLocalSearchOutcomeRefresh499(data) {
  const host = byId450("localProviderOutcomeRefresh499");
  if (!host) return;
  const refresh = data?.provider_local_search_outcome_evidence_refresh || {};
  const provider = refresh.provider_outcomes_and_communications || {};
  const local = refresh.local_search_provider_outcomes || {};
  const source = refresh.source_contract || {};
  const truth = refresh.truth_boundary || {};
  const summary = '<div class="summary-item"><div><strong>Build 499 outcome evidence refresh</strong>'
    + '<div class="muted">Correct provider/property/location/window sources are required. First-party referral/funnel context remains separate descriptive evidence.</div></div>'
    + '<span>' + esc450(refresh.status || "outcome_evidence_refresh_required") + '</span></div>';
  const rows = [
    ["Payment / refund / message outcomes", provider.status || "unavailable", "current attributable " + String(provider.current_attributable_count ?? 0) + " / " + String(provider.required_count ?? 4)],
    ["Search Console / GBP outcomes", local.status || "unavailable", "correct source/window " + String(local.correct_source_window_count ?? 0) + " / " + String(local.required_count ?? 2)],
    ["First-party context", source.first_party_context_remains_separate_descriptive_evidence === true ? "SEPARATE" : "UNKNOWN", "never substitutes for provider evidence"],
    ["Ranking / weather / demand / conversion causation", truth.weather_causation_inferred === false && truth.booking_conversion_causation_inferred === false ? "NOT INFERRED" : "UNKNOWN", "descriptive evidence only"]
  ];
  host.innerHTML = summary + rows.map((row) =>
    '<div class="summary-item"><div><strong>' + esc450(row[0]) + '</strong><div class="muted">' + esc450(row[2]) + '</div></div><span>' + esc450(row[1]) + '</span></div>'
  ).join("");
}

function renderProvider450(data) {
  const host = byId450("localConversionProvider450");
  if (!host) return;
  const rows = Array.isArray(data.provider_evidence) ? data.provider_evidence : [];
  host.innerHTML = rows.map((item) =>
    '<div class="summary-item"><div><strong>' + esc450(item.provider_label || item.provider) + '</strong>'
    + '<div class="muted">' + esc450(item.period_start || "—") + ' → ' + esc450(item.period_end || "—")
    + ' · observed ' + esc450(item.observed_at || "—")
    + ' · session-level join: no</div></div>'
    + '<span>' + esc450(item.evidence_state || item.classification || "unavailable") + '</span></div>'
  ).join("") || '<div class="summary-item muted">No provider evidence rows are available.</div>';
}

function row450(label, value) {
  return '<div class="summary-item"><strong>' + esc450(label) + '</strong><span>' + esc450(value) + '</span></div>';
}

function setStatus450(message, tone) {
  const node = byId450("localConversionStatus450");
  if (!node) return;
  node.className = "notice " + (tone || "soft");
  node.textContent = message;
}
