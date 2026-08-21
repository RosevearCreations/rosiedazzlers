// Build 236 restored full editable public chrome; historical labels: Help articles / Help Articles.
// /assets/chrome.js

/* =========================
   BRAND / NAV / FOOTER
   Editable footer fallback includes Help articles. */

/* =========================
   BRAND / NAV / FOOTER
   ========================= */

let BRAND = {
  name: "Rosie Dazzlers",
  logo: "https://assets.rosiedazzlers.ca/brand/Untitled.png",
  banner: "https://assets.rosiedazzlers.ca/brand/RosieDazzlersBanner.png",
  reviews: "/assets/brand/rosie-reviews-fallback.png",
  footerLogo: "https://assets.rosiedazzlers.ca/brand/Untitled.png",
};

let SOCIALS = [
  ["TikTok", "https://www.tiktok.com/@rosiedazzler"],
  ["Instagram", "https://www.instagram.com/rosiedazzlers/"],
  ["Facebook", "https://www.facebook.com/rosiedazzlers"],
  ["YouTube", "https://www.youtube.com/@rosiedazzlers"],
  ["Twitch", "https://www.twitch.tv/rosiedazzlers/"],
  ["X", "https://x.com/RosieDazzlers"],
  ["LinkedIn", "https://www.linkedin.com/in/rosiedazzlers/"],
];

let DEFAULT_NAV_LINKS = [
  ["/services", "Services"],
  ["/pricing", "Pricing"],
  ["/specials", "Specials"],
  ["/gallery", "Gallery"],
  ["/gift-cards", "Gift Cards"],
  ["/fleet", "Fleet"],
  ["/blog", "Help"],
  ["/faq", "FAQ"],
  ["/contact", "Contact"],
  ["/book", "Book"],
];


const PUBLIC_SETTINGS = {
  loaded: false,
  source: "static_defaults",
  business_profile: null,
  site_policies: null,
  business_hours_holidays: null,
  navigation_footer: null,
  analytics_event_registry: null,
  media_requirements: null
};

function settingValue(settings, key) {
  const item = settings && settings[key] ? settings[key] : null;
  return item && item.value && typeof item.value === "object" ? item.value : null;
}

async function loadPublicSiteSettings() {
  if (PUBLIC_SETTINGS.loaded) return PUBLIC_SETTINGS;
  PUBLIC_SETTINGS.loaded = true;
  try {
    const res = await fetch("/api/site_settings_public", { cache: "no-store", credentials: "same-origin" });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok !== true) throw new Error("Public settings unavailable");
    const settings = data.settings || {};
    PUBLIC_SETTINGS.business_profile = settingValue(settings, "business_profile");
    PUBLIC_SETTINGS.site_policies = settingValue(settings, "site_policies");
    PUBLIC_SETTINGS.business_hours_holidays = settingValue(settings, "business_hours_holidays");
    PUBLIC_SETTINGS.navigation_footer = settingValue(settings, "navigation_footer");
    PUBLIC_SETTINGS.analytics_event_registry = settingValue(settings, "analytics_event_registry");
    PUBLIC_SETTINGS.media_requirements = settingValue(settings, "media_requirements");
    PUBLIC_SETTINGS.source = "api_site_settings_public";
    applyBusinessProfileSettings(PUBLIC_SETTINGS.business_profile);
    applyNavigationSettings(PUBLIC_SETTINGS.navigation_footer);
  } catch (error) {
    PUBLIC_SETTINGS.warning = error?.message || "Using bundled public settings fallback.";
  }
  window.RosiePublicSiteSettings = PUBLIC_SETTINGS;
  return PUBLIC_SETTINGS;
}

