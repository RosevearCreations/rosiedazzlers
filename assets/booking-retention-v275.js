// Build 275 — booking/retention convergence over the retained booking engine.
// This layer does not own availability. It derives shortcuts only from the
// canonical date pills already rendered by book.html after the booking engine resolves availability.
(function initBuild275BookingRetention() {
  const normalizedPath = String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(location.search);
  if (normalizedPath !== "/book" || ["1", "true", "yes"].includes(String(params.get("embed") || "").toLowerCase())) return;
  if (window.__ROSIE_BUILD275_BOOKING_RETENTION__) return;
  window.__ROSIE_BUILD275_BOOKING_RETENTION__ = true;

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  function ensureStyles() {
    if (qs("style[data-build275-booking-retention]")) return;
    const style = document.createElement("style");
    style.dataset.build275BookingRetention = "true";
    style.textContent = `
      .qb275__rebook{margin:10px 0;padding:11px;border:1px solid rgba(77,119,255,.26);border-radius:14px;background:rgba(77,119,255,.08)}
      .qb275__rebook strong{display:block}.qb275__rebook p{margin:4px 0 9px!important}.qb275__rebook-meta{font-size:.82rem;color:rgba(234,242,255,.72)}
      [data-qb-slot] strong{display:block}[data-qb-slot] span{display:block;font-size:.78rem;opacity:.78;margin-top:2px}
    `;
    document.head.appendChild(style);
  }

  function canonicalSlotCandidates(calendar) {
    const candidates = [];
    const dates = qsa(".date-pill.is-open,.date-pill.is-partial", calendar).filter((button) => !button.disabled);
    for (const source of dates) {
      const date = String(source.getAttribute("data-date-pill") || "").trim();
      const label = String(source.querySelector("strong")?.textContent || date).trim();
      const status = String(source.querySelector("span")?.textContent || "").trim();
      if (!date) continue;
      if (/\bAM open\b/i.test(status)) candidates.push({ source, date, slot: "AM", label });
      if (/\bPM open\b/i.test(status)) candidates.push({ source, date, slot: "PM", label });
      if (candidates.length >= 3) break;
    }
    return candidates.slice(0, 3);
  }

  function chooseCanonicalSlot(candidate) {
    if (!candidate?.source || !candidate.date || !candidate.slot) return;
    candidate.source.click();

    let attempts = 0;
    const finish = () => {
      attempts += 1;
      const selectedDate = String(qs("#service_date")?.value || "").trim();
      const slotButton = qs(`[data-slot="${candidate.slot}"]`);
      if (selectedDate === candidate.date && slotButton && !slotButton.disabled) {
        slotButton.click();
        try {
          window.dispatchEvent(new CustomEvent("rd:analytics", {
            detail: { event: "booking_quick_slot_shortcut", service_date: candidate.date, slot: candidate.slot }
          }));
        } catch {}
        return;
      }
      if (attempts < 40) setTimeout(finish, 50);
    };
    finish();
  }

  function renderNextAvailableSlots() {
    const calendar = qs("#availableDates");
    const wrap = qs("#qb274NextDays");
    if (!calendar || !wrap) return false;

    // Retained Build 274 source token: Next available days.
    wrap.dataset.build275SlotAuthority = "canonical-date-pill";
    const heading = wrap.querySelector("strong");
    const explanation = wrap.querySelector(".mini.muted");
    const host = wrap.querySelector(".qb274__day-buttons");
    if (!host) return false;

    if (heading) heading.textContent = "Next available slots";
    if (explanation) explanation.textContent = "These are the next real AM/PM openings from the same live availability calendar. Full-day remains available below whenever both halves are open.";

    const candidates = canonicalSlotCandidates(calendar);
    host.innerHTML = "";
    if (!candidates.length) {
      wrap.classList.remove("show");
      return true;
    }

    wrap.classList.add("show");
    candidates.forEach((candidate) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn ghost small";
      button.dataset.qbSlot = `${candidate.date}|${candidate.slot}`;
      button.innerHTML = `<strong>${candidate.label}</strong><span>${candidate.slot} half day</span>`;
      button.addEventListener("click", () => chooseCanonicalSlot(candidate));
      host.appendChild(button);
    });

    const another = document.createElement("button");
    another.type = "button";
    another.className = "btn ghost small";
    another.dataset.qbSlot = "choose-another";
    another.textContent = "Choose another date / full day";
    another.addEventListener("click", () => calendar.scrollIntoView({ behavior: "smooth", block: "center" }));
    host.appendChild(another);
    return true;
  }

  function normalizeFallbackUtilityCopy(root = document) {
    const stale = "Confirm hose/power availability, driveway slope, apartment/condo access, and any building rules before arrival.";
    const replacement = "Confirm a safe driveway/private work area, slope, parking, apartment/condo access and building rules before arrival. Rosie brings standard detailing water and power.";
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if ((node.nodeValue || "").includes(stale)) node.nodeValue = node.nodeValue.replaceAll(stale, replacement);
      node = walker.nextNode();
    }
  }

  function humanizePackageCode(code) {
    return String(code || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()).trim();
  }

  function pastRepeatableBooking(bookings) {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return (Array.isArray(bookings) ? bookings : []).find((row) => {
      const packageCode = String(row?.package_code || "").trim();
      const serviceDate = String(row?.service_date || "").slice(0, 10);
      const status = `${row?.status || ""} ${row?.job_status || ""}`.toLowerCase();
      return !!packageCode && /^\d{4}-\d{2}-\d{2}$/.test(serviceDate) && serviceDate < todayIso && !/cancel|refund|failed|declin|void/.test(status);
    }) || null;
  }

  function packageControl(packageCode) {
    return qsa("[data-package-suggest],[data-package]").find((button) =>
      String(button.getAttribute("data-package-suggest") || button.getAttribute("data-package") || "") === String(packageCode || "")
    ) || null;
  }

  function waitForPackageControl(packageCode, callback, attempt = 0) {
    const control = packageControl(packageCode);
    if (control) return callback(control);
    if (attempt < 30) setTimeout(() => waitForPackageControl(packageCode, callback, attempt + 1), 100);
  }

  function waitForGarageButtons(callback, attempt = 0) {
    const buttons = qsa("[data-garage-index]");
    if (buttons.length) return callback(buttons);
    if (attempt < 30) setTimeout(() => waitForGarageButtons(callback, attempt + 1), 100);
  }

  function applyPastBookingShortcut(booking, vehicleCount) {
    waitForPackageControl(booking.package_code, (control) => {
      control.click();
      waitForGarageButtons((garageButtons) => {
        if (vehicleCount === 1 && garageButtons.length === 1) {
          garageButtons[0].click();
          setTimeout(() => qs("#qb274NextDays")?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
        } else {
          qs("#garagePickerWrap")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      try {
        window.dispatchEvent(new CustomEvent("rd:analytics", {
          detail: { event: "booking_returning_rebook_prefill", package_code: booking.package_code, prior_service_date: booking.service_date || null, vehicle_count: vehicleCount }
        }));
      } catch {}
    });
  }

  function renderReturningCustomerShortcut(out) {
    if (!out?.authenticated || !Array.isArray(out.vehicles) || !out.vehicles.length || qs("[data-build275-rebook]")) return;
    const booking = pastRepeatableBooking(out.bookings);
    if (!booking) return;

    waitForPackageControl(booking.package_code, () => {
      if (qs("[data-build275-rebook]")) return;
      const account = qs(".qb274__account");
      const vehicleSection = qs("[data-qb274-vehicle]");
      const anchor = account || vehicleSection;
      if (!anchor) return;

      const card = document.createElement("div");
      card.className = "qb275__rebook";
      card.dataset.build275Rebook = "true";
      const packageLabel = humanizePackageCode(booking.package_code) || "Previous service";
      const vehicleInstruction = out.vehicles.length === 1
        ? "Your single saved Garage vehicle will also be loaded."
        : `You have ${out.vehicles.length} saved Garage vehicles, so choose the correct vehicle after reusing the package.`;
      card.innerHTML = `
        <strong>Returning customer — repeat a past booking</strong>
        <p>Reuse <b>${packageLabel}</b> from ${String(booking.service_date || "").slice(0, 10)} as a starting point. ${vehicleInstruction}</p>
        <div class="qb275__rebook-meta">This only prefills the current booking form. Current vehicle size, availability, add-ons, price and deposit rules still apply.</div>
        <button class="btn primary small" type="button" data-build275-rebook-action>Reuse this service</button>`;
      anchor.insertAdjacentElement("afterend", card);
      qs("[data-build275-rebook-action]", card)?.addEventListener("click", () => applyPastBookingShortcut(booking, out.vehicles.length));
    });
  }

  async function installReturningCustomerShortcut() {
    try {
      const response = await fetch("/api/client/dashboard", { credentials: "include", cache: "no-store" });
      const out = await response.json().catch(() => null);
      if (!response.ok || !out?.authenticated) return;
      renderReturningCustomerShortcut(out);
    } catch {
      // Optional returning-customer acceleration must never block anonymous booking.
    }
  }

  function install() {
    ensureStyles();
    const calendar = qs("#availableDates");
    if (!calendar || !renderNextAvailableSlots()) {
      setTimeout(install, 100);
      return;
    }

    normalizeFallbackUtilityCopy(document);
    installReturningCustomerShortcut();

    const calendarObserver = new MutationObserver(() => renderNextAvailableSlots());
    calendarObserver.observe(calendar, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "disabled"] });

    const serviceAreaRules = qs("#serviceAreaRules");
    if (serviceAreaRules) {
      const utilityObserver = new MutationObserver(() => normalizeFallbackUtilityCopy(serviceAreaRules));
      utilityObserver.observe(serviceAreaRules, { childList: true, subtree: true, characterData: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();