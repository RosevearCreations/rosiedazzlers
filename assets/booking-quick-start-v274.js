// Build 274 — mobile-first Quick Book presentation layer.
// This file does not own pricing, availability, booking, checkout, or conflict rules.
// It reorganizes the existing /book UI and maps simple customer needs into the existing condition helper.
(function initBuild274QuickBook() {
  const normalizedPath = String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(location.search);
  if (normalizedPath !== "/book" || ["1", "true", "yes"].includes(String(params.get("embed") || "").toLowerCase())) return;
  if (window.__ROSIE_BUILD274_QUICK_BOOK__) return;
  window.__ROSIE_BUILD274_QUICK_BOOK__ = true;

  const NEEDS = [
    { key: "clean", label: "Just needs a clean", note: "Maintained exterior wash and tidy-up.", flags: ["maintained_exterior"] },
    { key: "interior", label: "Interior needs attention", note: "Dust, crumbs, mats and a maintained cabin.", flags: ["maintained_interior"] },
    { key: "deep_interior", label: "Pet hair / stains / road salt", note: "Deeper interior work; photos can help us price fairly.", flags: ["pet_hair", "salt_stains", "stains_shampoo"], photo: true },
    { key: "full_reset", label: "Full inside/outside reset", note: "Best all-around reset for a family vehicle or overdue detail.", flags: ["full_reset"] },
    { key: "paint", label: "Paint / scratches / shine", note: "Paint condition, polishing and protection review.", flags: ["paint_swirls", "protection"], photo: true },
    { key: "headlights", label: "Cloudy headlights", note: "Condition-based headlight restoration review.", flags: ["headlights"], photo: true },
    { key: "spill", label: "Something spilled / got wet / odour", note: "Quote-first interior recovery. Photos are strongly recommended.", flags: ["odor", "stains_shampoo", "photo_quote"], photo: true },
    { key: "presale", label: "Pre-sale / lease return", note: "A sale-ready inside/outside presentation reset.", flags: ["full_reset"], noteText: "Quick Book use case: pre-sale / lease-return detail. Please review presentation, interior, paint, headlights and other sale-readiness needs." },
    { key: "fleet", label: "Work truck / fleet", note: "Commercial or multiple-vehicle work should be reviewed for access, timing and recurring options.", flags: ["work_truck", "photo_quote"], photo: true },
    { key: "unsure", label: "Not sure — recommend one", note: "Start with the safest all-around recommendation and adjust before checkout.", flags: ["full_reset"] }
  ];

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

  function qs(selector, root = document) { return root.querySelector(selector); }
  function qsa(selector, root = document) { return [...root.querySelectorAll(selector)]; }

  function injectStyles() {
    if (document.querySelector("style[data-build274-quick-book]")) return;
    const style = document.createElement("style");
    style.dataset.build274QuickBook = "true";
    style.textContent = `
      .qb274{margin-top:14px;padding:14px;border:1px solid rgba(77,119,255,.30);border-radius:20px;background:linear-gradient(180deg,rgba(77,119,255,.10),rgba(255,255,255,.035))}
      .qb274__progress{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}
      .qb274__progress span{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.07);font-size:.82rem;font-weight:800}
      .qb274__progress b{display:grid;place-items:center;width:1.35rem;height:1.35rem;border-radius:50%;background:rgba(77,119,255,.28)}
      .qb274__section{margin-top:14px}
      .qb274__section h3{margin:0 0 5px;font-size:1.02rem}
      .qb274__section p{margin:0;color:rgba(234,242,255,.76);line-height:1.45}
      .qb274__needs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}
      .qb274__need{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;min-height:84px;padding:11px;border:1px solid rgba(255,255,255,.12);border-radius:15px;background:rgba(255,255,255,.055);color:#f8fafc;cursor:pointer}
      .qb274__need strong{font-size:.95rem}.qb274__need span{font-size:.82rem;color:rgba(234,242,255,.72);line-height:1.35}
      .qb274__need:hover,.qb274__need:focus-visible{outline:2px solid rgba(109,168,255,.55);outline-offset:1px}
      .qb274__need.is-active{border-color:rgba(36,195,107,.55);background:rgba(36,195,107,.13);outline:2px solid rgba(36,195,107,.30)}
      .qb274__selected{display:none;margin-top:9px;padding:10px 11px;border-radius:13px;background:rgba(36,195,107,.10);border:1px solid rgba(36,195,107,.25)}
      .qb274__selected.show{display:block}
      .qb274__vehicle-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}
      .qb274__vehicle-grid>div{min-width:0}
      .qb274__vehicle-grid input,.qb274__vehicle-grid select{width:100%}
      .qb274__size-note{font-size:.78rem;color:rgba(234,242,255,.68);margin-top:4px}
      .qb274__advanced{margin-top:10px;border:1px solid rgba(255,255,255,.10);border-radius:14px;background:rgba(255,255,255,.025);padding:9px 11px}
      .qb274__advanced summary{cursor:pointer;font-weight:800}
      .qb274__advanced-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
      .qb274__appointment-heading{margin:16px 0 8px;padding-top:14px;border-top:1px solid rgba(255,255,255,.09)}
      .qb274__appointment-heading h3{margin:0 0 4px}
      .qb274__days{display:none;margin:10px 0 4px;padding:10px;border:1px solid rgba(36,195,107,.22);border-radius:14px;background:rgba(36,195,107,.07)}
      .qb274__days.show{display:block}.qb274__day-buttons{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}
      .qb274__day-buttons button{flex:1 1 150px;text-align:left}
      .qb274__legacy-vehicle-heading{display:none!important}
      @media(max-width:820px){
        .qb274__vehicle-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .qb274__needs{grid-template-columns:1fr}
      }
      @media(max-width:520px){
        .qb274{padding:12px;margin-left:-2px;margin-right:-2px}
        .qb274__vehicle-grid,.qb274__advanced-grid{grid-template-columns:1fr}
        .qb274__need{min-height:68px}
      }
    `;
    document.head.appendChild(style);
  }

  function addNote(text) {
    if (!text) return;
    const notes = qs("#special_notes");
    if (!notes) return;
    const current = notes.value.trim();
    if (current.includes(text)) return;
    notes.value = current ? `${current}\n\n${text}` : text;
    notes.dispatchEvent(new Event("input", { bubbles: true }));
    notes.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function clearConditionFlags() {
    qsa("[data-condition-flag]").forEach((input) => {
      input.checked = false;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function scheduleRecommendation(choiceKey) {
    const packageCards = qs("#packageCards");
    const recommend = qs("#conditionRecommendBtn");
    if (!packageCards || !recommend) return;

    const tryApply = () => {
      if (!packageCards.children.length) return false;
      if (packageCards.dataset.qb274Applied === choiceKey) return true;
      recommend.click();
      packageCards.dataset.qb274Applied = choiceKey;
      return true;
    };

    if (tryApply()) return;
    const observer = new MutationObserver(() => {
      if (tryApply()) observer.disconnect();
    });
    observer.observe(packageCards, { childList: true, subtree: false });
  }

  function applyNeed(choice, panel) {
    clearConditionFlags();
    for (const flag of choice.flags) {
      const input = qs(`[data-condition-flag="${CSS.escape(flag)}"]`);
      if (!input) continue;
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (choice.photo) {
      const photo = qs("#photo_estimate_requested");
      if (photo) {
        photo.checked = true;
        photo.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    if (choice.noteText) addNote(choice.noteText);

    panel.dataset.quickNeed = choice.key;
    qsa("[data-qb274-need]", panel).forEach((button) => {
      const active = button.dataset.qb274Need === choice.key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const output = qs("[data-qb274-selected]", panel);
    if (output) {
      output.classList.add("show");
      output.innerHTML = `<strong>Rosie will start from:</strong> ${esc(choice.label)}<br><span>${esc(choice.note)} You can change the recommendation before checkout.</span>`;
    }

    scheduleRecommendation(choice.key);
    try {
      window.dispatchEvent(new CustomEvent("rd:analytics", { detail: { event: "booking_quick_need_pick", need: choice.key } }));
    } catch {}

    const year = qs("#veh_year");
    if (year && window.innerWidth < 820) {
      year.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function moveField(id, mount) {
    const field = qs(`#${id}`);
    if (!field) return null;
    const parent = field.closest("div");
    if (!parent || parent === mount || mount.contains(parent)) return null;
    mount.appendChild(parent);
    return parent;
  }

  function cleanupEmptyLegacyGrids(step1) {
    qsa(".grid2,.grid3", step1).forEach((grid) => {
      const meaningful = [...grid.children].some((child) => child.querySelector?.("input,select,textarea,button,a"));
      if (!meaningful) grid.remove();
    });
  }

  function buildQuickPanel(step1) {
    if (qs("#build274QuickBook", step1)) return qs("#build274QuickBook", step1);

    const panel = document.createElement("div");
    panel.id = "build274QuickBook";
    panel.className = "qb274";
    panel.innerHTML = `
      <div class="qb274__progress" aria-label="Quick booking order">
        <span><b>1</b> What you need</span>
        <span><b>2</b> Your vehicle</span>
        <span><b>3</b> Where & when</span>
      </div>
      <div class="qb274__section">
        <h3>What does your vehicle need?</h3>
        <p>Choose the closest situation. Rosie uses this to recommend the right starting service instead of making you decode every package first.</p>
        <div class="qb274__needs">
          ${NEEDS.map((item) => `<button class="qb274__need" type="button" data-qb274-need="${esc(item.key)}" aria-pressed="false"><strong>${esc(item.label)}</strong><span>${esc(item.note)}</span></button>`).join("")}
        </div>
        <div class="qb274__selected" data-qb274-selected aria-live="polite"></div>
      </div>
      <div class="qb274__section" data-qb274-vehicle>
        <h3>What do you drive?</h3>
        <p>Year, make and model are the important part. Rosie will suggest the vehicle size from the catalogue when it recognizes the model; you can review it before continuing.</p>
        <div data-qb274-garage></div>
        <div class="qb274__vehicle-grid" data-qb274-vehicle-grid></div>
        <div data-qb274-size-feedback></div>
        <details class="qb274__advanced">
          <summary>Optional vehicle details</summary>
          <p class="mini muted" style="margin:7px 0 0">Colour, mileage, category, body style and plate help staff plan the job but are not required to move through booking.</p>
          <div class="qb274__advanced-grid" data-qb274-advanced-grid></div>
        </details>
      </div>
    `;

    const firstHeading = step1.querySelector(".step-head");
    firstHeading?.insertAdjacentElement("afterend", panel);

    qsa("[data-qb274-need]", panel).forEach((button) => {
      button.addEventListener("click", () => {
        const choice = NEEDS.find((item) => item.key === button.dataset.qb274Need);
        if (choice) applyNeed(choice, panel);
      });
    });

    const garageMount = qs("[data-qb274-garage]", panel);
    const garage = qs("#garagePickerWrap");
    if (garageMount && garage) garageMount.appendChild(garage);

    const vehicleGrid = qs("[data-qb274-vehicle-grid]", panel);
    ["veh_year", "veh_make", "veh_model", "vehicle_size"].forEach((id) => moveField(id, vehicleGrid));
    const size = qs("#vehicle_size");
    if (size?.parentElement && !size.parentElement.querySelector(".qb274__size-note")) {
      const note = document.createElement("div");
      note.className = "qb274__size-note";
      note.textContent = "Price depends on size. Rosie may fill this automatically after model selection.";
      size.parentElement.appendChild(note);
    }

    const feedback = qs("[data-qb274-size-feedback]", panel);
    ["sizeVerificationNotice", "sizeHint", "vehicleServiceHint"].forEach((id) => {
      const node = qs(`#${id}`);
      if (feedback && node) feedback.appendChild(node);
    });

    const advanced = qs("[data-qb274-advanced-grid]", panel);
    ["veh_color", "veh_mileage", "veh_category", "veh_body", "veh_plate"].forEach((id) => moveField(id, advanced));

    const legacyVehicleHeading = qsa(".step-head", step1).find((head) => /vehicle/i.test(head.querySelector("h3")?.textContent || ""));
    if (legacyVehicleHeading) legacyVehicleHeading.classList.add("qb274__legacy-vehicle-heading");

    cleanupEmptyLegacyGrids(step1);
    return panel;
  }

  function addAppointmentHeading(step1, serviceAreaGrid) {
    if (!serviceAreaGrid || qs("[data-qb274-appointment-heading]", step1)) return;
    const heading = document.createElement("div");
    heading.className = "qb274__appointment-heading";
    heading.dataset.qb274AppointmentHeading = "true";
    heading.innerHTML = `<h3>Choose where & when</h3><p class="muted">Pick your service area, then choose one of the nearest available days or open the full calendar.</p>`;
    serviceAreaGrid.insertAdjacentElement("beforebegin", heading);
  }

  function installNextAvailableDays(step1) {
    const calendar = qs("#availableDates", step1);
    if (!calendar || qs("#qb274NextDays", step1)) return;

    const wrap = document.createElement("div");
    wrap.id = "qb274NextDays";
    wrap.className = "qb274__days";
    wrap.innerHTML = `<strong>Next available days</strong><div class="mini muted">These are shortcuts into the existing live availability calendar. Choose a day, then select its available AM/PM/full-day slot.</div><div class="qb274__day-buttons"></div>`;
    calendar.insertAdjacentElement("beforebegin", wrap);

    const refresh = () => {
      const candidates = qsa(".date-pill.is-open,.date-pill.is-partial", calendar).filter((button) => !button.disabled).slice(0, 3);
      const host = qs(".qb274__day-buttons", wrap);
      if (!host) return;
      if (!candidates.length) {
        wrap.classList.remove("show");
        host.innerHTML = "";
        return;
      }
      wrap.classList.add("show");
      host.innerHTML = "";
      candidates.forEach((source) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn ghost small";
        button.innerHTML = `<strong>${esc(source.textContent.trim())}</strong>`;
        button.addEventListener("click", () => {
          source.click();
          source.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        host.appendChild(button);
      });
    };

    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(calendar, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "disabled"] });
  }

  function updateCopy(step1) {
    const h2 = step1.querySelector(".step-head h2");
    const p = step1.querySelector(".step-head p");
    if (h2) h2.textContent = "Step 1 — Tell us what you need, your vehicle, then choose a time";
    if (p) p.textContent = "Start with the result you want. Rosie keeps the detailed pricing, vehicle, availability and deposit rules underneath the simpler mobile flow.";
    const kicker = qs("#wizardTop .page-kicker");
    if (kicker) kicker.textContent = "Fast mobile booking: tell us what needs attention, choose your vehicle, then pick an available time. Rosie recommends the service and keeps condition-dependent work quote-safe.";
  }

  function init() {
    const step1 = qs('.wizard-step[data-step="1"]');
    if (!step1) return;
    injectStyles();
    updateCopy(step1);
    buildQuickPanel(step1);
    const serviceAreaGrid = qs(".service-area-grid", step1);
    addAppointmentHeading(step1, serviceAreaGrid);
    installNextAvailableDays(step1);

    const estimateMode = String(params.get("estimate") || "").toLowerCase();
    if (estimateMode === "photos") {
      const panel = qs("#build274QuickBook");
      const choice = NEEDS.find((item) => item.key === "unsure");
      if (panel && choice) applyNeed(choice, panel);
      const photo = qs("#photo_estimate_requested");
      if (photo) photo.checked = true;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