function applyBusinessProfileSettings(profile) {
  const business = profile && typeof profile === "object" ? (profile.business || profile) : null;
  if (!business || typeof business !== "object") return;
  const contact = business.contact || {};
  BRAND = {
    ...BRAND,
    name: business.short_name || business.name || BRAND.name,
    logo: business.logo_url || BRAND.logo,
    banner: business.banner_url || BRAND.banner,
    reviews: business.reviews_image_url || BRAND.reviews,
    footerLogo: business.footer_logo_url || business.logo_url || BRAND.footerLogo
  };
  if (Array.isArray(business.social_links) && business.social_links.length) {
    SOCIALS = business.social_links
      .map((item) => [String(item.label || item.name || "Social").trim(), String(item.url || "").trim()])
      .filter((item) => item[0] && item[1]);
  }
  PUBLIC_SETTINGS.contact = {
    email: contact.public_email || contact.email || "info@rosiedazzlers.ca",
    backup_email: contact.backup_email || "rosiedazzlers@gmail.com",
    phone: contact.public_phone || contact.phone || "226-752-7613",
    service_area: business.service_area || "Oxford County and Norfolk County, Ontario",
    tagline: business.tagline || "Mobile Auto Detailing"
  };
}

function applyNavigationSettings(nav) {
  if (!nav || typeof nav !== "object") return;
  const links = Array.isArray(nav.navigation) ? nav.navigation : [];
  const cleanLinks = links
    .map((item) => [String(item.href || "").trim(), String(item.label || "").trim()])
    .filter((item) => item[0] && item[1]);
  if (cleanLinks.length) DEFAULT_NAV_LINKS = cleanLinks;
}

function businessProfileSchema() {
  const profile = PUBLIC_SETTINGS.business_profile;
  const business = profile && typeof profile === "object" ? (profile.business || profile) : null;
  if (!business || typeof business !== "object") return null;
  const contact = business.contact || {};
  const schema = business.structured_data && typeof business.structured_data === "object" ? { ...business.structured_data } : {};
  return {
    "@context": schema["@context"] || "https://schema.org",
    "@type": schema["@type"] || "AutoDetailing",
    name: schema.name || business.name || "Rosie Dazzlers Mobile Auto Detailing",
    url: schema.url || business.website || "https://rosiedazzlers.ca/",
    image: schema.image || business.banner_url || BRAND.banner,
    telephone: schema.telephone || contact.public_phone || contact.phone || "226-752-7613",
    areaServed: schema.areaServed || ["Oxford County, Ontario", "Norfolk County, Ontario"],
    address: schema.address || { "@type": "PostalAddress", addressRegion: "ON", addressCountry: "CA" },
    sameAs: schema.sameAs || (Array.isArray(business.social_links) ? business.social_links.map((item) => item.url).filter(Boolean) : [])
  };
}

