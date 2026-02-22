// assets/site.js
import { ASSETS_BASE, CONTACT, PRICING, ADDONS, money, calcDepositCents } from "./config.js";

export function setBrandImages() {
  const logo = document.querySelector("[data-logo]");
  if (logo) logo.src = `${ASSETS_BASE}/brand/RosieDazzlerLogoOriginal3D.png`;

  const banner = document.querySelector("[data-banner]");
  if (banner) banner.src = `${ASSETS_BASE}/brand/RosieDazzlersBanner.png`;

  const reviews = document.querySelector("[data-reviews]");
  if (reviews) reviews.src = `${ASSETS_BASE}/brand/RosieReviews.png`;
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

// Home page: show success/cancel message after Stripe redirects back
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

// Pricing helpers
export function renderPricingCards(containerSelector, sizeKey) {
  const wrap = document.querySelector(containerSelector);
  if (!wrap) return;

  const size = sizeKey || "small";
  wrap.innerHTML = "";

  for (const [code, p] of Object.entries(PRICING)) {
    const cents = p[size];
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${p.label}</h3>
      <p>${p.subtitle}</p>
      <div class="price">${money(cents)} <span class="kicker">(${size.toUpperCase()})</span></div>
      <div class="kicker">Deposit: ${money(calcDepositCents(code))}</div>
      <div class="hr"></div>
      <a class="btn primary" href="/book.html?package=${encodeURIComponent(code)}&size=${encodeURIComponent(size)}">Book this</a>
    `;
    wrap.appendChild(div);
  }
}

// Booking page
export function initBookingForm() {
  const form = document.querySelector("#bookingForm");
  if (!form) return;

  // prefill from query
  const params = new URLSearchParams(location.search);
  const qpPackage = params.get("package");
  const qpSize = params.get("size");
  if (qpPackage && form.package_code) form.package_code.value = qpPackage;
  if (qpSize && form.vehicle_size) form.vehicle_size.value = qpSize;

  const priceBox = document.querySelector("#priceBox");
  const availBox = document.querySelector("#availBox");
  const submitBtn = document.querySelector("#submitBtn");

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
    if (!date) return;

    const r = await fetch(`/api/availability?date=${encodeURIComponent(date)}`);
    const j = await r.json();

    if (!availBox) return;

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

  // live updates
  form.addEventListener("change", () => {
    calcTotals();
  });
  form.service_date.addEventListener("change", () => {
    checkAvailability();
  });

  // initial
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

      // quick front-end gate for required checkboxes
      if (!payload.ack_driveway || !payload.ack_power_water || !payload.ack_bylaw || !payload.ack_cancellation) {
        throw new Error("Please confirm all required acknowledgements.");
      }

      // (Optional) check availability first
      const avail = await checkAvailability();
      if (avail && ((payload.duration_slots === 2 && (!avail.AM || !avail.PM)) || (payload.start_slot === "AM" && !avail.AM) || (payload.start_slot === "PM" && !avail.PM))) {
        throw new Error("Selected slot is not available. Please choose a different date/time.");
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Checkout failed.");
      }

      // redirect to Stripe
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
