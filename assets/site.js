// assets/site.js
import {
  ASSETS_BASE, PATHS, CONTACT,
  PRICING, PACKAGE_MEDIA, CHARTS,
  ADDONS, money, calcDepositCents, assetUrl
} from "./config.js";

/* ---------- basics ---------- */

export function setBrandImages() {
  const logo = document.querySelector("[data-logo]");
  if (logo) logo.src = assetUrl(PATHS.brand, "RosieDazzlerLogoOriginal3D.png");

  const banner = document.querySelector("[data-banner]");
  if (banner) banner.src = assetUrl(PATHS.brand, "RosieDazzlersBanner.png");

  const reviews = document.querySelector("[data-reviews]");
  if (reviews) reviews.src = assetUrl(PATHS.brand, "RosieReviews.png");
}

export function setFooter() {
  const el = document.querySelector("[data-footer]");
  if (!el) return;
  el.innerHTML = `
    <div><strong>Rosie Dazzlers Mobile Auto Detailing</strong> — ${CONTACT.serviceArea}</div>
    <div>Phone: <a href="tel:${CONTACT.phone}">${CONTACT.phone}</a> · Email: <a href="mailto:${CONTACT.email}">${CONTACT.email}</a></div>
    <div class="kicker">Mobile service: customer provides driveway + power + water (or additional charges apply).</div>
  `;
}

export function handleCheckoutReturn() {
  const params = new URLSearchParams(location.search);
  const state = params.get("checkout");
  const bid = params.get("bid");

  const box = document.querySelector("[data-checkout-status]");
  if (!box || !state) return;

  if (state === "success") {
    box.className = "notice ok";
    box.innerHTML = `<strong>Deposit received.</strong> Booking ID: <code>${bid || ""}</code><br/>We’ll confirm details by email.`;
  } else if (state === "cancel") {
    box.className = "notice warn";
    box.innerHTML = `<strong>Checkout cancelled.</strong> Booking ID: <code>${bid || ""}</code><br/>No deposit was taken. You can try again.`;
  }
}

/* ---------- lightbox (charts, size guide, etc) ---------- */

function ensureLightbox() {
  let lb = document.querySelector("#lightbox");
  if (lb) return lb;

  lb = document.createElement("div");
  lb.id = "lightbox";
  lb.className = "lightbox";
  lb.innerHTML = `
    <div class="lightbox-inner">
      <div class="lightbox-top">
        <div class="title" id="lbTitle"></div>
        <button class="btn small ghost" id="lbClose" type="button">Close</button>
      </div>
      <img id="lbImg" alt="" />
      <div class="kicker" id="lbHint">Tip: right-click → open image in new tab</div>
    </div>
  `;
  document.body.appendChild(lb);

  const close = () => lb.classList.remove("open");
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  lb.querySelector("#lbClose").addEventListener("click", close);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  return lb;
}

export function openLightbox(title, src) {
  const lb = ensureLightbox();
  lb.querySelector("#lbTitle").textContent = title || "";
  const img = lb.querySelector("#lbImg");
  img.src = src;
  img.alt = title || "";
  lb.classList.add("open");
}

/* ---------- package cards (pricing + images) ---------- */

