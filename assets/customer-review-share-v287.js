// Build 287 — neutral completed-service review follow-up and customer sharing.
// This module does not create discounts, credits, rewards, publication authority,
// or booking authority. It reuses the Build 286 completed-booking eligibility endpoint.
(function initBuild287CustomerReviewShare() {
  const normalizedPath = String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
  if (normalizedPath !== "/my-account" || window.__ROSIE_BUILD287_CUSTOMER_REVIEW_SHARE__) return;
  window.__ROSIE_BUILD287_CUSTOMER_REVIEW_SHARE__ = true;

  const REVIEW_API = "/api/client/reviews_save";
  const ANALYTICS_ASSET = "/assets/public-analytics.js";
  const SHARE_SOURCE = "customer_share";
  const SHARE_CAMPAIGN = "customer_referral";

  function qs(selector, root = document) { return root.querySelector(selector); }

  function ensureAnalytics() {
    if (globalThis.RosieAnalytics?.track) return Promise.resolve(globalThis.RosieAnalytics);
    let script = qs(`script[src="${ANALYTICS_ASSET}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = ANALYTICS_ASSET;
      script.async = true;
      script.dataset.build287Analytics = "true";
      document.head.appendChild(script);
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve(globalThis.RosieAnalytics || null);
      };
      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", finish, { once: true });
      setTimeout(finish, 2500);
    });
  }

  function track(eventName, payload = {}) {
    ensureAnalytics().then((analytics) => {
      try { analytics?.track?.(eventName, { source: "customer_account_review_share", ...payload }); } catch {}
    }).catch(() => {});
  }

  function buildShareUrl() {
    const url = new URL("/book", location.origin);
    url.searchParams.set("utm_source", SHARE_SOURCE);
    url.searchParams.set("utm_campaign", SHARE_CAMPAIGN);
    return url.href;
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "clipboard";
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("Copy unavailable");
    return "clipboard_fallback";
  }

  function setStatus(panel, message) {
    const out = qs("[data-build287-share-status]", panel);
    if (out) out.textContent = message;
  }

  async function shareRosie(panel) {
    const url = buildShareUrl();
    const data = {
      title: "Rosie Dazzlers Mobile Auto Detailing",
      text: "Rosie Dazzlers provides mobile auto detailing in Oxford and Norfolk Counties.",
      url
    };
    track("customer_share_started", { destination: "booking" });

    if (navigator.share) {
      try {
        await navigator.share(data);
        track("customer_share_completed", { method: "native_share", destination: "booking" });
        setStatus(panel, "Share opened successfully.");
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          track("customer_share_cancelled", { method: "native_share" });
          setStatus(panel, "Share cancelled.");
          return;
        }
      }
    }

    try {
      const method = await copyText(url);
      track("customer_share_completed", { method, destination: "booking" });
      setStatus(panel, "Booking link copied.");
    } catch {
      setStatus(panel, "Could not copy the link automatically.");
    }
  }

  function renderPanel({ googleReviewUrl }) {
    if (qs("[data-build287-review-share]")) return;
    const reviewForm = qs("#reviewForm");
    if (!reviewForm) return;
    const host = reviewForm.closest(".panel") || reviewForm.parentElement;
    if (!host) return;

    const panel = document.createElement("section");
    panel.dataset.build287ReviewShare = "true";
    panel.className = "maintenance-offer";
    panel.style.marginTop = "14px";
    panel.innerHTML = `
      <div class="badge">After your completed service</div>
      <h3 style="margin:8px 0">Review or share Rosie</h3>
      <p class="muted">Your feedback is always your own. You can open Rosie on Google or share a booking link with someone who needs mobile detailing. Sharing does not create a discount, credit, or reward.</p>
      <div class="actions" style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn ghost" data-build287-google-review target="_blank" rel="noopener noreferrer">Review Rosie on Google</a>
        <button class="btn primary" type="button" data-build287-share-action>Share Rosie</button>
      </div>
      <div class="muted" data-build287-share-status style="margin-top:8px"></div>
    `;
    const google = qs("[data-build287-google-review]", panel);
    if (googleReviewUrl) {
      google.href = googleReviewUrl;
      google.addEventListener("click", () => track("customer_google_review_open", { destination: "google" }));
    } else {
      google.remove();
    }
    qs("[data-build287-share-action]", panel)?.addEventListener("click", () => shareRosie(panel));
    host.appendChild(panel);
    track("customer_review_share_prompt_view", { google_available: !!googleReviewUrl });
  }

  async function install() {
    const response = await fetch(REVIEW_API, { credentials: "include", cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) return;
    if (!Array.isArray(data.eligible_bookings) || data.eligible_bookings.length === 0) return;
    const googleReviewUrl = String(data.google_review_url || "").trim();
    renderPanel({ googleReviewUrl });
  }

  install().catch(() => {});
})();
