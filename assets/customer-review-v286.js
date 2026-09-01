// Build 286 — authenticated completed-job review authority and customer prompt.
(function initBuild286CustomerReview() {
  const normalizedPath = String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
  if (normalizedPath !== "/my-account" || window.__ROSIE_BUILD286_CUSTOMER_REVIEW__) return;
  window.__ROSIE_BUILD286_CUSTOMER_REVIEW__ = true;

  const REVIEW_API = "/api/client/reviews_save";
  let eligibleBookings = null;
  let observer = null;
  let applyingOptions = false;

  function qs(selector, root = document) { return root.querySelector(selector); }
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
  function humanizePackage(code) {
    return String(code || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
      .trim() || "Completed service";
  }
  function setNotice(message, kind = "") {
    const notice = qs("#accountNotice");
    if (!notice) return;
    notice.className = kind ? `notice ${kind}` : "notice";
    notice.textContent = message;
  }
  function publishEvent(eventName, payload = {}) {
    const detail = { source: "customer_account_review", ...payload };
    try {
      if (typeof globalThis.RosieAnalytics?.track === "function") {
        globalThis.RosieAnalytics.track(eventName, detail);
      }
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent("rd:analytics", { detail: { event: eventName, ...detail } }));
    } catch {}
  }
  function ensureGuidance(select) {
    let note = qs("[data-build286-review-guidance]");
    if (!note) {
      note = document.createElement("div");
      note.className = "muted";
      note.dataset.build286ReviewGuidance = "true";
      note.style.marginTop = "6px";
      select.closest("label")?.insertAdjacentElement("afterend", note);
    }
    return note;
  }
  function relabelBookingField(select) {
    const label = select.closest("label");
    if (!label) return;
    const first = label.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) first.nodeValue = "Completed booking";
    select.required = true;
  }
  function connectObserver(select) {
    if (!observer) {
      observer = new MutationObserver(() => {
        if (!applyingOptions && Array.isArray(eligibleBookings)) queueMicrotask(() => renderEligibleBookings(select));
      });
    }
    observer.observe(select, { childList: true });
  }
  function renderEligibleBookings(select) {
    if (!Array.isArray(eligibleBookings)) return;
    applyingOptions = true;
    observer?.disconnect();
    const currentValue = String(select.value || "");
    const note = ensureGuidance(select);
    const submit = qs('#reviewForm button[type="submit"]');
    if (!eligibleBookings.length) {
      select.innerHTML = '<option value="">No completed bookings available</option>';
      select.disabled = true;
      if (submit) submit.disabled = true;
      note.textContent = "Reviews unlock after a Rosie booking is genuinely completed.";
    } else {
      const options = eligibleBookings.map((row) => {
        const date = String(row.service_date || "").slice(0, 10) || "Completed";
        return `<option value="${escapeHtml(row.id)}">${escapeHtml(date)} · ${escapeHtml(humanizePackage(row.package_code))}</option>`;
      }).join("");
      select.innerHTML = `<option value="">Choose a completed booking</option>${options}`;
      if (eligibleBookings.some((row) => String(row.id) === currentValue)) select.value = currentValue;
      select.disabled = false;
      if (submit) submit.disabled = false;
      note.textContent = "Only completed bookings on this signed-in account can be reviewed.";
    }
    connectObserver(select);
    applyingOptions = false;
  }
  async function loadEligibility(select) {
    const response = await fetch(REVIEW_API, { credentials: "include", cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok || !Array.isArray(data.eligible_bookings)) {
      throw new Error(data?.error || "Could not load completed bookings for review.");
    }
    eligibleBookings = data.eligible_bookings;
    renderEligibleBookings(select);
    publishEvent("customer_review_prompt_view", { eligible_booking_count: eligibleBookings.length });
  }
  function installSubmissionGuard(form, select) {
    form.addEventListener("submit", (event) => {
      if (!String(select.value || "").trim()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setNotice("Choose one of your completed bookings before submitting a review.", "bad");
        select.focus();
        return;
      }
      publishEvent("customer_review_submit_attempt", { completed_booking_selected: true });
    }, true);
  }
  function install() {
    const form = qs("#reviewForm");
    const select = qs("#reviewBooking");
    if (!form || !select) return;
    relabelBookingField(select);
    installSubmissionGuard(form, select);
    loadEligibility(select).catch((error) => {
      eligibleBookings = [];
      renderEligibleBookings(select);
      setNotice(error?.message || "Could not load review eligibility.", "bad");
    });
  }

  install();
})();
