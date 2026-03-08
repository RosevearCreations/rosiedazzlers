// /assets/chrome.js
// Standardizes navigation + footer across ALL pages (one place to edit).
// - Rebuilds the top nav links in a consistent order
// - Highlights the active page
// - Wires the mobile "Menu" toggle (if present)
// - Ensures footer + brand images are applied

import { setBrandImages, setFooter } from "/assets/site.js?v=20260307g";

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

// If you ever want to hide gifts temporarily, set to false:
const SHOW_GIFTS = true;

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

    const aTags = linksEl.querySelectorAll("a[href]");
    aTags.forEach(a => {
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

function init() {
  setBrandImages();
  setFooter();
  applyNav();
  ensureBookNowButton();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