function injectBusinessProfileSchema() {
  const schema = businessProfileSchema();
  if (!schema) return;
  let script = document.querySelector('script[data-editable-business-schema="true"]');
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.editableBusinessSchema = "true";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

function normalizePath(p) {
  const x = (p || "/").replace(/\/+$/, "");
  return x === "" ? "/" : x;
}

function ensureNavLinks() {
  const links = document.querySelector("#navLinks");
  if (!links) return;

  const existing = links.querySelectorAll("a");
  if (existing.length > 0) return;

  links.innerHTML = DEFAULT_NAV_LINKS.map(
    ([href, label]) => `<a href="${href}">${label}</a>`
  ).join("");
}

function setBrandImagesEverywhere() {
  document.querySelectorAll("[data-logo]").forEach((logo) => {
    logo.src = BRAND.logo;
    if (!logo.getAttribute("alt")) {
      logo.alt = `${BRAND.name} logo`;
    }
  });
}

function ensureMainBanner() {
  const path = normalizePath(location.pathname);
  if (["/book","/login","/my-account","/progress","/complete","/detailer-jobs"].includes(path)) return;

  const existingImg =
    document.querySelector("[data-main-banner] img") ||
    document.querySelector("#mainBanner img") ||
    document.querySelector(".main-banner img") ||
    document.querySelector("img[data-main-banner]") ||
    document.querySelector("img[data-banner]") ||
    document.querySelector("#bannerImage");

  if (existingImg) {
    existingImg.src = BRAND.banner;
    existingImg.alt = "Rosie Dazzlers banner";
    existingImg.loading = "eager";
    existingImg.style.display = "block";
    existingImg.style.width = "100%";
    existingImg.style.height = "auto";
    existingImg.style.objectFit = "contain";
    return;
  }

  const existingWrap =
    document.querySelector("[data-main-banner]") ||
    document.querySelector("#mainBanner") ||
    document.querySelector(".main-banner");

  if (existingWrap) {
    existingWrap.innerHTML = `
      <img
        src="${BRAND.banner}"
        alt="Rosie Dazzlers banner"
        loading="eager"
        style="display:block;width:100%;height:auto;object-fit:contain"
      >
    `;
    return;
  }

  if (document.querySelector("#globalMainBanner")) return;

  const nav = document.querySelector(".nav");
  const anchor = nav || document.querySelector("header") || document.body.firstElementChild || document.body;

  const wrap = document.createElement("div");
  wrap.id = "globalMainBanner";
  wrap.className = "container";
  wrap.style.paddingTop = "14px";
  wrap.style.paddingBottom = "8px";

  wrap.innerHTML = `
    <div
      class="panel"
      style="padding:12px;display:flex;align-items:center;justify-content:center;overflow:hidden"
    >
      <img
        src="${BRAND.banner}"
        alt="Rosie Dazzlers banner"
        loading="eager"
        style="display:block;width:100%;max-width:980px;height:auto;object-fit:contain"
      >
    </div>
  `;

  if (anchor && anchor.parentNode) {
    if (anchor === document.body) {
      document.body.insertBefore(wrap, document.body.firstChild);
    } else {
      anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    }
  } else {
    document.body.insertBefore(wrap, document.body.firstChild);
  }
}

function ensureReviewsPanel() {
  const path = normalizePath(location.pathname);
  if (path !== "/") return;

  const directImg =
    document.querySelector("[data-reviews]") ||
    document.querySelector("#reviewsImage") ||
    document.querySelector(".reviews img") ||
    document.querySelector(".review-banner img") ||
    document.querySelector("img[data-role='reviews']");

  if (directImg && directImg.tagName && directImg.tagName.toLowerCase() === "img") {
    directImg.src = BRAND.reviews;
    directImg.alt = "Rosie Dazzlers reviews";
    directImg.onerror = function(){ this.onerror = null; this.src = "/assets/brand/rosie-reviews-fallback.png"; };
    directImg.loading = "lazy";
    directImg.style.display = "block";
    directImg.style.width = "100%";
    directImg.style.height = "auto";
    directImg.style.objectFit = "contain";
    return;
  }

  const wrapTarget =
    document.querySelector(".reviews") ||
    document.querySelector(".review-banner") ||
    document.querySelector("[data-reviews-wrap]");

  if (wrapTarget) {
    wrapTarget.innerHTML = `
      <img
        src="${BRAND.reviews}"
        onerror="this.onerror=null;this.src='/assets/brand/rosie-reviews-fallback.png'"
        alt="Rosie Dazzlers reviews"
        loading="lazy"
        style="display:block;width:100%;height:auto;object-fit:contain"
      >
    `;
    return;
  }

  if (document.querySelector("#globalReviewsPanel")) return;

  const afterBanner =
    document.querySelector("#globalMainBanner") ||
    document.querySelector("[data-main-banner]") ||
    document.querySelector("#mainBanner") ||
    document.querySelector(".main-banner");

  const homePackages =
    document.querySelector("#homePackages") ||
    document.querySelector("main") ||
    document.querySelector(".container");

  const wrap = document.createElement("div");
  wrap.id = "globalReviewsPanel";
  wrap.className = "container";
  wrap.style.paddingTop = "8px";
  wrap.style.paddingBottom = "8px";

  wrap.innerHTML = `
    <div
      class="panel"
      style="padding:12px;display:flex;align-items:center;justify-content:center;overflow:hidden"
    >
      <img
        src="${BRAND.reviews}"
        onerror="this.onerror=null;this.src='/assets/brand/rosie-reviews-fallback.png'"
        alt="Rosie Dazzlers reviews"
        loading="lazy"
        style="display:block;width:100%;max-width:980px;height:auto;object-fit:contain"
      >
    </div>
  `;

  if (afterBanner && afterBanner.parentNode) {
    if (afterBanner.nextSibling) {
      afterBanner.parentNode.insertBefore(wrap, afterBanner.nextSibling);
    } else {
      afterBanner.parentNode.appendChild(wrap);
    }
    return;
  }

  if (homePackages && homePackages.parentNode) {
    homePackages.parentNode.insertBefore(wrap, homePackages);
    return;
  }

  document.body.appendChild(wrap);
}

function setActiveNavLink() {
  const path = normalizePath(location.pathname);
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = normalizePath(a.getAttribute("href") || "/");
    const active =
      (href === "/" && path === "/") ||
      (href !== "/" && path.startsWith(href));
    a.classList.toggle("active", active);
  });
}

