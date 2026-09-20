// Build 441 — manual read-only learning UI.
(function attachBuild441Learning(globalScope) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  async function refresh() {
    const button = $("refreshLearning");
    const days = $("learningDays")?.value || "90";
    if (button) button.disabled = true;
    status("Refreshing bounded first-party learning evidence…", "soft");
    try {
      const response = await fetch("/api/admin/booking_quote_retention_production_learning?days=" + encodeURIComponent(days), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error || "Learning evidence could not be loaded.");
      renderSummary(data);
      renderPriorities(data.priorities || []);
      renderSources(data.source_status || {});
      status("Snapshot refreshed. Evidence status: " + String(data.evidence_status || "unknown").toUpperCase() + ". No automatic action or polling is running.", data.evidence_status === "observed" ? "ok" : "warn");
    } catch (error) {
      $("summaryGrid").innerHTML = '<div class="learning-empty">No learning snapshot is available.</div>';
      $("priorityList").innerHTML = '<div class="learning-empty">No priorities can be supported from unavailable evidence.</div>';
      $("sourceList").innerHTML = '<div class="learning-empty">Evidence source status unavailable.</div>';
      status(error?.message || "Learning evidence could not be loaded.", "bad");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderSummary(data) {
    const booking = data.booking || {};
    const quotes = data.quotes || {};
    const repeat = data.repeat_booking || {};
    const maintenance = data.maintenance_interest || {};
    const cards = [
      ["Booking starts", booking.funnel_start_sessions ?? 0, "Anonymous bounded funnel"],
      ["Checkout complete", booking.checkout_completed_sessions ?? 0, pct(booking.start_to_checkout_completion_pct) + " from start"],
      ["Quotes observed", quotes.rows_observed ?? 0, String(quotes.accepted_quotes ?? 0) + " accepted · " + String(quotes.declined_quotes ?? 0) + " declined"],
      ["Repeat customers", repeat.observed_repeat_customers ?? 0, pct(repeat.observed_repeat_customer_pct) + " of linked profiles"],
      ["Maintenance interest", maintenance.records_observed ?? 0, "Aggregate only"]
    ];
    $("summaryGrid").innerHTML = cards.map((row) =>
      '<article class="learning-stat"><span class="mini">' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong><span class="mini">' + esc(row[2]) + '</span></article>'
    ).join("");
  }

  function renderPriorities(rows) {
    const mount = $("priorityList");
    if (!rows.length) {
      mount.innerHTML = '<div class="learning-empty">No supported learning priority is available.</div>';
      return;
    }
    mount.innerHTML = rows.map((row) =>
      '<article class="learning-priority state-' + esc(row.evidence_state || "unavailable") + '">' +
        '<div class="learning-priority-head"><strong>' + esc(label(row.area)) + '</strong><span class="pill">' + esc(row.evidence_state || "unavailable") + '</span></div>' +
        '<p>' + esc(row.finding || "") + '</p>' +
        '<p class="mini"><strong>Bounded operator review:</strong> ' + esc(row.bounded_operator_review || "") + '</p>' +
        '<p class="mini">Automatic action authorized: NO</p>' +
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

  function pct(value) {
    return value == null ? "—" : Number(value).toFixed(1) + "%";
  }

  document.addEventListener("DOMContentLoaded", () => {
    globalScope.AdminShell?.boot?.({
      pageKey: "admin-booking-quote-retention-learning",
      onReady: async () => {
        $("refreshLearning")?.addEventListener("click", refresh);
        status("Select Refresh learning snapshot to load current bounded evidence.", "soft");
      }
    });
  }, { once: true });
})(window);
