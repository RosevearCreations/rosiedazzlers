const DATA_URL = "/data/rosie_services_pricing_and_packages.json";

const BRAND = {
  logo: "https://assets.rosiedazzlers.ca/brand/RosieDazzlerLogoOriginal3D.png",
  banner: "https://assets.rosiedazzlers.ca/brand/RosieDazzlersBanner.png",
  reviews: "https://assets.rosiedazzlers.ca/brand/RosieReviews.png"
};

const CONTACT = {
  phone: "226-752-7613",
  email: "info@rosiedazzlers.ca",
  serviceArea: "Norfolk & Oxford Counties"
};

const PACKAGES_BASE = "https://assets.rosiedazzlers.ca/packages/";
const pkgFile = (filename) => encodeURI(`${PACKAGES_BASE}${filename}`);

const HOVER_MEDIA = {
  exterior: pkgFile("Exterior Detail.png"),
  interior: pkgFile("Interior Detail.png"),
  size: pkgFile("CarSizeChart.PNG")
};

let _servicesData = null;

async function loadServicesData() {
  if (_servicesData) return _servicesData;
  const res = await fetch(`${DATA_URL}?v=20260315b`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${DATA_URL}`);
  _servicesData = await res.json();
  return _servicesData;
}

function q(id) {
  return document.getElementById(id);
}

function money(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(Number(value || 0));
}

function setText(id, value) {
  const el = q(id);
  if (el) el.textContent = value;
}

function sizeLabel(size) {
  if (size === "small") return "Small";
  if (size === "mid") return "Mid";
  if (size === "oversize") return "Oversize / Exotic";
  return size || "";
}

function getPackageByCode(data, code) {
  return (data.packages || []).find((p) => p.code === code) || null;
}

function packagePrice(pkg, size) {
  if (!pkg) return 0;
  if (pkg.prices_cad && pkg.prices_cad[size] != null) return Number(pkg.prices_cad[size]);
  if (pkg.prices && pkg.prices[size] != null) return Number(pkg.prices[size]);
  return 0;
}

function packageDeposit(pkg) {
  if (!pkg) return 0;
  if (pkg.deposit_cad != null) return Number(pkg.deposit_cad);
  if (pkg.deposit != null) return Number(pkg.deposit);
  return 0;
}

function packageImageForSize(pkg, size) {
  if (!pkg) return "";
  if (pkg.images_by_size && pkg.images_by_size[size]) return pkg.images_by_size[size];
  if (pkg.images && pkg.images[size]) return pkg.images[size];
  return "";
}

function addonDisplay(addon, size) {
  if (!addon) return "Quote required";

  if (addon.quote_required === true) {
    if (addon.prices_cad?.[size] != null) return `From ${money(addon.prices_cad[size])} · Quote required`;
    if (addon.prices?.[size] != null) return `From ${money(addon.prices[size])} · Quote required`;
    if (addon.price_cad != null) return `From ${money(addon.price_cad)} · Quote required`;
    if (addon.price != null) return `From ${money(addon.price)} · Quote required`;
    return "Quote required";
  }

  if (addon.prices_cad?.[size] != null) return money(addon.prices_cad[size]);
  if (addon.prices?.[size] != null) return money(addon.prices[size]);
  if (addon.price_cad != null) return money(addon.price_cad);
  if (addon.price != null) return money(addon.price);
  return "Quote required";
}

function addonCharge(addon, size) {
  if (!addon || addon.quote_required === true) return 0;
  if (addon.prices_cad?.[size] != null) return Number(addon.prices_cad[size]);
  if (addon.prices?.[size] != null) return Number(addon.prices[size]);
  if (addon.price_cad != null) return Number(addon.price_cad);
  if (addon.price != null) return Number(addon.price);
  return 0;
}

function addonImage(addon) {
  return addon?.image || "";
}

function selectedAddonCodesFromInputs() {
  return [...document.querySelectorAll('input[name="addons"]:checked')].map((el) => el.value);
}

function buildMainCardGallery(pkg, size) {
  const gallery = [];
  const main = packageImageForSize(pkg, size);
  if (main) gallery.push(main);
  gallery.push(HOVER_MEDIA.exterior, HOVER_MEDIA.interior, HOVER_MEDIA.size);
  return [...new Set(gallery.filter(Boolean))];
}

function buildAddonGallery(addon) {
  const gallery = [];
  const img = addonImage(addon);
  if (img) gallery.push(img);
  return [...new Set(gallery.filter(Boolean))];
}

function initSimpleCarousels(root = document) {
  const wraps = root.querySelectorAll("[data-carousel]");
  wraps.forEach((wrap) => {
    const imgs = [...wrap.querySelectorAll("img")];
    if (imgs.length <= 1) return;
    if (wrap.dataset.carouselBound === "1") return;
    wrap.dataset.carouselBound = "1";

    let current = 0;
    let timer = null;

    const show = (idx) => {
      imgs.forEach((img, i) => img.classList.toggle("active", i === idx));
    };

    show(0);

    wrap.addEventListener("mouseenter", () => {
      if (timer) return;
      timer = setInterval(() => {
        current = (current + 1) % imgs.length;
        show(current);
      }, 1200);
    });

    wrap.addEventListener("mouseleave", () => {
      clearInterval(timer);
      timer = null;
      current = 0;
      show(0);
    });
  });
}

function renderMainPackages(cardsEl, data, size) {
  if (!cardsEl) return;
  cardsEl.innerHTML = "";

  for (const pkg of data.packages || []) {
    const price = packagePrice(pkg, size);
    const deposit = packageDeposit(pkg);
    const gallery = buildMainCardGallery(pkg, size);

    const included = (pkg.included_services || [])
      .map((s) => {
        const note = s.optional_condition_note ? ` <span class="note">${s.optional_condition_note}</span>` : "";
        return `<li>${s.name}${note}</li>`;
      })
      .join("");

    const notes = (pkg.notes || []).map((n) => `<div class="tag">${n}</div>`).join("");

    const mediaHtml = `
      <div class="service-media" data-carousel>
        ${gallery.map((src, i) => `<img loading="lazy" src="${src}" alt="${pkg.name}" class="${i === 0 ? "active" : ""}" onerror="this.style.display='none'">`).join("")}
      </div>
    `;

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      ${mediaHtml}
      <h3>${pkg.name}</h3>
      <p>${pkg.subtitle || ""}</p>
      <div class="price">${money(price)} <span class="kicker">(${sizeLabel(size)})</span></div>
      <div class="kicker">Deposit: ${money(deposit)}</div>
      <div class="hr"></div>
      <ul class="list">${included}</ul>
      ${notes ? `<div class="hr"></div>${notes}` : ""}
      <div class="hr"></div>
      <a class="btn primary" href="/book?package=${encodeURIComponent(pkg.code)}&size=${encodeURIComponent(size)}">Book this</a>
    `;
    cardsEl.appendChild(div);
  }

  initSimpleCarousels(cardsEl);
}

