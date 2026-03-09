// /assets/chrome.js
// Standard site chrome (nav + footer + brand images) used on ALL pages.
// Include with: <script type="module" src="/assets/chrome.js?v=YYYYMMDD"></script>

const THEME = {
  brandName: "Rosie Dazzlers",
  // Brand images (R2 public)
  logo: "https://assets.rosiedazzlers.ca/brand/RosieDazzlerLogoOriginal3D.png",
  banner: "https://assets.rosiedazzlers.ca/brand/RosieDazzlersBanner.png",
  reviews: "https://assets.rosiedazzlers.ca/brand/RosieReviews.png",

  // Optional background images you mentioned
  bgHero1: "https://assets.rosiedazzlers.ca/brand/KatBlackCar.PNG",
  bgHero2: "https://assets.rosiedazzlers.ca/brand/KateCar.PNG",

  supportEmail: "info@rosiedazzlers.ca",
  socials: {
    tiktok: "https://www.tiktok.com/@rosiedazzler",
    twitch: "https://www.twitch.tv/rosiedazzlers",
    x: "https://x.com/RosieDazzlers",
    youtube: "https://www.youtube.com/@rosiedazzlers",
    facebook: "https://www.facebook.com/rosiedazzlers",
    instagram: "https://www.instagram.com/rosiedazzlers/",
    linkedin: "https://www.linkedin.com/in/rosiedazzlers/",
  },
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

// Expose theme for easy tweaking in the browser console if you want
window.RosieTheme = THEME;

boot();

function boot() {
  setBrandImages();
  setNav();
  setFooter();
  wireNavToggle();
  markActiveNav();
}

function setBrandImages() {
  // Logo
  document.querySelectorAll("[data-logo]").forEach((img) => {
    if (!img.getAttribute("src")) img.setAttribute("src", THEME.logo);
    img.setAttribute("loading", "eager");
    img.setAttribute("decoding", "async");
  });

  // Banner
  document.querySelectorAll("[data-banner]").forEach((img) => {
    if (!img.getAttribute("src")) img.setAttribute("src", THEME.banner);
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
  });

  // Reviews image
  document.querySelectorAll("[data-reviews]").forEach((img) => {
    if (!img.getAttribute("src")) img.setAttribute("src", THEME.reviews);
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
  });
}

function setNav() {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;

  navLinks.innerHTML = NAV.map((n) => {
    return `<a href="${escapeAttr(n.href)}">${escapeHtml(n.label)}</a>`;
  }).join("");
}

function markActiveNav() {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;

  const path = normalizePath(location.pathname);

  navLinks.querySelectorAll("a").forEach((a) => {
    const href = normalizePath(a.getAttribute("href") || "/");
    const isActive = (href === "/" && path === "/") || (href !== "/" && path.startsWith(href));
    if (isActive) a.classList.add("active");
    else a.classList.remove("active");
  });
}

function wireNavToggle() {
  const btn = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!btn || !links) return;

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", open ? "false" : "true");
    links.classList.toggle("open", !open);
  });
}

function setFooter() {
  document.querySelectorAll("[data-footer]").forEach((el) => {
    el.innerHTML = `
      <div class="footer-inner">
        <div class="footer-col">
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${escapeAttr(THEME.logo)}" alt="${escapeHtml(THEME.brandName)} logo" style="width:40px;height:40px;object-fit:contain;border-radius:10px;border:1px solid rgba(255,255,255,.12)" />
            <div>
              <strong>${escapeHtml(THEME.brandName)}</strong><br>
              <span class="muted">Mobile Auto Detailing — Norfolk & Oxford Counties</span>
            </div>
          </div>
          <div class="muted" style="margin-top:10px">
            Email: <a href="mailto:${escapeAttr(THEME.supportEmail)}">${escapeHtml(THEME.supportEmail)}</a>
          </div>
        </div>

        <div class="footer-col">
          <strong>Pages</strong>
          <div class="footer-links">
            ${footerLink("/services","Services")}
            ${footerLink("/pricing","Pricing")}
            ${footerLink("/book","Book")}
            ${footerLink("/gifts","Gifts")}
            ${footerLink("/contact","Contact")}
            ${footerLink("/about","About")}
          </div>
        </div>

        <div class="footer-col">
          <strong>Policies</strong>
          <div class="footer-links">
            ${footerLink("/waiver","Waiver")}
            ${footerLink("/terms","Terms")}
            ${footerLink("/privacy","Privacy")}
          </div>
        </div>

        <div class="footer-col">
          <strong>Social</strong>
          <div class="footer-links">
            ${extLink(THEME.socials.instagram,"Instagram")}
            ${extLink(THEME.socials.facebook,"Facebook")}
            ${extLink(THEME.socials.youtube,"YouTube")}
            ${extLink(THEME.socials.tiktok,"TikTok")}
            ${extLink(THEME.socials.twitch,"Twitch")}
            ${extLink(THEME.socials.x,"X")}
            ${extLink(THEME.socials.linkedin,"LinkedIn")}
          </div>
        </div>
      </div>

      <div class="footer-bottom muted">
        © ${new Date().getFullYear()} ${escapeHtml(THEME.brandName)} · All rights reserved.
      </div>
    `;
  });
}

/* ---------------- helpers ---------------- */

function footerLink(href, label) {
  return `<a href="${escapeAttr(href)}">${escapeHtml(label)}</a>`;
}

function extLink(href, label) {
  if (!href) return "";
  return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
}

function normalizePath(p) {
  if (!p) return "/";
  // remove trailing slash except root
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
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

function escapeAttr(s) {
  return escapeHtml(s);
}
