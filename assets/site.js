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

const HOVER_MEDIA = {
  // These files exist in your /packages directory (case + spacing matters in R2)
  exterior: "https://assets.rosiedazzlers.ca/packages/Exterior%20Detail.png",
  interior: "https://assets.rosiedazzlers.ca/packages/Interior%20Detail.png",
  size: "https://assets.rosiedazzlers.ca/packages/CarSizeChart.PNG"
};

const ADDON_MEDIA = {
  de_badging: "https://assets.rosiedazzlers.ca/packages/DeBadgingAddonService.png",
  de_ionizing_treatment: "https://assets.rosiedazzlers.ca/packages/De-Ionizing%20Vehicle%20Add%20on%20service.png",
  engine_cleaning: "https://assets.rosiedazzlers.ca/packages/Engine%20Cleaning%20add%20on%20service.png",
  external_ceramic_coating: "https://assets.rosiedazzlers.ca/packages/External%20Ceramic%20coating%20add%20on%20service.png",
  external_graphene_fine_finish: "https://assets.rosiedazzlers.ca/packages/External%20Graphene%20Fine%20finish%20add%20on%20service.png",
  external_wax: "https://assets.rosiedazzlers.ca/packages/External%20Wax%20add%20on%20service.png",
  vinyl_wrapping: "https://assets.rosiedazzlers.ca/packages/Vinyl%20Wrapping%20add%20on%20service.png",
  window_tinting: "https://assets.rosiedazzlers.ca/packages/Window%20Tinting%20add%20on%20service.png"
};

let _servicesData = null;

