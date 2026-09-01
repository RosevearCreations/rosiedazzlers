// Build 287 — customer-share booking entry attribution.
// Exact UTM markers are presentation/analytics evidence only. This module must not
// alter service, vehicle, package, price, availability, add-ons, deposit or payment authority.
(function initBuild287CustomerShareEntry() {
  const normalizedPath = String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
  if (normalizedPath !== "/book" || window.__ROSIE_BUILD287_CUSTOMER_SHARE_ENTRY__) return;

  const params = new URLSearchParams(location.search);
  if (params.get("utm_source") !== "customer_share" || params.get("utm_campaign") !== "customer_referral") return;
  window.__ROSIE_BUILD287_CUSTOMER_SHARE_ENTRY__ = true;

  const ANALYTICS_ASSET = "/assets/public-analytics.js";

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

  function showAttributionNotice() {
    if (qs("[data-build287-share-entry]")) return;
    const main = qs("main");
    if (!main) return;
    const note = document.createElement("div");
    note.className = "notice";
    note.dataset.build287ShareEntry = "true";
    note.textContent = "This booking link was shared by a Rosie customer. Current service selection, vehicle size, availability, add-ons, price, deposit and payment rules still apply.";
    main.prepend(note);
  }

  showAttributionNotice();
  ensureAnalytics().then((analytics) => {
    try {
      analytics?.track?.("customer_share_booking_entry", {
        entry: "customer_share",
        authority: "analytics_only",
        reward_applied: false
      });
    } catch {}
  }).catch(() => {});
})();
