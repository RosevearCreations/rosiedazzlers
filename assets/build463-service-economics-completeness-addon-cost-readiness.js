// Build 463 — manual, aggregate-only economics completeness & add-on cost-readiness UI.
(function (globalScope) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const money = (value) => value == null ? "—" : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(value || 0));

  async function refresh() {
    const button = $("refreshReview");
    if (button) button.disabled = true;
    setStatus("Refreshing bounded service-economics completeness evidence…", "soft");
    try {
      const response = await fetch(
        "/api/admin/service_economics_commercial_capacity_review?month=" + encodeURIComponent($("reviewMonth").value) +
        "&year=" + encodeURIComponent($("reviewYear").value) + "&days=90",
        { method: "GET", credentials: "include", cache: "no-store", headers: { Accept: "application/json" } }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error || "Service-economics completeness evidence could not be loaded.");
      renderSummary(data);
      renderCompleteness(data.economics?.evidence_completeness || {});
      renderCandidates(data.review_candidates || []);
      renderSources(data.source_status || {});
      const addOn = data.economics?.add_on_allocation_readiness || {};
      setStatus(
        "Snapshot refreshed. Service-margin review: " + (data.economics?.evidence_completeness?.service_margin_review_ready ? "READY FOR BOUNDED REVIEW" : "BLOCKED") +
        ". Add-on allocation: " + String(addOn.status || "unavailable").toUpperCase() +
        ". No pricing, discount, booking, accounting, inventory, provider or schema action was performed.",
        data.economics?.evidence_completeness?.service_margin_review_ready ? "ok" : "warn"
      );
    } catch (error) {
      $("summaryGrid").innerHTML = '<div class="review-empty">No bounded economics snapshot is available.</div>';
      $("completenessGrid").innerHTML = '<div class="review-empty">Completeness evidence is unavailable.</div>';
      $("candidateList").innerHTML = '<div class="review-empty">No margin or pricing conclusion can be supported from unavailable evidence.</div>';
      $("sourceList").innerHTML = '<div class="review-empty">Evidence source status unavailable.</div>';
      setStatus(error?.message || "Service-economics completeness evidence could not be loaded.", "bad");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderSummary(data) {
    const e = data.economics || {};
    const c = e.evidence_completeness || {};
    const addOn = e.add_on_allocation_readiness || {};
    const p = data.pricing_review || {};
    const rows = [
      ["Observed economics jobs", String(c.booking_count ?? e.booking_count ?? 0), c.all_required_layers_ready ? "All required layers ready" : "At least one required layer incomplete"],
      ["Service margin review", c.service_margin_review_ready ? "READY" : "BLOCKED", "Recorded evidence only"],
      ["Recognized revenue", money(e.recognized_revenue_cad), e.contribution_reliable_for_review ? "Contribution evidence complete" : "Contribution held from review"],
      ["Package cohorts", String((e.service_package_cohorts || []).length), c.package_cohort_review_ready ? "Bounded review-ready" : "Incomplete evidence"],
      ["Add-on allocation", String(addOn.status || "unavailable"), addOn.defensible_allocation_ready ? "Explicit recorded basis present" : "No inferred split allowed"],
      ["Add-on margin review", c.add_on_margin_review_ready ? "READY" : "UNAVAILABLE", "Requires explicit recorded add-on linkage"],
      ["Quote / pricing context", String(p.sufficient_value_band_count ?? 0) + " cohort(s)", c.pricing_context_review_ready ? "Owner review context only" : "No pricing conclusion"],
      ["Automatic decision", "NONE", "No price/discount or posting mutation"]
    ];
    $("summaryGrid").innerHTML = rows.map((row) =>
      '<article class="review-stat"><span class="mini">' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong><span class="mini">' + esc(row[2]) + '</span></article>'
    ).join("");
  }

  function renderCompleteness(completeness) {
    const rows = Object.values(completeness.layers || {});
    if (!rows.length) {
      $("completenessGrid").innerHTML = '<div class="review-empty">No retained economics layer evidence is available.</div>';
      return;
    }
    $("completenessGrid").innerHTML = rows.map((row) =>
      '<article class="review-stat">' +
        '<span class="mini">' + esc(row.label || row.key || "Evidence layer") + '</span>' +
        '<strong>' + esc(String(row.ready_booking_count ?? 0) + " / " + String(row.booking_count ?? 0)) + '</strong>' +
        '<span class="mini">Ready · ' + esc(row.completeness_pct == null ? "—" : String(row.completeness_pct) + "%") +
        ' · review ' + esc(row.review_booking_count ?? 0) + ' · unavailable ' + esc(row.unavailable_booking_count ?? 0) + '</span>' +
      '</article>'
    ).join("");
  }

  function renderCandidates(rows) {
    const mount = $("candidateList");
    if (!rows.length) {
      mount.innerHTML = '<div class="review-empty">No bounded review candidate is supported. This does not prove margins, add-on allocation or pricing are universally settled.</div>';
      return;
    }
    mount.innerHTML = rows.map((row) =>
      '<article class="review-candidate state-' + esc(row.state || "review") + '">' +
        '<div class="review-head"><strong>' + esc(label(row.area)) + '</strong><span class="pill">' + esc(row.state || "review") + '</span></div>' +
        '<p>' + esc(row.finding || "") + '</p>' +
        '<p class="mini"><strong>Bounded operator review:</strong> ' + esc(row.bounded_operator_review || "") + '</p>' +
        '<p class="mini">Dependency: ' + esc(row.dependency || "observed_evidence") + ' · Automatic action authorized: NO</p>' +
      '</article>'
    ).join("");
  }

  function renderSources(sources) {
    $("sourceList").innerHTML = Object.entries(sources).map(([name, row]) =>
      '<div class="review-source"><strong>' + esc(label(name)) + '</strong><span class="pill">' +
      esc(row?.restricted ? "restricted" : row?.available ? "available" : "unavailable") +
      '</span><span class="mini">HTTP ' + esc(row?.http_status ?? "—") + '</span></div>'
    ).join("") || '<div class="review-empty">No source status available.</div>';
  }

  function setStatus(message, tone) {
    const node = $("reviewStatus");
    node.hidden = false;
    node.className = "notice " + (tone || "soft");
    node.textContent = message;
  }
  function label(value) {
    return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }
  function bootPeriod() {
    const now = new Date();
    $("reviewMonth").value = String(now.getMonth() + 1);
    $("reviewYear").value = String(now.getFullYear());
  }

  document.addEventListener("DOMContentLoaded", () => {
    globalScope.AdminShell?.boot?.({
      pageKey: "admin-service-economics-commercial-capacity-review",
      onReady: async () => {
        bootPeriod();
        $("refreshReview")?.addEventListener("click", refresh);
        setStatus("Select Refresh review to load current bounded evidence. No background monitoring is running.", "soft");
      }
    });
  }, { once: true });
})(window);