function renderAddons(cardsEl, data, size) {
  if (!cardsEl) return;
  cardsEl.innerHTML = "";

  for (const addon of data.addons || []) {
    const gallery = buildAddonGallery(addon);
    const display = addonDisplay(addon, size);

    const tags = [];
    if (addon.quote_required) tags.push(`<span class="tag quote">Quote</span>`);
    if (addon.source) tags.push(`<span class="tag">${addon.source}</span>`);

    const notes = (addon.notes || []).map((n) => `<div class="kicker">${n}</div>`).join("");

    const mediaHtml = gallery.length
      ? `
        <div class="service-media" data-carousel>
          ${gallery.map((src, i) => `<img loading="lazy" src="${src}" alt="${addon.name}" class="${i === 0 ? "active" : ""}" onerror="this.style.display='none'">`).join("")}
        </div>
      `
      : "";

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      ${mediaHtml}
      <h3>${addon.name}</h3>
      <p>${addon.subtitle || ""}</p>
      <div class="price">${display}</div>
      ${addon.description ? `<div class="hr"></div><p>${addon.description}</p>` : ""}
      ${tags.length ? `<div class="hr"></div><div>${tags.join(" ")}</div>` : ""}
      ${notes ? `<div class="hr"></div>${notes}` : ""}
    `;
    cardsEl.appendChild(div);
  }

  initSimpleCarousels(cardsEl);
}

function forceImageIntoTarget(target, src, alt) {
  if (!target) return;

  const tag = target.tagName ? target.tagName.toLowerCase() : "";
  if (tag === "img") {
    target.src = src;
    target.alt = alt;
    target.loading = "lazy";
    target.style.display = "block";
    return;
  }

  const existingImg = target.querySelector("img");
  if (existingImg) {
    existingImg.src = src;
    existingImg.alt = alt;
    existingImg.loading = "lazy";
    existingImg.style.display = "block";
    return;
  }

  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.loading = "lazy";
  img.style.display = "block";
  img.style.width = "100%";
  img.style.height = "auto";
  img.style.objectFit = "contain";
  target.appendChild(img);
}

function applyBrandImages() {
  document.querySelectorAll("[data-logo]").forEach((el) => {
    el.src = BRAND.logo;
    el.alt = "Rosie Dazzlers logo";
  });

  const bannerTargets = [
    ...document.querySelectorAll("[data-banner]"),
    ...document.querySelectorAll("#bannerImage"),
    ...document.querySelectorAll(".hero-banner"),
    ...document.querySelectorAll(".hero-banner img"),
    ...document.querySelectorAll(".banner"),
    ...document.querySelectorAll(".banner img"),
    ...document.querySelectorAll("img[data-role='banner']")
  ];
  bannerTargets.forEach((el) => forceImageIntoTarget(el, BRAND.banner, "Rosie Dazzlers banner"));

  const reviewTargets = [
    ...document.querySelectorAll("[data-reviews]"),
    ...document.querySelectorAll("#reviewsImage"),
    ...document.querySelectorAll(".reviews"),
    ...document.querySelectorAll(".reviews img"),
    ...document.querySelectorAll(".review-banner"),
    ...document.querySelectorAll(".review-banner img"),
    ...document.querySelectorAll("img[data-role='reviews']")
  ];
  reviewTargets.forEach((el) => forceImageIntoTarget(el, BRAND.reviews, "Rosie Dazzlers reviews"));
}

function chartButtons(data, selectorMap) {
  const charts = data.charts || [];
  const byName = Object.fromEntries(charts.map((c) => [c.filename, c]));

  const FALLBACK = {
    "CarPrice2025.PNG": "https://assets.rosiedazzlers.ca/brand/CarPrice2025.PNG",
    "CarPriceDetails2025.PNG": "https://assets.rosiedazzlers.ca/brand/CarPriceDetails2025.PNG",
    "CarSizeChart.PNG": pkgFile("CarSizeChart.PNG")
  };

  const resolveSrc = (name) => {
    if (name === "CarSizeChart.PNG") return FALLBACK[name];
    return byName[name]?.r2_url || FALLBACK[name] || "";
  };

  const openLightbox = (title, src) => {
    let lb = document.querySelector("#lightbox");
    if (!lb) {
      lb = document.createElement("div");
      lb.id = "lightbox";
      lb.className = "lightbox";
      lb.innerHTML = `
        <div class="lightbox-inner">
          <div class="lightbox-top">
            <div class="title" id="lbTitle"></div>
            <button class="btn small ghost" id="lbClose" type="button">Close</button>
          </div>
          <img id="lbImg" alt="">
          <div class="kicker">Tip: right-click → open image in new tab</div>
        </div>
      `;
      document.body.appendChild(lb);

      const close = () => lb.classList.remove("open");
      lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
      lb.querySelector("#lbClose").addEventListener("click", close);
      window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    }

    lb.querySelector("#lbTitle").textContent = title || "";
    const img = lb.querySelector("#lbImg");
    img.src = src;
    img.alt = title || "";
    lb.classList.add("open");
  };

  const bind = (selector, name, title) => {
    const el = document.querySelector(selector);
    const src = resolveSrc(name);
    if (!el || !src) return;
    if (el.dataset.chartBound === "1") return;
    el.dataset.chartBound = "1";
    el.addEventListener("click", () => openLightbox(title, src));
  };

  if (selectorMap.price) bind(selectorMap.price, "CarPrice2025.PNG", "Vehicle Price Chart 2025");
  if (selectorMap.details) bind(selectorMap.details, "CarPriceDetails2025.PNG", "Package Service Details Chart");
  if (selectorMap.size) bind(selectorMap.size, "CarSizeChart.PNG", "Vehicle Size Chart");
}

function populateBookingPackages(selectEl, data) {
  if (!selectEl) return;

  const current = selectEl.value;
  selectEl.innerHTML = "";

  for (const pkg of data.packages || []) {
    const opt = document.createElement("option");
    opt.value = pkg.code;
    opt.textContent = pkg.name;
    selectEl.appendChild(opt);
  }

  if (current) selectEl.value = current;
}

function populateAddonChecklist(wrap, data, size) {
  if (!wrap) return;
  wrap.innerHTML = "";

  for (const addon of data.addons || []) {
    const id = `addon_${addon.code}`;
    const price = addonDisplay(addon, size);

    wrap.insertAdjacentHTML(
      "beforeend",
      `
      <label class="check-card" for="${id}">
        <input type="checkbox" id="${id}" name="addons" value="${addon.code}">
        <div>
          <strong>${addon.name}</strong>
          <div class="muted">${addon.subtitle || ""}</div>
          <div class="mini-price">${price}</div>
        </div>
      </label>
      `
    );
  }
}

function currentBookingPackageCode() {
  return q("package_code")?.value || q("package")?.value || "";
}

function currentBookingSize() {
  return q("vehicle_size")?.value || q("size")?.value || "small";
}

function updateBookingSummary(data) {
  const size = currentBookingSize();
  const pkg = getPackageByCode(data, currentBookingPackageCode());
  if (!pkg) return;

  const base = packagePrice(pkg, size);
  const deposit = packageDeposit(pkg);

  const selectedCodes = selectedAddonCodesFromInputs();
  const selectedAddons = (data.addons || []).filter((a) => selectedCodes.includes(a.code));

  let pricedAddons = 0;
  const quoteAddons = [];

  for (const addon of selectedAddons) {
    if (addon.quote_required) {
      quoteAddons.push(addon.name);
    } else {
      pricedAddons += addonCharge(addon, size);
    }
  }

  const total = base + pricedAddons;

  const summary = q("summary");
  if (summary) {
    summary.className = "notice";
    summary.innerHTML = `
      <div><strong>Estimate</strong></div>
      <div>Base: ${money(base)} · Priced add-ons: ${money(pricedAddons)} · <strong>Total: ${money(total)}</strong></div>
      <div class="kicker">Deposit due now: <strong>${money(deposit)}</strong></div>
      ${quoteAddons.length ? `<div class="kicker">Quote add-ons selected: ${quoteAddons.join(", ")} (not included in online total)</div>` : ""}
    `;
  }
}

function getUrlParams() {
  return new URLSearchParams(location.search);
}

function preselectBookingFromQuery() {
  const params = getUrlParams();
  const pkg = params.get("package");
  const size = params.get("size");

  const pkgSel = q("package_code") || q("package");
  const sizeSel = q("vehicle_size") || q("size");

  if (pkg && pkgSel) pkgSel.value = pkg;
  if (size && sizeSel) sizeSel.value = size;
}

function showCheckoutReturnStatus() {
  const el = document.querySelector("[data-checkout-status]");
  if (!el) return;

  const params = getUrlParams();
  const ok = params.get("checkout");
  const kind = params.get("kind");

  if (ok === "success" && kind === "booking") {
    el.textContent = "Deposit received. Your booking is being confirmed.";
    el.className = "notice ok";
  } else if (ok === "cancel") {
    el.textContent = "Checkout cancelled. No payment was taken.";
    el.className = "notice warn";
  } else {
    return;
  }

  el.style.display = "block";
}

function wireContactBits() {
  document.querySelectorAll("[data-phone]").forEach((el) => (el.textContent = CONTACT.phone));
  document.querySelectorAll("[data-email]").forEach((el) => (el.textContent = CONTACT.email));
  document.querySelectorAll("[data-service-area]").forEach((el) => (el.textContent = CONTACT.serviceArea));
}

async function initHomePage() {
  const cardsEl = q("homePackages");
  if (!cardsEl) return;
  const data = await loadServicesData();
  renderMainPackages(cardsEl, data, "small");
}

async function initServicesPage() {
  const cardsEl = q("packageCards");
  const addonEl = q("addonCards");
  const sizeSel = q("size");
  if (!cardsEl) return;

  const data = await loadServicesData();

  const render = () => {
    const size = sizeSel?.value || "small";
    renderMainPackages(cardsEl, data, size);
    renderAddons(addonEl, data, size);
  };

  sizeSel?.addEventListener("change", render);
  render();

  chartButtons(data, {
    price: "#openPrice",
    details: "#openDetails",
    size: "#openSize"
  });
}

async function initPricingPage() {
  const cardsEl = q("pricingCards");
  const addonsEl = q("pricingAddons");
  const sizeSel = q("size");
  if (!cardsEl) return;

  const data = await loadServicesData();

  const render = () => {
    const size = sizeSel?.value || "small";
    renderMainPackages(cardsEl, data, size);
    renderAddons(addonsEl, data, size);
  };

  sizeSel?.addEventListener("change", render);
  render();

  chartButtons(data, {
    price: "#openPrice",
    details: "#openDetails",
    size: "#openSize"
  });
}

async function initBookingPage() {
  const formRoot = document.querySelector("#bookingForm") || document;
  const pkgSel = q("package_code") || q("package");
  const sizeSel = q("vehicle_size") || q("size");
  const addonsWrap = q("addonsList") || q("addonsWrap");
  if (!pkgSel || !sizeSel || !addonsWrap) return;

  const data = await loadServicesData();

  populateBookingPackages(pkgSel, data);
  preselectBookingFromQuery();

  const rerender = () => {
    populateAddonChecklist(addonsWrap, data, sizeSel.value || "small");
    updateBookingSummary(data);
    document.querySelectorAll('input[name="addons"]').forEach((el) => {
      el.addEventListener("change", () => updateBookingSummary(data));
    });
  };

  pkgSel.addEventListener("change", () => updateBookingSummary(data));
  sizeSel.addEventListener("change", rerender);

  rerender();
}

async function init() {
  applyBrandImages();
  wireContactBits();
  showCheckoutReturnStatus();

  if (q("homePackages")) await initHomePage();
  if (q("packageCards")) await initServicesPage();
  if (q("pricingCards")) await initPricingPage();
  if (q("bookingForm") || q("package_code")) await initBookingPage();
}

document.addEventListener("DOMContentLoaded", init);
