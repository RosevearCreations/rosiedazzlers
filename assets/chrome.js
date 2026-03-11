/* /assets/chrome.js
   REPLACE ENTIRE FILE

   What this does:
   - Builds a clean, consistent nav across ALL pages (including Gifts + About + Contact)
   - Sets logo/banner/reviews images anywhere you used data-logo / data-banner / data-reviews
   - Renders the footer into any element with [data-footer]
   - Handles “return from Stripe” messages on the home page (or any page that has [data-checkout-status])
*/

const BRAND_BASE = "https://assets.rosiedazzlers.ca/brand";
const PACKAGES_BASE = "https://assets.rosiedazzlers.ca/packages";

const SOCIALS = [
  { label: "TikTok", href: "https://www.tiktok.com/@rosiedazzler" },
  { label: "Twitch", href: "https://www.twitch.tv/rosiedazzlers" },
  { label: "X", href: "https://x.com/RosieDazzlers" },
  { label: "YouTube", href: "https://www.youtube.com/@rosiedazzlers" },
  { label: "Facebook", href: "https://www.facebook.com/rosiedazzlers" },
  { label: "Instagram", href: "https://www.instagram.com/rosiedazzlers/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/rosiedazzlers/" },
];

const NAV_PUBLIC = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gear", label: "Gear" },
  { href: "/consumables", label: "Consumables" },
  { href: "/book", label: "Book" },
  { href: "/gifts", label: "Gifts" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const NAV_ADMIN = [
  { href: "/admin", label: "Admin" },
  { href: "/admin-booking.html", label: "Controls" },
  { href: "/admin-upload.html", label: "Upload" },
  { href: "/admin-progress.html", label: "Progress" },
  { href: "/admin-assign.html", label: "Assign" },
];

function qs(sel) {
  return document.querySelector(sel);
}

function setImgIfEmpty(selector, url) {
  const el = qs(selector);
  if (!el) return;
  const current = (el.getAttribute("src") || "").trim();
  if (!current) el.setAttribute("src", url);
}

function buildNav() {
  const navLinks = qs("#navLinks");
  if (!navLinks) return;

  const path = location.pathname || "/";
  const isAdmin = path.startsWith("/admin");

  const links = isAdmin ? NAV_ADMIN : NAV_PUBLIC;

  navLinks.innerHTML = links
    .map((l) => {
      const active = normalizePath(path) === normalizePath(l.href);
      const cls = active ? "active" : "";
      const aria = active ? 'aria-current="page"' : "";
      return `<a class="${cls}" ${aria} href="${l.href}">${escapeHtml(l.label)}</a>`;
    })
    .join("");

  // Mobile toggle
  const toggle = qs("#navToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      navLinks.style.display = expanded ? "" : "flex";
      navLinks.style.flexDirection = "column";
      navLinks.style.gap = "10px";
      navLinks.style.padding = "10px 0";
    });
  }
}

function setBrandImages() {
  // Prefer your crisp 3D logo + big banner + reviews
  setImgIfEmpty("[data-logo]", `${BRAND_BASE}/RosieDazzlerLogoOriginal3D.png`);
  setImgIfEmpty("[data-banner]", `${BRAND_BASE}/RosieDazzlersBanner.png`);
  setImgIfEmpty("[data-reviews]", `${BRAND_BASE}/RosieReviews.png`);

  // If you later add a main background hero image, you can set it here too.
}

function setFooter() {
  const foot = qs("[data-footer]");
  if (!foot) return;

  foot.innerHTML = `
    <div class="panel" style="margin-top:22px">
      <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:12px">
        <div>
          <strong>Rosie Dazzlers Mobile Auto Detailing</strong>
          <div style="margin-top:8px;opacity:.85">
            Serving <strong>Norfolk</strong> & <strong>Oxford</strong> Counties (Ontario)
          </div>
          <div style="margin-top:8px;opacity:.85">
            Email: <a href="mailto:info@rosiedazzlers.ca">info@rosiedazzlers.ca</a>
          </div>
          <div style="margin-top:8px;opacity:.75;font-size:.95rem">
            Driveway required • customer provides power + water (or additional charges) • customer accepts local bylaw responsibility for runoff/chemicals
          </div>
        </div>

        <div>
          <strong>Quick links</strong>
          <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
            ${NAV_PUBLIC.slice(0, 6).map(l => `<a href="${l.href}">${escapeHtml(l.label)}</a>`).join("")}
          </div>
        </div>

        <div>
          <strong>Socials</strong>
          <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
            ${SOCIALS.map(s => `<a target="_blank" rel="noopener" href="${s.href}">${escapeHtml(s.label)}</a>`).join("")}
          </div>
        </div>
      </div>

      <div class="hr"></div>

      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;opacity:.75">
        <div>© ${new Date().getFullYear()} Rosie Dazzlers</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <a href="/waiver">Waiver</a>
          <a href="/privacy">Privacy</a>
        </div>
      </div>
    </div>
  `;
}

function handleCheckoutReturn() {
  const box = qs("[data-checkout-status]");
  if (!box) return;

  const p = new URLSearchParams(location.search);

  // Booking deposit return
  if (p.get("checkout") === "success") {
    box.style.display = "block";
    box.className = "notice ok";
    box.textContent = "Booking deposit received. We’ll contact you shortly to confirm details.";
    return;
  }
  if (p.get("checkout") === "cancel") {
    box.style.display = "block";
    box.className = "notice warn";
    box.textContent = "Checkout was cancelled. Your booking was not confirmed.";
    return;
  }

  // Gift purchase return
  if (p.get("gift") === "success") {
    box.style.display = "block";
    box.className = "notice ok";
    box.textContent = "Gift purchase received. We’re generating your certificate now.";
    return;
  }
  if (p.get("gift") === "cancel") {
    box.style.display = "block";
    box.className = "notice warn";
    box.textContent = "Gift checkout was cancelled.";
    return;
  }

  box.style.display = "none";
}

function normalizePath(p) {
  // Normalize “/index.html” to “/” and remove trailing slash (except root)
  if (!p) return "/";
  if (p === "/index.html") return "/";
  if (p.endsWith("/") && p !== "/") return p.slice(0, -1);
  return p;
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Run on load
buildNav();
setBrandImages();
setFooter();
handleCheckoutReturn();

// Export (optional)
export { buildNav, setBrandImages, setFooter, handleCheckoutReturn };
