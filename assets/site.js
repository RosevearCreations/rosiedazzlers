// assets/site.js
// Shared rendering/helpers for Rosie Dazzlers pages.
// Uses assets/config.js as the source of truth for package media, charts, pricing, and add-ons.

import {
  PATHS,
  CHARTS,
  PACKAGE_MEDIA,
  PRICING,
  ADDONS,
  assetUrl,
  money,
  calcDepositCents,
} from "./config.js";

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function packageImageUrl(packageCode, vehicleSize) {
  const media = PACKAGE_MEDIA[packageCode];
  if (!media) return "";
  const file = media[vehicleSize];
  if (!file) return "";
  return assetUrl(PATHS.packages, file);
}

function chartImageUrl(chartKey) {
  const file = CHARTS[chartKey];
  if (!file) return "";
  return assetUrl(PATHS.brand, file);
}

function getPackagePrice(packageCode, vehicleSize) {
  const pkg = PRICING[packageCode];
  if (!pkg) return null;
  return pkg[vehicleSize] ?? null;
}

function getAddonPrice(addonKey, vehicleSize) {
  const addon = ADDONS[addonKey];
  if (!addon) return null;
  if (typeof addon.price_cents === "number") return addon.price_cents;
  if (addon.prices_cents && typeof addon.prices_cents[vehicleSize] === "number") {
    return addon.prices_cents[vehicleSize];
  }
  return null;
}

function renderImage(el, src, alt) {
  if (!el) return;
  if (!src) {
    el.removeAttribute("src");
    el.alt = alt || "";
    el.style.display = "none";
    return;
  }
  el.src = src;
  el.alt = alt || "";
  el.style.display = "";
}

function buildPackageCards() {
  const mount = qs("[data-package-grid]");
  if (!mount) return;

  const sizes = ["small", "mid", "oversize"];
  const order = [
    "premium_wash",
    "basic_detail",
    "complete_detail",
    "interior_detail",
    "exterior_detail",
  ];

  mount.innerHTML = "";

  for (const packageCode of order) {
    const pkg = PRICING[packageCode];
    if (!pkg) continue;

    const article = document.createElement("article");
    article.className = "package-card";
    article.dataset.packageCode = packageCode;

    const preview = document.createElement("div");
    preview.className = "package-card-preview";

    const img = document.createElement("img");
    img.className = "package-card-image";
    img.loading = "lazy";
    renderImage(img, packageImageUrl(packageCode, "small"), pkg.label);

    preview.appendChild(img);

    const body = document.createElement("div");
    body.className = "package-card-body";

    const title = document.createElement("h3");
    title.className = "package-card-title";
    title.textContent = pkg.label;

    const subtitle = document.createElement("p");
    subtitle.className = "package-card-subtitle";
    subtitle.textContent = pkg.subtitle || "";

    const pricing = document.createElement("div");
    pricing.className = "package-card-pricing";

    for (const size of sizes) {
      const row = document.createElement("div");
      row.className = "package-card-price-row";
      row.dataset.size = size;

      const label = document.createElement("span");
      label.className = "package-card-price-label";
      label.textContent = size === "small" ? "Small" : size === "mid" ? "Mid" : "Oversize";

      const value = document.createElement("span");
      value.className = "package-card-price-value";
      value.textContent = money(pkg[size]);

      row.appendChild(label);
      row.appendChild(value);

      row.addEventListener("mouseenter", () => {
        renderImage(img, packageImageUrl(packageCode, size), `${pkg.label} — ${label.textContent}`);
      });

      row.addEventListener("focusin", () => {
        renderImage(img, packageImageUrl(packageCode, size), `${pkg.label} — ${label.textContent}`);
      });

      pricing.appendChild(row);
    }

    const deposit = document.createElement("p");
    deposit.className = "package-card-deposit";
    deposit.textContent = `Deposit: ${money(calcDepositCents(packageCode))}`;

    const ctaWrap = document.createElement("div");
    ctaWrap.className = "package-card-actions";

    const cta = document.createElement("a");
    cta.className = "btn btn-primary";
    cta.href = `/book?package=${encodeURIComponent(packageCode)}`;
    cta.textContent = "Book This Service";

    const pricingLink = document.createElement("a");
    pricingLink.className = "btn btn-secondary";
    pricingLink.href = "/pricing";
    pricingLink.textContent = "View Pricing";

    ctaWrap.appendChild(cta);
    ctaWrap.appendChild(pricingLink);

    body.appendChild(title);
    body.appendChild(subtitle);
    body.appendChild(pricing);
    body.appendChild(deposit);
    body.appendChild(ctaWrap);

    article.appendChild(preview);
    article.appendChild(body);
    mount.appendChild(article);
  }
}

