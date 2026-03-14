// assets/chrome.js
// Shared site chrome: header, navigation, footer, and basic page wiring.

(function () {
  const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/pricing", label: "Pricing" },
    { href: "/book", label: "Book" },
    { href: "/gifts", label: "Gifts" },
    { href: "/gear", label: "Gear" },
    { href: "/consumables", label: "Consumables" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" }
  ];

  const SOCIAL_LINKS = [
    { href: "https://www.facebook.com/", label: "Facebook" },
    { href: "https://www.instagram.com/", label: "Instagram" }
  ];

  const BRAND = {
    name: "Rosie Dazzlers",
    tagline: "Mobile Auto Detailing",
    logo: "https://assets.rosiedazzlers.ca/brand/logo.png",
    footerLogo: "https://assets.rosiedazzlers.ca/brand/logo.png"
  };

  function normalizePath(pathname) {
    if (!pathname) return "/";
    let p = pathname.trim();
    if (p === "") return "/";
    if (p !== "/" && p.endsWith("/")) p = p.slice(0, -1);
    if (p.endsWith(".html")) p = p.replace(/\.html$/i, "");
    return p || "/";
  }

  function isActiveLink(href) {
    const current = normalizePath(window.location.pathname);
    const target = normalizePath(href);
    return current === target;
  }

  function buildHeader() {
    const header = document.createElement("header");
    header.className = "site-header";

    const inner = document.createElement("div");
    inner.className = "site-header-inner";

    const brand = document.createElement("a");
    brand.className = "site-brand";
    brand.href = "/";
    brand.setAttribute("aria-label", BRAND.name);

    const logo = document.createElement("img");
    logo.src = BRAND.logo;
    logo.alt = BRAND.name;
    logo.className = "site-brand-logo";
    logo.loading = "eager";

    const brandText = document.createElement("div");
    brandText.className = "site-brand-text";

    const brandName = document.createElement("div");
    brandName.className = "site-brand-name";
    brandName.textContent = BRAND.name;

    const brandTag = document.createElement("div");
    brandTag.className = "site-brand-tagline";
    brandTag.textContent = BRAND.tagline;

    brandText.appendChild(brandName);
    brandText.appendChild(brandTag);
    brand.appendChild(logo);
    brand.appendChild(brandText);

    const nav = document.createElement("nav");
    nav.className = "site-nav";
    nav.setAttribute("aria-label", "Main navigation");

    const ul = document.createElement("ul");
    ul.className = "site-nav-list";

    for (const link of NAV_LINKS) {
      const li = document.createElement("li");
      li.className = "site-nav-item";

      const a = document.createElement("a");
      a.className = "site-nav-link";
      a.href = link.href;
      a.textContent = link.label;

      if (isActiveLink(link.href)) {
        a.setAttribute("aria-current", "page");
        a.classList.add("is-active");
      }

      li.appendChild(a);
      ul.appendChild(li);
    }

    nav.appendChild(ul);
    inner.appendChild(brand);
    inner.appendChild(nav);
    header.appendChild(inner);

    return header;
  }

  function buildFooter() {
    const footer = document.createElement("footer");
    footer.className = "site-footer";

    const inner = document.createElement("div");
    inner.className = "site-footer-inner";

    const brandWrap = document.createElement("div");
    brandWrap.className = "site-footer-brand";

    const logo = document.createElement("img");
    logo.src = BRAND.footerLogo;
    logo.alt = BRAND.name;
    logo.className = "site-footer-logo";
    logo.loading = "lazy";

    const textWrap = document.createElement("div");
    textWrap.className = "site-footer-text";

    const name = document.createElement("div");
    name.className = "site-footer-name";
    name.textContent = BRAND.name;

    const tag = document.createElement("div");
    tag.className = "site-footer-tagline";
    tag.textContent = BRAND.tagline;

    textWrap.appendChild(name);
    textWrap.appendChild(tag);
    brandWrap.appendChild(logo);
    brandWrap.appendChild(textWrap);

    const nav = document.createElement("nav");
    nav.className = "site-footer-nav";
    nav.setAttribute("aria-label", "Footer navigation");

    const navList = document.createElement("ul");
    navList.className = "site-footer-nav-list";

    for (const link of NAV_LINKS) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      li.appendChild(a);
      navList.appendChild(li);
    }

    nav.appendChild(navList);

    const socials = document.createElement("div");
    socials.className = "site-footer-socials";

    for (const social of SOCIAL_LINKS) {
      const a = document.createElement("a");
      a.href = social.href;
      a.textContent = social.label;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      socials.appendChild(a);
    }

    const legal = document.createElement("div");
    legal.className = "site-footer-legal";
    legal.innerHTML = `
      <a href="/privacy">Privacy</a>
      <span>•</span>
      <a href="/terms">Terms</a>
      <span>•</span>
      <a href="/waiver">Waiver</a>
    `;

    const copy = document.createElement("div");
    copy.className = "site-footer-copy";
    copy.textContent = `© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.`;

    inner.appendChild(brandWrap);
    inner.appendChild(nav);
    inner.appendChild(socials);
    inner.appendChild(legal);
    inner.appendChild(copy);
    footer.appendChild(inner);

    return footer;
  }

  function ensureMount(selector, builder, position) {
    const existing = document.querySelector(selector);
    if (existing) return;

    const built = builder();

    if (position === "before-main") {
      const main = document.querySelector("main");
      if (main && main.parentNode) {
        main.parentNode.insertBefore(built, main);
        return;
      }
    }

    document.body.appendChild(built);
  }

  function initChrome() {
    ensureMount(".site-header", buildHeader, "before-main");
    ensureMount(".site-footer", buildFooter, "append");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChrome);
  } else {
    initChrome();
  }
})();