async function loadServicesData() {
  if (_servicesData) return _servicesData;
  const res = await fetch(`${DATA_URL}?v=20260301e`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${DATA_URL}`);
  _servicesData = await res.json();
  return _servicesData;
}

function money(cad) {
  const n = Number(cad || 0);
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

function openLightbox(title, src) {
  const existing = document.querySelector("#lightbox");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "lightbox";
  overlay.className = "lightbox";

  overlay.innerHTML = `
    <div class="lightbox-inner">
      <div class="lightbox-top">
        <div class="lightbox-title">${title || ""}</div>
        <button class="btn ghost" type="button" id="lbClose">Close</button>
      </div>
      <div class="lightbox-body">
        <img src="${src}" alt="${title || ""}" />
      </div>
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector("#lbClose")?.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
}

function chartButtons(data, selectorMap) {
  const charts = data.charts || [];
  const byName = Object.fromEntries(charts.map((c) => [c.filename, c]));

  const bind = (selector, name, title) => {
    const el = document.querySelector(selector);
    if (el && byName[name]) {
      el.addEventListener("click", () => openLightbox(title, byName[name].r2_url));
    }
  };

  if (selectorMap.price) bind(selectorMap.price, "CarPrice2025.PNG", "Vehicle Price Chart 2025");
  if (selectorMap.details) bind(selectorMap.details, "CarPriceDetails2025.PNG", "Package Service Details Chart");
  if (selectorMap.size) bind(selectorMap.size, "CarSizeChart.PNG", "Vehicle Size Chart");
}

function packagePrice(pkg, size) {
  const p = pkg?.prices_cad?.[size];
  return Number(p || 0);
}

function calcDeposit(pkg) {
  // Keep your rule: premium/basic = $50, others = $100
  const code = String(pkg?.code || "");
  return (code === "premium_wash" || code === "basic_detail") ? 50 : 100;
}

function packageImageForSize(pkg, size) {
  const map = pkg?.images_by_size || {};
  return map?.[size] || map?.small || null;
}

function buildMainCardGallery(pkg, size) {
  const gallery = [];
  const main = packageImageForSize(pkg, size);
  if (main) gallery.push(main);
  gallery.push(HOVER_MEDIA.exterior, HOVER_MEDIA.interior, HOVER_MEDIA.size);
  return [...new Set(gallery.filter(Boolean))];
}

function attachHoverCarousel(root) {
  const wraps = root.querySelectorAll("[data-carousel]");
  wraps.forEach((wrap) => {
    const imgs = [...wrap.querySelectorAll("img")];
    if (imgs.length <= 1) return;

    // If any image errors, hide that image but keep carousel functional
    imgs.forEach((img) => {
      img.addEventListener("error", () => {
        img.style.display = "none";
      }, { once: true });
    });

    // Rebuild list with only visible images when we start hover
    let current = 0;
    let timer = null;

    const visibleImgs = () => imgs.filter((im) => im.style.display !== "none");

    const show = (idx) => {
      const vis = visibleImgs();
      if (!vis.length) return;
      const safeIdx = ((idx % vis.length) + vis.length) % vis.length;
      vis.forEach((img, i) => img.classList.toggle("active", i === safeIdx));
    };

    show(0);

    wrap.addEventListener("mouseenter", () => {
      if (timer) return;

      const vis = visibleImgs();
      if (vis.length <= 1) return;

      timer = setInterval(() => {
        const v = visibleImgs();
        if (!v.length) return;
        current = (current + 1) % v.length;
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

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      ${mediaHtml}
      <h3>${pkg.name}</h3>
      <p>${pkg.subtitle || ""}</p>
      <div class="price">${money(price)} <span class="kicker">(${size.toUpperCase()})</span></div>
      <div class="kicker">Deposit: ${money(deposit)}</div>
      <div class="hr"></div>
      <ul class="list">${included}</ul>
      <div class="hr"></div>
      ${notes}
      <div class="hr"></div>
      <a class="btn primary" href="/book?package=${encodeURIComponent(pkg.code)}&size=${encodeURIComponent(size)}">Book this</a>
    `;
    cardsEl.appendChild(div);
  }

  attachHoverCarousel(cardsEl);
}

function renderCompareTable(container, data) {
  if (!container) return;
  const packages = data.packages || [];
  const matrix = data.service_matrix || [];

  const head = packages.map((p) => `<th>${p.name}</th>`).join("");

  const rows = matrix.map((row) => {
    const tds = packages.map((p) => {
      const has = row.included_in?.[p.code] === true;
      return `<td>${has ? '<span class="check">✓</span>' : '<span class="nope">—</span>'}</td>`;
    }).join("");

    return `
      <tr>
        <td>
          <strong>${row.service}</strong>
          ${row.conditional_note ? `<span class="note">${row.conditional_note}</span>` : ""}
        </td>
        ${tds}
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="compare-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Service</th>
            ${head}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function addonPrice(addon, size) {
  if (addon?.prices_cad && addon.prices_cad[size] != null) return Number(addon.prices_cad[size] || 0);
  if (addon?.price_cad != null) return Number(addon.price_cad || 0);
  return 0;
}

function addonImage(addon) {
  // Use explicit mapping when available, otherwise none (keeps UI clean)
  return ADDON_MEDIA[addon.code] || null;
}

function renderAddons(cardsEl, data, size) {
  if (!cardsEl) return;
  cardsEl.innerHTML = "";

  for (const a of data.addons || []) {
    const img = addonImage(a);
    const price = addonPrice(a, size);

    const tags = [
      a.quote_required ? `<span class="badge">Quote</span>` : `<span class="badge">${money(price)}</span>`,
    ].join("");

    const media = img
      ? `<div class="service-media"><img loading="lazy" src="${img}" alt="${a.name}" onerror="this.style.display='none'"></div>`
      : "";

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      ${media}
      <h3>${a.name}</h3>
      <p>${a.quote_required ? "Quote required (pricing depends on vehicle condition / scope)." : "Add-on service."}</p>
      <div class="row" style="gap:10px;flex-wrap:wrap">${tags}</div>
    `;
    cardsEl.appendChild(div);
  }
}

export function setBrandImages() {
  document.querySelectorAll("[data-logo]").forEach((img) => img.src = BRAND.logo);
  document.querySelectorAll("[data-banner]").forEach((img) => img.src = BRAND.banner);
  document.querySelectorAll("[data-reviews]").forEach((img) => img.src = BRAND.reviews);
}

export function handleCheckoutReturn() {
  const params = new URLSearchParams(location.search);
  const statusBox = document.querySelector("[data-checkout-status]");
  if (!statusBox) return;

  const checkout = params.get("checkout");
  if (!checkout) return;

  if (checkout === "success") {
    statusBox.className = "notice ok";
    statusBox.innerHTML = `✅ Booking reserved. You will receive a confirmation email soon.`;
  } else if (checkout === "cancel") {
    statusBox.className = "notice warn";
    statusBox.innerHTML = `Checkout cancelled. Your booking time is not reserved until the deposit is paid.`;
  } else {
    statusBox.className = "notice";
    statusBox.innerHTML = `Status: ${checkout}`;
  }
}

export async function initServicesPage() {
  const data = await loadServicesData();

  const sizeSel = document.querySelector("#size");
  const cardsEl = document.querySelector("#packageCards");
  const compareEl = document.querySelector("#compareTable");
  const addonsEl = document.querySelector("#addonCards");

  const render = () => {
    const size = sizeSel?.value || "small";
    renderMainPackages(cardsEl, data, size);
    renderCompareTable(compareEl, data);
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

export async function initPricingPage() {
  const data = await loadServicesData();

  const sizeSel = document.querySelector("#size");
  const cardsEl = document.querySelector("#pricingCards");
  const addonsEl = document.querySelector("#pricingAddons");

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

/* =======================
   Booking helpers (existing)
   ======================= */

function currentPackageCode(form) {
  return form?.package_code?.value || "";
}
function currentSize(form) {
  return form?.vehicle_size?.value || "small";
}
function selectedAddonCodes(form) {
  return [...(form?.querySelectorAll('input[name="addon_codes"]:checked') || [])].map((el) => el.value);
}
function getPackageByCode(data, code) {
  return (data.packages || []).find((p) => p.code === code);
}

function calcBookingTotals(form, data) {
  const pkg = getPackageByCode(data, currentPackageCode(form));
  const size = currentSize(form);

  const base = packagePrice(pkg, size);
  const deposit = calcDeposit(pkg);

  const addons = data.addons || [];
  const selected = selectedAddonCodes(form);

  const pricedAddons = selected.reduce((sum, code) => {
    const a = addons.find((x) => x.code === code);
    if (!a || a.quote_required) return sum;
    return sum + addonPrice(a, size);
  }, 0);

  const quoteAddons = selected
    .map((code) => addons.find((x) => x.code === code))
    .filter((a) => a && a.quote_required)
    .map((a) => a.name);

  return {
    base,
    deposit,
    pricedAddons,
    total: base + pricedAddons,
    quoteAddons
  };
}

function renderPackageSummary(el, pkg) {
  if (!el || !pkg) return;
  el.innerHTML = `
    <div class="kicker">Selected package</div>
    <div style="font-size:1.2rem;font-weight:800">${pkg.name}</div>
    <div class="kicker">${pkg.subtitle || ""}</div>
  `;
}

function renderAddonPicker(el, data, size, selected = []) {
  if (!el) return;
  const addons = data.addons || [];

  el.innerHTML = addons.map((a) => {
    const checked = selected.includes(a.code) ? "checked" : "";
    const badge = a.quote_required ? `<span class="badge">Quote</span>` : `<span class="badge">${money(addonPrice(a, size))}</span>`;
    return `
      <label class="checkbox">
        <input type="checkbox" name="addon_codes" value="${a.code}" ${checked}>
        ${a.name} ${badge}
      </label>
    `;
  }).join("");
}

async function checkAvailability(date) {
  const res = await fetch(`/api/availability?date=${encodeURIComponent(date)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function initBookingPage() {
  const data = await loadServicesData();

  const form = document.querySelector("#bookingForm");
  if (!form) return;

  const packageSummary = document.querySelector("#packageSummary");
  const addonPicker = document.querySelector("#addonPicker");
  const availBox = document.querySelector("#availBox");
  const priceBox = document.querySelector("#priceBox");
  const submitBtn = document.querySelector("#submitBtn");

  const params = new URLSearchParams(location.search);
  const qpPackage = params.get("package");
  const qpSize = params.get("size");

  if (form.package_code && !form.package_code.dataset.built) {
    form.package_code.innerHTML = (data.packages || [])
      .map((p) => `<option value="${p.code}">${p.name}</option>`)
      .join("");
    form.package_code.dataset.built = "1";
  }

  if (qpPackage && form.package_code) form.package_code.value = qpPackage;
  if (qpSize && form.vehicle_size) form.vehicle_size.value = qpSize;

  const redraw = async (checkDate = false) => {
    const previouslySelected = selectedAddonCodes(form);
    const size = currentSize(form);
    const pkg = getPackageByCode(data, currentPackageCode(form));

    renderPackageSummary(packageSummary, pkg);
    renderAddonPicker(addonPicker, data, size, previouslySelected);

    const totals = calcBookingTotals(form, data);

    priceBox.className = "notice";
    priceBox.innerHTML = `
      <div><strong>Estimate</strong></div>
      <div>Base: ${money(totals.base)} · Priced add-ons: ${money(totals.pricedAddons)} · <strong>Total: ${money(totals.total)}</strong></div>
      <div class="kicker">Deposit due now: <strong>${money(totals.deposit)}</strong></div>
      ${totals.quoteAddons.length ? `<div class="kicker">Quote add-ons selected: ${totals.quoteAddons.join(", ")} (not included in online total)</div>` : ""}
    `;

    if (checkDate && form.service_date?.value) {
      const avail = await checkAvailability(form.service_date.value);
      if (avail?.blocked) {
        availBox.className = "notice bad";
        availBox.innerHTML = `This date is blocked: ${avail.reason || "Blocked"}`;
      } else if (avail) {
        availBox.className = "notice ok";
        availBox.innerHTML = `
          <strong>Availability for ${avail.date}</strong><br>
          AM: ${avail.AM ? "✅ Available" : "❌ Not available"} ·
          PM: ${avail.PM ? "✅ Available" : "❌ Not available"}
          <div class="kicker">Pending holds expire after ~${avail.hold_minutes || 30} minutes.</div>
        `;
      }
    }
  };

  await redraw(false);

  form.package_code?.addEventListener("change", () => redraw(false));
  form.vehicle_size?.addEventListener("change", () => redraw(false));
  addonPicker.addEventListener("change", () => redraw(false));
  form.service_date?.addEventListener("change", () => redraw(true));

  chartButtons(data, {
    price: "[data-open-price]",
    details: "[data-open-details]",
    size: "[data-open-size]"
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating checkout…";

    try {
      const totals = calcBookingTotals(form, data);

      const payload = {
        service_date: form.service_date.value,
        start_slot: form.start_slot.value,
        duration_slots: Number(form.duration_slots.value),
        service_area: form.service_area.value,

        package_code: form.package_code.value,
        vehicle_size: form.vehicle_size.value,

        customer_name: form.customer_name.value,
        customer_email: form.customer_email.value,
        customer_phone: form.customer_phone.value || null,

        address_line1: form.address_line1.value,
        city: form.city.value || null,
        postal_code: form.postal_code.value || null,

        addon_codes: selectedAddonCodes(form),

        ack_driveway: form.ack_driveway.checked,
        ack_power_water: form.ack_power_water.checked,
        ack_bylaw: form.ack_bylaw.checked,
        ack_cancellation: form.ack_cancellation.checked,

        // Optional codes (if present in your form)
        gift_code: form.gift_code ? form.gift_code.value : null,
        promo_code: form.promo_code ? form.promo_code.value : null,

        // Optional vehicle fields (if present in your form)
        car_year: form.car_year ? form.car_year.value : null,
        car_make: form.car_make ? form.car_make.value : null,
        car_model: form.car_model ? form.car_model.value : null,
        car_plate: form.car_plate ? form.car_plate.value : null,
        car_photo_url: form.car_photo_url ? form.car_photo_url.value : null,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const out = await res.json().catch(() => null);
      if (!res.ok || !out?.checkout_url) {
        throw new Error(out?.error || "Checkout failed");
      }

      location.href = out.checkout_url;
    } catch (err) {
      alert(String(err?.message || err));
      submitBtn.disabled = false;
      submitBtn.textContent = "Proceed to deposit checkout";
    }
  });
}
