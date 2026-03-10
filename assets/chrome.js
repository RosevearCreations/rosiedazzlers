// /assets/chrome.js
// Standard navigation + footer + brand image wiring for all pages.
// Drop-in module: include with <script type="module" src="/assets/chrome.js"></script>

const BRAND_BASE = "https://assets.rosiedazzlers.ca/brand";
const PACKAGES_BASE = "https://assets.rosiedazzlers.ca/packages";

// Update these if you swap assets later
const BRAND = {
  logo: `${BRAND_BASE}/RosieDazzlerLogoOriginal3D.png`,
  banner: `${BRAND_BASE}/RosieDazzlersBanner.png`,
  reviews: `${BRAND_BASE}/RosieReviews.png`,
  heroBg1: `${BRAND_BASE}/KatBlackCar.PNG`,
  heroBg2: `${BRAND_BASE}/KateCar.PNG`,
};

// Socials
const SOCIALS = [
  { label: "TikTok", href: "https://www.tiktok.com/@rosiedazzler" },
  { label: "Twitch", href: "https://www.twitch.tv/rosiedazzlers" },
  { label: "X", href: "https://x.com/RosieDazzlers" },
  { label: "YouTube", href: "https://www.youtube.com/@rosiedazzlers" },
  { label: "Facebook", href: "https://www.facebook.com/rosiedazzlers" },
  { label: "Instagram", href: "https://www.instagram.com/rosiedazzlers/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/rosiedazzlers/" },
];

const NAV = [
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Gear", href: "/gear" },
  { label: "Consumables", href: "/consumables" },
  { label: "Gifts", href: "/gifts" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Book", href: "/book", isPrimary: true },
];

// --- Init ---
setBrandImages();
setNav();
setFooter();

// --- Brand images (logo/banner/reviews placeholders) ---
function setBrandImages() {
  const logo = document.querySelector("[data-logo]");
  if (logo) {
    logo.src = BRAND.logo;
    logo.decoding = "async";
    logo.loading = "eager";
  }

  const banner = document.querySelector("[data-banner]");
  if (banner) {
    banner.src = BRAND.banner;
    banner.decoding = "async";
    banner.loading = "lazy";
  }

  const reviews = document.querySelector("[data-reviews]");
  if (reviews) {
    reviews.src = BRAND.reviews;
    reviews.decoding = "async";
    reviews.loading = "lazy";
  }

  // Optional: apply a subtle background image if a page wants it
  // Add: <div data-hero-bg></div> and we set a rotating background.
  const heroBg = document.querySelector("[data-hero-bg]");
  if (heroBg) {
    const pick = (Math.random() < 0.5) ? BRAND.heroBg1 : BRAND.heroBg2;
    heroBg.style.backgroundImage = `url("${pick}")`;
    heroBg.style.backgroundSize = "cover";
    heroBg.style.backgroundPosition = "center";
    heroBg.style.borderRadius = "18px";
    heroBg.style.border = "1px solid rgba(255,255,255,.10)";
    heroBg.style.minHeight = "220px";
  }
}

// --- Navigation ---
function setNav() {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;

  const path = normalizePath(location.pathname);

  const html = NAV.map((item) => {
    const active = isActive(path, item.href);
    const cls = ["nav-link"];
    if (active) cls.push("active");
    if (item.isPrimary) cls.push("primary-link");

    return `<a class="${cls.join(" ")}" href="${item.href}">${escapeHtml(item.label)}</a>`;
  }).join("");

  navLinks.innerHTML = html;

  // Mobile toggle support if button exists
  const toggle = document.getElementById("navToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      navLinks.classList.toggle("open", !expanded);
    });
  }
}

function normalizePath(p) {
  // Treat /about.html and /about as same
  if (!p) return "/";
  if (p === "/index.html") return "/";
  if (p.endsWith(".html")) return p.replace(/\.html$/i, "");
  // Strip trailing slash (except root)
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

function isActive(currentPath, href) {
  const target = normalizePath(href);
  if (target === "/") return currentPath === "/";
  // match exact or subpaths (e.g. /gifts? or /gifts/receipt)
  return currentPath === target || currentPath.startsWith(target + "/");
}

// --- Footer ---
function setFooter() {
  const foot = document.querySelector("[data-footer]");
  if (!foot) return;

  const year = new Date().getFullYear();

  foot.innerHTML = `
    <div class="footer-inner" style="display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:14px">
      <div>
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${BRAND.logo}" alt="Rosie Dazzlers logo" style="width:40px;height:auto;border-radius:10px" />
          <div>
            <strong>Rosie Dazzlers</strong><br>
            <span style="color:rgba(234,242,255,.62);font-size:.92rem">Mobile Auto Detailing</span>
          </div>
        </div>
        <div style="margin-top:10px;color:rgba(234,242,255,.62);font-size:.95rem">
          Serving <strong>Norfolk</strong> & <strong>Oxford</strong> Counties (Ontario).<br>
          Driveway required • Customer provides water + power • Deposit required
        </div>

        <div style="margin-top:10px">
          <a class="btn ghost small" href="/waiver">Service Requirements / Waiver</a>
        </div>
      </div>

      <div>
        <strong>Pages</strong>
        <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
          ${NAV.filter(x => !x.isPrimary).slice(0,7).map(x => (
            `<a href="${x.href}" style="color:rgba(234,242,255,.82)">${escapeHtml(x.label)}</a>`
          )).join("")}
          <a href="/book" style="color:rgba(234,242,255,.82)"><strong>Book</strong></a>
        </div>
      </div>

      <div>
        <strong>Contact & Social</strong>
        <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
          <a href="mailto:info@rosiedazzlers.ca" style="color:rgba(234,242,255,.82)">info@rosiedazzlers.ca</a>
          <a href="mailto:rosiedazzlers@gmail.com" style="color:rgba(234,242,255,.82)">rosiedazzlers@gmail.com</a>
        </div>

        <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap">
          ${SOCIALS.map(s => (
            `<a class="badge" href="${s.href}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`
          )).join("")}
        </div>
      </div>
    </div>

    <div style="margin-top:14px;height:1px;background:rgba(255,255,255,.10)"></div>

    <div style="margin-top:12px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;color:rgba(234,242,255,.55);font-size:.9rem">
      <div>© ${year} Rosie Dazzlers</div>
      <div>
        <a href="/privacy" style="color:rgba(234,242,255,.65)">Privacy</a>
        <span style="opacity:.6"> • </span>
        <a href="/terms" style="color:rgba(234,242,255,.65)">Terms</a>
      </div>
    </div>
  `;
}

// --- Utils ---
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Optional exports (if you want to call from other scripts)
export { setBrandImages, setNav, setFooter, BRAND_BASE, PACKAGES_BASE };
