// assets/booking-hours.js
// Build 191: lightweight business-hours/holiday status helper for booking-facing pages.
// Build 282: fail-open loader for high-intent use-case booking entry presets.
// Build 325: fail-open loader for booking wizard responsive/focus UX.
// Build 326: measure verified rebooking entry/prefill without storing customer or payment data.
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

  function analyticsTrack(event, detail={}){
    try { globalScope.dispatchEvent(new CustomEvent('rd:analytics', { detail:{ event, ...detail } })); } catch {}
  }

  function measureBuild326RebookPrefill(){
    if (canonicalPath() !== '/book') return;
    const params = new URLSearchParams(location.search);
    if (!["1","true","yes"].includes(String(params.get('rebook') || '').toLowerCase())) return;

    const packageCode = String(params.get('package') || '').trim();
    const vehicleSize = String(params.get('size') || '').trim().toLowerCase();
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
    if (canonicalPath() !== '/book') return;
    if (document.querySelector('script[data-build325-booking-wizard-ux]')) return;
    const script = document.createElement('script');
    script.src = '/assets/booking-wizard-responsive-v325.js';
    script.dataset.build325BookingWizardUx = 'true';
    script.onerror = () => console.warn('Optional Build 325 booking wizard UX helper could not be loaded. Standard booking remains available.');
    document.head.appendChild(script);
  }

  function loadBuild282UseCaseEntry(){
    if (canonicalPath() !== '/book') return;
    const params = new URLSearchParams(location.search);
    if (!String(params.get('need') || '').trim()) return;
    if (["1","true","yes"].includes(String(params.get('embed') || '').toLowerCase())) return;
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