function initNavToggle() {
  const btn = document.querySelector("#navToggle");
  const links = document.querySelector("#navLinks");
  if (!btn || !links) return;

  links.classList.add("nav-links--compact-ready");
  if (!btn.getAttribute("aria-controls")) btn.setAttribute("aria-controls", links.id || "navLinks");
  btn.setAttribute("aria-label", btn.getAttribute("aria-label") || "Open main menu");

  function closeMenu() {
    links.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open main menu");
  }

  function openMenu() {
    links.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close main menu");
  }

  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (links.classList.contains("open")) closeMenu();
    else openMenu();
  });

  links.addEventListener("click", (event) => {
    if (event.target && event.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!links.classList.contains("open")) return;
    if (event.target === btn || btn.contains(event.target) || links.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 880) closeMenu();
  });
}

function setFooter() {
  const el = document.querySelector("[data-footer]");
  if (!el) return;

  const year = new Date().getFullYear();
  const profile = PUBLIC_SETTINGS.business_profile || {};
  const business = profile.business || profile || {};
  const contact = PUBLIC_SETTINGS.contact || {};
  const policies = PUBLIC_SETTINGS.site_policies?.policies || {};
  const nav = PUBLIC_SETTINGS.navigation_footer || {};
  const groups = Array.isArray(nav.footer_groups) && nav.footer_groups.length ? nav.footer_groups : [
    { title: "Explore", links: [
      { label: "Services", href: "/services" },
      { label: "Pricing", href: "/pricing" },
      { label: "Specials", href: "/specials" },
      { label: "Help Articles", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Book", href: "/book" },
      { label: "Gear", href: "/gear" },
      { label: "Consumables", href: "/consumables" }
    ]},
    { title: "Company", links: [
      { label: "About", href: "/about" },
      { label: "Gallery", href: "/gallery" },
      { label: "Contact", href: "/contact" }
    ]},
    { title: "Policies", links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Waiver", href: "/waiver" }
    ]}
  ];
  const businessName = business.name || "Rosie Dazzlers Mobile Auto Detailing";
  const shortName = business.short_name || BRAND.name || "Rosie Dazzlers";
  const serviceArea = business.service_area || contact.service_area || "Norfolk & Oxford Counties, Ontario";
  const email = contact.email || business.contact?.public_email || "info@rosiedazzlers.ca";
  const backup = contact.backup_email || business.contact?.backup_email || "rosiedazzlers@gmail.com";
  const phone = contact.phone || business.contact?.public_phone || "226-752-7613";
  const setupNote = policies.water_power || "Driveway required · customer provides power + water, or additional charges may apply.";
  const depositNote = policies.deposit || "Deposits secure booking times. Cancellation fees may apply.";

  el.innerHTML = `
    <div class="footer-grid">
      <div class="footer-col">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <img
            src="${escapeAttr(BRAND.footerLogo)}"
            alt="${escapeAttr(shortName)} logo"
            style="width:72px;height:72px;object-fit:contain;border-radius:14px;flex:0 0 auto;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.10);padding:6px;"
          >
          <div>
            <div class="footer-title">${escapeHtml(shortName)}</div>
            <div class="footer-muted">${escapeHtml(business.tagline || "Mobile Auto Detailing")}</div>
            <div class="footer-muted">${escapeHtml(serviceArea)}</div>
          </div>
        </div>

        <div class="footer-muted" style="margin-top:12px">
          Phone: <a href="tel:${escapeAttr(phone.replace(/[^0-9+]/g, ""))}">${escapeHtml(phone)}</a><br>
          Email: <a href="mailto:${escapeAttr(email)}">${escapeHtml(email)}</a>${backup ? `<br>Backup: <a href="mailto:${escapeAttr(backup)}">${escapeHtml(backup)}</a>` : ""}
        </div>

        <div class="footer-note" style="margin-top:10px">${escapeHtml(setupNote)}</div>
      </div>

      ${groups.map((group) => `
        <div class="footer-col">
          <div class="footer-title">${escapeHtml(group.title || "Links")}</div>
          ${(Array.isArray(group.links) ? group.links : []).map((link) => `<a href="${escapeAttr(link.href || "#")}">${escapeHtml(link.label || link.href || "Link")}</a>`).join("")}
          ${String(group.title || "").toLowerCase() === "company" ? `<div class="footer-title" style="margin-top:12px">Social</div><div class="footer-social">${SOCIALS.map(([name, url]) => `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${escapeHtml(name)}</a>`).join("")}</div>` : ""}
          ${String(group.title || "").toLowerCase() === "policies" ? `<div class="footer-note" style="margin-top:12px">${escapeHtml(depositNote)}</div>` : ""}
        </div>
      `).join("")}
    </div>

    <div class="footer-bottom">
      <div>© ${year} ${escapeHtml(businessName)}</div>
      <div class="footer-bottom-links">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/waiver">Waiver</a>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}


/* =========================
   PACKAGE CARD HOVER ROTATION
   ========================= */

const PACKAGES_BASE = "https://assets.rosiedazzlers.ca/packages/";

const STATIC_HOVER_FILES = [
  "Exterior Detail.png",
  "Interior Detail.png",
  "CarSizeChart.PNG",
];

const SIZE_ICON_BY_VALUE = {
  small: "SmallCar.png",
  mid: "MidSizedCars.png",
  oversize: "ExoticLargeSizedCars.png",
};

const loadState = new Map();

function fileUrl(fileName) {
  return encodeURI(`${PACKAGES_BASE}${fileName}`);
}

function preload(url) {
  const s = loadState.get(url);
  if (s === "ok" || s === "fail" || s === "pending") return;

  loadState.set(url, "pending");
  const img = new Image();
  img.onload = () => loadState.set(url, "ok");
  img.onerror = () => loadState.set(url, "fail");
  img.src = url;
}

function isOk(url) {
  return loadState.get(url) === "ok";
}

function currentSize() {
  const sel = document.querySelector("#size");
  return sel && sel.value ? sel.value : null;
}

function guessGiftCertUrl(baseSrc) {
  try {
    const u = new URL(baseSrc);
    const file = u.pathname.split("/").pop() || "";
    if (!/\.png$/i.test(file)) return null;

    const giftFile = file.replace(/\.png$/i, "GiftCert.png");
    const giftUrl = `${u.origin}/packages/${encodeURIComponent(giftFile)}`;
    return giftUrl.replace(/%2F/g, "/");
  } catch {
    return null;
  }
}

function buildPlaylist(baseSrc) {
  const urls = [];

  urls.push(baseSrc);

  for (const f of STATIC_HOVER_FILES) urls.push(fileUrl(f));

  const s = currentSize();
  if (s && SIZE_ICON_BY_VALUE[s]) urls.push(fileUrl(SIZE_ICON_BY_VALUE[s]));

  const gift = guessGiftCertUrl(baseSrc);
  if (gift) urls.push(gift);

  return urls.filter((u, i, arr) => arr.indexOf(u) === i);
}

function attachRotators(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  function attach(card) {
    if (!card || card.dataset.hoverInit === "1") return;
    const img = card.querySelector("img");
    if (!img) return;

    card.dataset.hoverInit = "1";

    let timer = null;
    let playlist = [];
    let base = "";

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      if (base) img.src = base;
    }

    card.addEventListener("mouseenter", () => {
      base = img.currentSrc || img.src;

      img.onerror = () => {
        img.style.display = "";
        img.src = base;
      };

      playlist = buildPlaylist(base);
      playlist.forEach(preload);

      if (timer) clearInterval(timer);

      timer = setInterval(() => {
        if (!playlist.length) return;

        const currentIdx = playlist.indexOf(img.src);
        let idx = currentIdx >= 0 ? currentIdx : 0;

        for (let tries = 0; tries < playlist.length; tries++) {
          idx = (idx + 1) % playlist.length;
          const candidate = playlist[idx];

          if (candidate === base) {
            img.src = candidate;
            return;
          }

          if (isOk(candidate)) {
            img.src = candidate;
            return;
          }
        }
      }, 1200);
    });

    card.addEventListener("mouseleave", stop);
  }

  container.querySelectorAll(".card").forEach(attach);

  const mo = new MutationObserver(() => {
    container.querySelectorAll(".card").forEach(attach);
  });
  mo.observe(container, { childList: true, subtree: true });
}

/* =========================
   BOOT
   ========================= */



/* =========================
   PUBLIC ACCOUNT WIDGET
   ========================= */

async function readJsonSafe(url, options = {}) {
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store", ...options });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: err && err.message ? err.message : "Request failed." } };
  }
}

function ensureAccountHost() {
  const navInner = document.querySelector('.nav-inner');
  if (!navInner) return null;
  let host = document.querySelector('#publicAccountWidget');
  if (host) return host;
  host = document.createElement('div');
  host.id = 'publicAccountWidget';
  host.className = 'account-widget';
  const primaryBtn = navInner.querySelector('a.btn.primary[href="/book"]');
  if (primaryBtn && primaryBtn.parentNode === navInner) {
    navInner.insertBefore(host, primaryBtn);
  } else {
    navInner.appendChild(host);
  }
  return host;
}

function widgetButton(href, label, extraClass = 'ghost', attrs = '') {
  return `<a class="btn ${extraClass}" href="${href}" ${attrs}>${label}</a>`;
}

function widgetActionButton(id, label, extraClass = 'ghost') {
  return `<button class="btn ${extraClass}" type="button" id="${id}">${label}</button>`;
}

async function initAccountWidget() {
  const host = ensureAccountHost();
  if (!host) return;
  host.innerHTML = `<span class="account-chip">Checking account…</span>`;

  const [staff, client] = await Promise.all([
    readJsonSafe('/api/admin/auth_me'),
    readJsonSafe('/api/client/auth_me')
  ]);

  const staffActor = staff.ok && staff.data && (staff.data.actor || staff.data.staff_user || staff.data.staff) ? (staff.data.actor || staff.data.staff_user || staff.data.staff) : null;
  const clientCustomer = client.ok && client.data && client.data.authenticated === true ? client.data.customer : null;

  if (staffActor) {
    const role = staffActor.role_code || (staffActor.is_admin ? 'admin' : 'staff');
    host.innerHTML = `
      <div class="account-widget-inner">
        <span class="account-chip">${staffActor.full_name || staffActor.email || 'Staff'} · ${role}</span>
        ${widgetButton('/admin.html', 'Admin', 'ghost')}
        ${widgetButton('/detailer-jobs.html', 'Jobs', 'ghost')}
        ${widgetButton('/admin-account.html', 'Settings', 'ghost')}
        ${widgetActionButton('publicLogoutBtn', 'Sign out', 'primary')}
      </div>
    `;
    host.querySelector('#publicLogoutBtn')?.addEventListener('click', async () => {
      await readJsonSafe('/api/admin/auth_logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      await readJsonSafe('/api/client/auth_logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      location.href = '/login.html';
    });
    return;
  }

  if (clientCustomer) {
    host.innerHTML = `
      <div class="account-widget-inner">
        <span class="account-chip">${clientCustomer.full_name || clientCustomer.email || 'Customer'}</span>
        ${widgetButton('/my-account.html', 'Garage & account', 'ghost')}
        ${widgetButton('/book.html', 'Book again', 'ghost')}
        ${widgetActionButton('publicLogoutBtn', 'Sign out', 'primary')}
      </div>
    `;
    host.querySelector('#publicLogoutBtn')?.addEventListener('click', async () => {
      await readJsonSafe('/api/client/auth_logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      location.href = '/login.html';
    });
    return;
  }

  host.innerHTML = `
    <div class="account-widget-inner">
      <span class="account-chip">Account</span>
      ${widgetButton('/login.html', 'Login', 'ghost')}
      ${widgetButton('/login#signupForm', 'Create account', 'primary')}
    </div>
  `;
}


let deferredInstallPrompt = null;

function ensureInstallPrompt(){
  const navInner = document.querySelector('.nav-inner');
  if (!navInner) return null;
  let btn = document.querySelector('#installAppBtn');
  if (btn) return btn;
  btn = document.createElement('button');
  btn.id = 'installAppBtn';
  btn.type = 'button';
  btn.className = 'btn ghost';
  btn.textContent = 'Install App';
  btn.hidden = true;
  const publicBook = navInner.querySelector('a.btn.primary[href="/book"]');
  if (publicBook && publicBook.parentNode === navInner) navInner.insertBefore(btn, publicBook);
  else navInner.appendChild(btn);
  btn.addEventListener('click', async ()=>{
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch {}
    deferredInstallPrompt = null;
    btn.hidden = true;
  });
  return btn;
}

function initInstallPrompt(){
  const btn = ensureInstallPrompt();
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (btn) btn.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (btn) btn.hidden = true;
  });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', ()=>{ navigator.serviceWorker.register('/service-worker.js').catch(()=>{}); });
  }
}



function setViewportTier() {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const tier = width < 768 ? "mobile" : (width < 1100 ? "tablet" : "desktop");
  document.documentElement.dataset.viewportTier = tier;
  document.querySelectorAll("[data-viewport-tier-label]").forEach((node) => {
    node.textContent = tier === "mobile" ? "Mobile app view" : (tier === "tablet" ? "Tablet view" : "Desktop website view");
  });
}

function enhanceProfessionalImages() {
  document.querySelectorAll("img").forEach((img) => {
    if (!img.getAttribute("decoding")) img.setAttribute("decoding", "async");
    if (!img.getAttribute("loading") && !img.closest(".hero")) img.setAttribute("loading", "lazy");
  });
}

function ensureManifest(){
  const path=normalizePath(location.pathname);
  // Build 261: the public PWA manifest is unnecessary on protected admin/client/detailer screens.
  if(path.startsWith('/admin')||path.startsWith('/client')||path.startsWith('/detailer')) return;
  const head=document.head||document.querySelector('head');
  if(!head) return;
  let m=head.querySelector('link[rel="manifest"]');
  if(!m){ m=document.createElement('link'); m.rel='manifest'; head.appendChild(m); }
  m.href='/manifest.webmanifest';
  let theme=head.querySelector('meta[name="theme-color"]');
  if(!theme){ theme=document.createElement('meta'); theme.name='theme-color'; head.appendChild(theme); }
  theme.content='#0f172a';
}


function ensurePublicAnalytics(){
  const path = normalizePath(location.pathname);
  // Build 261: customer/public analytics never runs on protected staff/client/detailer screens.
  // This keeps admin work from creating noisy analytics traffic during a Pages/Workers incident.
  if (path.startsWith('/admin') || path.startsWith('/client') || path.startsWith('/detailer')) return;
  if (['/login','/my-account','/progress','/final-balance-payment','/quote-payment','/checkout','/complete','/invoice','/privacy','/terms'].includes(path)) return;
  const head=document.head||document.querySelector("head");
  if(!head || head.querySelector('script[data-public-analytics-bootstrap]')) return;
  const script=document.createElement('script');
  script.src='/assets/public-analytics.js?v=20260820build262';
  script.defer=true;
  script.dataset.publicAnalyticsBootstrap='true';
  head.appendChild(script);
}

// Build 225 — Third-party tags are consent-first and excluded from protected flows.
// The loader requests only public tag IDs; it must never receive any API token or secret.
function ensureMarketingConsent(){
  const path = normalizePath(location.pathname);
  if (path.startsWith('/admin') || path.startsWith('/client') || path.startsWith('/detailer')) return;
  if (['/login','/my-account','/progress','/final-balance-payment','/quote-payment','/checkout','/complete','/invoice','/privacy','/terms','/book'].includes(path)) return;
  const head=document.head||document.querySelector('head');
  if(!head || head.querySelector('script[data-marketing-consent-bootstrap]')) return;
  const script=document.createElement('script');
  script.src='/assets/marketing-consent.js';
  script.defer=true;
  script.dataset.marketingConsentBootstrap='true';
  head.appendChild(script);
}

function ensureStickyConversionCta() {
  if (document.querySelector("#rosieStickyCtaBar")) return;
  const path = normalizePath(location.pathname);
  if (path.startsWith("/admin") || ["/login", "/my-account", "/complete", "/invoice"].includes(path)) return;

  const style = document.createElement("style");
  style.dataset.rosieStickyCta = "true";
  style.textContent = `
    #rosieStickyCtaBar{
      position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;
      display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;
      padding:10px;border-radius:18px;border:1px solid rgba(255,255,255,.14);
      background:rgba(15,23,42,.92);backdrop-filter:blur(14px);
      box-shadow:0 18px 45px rgba(0,0,0,.35);
    }
    #rosieStickyCtaBar a{
      text-decoration:none;border-radius:999px;padding:9px 12px;font-weight:800;font-size:.9rem;
      border:1px solid rgba(255,255,255,.16);color:#eaf2ff;background:rgba(255,255,255,.07);
      white-space:nowrap;
    }
    #rosieStickyCtaBar a.primary{background:linear-gradient(135deg,#f97316,#facc15);color:#111827;border-color:transparent;}
    #rosieStickyCtaBar a.photo{background:rgba(34,197,94,.16);border-color:rgba(34,197,94,.45);}
    #rosieStickyCtaBar button{
      border:0;background:transparent;color:rgba(234,242,255,.72);font-weight:900;cursor:pointer;padding:6px 8px;
    }
    @media (min-width:980px){
      #rosieStickyCtaBar{left:auto;right:18px;bottom:18px;max-width:540px}
    }
    @media (max-width:520px){
      #rosieStickyCtaBar{left:8px;right:8px;bottom:8px}
      #rosieStickyCtaBar a{font-size:.82rem;padding:8px 9px}
    }
    body{padding-bottom:86px;}
  `;
  document.head.appendChild(style);

  const bar = document.createElement("div");
  bar.id = "rosieStickyCtaBar";
  bar.setAttribute("aria-label", "Quick booking and estimate links");
  bar.innerHTML = `
    <a class="primary" href="/book">Book now</a>
    <a class="photo" href="/book?estimate=photos">Send photos for estimate</a>
    <a href="/contact">Call / text</a>
    <a href="/specials">Specials</a>
    <button type="button" aria-label="Hide quick links">×</button>
  `;
  bar.querySelector("button").addEventListener("click", () => {
    bar.remove();
    style.remove();
    document.body.style.paddingBottom = "";
  });
  document.body.appendChild(bar);
}



function ensureVisualPlaceholderSystem(){
  if (window.RosieVisualPlaceholders && typeof window.RosieVisualPlaceholders.init === "function") {
    window.RosieVisualPlaceholders.init(document);
    return;
  }
  if (document.querySelector('script[data-visual-placeholder-bootstrap]')) return;
  const script = document.createElement("script");
  script.src = "/assets/visual-placeholders.js?v=20260726build236";
  script.defer = true;
  script.dataset.visualPlaceholderBootstrap = "true";
  document.head.appendChild(script);
}

async function initChrome() {
  setViewportTier();
  window.addEventListener("resize", setViewportTier, { passive: true });
  ensureManifest();
  await loadPublicSiteSettings();
  ensureNavLinks();
  setBrandImagesEverywhere();
  ensureMainBanner();
  ensureReviewsPanel();
  setActiveNavLink();
  initNavToggle();
  setFooter();
  injectBusinessProfileSchema();
  initAccountWidget();
  initInstallPrompt();
  ensurePublicAnalytics();
  ensureMarketingConsent();
  ensureStickyConversionCta();
  enhanceProfessionalImages();
  ensureVisualPlaceholderSystem();
  try {
    const imageTools = await import('/assets/website-images.js?v=20260813build259');
    await imageTools.hydrateGlobalSiteImageOverrides(document);
  } catch (error) {
    console.warn('Optional Photo Studio presentation overrides could not be applied.', error);
  }

  attachRotators("#homePackages");
  attachRotators("#packageCards");
  attachRotators("#pricingCards");
  attachRotators("#packagesGrid");
  attachRotators("#pricingPackages");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChrome);
} else {
  initChrome();
}

// Build 262 CPU stabilization: batched public analytics bootstrap.

// Historical Build 261 release token: /assets/public-analytics.js?v=20260819build261
