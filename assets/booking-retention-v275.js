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

  function install() {
    const calendar = qs("#availableDates");
    if (!calendar || !renderNextAvailableSlots()) {
      setTimeout(install, 100);
      return;
    }

    normalizeFallbackUtilityCopy(document);
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