// Build 504 — manual, read-only same-domain trend continuity UI.
(function () {
  "use strict";
  const mount = () => document.getElementById("build504ContinuityGrid");
  const detail = () => document.getElementById("build504ContinuityDetail");
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));

  async function refreshBuild504() {
    if (!mount()) return;
    const month = document.getElementById("reviewMonth")?.value || "";
    const year = document.getElementById("reviewYear")?.value || "";
    if (detail()) detail().textContent = "Refreshing bounded same-domain continuity evidence…";
    try {
      const response = await fetch(
        "/api/admin/service_economics_seasonal_capacity_reliability_trend_continuity?month=" + encodeURIComponent(month) + "&year=" + encodeURIComponent(year) + "&days=90",
        { method:"GET", credentials:"include", cache:"no-store", headers:{ Accept:"application/json" } }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error || "Build 504 continuity evidence could not be loaded.");
      render(data);
    } catch (error) {
      mount().innerHTML = '<div class="review-empty">' + esc(error?.message || "Build 504 continuity evidence is unavailable.") + '</div>';
      if (detail()) detail().textContent = "Missing comparable evidence remains unavailable; no trend was manufactured.";
    }
  }

  function render(data) {
    const domains = data.domain_continuity || {};
    const rows = [
      ["Continuity review", String(data.review_status || "unavailable").toUpperCase(), data.review_ready ? "All four same-domain continuity requirements are evidenced" : "One or more same-domain histories remain insufficient"],
      ["Explicit allocation", String(domains.explicit_allocation?.status || "unavailable").toUpperCase(), String(domains.explicit_allocation?.comparable_cohort_count ?? 0) + " comparable cohort(s)"],
      ["Seasonal operability", String(domains.seasonal_operability?.status || "unavailable").toUpperCase(), String(domains.seasonal_operability?.comparable_service_count ?? 0) + " comparable service(s)"],
      ["Observed capacity", String(domains.observed_capacity?.status || "unavailable").toUpperCase(), String(domains.observed_capacity?.comparable_metric_count ?? 0) + " comparable capacity metric(s)"],
      ["Technical reliability", String(domains.technical_reliability?.status || "unavailable").toUpperCase(), "Bounded first-party window comparison only"],
      ["Automatic action", "NONE", "No price, booking, winter claim, capacity, provider, restore, accounting, inventory or schema mutation"]
    ];
    mount().innerHTML = rows.map((row) =>
      '<article class="review-stat"><span class="mini">' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong><span class="mini">' + esc(row[2]) + '</span></article>'
    ).join("");
    if (detail()) {
      const gaps = Array.isArray(data.review_gaps) ? data.review_gaps.length : 0;
      detail().textContent = "Build 504 is descriptive and read-only. " + String(gaps) + " continuity gap(s) remain. Southern Ontario field restrictions remain separate from application reliability.";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("refreshReview");
    if (button) button.addEventListener("click", refreshBuild504);
  });
})();
