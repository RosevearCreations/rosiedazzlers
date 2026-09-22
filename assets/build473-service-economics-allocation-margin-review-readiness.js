// Build 473 — manual, aggregate-only service economics allocation & margin-readiness UI.
(function (globalScope) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const money = (value) => value == null ? "—" : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(value || 0));

  async function refresh() {
    const button = $("refreshReview");
    if (button) button.disabled = true;
    setStatus("Refreshing bounded allocation and margin-readiness evidence…", "soft");
    try {
      const response = await fetch(
        "/api/admin/service_economics_commercial_capacity_review?month=" + encodeURIComponent($("reviewMonth").value) +
        "&year=" + encodeURIComponent($("reviewYear").value) + "&days=90",
        { method: "GET", credentials: "include", cache: "no-store", headers: { Accept: "application/json" } }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error || "Service-economics allocation evidence could not be loaded.");
      renderSummary(data);
      renderCompleteness(data.economics?.evidence_completeness || {});
      renderAllocation(data.economics?.allocation_margin_readiness || {});
      renderCandidates(data.review_candidates || []);
      renderSources(data.source_status || {});
      const allocation = data.economics?.allocation_margin_readiness || {};
      setStatus(
        "Snapshot refreshed. Service/package allocation: " + String(allocation.service_package?.status || "unavailable").toUpperCase() +
        ". Add-on allocation: " + String(allocation.add_on?.status || "unavailable").toUpperCase() +
        ". No price, discount, booking, accounting, inventory, provider or schema action was performed.",
        allocation.service_package?.service_package_margin_review_ready ? "ok" : "warn"
      );
    } catch (error) {
      $("summaryGrid").innerHTML = '<div class="review-empty">No bounded economics snapshot is available.</div>';
      $("completenessGrid").innerHTML = '<div class="review-empty">Completeness evidence is unavailable.</div>';
      $("allocationGrid").innerHTML = '<div class="review-empty">Allocation linkage evidence is unavailable.</div>';
      $("candidateList").innerHTML = '<div class="review-empty">No margin conclusion can be supported from unavailable evidence.</div>';
      $("sourceList").innerHTML = '<div class="review-empty">Evidence source status unavailable.</div>';
      setStatus(error?.message || "Service-economics allocation evidence could not be loaded.", "bad");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderSummary(data) {
    const e = data.economics || {};
    const c = e.evidence_completeness || {};
    const allocation = e.allocation_margin_readiness || {};
    const service = allocation.service_package || {};
    const addOn = allocation.add_on || {};
    const rows = [
      ["Observed economics jobs", String(c.booking_count ?? e.booking_count ?? 0), c.all_required_layers_ready ? "All required layers ready" : "At least one required layer incomplete"],
      ["Service/package cohorts", String(service.cohort_count ?? 0), String(service.review_ready_cohort_count ?? 0) + " review-ready"],
      ["Service/package margin", service.service_package_margin_review_ready ? "READY" : "BOUNDED", "Recorded booking-to-package linkage only"],
      ["Add-on allocation rows", String(addOn.explicit_allocation_row_count ?? 0), String(addOn.review_ready_add_on_count ?? 0) + " add-on cohort(s) review-ready"],
      ["Add-on margin", addOn.add_on_margin_review_ready ? "READY" : "UNAVAILABLE", "Explicit per-add-on linkage required"],
      ["Recognized revenue", money(e.recognized_revenue_cad), "Recorded revenue only"],
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
      '<article class="review-stat"><span class="mini">' + esc(row.label || row.key || "Evidence layer") + '</span>' +
      '<strong>' + esc(String(row.ready_booking_count ?? 0) + " / " + String(row.booking_count ?? 0)) + '</strong>' +
      '<span class="mini">Ready · ' + esc(row.completeness_pct == null ? "—" : String(row.completeness_pct) + "%") +
      ' · review ' + esc(row.review_booking_count ?? 0) + ' · unavailable ' + esc(row.unavailable_booking_count ?? 0) + '</span></article>'
    ).join("");
  }

  function renderAllocation(allocation) {
    const service = allocation.service_package || {};
    const addOn = allocation.add_on || {};
    const serviceRows = Array.isArray(service.cohorts) ? service.cohorts : [];
    const addOnRows = Array.isArray(addOn.cohorts) ? addOn.cohorts : [];
    const cards = [];
    for (const row of serviceRows) {
      cards.push('<article class="review-candidate state-' + esc(row.margin_review_ready ? "observed" : "review") + '">' +
        '<div class="review-head"><strong>Service/package · ' + esc(row.package_code) + '</strong><span class="pill">' + esc(row.margin_review_ready ? "review-ready" : "blocked") + '</span></div>' +
        '<p class="mini">' + esc(String(row.allocation_ready_booking_count ?? 0) + " / " + String(row.booking_count ?? 0)) + ' booking row(s) have complete recorded component linkage.</p>' +
        '<p class="mini">Contribution shown only when every row is linked: ' + esc(money(row.contribution_cad)) + ' · inferred split: NO · overhead used for readiness: NO</p></article>');
    }
    for (const row of addOnRows) {
      cards.push('<article class="review-candidate state-' + esc(row.margin_review_ready ? "observed" : "review") + '">' +
        '<div class="review-head"><strong>Add-on · ' + esc(row.add_on_code) + '</strong><span class="pill">' + esc(row.margin_review_ready ? "review-ready" : "blocked") + '</span></div>' +
        '<p class="mini">' + esc(String(row.allocation_ready_row_count ?? 0) + " / " + String(row.evidence_row_count ?? 0)) + ' explicit allocation row(s) have complete recorded component linkage.</p>' +
        '<p class="mini">Booking-total split, equal split, price-weighted split and unrecorded percentage allocation: NOT ALLOWED.</p></article>');
    }
    if (!cards.length) cards.push('<div class="review-empty">No defensible service/add-on allocation cohort is available. Missing linkage stays unavailable rather than inferred from booking totals.</div>');
    $("allocationGrid").innerHTML = cards.join("");
  }

  function renderCandidates(rows) {
    const mount = $("candidateList");
    if (!rows.length) { mount.innerHTML = '<div class="review-empty">No bounded review candidate is supported.</div>'; return; }
    mount.innerHTML = rows.map((row) =>
      '<article class="review-candidate state-' + esc(row.state || "review") + '">' +
      '<div class="review-head"><strong>' + esc(label(row.area)) + '</strong><span class="pill">' + esc(row.state || "review") + '</span></div>' +
      '<p>' + esc(row.finding || "") + '</p>' +
      '<p class="mini"><strong>Bounded operator review:</strong> ' + esc(row.bounded_operator_review || "") + '</p>' +
      '<p class="mini">Dependency: ' + esc(row.dependency || "observed_evidence") + ' · Automatic action authorized: NO</p></article>'
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
    const node = $("reviewStatus"); node.hidden = false; node.className = "notice " + (tone || "soft"); node.textContent = message;
  }
  function label(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
  function bootPeriod() { const now = new Date(); $("reviewMonth").value = String(now.getMonth() + 1); $("reviewYear").value = String(now.getFullYear()); }

  document.addEventListener("DOMContentLoaded", () => {
    globalScope.AdminShell?.boot?.({
      pageKey: "admin-service-economics-commercial-capacity-review",
      onReady: async () => {
        bootPeriod();
        $("refreshReview")?.addEventListener("click", refresh);
        setStatus("Select Refresh review to load current bounded allocation evidence. No background monitoring is running.", "soft");
      }
    });
  }, { once: true });
})(window);
