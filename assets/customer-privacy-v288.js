// Build 288: customer surfaces must never expose staff-private note controls.
// Server APIs remain authoritative; this module removes the misleading legacy UI.
(function enforceCustomerPrivacyBoundary() {
  const STAFF_PRIVATE_IDS = ['acctAdminNotes', 'vehAdminNotes'];
  for (const id of STAFF_PRIVATE_IDS) {
    const control = document.getElementById(id);
    if (!control) continue;
    control.value = '';
    control.disabled = true;
    control.setAttribute('aria-hidden', 'true');
    const label = control.closest('label');
    if (label) label.hidden = true;
  }
  document.documentElement.dataset.build288CustomerPrivacy = 'ready';
})();
