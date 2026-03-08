// /assets/chrome.js
// FIXES:
// 1) Restores the FULL “designed” footer (footer-grid + socials) on every page.
// 2) Ensures the footer exists even if the page forgot <div data-footer></div>.
// 3) Forces ALL “Size chart” buttons/links to open the working image:
//    https://assets.rosiedazzlers.ca/packages/CarSizeChart.PNG
// 4) Standardizes nav links and removes duplicates by rebuilding #navLinks.
//
// Drop-in replacement. No imports. (So it won’t silently fail if another module breaks.)

const VERSION = "chrome_v2_footer_restore_sizechart_fix_20260308";

const BRAND = {
  logo: "https://assets.rosiedazzlers.ca/brand/RosieDazzlerLogoOriginal3D.png",
  banner: "https://assets.rosiedazzlers.ca/brand/RosieDazzlersBanner.png",
  reviews: "https://assets.rosiedazzlers.ca/brand/RosieReviews.png",
};

const SIZE_CHART_URL = "https://assets.rosiedazzlers.ca/packages/CarSizeChart.PNG";

const NAV_ITEMS = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/book", label: "Book" },
  { href: "/gifts", label: "Gifts" },
  { href: "/gear", label: "Gear" },
  { href: "/consumables", label: "Consumables" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
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

function normalizePath(p) {
  if (!p) return "/";
  if (p === "/index.html") return "/";
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

function isActiveLink(currentPath, href) {
  const cur = normalizePath(currentPath);
  const h = normalizePath(href);
  if (h === "/") return cur === "/";
  return cur === h || cur.startsWith(h + "/");
}

function ensureFooterContainer() {
  let footer = document.querySelector("[data-footer]");
  if (footer) return footer;

  footer = document.createElement("div");
  footer.className = "footer";
  footer.setAttribute("data-footer", "");

  const container = document.querySelector(".container");
  if (container) container.appendChild(footer);
  else document.body.appendChild(footer);

  return footer;
}

function ensureNavLinksContainer() {
  let linksEl = document.getElementById("navLinks");
  if (linksEl) return linksEl;

  linksEl = document.querySelector(".nav-links");
  if (linksEl) return linksEl;

  // If missing entirely, create it inside .nav-inner
  const navInner = document.querySelector(".nav .nav-inner");
  if (!navInner) return null;

  const div = document.createElement("div");
  div.className = "nav-links";
  div.id = "navLinks";
  navInner.appendChild(div);
  return div;
}

function applyNav() {
  const linksEl = ensureNavLinksContainer();
  if (!linksEl) return;

  linksEl.innerHTML = NAV_ITEMS.map(i => `<a href="${i.href}">${i.label}</a>`).join("");

  const path = normalizePath(location.pathname);
  linksEl.querySelectorAll("a[href]").forEach(a => {
    const href = a.getAttribute("href") || "";
    a.classList.toggle("active", isActiveLink(path, href));
  });

  const toggle = document.getElementById("navToggle");
  if (toggle) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      linksEl.classList.toggle("open", open);
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });

    linksEl.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.matches && t.matches("a")) setOpen(false);
    });
  }
}

function ensureBookNowButton() {
  const navInner = document.querySelector(".nav .nav-inner");
  if (!navInner) return;

  const existing = navInner.querySelector('a.btn.primary[href="/book"]');
  if (existing) return;

  const btn = document.createElement("a");
  btn.className = "btn primary";
  btn.href = "/book";
  btn.textContent = "Book now";
  navInner.appendChild(btn);
}

function setBrandImagesBestEffort() {
  const logo = document.querySelector("[data-logo]");
  if (logo && !logo.getAttribute("src")) logo.src = BRAND.logo;

  const banner = document.querySelector("[data-banner]");
  if (banner && !banner.getAttribute("src")) banner.src = BRAND.banner;

  const reviews = document.querySelector("[data-reviews]");
  if (reviews && !reviews.getAttribute("src")) reviews.src = BRAND.reviews;
}

function setFooterDesigned() {
  const el = ensureFooterContainer();
  const year = new Date().getFullYear();

  el.innerHTML = `
    <div class="footer-grid">
      <div class="footer-col">
        <div class="footer-title">Rosie Dazzlers</div>
        <div class="footer-muted">Mobile Auto Detailing</div>
        <div class="footer-muted">Norfolk & Oxford Counties, Ontario</div>

        <div class="footer-muted" style="margin-top:10px">
          Email: <a href="mailto:info@rosiedazzlers.ca">info@rosiedazzlers.ca</a><br>
          Backup: <a href="mailto:rosiedazzlers@gmail.com">rosiedazzlers@gmail.com</a>
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
        <a href="/gifts">Gifts</a>
        <a href="/gear">Gear</a>
        <a href="/consumables">Consumables</a>
      </div>

      <div class="footer-col">
        <div class="footer-title">Company</div>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>

        <div class="footer-title" style="margin-top:12px">Social</div>
        <div class="footer-social">
          ${SOCIALS.map(([name, url]) => `<a href="${url}" target="_blank" rel="noopener">${name}</a>`).join("")}
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

function wireSizeChartButtons() {
  const selectors = [
    "#openSize",                // services/pricing pages
    "[data-open-size]",         // booking form button
    'a[href*="CarSizeChart"]',  // any existing link that might be wrong
  ];

  const seen = new Set();

  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);

      if (el.tagName === "A") {
        el.setAttribute("href", SIZE_CHART_URL);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
        return;
      }

      el.addEventListener("click", (e) => {
        e.preventDefault();
        window.open(SIZE_CHART_URL, "_blank", "noopener");
      });
    });
  });
}

function init() {
  console.log(VERSION);
  applyNav();
  ensureBookNowButton();
  setBrandImagesBestEffort();
  setFooterDesigned();
  wireSizeChartButtons();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
