// Build 442 — manual, aggregate-only staff/support learning UI.
(function attachBuild442Learning(globalScope) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  async function refresh() {
    const button = $("refreshLearning");
    if (button) button.disabled = true;
    status("Refreshing bounded staff and support evidence…", "soft");
    try {
      const response = await fetch("/api/admin/staff_workflow_support_exception_learning", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error || "Learning evidence could not be loaded.");
      renderSummary(data);
      renderCandidates(data.learning_candidates || []);
      renderSources(data.source_status || {});
      status(
        "Snapshot refreshed. Evidence status: " + String(data.evidence_status || "unknown").toUpperCase() + ". No automatic correction or polling is running.",
        data.evidence_status === "observed" ? "ok" : "warn"
      );
    } catch (error) {
      $("summaryGrid").innerHTML = '<div class="learning-empty">No learning snapshot is available.</div>';
      $("candidateList").innerHTML = '<div class="learning-empty">No repeated pattern can be supported from unavailable evidence.</div>';
      $("sourceList").innerHTML = '<div class="learning-empty">Evidence source status unavailable.</div>';
      status(error?.message || "Learning evidence could not be loaded.", "bad");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderSummary(data) {
    const staff = data.staff_workflow || {};
    const support = data.support_exceptions || {};
    const cards = [
      ["Staff tasks observed", staff.tasks_observed ?? 0, String(staff.repeated_task_patterns ?? 0) + " repeated pattern(s)"],
      ["Urgent staff tasks", staff.urgency_counts?.urgent ?? 0, String(staff.urgency_counts?.high ?? 0) + " high"],
      ["Support exceptions", support.exceptions_observed ?? 0, String(support.repeated_exception_patterns ?? 0) + " repeated pattern(s)"],
      ["Critical exceptions", support.severity_counts?.critical ?? 0, String(support.severity_counts?.warning ?? 0) + " warning"],
      ["Learning candidates", (data.learning_candidates || []).length, "Root cause proven: NO"]
    ];
    $("summaryGrid").innerHTML = cards.map((row) =>
      '<article class="learning-stat"><span class="mini">' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong><span class="mini">' + esc(row[2]) + '</span></article>'
    ).join("");
  }

  function renderCandidates(rows) {
    const mount = $("candidateList");
    if (!rows.length) {
      mount.innerHTML = '<div class="learning-empty">No repeated pattern is supported by the current bounded snapshot. This does not prove staff workflows are friction-free.</div>';
      return;
    }
    mount.innerHTML = rows.map((row) =>
      '<article class="learning-candidate priority-' + esc(row.priority || "normal") + '">' +
        '<div class="learning-candidate-head"><strong>' + esc(label(row.area)) + '</strong><span class="pill">' + esc(row.evidence_state || "unavailable") + '</span></div>' +
        '<p>' + esc(row.finding || "") + '</p>' +
        '<p class="mini"><strong>Occurrences:</strong> ' + esc(row.occurrence_count ?? 0) + ' · <strong>Priority:</strong> ' + esc(row.priority || "normal") + '</p>' +
        '<p class="mini"><strong>Bounded operator review:</strong> ' + esc(row.bounded_operator_review || "") + '</p>' +
        '<p class="mini">Root cause proven: NO · Automatic correction authorized: NO</p>' +
      '</article>'
    ).join("");
  }

  function renderSources(sources) {
    $("sourceList").innerHTML = Object.entries(sources).map(([name, row]) =>
      '<div class="learning-source"><strong>' + esc(label(name)) + '</strong><span class="pill">' + esc(row?.restricted ? "restricted" : row?.available ? "available" : "unavailable") + '</span><span class="mini">HTTP ' + esc(row?.http_status ?? "—") + '</span></div>'
    ).join("") || '<div class="learning-empty">No source status available.</div>';
  }

  function status(message, tone) {
    const node = $("learningStatus");
    node.hidden = false;
    node.className = "notice " + (tone || "soft");
    node.textContent = message;
  }

  function label(value) {
    return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  document.addEventListener("DOMContentLoaded", () => {
    globalScope.AdminShell?.boot?.({
      pageKey: "admin-staff-workflow-support-learning",
      onReady: async () => {
        $("refreshLearning")?.addEventListener("click", refresh);
        status("Select Refresh learning snapshot to load current bounded evidence.", "soft");
      }
    });
  }, { once: true });
})(window);
