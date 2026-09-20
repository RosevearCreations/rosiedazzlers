// Build 450 — manual read-only local-search measurement & conversion attribution UI.
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
    const stamp = data.generated_at ? new Date(data.generated_at).toLocaleString("en-CA") : "unknown time";
    setStatus450("Read-only attribution refreshed " + stamp + ". State: " + String(data.status || "unavailable").replaceAll("_", " ") + ". No provider or analytics write was performed.", data.status === "observed" ? "ok" : "warn");
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
