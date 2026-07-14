// Build 225 — consent-first third-party marketing tag loader.
// It intentionally avoids authenticated, payment, booking-progress, and internal routes.
// Public tag identifiers are requested only from /api/tracking_config; secrets never reach this browser code.
(function attachRosieMarketingConsent(globalScope) {
  const STORAGE_KEY = "rosie_marketing_consent";
  const BANNER_ID = "rosieMarketingConsent";
  const BLOCKED_PATHS = [
    /^\/admin(?:\/|$|-)/,
    /^\/client(?:\/|$|-)/,
    /^\/detailer(?:\/|$|-)/,
    /^\/login(?:\/|$|-)/,
    /^\/my-account(?:\/|$|-)/,
    /^\/progress(?:\/|$|-)/,
    /^\/final-balance-payment(?:\/|$|-)/,
    /^\/quote-payment(?:\/|$|-)/,
    /^\/checkout(?:\/|$|-)/,
    /^\/complete(?:\/|$|-)/,
    /^\/invoice(?:\/|$|-)/,
    /^\/privacy(?:\/|$|-)/,
    /^\/terms(?:\/|$|-)/,
    /^\/book(?:\/|$|-)/
  ];

  let config = null;
  let applied = false;

  function blockedRoute() {
    const path = String(location.pathname || "/");
    return BLOCKED_PATHS.some((rule) => rule.test(path));
  }

  function readConsent(version) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== version || !["accepted", "declined"].includes(parsed.choice)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function writeConsent(choice, version) {
    const record = { choice, version, saved_at:new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch {}
    return record;
  }

  function loadScript(src, id) {
    if (id && document.getElementById(id)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      if (id) script.id = id;
      script.async = true;
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(script);
    });
  }

  function createGoogleTag(ids, isTest) {
    const ga = ids.google_analytics?.id;
    const ads = ids.google_ads?.id;
    const firstId = ga || ads;
    if (!firstId) return;
    globalScope.dataLayer = globalScope.dataLayer || [];
    globalScope.gtag = globalScope.gtag || function(){ globalScope.dataLayer.push(arguments); };
    globalScope.gtag("js", new Date());
    if (ga) globalScope.gtag("config", ga, { anonymize_ip:true, ...(isTest ? { debug_mode:true } : {}) });
    if (ads) globalScope.gtag("config", ads, { ...(isTest ? { debug_mode:true } : {}) });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(firstId)}`, "rosieGoogleTag").catch(() => {});
  }

  function createMetaPixel(id) {
    if (!id || globalScope.fbq) return;
    (function(f,b,e,v,n,t,s){
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments);};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
    })(globalScope,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    globalScope.fbq("init", id);
    globalScope.fbq("track", "PageView");
  }

  function createTikTokPixel(id) {
    if (!id || globalScope.ttq) return;
    const ttq = globalScope.ttq = globalScope.ttq || [];
    ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
    ttq.setAndDefer = function(t,e){t[e]=function(){t.push([e].concat([].slice.call(arguments,0)));};};
    for (let i=0;i<ttq.methods.length;i++) ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.instance = function(t){const e=ttq._i[t]||[];for(let n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e;};
    ttq.load = function(e,n){const i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};const o=document.createElement("script");o.async=!0;o.src=i+"?sdkid="+encodeURIComponent(e)+"&lib=ttq";const a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a);};
    ttq.load(id);
    ttq.page();
  }

  function createLinkedInInsight(id) {
    if (!id || globalScope._linkedin_data_partner_ids?.includes(id)) return;
    globalScope._linkedin_partner_id = id;
    globalScope._linkedin_data_partner_ids = globalScope._linkedin_data_partner_ids || [];
    globalScope._linkedin_data_partner_ids.push(id);
    globalScope.lintrk = globalScope.lintrk || function(a,b){ globalScope.lintrk.q = globalScope.lintrk.q || []; globalScope.lintrk.q.push([a,b]); };
    loadScript("https://snap.licdn.com/li.lms-analytics/insight.min.js", "rosieLinkedInInsight").catch(() => {});
  }

  function createPinterestTag(id) {
    if (!id || globalScope.pintrk) return;
    !function(e){if(!globalScope.pintrk){globalScope.pintrk=function(){globalScope.pintrk.queue.push(Array.prototype.slice.call(arguments));};var n=globalScope.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r);}}("https://s.pinimg.com/ct/core.js");
    globalScope.pintrk("load", id);
    globalScope.pintrk("page");
  }

  function createMicrosoftUet(id) {
    if (!id || globalScope.uetq) return;
    (function(w,d,t,r,u){const f=d.createElement(t);f.src=r;f.async=1;const s=d.getElementsByTagName(t)[0];s.parentNode.insertBefore(f,s);w[u]=w[u]||[];w[u].push("pageLoad");})(globalScope,document,"script",`https://bat.bing.com/bat.js?uetq=${encodeURIComponent(id)}`,"uetq");
  }

  function applyTracking(activeConfig) {
    if (applied || !activeConfig?.enabled || !activeConfig.providers) return;
    applied = true;
    const ids = activeConfig.providers;
    const isTest = activeConfig.mode === "test";
    createGoogleTag(ids, isTest);
    createMetaPixel(ids.meta_pixel?.id);
    createTikTokPixel(ids.tiktok_pixel?.id);
    createLinkedInInsight(ids.linkedin_insight?.id);
    createPinterestTag(ids.pinterest_tag?.id);
    createMicrosoftUet(ids.microsoft_uet?.id);
    document.documentElement.dataset.marketingTracking = activeConfig.mode || "enabled";
  }

  function bannerStyle() {
    if (document.getElementById("rosieMarketingConsentStyle")) return;
    const style = document.createElement("style");
    style.id = "rosieMarketingConsentStyle";
    style.textContent = `
      #${BANNER_ID}{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:760px;margin:auto;padding:16px;border-radius:18px;background:#0f172a;color:#f8fafc;border:1px solid rgba(255,255,255,.18);box-shadow:0 22px 70px rgba(0,0,0,.45);font-family:inherit}
      #${BANNER_ID} .rosie-consent-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      #${BANNER_ID} button{border:1px solid rgba(255,255,255,.24);border-radius:10px;padding:9px 12px;font:inherit;font-weight:800;cursor:pointer;background:rgba(255,255,255,.08);color:#fff}
      #${BANNER_ID} button[data-choice="accepted"]{background:#facc15;color:#111827;border-color:#facc15}
      #${BANNER_ID} a{color:#bfdbfe}
      @media(max-width:520px){#${BANNER_ID}{left:8px;right:8px;bottom:8px;padding:14px}.rosie-consent-actions button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function showBanner(activeConfig) {
    if (document.getElementById(BANNER_ID)) return;
    bannerStyle();
    const banner = document.createElement("section");
    banner.id = BANNER_ID;
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Optional marketing measurement choices");
    banner.innerHTML = `
      <strong>Optional marketing measurement</strong>
      <p style="margin:8px 0 0;color:#cbd5e1">With permission, we may load selected advertising and analytics tags to understand which public pages help people find Rosie Dazzlers. Essential booking and site functions do not depend on this choice. See our <a href="/privacy">privacy notice</a>.</p>
      <div class="rosie-consent-actions">
        <button type="button" data-choice="accepted">Allow optional measurement</button>
        <button type="button" data-choice="declined">Use essential site only</button>
      </div>
    `;
    banner.querySelectorAll("button[data-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const choice = button.dataset.choice;
        writeConsent(choice, activeConfig.config_version);
        if (choice === "accepted") applyTracking(activeConfig);
        banner.remove();
      });
    });
    document.body.appendChild(banner);
  }

  async function init() {
    if (blockedRoute()) return;
    try {
      const response = await fetch("/api/tracking_config", { cache:"no-store", credentials:"same-origin" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok || !payload.enabled || !payload.consent_required) return;
      config = payload;
      const consent = readConsent(config.config_version);
      if (consent?.choice === "accepted") applyTracking(config);
      else if (consent?.choice !== "declined") showBanner(config);
    } catch {
      // Tracking is optional; a configuration failure must never break the public site.
    }
  }

  globalScope.RosieMarketingConsent = {
    getConfig: () => config ? { enabled:config.enabled, mode:config.mode, config_version:config.config_version } : null,
    openChoices: () => config && showBanner(config),
    revoke: () => { try { localStorage.removeItem(STORAGE_KEY); } catch {} applied = false; document.documentElement.dataset.marketingTracking = "revoked"; }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  else init();
})(window);
