// Build 294 — customer maintenance / auto-schedule authority closure.
// Customer account surfaces may express maintenance interest, but they do not own
// staff scheduling fields or create cadence, price, discount, priority, appointment,
// subscription or recurring-billing authority.
(function initBuild294CustomerMaintenanceAuthority() {
  const normalizedPath = String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
  if (normalizedPath !== "/my-account" || window.__ROSIE_BUILD294_CUSTOMER_MAINTENANCE_AUTHORITY__) return;
  window.__ROSIE_BUILD294_CUSTOMER_MAINTENANCE_AUTHORITY__ = true;

  const STAFF_OWNED_CONTROLS = ["vehNextDue", "vehNextServiceMileage", "vehIntervalDays", "vehAutoSchedule"];

  function qs(selector, root = document) { return root.querySelector(selector); }

  function closeSchedulingControls() {
    for (const id of STAFF_OWNED_CONTROLS) {
      const control = document.getElementById(id);
      if (!control) continue;
      if (control.type === "checkbox") control.checked = false;
      else control.value = "";
      control.disabled = true;
      control.setAttribute("aria-hidden", "true");
      control.dataset.build294StaffOwned = "true";
      const label = control.closest("label");
      if (label) label.hidden = true;
    }
  }

  function renderInterestOnlyMaintenance() {
    const wrap = qs("#maintenanceConversion");
    if (!wrap) return;
    wrap.innerHTML = `
      <article class="maintenance-offer" data-build294-maintenance-interest-only>
        <div class="badge">Maintenance interest</div>
        <h3>Tell Rosie when repeat detailing may be useful</h3>
        <p class="muted">Maintenance timing is an interest preference reviewed after service context is known. Your customer account does not set a due date, service-mileage target, recurring cadence or automatic schedule.</p>
        <p class="muted">No fixed cadence, price, discount, priority, appointment, subscription or recurring billing is created here.</p>
        <div class="actions"><a class="btn ghost" href="/maintenance-plan">Open maintenance interest</a></div>
      </article>`;
  }

  function applyAuthorityBoundary() {
    closeSchedulingControls();
    renderInterestOnlyMaintenance();
    document.documentElement.dataset.build294CustomerMaintenanceAuthority = "ready";
  }

  applyAuthorityBoundary();

  // The legacy account renderer can repaint the maintenance host when the authenticated
  // dashboard finishes loading. Reapply the boundary on account-status changes only;
  // there is no timer, polling loop, write replay or background mutation.
  const notice = qs("#accountNotice");
  if (notice) {
    new MutationObserver(() => applyAuthorityBoundary()).observe(notice, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
})();
