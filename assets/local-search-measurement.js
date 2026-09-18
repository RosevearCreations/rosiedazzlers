// Build 414 — Admin local-search measurement UI.
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function setStatus(message, tone = "") {
  const el = $("[data-local-search-status]");
  if (!el) return;
  el.hidden = !message;
  el.className = tone ? `notice ${tone}` : "notice";
  el.setAttribute("role", tone === "bad" ? "alert" : "status");
  el.setAttribute("aria-live", tone === "bad" ? "assertive" : "polite");
  el.textContent = message || "";
  if (tone === "bad" && message) el.focus({ preventScroll: true });
}

async function api(path, body = {}) {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Request failed (${response.status})`);
  return payload;
}

function chip(state, classification) {
  const label = String(state || classification || "unavailable").replaceAll("_", " ");
  return `<span class="status-chip">${esc(label)}</span>`;
}
function metric(label, value) {
  return `<div class="metric"><span class="muted">${esc(label)}</span><strong>${value == null ? "—" : esc(value)}</strong></div>`;
}
function providerMetrics(provider, metrics = {}) {
  const labels = provider === "search_console"
    ? [["clicks", "Clicks"], ["impressions", "Impressions"], ["ctr_percent", "CTR %"], ["average_position", "Average position"]]
    : [["profile_views", "Profile views"], ["website_clicks", "Website clicks"], ["calls", "Calls"], ["direction_requests", "Directions"]];
  return labels.map(([key, label]) => metric(label, metrics[key])).join("");
}
function renderProvider(selector, provider, evidence) {
  const host = $(selector);
  if (!host) return;
  host.innerHTML = `
    <div class="section-heading"><div><h3>${provider === "search_console" ? "Google Search Console" : "Google Business Profile"}</h3>
    <p class="muted">${esc(evidence?.interpretation || "")}</p></div>${chip(evidence?.evidence_state, evidence?.classification)}</div>
    <div class="metric-grid">${providerMetrics(provider, evidence?.metrics || {})}</div>
    <p><strong>Property/location:</strong> ${esc(evidence?.label || "No observed snapshot recorded")}</p>
    <p class="muted">Window: ${esc(evidence?.period_start || "—")} → ${esc(evidence?.period_end || "—")} · Observed: ${esc(evidence?.observed_at || "—")}</p>
    <p class="muted">${esc(evidence?.action || "")}</p>`;
}

function renderReport(data) {
  const first = data.first_party || {};
  const proof = data.local_proof || {};
  $("#firstPartyOut").innerHTML = `
    <div class="section-heading"><div><h3>First-party local-search signals</h3><p class="muted">${esc(first.interpretation || first.reason || "")}</p></div>${chip(first.evidence_state, first.classification)}</div>
    <div class="metric-grid">
      ${metric("Google referral events", first.google_referral_events)}
      ${metric("Target page views", first.target_local_service_page_views)}
      ${metric("Target pages observed", first.target_pages_with_observed_views)}
    </div>
    <div class="summary-list">${(first.top_target_pages || []).map((row) => `<div class="summary-item"><strong>${esc(row.path)}</strong><span>${esc(row.views)} views</span></div>`).join("") || '<div class="summary-item muted">No target-page views observed in this window.</div>'}</div>`;
  $("#localProofOut").innerHTML = `
    <div class="section-heading"><div><h3>Approved local proof</h3><p class="muted">${esc(proof.interpretation || proof.reason || "")}</p></div>${chip(proof.evidence_state, proof.classification)}</div>
    <div class="metric-grid">
      ${metric("Published before/after pairs", proof.approved_public_non_sample_pairs)}
      ${metric("Towns with proof", proof.towns_with_published_proof)}
      ${metric("Services with proof", proof.services_with_published_proof)}
    </div>`;
  renderProvider("#searchConsoleOut", "search_console", data.providers?.search_console || {});
  renderProvider("#gbpOut", "google_business_profile", data.providers?.google_business_profile || {});
  $("#recommendationsOut").innerHTML = (data.recommendations || []).map((item) => `<li>${esc(item)}</li>`).join("") || "<li>No current recommendation.</li>";
  $("#evidenceRulesOut").innerHTML = Object.values(data.rules || {}).map((item) => `<li>${esc(item)}</li>`).join("");
}

async function loadReport() {
  const button = $("#refreshLocalSearch");
  if (button?.disabled) return;
  if (button) { button.disabled = true; button.setAttribute("aria-busy", "true"); button.textContent = "Refreshing…"; }
  setStatus("Refreshing local-search evidence…");
  try {
    const data = await api("/api/admin/local_search_measurement_report", {});
    renderReport(data);
    setStatus("Local-search evidence refreshed.", "ok");
  } catch (error) {
    setStatus(error?.message || "Could not load local-search evidence.", "bad");
  } finally {
    if (button) { button.disabled = false; button.setAttribute("aria-busy", "false"); button.textContent = "Refresh evidence"; }
  }
}

function snapshotFromForm(form) {
  const fd = new FormData(form);
  const provider = String(fd.get("provider") || "");
  const metricNames = provider === "search_console"
    ? ["clicks", "impressions", "ctr_percent", "average_position"]
    : ["profile_views", "website_clicks", "calls", "direction_requests"];
  const metrics = {};
  for (const key of metricNames) {
    const raw = String(fd.get(key) || "").trim();
    if (raw !== "") metrics[key] = Number(raw);
  }
  return {
    provider,
    snapshot: {
      label: String(fd.get("label") || "").trim(),
      period_start: String(fd.get("period_start") || ""),
      period_end: String(fd.get("period_end") || ""),
      observed_at: new Date().toISOString(),
      metrics,
      source_note: String(fd.get("source_note") || "").trim()
    }
  };
}

async function saveProvider(form) {
  if (form.getAttribute("aria-busy") === "true") return;
  const button = form.querySelector('button[type="submit"]');
  form.setAttribute("aria-busy", "true");
  if (button) { button.disabled = true; button.textContent = "Saving…"; }
  try {
    await api("/api/admin/local_search_provider_evidence_save", snapshotFromForm(form));
    setStatus("Dated provider evidence saved. It remains an operator-observed snapshot, not a live Google assertion.", "ok");
    await loadReport();
  } catch (error) {
    setStatus(error?.message || "Could not save provider evidence.", "bad");
  } finally {
    form.setAttribute("aria-busy", "false");
    if (button) { button.disabled = false; button.textContent = "Save observed snapshot"; }
  }
}

async function loadTasks() {
  const out = $("#seoTasksOut");
  try {
    const data = await api("/api/admin/local_seo_task_cards_list", {});
    out.innerHTML = (data.tasks || []).map((task) => `
      <div class="summary-item"><strong>${esc(task.title || "Local SEO task")}</strong>
      <div class="muted">${esc(task.status || "needed")} · ${esc(task.town || "all towns")} · ${esc(task.service || "all services")}</div></div>`).join("") || '<div class="summary-item muted">No SEO task cards are currently recorded.</div>';
  } catch (error) {
    out.innerHTML = `<div class="notice bad">${esc(error?.message || "Could not load SEO task cards.")}</div>`;
  }
}

export function startLocalSearchMeasurement() {
  $("#refreshLocalSearch")?.addEventListener("click", loadReport);
  document.querySelectorAll("[data-provider-evidence-form]").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProvider(form);
  }));
  Promise.all([loadReport(), loadTasks()]).catch(() => {});
}