export function renderPackageCards(containerSelector, sizeKey) {
  const wrap = document.querySelector(containerSelector);
  if (!wrap) return;

  const size = sizeKey || "small";
  wrap.innerHTML = "";

  for (const [code, p] of Object.entries(PRICING)) {
    const cents = p[size];
    const imgFile = PACKAGE_MEDIA?.[code]?.[size];
    const imgUrl = imgFile ? assetUrl(PATHS.packages, imgFile) : "";

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      ${imgUrl ? `<img class="img" loading="lazy" src="${imgUrl}" alt="${p.label} (${size})" onerror="this.style.display='none'">` : ""}
      <h3>${p.label}</h3>
      <p>${p.subtitle}</p>
      <div class="price">${money(cents)} <span class="kicker">(${size.toUpperCase()})</span></div>
      <div class="kicker">Deposit: ${money(calcDepositCents(code))}</div>
      <div class="hr"></div>
      <a class="btn primary" href="/book?package=${encodeURIComponent(code)}&size=${encodeURIComponent(size)}">Book this</a>
    `;
    wrap.appendChild(div);
  }
}

/* ---------- booking page ---------- */

export function initBookingForm() {
  const form = document.querySelector("#bookingForm");
  if (!form) return;

  // Pre-fill from clean URLs query
  const params = new URLSearchParams(location.search);
  const qpPackage = params.get("package");
  const qpSize = params.get("size");
  if (qpPackage && form.package_code) form.package_code.value = qpPackage;
  if (qpSize && form.vehicle_size) form.vehicle_size.value = qpSize;

  const priceBox = document.querySelector("#priceBox");
  const availBox = document.querySelector("#availBox");
  const submitBtn = document.querySelector("#submitBtn");

  const chartBtns = {
    price: document.querySelector("[data-open-price]"),
    includes: document.querySelector("[data-open-includes]"),
    size: document.querySelector("[data-open-size]"),
  };

  if (chartBtns.price) chartBtns.price.addEventListener("click", () =>
    openLightbox("Price Chart", assetUrl(PATHS.packages, CHARTS.price))
  );
  if (chartBtns.includes) chartBtns.includes.addEventListener("click", () =>
    openLightbox("What’s Included", assetUrl(PATHS.packages, CHARTS.includes))
  );
  if (chartBtns.size) chartBtns.size.addEventListener("click", () =>
    openLightbox("Vehicle Size Chart", assetUrl(PATHS.packages, CHARTS.size))
  );

  function calcTotals() {
    const packageCode = form.package_code.value;
    const size = form.vehicle_size.value;

    const base = PRICING?.[packageCode]?.[size] || 0;
    let addons = 0;
    const selected = [...form.querySelectorAll("input[name='addon_codes']:checked")].map(x => x.value);
    selected.forEach(code => { if (ADDONS[code]) addons += ADDONS[code].cents; });

    const total = base + addons;
    const deposit = calcDepositCents(packageCode);

    if (priceBox) {
      priceBox.className = "notice";
      priceBox.innerHTML = `
        <div><strong>Estimate</strong></div>
        <div>Base: ${money(base)} · Add-ons: ${money(addons)} · <strong>Total: ${money(total)}</strong></div>
        <div class="kicker">Deposit due now: <strong>${money(deposit)}</strong> (applied to your service)</div>
      `;
    }
    return { total, deposit, selected };
  }

  async function checkAvailability() {
    const date = form.service_date.value;
    if (!date) return null;

    const r = await fetch(`/api/availability?date=${encodeURIComponent(date)}`);
    const j = await r.json();

    if (!availBox) return j;

    if (j.blocked) {
      availBox.className = "notice bad";
      availBox.innerHTML = `This date is blocked: ${j.reason || "Blocked"}`;
      return j;
    }

    availBox.className = "notice ok";
    availBox.innerHTML = `
      <strong>Availability for ${j.date}</strong><br/>
      AM: ${j.AM ? "✅ Available" : "❌ Not available"} ·
      PM: ${j.PM ? "✅ Available" : "❌ Not available"}
      <div class="kicker">Pending holds expire after ~${j.hold_minutes || 30} minutes.</div>
    `;
    return j;
  }

  form.addEventListener("change", () => { calcTotals(); });
  form.service_date.addEventListener("change", () => { checkAvailability(); });

  calcTotals();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating checkout…";

    try {
      const totals = calcTotals();
      const payload = {
        service_date: form.service_date.value,
        start_slot: form.start_slot.value,
        duration_slots: Number(form.duration_slots.value),
        service_area: form.service_area.value,

        package_code: form.package_code.value,
        vehicle_size: form.vehicle_size.value,

        customer_name: form.customer_name.value,
        customer_email: form.customer_email.value,
        customer_phone: form.customer_phone.value,

        address_line1: form.address_line1.value,
        city: form.city.value,
        postal_code: form.postal_code.value,

        addon_codes: totals.selected,

        ack_driveway: form.ack_driveway.checked,
        ack_power_water: form.ack_power_water.checked,
        ack_bylaw: form.ack_bylaw.checked,
        ack_cancellation: form.ack_cancellation.checked,
      };

      if (!payload.ack_driveway || !payload.ack_power_water || !payload.ack_bylaw || !payload.ack_cancellation) {
        throw new Error("Please confirm all required acknowledgements.");
      }

      const avail = await checkAvailability();
      if (avail) {
        const needFull = payload.duration_slots === 2;
        const wantsAM = payload.start_slot === "AM";
        const wantsPM = payload.start_slot === "PM";
        if (needFull && (!avail.AM || !avail.PM)) throw new Error("Full day not available. Choose another date.");
        if (wantsAM && !avail.AM) throw new Error("AM not available. Choose another date.");
        if (wantsPM && !avail.PM) throw new Error("PM not available. Choose another date.");
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Checkout failed.");

      window.location.href = json.checkout_url;
    } catch (err) {
      if (priceBox) {
        priceBox.className = "notice bad";
        priceBox.innerHTML = `<strong>Error:</strong> ${String(err.message || err)}`;
      }
      submitBtn.disabled = false;
      submitBtn.textContent = "Pay deposit & book";
    }
  });
}

/* ---------- gear/consumables pages ---------- */

function titleFromPath(path) {
  const base = (path || "").split("/").pop() || "";
  return base
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function amazonSearchUrl(query) {
  return `https://www.amazon.ca/s?k=${encodeURIComponent(query)}`;
}

async function fetchJsonSafe(url) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function initInventoryPage(mode /* 'gear' | 'consumables' */) {
  const listEl = document.querySelector("#invList");
  const statusEl = document.querySelector("#invStatus");
  const catEl = document.querySelector("#invCategory");
  const qEl = document.querySelector("#invSearch");

  if (!listEl || !statusEl || !catEl || !qEl) return;

  statusEl.textContent = "Loading…";

  // These two JSON files must exist in your repo:
  // /data/rosie_products_catalog.json  (from earlier)
  // /data/systems_catalog.json         (from Systems.zip)
  //
  // If they don’t exist yet, the page will show an instruction.
  const products = await fetchJsonSafe("/data/rosie_products_catalog.json");
  const systems = await fetchJsonSafe("/data/systems_catalog.json");

  if (!products && !systems) {
    statusEl.className = "notice bad";
    statusEl.innerHTML = `
      <strong>Missing data files.</strong><br/>
      Add these to your repo:
      <ul>
        <li><code>data/rosie_products_catalog.json</code></li>
        <li><code>data/systems_catalog.json</code></li>
      </ul>
    `;
    return;
  }

  let items = [];

  if (Array.isArray(products)) {
    for (const p of products) {
      const type = p.type; // 'gear' or 'consumable'
      if (mode === "gear" && type !== "gear") continue;
      if (mode === "consumables" && type !== "consumable") continue;

      const img = assetUrl(PATHS.products, p.sanitized);
      const title = titleFromPath(p.original || p.sanitized);
      const category = p.category || "other";
      const query = [p.brand, title].filter(Boolean).join(" ");
      items.push({
        source: "products",
        title,
        category,
        img,
        amazon: amazonSearchUrl(query || title),
      });
    }
  }

  // Systems are always gear
  if (mode === "gear" && Array.isArray(systems)) {
    for (const s of systems) {
      const img = assetUrl(PATHS.systems, s.path);
      const title = titleFromPath(s.path);
      const category = s.category || "systems_other";
      items.push({
        source: "systems",
        title,
        category,
        img,
        amazon: amazonSearchUrl(title),
      });
    }
  }

  // Build category dropdown
  const categories = Array.from(new Set(items.map(i => i.category))).sort();
  catEl.innerHTML = `<option value="all">All categories</option>` + categories.map(c => `<option value="${c}">${c}</option>`).join("");

  statusEl.className = "notice ok";
  statusEl.innerHTML = `<strong>Loaded:</strong> ${items.length} items · Amazon links are search links (you can replace with direct product URLs later).`;

  function render() {
    const cat = catEl.value;
    const q = qEl.value.trim().toLowerCase();

    const filtered = items.filter(i => {
      if (cat !== "all" && i.category !== cat) return false;
      if (q && !i.title.toLowerCase().includes(q) && !i.category.toLowerCase().includes(q)) return false;
      return true;
    });

    listEl.innerHTML = "";

    for (const i of filtered) {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <img class="img" loading="lazy" src="${i.img}" alt="${i.title}" onerror="this.style.display='none'">
        <h3>${i.title}</h3>
        <p class="kicker">${i.category}</p>
        <div class="hr"></div>
        <a class="btn primary" href="${i.amazon}" target="_blank" rel="noopener">Amazon link</a>
      `;
      listEl.appendChild(div);
    }

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "notice warn";
      empty.textContent = "No matches. Try a different category or search term.";
      listEl.appendChild(empty);
    }
  }

  catEl.addEventListener("change", render);
  qEl.addEventListener("input", render);
  render();
}
