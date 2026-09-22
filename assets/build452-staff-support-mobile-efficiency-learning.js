// Build 472 — manual remediation verification over retained Build 462 staff/mobile priorities.
(function attachBuild452Learning(globalScope) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  async function refresh() {
    const button = $("refreshEfficiencyLearning452");
    if (button) button.disabled = true;
    setStatus("Refreshing bounded staff, support and Detailer workspace evidence…", "soft");
    try {
      const response = await fetch("/api/admin/staff_support_mobile_efficiency_learning", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error || "Efficiency learning evidence could not be loaded.");
      renderSummary(data);
      renderMobile(data.mobile_field_workflow || {});
      renderVerification(data.remediation_verification_summary || {}, data.remediation_verification || []);
      renderRemediation(data.remediation_priorities || []);
      renderCandidates(data.learning_candidates || []);
      renderSources(data.source_status || {});
      setStatus(
        "Snapshot refreshed. Evidence status: " + String(data.evidence_status || "unknown").toUpperCase() + ". Verification remains fail-closed unless attributable remediation and comparable before/after evidence exist.",
        data.evidence_status === "observed" ? "ok" : "warn"
      );
    } catch (error) {
      $("summaryGrid").innerHTML = '<div class="learning-empty">No bounded learning snapshot is available.</div>';
      $("mobileGrid").innerHTML = '<div class="learning-empty">No Detailer workspace cohort evidence is available.</div>';
      $("remediationVerificationList").innerHTML = '<div class="learning-empty">No remediation verification evidence is available.</div>';
      $("remediationPriorityList").innerHTML = '<div class="learning-empty">No bounded remediation priority is available.</div>';
      $("candidateList").innerHTML = '<div class="learning-empty">No supported review candidate is available.</div>';
      $("sourceList").innerHTML = '<div class="learning-empty">Evidence source status unavailable.</div>';
      setStatus(error?.message || "Efficiency learning evidence could not be loaded.", "bad");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderSummary(data) {
    const staff = data.staff_workflow || {};
    const support = data.support_exceptions || {};
    const mobile = data.mobile_field_workflow || {};
    const cards = [
      ["Staff tasks observed", staff.tasks_observed ?? 0, String(staff.repeated_task_patterns ?? 0) + " repeated pattern(s)"],
      ["Support exceptions", support.exceptions_observed ?? 0, String(support.repeated_exception_patterns ?? 0) + " repeated pattern(s)"],
      ["Detailer jobs observed", mobile.jobs_observed ?? 0, mobile.possibly_truncated ? "Bounded row limit reached" : "Bounded workspace"],
      ["Pending detailer responses", mobile.response_counts?.pending ?? 0, "Not proof of refusal or missed notification"],
      ["Review candidates", (data.learning_candidates || []).length, "Root cause / delay proven: NO"],
      ["Verified remediation outcomes", data.remediation_verification_summary?.remediation_outcome_verified_count ?? 0, "No outcome inferred from priority or timing"]
    ];
    $("summaryGrid").innerHTML = cards.map((row) =>
      '<article class="learning-stat"><span class="mini">' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong><span class="mini">' + esc(row[2]) + '</span></article>'
    ).join("");
  }

  function renderMobile(mobile) {
    const stages = Array.isArray(mobile.stage_cohorts) ? mobile.stage_cohorts : [];
    const response = mobile.response_counts || {};
    const stageHtml = stages.length
      ? stages.slice(0, 10).map((row) =>
        '<div class="learning-source"><strong>' + esc(label(row.stage)) + '</strong><span class="pill">' + esc(row.count ?? 0) + ' job(s)</span><span class="mini">' +
        (row.review_cohort_sufficient ? "Review cohort only; no delay/friction inference." : "Below repeated-review threshold.") + '</span></div>'
      ).join("")
      : '<div class="learning-empty">No current workflow-stage cohort is available.</div>';
    $("mobileGrid").innerHTML =
      '<div class="learning-summary">' +
        stat("Accepted responses", response.accepted ?? 0) +
        stat("Pending responses", response.pending ?? 0) +
        stat("Declined responses", response.declined ?? 0) +
        stat("Unknown response", response.unknown ?? 0) +
      '</div><div class="learning-list" style="margin-top:12px">' + stageHtml + '</div>';
  }

  function stat(name, value) {
    return '<article class="learning-stat"><span class="mini">' + esc(name) + '</span><strong>' + esc(value) + '</strong><span class="mini">aggregate only</span></article>';
  }

  function renderVerification(summary, rows) {
    const mount = $("remediationVerificationList");
    if (!mount) return;
    const state = String(summary?.state || "unavailable");
    const head =
      '<div class="learning-source"><strong>Verification state</strong><span class="pill">' + esc(label(state)) + '</span><span class="mini">' +
      esc(summary?.current_pattern_evidence_count ?? 0) + ' current pattern(s) · ' +
      esc(summary?.remediation_outcome_verified_count ?? 0) + ' verified remediation outcome(s)</span></div>';
    if (!rows.length) {
      mount.innerHTML = head + '<div class="learning-empty">No current remediation-priority row is available. This does not prove a remediation worked or that the workflow is friction-free.</div>';
      return;
    }
    mount.innerHTML = head + rows.map((row) =>
      '<article class="learning-candidate priority-' + esc(row.review_priority || "normal") + '">' +
        '<div class="learning-candidate-head"><strong>#' + esc(row.rank ?? "—") + ' · ' + esc(label(row.area)) + '</strong><span class="pill">' + esc(label(row.verification_status || "unavailable")) + '</span></div>' +
        '<p>' + esc(row.conclusion || "") + '</p>' +
        '<p class="mini"><strong>Current bounded occurrences:</strong> ' + esc(row.current_occurrence_count ?? 0) + ' · <strong>Current pattern evidence:</strong> ' + (row.current_pattern_evidence_present ? "YES" : "NO") + '</p>' +
        '<p class="mini"><strong>Recorded remediation execution:</strong> NO · <strong>Comparable before/after evidence:</strong> NO · <strong>Outcome verified:</strong> NO</p>' +
        '<p class="mini"><strong>Manual verification:</strong> ' + esc(row.manual_verification || "") + '</p>' +
        '<p class="mini">Root cause proven: NO · Staff fault inferred: NO · Device friction proven: NO · Business impact proven: NO</p>' +
      '</article>'
    ).join("");
  }

  function renderRemediation(rows) {
    const mount = $("remediationPriorityList");
    if (!rows.length) {
      mount.innerHTML = '<div class="learning-empty">No repeated bounded evidence supports a remediation priority. This does not prove the workflow is friction-free.</div>';
      return;
    }
    mount.innerHTML = rows.map((row) =>
      '<article class="learning-candidate priority-' + esc(row.review_priority || "normal") + '">' +
        '<div class="learning-candidate-head"><strong>#' + esc(row.rank ?? "—") + ' · ' + esc(label(row.area)) + '</strong><span class="pill">' + esc(row.review_priority || "normal") + '</span></div>' +
        '<p>' + esc(row.remediation_candidate || "") + '</p>' +
        '<p class="mini"><strong>Evidence:</strong> ' + esc(row.occurrence_count ?? 0) + ' bounded occurrence(s) · ' + esc(row.evidence_state || "unavailable") + '</p>' +
        '<p class="mini"><strong>Priority basis:</strong> ' + esc(row.priority_basis || "") + '</p>' +
        '<p class="mini"><strong>Manual verification:</strong> ' + esc(row.manual_verification || "") + '</p>' +
        '<p class="mini"><strong>Uncertainty:</strong> ' + esc(label(row.uncertainty || "bounded_current_snapshot_only")) + '</p>' +
        '<p class="mini">Root cause proven: NO · Staff fault inferred: NO · Role change authorized: NO · Automatic remediation/exception resolution: NO</p>' +
      '</article>'
    ).join("");
  }

  function renderCandidates(rows) {
    const mount = $("candidateList");
    if (!rows.length) {
      mount.innerHTML = '<div class="learning-empty">No repeated bounded pattern is supported. This does not prove the workflow is friction-free.</div>';
      return;
    }
    mount.innerHTML = rows.map((row) =>
      '<article class="learning-candidate priority-' + esc(row.priority || "normal") + '">' +
        '<div class="learning-candidate-head"><strong>' + esc(label(row.area)) + '</strong><span class="pill">' + esc(row.evidence_state || "unavailable") + '</span></div>' +
        '<p>' + esc(row.finding || "") + '</p>' +
        '<p class="mini"><strong>Occurrences:</strong> ' + esc(row.occurrence_count ?? 0) + ' · <strong>Priority:</strong> ' + esc(row.priority || "normal") + '</p>' +
        '<p class="mini"><strong>Bounded operator review:</strong> ' + esc(row.bounded_operator_review || "") + '</p>' +
        '<p class="mini">Root cause proven: NO · Delay/mobile friction proven: NO · Automatic correction authorized: NO</p>' +
      '</article>'
    ).join("");
  }

  function renderSources(sources) {
    $("sourceList").innerHTML = Object.entries(sources).map(([name, row]) =>
      '<div class="learning-source"><strong>' + esc(label(name)) + '</strong><span class="pill">' +
      esc(row?.restricted ? "restricted" : row?.available ? "available" : "unavailable") +
      '</span><span class="mini">HTTP ' + esc(row?.http_status ?? "—") + '</span></div>'
    ).join("") || '<div class="learning-empty">No source status available.</div>';
  }

  function setStatus(message, tone) {
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
        $("refreshEfficiencyLearning452")?.addEventListener("click", refresh);
        setStatus("Select Refresh verification snapshot to load current bounded evidence. No background monitoring is running.", "soft");
      }
    });
  }, { once: true });
})(window);
