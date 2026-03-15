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
  const res = await fetch(`${DATA_URL}?v=20260314a`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${DATA_URL}`);
  _servicesData = await res.json();
  return _servicesData;
}

function money(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(Number(value || 0));
}

function q(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = q(id);
  if (el) el.textContent = value;
}

function packagePrice(pkg, size) {
  if (!pkg || !pkg.prices) return 0;
  return Number(pkg.prices[size] || 0);
}

function calcDeposit(pkg) {
  return Number(pkg?.deposit || 0);
}

function sizeLabel(size) {
  if (size === "small") return "Small";
  if (size === "mid") return "Mid";
  if (size === "oversize") return "Oversize / Exotic";
  return size || "";
}

function getSelectedSize() {
  const sel = q("size");
  return sel?.value || "small";
}

function getCurrentPackageCode() {
  const sel = q("package");
  return sel?.value || "";
}

function buildMainCardGallery(pkg, size) {
  const files = [];
  if (pkg?.images?.[size]) files.push(pkg.images[size]);
  if (HOVER_MEDIA.exterior) files.push(HOVER_MEDIA.exterior);
  if (HOVER_MEDIA.interior) files.push(HOVER_MEDIA.interior);
  if (HOVER_MEDIA.size) files.push(HOVER_MEDIA.size);
  return [...new Set(files)];
}

function buildAddonGallery(addon) {
  const files = [];
  if (addon?.image) files.push(addon.image);
  return [...new Set(files)];
}

function initSimpleCarousels() {
  const wraps = document.querySelectorAll("[data-carousel]");
  wraps.forEach((wrap) => {
    const imgs = [...wrap.querySelectorAll("img")];
    if (imgs.length <= 1) return;

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
    const deposit = calcDeposit(pkg);
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

    cardsEl.insertAdjacentHTML(
      "beforeend",
      `
      <article class="card">
        ${mediaHtml}
        <div class="card-body">
          <div class="row between">
            <div>
              <h3>${pkg.name}</h3>
              <div class="muted">${pkg.subtitle || ""}</div>
            </div>
            <div class="price">${money(price)}</div>
          </div>

          <div class="chips">
            <span class="chip">Deposit ${money(deposit)}</span>
            <span class="chip">${sizeLabel(size)}</span>
          </div>

          <p>${pkg.description || ""}</p>

          <div class="subhead">Included</div>
          <ul class="list">${included}</ul>

          ${notes ? `<div class="tags">${notes}</div>` : ""}

          <div class="actions">
            <a class="btn primary" href="/book?package=${encodeURIComponent(pkg.code)}&size=${encodeURIComponent(size)}">Book this package</a>
          </div>
        </div>
      </article>
      `
    );
  }

  initSimpleCarousels();
}

function renderAddonCards(cardsEl, data, size) {
  if (!cardsEl) return;
  cardsEl.innerHTML = "";

  for (const addon of data.addons || []) {
    const price = addon.prices ? addon.prices[size] : null;
    const priceHtml = addon.quote_required
      ? `<div class="price quote">Quote required</div>`
      : `<div class="price">${money(price || 0)}</div>`;

    const gallery = buildAddonGallery(addon);
    const mediaHtml = gallery.length
      ? `
      <div class="service-media" data-carousel>
        ${gallery.map((src, i) => `<img loading="lazy" src="${src}" alt="${addon.name}" class="${i === 0 ? "active" : ""}" onerror="this.style.display='none'">`).join("")}
      </div>
      `
      : "";

    cardsEl.insertAdjacentHTML(
      "beforeend",
      `
      <article class="card addon">
        ${mediaHtml}
        <div class="card-body">
          <div class="row between">
            <div>
              <h3>${addon.name}</h3>
              <div class="muted">${addon.subtitle || ""}</div>
            </div>
            ${priceHtml}
          </div>

          <p>${addon.description || ""}</p>

          ${
            addon.quote_required
              ? `<div class="notice warn">This add-on requires a custom quote. Contact us or mention it during booking.</div>`
              : `<div class="chips"><span class="chip">${sizeLabel(size)}</span></div>`
          }
        </div>
      </article>
      `
    );
  }

  initSimpleCarousels();
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
    const price = addon.quote_required ? "Quote required" : money(addon.prices?.[size] || 0);

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

function findPackage(data, code) {
  return (data.packages || []).find((p) => p.code === code) || null;
}

function getSelectedAddons(data) {
  const checks = [...document.querySelectorAll('input[name="addons"]:checked')];
  return checks
    .map((c) => (data.addons || []).find((a) => a.code === c.value))
    .filter(Boolean);
}

function updateBookingSummary(data) {
  const size = getSelectedSize();
  const pkg = findPackage(data, getCurrentPackageCode());
  if (!pkg) return;

  const base = packagePrice(pkg, size);
  const deposit = calcDeposit(pkg);

  let addons = 0;
  for (const addon of getSelectedAddons(data)) {
    if (!addon.quote_required) {
      addons += Number(addon.prices?.[size] || 0);
    }
  }

  const total = base + addons;

  setText("summaryPackage", pkg.name);
  setText("summarySize", sizeLabel(size));
  setText("summaryBase", money(base));
  setText("summaryAddons", money(addons));
  setText("summaryTotal", money(total));
  setText("summaryDeposit", money(deposit));

  const totalEl = q("summaryTotal");
  if (totalEl) totalEl.dataset.total = String(total);
}

function forceImageIntoTarget(target, src, alt) {
  if (!target) return;

  const tag = target.tagName ? target.tagName.toLowerCase() : "";

  if (tag === "img") {
    target.src = src;
    target.alt = alt;
    target.loading = "lazy";
    target.style.display = "block";
    target.style.width = target.style.width || "100%";
    target.style.height = target.style.height || "auto";
    return;
  }

  const existingImg = target.querySelector("img");
  if (existingImg) {
    existingImg.src = src;
    existingImg.alt = alt;
    existingImg.loading = "lazy";
    existingImg.style.display = "block";
    existingImg.style.width = existingImg.style.width || "100%";
    existingImg.style.height = existingImg.style.height || "auto";
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

  bannerTargets.forEach((el) => {
    forceImageIntoTarget(el, BRAND.banner, "Rosie Dazzlers banner");
  });

  const reviewTargets = [
    ...document.querySelectorAll("[data-reviews]"),
    ...document.querySelectorAll("#reviewsImage"),
    ...document.querySelectorAll(".reviews"),
    ...document.querySelectorAll(".reviews img"),
    ...document.querySelectorAll(".review-banner"),
    ...document.querySelectorAll(".review-banner img"),
    ...document.querySelectorAll("img[data-role='reviews']")
  ];

  reviewTargets.forEach((el) => {
    forceImageIntoTarget(el, BRAND.reviews, "Rosie Dazzlers reviews");
  });
}

function getUrlParams() {
  return new URLSearchParams(location.search);
}

function preselectBookingFromQuery() {
  const params = getUrlParams();
  const pkg = params.get("package");
  const size = params.get("size");

  const pkgSel = q("package");
  const sizeSel = q("size");

  if (pkg && pkgSel) pkgSel.value = pkg;
  if (size && sizeSel) sizeSel.value = size;
}

async function renderHomePage() {
  const cardsEl = q("homePackages");
  if (!cardsEl) return;

  const data = await loadServicesData();
  renderMainPackages(cardsEl, data, "small");
}

async function renderServicesPage() {
  const cardsEl = q("packagesGrid");
  const sizeSel = q("size");
  if (!cardsEl || !sizeSel) return;

  const data = await loadServicesData();

  const rerender = () => {
    renderMainPackages(cardsEl, data, sizeSel.value || "small");
  };

  sizeSel.addEventListener("change", rerender);
  rerender();
}

async function renderPricingPage() {
  const cardsEl = q("pricingPackages");
  const addonEl = q("addonsGrid");
  const sizeSel = q("size");
  if (!cardsEl || !addonEl || !sizeSel) return;

  const data = await loadServicesData();

  const rerender = () => {
    const size = sizeSel.value || "small";
    renderMainPackages(cardsEl, data, size);
    renderAddonCards(addonEl, data, size);
  };

  sizeSel.addEventListener("change", rerender);
  rerender();
}

async function renderBookingPage() {
  const pkgSel = q("package");
  const sizeSel = q("size");
  const addonsWrap = q("addonsWrap");
  const form = q("bookingForm");

  if (!pkgSel || !sizeSel || !addonsWrap || !form) return;

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

  const statusEl = q("bookingStatus");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (statusEl) {
      statusEl.textContent = "Creating checkout session…";
      statusEl.className = "notice";
    }

    const fd = new FormData(form);
    const payload = {
      customer_name: String(fd.get("customer_name") || "").trim(),
      customer_email: String(fd.get("customer_email") || "").trim(),
      customer_phone: String(fd.get("customer_phone") || "").trim(),
      address_line1: String(fd.get("address_line1") || "").trim(),
      city: String(fd.get("city") || "").trim(),
      postal_code: String(fd.get("postal_code") || "").trim(),
      service_area: String(fd.get("service_area") || "").trim(),
      service_date: String(fd.get("service_date") || "").trim(),
      start_slot: String(fd.get("start_slot") || "").trim(),
      duration_slots: Number(fd.get("duration_slots") || 1),
      package_code: String(fd.get("package") || "").trim(),
      vehicle_size: String(fd.get("size") || "").trim(),
      addons: fd.getAll("addons"),
      notes: String(fd.get("notes") || "").trim(),
      ack_driveway: fd.get("ack_driveway") === "on",
      ack_power_water: fd.get("ack_power_water") === "on",
      ack_bylaw: fd.get("ack_bylaw") === "on",
      ack_cancellation: fd.get("ack_cancellation") === "on"
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Could not start checkout");
      }

      if (!json?.checkout_url) {
        throw new Error("Missing Stripe checkout URL");
      }

      if (statusEl) {
        statusEl.textContent = "Redirecting to secure checkout…";
        statusEl.className = "notice ok";
      }

      location.href = json.checkout_url;
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err.message || "Checkout failed";
        statusEl.className = "notice err";
      }
    }
  });
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
    el.textContent = "";
    el.className = "notice";
    el.style.display = "none";
    return;
  }

  el.style.display = "block";
}

function wireContactBits() {
  document.querySelectorAll("[data-phone]").forEach((el) => (el.textContent = CONTACT.phone));
  document.querySelectorAll("[data-email]").forEach((el) => (el.textContent = CONTACT.email));
  document.querySelectorAll("[data-service-area]").forEach((el) => (el.textContent = CONTACT.serviceArea));
}

async function init() {
  applyBrandImages();
  wireContactBits();
  showCheckoutReturnStatus();

  if (q("homePackages")) await renderHomePage();
  if (q("packagesGrid")) await renderServicesPage();
  if (q("pricingPackages")) await renderPricingPage();
  if (q("bookingForm")) await renderBookingPage();
}

document.addEventListener("DOMContentLoaded", init);

export function setBrandImages() {
  applyBrandImages();
}

export function handleCheckoutReturn() {
  showCheckoutReturnStatus();
}
