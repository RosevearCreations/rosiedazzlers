// assets/booking-hours.js
// Build 191: lightweight business-hours/holiday status helper for booking-facing pages.
// Build 282: fail-open loader for high-intent use-case booking entry presets.
// Build 325: fail-open loader for booking wizard responsive/focus UX.
// Build 326: measure verified rebooking entry/prefill without storing customer or payment data.
// Build 336: the proven wizard now runs at /booking-planner inside the unified /book shell.
(function attachRosieBookingHours(globalScope){
  async function loadStatus(date){
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`/api/booking_hours_status${qs}`, { cache: 'no-store' });
    return res.json();
  }

  async function render(root=document){
    const mounts = root.querySelectorAll('[data-business-hours-status]');
    if (!mounts.length) return;
    const data = await loadStatus(new Date().toISOString().slice(0,10)).catch(()=>null);
    if (!data || data.ok === false) return;
    mounts.forEach((mount)=>{ mount.textContent = data.is_closed ? `Closed/limited today: ${data.hours_label}` : `Today: ${data.hours_label}. ${data.notes || ''}`; });
  }

  function canonicalPath(){
    return String(location.pathname || '/').replace(/\.html$/i,'').replace(/\/+$/,'') || '/';
  }

  function plannerParam(name){
    const own = new URLSearchParams(location.search).get(name);
    if (own != null && String(own).trim() !== '') return String(own);
    if (canonicalPath() !== '/booking-planner' || !document.referrer) return '';
    try {
      const ref = new URL(document.referrer, location.origin);
      if (ref.origin !== location.origin) return '';
      return String(ref.searchParams.get(name) || '');
    } catch { return ''; }
  }

  function analyticsTrack(event, detail={}){
    try { globalScope.dispatchEvent(new CustomEvent('rd:analytics', { detail:{ event, ...detail } })); } catch {}
  }

  function measureBuild326RebookPrefill(){
    if (canonicalPath() !== '/booking-planner') return;
    if (!["1","true","yes"].includes(String(plannerParam('rebook') || '').toLowerCase())) return;

    const packageCode = String(plannerParam('package') || '').trim();
    const vehicleSize = String(plannerParam('size') || '').trim().toLowerCase();
    const validSize = ["small","mid","oversize"].includes(vehicleSize) ? vehicleSize : '';
    let attempts = 0;

    const check = () => {
      attempts += 1;
      const sizeApplied = !validSize || String(document.querySelector('#vehicle_size')?.value || '').toLowerCase() === validSize;
      const packageApplied = !packageCode || Array.from(document.querySelectorAll('[data-package]')).some((node) =>
        String(node.getAttribute('data-package') || '') === packageCode && node.classList.contains('active')
      );

      if (sizeApplied && packageApplied) {
        analyticsTrack('booking_rebook_prefill_applied', {
          has_package_prefill: !!packageCode,
          has_size_prefill: !!validSize
        });
        return;
      }
      if (attempts < 25) setTimeout(check, 200);
    };

    check();
  }

  function loadBuild325WizardUX(){
    if (canonicalPath() !== '/booking-planner') return;
    if (document.querySelector('script[data-build325-booking-wizard-ux]')) return;
    const script = document.createElement('script');
    script.src = '/assets/booking-wizard-responsive-v325.js';
    script.dataset.build325BookingWizardUx = 'true';
    script.onerror = () => console.warn('Optional Build 325 booking wizard UX helper could not be loaded. Standard booking remains available.');
    document.head.appendChild(script);
  }

  function loadBuild282UseCaseEntry(){
    if (canonicalPath() !== '/booking-planner') return;
    const need = String(plannerParam('need') || '').trim();
    if (!need) return;
    const params = new URLSearchParams(location.search);
    if (!params.get('need')) {
      params.set('need', need);
      const estimate = plannerParam('estimate');
      if (estimate && !params.get('estimate')) params.set('estimate', estimate);
      history.replaceState(null, '', `${location.pathname}?${params.toString()}${location.hash || ''}`);
    }
    if (["1","true","yes"].includes(String(plannerParam('embed') || '').toLowerCase())) return;
    if (document.querySelector('script[data-build282-usecase-entry]')) return;
    const script = document.createElement('script');
    script.src = '/assets/booking-usecase-entry-v282.js';
    script.defer = true;
    script.dataset.build282UsecaseEntry = 'true';
    script.onerror = () => console.warn('Optional Build 282 use-case booking preset could not be loaded. Standard booking remains available.');
    document.head.appendChild(script);
  }

  function boot(){
    render(document);
    loadBuild325WizardUX();
    loadBuild282UseCaseEntry();
    measureBuild326RebookPrefill();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{ once:true });
  else boot();

  globalScope.RosieBookingHours = { loadStatus, render };
})(window);
