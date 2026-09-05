// Build 282 — high-intent acquisition-to-booking entry adapter.
// This layer never owns pricing, availability, checkout, deposits, add-on prices, or conflicts.
// It maps public use-case URLs onto the retained Quick Book recommendation UI and preserves staff review notes.
// Build 336 — the retained Quick Book UI now runs inside /booking-planner from the unified /book shell.
(function initBuild282UseCaseEntry() {
  const normalizedPath = String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(location.search);
  if (normalizedPath !== "/booking-planner") return;
  if (["1", "true", "yes"].includes(String(params.get("embed") || "").toLowerCase())) return;
  if (window.__ROSIE_BUILD282_USECASE_ENTRY__) return;

  const aliases = Object.freeze({
    "pre-sale": "presale",
    "lease-return": "presale",
    "lease_return": "presale",
    "spring-salt": "spring_salt",
    "spring-salt-recovery": "spring_salt",
    "fall-winter": "winter_prep",
    "fall-winter-protection": "winter_prep",
    "winter-protection": "winter_prep"
  });

  const presets = Object.freeze({
    presale: {
      buttonNeed: "presale",
      label: "Pre-Sale / Lease-Return Detail",
      startingService: "Complete Detail",
      customerNote: "Start with a complete inside/outside presentation reset, then review condition-dependent extras before final scope.",
      staffNote: "Review presentation, interior condition, paint, wheels, glass, headlights and any requested sale/return-readiness extras before final scope.",
      photoRecommended: false
    },
    spring_salt: {
      buttonNeed: "deep_interior",
      label: "Spring Salt Recovery",
      startingService: "Interior Detail",
      customerNote: "Start with the deeper interior path for winter salt, mats, carpets and lower-trim cleanup; heavy buildup remains photo/quote reviewed.",
      staffNote: "Review salt depth on mats/carpets/lower trim, repeated extraction needs, hidden moisture concerns and any under-carpet scope before final price.",
      photoRecommended: true
    },
    winter_prep: {
      buttonNeed: "paint",
      label: "Fall / Winter Protection Prep",
      startingService: "Exterior Detail",
      customerNote: "Start with exterior cleaning/decontamination and choose protection only after paint, glass and trim condition are reviewed.",
      staffNote: "Review road film/decontamination needs, paint condition, protection goal, glass/trim condition and whether any correction is needed before protection.",
      photoRecommended: true
    }
  });

  const rawNeed = String(params.get("need") || "").trim().toLowerCase();
  const key = aliases[rawNeed] || rawNeed;
  const preset = presets[key];
  if (!preset) return;
  window.__ROSIE_BUILD282_USECASE_ENTRY__ = true;

  const qs = (selector, root = document) => root.querySelector(selector);

  function appendStaffNote() {
    const notes = qs("#special_notes");
    if (!notes) return;
    const marker = `Build 282 use case: ${preset.label}.`;
    if (String(notes.value || "").includes(marker)) return;
    const line = `${marker} ${preset.staffNote}`;
    notes.value = String(notes.value || "").trim() ? `${String(notes.value).trim()}\n${line}` : line;
    notes.dispatchEvent(new Event("input", { bubbles: true }));
    notes.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function ensurePhotoReview() {
    const photoRequested = String(params.get("estimate") || "").toLowerCase() === "photos" || preset.photoRecommended === true;
    if (!photoRequested) return;
    const photo = qs("#photo_estimate_requested");
    if (photo && photo.checked !== true) {
      photo.checked = true;
      photo.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const photoFlag = qs('[data-condition-flag="photo_quote"]');
    if (photoFlag && photoFlag.checked !== true) {
      photoFlag.checked = true;
      photoFlag.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function updateCustomerConfirmation(panel) {
    const output = qs("[data-qb274-selected]", panel);
    if (!output) return;
    output.classList.add("show");
    output.innerHTML = `<strong>Use-case start:</strong> ${preset.label}<br><span>${preset.customerNote} Recommended starting service: <strong>${preset.startingService}</strong>. You can review or change it before checkout.</span>`;
  }

  let attempts = 0;
  function applyPreset() {
    attempts += 1;
    const panel = qs("#build274QuickBook");
    const button = qs(`[data-qb274-need="${preset.buttonNeed}"]`, panel || document);
    if (!panel || !button) {
      if (attempts < 100) setTimeout(applyPreset, 75);
      return;
    }

    button.click();
    panel.dataset.build282Usecase = key;
    ensurePhotoReview();
    appendStaffNote();
    updateCustomerConfirmation(panel);

    try {
      window.dispatchEvent(new CustomEvent("rd:analytics", {
        detail: {
          event: "booking_usecase_entry",
          usecase: key,
          starting_service: preset.startingService,
          photo_review: String(params.get("estimate") || "").toLowerCase() === "photos" || preset.photoRecommended === true
        }
      }));
    } catch {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyPreset, { once: true });
  else applyPreset();
})();
