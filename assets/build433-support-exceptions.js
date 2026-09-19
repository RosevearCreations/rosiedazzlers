// Build 433 — manually refreshed, read-only support exception queue.
(function attachBuild433SupportExceptions(globalScope) {
  "use strict";
  const state = { snapshot: null, severity: "all", dependency: "all" };
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  function init() {
    $("refreshSupportExceptions")?.addEventListener("click", refresh);
    $("severityFilter")?.addEventListener("change", (event) => {
      state.severity = event.target.value || "all";
      renderQueue();
    });
    $("dependencyFilter")?.addEventListener("change", (event) => {
      state.dependency = event.target.value || "all";
      renderQueue();
    });
    setStatus("Support exceptions are not loaded yet. Select Refresh support exceptions for a bounded read-only snapshot.", "soft");
  }

  async function refresh() {
    const button = $("refreshSupportExceptions");
    if (button) button.disabled = true;
    setStatus("Refreshing bounded support evidence…", "soft");
    try {
      const response = await fetch("/api/admin/support_exceptions", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) throw new Error(payload?.error || `Support exception refresh returned HTTP ${response.status}.`);
      state.snapshot = payload;
      renderSummary();
      renderSources();
      renderQueue();
      renderSurfaces();
      const when = payload.generated_at ? new Date(payload.generated_at).toLocaleString("en-CA") : "unknown time";
      setStatus(`Snapshot refreshed ${when}. Overall: ${String(payload.overall || "unknown").toUpperCase()}. No automatic refresh is running.`, payload.overall === "critical" ? "bad" : payload.overall === "clear" ? "ok" : "warn");
    } catch (error) {
      state.snapshot = null;
      renderSummary();
      renderSources();
      renderQueue();
      renderSurfaces();
      setStatus(error?.message || "Support exceptions could not be refreshed.", "bad");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderSummary() {
    const mount = $("exceptionSummary");
    if (!mount) return;
    const counts = state.snapshot?.counts;
    if (!counts) {
      mount.innerHTML = '<div class="support-empty">No snapshot loaded.</div>';
      return;
    }
    const rows = [
      ["Critical", counts.critical || 0],
      ["Warnings", counts.warning || 0],
      ["Provider HOLDs", counts.hold || 0],
      ["Owner actions", counts.action || 0],
      ["Total exceptions", counts.total || 0]
    ];
    mount.innerHTML = rows.map(([label, value]) => `<div class="support-stat"><span class="mini">${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("");
  }

  function renderSources() {
    const mount = $("sourceStatus");
    if (!mount) return;
    const sources = state.snapshot?.source_status;
    if (!sources) {
      mount.innerHTML = '<div class="support-empty">No source status loaded.</div>';
      return;
    }
    mount.innerHTML = Object.entries(sources).map(([name, source]) => {
      const stateLabel = source?.restricted ? "restricted" : source?.available ? "available" : "unavailable";
      const stamp = source?.generated_at ? new Date(source.generated_at).toLocaleString("en-CA") : "not reported";
      return `<div class="support-source"><strong>${esc(name.replaceAll("_", " "))}</strong><span class="support-pill ${esc(stateLabel)}">${esc(stateLabel)}</span><span class="mini">HTTP ${esc(source?.http_status ?? "—")} · source timestamp ${esc(stamp)}</span></div>`;
    }).join("");
  }

  function renderQueue() {
    const mount = $("exceptionQueue");
    if (!mount) return;
    const queue = Array.isArray(state.snapshot?.queue) ? state.snapshot.queue : [];
    const filtered = queue.filter((item) => {
      if (state.severity !== "all" && item.severity !== state.severity) return false;
      if (state.dependency !== "all" && item.dependency !== state.dependency) return false;
      return true;
    });
    if (!state.snapshot) {
      mount.innerHTML = '<div class="support-empty">Refresh manually to load the current exception queue.</div>';
      return;
    }
    if (!filtered.length) {
      mount.innerHTML = '<div class="support-empty">No exceptions match the current filters. A clear queue does not close provider or owner HOLDs outside the observed sources.</div>';
      return;
    }
    mount.innerHTML = filtered.map((item) => {
      const href = safeHref(item?.surface?.href);
      return `<article class="support-exception severity-${esc(item.severity)}">
        <div class="support-exception-head">
          <div><span class="support-pill">${esc(item.severity)}</span><span class="support-pill">${esc(item.dependency)}</span></div>
          <span class="mini">${esc(item.freshness || "unavailable")}</span>
        </div>
        <h3>${esc(item.label || "Support exception")}</h3>
        <p class="mini">Source: ${esc(item.source || "unknown")} · Family: ${esc(item.family || "support")} · State: ${esc(item.state || "unknown")}</p>
        <p><strong>Safe next action:</strong> ${esc(item.safe_next_action || "Review the linked evidence before taking action.")}</p>
        <div class="support-exception-foot">
          <span class="mini">Observed: ${esc(formatTime(item.observed_at))}</span>
          ${href ? `<a class="btn small ghost" href="${esc(href)}">Open ${esc(item?.surface?.label || "evidence")}</a>` : ""}
        </div>
      </article>`;
    }).join("");
  }

  function renderSurfaces() {
    const mount = $("evidenceSurfaces");
    if (!mount) return;
    const surfaces = Array.isArray(state.snapshot?.evidence_surfaces) ? state.snapshot.evidence_surfaces : [];
    if (!surfaces.length) {
      mount.innerHTML = '<div class="support-empty">Evidence links appear after a successful refresh.</div>';
      return;
    }
    mount.innerHTML = surfaces.map((item) => {
      const href = safeHref(item.href);
      return `<article class="support-surface"><div><strong>${esc(item.label)}</strong><p class="mini">${esc(item.purpose)}</p></div>${href ? `<a class="btn small ghost" href="${esc(href)}">Open</a>` : ""}</article>`;
    }).join("");
  }

  function safeHref(value) {
    const href = String(value || "");
    return /^\/(admin-[a-z0-9-]+\.html|app\/it\/?)/.test(href) ? href : "";
  }

  function formatTime(value) {
    const time = Date.parse(String(value || ""));
    return Number.isFinite(time) ? new Date(time).toLocaleString("en-CA") : "unavailable";
  }

  function setStatus(message, tone) {
    const node = $("supportExceptionStatus");
    if (!node) return;
    node.hidden = false;
    node.className = `notice ${tone || "soft"}`;
    node.textContent = message;
  }

  document.addEventListener("DOMContentLoaded", () => {
    globalScope.AdminShell?.boot?.({
      pageKey: "admin-support-exceptions",
      onReady: async () => init()
    });
  }, { once: true });
})(window);
