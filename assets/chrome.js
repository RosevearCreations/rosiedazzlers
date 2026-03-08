// /assets/chrome.js
// Standardizes nav + footer across ALL pages.
// Fix: footer will always appear (creates [data-footer] if missing).
// Also includes a fallback footer if /assets/site.js fails to import.

const NAV_ITEMS = [
  { href: "/services",     label: "Services" },
  { href: "/pricing",      label: "Pricing" },
  { href: "/book",         label: "Book" },
  { href: "/gifts",        label: "Gifts" },
  { href: "/gear",         label: "Gear" },
  { href: "/consumables",  label: "Consumables" },
  { href: "/about",        label: "About" },
  { href: "/contact",      label: "Contact" },
];

const SHOW_GIFTS = true;

// Fallback footer content (used only if site.js import fails)
const FALLBACK_FOOTER_HTML = `
  <div><strong>Rosie Dazzlers Mobile Auto Detailing</strong> — Norfolk & Oxford Counties</div>
  <div>Email: <a href="mailto:info@rosiedazzlers.ca">info@rosiedazzlers.ca</a></div>
  <div class="kicker">Driveway required · customer provides power + water (or additional charges may apply).</div>
`;

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

function buildNavLinks() {
  const items = SHOW_GIFTS ? NAV_ITEMS : NAV_ITEMS.filter(x => x.href !== "/gifts");
  return items.map(i => `<a href="${i.href}">${i.label}</a>`).join("");
}

function applyNav() {
  const path = normalizePath(location.pathname);
  const linksEl = document.getElementById("navLinks") || document.querySelector(".nav-links");
  if (linksEl) {
    linksEl.innerHTML = buildNavLinks();

    linksEl.querySelectorAll("a[href]").forEach(a => {
      const href = a.getAttribute("href") || "";
      if (isActiveLink(path, href)) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  const toggle = document.getElementById("navToggle");
  if (toggle && linksEl) {
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

function ensureFooterContainer() {
  let footer = document.querySelector("[data-footer]");
  if (footer) return footer;

  // Create it if missing
  footer = document.createElement("div");
  footer.className = "footer";
  footer.setAttribute("data-footer", "");

  // Prefer placing inside .container if present
  const container = document.querySelector(".container");
  if (container) container.appendChild(footer);
  else document.body.appendChild(footer);

  return footer;
}

async function tryImportSiteHelpers() {
  // Try without cache-busting first, then with fallback.
  try {
    return await import("/assets/site.js");
  } catch {
    try {
      return await import(`/assets/site.js?v=${Date.now()}`);
    } catch {
      return null;
    }
  }
}

async function init() {
  // Always ensure the footer element exists (so it can be filled)
  const footerEl = ensureFooterContainer();

  applyNav();
  ensureBookNowButton();

  // Try to use site.js helpers if available
  const mod = await tryImportSiteHelpers();

  if (mod?.setBrandImages) {
    try { mod.setBrandImages(); } catch {}
  }

  if (mod?.setFooter) {
    try { mod.setFooter(); } catch {
      footerEl.innerHTML = FALLBACK_FOOTER_HTML;
    }
  } else {
    // If site.js can’t be loaded or doesn’t export setFooter
    footerEl.innerHTML = FALLBACK_FOOTER_HTML;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
