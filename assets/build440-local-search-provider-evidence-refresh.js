// Build 440 — manual, read-only provider evidence refresh panel.
const byId = (id) => document.getElementById(id);
const esc440 = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[c]);

export function startLocalSearchProviderEvidenceRefresh() {
  const button = byId("refreshProviderEvidence440");
  if (!button) return;
  button.addEventListener("click", refreshProviderEvidence);
  setStatus440("Provider refresh has not been run. Use the button for a bounded read-only snapshot.", "soft");
}

async function refreshProviderEvidence() {
  const button = byId("refreshProviderEvidence440");
  if (button?.disabled) return;
  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Refreshing provider evidence…";
  }
  setStatus440("Refreshing dated provider, first-party and approved-proof evidence…", "soft");

  try {
    const response = await fetch("/api/admin/local_search_provider_evidence_refresh", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Provider evidence refresh returned HTTP ${response.status}.`);
    renderSummary440(data);
    renderProviders440(data);
    renderReconciliation440(data);
    const stamp = data.generated_at ? new Date(data.generated_at).toLocaleString("en-CA") : "unknown time";
    setStatus440(`Read-only provider evidence refreshed ${stamp}. State: ${String(data.status || "unavailable").replaceAll("_", " ")}. No Google/provider write was performed.`, data.status === "observed" ? "ok" : "warn");
  } catch (error) {
    byId("providerRefreshSummary440").innerHTML = '<div class="summary-item muted">Provider refresh unavailable.</div>';
    byId("providerRefreshRows440").innerHTML = '<div class="summary-item muted">No provider refresh evidence loaded.</div>';
    byId("providerReconciliation440").innerHTML = '<div class="summary-item muted">No reconciliation evidence loaded.</div>';
    setStatus440(error?.message || "Could not refresh provider evidence.", "bad");
  } finally {
    if (button) {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      button.textContent = "Refresh provider evidence";
    }
  }
}

function renderSummary440(data) {
  const c = data?.counts || {};
  const host = byId("providerRefreshSummary440");
  host.innerHTML = [
    summaryRow("Overall state", chip440(data.status)),
    summaryRow("Fresh observed providers", c.observed ?? 0),
    summaryRow("Provider-dependent", c.provider_dependent ?? 0),
    summaryRow("Owner refresh actions", c.owner_action ?? 0),
    summaryRow("Refresh required", c.refresh_required ?? 0)
  ].join("");
}

function renderProviders440(data) {
  const host = byId("providerRefreshRows440");
  const rows = Array.isArray(data?.providers) ? data.providers : [];
  host.innerHTML = rows.map((row) => {
    const id = row.identity || {};
    const metrics = Object.entries(row.metrics || {}).map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`).join(" · ") || "No bounded provider metrics recorded";
    const overlap = row.first_party_window_overlap == null ? "window overlap unavailable" : row.first_party_window_overlap ? "provider/first-party windows overlap" : "provider/first-party windows do not overlap";
    return `<div class="summary-item provider-refresh-row"><div><strong>${esc440(row.provider_label || row.provider)}</strong>
      <div class="muted">${esc440(id.label || "No explicit property/location")} · ${esc440(id.period_start || "—")} → ${esc440(id.period_end || "—")} · observed ${esc440(id.observed_at || "—")}</div>
      <div class="muted">${esc440(metrics)} · ${esc440(overlap)}</div>
      <div class="muted">${esc440(row.safe_next_action || "")}</div></div>
      <span>${chip440(row.evidence_state || row.classification)}</span></div>`;
  }).join("") || '<div class="summary-item muted">No provider rows are available.</div>';
}

function renderReconciliation440(data) {
  const host = byId("providerReconciliation440");
  const first = data?.reconciliation?.first_party || {};
  const proof = data?.reconciliation?.local_proof || {};
  const actions = Array.isArray(data?.actions) ? data.actions : [];
  host.innerHTML = [
    summaryRow("First-party traffic", first.available
      ? `Google referrals ${esc440(first.google_referral_events ?? "—")} · target-page views ${esc440(first.target_local_service_page_views ?? "—")} · ${esc440(first.window_start || "—")} → ${esc440(first.window_end || "—")}`
      : "unavailable"),
    summaryRow("Approved local proof", proof.available
      ? `${esc440(proof.approved_public_non_sample_pairs ?? "—")} public non-sample pairs · ${esc440(proof.towns_with_published_proof ?? "—")} towns · ${esc440(proof.services_with_published_proof ?? "—")} services`
      : "unavailable"),
    summaryRow("Interpretation", data?.reconciliation?.interpretation || "No ranking/indexing/Maps outcome is inferred."),
    ...actions.map((action) => summaryRow("Next evidence action", action))
  ].join("");
}

function summaryRow(label, value) {
  return `<div class="summary-item"><strong>${esc440(label)}</strong><span>${String(value).startsWith("<") ? value : esc440(value)}</span></div>`;
}
function chip440(value) {
  return `<span class="status-chip">${esc440(String(value || "unavailable").replaceAll("_", " "))}</span>`;
}
function setStatus440(message, tone) {
  const node = byId("providerRefreshStatus440");
  if (!node) return;
  node.hidden = false;
  node.className = `notice ${tone || ""}`.trim();
  node.textContent = message;
}
