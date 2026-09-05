// assets/site-policies.js
// Build 338: public policy copy renderer plus booking-page enhancement hooks.
(function attachRosieSitePolicies(globalScope) {
  const FALLBACK_POLICIES = {
    deposit: 'Deposits may be requested to hold a quote-led appointment. Final balance, add-ons, travel, and heavy-condition adjustments are confirmed before the appointment is finalized.',
    cancellation: 'Please contact Rosie Dazzlers as early as possible if weather, driveway access, illness, or timing changes affect the appointment.',
    refund: 'Refunds are reviewed against payment status, booking status, work already completed, and processor rules. Partial refunds may apply when appropriate.',
    driveway_access: 'Mobile detailing works best with safe driveway access, room to open doors, and clear access around the vehicle.',
    water_power: 'We can discuss water/power needs before the appointment. Municipal outdoor water-use rules may still affect exterior work timing.',
    media_privacy: 'Customer photos/videos require approval before public gallery, social, or proof-of-work use.'
  };
  const state = { loaded: false, policies: { ...FALLBACK_POLICIES } };

  async function loadPolicies() {
    if (state.loaded) return state.policies;
    state.loaded = true;
    try {
      const res = await fetch('/api/site_settings_public?key=site_policies', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      const policies = data?.settings?.site_policies?.value?.policies || data?.settings?.site_policies?.value || {};
      state.policies = { ...FALLBACK_POLICIES, ...(policies && typeof policies === 'object' ? policies : {}) };
    } catch {}
    return state.policies;
  }

  async function applyPolicies(root = document) {
    const policies = await loadPolicies();
    root.querySelectorAll('[data-policy-copy]').forEach((node) => {
      const key = String(node.getAttribute('data-policy-copy') || '').trim();
      node.textContent = policies[key] || '';
    });
    maybeInjectSummary(root, policies);
  }

  function maybeInjectSummary(root, policies) {
    const page = document.body?.dataset?.page || '';
    const shouldAutoInject = ['book', 'quote-payment', 'quote-response', 'faq'].includes(page);
    if (!shouldAutoInject || root.querySelector('[data-policy-summary-auto]')) return;
    const main = root.querySelector('main');
    if (!main) return;
    const box = document.createElement('section');
    box.className = 'section policy-summary-card';
    box.setAttribute('data-policy-summary-auto', 'true');
    box.innerHTML = `<div class="panel"><h2>Service notes before we confirm</h2><ul>
      <li>${escapeHtml(policies.deposit)}</li>
      <li>${escapeHtml(policies.driveway_access)}</li>
      <li>${escapeHtml(policies.water_power)}</li>
      <li>${escapeHtml(policies.media_privacy)}</li>
    </ul></div>`;
    main.appendChild(box);
  }

  function isBookingPage() {
    const path = String(globalScope.location?.pathname || '').replace(/\/+$/, '') || '/';
    return path === '/book';
  }

  async function wireBookingVehicleSelector() {
    if (!isBookingPage()) return;
    try {
      const module = await import('/assets/booking-vehicle-selector.js?v=20260904build333');
      module.wireBookingVehicleSelector?.(document);
    } catch {}
  }

  async function wireBookingSpecialtyCards() {
    if (!isBookingPage()) return;
    try {
      const module = await import('/assets/booking-specialty-cards.js?v=20260904build338');
      await module.wireBookingSpecialtyCards?.(document);
    } catch (error) {
      console.warn('Rich specialty-card enhancement unavailable; base booking controls remain usable.', error);
    }
  }

  function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  document.addEventListener('DOMContentLoaded', () => {
    applyPolicies(document);
    wireBookingVehicleSelector();
    wireBookingSpecialtyCards();
  });
  globalScope.RosieSitePolicies = { loadPolicies, applyPolicies, get policies() { return state.policies; } };
})(window);
