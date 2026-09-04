// assets/booking-wizard-responsive-v325.js
// Build 325: responsive, touch, focus, validation, and status UX around the existing booking wizard.
(function attachBuild325BookingWizardUX(globalScope) {
  "use strict";

  const BUILD = "325";
  const STYLE_ID = "booking-wizard-responsive-v325-style";
  const ERROR_TARGETS = [
    [/choose a date/i, "#service_date"],
    [/closest service area|service area or town/i, "#service_area"],
    [/time slot/i, "[data-slot]:not([disabled])"],
    [/vehicle year, make, and model/i, "#veh_year"],
    [/vehicle size/i, "#vehicle_size"],
    [/main service package/i, "#packageCards button, #packageCards [role='button']"],
    [/requirements|policy acknowledgements/i, "#ack_driveway:not(:checked), #ack_power_water:not(:checked), #ack_bylaw:not(:checked), #ack_cancellation:not(:checked)"],
    [/full name/i, "#customer_name"],
    [/email address/i, "#customer_email"],
    [/service address/i, "#address_line1"],
    [/postal code/i, "#postal_code"]
  ];

  function q(selector, root = document) {
    return root.querySelector(selector);
  }

  function qa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function prefersReducedMotion() {
    return globalScope.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  }

  function motionBehavior() {
    return prefersReducedMotion() ? "auto" : "smooth";
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.dataset.build = BUILD;
    style.textContent = `
      .wizard-step{scroll-margin-top:96px}
      .wizard-step .step-head h2[tabindex="-1"]:focus{outline:none}
      .wizard-nav{align-items:stretch}
      .wizard-nav .btn{min-height:52px;flex:1 1 150px;text-align:left;justify-content:flex-start;line-height:1.2}
      .wizard-nav .btn[aria-current="step"]{box-shadow:0 0 0 2px rgba(109,168,255,.42)}
      .wizard-nav .btn[data-step-state="complete"]{border-color:rgba(36,195,107,.34)}
      .wizard-step .btn,
      .wizard-step button,
      .wizard-step input:not([type="checkbox"]):not([type="radio"]),
      .wizard-step select,
      .wizard-step textarea,
      #prevStepBtn,
      #nextStepBtn{min-height:44px}
      .wizard-step input[type="checkbox"],
      .wizard-step input[type="radio"]{min-width:22px;min-height:22px}
      #bookingStatus,
      #availabilityNote,
      .field-error{scroll-margin-top:110px}
      .wizard-step :where(button,input,select,textarea,a[href]):focus-visible,
      .wizard-nav .btn:focus-visible,
      #prevStepBtn:focus-visible,
      #nextStepBtn:focus-visible{
        outline:3px solid rgba(126,181,255,.96)!important;
        outline-offset:3px
      }
      @media (max-width:720px){
        .wizard-nav{
          display:grid!important;
          grid-auto-flow:column;
          grid-auto-columns:minmax(150px,72vw);
          gap:8px;
          overflow-x:auto;
          overscroll-behavior-inline:contain;
          scroll-snap-type:x proximity;
          padding:2px 2px 10px;
          flex-wrap:nowrap;
          scrollbar-width:thin
        }
        .wizard-nav .btn{
          width:100%;
          min-width:0;
          max-width:none;
          scroll-snap-align:start;
          white-space:normal
        }
        .mobile-toolbar{
          position:sticky;
          bottom:0;
          z-index:24;
          display:grid;
          grid-template-columns:1fr;
          gap:8px;
          margin-left:-2px;
          margin-right:-2px;
          padding:10px 2px max(10px,env(safe-area-inset-bottom));
          background:linear-gradient(180deg,rgba(13,21,38,.90),rgba(13,21,38,.99));
          border-top:1px solid rgba(255,255,255,.10);
          backdrop-filter:blur(10px)
        }
        .mobile-toolbar .row{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:8px;
          width:100%
        }
        .mobile-toolbar .btn{width:100%;min-width:0;justify-content:center}
        .service-card-grid,
        .addon-grid,
        .booking-choice-grid,
        .condition-chip-grid,
        .calendar-strip{grid-template-columns:minmax(0,1fr)!important}
        .step-head{gap:6px}
        .step-head h2{font-size:clamp(1.2rem,5.5vw,1.55rem);line-height:1.22}
        .service-card,
        .addon-card,
        .vehicle-option,
        .booking-choice-card{padding:14px}
        .wizard-step input:not([type="checkbox"]):not([type="radio"]),
        .wizard-step select,
        .wizard-step textarea{font-size:16px}
      }
      @media (max-width:480px){
        .summary-row{display:grid;grid-template-columns:minmax(0,1fr);gap:4px}
        .summary-row strong{text-align:left}
        .step-bottom-actions{display:grid;grid-template-columns:minmax(0,1fr)}
        .step-bottom-actions .btn{width:100%;justify-content:center}
        .mobile-toolbar .row{grid-template-columns:minmax(0,1fr)}
      }
    `;
    document.head.appendChild(style);
  }

  function currentStepNumber() {
    const panel = qa(".wizard-step").find((node) => !node.hidden);
    return panel ? Number(panel.dataset.step || 1) : 1;
  }

  function ensurePanelSemantics() {
    qa(".wizard-step").forEach((panel) => {
      const step = Number(panel.dataset.step || 0);
      const heading = q(".step-head h2, h2, h3", panel);
      if (!step || !heading) return;
      if (!panel.id) panel.id = `bookingStep${step}`;
      if (!heading.id) heading.id = `bookingStep${step}Heading`;
      heading.tabIndex = -1;
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", heading.id);
    });
  }

  function syncWizardNav() {
    const nav = q("#wizardNav");
    if (!nav) return;
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Booking steps");
    const current = currentStepNumber();
    qa("[data-step-nav]", nav).forEach((button) => {
      const step = Number(button.dataset.stepNav || 0);
      button.dataset.stepState = step < current ? "complete" : step === current ? "current" : "upcoming";
      if (step === current) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
      const panel = q(`.wizard-step[data-step="${step}"]`);
      if (panel?.id) button.setAttribute("aria-controls", panel.id);
    });
    const currentButton = q('[data-step-nav][aria-current="step"]', nav);
    currentButton?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
  }

  function addDescribedBy(control, id) {
    if (!control || !id) return;
    const ids = new Set(String(control.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
    ids.add(id);
    control.setAttribute("aria-describedby", Array.from(ids).join(" "));
  }

  function clearInvalidMarkers() {
    qa('[data-build325-invalid="true"]').forEach((control) => {
      control.removeAttribute("data-build325-invalid");
      control.removeAttribute("aria-invalid");
    });
  }

  function errorTarget(message) {
    for (const [pattern, selector] of ERROR_TARGETS) {
      if (pattern.test(message)) return q(selector);
    }
    return null;
  }

  let pendingErrorRecovery = false;
  function recoverValidationFocus() {
    if (pendingErrorRecovery) return;
    pendingErrorRecovery = true;
    globalScope.requestAnimationFrame(() => {
      pendingErrorRecovery = false;
      clearInvalidMarkers();
      const visiblePanel = qa(".wizard-step").find((panel) => !panel.hidden);
      const error = visiblePanel ? q(".field-error", visiblePanel) : null;
      const message = String(error?.textContent || "").trim();
      if (!error || !message) return;

      const target = errorTarget(message);
      error.setAttribute("role", "alert");
      error.setAttribute("aria-live", "assertive");
      error.setAttribute("aria-atomic", "true");
      error.tabIndex = -1;

      const focusNode = target || error;
      if (target) {
        target.dataset.build325Invalid = "true";
        target.setAttribute("aria-invalid", "true");
        if (error.id) addDescribedBy(target, error.id);
      }
      focusNode.scrollIntoView({ behavior: motionBehavior(), block: "center", inline: "nearest" });
      try {
        focusNode.focus({ preventScroll: true });
      } catch {
        focusNode.focus();
      }
    });
  }

  function syncStatusRegions() {
    const status = q("#bookingStatus");
    if (status) {
      const text = String(status.textContent || "");
      const isError = status.classList.contains("bad") || /failed|could not|unavailable|conflict|already booked|error/i.test(text);
      status.setAttribute("role", isError ? "alert" : "status");
      status.setAttribute("aria-live", isError ? "assertive" : "polite");
      status.setAttribute("aria-atomic", "true");
    }
    const availability = q("#availabilityNote");
    if (availability) {
      const text = String(availability.textContent || "");
      const isError = /failed|could not|unavailable|error/i.test(text);
      availability.setAttribute("role", isError ? "alert" : "status");
      availability.setAttribute("aria-live", isError ? "assertive" : "polite");
      availability.setAttribute("aria-atomic", "true");
    }
  }

  let lastStep = 0;
  function syncStepTransition({ allowFocus = true } = {}) {
    ensurePanelSemantics();
    syncWizardNav();
    syncStatusRegions();
    const current = currentStepNumber();
    if (!lastStep) {
      lastStep = current;
      return;
    }
    if (current === lastStep) return;
    lastStep = current;
    if (!allowFocus) return;

    const panel = q(`.wizard-step[data-step="${current}"]`);
    const heading = panel && q(".step-head h2, h2, h3", panel);
    if (!panel || !heading) return;
    globalScope.requestAnimationFrame(() => {
      panel.scrollIntoView({ behavior: motionBehavior(), block: "start", inline: "nearest" });
      try {
        heading.focus({ preventScroll: true });
      } catch {
        heading.focus();
      }
    });
  }

  function observeWizard() {
    const wizard = q("#wizardNav");
    const panels = qa(".wizard-step");
    const errors = qa(".field-error");
    const status = q("#bookingStatus");
    const availability = q("#availabilityNote");
    if (!wizard || !panels.length) return;

    const transitionObserver = new MutationObserver(() => syncStepTransition());
    transitionObserver.observe(wizard, { childList: true, subtree: true });
    panels.forEach((panel) => transitionObserver.observe(panel, { attributes: true, attributeFilter: ["hidden"] }));

    const errorObserver = new MutationObserver(() => recoverValidationFocus());
    errors.forEach((error) => {
      error.setAttribute("role", "alert");
      error.setAttribute("aria-live", "assertive");
      error.setAttribute("aria-atomic", "true");
      errorObserver.observe(error, { childList: true, characterData: true, subtree: true });
    });

    const statusObserver = new MutationObserver(() => syncStatusRegions());
    if (status) statusObserver.observe(status, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    if (availability) statusObserver.observe(availability, { childList: true, characterData: true, subtree: true });

    globalScope.addEventListener("pageshow", () => syncStepTransition({ allowFocus: false }));
  }

  function boot() {
    if (!q("#wizardNav") || !q(".wizard-step")) return;
    injectStyles();
    ensurePanelSemantics();
    syncWizardNav();
    syncStatusRegions();
    lastStep = currentStepNumber();
    observeWizard();
    document.documentElement.dataset.bookingWizardUxBuild = BUILD;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})(window);