function buildAddonsList() {
  const mount = qs("[data-addons-list]");
  if (!mount) return;

  mount.innerHTML = "";

  for (const [key, addon] of Object.entries(ADDONS)) {
    const card = document.createElement("article");
    card.className = "addon-card";
    card.dataset.addonKey = key;

    const title = document.createElement("h3");
    title.className = "addon-card-title";
    title.textContent = addon.label;

    const detail = document.createElement("div");
    detail.className = "addon-card-detail";

    if (addon.quote_required) {
      detail.textContent = "Quote required";
    } else if (typeof addon.price_cents === "number") {
      detail.textContent = money(addon.price_cents);
    } else if (addon.prices_cents) {
      const parts = [];
      if (typeof addon.prices_cents.small === "number") parts.push(`Small ${money(addon.prices_cents.small)}`);
      if (typeof addon.prices_cents.mid === "number") parts.push(`Mid ${money(addon.prices_cents.mid)}`);
      if (typeof addon.prices_cents.oversize === "number") parts.push(`Oversize ${money(addon.prices_cents.oversize)}`);
      detail.textContent = parts.join(" • ");
    } else {
      detail.textContent = "Contact for pricing";
    }

    card.appendChild(title);
    card.appendChild(detail);
    mount.appendChild(card);
  }
}

function wirePackagePreviewPicker() {
  const select = qs("[data-package-select]");
  const sizeSelect = qs("[data-size-select]");
  const image = qs("[data-package-preview-image]");
  const title = qs("[data-package-preview-title]");
  const price = qs("[data-package-preview-price]");
  const deposit = qs("[data-package-preview-deposit]");
  const includesChart = qs("[data-includes-chart]");
  const sizeChart = qs("[data-size-chart]");

  if (!select || !sizeSelect) return;

  function update() {
    const packageCode = normalizeKey(select.value);
    const vehicleSize = normalizeKey(sizeSelect.value) || "small";
    const pkg = PRICING[packageCode];

    if (!pkg) {
      renderImage(image, "", "");
      if (title) title.textContent = "";
      if (price) price.textContent = "";
      if (deposit) deposit.textContent = "";
      return;
    }

    if (title) title.textContent = pkg.label;
    if (price) {
      const cents = getPackagePrice(packageCode, vehicleSize);
      price.textContent = cents != null ? money(cents) : "Contact for pricing";
    }
    if (deposit) deposit.textContent = money(calcDepositCents(packageCode));

    renderImage(
      image,
      packageImageUrl(packageCode, vehicleSize),
      `${pkg.label} preview`
    );

    renderImage(
      includesChart,
      chartImageUrl("includes"),
      "Included service chart"
    );

    renderImage(
      sizeChart,
      chartImageUrl("size"),
      "Vehicle size chart"
    );
  }

  select.addEventListener("change", update);
  sizeSelect.addEventListener("change", update);
  update();
}

function wireAddonEstimator() {
  const packageSelect = qs("[data-estimator-package]");
  const sizeSelect = qs("[data-estimator-size]");
  const addonCheckboxes = qsa("[data-addon-key]");
  const packageTotal = qs("[data-estimator-package-total]");
  const addonTotal = qs("[data-estimator-addon-total]");
  const grandTotal = qs("[data-estimator-grand-total]");
  const depositTotal = qs("[data-estimator-deposit-total]");

  if (!packageSelect || !sizeSelect || !packageTotal || !addonTotal || !grandTotal || !depositTotal) {
    return;
  }

  function update() {
    const packageCode = normalizeKey(packageSelect.value);
    const vehicleSize = normalizeKey(sizeSelect.value);

    const base = getPackagePrice(packageCode, vehicleSize) || 0;
    let addonsTotalCents = 0;

    for (const checkbox of addonCheckboxes) {
      if (!checkbox.checked) continue;
      const addonKey = checkbox.dataset.addonKey;
      const addon = ADDONS[addonKey];
      if (!addon || addon.quote_required) continue;
      const cents = getAddonPrice(addonKey, vehicleSize);
      if (typeof cents === "number") addonsTotalCents += cents;
    }

    packageTotal.textContent = money(base);
    addonTotal.textContent = money(addonsTotalCents);
    grandTotal.textContent = money(base + addonsTotalCents);
    depositTotal.textContent = money(calcDepositCents(packageCode));
  }

  packageSelect.addEventListener("change", update);
  sizeSelect.addEventListener("change", update);
  for (const checkbox of addonCheckboxes) {
    checkbox.addEventListener("change", update);
  }

  update();
}

function wireCanonicalLinks() {
  qsa('a[href="/services.html"], a[href="services.html"]').forEach((a) => {
    a.href = "/services";
  });

  qsa('a[href="/pricing.html"], a[href="pricing.html"]').forEach((a) => {
    a.href = "/pricing";
  });
}

function init() {
  wireCanonicalLinks();
  buildPackageCards();
  buildAddonsList();
  wirePackagePreviewPicker();
  wireAddonEstimator();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
