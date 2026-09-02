// Build 293 — authenticated customer retention next-action orchestration.
// This adapter coordinates existing customer authorities. It does not create a review,
// quote, appointment, subscription, recurring billing, reward, discount, or maintenance price.
(function initBuild293CustomerNextActions() {
  const normalizedPath = String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
  if (normalizedPath !== "/my-account" || window.__ROSIE_BUILD293_CUSTOMER_NEXT_ACTIONS__) return;
  window.__ROSIE_BUILD293_CUSTOMER_NEXT_ACTIONS__ = true;

  const DASHBOARD_API = "/api/client/dashboard";
  const COMPLETED_STATUS = /complete|completed|done|finished/i;
  const REJECTED_STATUS = /cancel|refund|failed|declin|void/i;

  function qs(selector, root = document) { return root.querySelector(selector); }
  function cleanText(value, max = 160) { return String(value || "").trim().slice(0, max); }
  function cleanDate(value) {
    const date = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
  }
  function localTodayIso() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  function bookingStatus(row) { return `${row?.status || ""} ${row?.job_status || ""}`.trim(); }
  function isCompleted(row) { return COMPLETED_STATUS.test(bookingStatus(row)) && !REJECTED_STATUS.test(bookingStatus(row)); }
  function isPastRepeatable(row) {
    const packageCode = cleanText(row?.package_code, 120);
    const serviceDate = cleanDate(row?.service_date);
    return !!packageCode && !!serviceDate && serviceDate < localTodayIso() && !REJECTED_STATUS.test(bookingStatus(row));
  }
  function reviewBookingIds(reviews) {
    return new Set((Array.isArray(reviews) ? reviews : []).map((row) => String(row?.booking_id || "")).filter(Boolean));
  }
  function latest(rows, predicate) {
    return (Array.isArray(rows) ? rows : [])
      .filter(predicate)
      .sort((a, b) => String(b?.service_date || b?.created_at || "").localeCompare(String(a?.service_date || a?.created_at || "")))[0] || null;
  }
  function rebookHref(row) {
    const query = new URLSearchParams({
      rebook_package: cleanText(row?.package_code, 120),
      rebook_date: cleanDate(row?.service_date)
    });
    return `/book?${query.toString()}`;
  }
  function progressHref(row) {
    const token = cleanText(row?.progress_token, 240);
    return token && row?.progress_enabled ? `/progress?token=${encodeURIComponent(token)}` : "";
  }
  function track(event, payload = {}) {
    try {
      window.dispatchEvent(new CustomEvent("rd:analytics", {
        detail: { event, source: "customer_next_action", ...payload }
      }));
    } catch {}
  }

  function chooseNextAction(data) {
    const bookings = Array.isArray(data?.bookings) ? data.bookings : [];
    const reviewed = reviewBookingIds(data?.reviews);
    const unreviewedCompleted = latest(bookings, (row) => isCompleted(row) && !reviewed.has(String(row?.id || "")));
    if (unreviewedCompleted) {
      return {
        key: "review_completed_service",
        badge: "Completed service",
        title: "Share feedback from your completed detail",
        copy: "Your review stays yours. Rosie only offers the review form for a genuinely completed booking on this signed-in account.",
        href: "#reviewForm",
        label: "Review completed service"
      };
    }

    const repeatable = latest(bookings, isPastRepeatable);
    if (repeatable) {
      return {
        key: "rebook_service",
        badge: "Ready when you are",
        title: "Book your next detail",
        copy: "Start from your previous service choice. Current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated by the current booking flow.",
        href: rebookHref(repeatable),
        label: "Book this service again"
      };
    }

    const activeWithProgress = latest(bookings, (row) => !!progressHref(row) && !REJECTED_STATUS.test(bookingStatus(row)));
    if (activeWithProgress) {
      return {
        key: "open_progress",
        badge: "Current booking",
        title: "Check your detail progress",
        copy: "Open the progress view already attached to your current booking.",
        href: progressHref(activeWithProgress),
        label: "Open progress"
      };
    }

    return {
      key: "book_first_or_next_service",
      badge: "Your next step",
      title: "Plan your next detail",
      copy: "Choose a current service and time through Rosie's booking flow. No appointment is created until you complete the booking steps.",
      href: "/book",
      label: "Open booking"
    };
  }

  function ensureHub() {
    let section = qs("[data-build293-next-actions]");
    if (section) return section;
    const noticeSection = qs("#accountNotice")?.closest(".section");
    const main = qs("main");
    if (!noticeSection || !main) return null;
    section = document.createElement("section");
    section.className = "section";
    section.dataset.build293NextActions = "true";
    section.innerHTML = `
      <div class="panel" aria-labelledby="customerNextActionTitle293">
        <div class="section-head">
          <div>
            <div class="badge" data-build293-next-badge>Your next step</div>
            <h2 id="customerNextActionTitle293" style="margin:8px 0">What’s next?</h2>
            <p class="muted" data-build293-next-copy>Loading the next useful account action…</p>
          </div>
          <a class="btn primary" data-build293-next-link href="/book">Open booking</a>
        </div>
        <p class="muted" style="margin:10px 0 0">This panel only links to existing Rosie actions. It never creates a review, quote, appointment, subscription, recurring billing, reward or discount by itself.</p>
      </div>`;
    noticeSection.insertAdjacentElement("afterend", section);
    return section;
  }

  function renderNextAction(data) {
    const section = ensureHub();
    if (!section) return;
    const action = chooseNextAction(data);
    const badge = qs("[data-build293-next-badge]", section);
    const title = qs("#customerNextActionTitle293", section);
    const copy = qs("[data-build293-next-copy]", section);
    const link = qs("[data-build293-next-link]", section);
    if (badge) badge.textContent = action.badge;
    if (title) title.textContent = action.title;
    if (copy) copy.textContent = action.copy;
    if (link) {
      link.href = action.href;
      link.textContent = action.label;
      link.dataset.build293NextAction = action.key;
      link.addEventListener("click", () => track("customer_next_action_open", { action: action.key }), { once: true });
    }
    document.documentElement.dataset.build293CustomerNextActions = "ready";
    track("customer_next_action_view", { action: action.key });
  }

  function alignMaintenanceInterestBoundary() {
    const wrap = qs("#maintenanceConversion");
    if (!wrap) return;
    wrap.innerHTML = `
      <article class="maintenance-offer" data-build293-maintenance-boundary>
        <div class="badge">Maintenance interest</div>
        <h3>Tell Rosie when repeat detailing may be useful</h3>
        <p class="muted">Maintenance timing is an interest preference reviewed after service context is known. No fixed cadence, price, discount, priority, subscription, appointment or recurring billing is created from this account panel.</p>
        <div class="actions"><a class="btn ghost" href="/maintenance-plan">Open maintenance interest</a></div>
      </article>`;
  }

  async function loadDashboard() {
    const response = await fetch(DASHBOARD_API, { credentials: "include", cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.authenticated !== true || !Array.isArray(data?.bookings)) return null;
    return data;
  }

  function installAfterAccountLoad(data) {
    renderNextAction(data);
    // The legacy account renderer may repaint its old maintenance-conversion panel after
    // this adapter loads. Reapply the Build 291 interest-only boundary when account load settles.
    const notice = qs("#accountNotice");
    const apply = () => {
      const text = String(notice?.textContent || "").toLowerCase();
      if (text.includes("account loaded") || text.includes("account ready")) alignMaintenanceInterestBoundary();
    };
    if (notice) new MutationObserver(apply).observe(notice, { childList: true, characterData: true, subtree: true });
    apply();
  }

  ensureHub();
  loadDashboard().then((data) => {
    if (!data) return;
    installAfterAccountLoad(data);
  }).catch(() => {
    // Build 289 owns manual recovery. Build 293 does not poll or retry account reads.
  });
})();
