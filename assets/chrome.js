// assets/chrome.js
// Shared site chrome: header, navigation, footer.
// Conservative version to preserve existing CSS hooks while enforcing canonical URLs.

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
    let p = String(pathname).trim();
    if (!p) return "/";
    if (p !== "/" && p.endsWith("/")) p = p.slice(0, -1);
    if (p.endsWith(".html")) p = p.replace(/\.html$/i, "");
    return p || "/";
  }

  function isActiveLink(href) {
    return normalizePath(window.location.pathname) === normalizePath(href);
  }

  function setClasses(el, classes) {
    el.className = classes.join(" ");
    return el;
  }

  function buildHeader() {
    const header = setClasses(document.createElement("header"), [
      "site-header",
      "header",
      "top-header"
    ]);

    const inner = setClasses(document.createElement("div"), [
      "site-header-inner",
      "header-inner",
      "container",
      "wrapper"
    ]);

    const brand = setClasses(document.createElement("a"), [
      "site-brand",
      "brand",
      "logo-wrap"
    ]);
    brand.href = "/";
    brand.setAttribute("aria-label", BRAND.name);

    const logo = setClasses(document.createElement("img"), [
      "site-brand-logo",
      "brand-logo",
      "logo"
    ]);
    logo.src = BRAND.logo;
    logo.alt = BRAND.name;
    logo.loading = "eager";

    const brandText = setClasses(document.createElement("div"), [
      "site-brand-text",
      "brand-text"
    ]);

    const brandName = setClasses(document.createElement("div"), [
      "site-brand-name",
      "brand-name"
    ]);
    brandName.textContent = BRAND.name;

    const brandTag = setClasses(document.createElement("div"), [
      "site-brand-tagline",
      "brand-tagline"
    ]);
    brandTag.textContent = BRAND.tagline;

    brandText.appendChild(brandName);
    brandText.appendChild(brandTag);
    brand.appendChild(logo);
    brand.appendChild(brandText);

    const nav = setClasses(document.createElement("nav"), [
      "site-nav",
      "nav",
      "main-nav"
    ]);
    nav.setAttribute("aria-label", "Main navigation");

    const ul = setClasses(document.createElement("ul"), [
      "site-nav-list",
      "nav-list",
      "menu",
      "menu-list"
    ]);

    for (const link of NAV_LINKS) {
      const li = setClasses(document.createElement("li"), [
        "site-nav-item",
        "nav-item",
        "menu-item"
      ]);

      const a = setClasses(document.createElement("a"), [
        "site-nav-link",
        "nav-link",
        "menu-link"
      ]);
      a.href = link.href;
      a.textContent = link.label;

      if (isActiveLink(link.href)) {
        a.classList.add("is-active", "active", "current");
        a.setAttribute("aria-current", "page");
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
    const footer = setClasses(document.createElement("footer"), [
      "site-footer",
      "footer"
    ]);

    const inner = setClasses(document.createElement("div"), [
      "site-footer-inner",
      "footer-inner",
      "container",
      "wrapper"
    ]);

    const brandWrap = setClasses(document.createElement("div"), [
      "site-footer-brand",
      "footer-brand"
    ]);

    const logo = setClasses(document.createElement("img"), [
      "site-footer-logo",
      "footer-logo",
      "logo"
    ]);
    logo.src = BRAND.footerLogo;
    logo.alt = BRAND.name;
    logo.loading = "lazy";

    const textWrap = setClasses(document.createElement("div"), [
      "site-footer-text",
      "footer-text"
    ]);

    const name = setClasses(document.createElement("div"), [
      "site-footer-name",
      "footer-name"
    ]);
    name.textContent = BRAND.name;

    const tag = setClasses(document.createElement("div"), [
      "site-footer-tagline",
      "footer-tagline"
    ]);
    tag.textContent = BRAND.tagline;

    textWrap.appendChild(name);
    textWrap.appendChild(tag);
    brandWrap.appendChild(logo);
    brandWrap.appendChild(textWrap);

    const nav = setClasses(document.createElement("nav"), [
      "site-footer-nav",
      "footer-nav"
    ]);
    nav.setAttribute("aria-label", "Footer navigation");

    const navList = setClasses(document.createElement("ul"), [
      "site-footer-nav-list",
      "footer-nav-list",
      "menu",
      "menu-list"
    ]);

    for (const link of NAV_LINKS) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      li.appendChild(a);
      navList.appendChild(li);
    }

    nav.appendChild(navList);

    const socials = setClasses(document.createElement("div"), [
      "site-footer-socials",
      "footer-socials"
    ]);

    for (const social of SOCIAL_LINKS) {
      const a = document.createElement("a");
      a.href = social.href;
      a.textContent = social.label;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      socials.appendChild(a);
    }

    const legal = setClasses(document.createElement("div"), [
      "site-footer-legal",
      "footer-legal"
    ]);
    legal.innerHTML = `
      <a href="/privacy">Privacy</a>
      <span>•</span>
      <a href="/terms">Terms</a>
      <span>•</span>
      <a href="/waiver">Waiver</a>
    `;

    const copy = setClasses(document.createElement("div"), [
      "site-footer-copy",
      "footer-copy"
    ]);
    copy.textContent = `© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.`;

    inner.appendChild(brandWrap);
    inner.appendChild(nav);
    inner.appendChild(socials);
    inner.appendChild(legal);
    inner.appendChild(copy);
    footer.appendChild(inner);

    return footer;
  }

  function mountIfMissing(selector, builder, mode) {
    if (document.querySelector(selector)) return;

    const built = builder();
    const main = document.querySelector("main");

    if (mode === "before-main" && main && main.parentNode) {
      main.parentNode.insertBefore(built, main);
      return;
    }

    document.body.appendChild(built);
  }

  function rewriteCanonicalLinks(root) {
    root.querySelectorAll('a[href="/services.html"], a[href="services.html"]').forEach((a) => {
      a.href = "/services";
    });

    root.querySelectorAll('a[href="/pricing.html"], a[href="pricing.html"]').forEach((a) => {
      a.href = "/pricing";
    });
  }

  function initChrome() {
    mountIfMissing(".site-header, .header, .top-header", buildHeader, "before-main");
    mountIfMissing(".site-footer, .footer", buildFooter, "append");
    rewriteCanonicalLinks(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChrome);
  } else {
    initChrome();
  }
})();
