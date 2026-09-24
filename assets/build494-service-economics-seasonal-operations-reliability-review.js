// Build 494 — manual, read-only cross-domain reconciliation UI.
(function () {
  "use strict";
  const mount = () => document.getElementById("build494ReviewGrid");
  const detail = () => document.getElementById("build494ReviewDetail");
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));

  async function refreshBuild494() {
    if (!mount()) return;
    const month = document.getElementById("reviewMonth")?.value || "";
    const year = document.getElementById("reviewYear")?.value || "";
    if (detail()) detail().textContent = "Refreshing cross-domain reconciliation from the retained read-only authorities…";
    try {
      const response = await fetch(
        "/api/admin/service_economics_seasonal_operations_reliability_review?month=" + encodeURIComponent(month) + "&year=" + encodeURIComponent(year) + "&days=90",
        { method:"GET", credentials:"include", cache:"no-store", headers:{ Accept:"application/json" } }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error || "Build 494 reconciliation evidence could not be loaded.");
      render(data);
    } catch (error) {
      mount().innerHTML = '<div class="review-empty">' + esc(error?.message || "Build 494 reconciliation evidence is unavailable.") + '</div>';
      if (detail()) detail().textContent = "Missing or restricted evidence remains unavailable; no cross-domain conclusion was inferred.";
    }
  }

  function render(data) {
    const domains = data.domain_review || {};
    const allocation = domains.service_add_on_allocation || {};
    const seasonal = domains.seasonal_operations || {};
    const capacity = domains.operational_capacity || {};
    const reliability = domains.reliability_continuity || {};
    const rows = [
      ["Reconciliation", String(data.review_status || "unavailable").toUpperCase(), data.review_ready ? "All bounded domain evidence is review-ready" : "One or more bounded domains remain review/HOLD"],
      ["Service/add-on allocation", String(allocation.status || "unavailable").toUpperCase(), "Explicit recorded linkage only"],
      ["Seasonal capability", String(seasonal.status || "unavailable").toUpperCase(), String(seasonal.valid_capability_row_count ?? 0) + " explicit capability row(s)"],
      ["Observed capacity", String(capacity.status || "unavailable").toUpperCase(), "Demand is not used as a capacity proxy"],
      ["Reliability continuity", String(reliability.status || "unavailable").toUpperCase(), "Provider cost and recovery evidence stay separately sourced"],
      ["Automatic action", "NONE", "No price, booking, provider, restore, accounting, inventory or schema mutation"]
    ];
    mount().innerHTML = rows.map((row) =>
      '<article class="review-stat"><span class="mini">' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong><span class="mini">' + esc(row[2]) + '</span></article>'
    ).join("");
    if (detail()) {
      const gaps = Array.isArray(data.review_gaps) ? data.review_gaps.length : 0;
      detail().textContent = "Build 494 is descriptive and read-only. " + String(gaps) + " bounded review gap(s) remain. Southern Ontario seasonal restrictions are not application reliability failures.";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("refreshReview");
    if (button) button.addEventListener("click", refreshBuild494);
  });
})();
