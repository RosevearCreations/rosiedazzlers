// /assets/chrome.js
// Standard site chrome (nav + footer + brand images) + package hover rotation.
// IMPORTANT: This footer HTML matches the CSS in /assets/site.css (footer-grid, footer-title, etc).

const THEME = {
  brandName: "Rosie Dazzlers",
  logo: "https://assets.rosiedazzlers.ca/brand/RosieDazzlerLogoOriginal3D.png",
  banner: "https://assets.rosiedazzlers.ca/brand/RosieDazzlersBanner.png",
  reviews: "https://assets.rosiedazzlers.ca/brand/RosieReviews.png",
  emailPrimary: "info@rosiedazzlers.ca",
  emailBackup: "rosiedazzlers@gmail.com",
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gear", label: "Gear" },
  { href: "/consumables", label: "Consumables" },
  { href: "/gifts", label: "Gifts" },
  { href: "/book", label: "Book" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
];

const SOCIALS = [
  ["TikTok", "https://www.tiktok.com/@rosiedazzler"],
  ["Instagram", "https://www.instagram.com/rosiedazzlers/"],
  ["Facebook", "https://www.facebook.com/rosiedazzlers"],
  ["YouTube", "https://www.youtube.com/@rosiedazzlers"],
  ["Twitch", "https://www.twitch.tv/rosiedazzlers/"],
  ["X", "https://x.com/RosieDazzlers"],
  ["LinkedIn", "https://www.linkedin.com/in/rosiedazzlers/"],
];

boot();
window.addEventListener("popstate", boot);

function boot() {
  setBrandImages();
  setNavLinks();
  setActiveNavLink();
  initNavToggle();
  setFooter();
  initPackageHoverRotation();
}

/* =========================
   BRAND IMAGES
   ========================= */

function setBrandImages() {
  document.querySelectorAll("[data-logo]").forEach((img) => {
    img.src = THEME.logo;
    img.loading = "eager";
    img.decoding = "async";
  });

  document.querySelectorAll("[data-banner]").forEach((img) => {
    img.src = THEME.banner;
    img.loading = "lazy";
    img.decoding = "async";
  });

  document.querySelectorAll("[data-reviews]").forEach((img) => {
    img.src = THEME.reviews;
    img.loading = "lazy";
    img.decoding = "async";
  });
}

/* =========================
   NAV
   ========================= */

function normalizePath(p) {
  const x = (p || "/").replace(/\/+$/, "");
  return x === "" ? "/" : x;
}

function setNavLinks() {
  const navLinks = document.querySelector("#navLinks");
  if (!navLinks) return;

  navLinks.innerHTML = NAV.map((n) => {
    return `<a href="${escapeAttr(n.href)}">${escapeHtml(n.label)}</a>`;
  }).join("");
}

function setActiveNavLink() {
  const path = normalizePath(location.pathname);
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = normalizePath(a.getAttribute("href") || "/");
    const active = (href === "/" && path === "/") || (href !== "/" && path.startsWith(href));
    a.classList.toggle("active", active);
  });
}

function initNavToggle() {
  const btn = document.querySelector("#navToggle");
  const links = document.querySelector("#navLinks");
  if (!btn || !links) return;

  btn.addEventListener("click", () => {
    links.classList.toggle("open");
    btn.setAttribute("aria-expanded", links.classList.contains("open") ? "true" : "false");
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

/* =========================
   FOOTER (MATCHES site.css)
   ========================= */

function setFooter() {
  const el = document.querySelector("[data-footer]");
  if (!el) return;

  const year = new Date().getFullYear();

  el.innerHTML = `
    <div class="footer-grid">
      <div class="footer-col">
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${escapeAttr(THEME.logo)}" alt="Rosie Dazzlers logo"
               style="width:42px;height:42px;object-fit:contain;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04)" />
          <div>
            <div class="footer-title">${escapeHtml(THEME.brandName)}</div>
            <div class="footer-muted">Mobile Auto Detailing</div>
            <div class="footer-muted">Norfolk & Oxford Counties, Ontario</div>
          </div>
        </div>

        <div class="footer-muted" style="margin-top:10px">
          Email: <a href="mailto:${escapeAttr(THEME.emailPrimary)}">${escapeHtml(THEME.emailPrimary)}</a><br>
          Backup: <a href="mailto:${escapeAttr(THEME.emailBackup)}">${escapeHtml(THEME.emailBackup)}</a>
        </div>

        <div class="footer-note" style="margin-top:10px">
          Driveway required · customer provides power + water (or additional charges may apply).
        </div>
      </div>

      <div class="footer-col">
        <div class="footer-title">Explore</div>
        <a href="/services">Services</a>
        <a href="/pricing">Pricing</a>
        <a href="/book">Book</a>
        <a href="/gear">Gear</a>
        <a href="/consumables">Consumables</a>
        <a href="/gifts">Gifts</a>
      </div>

      <div class="footer-col">
        <div class="footer-title">Company</div>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>

        <div class="footer-title" style="margin-top:12px">Social</div>
        <div class="footer-social">
          ${SOCIALS.map(([name, url]) => `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${escapeHtml(name)}</a>`).join("")}
        </div>
      </div>

      <div class="footer-col">
        <div class="footer-title">Policies</div>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/waiver">Waiver</a>

        <div class="footer-note" style="margin-top:12px">
          Deposits secure booking times. Cancellation fees may apply.
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div>© ${year} Rosie Dazzlers Mobile Auto Detailing</div>
      <div class="footer-bottom-links">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/waiver">Waiver</a>
      </div>
    </div>
  `;
}

/* =========================
   PACKAGE CARD HOVER ROTATION
   (prevents blanks + cycles your real files)
   ========================= */

const PACKAGES_BASE = "https://assets.rosiedazzlers.ca/packages/";

// These exist in your /packages directory (exact names)
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

const loadState = new Map(); // url -> "ok" | "fail" | "pending"

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
  // services/pricing pages commonly use #size
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

      // never allow blank
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

          if (candidate === base) { img.src = candidate; return; }
          if (isOk(candidate)) { img.src = candidate; return; }
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

function initPackageHoverRotation() {
  attachRotators("#packageCards"); // services page
  attachRotators("#pricingCards"); // pricing page
}

/* =========================
   helpers
   ========================= */

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(s) {
  return escapeHtml(s);
}
